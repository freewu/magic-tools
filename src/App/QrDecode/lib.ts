// 二维码解析: 纯逻辑 (参数校验 / 解码尺寸 / jsQR 调用封装 / 内容分类 / 历史与默认设置)
// 说明: 本文件除调用 jsQR 读像素外不接触 DOM, 便于单测; 取图与画布读写复用 src/lib/image.ts
import jsQR from 'jsqr';
import {
  DEFAULTS_STORAGE_KEY, HISTORY_MAX_DEFAULT, HISTORY_MAX_OPTIONS,
  INVERSION_DEFAULT, INVERSION_OPTIONS, MAX_EDGE_DEFAULT, MAX_EDGE_OPTIONS,
  type ChunkKind, type InversionMode, type PayloadKind,
} from './data';

export type { ChunkKind, InversionMode, PayloadKind };

/** 宽高 (像素), 与 src/lib/image.ts 的 Size 结构一致 (此处重复声明以免 lib 依赖 DOM 模块) */
export interface Size { width: number; height: number; }

export interface Point { x: number; y: number; }

/** 二维码四角坐标 (像素, 相对解码用的位图; 用于在预览图上框出位置) */
export interface QrCorners {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

/** 数据段信息 (界面按 kind 显示类型名, 便于理解内容为什么占这么多字节) */
export interface ChunkRow {
  kind: ChunkKind;
  /** 可读内容 (byte / kanji 段为 HEX 字节; eci 段为赋值号) */
  text: string;
  /** 长度: 字符数 (文本段) 或字节数 (byte / kanji) */
  length: number;
}

/** 一次成功的解析结果 */
export interface DecodedQr {
  /** 解析出的字符串 */
  text: string;
  /** 原始字节 (byte / kanji 段拼接, 用于查看真实编码) */
  bytes: number[];
  /** 二维码版本 1 ~ 40 */
  version: number;
  /** 数据段列表 */
  chunks: ChunkRow[];
  /** 四角坐标; 个别图像 jsQR 不给定位点时返回 null */
  corners: QrCorners | null;
}

// ---------------- 参数校验 ----------------

const toNum = (v: unknown): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : Number.NaN;
  if (typeof v === 'string' && v.trim() !== '') return Number(v);
  return Number.NaN;
};

