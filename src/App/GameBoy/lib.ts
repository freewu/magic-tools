// GameBoy 模拟器: 纯逻辑 (卡带头解析 / 键位映射 / 倍速音量 / 存档编解码 / 电池存档 / 最近列表 / 画面转换)
// 说明: 本文件不依赖 DOM 与 React, 也不导入 wasm 核心 (boytacean 只在页面里用), 便于单测覆盖规则与配置逻辑
import { Base64 } from 'js-base64';
import {
  BASE_FPS, CART_TYPES, DEFAULT_KEYS, GAMEPAD_BUTTONS, HOTKEYS, PAD_OPACITY_DEFAULT, PAD_OPACITY_MAX,
  PAD_OPACITY_MIN, QUICKSAVE_STORAGE_KEY, RAM_SIZES, RECENT_LIMIT, RECENT_STORAGE_KEY, ROM_SIZES,
  SETTINGS_STORAGE_KEY, SHOW_PAD_DEFAULT, SPEED_DEFAULT, SPEED_OPTIONS, SRAM_STORAGE_KEY,
  STATE_FILE_HEADER, VOLUME_DEFAULT, VOLUME_MAX, VOLUME_MIN, PAD_BUTTONS, type Hotkey, type PadButton, type Speed,
} from './data';

// ---- 卡带头解析 ----

/** Nintendo Logo (0x0104~0x0133), 是判断「这是不是 GameBoy 卡带」的主要依据 */
export const NINTENDO_LOGO: readonly number[] = [
  0xce, 0xed, 0x66, 0x66, 0xcc, 0x0d, 0x00, 0x0b, 0x03, 0x73, 0x00, 0x83, 0x00, 0x0c, 0x00, 0x0d,
  0x00, 0x08, 0x11, 0x1f, 0x88, 0x89, 0x00, 0x0e, 0xdc, 0xcc, 0x6e, 0xe6, 0xdd, 0xdd, 0xd9, 0x99,
  0xbb, 0xbb, 0x67, 0x63, 0x6e, 0x0e, 0xec, 0xcc, 0xdd, 0xdc, 0x99, 0x9f, 0xbb, 0xb9, 0x33, 0x3e,
];

export type RomError = 'tooShort' | 'badLogo';

/** 卡带模式: DMG (灰机) / CGB 兼容 (彩色机器上彩色) / CGB 专用 */
export type CartMode = 'dmg' | 'compatible' | 'only';

export interface RomInfo {
  /** 是否为可运行的 GameBoy ROM */
  valid: boolean;
  /** 校验失败的原因 (valid 为 true 时缺省) */
  error?: RomError;
  /** 卡带标题 (0x0134~0x0143, 截到第一个 0 字节) */
  title: string;
  /** 卡带模式 */
  cartMode: CartMode;
  /** 支持 SGB (Super GameBoy) 增强 */
  sgb: boolean;
  /** 卡带类型码 (0x0147) */
  cartType: number;
  /** 卡带类型名称 (MBC1 / MBC5 等) */
  cartTypeName: string;
  /** ROM 容量 (KB) */
  romSizeKB: number;
  /** 卡带 RAM 容量 (KB, 0 表示无) */
  ramSizeKB: number;
  /** 是否有电池 (掉电保持存档) */
  battery: boolean;
  /** 卡带版本号 (0x014C) */
  version: number;
  /** 头部校验和是否正确 */
  headerChecksumOk: boolean;
  /** 全局校验和是否正确 (部分改版 ROM 会不符) */
  globalChecksumOk: boolean;
  /** 文件大小 (字节) */
  fileSize: number;
}

export const EMPTY_ROM_INFO: RomInfo = {
  valid: false,
  title: '',
  cartMode: 'dmg',
  sgb: false,
  cartType: 0,
  cartTypeName: '',
  romSizeKB: 0,
  ramSizeKB: 0,
  battery: false,
  version: 0,
  headerChecksumOk: false,
  globalChecksumOk: false,
  fileSize: 0,
};

