// 字幕格式互转: SRT / VTT / SBV / SUB(MicroDVD) / SSA / ASS / SMI / LRC / JSON
// 内部统一模型: { start, end, text } 时间单位毫秒 (整数), text 为纯文本(换行符保留)。
// 说明: 各格式的专用样式指令 (ASS {\\pos} 覆盖块、SRT/VTT 内联 <i> 标签、MicroDVD {y:..} 等)
//       在解析时统一剥离, 仅保留文本内容与时间轴, 跨格式输出干净文本。

// ===== 类型与格式表 =====
export type SubFormat = 'srt' | 'vtt' | 'sbv' | 'sub' | 'ssa' | 'ass' | 'smi' | 'lrc' | 'json';

export interface SubCue {
  start: number; // ms
  end: number;   // ms
  text: string;  // 纯文本, 多行用 \n
}

export interface SubConvertOptions {
  fps?: number; // MicroDVD 帧率, 默认 25
}

export const SUB_FORMATS: Array<{ value: SubFormat; label: string; ext: string; sample: string }> = [
  { value: 'srt',  label: 'SRT (SubRip)',       ext: 'srt', sample: '1\n00:00:01,000 --> 00:00:03,000\n你好' },
  { value: 'vtt',  label: 'VTT (WebVTT)',       ext: 'vtt', sample: 'WEBVTT\n\n00:01.000 --> 00:03.000\n你好' },
  { value: 'sbv',  label: 'SBV (YouTube)',      ext: 'sbv', sample: '0:00:01.000,0:00:03.000\n你好' },
  { value: 'sub',  label: 'SUB (MicroDVD)',     ext: 'sub', sample: '{1}{1}25.000\n{25}{75}你好' },
  { value: 'ssa',  label: 'SSA (SubStation Alpha)',  ext: 'ssa', sample: '[Events]\nFormat: Marked, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\nDialogue: Marked=0,0:00:01.00,0:00:03.00,Default,,0,0,0,,你好' },
  { value: 'ass',  label: 'ASS (Advanced SSA)', ext: 'ass', sample: '[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\nDialogue: 0,0:00:01.00,0:00:03.00,Default,,0,0,0,,你好' },
  { value: 'smi',  label: 'SMI (SAMI)',         ext: 'smi', sample: '<SAMI><BODY><SYNC Start=1000><P>你好</P></SYNC></BODY></SAMI>' },
  { value: 'lrc',  label: 'LRC (歌词)',         ext: 'lrc', sample: '[00:01.00]你好' },
  { value: 'json', label: 'JSON',               ext: 'json', sample: '[{"start":1000,"end":3000,"text":"你好"}]' },
];

// ===== 基础工具 =====
const pad2 = (n: number) => String(Math.floor(n)).padStart(2, '0');
const pad3 = (n: number) => String(Math.floor(n)).padStart(3, '0');

/** 毫秒 -> SRT 时间 HH:MM:SS,mmm */
export const msToSrt = (ms: number) => {
  const m = Math.max(0, Math.round(ms));
  const h = Math.floor(m / 3600000);
  const i = Math.floor((m % 3600000) / 60000);
  const s = Math.floor((m % 60000) / 1000);
  return `${pad2(h)}:${pad2(i)}:${pad2(s)},${pad3(m % 1000)}`;
};

/** SRT 时间 HH:MM:SS,mmm | HH:MM:SS.mmm -> 毫秒 */
export const srtToMs = (t: string) => {
  const mm = /^(\d+):(\d{1,2}):(\d{1,2})[,.](\d{1,3})$/.exec(t.trim());
  if (!mm) throw new Error(`时间格式无法识别: ${t}`);
  return ((+mm[1]) * 3600 + (+mm[2]) * 60 + (+mm[3])) * 1000 + (+mm[4].padEnd(3, '0'));
};

/** 毫秒 -> VTT 时间 HH:MM:SS.mmm */
export const msToVtt = (ms: number) => msToSrt(ms).replace(',', '.');

/** VTT / SBV 时间 -> 毫秒 (h 可省略) */
export const dotToMs = (t: string) => {
  const mm = /^(?:(\d+):)?(\d{1,2}):(\d{1,2})[.,](\d{1,3})$/.exec(t.trim());
  if (!mm) throw new Error(`时间格式无法识别: ${t}`);
  return ((+(mm[1] || 0)) * 3600 + (+mm[2]) * 60 + (+mm[3])) * 1000 + (+mm[4].padEnd(3, '0'));
};