/** 正整数维度: 非法值 (NaN / 负数 / 空) 一律返回 0 */
const dimOf = (v: unknown): number => {
  const n = Math.floor(toNum(v));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** 反色策略: 非法值回退默认 */
export const normalizeInversion = (v: unknown): InversionMode =>
  INVERSION_OPTIONS.some((o) => o.value === v) ? (v as InversionMode) : INVERSION_DEFAULT;

/** 图片最大边长: 取候选列表里最接近的一个 (非法值回退默认; 0 = 不缩放) */
export const normalizeMaxEdge = (v: unknown): number => {
  const n = toNum(v);
  if (!Number.isFinite(n) || n < 0) return MAX_EDGE_DEFAULT;
  let best = MAX_EDGE_OPTIONS[0];
  for (const opt of MAX_EDGE_OPTIONS) {
    if (Math.abs(opt - n) < Math.abs(best - n)) best = opt;
  }
  return best;
};

/** 历史条数上限: 取候选列表里最接近的一个 (非法值回退默认) */
export const normalizeHistoryMax = (v: unknown): number => {
  const n = toNum(v);
  if (!Number.isFinite(n) || n <= 0) return HISTORY_MAX_DEFAULT;
  let best = HISTORY_MAX_OPTIONS[0];
  for (const opt of HISTORY_MAX_OPTIONS) {
    if (Math.abs(opt - n) < Math.abs(best - n)) best = opt;
  }
  return best;
};

/** 解析用的位图尺寸: 超过 maxEdge 时等比缩小 (0 表示不缩放, 原样返回) */
export const decodeSizeOf = (size: Size, maxEdge: unknown = MAX_EDGE_DEFAULT): Size => {
  const width = Math.max(1, dimOf(size?.width));
  const height = Math.max(1, dimOf(size?.height));
  const edge = normalizeMaxEdge(maxEdge);
  if (edge === 0 || (width <= edge && height <= edge)) return { width, height };
  const ratio = Math.min(edge / width, edge / height);
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
};

// ---------------- jsQR 调用封装 ----------------

const chunkOf = (raw: unknown): ChunkRow => {
  const c = (raw ?? {}) as { type?: string; text?: string; bytes?: number[]; assignmentNumber?: number };
  const type = c.type as ChunkKind | undefined;
  if (type === 'eci') {
    const n = typeof c.assignmentNumber === 'number' ? c.assignmentNumber : 0;
    return { kind: 'eci', text: `#${n}`, length: 0 };
  }
  if (type === 'byte' || type === 'kanji') {
    const bytes = Array.isArray(c.bytes) ? c.bytes : [];
    return { kind: type, text: hexOf(bytes), length: bytes.length };
  }
  const text = String(c.text ?? '');
  const kind: ChunkKind = type === 'numeric' || type === 'alphanumeric' ? type : 'unknown';
  return { kind, text, length: [ ...text ].length };
};

/** jsQR 数据段 -> 界面行 (非数组 / 空值一律返回空列表) */
export const chunkRows = (chunks: unknown): ChunkRow[] =>
  (Array.isArray(chunks) ? chunks : []).map(chunkOf);

const pointOf = (raw: unknown): Point | null => {
  const p = raw as { x?: number; y?: number } | undefined;
  if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
  return { x: Number(p.x), y: Number(p.y) };
};

/** jsQR 定位信息 -> 四角坐标 (缺角时返回 null) */
export const cornersOf = (location: unknown): QrCorners | null => {
  const l = (location ?? {}) as Record<string, unknown>;
  const topLeft = pointOf(l.topLeftCorner);
  const topRight = pointOf(l.topRightCorner);
  const bottomRight = pointOf(l.bottomRightCorner);
  const bottomLeft = pointOf(l.bottomLeftCorner);
  if (!topLeft || !topRight || !bottomRight || !bottomLeft) return null;
  return { topLeft, topRight, bottomRight, bottomLeft };
};

/**
 * 解析 RGBA 像素里的二维码 (jsQR)
 * @param data      RGBA 扁平数组 (Uint8ClampedArray, 长度须 >= w * h * 4)
 * @param size      位图尺寸 (与 data 对应)
 * @param inversion 反色策略
 * @returns 解析结果; 没有二维码 / 数据不完整时返回 null
 */
export const decodePixels = (
  data: Uint8ClampedArray,
  size: Size,
  inversion: InversionMode = INVERSION_DEFAULT
): DecodedQr | null => {
  const width = dimOf(size?.width);
  const height = dimOf(size?.height);
  if (!data || width < 1 || height < 1) return null;
  if (data.length < width * height * 4) return null;
  let code: ReturnType<typeof jsQR>;
  try {
    code = jsQR(data, width, height, { inversionAttempts: normalizeInversion(inversion) });
  } catch {
    // jsQR 在极端尺寸 / 异常像素下可能抛错, 统一按「未识别」处理
    return null;
  }
  if (!code) return null;
  return {
    text: String(code.data ?? ''),
    bytes: Array.isArray(code.binaryData) ? [ ...code.binaryData ] : [],
    version: Number.isFinite(code.version) ? code.version : 0,
    chunks: chunkRows(code.chunks),
    corners: cornersOf(code.location),
  };
};

// ---------------- 内容分类 ----------------

/** 结构化字段 (key 为协议里的原始键名, 界面负责翻译) */
export interface PayloadField { key: string; value: string; }

export interface PayloadInfo {
  kind: PayloadKind;
  fields: PayloadField[];
}

/** 按未转义的分隔符切分 (二维码里的 \; \, \: \\ 都是转义写法) */
export const splitUnescaped = (input: string, sep = ';'): string[] => {
  const out: string[] = [];
  let cur = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '\\' && i + 1 < input.length) {
      const next = input[i + 1];
      // 只对分隔符 / 冒号 / 反斜杠做还原, 其余保留转义字符本身
      if (next === ';' || next === ':' || next === ',' || next === '\\') {
        cur += next;
        i++;
        continue;
      }
      cur += ch;
      continue;
    }
    if (ch === sep) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
};