/** 头部校验和: 0x0134~0x014C 逐字节相减 (x = x - byte - 1) */
export const headerChecksum = (bytes: Uint8Array): number => {
  let x = 0;
  for (let i = 0x134; i <= 0x14c; i++) x = (x - (bytes[i] ?? 0) - 1) & 0xff;
  return x;
};

/** 全局校验和: 除 0x014E / 0x014F 两个字节外全部相加 */
export const globalChecksum = (bytes: Uint8Array): number => {
  let sum = 0;
  for (let i = 0; i < bytes.length; i++) {
    if (i === 0x14e || i === 0x14f) continue;
    sum = (sum + (bytes[i] ?? 0)) & 0xffff;
  }
  return sum;
};

/** 头部是否带 Nintendo Logo */
export const hasNintendoLogo = (bytes: Uint8Array): boolean => {
  if (bytes.length < 0x134) return false;
  for (let i = 0; i < NINTENDO_LOGO.length; i++) {
    if (bytes[0x104 + i] !== NINTENDO_LOGO[i]) return false;
  }
  return true;
};

/** 解析卡带头 (0x0100~0x014F), 判断能否作为 GameBoy ROM 运行 */
export const parseRomHeader = (bytes: Uint8Array | null | undefined): RomInfo => {
  const size = bytes?.length ?? 0;
  if (!bytes || size < 0x150) return { ...EMPTY_ROM_INFO, error: 'tooShort', fileSize: size };

  const logoOk = hasNintendoLogo(bytes);
  const headerOk = headerChecksum(bytes) === (bytes[0x14d] ?? -1);
  const globalOk = globalChecksum(bytes) === (((bytes[0x14e] ?? 0) << 8) | (bytes[0x14f] ?? 0));
  if (!logoOk && !(headerOk && globalOk)) return { ...EMPTY_ROM_INFO, error: 'badLogo', fileSize: size };

  // 标题: 0x0134 起 16 字节, 到第一个 0 结束, 只保留可打印字符
  let title = '';
  for (let i = 0x134; i <= 0x143; i++) {
    const c = bytes[i] ?? 0;
    if (c === 0) break;
    title += c >= 0x20 && c <= 0x7e ? String.fromCharCode(c) : ' ';
  }
  title = title.replace(/\s+/g, ' ').trim();

  const cgbFlag = bytes[0x143] ?? 0;
  const cartMode: CartMode = cgbFlag === 0xc0 ? 'only' : cgbFlag === 0x80 ? 'compatible' : 'dmg';
  const cartType = bytes[0x147] ?? 0;

  return {
    valid: true,
    title,
    cartMode,
    sgb: (bytes[0x146] ?? 0) === 0x03,
    cartType,
    cartTypeName: CART_TYPES[cartType] ?? `0x${cartType.toString(16).toUpperCase().padStart(2, '0')}`,
    romSizeKB: ROM_SIZES[bytes[0x148] ?? 0] ?? 0,
    ramSizeKB: RAM_SIZES[bytes[0x149] ?? 0] ?? 0,
    // 电池型卡带: 判别标准是卡带类型名里带「电池」/ 已知的电池类型码
    battery: [ 0x03, 0x06, 0x09, 0x0d, 0x0f, 0x10, 0x13, 0x1b, 0x1e, 0x22, 0xff ].includes(cartType),
    version: bytes[0x14c] ?? 0,
    headerChecksumOk: headerOk,
    globalChecksumOk: globalOk,
    fileSize: size,
  };
};