/** 毫秒 -> SBV 时间 H:MM:SS.mmm (小时无前导零) */
export const msToSbv = (ms: number) => {
  const s = msToSrt(ms).split(':');
  return `${+s[0]}:${s[1]}:${s[2].replace(',', '.')}`;
};

/** 毫秒 -> SSA/ASS 时间 H:MM:SS.cc (百分秒) */
export const msToCent = (ms: number) => {
  const m = Math.max(0, Math.round(ms));
  const h = Math.floor(m / 3600000);
  const i = Math.floor((m % 3600000) / 60000);
  const s = Math.floor((m % 60000) / 1000);
  const cs = String(Math.floor((m % 1000) / 10)).padStart(2, '0');
  return `${h}:${pad2(i)}:${pad2(s)}.${cs}`;
};

/** SSA/ASS 时间 -> 毫秒 (H:MM:SS.cc, 分可省略) */
export const centToMs = (t: string) => {
  const mm = /^(?:(\d+):)?(\d{1,2}):(\d{1,2})\.(\d{1,2})$/.exec(t.trim());
  if (!mm) throw new Error(`时间格式无法识别: ${t}`);
  return ((+(mm[1] || 0)) * 3600 + (+mm[2]) * 60 + (+mm[3])) * 1000 + (+mm[4].padEnd(2, '0')) * 10;
};

/** 毫秒 -> LRC 时间 mm:ss.xx (分不封顶) */
export const msToLrc = (ms: number) => {
  const m = Math.max(0, Math.round(ms));
  const i = Math.floor(m / 60000);
  const s = Math.floor((m % 60000) / 1000);
  const cs = String(Math.floor((m % 1000) / 10)).padStart(2, '0');
  return `${pad2(i)}:${pad2(s)}.${cs}`;
};

