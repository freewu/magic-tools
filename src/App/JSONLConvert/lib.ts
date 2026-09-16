// JSONL 转换: JSON 数组 ↔ JSONL (JSON Lines / NDJSON) 互转
// 纯函数实现 (不依赖浏览器 API), 便于单测

/** JSONL -> JSON 的输出缩进选项 */
export const INDENT_LIST = [
  { value: '2', label: '2 空格' },
  { value: '4', label: '4 空格' },
  { value: 'tab', label: 'Tab' },
] as const;

export type Indent = typeof INDENT_LIST[number]['value'];

export const DEFAULT_INDENT: Indent = '2';

/** 缩进字符串 ('2' -> 两个空格 / '4' -> 四个空格 / 'tab' -> 制表符) */
export function indentUnit(indent: Indent): string {
  if (indent === 'tab') return '\t';
  if (indent === '4') return '    ';
  return '  ';
}

/** 去掉 UTF-8 BOM (Windows 编辑器与导出文件的常见前缀, 不去掉会导致 JSON.parse 失败) */
export const stripBom = (s: string): string => (s.charCodeAt(0) === 0xfeff ? s.slice(1) : s);

/** 按行切分 (兼容 CRLF / CR / LF) */
const splitLines = (s: string): string[] => s.split(/\r\n|\r|\n/);

/** 转换错误码: 界面按语言包翻译成提示文案 */
export type ConvertErrorCode =
  | 'empty' // 内容为空
  | 'jsonParse' // JSON 方向: 整段解析失败
  | 'emptyArray' // JSON 方向: 空数组
  | 'lineParse' // JSONL 方向: 某行不是有效 JSON
  | 'blankLine' // JSONL 方向: 空行 (未忽略空行时)
  | 'jsonArrayInput'; // JSONL 方向: 整段其实是一个 JSON 数组 (用错方向)

/** JSONL 转换错误 (带错误码与出错行号, 便于 i18n 与定位) */
export class ConvertError extends Error {
  readonly code: ConvertErrorCode;
  /** 解析器原始信息 (JSON.parse 的报错) */
  readonly detail: string;
  /** 出错行号 (1 起, 仅 lineParse / blankLine 有值) */
  readonly line: number;
  constructor(code: ConvertErrorCode, detail = '', line = 0) {
    super(`[${code}]${line > 0 ? ` line ${line}` : ''}${detail === '' ? '' : ` ${detail}`}`);
    this.name = 'ConvertError';
    this.code = code;
    this.detail = detail;
    this.line = line;
  }
}

const parseErrorText = (e: unknown): string => (e instanceof Error ? e.message : String(e));

export interface ConvertResult {
  /** 结果文本 */
  text: string;
  /** 记录条数 (数组元素数 / JSONL 行数) */
  count: number;
  /** JSON -> JSONL 时顶层是单个值 (非数组), 界面据此给出提示 */
  single?: boolean;
}

/**
 * JSON 数组 (或单个 JSON 值) -> JSONL
 * - 数组: 每个元素序列化为一行紧凑 JSON
 * - 非数组: 整个值作为一行输出 (JSONL 允许任意 JSON 值作为一行)
 */
export function jsonToJsonl(src: string): ConvertResult {
  const s = stripBom(src).trim();
  if (s === '') throw new ConvertError('empty');
  let parsed: unknown;
  try {
    parsed = JSON.parse(s);
  } catch (e) {
    throw new ConvertError('jsonParse', parseErrorText(e));
  }
  const isArray = Array.isArray(parsed);
  const items: unknown[] = isArray ? (parsed as unknown[]) : [ parsed ];
  if (items.length === 0) throw new ConvertError('emptyArray');
  const text = items.map((v) => JSON.stringify(v) ?? 'null').join('\n');
  return isArray ? { text, count: items.length } : { text, count: 1, single: true };
}

export interface JsonlToJsonOptions {
  /** 输出缩进 (默认 2 空格) */
  indent?: Indent;
  /** 忽略空行 (JSONL 规范中空行非法; 默认忽略以兼容手工编辑的文件) */
  skipBlank?: boolean;
}

/**
 * JSONL -> JSON 数组 (格式化输出, 末尾带换行)
 * - 每行独立解析, 报错时给出具体行号
 * - 整段可解析为 JSON 数组时提示用「JSON → JSONL」, 避免"用错方向"的困惑
 */
export function jsonlToJson(src: string, opts: JsonlToJsonOptions = {}): ConvertResult {
  const { indent = DEFAULT_INDENT, skipBlank = true } = opts;
  const raw = stripBom(src);
  if (raw.trim() === '') throw new ConvertError('empty');

  let whole: unknown;
  try { whole = JSON.parse(raw.trim()); } catch { whole = undefined; }
  if (Array.isArray(whole)) throw new ConvertError('jsonArrayInput');

  const values: unknown[] = [];
  const lines = splitLines(raw);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') {
      if (!skipBlank) throw new ConvertError('blankLine', '', i + 1);
      continue;
    }
    try {
      values.push(JSON.parse(line));
    } catch (e) {
      throw new ConvertError('lineParse', parseErrorText(e), i + 1);
    }
  }
  if (values.length === 0) throw new ConvertError('empty');
  return { text: JSON.stringify(values, null, indentUnit(indent)) + '\n', count: values.length };
}

/** 输入内容形态: json (整段可解析) / jsonl (逐行可解析) / invalid / empty */
export type InputKind = 'empty' | 'json' | 'jsonl' | 'invalid';

/**
 * 识别输入内容形态 (仅用于界面提示, 不参与转换)
 * 优先按整段 JSON 判断, 失败再逐行判断 (多行 JSON 数组 -> json; 多行独立对象 -> jsonl)
 */
export function detectInput(src: string): { kind: InputKind; count: number; array?: boolean } {
  const s = stripBom(src).trim();
  if (s === '') return { kind: 'empty', count: 0 };
  try {
    const v = JSON.parse(s);
    return Array.isArray(v)
      ? { kind: 'json', count: v.length, array: true }
      : { kind: 'json', count: 1, array: false };
  } catch { /* 不是整段 JSON, 继续按 JSONL 逐行判断 */ }
  const lines = splitLines(s).map((l) => l.trim()).filter((l) => l !== '');
  if (lines.length === 0) return { kind: 'empty', count: 0 };
  for (const line of lines) {
    try { JSON.parse(line); } catch { return { kind: 'invalid', count: 0 }; }
  }
  return { kind: 'jsonl', count: lines.length };
}