/** 字节数 -> 便于阅读的容量 */
export const formatRomSize = (bytes: number): string => {
  const n = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

/** 文件/ROM 名去掉扩展名 (用于界面展示与存档文件名) */
export const romBaseName = (fileName: string): string => {
  const base = String(fileName ?? '').split(/[\\/]/).pop() ?? '';
  const dot = base.lastIndexOf('.');
  return (dot > 0 ? base.slice(0, dot) : base) || 'rom';
};

/** 是否看起来像 GameBoy ROM 文件 */
export const isRomFileName = (fileName: string): boolean =>
  /\.(gb|gbc|bin)$/i.test(String(fileName ?? '').trim());

/** 存档文件名 (如 'Tetris.gbstate') */
export const stateFileName = (romName: string): string => `${romBaseName(romName)}.gbstate`;

/** 时间戳后缀 (yyyymmdd-hhmmss), 用于截屏等文件命名 */
export const timestampSuffix = (date: Date = new Date()): string => {
  const p = (n: number, len = 2) => String(n).padStart(len, '0');
  return `${p(date.getFullYear(), 4)}${p(date.getMonth() + 1)}${p(date.getDate())}`
    + `-${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`;
};

/** 截屏文件名 (如 'Tetris-20240131-235959.png') */
export const screenshotFileName = (romName: string, date?: Date): string =>
  `${romBaseName(romName)}-${timestampSuffix(date)}.png`;

/** 事件目标是输入框 / 可编辑区域时不应拦截键盘 (否则打不了字) */
export const isTypingTarget = (
  node: { tagName?: string; isContentEditable?: boolean } | null | undefined,
): boolean => {
  if (!node) return false;
  const tag = String(node.tagName ?? '').toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable === true;
};

// ---- 键位映射 ----

export type KeyMap = Record<PadButton, string[]>;

/** 深拷贝键位表 */
export const cloneKeys = (keys: KeyMap): KeyMap => PAD_BUTTONS.reduce((acc, b) => {
  acc[b] = [ ...(keys[b] ?? []) ];
  return acc;
}, {} as KeyMap);

/** 任意输入 -> 合法的键位表 (空 / 非法项回退默认; 同一个键不会绑定到两个手柄键) */
export const normalizeKeys = (raw?: unknown): KeyMap => {
  const src = raw !== null && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const used = new Set<string>();
  const out = {} as KeyMap;
  for (const button of PAD_BUTTONS) {
    const list = Array.isArray(src[button]) ? src[button] as unknown[] : [];
    const keys = list
      .map((v) => String(v ?? ''))
      .filter((v) => v !== '' && !used.has(v));
    keys.forEach((k) => used.add(k));
    out[button] = keys;
  }
  // 没有任何键位的按键用默认值补齐 (跳过已被占用的键)
  for (const button of PAD_BUTTONS) {
    if (out[button].length > 0) continue;
    const fill = (DEFAULT_KEYS[button] ?? []).filter((k) => !used.has(k));
    if (fill.length > 0) {
      out[button] = [ fill[0] ];
      used.add(fill[0]);
    }
  }
  return out;
};

/** 键位表 -> 反查表 (KeyboardEvent.key -> 手柄按键), 命中优先返回靠前的按键 */
export const buildKeyLookup = (keys: KeyMap): Record<string, PadButton> => {
  const out: Record<string, PadButton> = {};
  for (const button of PAD_BUTTONS) {
    for (const key of keys[button] ?? []) {
      if (!(key in out)) out[key] = button;
    }
  }
  return out;
};

/** 某个键盘按键对应的手柄按键 (无命中返回 null) */
export const keyToPadButton = (keys: KeyMap, key: string): PadButton | null =>
  buildKeyLookup(keys)[key] ?? null;

/** 过滤掉非法键名 */
const ofKeys = (list: readonly string[] | undefined): string[] =>
  (list ?? []).map((v) => String(v ?? '')).filter((v) => v !== '');

/** 重新绑定某个手柄按键: 该键从其它按键上摘除, 并成为目标按键的唯一键位 */
export const rebindKey = (keys: KeyMap, button: PadButton, key: string): KeyMap => {
  const out = cloneKeys(keys);
  for (const b of PAD_BUTTONS) out[b] = ofKeys(out[b]).filter((k) => k !== key);
  out[button] = [ key ];
  return out;
};

/** 单个按键当前生效的键名 (取第一个别名) */
export const keyLabel = (keys: KeyMap, button: PadButton): string => (keys[button] ?? [])[0] ?? '—';

/** 全局快捷键 (无命中返回 null) */
export const hotkeyOf = (key: string): Hotkey | null => HOTKEYS[key] ?? null;

/** 键盘按键名 -> 便于展示的文案 (方向键等) */
export const keyDisplayName = (key: string): string => {
  const map: Record<string, string> = {
    ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
    ' ': '空格', Enter: 'Enter', Shift: 'Shift', Backspace: 'Backspace', Escape: 'Esc',
  };
  return map[key] ?? key;
};

/** 标准手柄按键下标 -> 手柄按键 */
export const gamepadButtonOf = (index: number): PadButton | null => GAMEPAD_BUTTONS[index] ?? null;

// ---- 速度 / 音量 ----

/** 任意输入 -> 合法倍速 (取最接近的档位) */
export const normalizeSpeed = (v: unknown): Speed => {
  const n = Number(v);
  if (!Number.isFinite(n)) return SPEED_DEFAULT;
  let best: Speed = SPEED_OPTIONS[0];
  for (const opt of SPEED_OPTIONS) {
    if (Math.abs(opt - n) < Math.abs(best - n)) best = opt;
  }
  return best;
};

/** 每帧间隔 (ms), 1 倍速约 16.74ms */
export const frameIntervalMs = (speed: unknown): number => 1000 / (BASE_FPS * normalizeSpeed(speed));

/** 任意输入 -> 合法音量 (0~100 整数) */
export const normalizeVolume = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return VOLUME_DEFAULT;
  return Math.min(VOLUME_MAX, Math.max(VOLUME_MIN, Math.round(n)));
};