/** LRC 时间 [mm:ss.xx|mm:ss|mm:ss.xxx] -> 毫秒 (小数部分为百分秒: .5 = 0.5 秒) */
export const lrcToMs = (t: string) => {
  const mm = /^(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?$/.exec(t.trim());
  if (!mm) throw new Error(`时间格式无法识别: ${t}`);
  const frac = (mm[3] ?? '').padEnd(2, '0').slice(0, 2); // 百分秒两位
  return ((+mm[1]) * 60 + (+mm[2])) * 1000 + (+frac) * 10;
};

/** 毫秒 -> MicroDVD 帧号 */
export const msToFrame = (ms: number, fps: number) => Math.round((ms / 1000) * fps);

/** 文本清洗: 统一换行、去 BOM */
const normalizeText = (s: string) => s.replace(/^\uFEFF/u, '').replace(/\r\n?/gu, '\n');

/** 剥离 html 标签 (SRT/VTT/SMI 的 <..>), 保留换行语义 */
const stripTags = (s: string) => s.replace(/<[^>]*>/gu, '');

const htmlEscape = (s: string) => s
  .replace(/&/gu, '&amp;')
  .replace(/</gu, '&lt;')
  .replace(/>/gu, '&gt;');

/** 剥离字符串两侧空白行 */
const trimBlankLines = (arr: string[]) => {
  const out = [...arr];
  while (out.length && out[0].trim() === '') out.shift();
  while (out.length && out[out.length - 1].trim() === '') out.pop();
  return out;
};

/** 各格式通用文本收尾: 去行尾空白, 去空尾行, 去零宽字符 */
const cleanCueText = (s: string) => {
  const lines = normalizeText(s).split('\n').map((l) => l.replace(/\s+$/u, ''));
  return trimBlankLines(lines).join('\n');
};

// ===== SRT =====
const parseSrt = (input: string): SubCue[] => {
  const text = normalizeText(input).replace(/\n{3,}/gu, '\n\n');
  const blocks = text.split(/\n{2,}/u);
  const cues: SubCue[] = [];
  for (const block of blocks) {
    const lines = trimBlankLines(block.split('\n'));
    if (lines.length === 0) continue;
    // 跳过纯序号/无时间行块
    const timeIdx = lines.findIndex((l) => l.includes('-->'));
    if (timeIdx < 0) continue;
    const tm = /^(\S+)\s*-->\s*(\S+)/.exec(lines[timeIdx]);
    if (!tm) continue;
    const cueText = cleanCueText(stripTags(lines.slice(timeIdx + 1).join('\n')));
    // 首行若为纯数字序号忽略
    let startRaw = tm[1], endRaw = tm[2];
    if (timeIdx > 0 && /^\d+$/u.test(lines[0].trim())) { /* 序号行忽略 */ }
    cues.push({ start: srtToMs(startRaw), end: srtToMs(endRaw), text: cueText });
  }
  return cues;
};

const toSrt = (cues: SubCue[]): string =>
  cues.map((c, i) => `${i + 1}\n${msToSrt(c.start)} --> ${msToSrt(c.end)}\n${c.text}`).join('\n\n') + '\n';

// ===== VTT =====
const parseVtt = (input: string): SubCue[] => {
  const text = normalizeText(input);
  if (!/^WEBVTT/u.test(text.trim())) throw new Error('不是有效的 WebVTT 文件 (缺少 WEBVTT 头)');
  const lines = text.split('\n');
  const cues: SubCue[] = [];
  let i = 0;
  // 跳过头部区 (含 NOTE/STYLE/REGION 块与其内容)
  const skipBlock = () => { while (i < lines.length && lines[i].trim() !== '') i++; };
  while (i < lines.length) {
    const l = lines[i].trim();
    if (l === '') { i++; continue; }
    if (/^(NOTE|STYLE|REGION)\b/u.test(l)) { skipBlock(); i++; continue; }
    if (l.includes('-->')) {
      const tm = /^(\S+)\s*-->\s*(\S+)/.exec(l);
      if (tm) {
        const start = i + 1;
        let end = start;
        while (end < lines.length && lines[end].trim() !== '') end++;
        cues.push({ start: dotToMs(tm[1]), end: dotToMs(tm[2]), text: cleanCueText(stripTags(lines.slice(start, end).join('\n'))) });
        i = end;
        continue;
      }
    }
    // 其它行 (cue id 等) 忽略
    i++;
  }
  return cues;
};

const toVtt = (cues: SubCue[]): string =>
  'WEBVTT\n\n' + cues.map((c) => `${msToVtt(c.start)} --> ${msToVtt(c.end)}\n${c.text}`).join('\n\n') + '\n';

// ===== SBV (YouTube) =====
const parseSbv = (input: string): SubCue[] => {
  const text = normalizeText(input);
  const blocks = text.split(/\n{2,}/u);
  const cues: SubCue[] = [];
  for (const block of blocks) {
    const lines = trimBlankLines(block.split('\n'));
    if (lines.length === 0) continue;
    const tm = /^(\S+)\s*,\s*(\S+)/.exec(lines[0]);
    if (!tm) continue;
    cues.push({
      start: dotToMs(tm[1]),
      end: dotToMs(tm[2]),
      text: cleanCueText(stripTags(lines.slice(1).join('\n'))),
    });
  }
  return cues;
};

const toSbv = (cues: SubCue[]): string =>
  cues.map((c) => `${msToSbv(c.start)},${msToSbv(c.end)}\n${c.text}`).join('\n\n') + '\n';

// ===== SUB (MicroDVD) =====
const parseSub = (input: string, fps = 25): SubCue[] => {
  const text = normalizeText(input);
  const lines = text.split('\n');
  const cues: SubCue[] = [];
  let effFps = fps;
  let first = true;
  for (const raw of lines) {
    const l = raw.trim();
    if (l === '') continue;
    const m = /^\{(\d+)\}\{(\d+)\}([\s\S]*)$/u.exec(l);
    if (!m) continue;
    if (first) {
      first = false;
      // 首行两个帧号相等且后面是数字 -> fps 声明
      if (+m[1] === +m[2] && /^\d+(\.\d+)?$/u.test(m[3].trim())) {
        const f = parseFloat(m[3]);
        if (f > 0) effFps = f;
        continue;
      }
    }
    let body = m[3];
    body = body.replace(/\{[^}]*\}/gu, ''); // 剥 {y:..} 等样式
    cues.push({
      start: Math.round((+m[1] / effFps) * 1000),
      end: Math.round((+m[2] / effFps) * 1000),
      text: cleanCueText(body.replace(/\|/gu, '\n')),
    });
  }
  return cues;
};

const toSub = (cues: SubCue[], fps = 25): string => {
  const head = `{1}{1}${fps.toFixed(3)}\n`;
  const body = cues.map((c) => `{${msToFrame(c.start, fps)}}{${msToFrame(c.end, fps)}}${c.text.replace(/\n/gu, '|')}`).join('\n');
  return head + body + '\n';
};