const firstNonEmpty = (parts: string[]): string => parts.find((p) => p !== '') ?? '';

const FIELD_MAX = 16;

/** 形如 `WIFI:T:WPA;S:SSID;P:pass;;` 的键值串 -> 字段列表 */
const kvFields = (body: string, keys: Record<string, string> = {}): PayloadField[] => {
  const fields: PayloadField[] = [];
  for (const part of splitUnescaped(body)) {
    if (part === '') continue;
    const idx = part.indexOf(':');
    if (idx < 0) continue;
    const rawKey = part.slice(0, idx).trim();
    const key = keys[rawKey.toUpperCase()] ?? rawKey;
    const value = part.slice(idx + 1).trim();
    if (key === '' || value === '') continue;
    fields.push({ key, value });
    if (fields.length >= FIELD_MAX) break;
  }
  return fields;
};

const URL_RE = /^(https?|ftp):\/\/\S+$/i;

/** 是否为可直接打开的链接 (结果区据此显示「打开链接」) */
export const isOpenableUrl = (text: unknown): boolean =>
  typeof text === 'string' && (URL_RE.test(text.trim()) || /^mailto:\S+$/i.test(text.trim()));

const cardFields = (text: string): PayloadField[] => {
  const fields: PayloadField[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    // 形如 item1.TEL:+86... / EMAIL;TYPE=WORK:a@b.com 的写法: 去掉 itemN. 前缀与分组参数
    const rawKey = line.slice(0, idx)
      .replace(/^item\d+\./i, '')
      .split(';')[0]
      .trim()
      .toUpperCase();
    if (rawKey === 'BEGIN' || rawKey === 'END') continue;
    const value = firstNonEmpty(splitUnescaped(line.slice(idx + 1), ';')).trim();
    if (rawKey === '' || value === '') continue;
    fields.push({ key: rawKey, value });
    if (fields.length >= FIELD_MAX) break;
  }
  return fields;
};

/** 解析 query 串 (mailto / geo 等共用) */
const queryFields = (query: string): PayloadField[] => {
  const fields: PayloadField[] = [];
  for (const pair of query.replace(/^\?/, '').split('&')) {
    if (pair === '') continue;
    const idx = pair.indexOf('=');
    const key = (idx < 0 ? pair : pair.slice(0, idx)).trim();
    const raw = idx < 0 ? '' : pair.slice(idx + 1);
    if (key === '') continue;
    let value = raw.replace(/\+/g, ' ');
    try {
      value = decodeURIComponent(value);
    } catch {
      /* 非法百分号编码: 保留原样 */
    }
    fields.push({ key, value });
    if (fields.length >= FIELD_MAX) break;
  }
  return fields;
};

/**
 * 识别二维码内容的常见协议并拆成字段
 * 支持: 网址 / WIFI 配网 / vCard / MECARD / mailto / tel / SMSTO / geo / otpauth, 其余按纯文本
 */