/** 音量 (0~100) -> WebAudio 增益 (0~1) */
export const volumeToGain = (volume: unknown): number => normalizeVolume(volume) / 100;

/** 任意输入 -> 合法的虚拟按键透明度 (0~100, 非法值回退默认) */
export const normalizePadOpacity = (value: unknown): number => {
  const n = Number(value);
  if (!Number.isFinite(n)) return PAD_OPACITY_DEFAULT;
  return Math.min(PAD_OPACITY_MAX, Math.max(PAD_OPACITY_MIN, Math.round(n)));
};

/** 透明度 (0~100) -> CSS opacity (0.2~1) */
export const padOpacityToAlpha = (value: unknown): number => normalizePadOpacity(value) / 100;

// ---- 画面: RGB -> RGBA ----

/**
 * boytacean 的帧缓冲是 RGB (160×144×3), canvas 的 ImageData 需要 RGBA,
 * 这里按行展开并补上不透明的 alpha 通道
 */
export const writeRgba = (rgb: Uint8Array | null | undefined, out: Uint8ClampedArray): void => {
  if (!rgb) return;
  const pixels = Math.min(Math.floor(rgb.length / 3), Math.floor(out.length / 4));
  for (let i = 0; i < pixels; i++) {
    const s = i * 3;
    const d = i * 4;
    out[d] = rgb[s];
    out[d + 1] = rgb[s + 1];
    out[d + 2] = rgb[s + 2];
    out[d + 3] = 255;
  }
};

// ---- 默认设置 (设置中心 / 「配置文件」导入导出共用 getDefault* + setDefault* 成对约定) ----

export interface GbOptions {
  /** 默认音量 0~100 */
  volume: number;
  /** 是否显示 FPS */
  showFps: boolean;
  /** 像素平滑 (关闭时像素风更锐利) */
  smooth: boolean;
  /** 默认倍速 */
  speed: number;
  /** 全屏时是否在画面下方浮出虚拟按键 */
  showPad: boolean;
  /** 虚拟按键透明度 (0~100) */
  padOpacity: number;
  /** 键位 */
  keys: KeyMap;
}

export const DEFAULT_OPTIONS: GbOptions = {
  volume: VOLUME_DEFAULT,
  showFps: true,
  smooth: false,
  speed: SPEED_DEFAULT,
  showPad: SHOW_PAD_DEFAULT,
  padOpacity: PAD_OPACITY_DEFAULT,
  keys: normalizeKeys(DEFAULT_KEYS),
};

/** 任意输入 -> 完整合法的选项 */
export const normalizeOptions = (raw?: Partial<GbOptions> | null): GbOptions => ({
  volume: normalizeVolume(raw?.volume),
  showFps: raw?.showFps === undefined ? DEFAULT_OPTIONS.showFps : raw.showFps === true,
  smooth: raw?.smooth === undefined ? DEFAULT_OPTIONS.smooth : raw.smooth === true,
  speed: normalizeSpeed(raw?.speed),
  showPad: raw?.showPad === undefined ? DEFAULT_OPTIONS.showPad : raw.showPad === true,
  padOpacity: raw?.padOpacity === undefined ? DEFAULT_OPTIONS.padOpacity : normalizePadOpacity(raw.padOpacity),
  keys: normalizeKeys(raw?.keys ?? DEFAULT_OPTIONS.keys),
});