// ===== SSA / ASS =====
const parseSsaAss = (input: string, isAss: boolean): SubCue[] => {
  const text = normalizeText(input);
  const lines = text.split('\n');
  let inEvents = false;
  let fields: string[] = [];
  const cues: SubCue[] = [];
  for (const raw of lines) {
    const l = raw.trim();
    if (/^\[Events\]/iu.test(l)) { inEvents = true; fields = []; continue; }
    if (/^\[/u.test(l)) { inEvents = false; continue; }
    if (!inEvents) continue;
    const fmt = /^Format:\s*(.*)$/iu.exec(l);
    if (fmt) { fields = fmt[1].split(',').map((s) => s.trim().toLowerCase()); continue; }
    const dlg = /^Dialogue:\s*(.*)$/iu.exec(l);
    if (!dlg) continue;
    // 文本字段可能含逗号: 按 Format 列数拆分, 前 N-1 字段各占一列, 余下全部属于 Text
    const parts = dlg[1].split(',');
    const nameToIdx = (n: string) => fields.indexOf(n);
    const startIdx = nameToIdx(isAss ? 'start' : 'start');
    const endIdx = nameToIdx('end');
    const textIdx = nameToIdx('text');
    if (startIdx < 0 || endIdx < 0 || textIdx < 0) continue;
    const get = (idx: number) => (idx < parts.length ? parts[idx].trim() : '');
    if (textIdx < fields.length - 1 || parts.length < fields.length) continue; // 缺列保护
    const textRaw = parts.slice(textIdx).join(',');
    let cueText = textRaw.replace(/\\N/gu, '\n').replace(/\\n/gu, '\n').replace(/\\,/gu, ',');
    cueText = cueText.replace(/\{[^}]*\}/gu, ''); // 剥覆盖块
    // ASS 中文本字段可含 {..} 之前的前导字段名?, 直接取
    const start = centToMs(get(startIdx));
    const end = centToMs(get(endIdx));
    cues.push({ start, end, text: cleanCueText(cueText) });
  }
  return cues;
};

const assHeader = (isAss: boolean) => isAss
  ? '[Script Info]\nScriptType: v4.00+\nCollisions: Normal\nPlayResX: 1280\nPlayResY: 720\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Arial,22,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,1,2,10,10,10,1\n\n'
  : '[Script Info]\nTitle: 字幕格式转换\nScriptType: v4.00\nCollisions: Normal\nPlayResX: 1280\nPlayResY: 720\n\n[V4 Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, TertiaryColour, BackColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, AlphaLevel, Encoding\nStyle: Default,Arial,22,16777215,16777215,16777215,0,0,0,1,2,2,2,10,10,10,0,0\n\n';

const toSsaAss = (cues: SubCue[], isAss: boolean): string => {
  const head = assHeader(isAss);
  const evHead = isAss
    ? '[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n'
    : '[Events]\nFormat: Marked, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n';
  const body = cues.map((c) => {
    const txt = c.text.replace(/\n/gu, '\\N').replace(/,/gu, '\\,');
    const prefix = isAss ? '0' : 'Marked=0';
    return `Dialogue: ${prefix},${msToCent(c.start)},${msToCent(c.end)},Default,,0,0,0,,${txt}`;
  }).join('\n');
  return head + evHead + body + '\n';
};

// ===== SMI (SAMI) =====
const parseSmi = (input: string): SubCue[] => {
  const text = normalizeText(input);
  if (!/<\s*SAMI\b/iu.test(text)) throw new Error('不是有效的 SAMI 文件');
  const cues: SubCue[] = [];
  const syncRe = /<\s*SYNC\s+Start\s*=\s*(\d+)\s*>/giu;
  let m: RegExpExecArray | null;
  const starts: number[] = [];
  const texts: string[] = [];
  while ((m = syncRe.exec(text)) !== null) {
    starts.push(+m[1]);
    const contentStart = m.index + m[0].length;
    // 到下一个 SYNC 或 </BODY> 结束
    const nextSync = text.slice(contentStart).search(/<\s*SYNC\b/iu);
    const bodyEnd = text.slice(contentStart).search(/<\/\s*BODY\s*>/iu);
    const cand: number[] = [];
    if (nextSync >= 0) cand.push(contentStart + nextSync);
    if (bodyEnd >= 0) cand.push(contentStart + bodyEnd);
    const contentEnd = cand.length ? Math.min(...cand) : text.length;
    let frag = text.slice(contentStart, contentEnd);
    frag = frag.replace(/<\/?P[^>]*>/giu, '').replace(/<\s*br\s*\/?>/giu, '\n');
    frag = frag.replace(/<\s*\/?SYNC[^>]*>/giu, '');
    frag = frag.replace(/&nbsp;/giu, ' ').replace(/&amp;/giu, '&').replace(/&lt;/giu, '<').replace(/&gt;/giu, '>').replace(/&quot;/giu, '"');
    texts.push(frag);
  }
  for (let i = 0; i < starts.length; i++) {
    let end = starts[i] + 4000;
    for (let j = 0; j < starts.length; j++) {
      if (j !== i && starts[j] > starts[i] && starts[j] < end) end = starts[j];
    }
    cues.push({ start: starts[i], end, text: cleanCueText(texts[i]) });
  }
  return cues;
};

