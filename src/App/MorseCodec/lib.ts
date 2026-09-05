// 摩斯码表 (ITU 国际摩斯电码常用集)
// 编码规则: 字母/数字/常用标点, 单词之间用 " / " 分隔
export const MORSE_CODE_TABLE :Record<string, string> = {
  // 字母
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
  G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  // 数字
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  // 常用标点
  '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--',
  "'": '.----.', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
  '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
  '$': '...-..-', '@': '.--.-.',
};

// 反向表: 摩斯符号 -> 字符
export const MORSE_REVERSE_TABLE :Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_CODE_TABLE).map(([ ch, code ]) => [ code, ch ])
);

// 判断字符串是否为合法摩斯符号 (仅 . 与 -)
const isMorseSymbol = (s :string) :boolean => /^[.\-]+$/.test(s);

/**
 * 文本 -> 摩斯码
 * 单词之间用 " / " 分隔, 单词内字母之间用单个空格分隔
 */
export const encodeMorse = (text :string) :string => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const encodedWords = words.map((word) => {
    const letters = Array.from(word).map((ch) => {
      const code = MORSE_CODE_TABLE[ch.toUpperCase()];
      if (!code) throw new Error(`暂不支持字符: "${ch}"`);
      return code;
    });
    return letters.join(' ');
  });
  return encodedWords.join(' / ');
};

/**
 * 摩斯码 -> 文本
 * 支持以单个空格分隔字母、以 " / " 分隔单词;
 * 单词之间允许任意多个空格, 空单词会被忽略
 */
export const decodeMorse = (text :string) :string => {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  const words :string[][] = [];
  let current :string[] = [];
  for (const token of tokens) {
    if (token === '/') {
      words.push(current);
      current = [];
      continue;
    }
    if (!isMorseSymbol(token)) {
      throw new Error(`无法识别的摩斯符号: "${token}"`);
    }
    const ch = MORSE_REVERSE_TABLE[token];
    if (ch === undefined) {
      throw new Error(`未收录的摩斯符号: "${token}"`);
    }
    current.push(ch);
  }
  words.push(current);
  return words.map((w) => w.join('')).filter(Boolean).join(' ');
};

// 判断是否为可播放的摩斯码文本 (仅 . - 空格 / )
export const isMorseText = (s :string) :boolean =>
  /[.\-]/.test(s) && /^[\s.\-/]+$/.test(s);

export interface MorsePlayToken {
  text: string;   // 展示文本: 某字母的码值 (如 ...) 或单词分隔 /
  word: boolean;  // 是否为单词分隔 /
  sym: number;    // 该码值在播放序列中的序号 (非码值项为 -1)
}

export interface MorsePlaySchedule {
  tokens: MorsePlayToken[];          // 按顺序展示的码值列表
  startMs: number[];                 // 每个码值开始发声的时间 (距首个声音, 毫秒)
  totalMs: number;                   // 总时长 (毫秒)
  events: Array<{ on: boolean; ms: number }>; // 音频事件序列 (与 startMs 同源)
}

/**
 * 构建播放调度: 时间线完全基于摩斯节奏 (点=1, 划=3, 符号内间隔 1,
 * 字母间隔 3, 单词间隔 7, 单位 = dotMs 毫秒), 供音频与高亮共用, 保证同步。
 */