export const parsePayload = (text: unknown): PayloadInfo => {
  const s = typeof text === 'string' ? text.trim() : '';
  if (s === '') return { kind: 'text', fields: [] };

  if (/^WIFI:/i.test(s)) {
    return {
      kind: 'wifi',
      fields: kvFields(s.replace(/^WIFI:/i, ''), { T: 'T', S: 'S', P: 'P', H: 'H' }),
    };
  }
  if (/^BEGIN:VCARD/i.test(s)) return { kind: 'vcard', fields: cardFields(s) };
  if (/^MECARD:/i.test(s)) return { kind: 'mecard', fields: kvFields(s.replace(/^MECARD:/i, '')) };

  if (/^mailto:/i.test(s)) {
    const body = s.slice('mailto:'.length);
    const idx = body.indexOf('?');
    const address = (idx < 0 ? body : body.slice(0, idx)).trim();
    const fields: PayloadField[] = address === '' ? [] : [ { key: 'address', value: address } ];
    if (idx >= 0) fields.push(...queryFields(body.slice(idx)));
    return { kind: 'mailto', fields };
  }

  if (/^(tel|TEL):/i.test(s)) {
    const value = s.replace(/^(tel|TEL):/i, '').trim();
    return { kind: 'tel', fields: value === '' ? [] : [ { key: 'number', value } ] };
  }

  if (/^SMSTO:/i.test(s)) {
    const parts = s.slice('SMSTO:'.length).split(':');
    const fields: PayloadField[] = [];
    const number = (parts[0] ?? '').trim();
    const body = parts.slice(1).join(':').trim();
    if (number !== '') fields.push({ key: 'number', value: number });
    if (body !== '') fields.push({ key: 'body', value: body });
    return { kind: 'sms', fields };
  }

  if (/^geo:/i.test(s)) {
    const body = s.slice('geo:'.length);
    const idx = body.indexOf('?');
    const coords = (idx < 0 ? body : body.slice(0, idx)).split(',');
    const fields: PayloadField[] = [];
    const lat = (coords[0] ?? '').trim();
    const lng = (coords[1] ?? '').trim();
    const alt = (coords[2] ?? '').trim();
    if (lat !== '') fields.push({ key: 'lat', value: lat });
    if (lng !== '') fields.push({ key: 'lng', value: lng });
    if (alt !== '') fields.push({ key: 'alt', value: alt });
    if (idx >= 0) fields.push(...queryFields(body.slice(idx)));
    return { kind: 'geo', fields };
  }

  if (/^otpauth:\/\//i.test(s)) {
    const m = /^otpauth:\/\/(totp|hotp)\/([^?]*)(\?.*)?$/i.exec(s);
    const fields: PayloadField[] = [ { key: 'type', value: (m?.[1] ?? 'totp').toUpperCase() } ];
    const rawLabel = (m?.[2] ?? '').replace(/^\//, '');
    let label = rawLabel;
    try {
      label = decodeURIComponent(rawLabel);
    } catch {
      /* 非法百分号编码: 保留原样 */
    }
    if (label !== '') {
      // 规范写法为 issuer:account, 只有一段时视为账号
      const parts = label.split(':').map((p) => p.trim());
      if (parts.length > 1) fields.push({ key: 'issuer', value: parts[0] });
      fields.push({ key: 'account', value: parts.slice(1).join(':') || parts[0] });
    }
    if (m?.[3]) fields.push(...queryFields(m[3]));
    return { kind: 'otpauth', fields };
  }

  if (URL_RE.test(s)) return { kind: 'url', fields: [ { key: 'url', value: s } ] };
  return { kind: 'text', fields: [] };
};

// ---------------- 历史记录 ----------------

export interface HistoryEntry {
  /** 解析出的内容 */
  text: string;
  /** 解析时间戳 */
  at: number;
  /** 内容类型 */
  kind: PayloadKind;
}

/** 历史标题: 单行化 + 截断 */
export const historyTitle = (text: unknown, limit = 80): string => {
  const flat = String(text ?? '').replace(/\s+/g, ' ').trim();
  return flat.length > limit ? `${flat.slice(0, limit)}…` : flat;
};

/** 新记录插到最前; 内容重复时只把旧记录提到最前, 超过 max 条则丢弃末尾 */
export const pushHistory = (prev: HistoryEntry[], entry: HistoryEntry, max = HISTORY_MAX_DEFAULT): HistoryEntry[] => {
  const limit = normalizeHistoryMax(max);
  const rest = (Array.isArray(prev) ? prev : []).filter((e) => e.text !== entry.text);
  return [ entry, ...rest ].slice(0, limit);
};

// ---------------- 展示辅助 ----------------

/** 字节 -> HEX (大写空格分隔; limit > 0 时只取前 limit 个) */
export const hexOf = (bytes: unknown, limit = 0): string => {
  const list = Array.isArray(bytes) ? bytes : [];
  const sliced = limit > 0 ? list.slice(0, limit) : list;
  return sliced
    .map((b) => {
      const n = Number(b);
      const v = Number.isFinite(n) ? Math.max(0, Math.min(255, Math.trunc(n))) : 0;
      return v.toString(16).toUpperCase().padStart(2, '0');
    })
    .join(' ');
};

/** 文本的 UTF-8 字节数 (二维码 byte 段按 UTF-8 存放) */
export const textBytes = (text: unknown): number => {
  const s = typeof text === 'string' ? text : '';
  try {
    return new TextEncoder().encode(s).length;
  } catch {
    return s.length;
  }
};

const pad2 = (n: number) => String(n).padStart(2, '0');

/** 结果文件名: qrcode-20260926-153012.txt */
export const resultFileName = (date: Date = new Date()): string => {
  const stamp = `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`
    + `-${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`;
  return `qrcode-${stamp}.txt`;
};

/** 四角坐标 -> SVG polygon 的 points 串 (容错: 无定位点返回 null) */
export const polygonPoints = (corners: QrCorners | null): string | null => {
  if (!corners) return null;
  const { topLeft, topRight, bottomRight, bottomLeft } = corners;
  return [ topLeft, topRight, bottomRight, bottomLeft ]
    .map((p) => `${p.x},${p.y}`)
    .join(' ');
};

// ---------------- 默认设置 (设置中心配置, 保存在浏览器本地) ----------------

export interface DecodeDefaults {
  /** 反色策略 */
  inversion: InversionMode;
  /** 解码前图片缩放上限 (0 = 不缩放) */
  maxEdge: number;
  /** 历史记录条数上限 */
  historyMax: number;
  /** 解析成功后自动复制到剪贴板 */
  autoCopy: boolean;
}

export const DEFAULT_SETTINGS: DecodeDefaults = {
  inversion: INVERSION_DEFAULT,
  maxEdge: MAX_EDGE_DEFAULT,
  historyMax: HISTORY_MAX_DEFAULT,
  autoCopy: false,
};

/** 任意输入 -> 完整合法的默认设置 */
export const normalizeSettings = (raw?: Partial<DecodeDefaults> | null): DecodeDefaults => ({
  inversion: normalizeInversion(raw?.inversion),
  maxEdge: normalizeMaxEdge(raw?.maxEdge),
  historyMax: normalizeHistoryMax(raw?.historyMax),
  autoCopy: raw?.autoCopy === true,
});

/** 读取默认设置 (读取失败 / 非法值一律回退默认) */
export const getSettings = (): DecodeDefaults => {
  try {
    const raw = localStorage.getItem(DEFAULTS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return normalizeSettings(JSON.parse(raw) as Partial<DecodeDefaults>);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

/** 写入默认设置 (已归一化; 返回真正写入的值) */
export const setSettings = (raw?: Partial<DecodeDefaults> | null): DecodeDefaults => {
  const next = normalizeSettings(raw);
  try {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 隐私模式等场景写入失败: 忽略 */
  }
  return next;
};

/** 局部更新默认设置 (未提供的字段保持原值) */
export const patchSettings = (patch: Partial<DecodeDefaults>): DecodeDefaults =>
  setSettings({ ...getSettings(), ...patch });