const smiHead = '<SAMI>\n<HEAD>\n<TITLE>字幕格式转换</TITLE>\n<STYLE TYPE="text/css">\n<!--\nP { margin-left: 2pt; margin-right: 2pt; margin-bottom: 2pt; margin-top: 2pt; text-align: center; font-size: 18pt; font-family: Arial; font-weight: bold; color: white; background-color: black; }\n.UNCNCC { text-align: center; }\n-->\n</STYLE>\n</HEAD>\n<BODY>\n';
const smiFoot = '</BODY>\n</SAMI>\n';

const toSmi = (cues: SubCue[]): string => {
  const body = cues.map((c) => {
    const txt = htmlEscape(c.text).replace(/\n/gu, '<br>');
    return `<SYNC Start=${Math.max(0, Math.round(c.start))}><P Class=UNCNCC>${txt}</P></SYNC>`;
  }).join('\n');
  return smiHead + body + '\n' + smiFoot;
};

// ===== LRC =====
const parseLrc = (input: string): SubCue[] => {
  const text = normalizeText(input);
  const lines = text.split('\n');
  const tagged: Array<{ t: number; text: string }> = [];
  for (const raw of lines) {
    const l = raw.trim();
    if (l === '') continue;
    if (/^\[(ar|ti|al|by|offset|length|re|ve|au)\s*:/iu.test(l)) continue; // meta
    const tags = [...l.matchAll(/\[(\d{1,3}:\d{1,2}(?:[.:]\d{1,3})?)\]/gu)];
    if (tags.length === 0) continue;
    const content = l.replace(/\[[^\]]*\]/gu, '').trim();
    for (const tg of tags) tagged.push({ t: lrcToMs(tg[1]), text: content });
  }
  tagged.sort((a, b) => a.t - b.t);
  const cues: SubCue[] = [];
  for (let i = 0; i < tagged.length; i++) {
    const next = tagged[i + 1];
    cues.push({ start: tagged[i].t, end: next ? next.t : tagged[i].t + 5000, text: cleanCueText(tagged[i].text) });
  }
  return cues;
};

const toLrc = (cues: SubCue[]): string =>
  cues.map((c) => `[${msToLrc(c.start)}]${c.text.replace(/\n/gu, ' ')}`).join('\n') + '\n';

// ===== JSON =====
const parseJson = (input: string): SubCue[] => {
  const raw = input.trim();
  let data: unknown = null;
  try { data = JSON.parse(raw); } catch { throw new Error('不是有效的 JSON'); }
  if (!Array.isArray(data)) {
    // 兼容 { cues: [...] } 包裹
    if (data && typeof data === 'object' && Array.isArray((data as { cues?: unknown }).cues)) {
      data = (data as { cues: unknown }).cues;
    } else {
      throw new Error('JSON 顶层需为数组: [{"start":ms,"end":ms,"text":"..."}] (毫秒)');
    }
  }
  if (!Array.isArray(data)) throw new Error('JSON 顶层需为数组 (毫秒)');
  return data.map((item, idx) => {
    if (!item || typeof item !== 'object') throw new Error(`JSON 第 ${idx + 1} 项不是对象`);
    const o = item as Record<string, unknown>;
    const num = (v: unknown): number | null => {
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(+v)) return +v;
      return null;
    };
    const start = num(o.start) ?? num(o.startTime) ?? num(o.from);
    const end = num(o.end) ?? num(o.endTime) ?? num(o.to);
    const text = o.text ?? o.content ?? o.line ?? '';
    if (start === null || end === null) throw new Error(`JSON 第 ${idx + 1} 项缺 start/end 时间 (毫秒)`);
    return { start: Math.round(start), end: Math.round(end), text: cleanCueText(String(text)) };
  });
};