/** 读取默认设置 (非法值 / 读取失败一律回退默认) */
export const getDefaultOptions = (): GbOptions => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return normalizeOptions(DEFAULT_OPTIONS);
    return normalizeOptions(JSON.parse(raw) as Partial<GbOptions>);
  } catch {
    return normalizeOptions(DEFAULT_OPTIONS);
  }
};

/** 写入默认设置 (已归一化; 返回真正写入的值) */
export const setDefaultOptions = (raw?: Partial<GbOptions> | null): GbOptions => {
  const next = normalizeOptions(raw);
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 忽略 */
  }
  return next;
};

/** 局部更新默认设置 (未提供的字段保持原值) */
export const patchDefaultOptions = (patch: Partial<GbOptions>): GbOptions =>
  setDefaultOptions({ ...getDefaultOptions(), ...patch });

/** 两组选项是否一致 (用于「保存为默认设置」按钮的禁用状态) */
export const isSameOptions = (a: GbOptions, b: GbOptions): boolean =>
  a.volume === b.volume && a.showFps === b.showFps && a.smooth === b.smooth && a.speed === b.speed
  && a.showPad === b.showPad && a.padOpacity === b.padOpacity
  && PAD_BUTTONS.every((btn) => (a.keys[btn] ?? []).join('|') === (b.keys[btn] ?? []).join('|'));

// ---- 存档 (boytacean 的 StateManager 输出字节) ----

/** 存档文本 (文件内容): 头部 + Base64 */
export const encodeSaveState = (bytes: Uint8Array): string =>
  `${STATE_FILE_HEADER}\n${Base64.fromUint8Array(bytes)}`;

/** 存档文本 -> 字节数组 (格式错误抛异常) */
export const decodeSaveState = (text: string): Uint8Array => {
  const raw = String(text ?? '').trim();
  if (raw === '') throw new Error('empty state');
  const body = raw.startsWith(STATE_FILE_HEADER) ? raw.slice(STATE_FILE_HEADER.length).trim() : raw;
  const bytes = Base64.toUint8Array(body);
  if (!bytes || bytes.length === 0) throw new Error('invalid state');
  return bytes;
};

/** 读取快速存档 (无存档 / 损坏返回 null) */
export const readQuickSave = (): string | null => {
  try {
    const raw = localStorage.getItem(QUICKSAVE_STORAGE_KEY);
    return raw && raw.trim() !== '' ? raw : null;
  } catch {
    return null;
  }
};

/** 写入快速存档 (容量不足等写入失败返回 false) */
export const writeQuickSave = (text: string): boolean => {
  try {
    localStorage.setItem(QUICKSAVE_STORAGE_KEY, text);
    return true;
  } catch {
    return false;
  }
};

/** 清空快速存档 */
export const clearQuickSave = (): void => {
  try {
    localStorage.removeItem(QUICKSAVE_STORAGE_KEY);
  } catch {
    /* 忽略 */
  }
};

// ---- 卡带电池存档 (SRAM): 按 ROM 名分别保存在本机浏览器 ----

export interface SramEntry {
  name: string;
  /** Base64 的卡带 RAM 内容 */
  data: string;
  /** 写入时间戳 */
  at: number;
}

/** SRAM 最多保留的条目数 (避免无限占用 localStorage) */
export const SRAM_LIMIT = 6;