export const buildMorsePlaySchedule = (morse :string, dotMs :number) :MorsePlaySchedule => {
  const tokens = morse.trim().split(/\s+/).filter(Boolean);
  const events :Array<{ on: boolean; ms: number }> = [];
  const out :MorsePlayToken[] = [];
  const startMs :number[] = [];
  let cur = 0;        // 当前时间线位置 (距首个声音, ms)
  let pendingGap = 0; // 下一个声音前需要静默的长度
  let symIdx = 0;

  const flushGap = () => {
    if (pendingGap > 0) {
      events.push({ on: false, ms: pendingGap });
      cur += pendingGap;
      pendingGap = 0;
    }
  };

  for (const token of tokens) {
    if (token === '/') { // 单词间隔 7 个单位
      pendingGap = Math.max(pendingGap, dotMs * 7);
      out.push({ text: '/', word: true, sym: -1 });
      continue;
    }
    if (!isMorseSymbol(token)) { // 无法识别的杂串: 按字母间隔跳过 (常规入口已被 isMorseText 拦截)
      pendingGap = Math.max(pendingGap, dotMs * 3);
      out.push({ text: token, word: false, sym: -1 });
      continue;
    }
    flushGap();
    const syms = token.split('');
    startMs.push(cur); // 该码值第一个符号开始发声的时间
    syms.forEach((sym, j) => {
      events.push({ on: true, ms: sym === '.' ? dotMs : dotMs * 3 }); // 点 1 / 划 3
      if (j < syms.length - 1) events.push({ on: false, ms: dotMs });  // 符号内间隔 1
    });
    const charMs = syms.reduce((a, s) => a + (s === '.' ? dotMs : dotMs * 3) + dotMs, 0) - dotMs;
    cur += charMs;
    out.push({ text: token, word: false, sym: symIdx });
    symIdx++;
    pendingGap = dotMs * 3; // 字母间隔 3
  }

  return { tokens: out, startMs, totalMs: cur, events };
};

// ---------- 常用编码 (呼叫 / Q简语 / 数字祝词 / 单词简写 + 自定义) ----------
export interface MorsePhraseItem {
  text: string; // 填入文本 (如 CQ / 73 / TU), 可为字母数字标点组成的词句
  desc: string; // 含义说明
}

export interface MorsePhraseGroup {
  key: string;
  name: string;
  items: MorsePhraseItem[];
}

// 内置常用编码分组 (莫斯码由表实时编码, 保证与播放一致)
export const MORSE_PHRASE_GROUPS :MorsePhraseGroup[] = [
  {
    key: 'call', name: '呼叫 / 通用',
    items: [
      { text: 'CQ', desc: '呼叫所有电台（常发 CQ CQ CQ 广泛呼叫）' },
      { text: 'SOS', desc: '求救信号' },
      { text: 'K', desc: '请讲 / 轮到你（Over）' },
      { text: 'KN', desc: '只允许指定电台回复' },
      { text: 'AS', desc: '稍等、待命' },
      { text: 'AR', desc: '报文结束' },
      { text: 'SK', desc: '通信结束，下线' },
      { text: 'BT', desc: '分段分隔符' },
    ],
  },
  {
    key: 'q', name: '高频 Q 简语',
    items: [
      { text: 'QRZ', desc: '谁在呼叫我？' },
      { text: 'QTH', desc: '你的位置？/ 我位置是…' },
      { text: 'QSL', desc: '收到确认，知悉' },
      { text: 'QRL', desc: '频率占用、我很忙' },
      { text: 'QRM', desc: '有人为干扰' },
      { text: 'QRN', desc: '天电 / 静电噪声' },
      { text: 'QRX', desc: '请等一下，稍后呼叫' },
      { text: 'QRT', desc: '停止发报、关机' },
      { text: 'QRV', desc: '我准备好了' },
      { text: 'QSY', desc: '换频率' },
      { text: 'QSO', desc: '电台联络、通联会话' },
    ],
  },
  {
    key: 'num', name: '数字祝词',
    items: [
      { text: '73', desc: '致敬、祝顺利（最常用结束语）' },
      { text: '88', desc: '爱与祝福' },
    ],
  },
  {
    key: 'word', name: '单词简写',
    items: [
      { text: 'TU', desc: 'Thank you 谢谢' },
      { text: 'OK', desc: '好的' },
      { text: 'R', desc: 'Received = 收到' },
      { text: 'GN', desc: 'Good night 晚安' },
      { text: 'GM', desc: 'Good morning 早安' },
    ],
  },
];

