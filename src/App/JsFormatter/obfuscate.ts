/**
 * JS 混淆加密 / 解密还原 (纯字符串处理, 还原过程不依赖 eval)
 */

import { tokenizeJs, significantAt, type JsToken } from './tokenize';

/* ------------------------------------------------------------------ *
 * 字符串字面量工具
 * ------------------------------------------------------------------ */

/** 解析一段 JS 字符串字面量 (支持 \xNN \uNNNN \u{...} \\ \' 等), 失败返回 null */
export function parseStringLiteral(text: string, start = 0): { value: string; end: number } | null {
  const quote = text[start];
  if (quote !== '\'' && quote !== '"') return null;
  let value = '';
  let i = start + 1;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\\') {
      const nx = text[i + 1];
      if (nx === undefined) return null;
      if (nx === 'x') {
        const hex = text.slice(i + 2, i + 4);
        if (!/^[0-9a-fA-F]{2}$/.test(hex)) return null;
        value += String.fromCharCode(parseInt(hex, 16));
        i += 4;
      } else if (nx === 'u') {
        if (text[i + 2] === '{') {
          const close = text.indexOf('}', i + 3);
          if (close < 0) return null;
          const hex = text.slice(i + 3, close);
          if (!/^[0-9a-fA-F]+$/.test(hex)) return null;
          value += String.fromCodePoint(parseInt(hex, 16));
          i = close + 1;
        } else {
          const hex = text.slice(i + 2, i + 6);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) return null;
          value += String.fromCharCode(parseInt(hex, 16));
          i += 6;
        }
      } else if (nx === 'n') { value += '\n'; i += 2; } else if (nx === 'r') { value += '\r'; i += 2; } else if (nx === 't') { value += '\t'; i += 2; } else if (nx === 'b') { value += '\b'; i += 2; } else if (nx === 'f') { value += '\f'; i += 2; } else if (nx === 'v') { value += '\v'; i += 2; } else if (nx === '0') { value += '\0'; i += 2; } else if (nx === '\n') { i += 2; } else if (nx === '\r') { i += text[i + 2] === '\n' ? 3 : 2; } else { value += nx; i += 2; }
      continue;
    }
    if (ch === quote) return { value, end: i + 1 };
    if (ch === '\n') return null;
    value += ch;
    i += 1;
  }
  return null;
}

/** 把字符串内容转成 JS 字符串字面量 (最小转义) */
export function quoteJsString(value: string, quote = '\''): string {
  const body = value.replace(/[\u0000-\u001f\u2028\u2029\\]/g, (c) => {
    if (c === '\\') return '\\\\';
    if (c === '\n') return '\\n';
    if (c === '\r') return '\\r';
    if (c === '\t') return '\\t';
    return `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`;
  }).split(quote).join(`\\${quote}`);
  return quote + body + quote;
}

/** 逐字符转义 (\xNN / \uNNNN), 用于混淆 */
function escapeLiteralBody(value: string, unicodeOnly: boolean): string {
  let out = '';
  for (const ch of value) {
    const cp = ch.codePointAt(0) ?? 0;
    if (ch === '\\') out += '\\\\';
    else if (ch === '\'') out += '\\\'';
    else if (ch === '"') out += '\\"';
    else if (unicodeOnly && cp === 0x0a) out += '\\n';
    else if (unicodeOnly && cp === 0x0d) out += '\\r';
    else if (unicodeOnly && cp === 0x09) out += '\\t';
    else if (unicodeOnly && cp >= 0x20 && cp <= 0x7e) out += ch;
    else if (cp <= 0xff) out += `\\x${cp.toString(16).padStart(2, '0')}`;
    else if (cp <= 0xffff) out += `\\u${cp.toString(16).padStart(4, '0')}`;
    else out += `\\u{${cp.toString(16)}}`;
  }
  return out;
}

const isDirective = (toks: JsToken[], i: number): boolean => {
  const value = parseStringLiteral(toks[i].value)?.value;
  if (value !== 'use strict') return false;
  const prev = significantAt(toks, i - 1, -1);
  return !prev || prev.value === '{' || prev.value === ';';
};