/** 读取全部电池存档 */
export const getSramEntries = (): SramEntry[] => {
  try {
    const raw = localStorage.getItem(SRAM_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((it): it is Record<string, unknown> => it !== null && typeof it === 'object')
      .map((it) => ({ name: String(it.name ?? ''), data: String(it.data ?? ''), at: Number(it.at) || 0 }))
      .filter((it) => it.name !== '' && it.data !== '')
      .slice(0, SRAM_LIMIT);
  } catch {
    return [];
  }
};

const saveSramEntries = (list: readonly SramEntry[]): void => {
  try {
    localStorage.setItem(SRAM_STORAGE_KEY, JSON.stringify(list.slice(0, SRAM_LIMIT)));
  } catch {
    /* 忽略: 存储空间不足时只是不记忆电池存档 */
  }
};

/** 读取某个 ROM 的电池存档 (无 / 损坏返回 null) */
export const readSram = (name: string): Uint8Array | null => {
  const key = romBaseName(name);
  const hit = getSramEntries().find((it) => it.name === key);
  if (!hit) return null;
  try {
    const bytes = Base64.toUint8Array(hit.data);
    return bytes && bytes.length > 0 ? bytes : null;
  } catch {
    return null;
  }
};

/** 保存某个 ROM 的电池存档 (空数据等同清除; 返回是否写入成功) */
export const writeSram = (name: string, bytes: Uint8Array | null | undefined): boolean => {
  const key = romBaseName(name);
  const list = getSramEntries().filter((it) => it.name !== key);
  if (!bytes || bytes.length === 0) {
    saveSramEntries(list);
    return false;
  }
  try {
    saveSramEntries([ { name: key, data: Base64.fromUint8Array(bytes), at: Date.now() }, ...list ]);
    return true;
  } catch {
    return false;
  }
};

/** 清除电池存档 (不传 name 则清空全部) */
export const clearSram = (name?: string): void => {
  if (name === undefined) {
    saveSramEntries([]);
    return;
  }
  const key = romBaseName(name);
  saveSramEntries(getSramEntries().filter((it) => it.name !== key));
};

// ---- 最近打开 (只记录元信息, 不保存 ROM 内容) ----

export interface RecentRom {
  name: string;
  /** 卡带模式 (dmg / compatible / only) */
  mode: CartMode;
  size: number;
  /** 打开时间戳 */
  at: number;
}

/** 读取最近打开列表 */
export const getRecentRoms = (): RecentRom[] => {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((it): it is Record<string, unknown> => it !== null && typeof it === 'object')
      .map((it) => ({
        name: String(it.name ?? ''),
        mode: (it.mode === 'compatible' || it.mode === 'only' ? it.mode : 'dmg') as CartMode,
        size: Number(it.size) || 0,
        at: Number(it.at) || 0,
      }))
      .filter((it) => it.name !== '')
      .slice(0, RECENT_LIMIT);
  } catch {
    return [];
  }
};

/** 记录一次打开 (同名项提到最前; 返回新列表) */
export const pushRecentRom = (list: readonly RecentRom[], entry: RecentRom): RecentRom[] => {
  const rest = list.filter((it) => it.name !== entry.name);
  return [ entry, ...rest ].slice(0, RECENT_LIMIT);
};

/** 保存最近打开列表 */
export const saveRecentRoms = (list: readonly RecentRom[]): void => {
  try {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(list.slice(0, RECENT_LIMIT)));
  } catch {
    /* 忽略 */
  }
};

// ---- 文件读取 ----

/**
 * 读取本地文件为字节数组
 * 优先用 FileReader (兼容老 WebView), 没有时退回 Blob.arrayBuffer
 */
export const readFileBytes = (file: Blob): Promise<Uint8Array> => new Promise((resolve, reject) => {
  if (typeof FileReader === 'undefined') {
    file.arrayBuffer().then((buf) => resolve(new Uint8Array(buf))).catch(reject);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result;
    if (result instanceof ArrayBuffer) resolve(new Uint8Array(result));
    else reject(new Error('unexpected read result'));
  };
  reader.onerror = () => reject(reader.error ?? new Error('read failed'));
  reader.readAsArrayBuffer(file);
});

/** 读取文本文件 (存档 / 键位导入) */
export const readFileText = (file: Blob): Promise<string> => new Promise((resolve, reject) => {
  if (typeof FileReader === 'undefined') {
    file.text().then(resolve).catch(reject);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result ?? ''));
  reader.onerror = () => reject(reader.error ?? new Error('read failed'));
  reader.readAsText(file);
});