// 自定义常用编码 (存储在 设置 → 其它 → 摩斯码常用编码)
export interface CustomMorsePhrase {
  id: number;
  text: string;
  desc: string;
}

const CUSTOM_KEY = 'morse-phrases';

export const listCustomMorsePhrases = () :CustomMorsePhrase[] => {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((x) => x && typeof x.text === 'string' && typeof x.desc === 'string' && typeof x.id === 'number');
  } catch {
    return [];
  }
};

export const saveCustomMorsePhrases = (list :CustomMorsePhrase[]) => {
  try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(list)); } catch { /* ignore */ }
};

export const newMorsePhraseId = () :number => Date.now();

// ---------- 导出为 WAV 音频 (离线合成, 与播放共用同一调度时间线) ----------
export interface MorseWavOptions {
  freq: number;          // 载波频率 Hz
  wave: OscillatorType;  // 波形 (sine / square / triangle / sawtooth)
  amp: number;           // 峰值幅度 0-1 (按音效预设)
  sampleRate?: number;   // 采样率, 默认 44100
}

const clampSample = (v :number) :number => Math.max(-32767, Math.min(32767, Math.round(v * 32767)));

// 按调度事件合成单声道 16bit PCM 并打包为 WAV (含 44 字节头 + 尾部静音)
export const renderMorseWav = (sched :MorsePlaySchedule, opts :MorseWavOptions) :Uint8Array => {
  const sr = opts.sampleRate ?? 44100;
  const tailMs = 120; // 结尾静音, 避免音频戛然而止
  const totalMs = Math.max(sched.totalMs, 1) + tailMs;
  const totalSamples = Math.round(totalMs * sr / 1000);
  const pcm = new Int16Array(totalSamples);

  let cursorMs = 0; // 按事件推进 (事件为 on/off 段序列)
  for (const ev of sched.events) {
    const startIdx = Math.round(cursorMs * sr / 1000);
    const endIdx = Math.round((cursorMs + ev.ms) * sr / 1000);
    if (ev.on && opts.amp > 0) {
      const dur = ev.ms / 1000;
      const attack = 0.002; // 起音 2ms 防爆音
      const release = 0.006; // 释音 6ms
      const wave = opts.wave;
      for (let i = startIdx; i < endIdx && i < totalSamples; i++) {
        const t = (i - startIdx) / sr;
        // 起音/释音包络
        const envA = Math.min(1, t / attack);
        const envR = Math.min(1, Math.max(0, (dur - t) / release));
        const env = Math.min(envA, envR) * opts.amp;
        const ph = t * opts.freq;
        let s = 0;
        if (wave === 'sine') s = Math.sin(2 * Math.PI * ph);
        else if (wave === 'square') s = (ph - Math.floor(ph)) < 0.5 ? 1 : -1;
        else if (wave === 'triangle') s = 1 - 4 * Math.abs((ph - Math.floor(ph)) - 0.5);
        else s = 2 * (ph - Math.floor(ph)) - 1; // sawtooth
        pcm[i] = clampSample(s * env);
      }
    }
    cursorMs += ev.ms;
  }

  // WAV 头 (RIFF / fmt / data)
  const dataLen = pcm.length * 2;
  const bytes = new Uint8Array(44 + dataLen);
  const view = new DataView(bytes.buffer);
  const writeStr = (off :number, s :string) => { for (let i = 0; i < s.length; i++) bytes[off + i] = s.charCodeAt(i); };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataLen, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);          // fmt 块长度
  view.setUint16(20, 1, true);           // PCM
  view.setUint16(22, 1, true);           // 单声道
  view.setUint32(24, sr, true);          // 采样率
  view.setUint32(28, sr * 2, true);      // 字节率
  view.setUint16(32, 2, true);           // 块对齐
  view.setUint16(34, 16, true);          // 位深
  writeStr(36, 'data');
  view.setUint32(40, dataLen, true);
  for (let i = 0; i < pcm.length; i++) view.setInt16(44 + i * 2, pcm[i], true);
  return bytes;
};