/**
 * 字符串转义加密
 * mode = 'escape': 每个字符都转成 \xNN / \uNNNN
 * mode = 'unicode': 仅转义非 ASCII 字符
 * 只处理单/双引号字符串 (模板字符串与注释保持原样, 避免改变语义)
 */
export function escapeJsStrings(code: string, mode: 'escape' | 'unicode' = 'escape'): string {
  const toks = tokenizeJs(code);
  let out = '';
  let cursor = 0;
  toks.forEach((t, i) => {
    if (t.type !== 'string' || isDirective(toks, i)) return;
    const quote = t.value[0];
    const lit = parseStringLiteral(t.value);
    if (!lit || lit.end !== t.value.length) return;
    out += code.slice(cursor, t.start) + quote + escapeLiteralBody(lit.value, mode === 'unicode') + quote;
    cursor = t.end;
  });
  return out + code.slice(cursor);
}

/** 还原字符串中的 \xNN / \uNNNN / \u{...} 转义 (escapeJsStrings 的逆操作) */
export function decodeEscapes(code: string): string {
  const toks = tokenizeJs(code);
  let out = '';
  let cursor = 0;
  toks.forEach((t) => {
    if (t.type !== 'string') return;
    const quote = t.value[0];
    const lit = parseStringLiteral(t.value);
    if (!lit || lit.end !== t.value.length) return;
    const rebuilt = quoteJsString(lit.value, quote);
    if (rebuilt === t.value) return;
    out += code.slice(cursor, t.start) + rebuilt;
    cursor = t.end;
  });
  return out + code.slice(cursor);
}

/* ------------------------------------------------------------------ *
 * 词表打包混淆 (加密)
 * ------------------------------------------------------------------ */

const WORD_RUN = /[A-Za-z0-9_$]+/g;

/** 非 ASCII / 控制字符 / 引号转义, 让打包结果更「乱」 (单次替换, 避免二次转义反斜杠) */
const escapeNonAscii = (value: string): string => value.replace(/[^\u0020-\u007e]|[\\']/g, (c) => {
  if (c === '\\') return '\\\\';
  if (c === '\'') return '\\\'';
  const cp = c.charCodeAt(0);
  return cp <= 0xff ? `\\x${cp.toString(16).padStart(2, '0')}` : `\\u${cp.toString(16).padStart(4, '0')}`;
});

/**
 * 词表打包混淆: 把源码里所有「单词」(标识符/数字/字符串内的词) 换成数字编号,
 * 词表以 | 分隔放在末尾。输出可直接运行: eval(function(m,d){...}('payload','dict'))
 */
export function packJs(code: string): string {
  const dict: string[] = [];
  const index = new Map<string, number>();
  const payload = code.replace(WORD_RUN, (w) => {
    let at = index.get(w);
    if (at === undefined) {
      at = dict.length;
      index.set(w, at);
      dict.push(w);
    }
    return String(at);
  });
  const body = `function(m,d){d='${escapeNonAscii(dict.join('|'))}'.split('|');return m.replace(/\\d+/g,function(x){return d[+x]})}`;
  return `eval(${body}('${escapeNonAscii(payload)}'))`;
}

/* ------------------------------------------------------------------ *
 * 解密还原 (纯字符串解析, 不执行任何代码)
 * ------------------------------------------------------------------ */

export type UnpackKind = 'packer' | 'classic-packer' | 'eval' | 'escape';

export interface UnpackResult {
  code: string;
  kinds: UnpackKind[];
}