const toJson = (cues: SubCue[]): string =>
  JSON.stringify(cues.map((c) => ({ start: Math.round(c.start), end: Math.round(c.end), text: c.text })), null, 2) + '\n';

// ===== 入口 =====
export const parseSubtitle = (input: string, format: SubFormat, opts: SubConvertOptions = {}): SubCue[] => {
  const text = normalizeText(input);
  switch (format) {
    case 'srt': return parseSrt(text);
    case 'vtt': return parseVtt(text);
    case 'sbv': return parseSbv(text);
    case 'sub': return parseSub(text, opts.fps ?? 25);
    case 'ssa': return parseSsaAss(text, false);
    case 'ass': return parseSsaAss(text, true);
    case 'smi': return parseSmi(text);
    case 'lrc': return parseLrc(text);
    case 'json': return parseJson(text);
  }
};

export const toSubtitle = (cues: SubCue[], format: SubFormat, opts: SubConvertOptions = {}): string => {
  switch (format) {
    case 'srt': return toSrt(cues);
    case 'vtt': return toVtt(cues);
    case 'sbv': return toSbv(cues);
    case 'sub': return toSub(cues, opts.fps ?? 25);
    case 'ssa': return toSsaAss(cues, false);
    case 'ass': return toSsaAss(cues, true);
    case 'smi': return toSmi(cues);
    case 'lrc': return toLrc(cues);
    case 'json': return toJson(cues);
  }
};

/** 从文本内容猜测字幕格式 (null 表示无法识别) */
export const detectSubtitleFormat = (input: string): SubFormat | null => {
  const text = normalizeText(input).trim();
  if (text === '') return null;
  // JSON
  if ((text.startsWith('[') || text.startsWith('{')) && (() => { try { JSON.parse(text); return true; } catch { return false; } })()) return 'json';
  // VTT
  if (/^WEBVTT/u.test(text)) return 'vtt';
  // SSA / ASS
  if (/\[Script Info\]/iu.test(text)) {
    if (/v4\.00\+/iu.test(text) || /\[V4\+\s*Styles\]/iu.test(text)) return 'ass';
    if (/v4\.00/iu.test(text) || /\[V4\s*Styles\]/iu.test(text)) return 'ssa';
  }
  // SAMI
  if (/<\s*SAMI\b/iu.test(text)) return 'smi';
  // MicroDVD
  if (/^\{(?:-?\d+)\}\{(?:-?\d+)\}/u.test(text.split('\n').filter((l) => l.trim() !== '')[0] || '')) return 'sub';
  // LRC (行首 [mm:ss] 标签)
  if (/^\[\d{1,3}:\d{1,2}(?:[.:]\d{1,3})?\]/u.test(text.split('\n').filter((l) => l.trim() !== '')[0] || '')) return 'lrc';
  // 时间轴行
  for (const line of text.split('\n').slice(0, 40)) {
    const tl = line.trim();
    if (tl.includes('-->')) {
      // SBV 用逗号分隔, SRT 用 -->; 此处含 --> 即为 SRT/VTT, 若出现 WEBVTT 已在前面
      return tl.includes(',') && !/^\d{1,2}:\d{2}:\d{2}[,.]\d{3}\s*-->/u.test(tl) ? 'sbv' : 'srt';
    }
    const sbv = /^(?:\d+:)?\d{1,2}:\d{2}\.\d{1,3}\s*,\s*(?:\d+:)?\d{1,2}:\d{2}\.\d{1,3}/u.exec(tl);
    if (sbv && !tl.includes('-->')) return 'sbv';
  }
  return null;
};

/** 毫秒 -> 友好时长文本 (用于统计展示) */
export const fmtDuration = (ms: number) => {
  const m = Math.max(0, Math.round(ms));
  const h = Math.floor(m / 3600000);
  const i = Math.floor((m % 3600000) / 60000);
  const s = Math.floor((m % 60000) / 1000);
  const msr = m % 1000;
  if (h > 0) return `${h} 小时 ${i} 分 ${s} 秒`;
  if (i > 0) return `${i} 分 ${s} 秒`;
  return `${s} 秒 ${pad3(msr)} 毫秒`;
};

export const DEFAULT_FPS = 25;