/** 从 openIdx 处的 '{' / '(' / '[' 起, 找到配对的闭合位置 (跳过字符串/模板/注释), 失败返回 -1 */
export function matchBracket(text: string, openIdx: number): number {
  const open = text[openIdx];
  const close = open === '{' ? '}' : open === '(' ? ')' : ']';
  let depth = 0;
  let i = openIdx;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\'' || ch === '"') {
      const lit = parseStringLiteral(text, i);
      if (!lit) return -1;
      i = lit.end;
      continue;
    }
    if (ch === '`') {
      i = skipTemplate(text, i);
      if (i < 0) return -1;
      continue;
    }
    if (ch === '/' && text[i + 1] === '/') {
      const nl = text.indexOf('\n', i);
      if (nl < 0) return -1;
      i = nl;
      continue;
    }
    if (ch === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i);
      if (end < 0) return -1;
      i = end + 2;
      continue;
    }
    if (ch === open) depth += 1;
    else if (ch === close) {
      depth -= 1;
      if (depth === 0) return i;
    }
    i += 1;
  }
  return -1;
}

/** 跳过模板字符串 (含 ${} 嵌套), 返回结束后一位下标 */
function skipTemplate(text: string, start: number): number {
  let i = start + 1;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\\') { i += 2; continue; }
    if (ch === '`') return i + 1;
    if (ch === '$' && text[i + 1] === '{') {
      const close = matchBracket(text, i + 1);
      if (close < 0) return -1;
      i = close + 1;
      continue;
    }
    i += 1;
  }
  return -1;
}

/** 取得 openIdx 处 '(' 起、括号配平的实参原文列表 */
export function extractCallArgs(text: string, openIdx: number): string[] | null {
  if (text[openIdx] !== '(') return null;
  const args: string[] = [];
  let start = openIdx + 1;
  let i = openIdx + 1;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\'' || ch === '"') {
      const lit = parseStringLiteral(text, i);
      if (!lit) return null;
      i = lit.end;
      continue;
    }
    if (ch === '`') {
      i = skipTemplate(text, i);
      if (i < 0) return null;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') {
      const close = matchBracket(text, i);
      if (close < 0) return null;
      i = close + 1;
      continue;
    }
    if (ch === ')') { args.push(text.slice(start, i).trim()); return args; }
    if (ch === ',') { args.push(text.slice(start, i).trim()); start = i + 1; }
    i += 1;
  }
  return null;
}

/** 从 bodyStart 起找到函数体 '{...}' 之后真正被调用的实参列表 */
const callArgsOf = (text: string, bodyStart: number): string[] | null => {
  const open = text.indexOf('{', bodyStart);
  if (open < 0) return null;
  const close = matchBracket(text, open);
  if (close < 0) return null;
  let i = close + 1;
  while (i < text.length && /\s/.test(text[i])) i += 1;
  if (text[i] !== '(') return null;
  return extractCallArgs(text, i);
};

/** 实参 -> 字符串 (需为完整字符串字面量) */
const argString = (arg: string): string | null => {
  const lit = parseStringLiteral(arg);
  return lit && lit.end === arg.length ? lit.value : null;
};

/** 实参 -> 词表数组 ('a|b|c'.split('|') 或纯字符串) */
const argWords = (arg: string): string[] | null => {
  const m = arg.match(/^(['"])((?:\\.|[\s\S])*?)\1\s*\.\s*split\s*\(\s*(['"])([\s\S]*?)\3\s*\)$/);
  if (m) {
    const lit = parseStringLiteral(m[0], 0);
    if (!lit) return null;
    return m[4] === '' ? [ lit.value ] : lit.value.split(m[4]);
  }
  const lit = parseStringLiteral(arg);
  return lit && lit.end === arg.length ? [ lit.value ] : null;
};

const percentDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value.replace(/%([0-9a-fA-F]{2})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)));
  }
};

/** 本工具 packJs 的签名 */
const OURS_FN = /function\s*\(\s*m\s*,\s*d\s*\)/;
const OURS_MARK = /m\s*\.\s*replace\s*\(\s*\/\\d\+\/g/;
const OURS_DICT = /d\s*=\s*(['"])((?:\\.|[\s\S])*?)\1\s*\.\s*split\s*\(\s*(['"])([\s\S]*?)\3\s*\)/;

function unpackOurs(text: string): string | null {
  if (!OURS_MARK.test(text)) return null;
  const fn = OURS_FN.exec(text);
  if (!fn) return null;
  const dm = text.match(OURS_DICT);
  if (!dm) return null;
  const dictLit = parseStringLiteral(dm[0], dm[0].indexOf(dm[1]));
  if (!dictLit) return null;
  const words = dm[4] === '' ? [ dictLit.value ] : dictLit.value.split(dm[4]);
  const args = callArgsOf(text, fn.index + fn[0].length);
  if (!args || args.length === 0) return null;
  const payload = argString(args[0]);
  if (payload === null) return null;
  return payload.replace(/\d+/g, (x) => words[Number(x)] ?? '');
}

/** 经典 eval packer (Dean Edwards) 签名 */
const CLASSIC_SIG = /function\s*\(\s*p\s*,\s*a\s*,\s*c\s*,\s*k\s*,\s*e\s*,\s*d\s*\)/;

function unpackClassic(text: string): string | null {
  const sig = CLASSIC_SIG.exec(text);
  if (!sig) return null;
  const args = callArgsOf(text, sig.index + sig[0].length);
  if (!args || args.length < 4) return null;
  const payload = argString(args[0]);
  const base = Number(args[1]);
  const count = Number(args[2]);
  const words = argWords(args[3]);
  if (payload === null || !Number.isFinite(base) || base < 2 || !Number.isFinite(count) || !words) return null;
  const withUnescape = text.slice(0, sig.index).includes('unescape');
  const enc = (n: number): string => (n < base ? '' : enc(Math.floor(n / base)))
    + (n % base > 35 ? String.fromCharCode((n % base) + 29) : (n % base).toString(36));
  const map = new Map<string, string>();
  for (let i = 0; i < count; i += 1) {
    const key = enc(i);
    const raw = words[i];
    map.set(key, raw === undefined ? key : (withUnescape ? percentDecode(raw) : raw));
  }
  return payload.replace(/\w+/g, (m) => map.get(m) ?? m);
}

const EVAL_WRAP = /^(?:eval|window\.eval|globalThis\.eval|Function|new\s+Function)\s*\(\s*/;

/** 去掉 eval("...") / Function("...") 外层包裹 (支持普通的无插值模板字符串) */
function unwrapEval(text: string): string | null {
  const m = text.match(EVAL_WRAP);
  if (!m) return null;
  const start = m[0].length;
  if (text[start] === '`') {
    const close = skipTemplate(text, start);
    if (close < 0) return null;
    const literal = text.slice(start, close);
    if (literal.includes('${')) return null;
    if (text.slice(close).trim().replace(/^\)\s*;?$/, '') !== '') return null;
    return decodeEscapes(literal).slice(1, -1);
  }
  const lit = parseStringLiteral(text, start);
  if (!lit) return null;
  if (text.slice(lit.end).trim().replace(/^\)\s*;?$/, '') !== '') return null;
  return lit.value;
}

/**
 * 自动识别并还原混淆代码
 * 支持: 本工具词表打包 / 经典 eval packer / eval 字符串包裹 / 字符串转义
 * 逐层还原, kinds 记录实际命中的每一层; 无法识别时原样返回, kinds 为空
 */
export function unpackJs(input: string): UnpackResult {
  let text = input.trim();
  const kinds: UnpackKind[] = [];
  for (let round = 0; round < 8 && text !== ''; round += 1) {
    const before = text;
    const classic = unpackClassic(text);
    if (classic !== null) { text = classic; kinds.push('classic-packer'); continue; }
    const ours = unpackOurs(text);
    if (ours !== null) { text = ours; kinds.push('packer'); continue; }
    const unwrapped = unwrapEval(text);
    if (unwrapped !== null) { text = unwrapped; kinds.push('eval'); continue; }
    const decoded = decodeEscapes(text);
    if (decoded !== text) { text = decoded; kinds.push('escape'); continue; }
    if (text === before) break;
  }
  // 没识别出任何混淆特征: 原样返回, 不再做 trim 等修饰
  if (kinds.length === 0) return { code: input, kinds };
  return { code: text, kinds };
}
