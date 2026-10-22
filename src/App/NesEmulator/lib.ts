// NES 模拟器: 纯逻辑 (iNES / NES 2.0 头解析, 键位映射, 倍速, 存档编解码, 最近列表, 默认设置)
// 说明: 本文件不依赖 DOM 与 React (仅读写 localStorage / FileReader 这类浏览器 API 的薄封装),
//       模拟核心 (jsnes) 只在页面里使用, 便于单测覆盖规则与配置逻辑。
import { Base64 } from 'js-base64';
import {
  BASE_FPS, DEFAULT_KEYS, GAMEPAD_BUTTONS, HOTKEYS, QUICKSAVE_STORAGE_KEY, RECENT_LIMIT, RECENT_STORAGE_KEY,
  SETTINGS_STORAGE_KEY, SPEED_DEFAULT, SPEED_OPTIONS, STATE_FILE_HEADER, VOLUME_DEFAULT, VOLUME_MAX, VOLUME_MIN,
  PAD_BUTTONS, type Hotkey, type PadButton, type Speed,
} from './data';

// ---- ROM 头解析 (iNES 1.0 / NES 2.0) ----

export type RomError = 'tooShort' | 'notNes' | 'noPrg' | 'truncated';
export type Mirroring = 'horizontal' | 'vertical' | 'four-screen';
export type Region = 'ntsc' | 'pal' | 'dual';

export interface RomInfo {
  /** 是否为可运行的 NES ROM */
  valid: boolean;
  /** 校验失败的原因 (valid 为 true 时缺省) */
  error?: RomError;
  /** 是否 NES 2.0 格式 */
  isNes2: boolean;
  /** PRG-ROM 大小 (16KB 为一 bank) */
  prgBanks: number;
  /** CHR-ROM 大小 (8KB 为一 bank; 0 表示使用卡带内存 CHR-RAM) */
  chrBanks: number;
  /** 卡带 mapper 编号 */
  mapper: number;
  mirroring: Mirroring;
  /** 是否带电池存档 (SRAM) */
  battery: boolean;
  /** 是否带 512 字节 trainer */
  trainer: boolean;
  region: Region;
  /** 文件大小 (字节) */
  fileSize: number;
}

const MAGIC = [ 0x4e, 0x45, 0x53, 0x1a ]; // 'NES\x1a'

/** 空 / 未加载时的 ROM 信息 */
export const EMPTY_ROM_INFO: RomInfo = {
  valid: false,
  isNes2: false,
  prgBanks: 0,
  chrBanks: 0,
  mapper: 0,
  mirroring: 'horizontal',
  battery: false,
  trainer: false,
  region: 'ntsc',
  fileSize: 0,
};

/** 解析 iNES / NES 2.0 文件头 */
export const parseRomHeader = (bytes: Uint8Array | null | undefined): RomInfo => {
  const fileSize = bytes?.length ?? 0;
  if (!bytes || bytes.length < 16) return { ...EMPTY_ROM_INFO, error: 'tooShort', fileSize };
  if (!MAGIC.every((b, i) => bytes[i] === b)) return { ...EMPTY_ROM_INFO, error: 'notNes', fileSize };

  const flags6 = bytes[6];
  const flags7 = bytes[7];
  const isNes2 = (flags7 & 0x0c) === 0x08;

  const prgBanks = isNes2 ? bytes[4] | ((bytes[9] & 0x0f) << 8) : bytes[4];
  const chrBanks = isNes2 ? bytes[5] | ((bytes[9] & 0xf0) << 4) : bytes[5];
  const mapper = isNes2
    ? ((bytes[8] & 0x0f) << 8) | (flags7 & 0xf0) | (flags6 >> 4)
    : (flags7 & 0xf0) | (flags6 >> 4);

  const fourScreen = (flags6 & 0x08) !== 0;
  const mirroring: Mirroring = fourScreen ? 'four-screen' : (flags6 & 0x01) !== 0 ? 'vertical' : 'horizontal';
  const battery = (flags6 & 0x02) !== 0;
  const trainer = (flags6 & 0x04) !== 0;

  // NES 2.0: byte 12 低 2 位定义制式; iNES 1.0: byte 9 bit 0
  const region: Region = isNes2
    ? ([ 'ntsc', 'pal', 'dual', 'dual' ] as Region[])[bytes[12] & 0x03]
    : (bytes[9] & 0x01) !== 0 ? 'pal' : 'ntsc';

  const expected = 16 + (trainer ? 512 : 0) + prgBanks * 16384 + chrBanks * 8192;
  const truncated = fileSize < expected;

  return {
    valid: prgBanks > 0 && !truncated,
    error: prgBanks === 0 ? 'noPrg' : truncated ? 'truncated' : undefined,
    isNes2,
    prgBanks,
    chrBanks,
    mapper,
    mirroring,
    battery,
    trainer,
    region,
    fileSize,
  };
};

/** 字节数 -> 便于阅读的大小 (如 40 KB / 1.5 MB) */
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

/** 存档文件名 (如 'Contra.nesstate') */
export const stateFileName = (romName: string): string => `${romBaseName(romName)}.nesstate`;

/** 时间戳后缀 (yyyymmdd-hhmmss), 用于截屏等文件命名 */
export const timestampSuffix = (date: Date = new Date()): string => {
  const p = (n: number, len = 2) => String(n).padStart(len, '0');
  return `${p(date.getFullYear(), 4)}${p(date.getMonth() + 1)}${p(date.getDate())}`
    + `-${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`;
};

/** 截屏文件名 (如 'Contra-20240131-235959.png') */
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

/** 是否看起来像 NES ROM 文件 */
export const isRomFileName = (fileName: string): boolean => /\.nes$/i.test(String(fileName ?? '').trim());

// ---- 键位映射 ----

export type KeyMap = Record<PadButton, string[]>;

/** 深拷贝键位表 */
export const cloneKeys = (keys: KeyMap): KeyMap => PAD_BUTTONS.reduce((acc, b) => {
  acc[b] = [ ...(keys[b] ?? []) ];
  return acc;
}, {} as KeyMap);

/** 任意输入 -> 合法的键位表 (空 / 非法项回退默认; 同一按键不会绑定到两个手柄键) */
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

/** 键盘按键名 -> 便于展示的文案 (方向键 / 空格等) */
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

/** 每帧间隔 (ms), 1 倍速约 16.64ms */
export const frameIntervalMs = (speed: unknown): number => 1000 / (BASE_FPS * normalizeSpeed(speed));

/** 任意输入 -> 合法音量 (0~100 整数) */
export const normalizeVolume = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return VOLUME_DEFAULT;
  return Math.min(VOLUME_MAX, Math.max(VOLUME_MIN, Math.round(n)));
};

/** 音量 (0~100) -> WebAudio 增益 (0~1) */
export const volumeToGain = (volume: unknown): number => normalizeVolume(volume) / 100;

// ---- 默认设置 (设置中心 / 「配置文件」导入导出共用 getDefault* + setDefault* 成对约定) ----

export interface NesOptions {
  /** 默认音量 0~100 */
  volume: number;
  /** 是否显示 FPS */
  showFps: boolean;
  /** 像素平滑 (关闭时像素风更锐利) */
  smooth: boolean;
  /** 默认倍速 */
  speed: number;
  /** 玩家 1 键位 */
  keys: KeyMap;
}

export const DEFAULT_OPTIONS: NesOptions = {
  volume: VOLUME_DEFAULT,
  showFps: true,
  smooth: false,
  speed: SPEED_DEFAULT,
  keys: normalizeKeys(DEFAULT_KEYS),
};

/** 任意输入 -> 完整合法的选项 */
export const normalizeOptions = (raw?: Partial<NesOptions> | null): NesOptions => ({
  volume: normalizeVolume(raw?.volume),
  showFps: raw?.showFps === undefined ? DEFAULT_OPTIONS.showFps : raw.showFps === true,
  smooth: raw?.smooth === undefined ? DEFAULT_OPTIONS.smooth : raw.smooth === true,
  speed: normalizeSpeed(raw?.speed),
  keys: normalizeKeys(raw?.keys ?? DEFAULT_OPTIONS.keys),
});

/** 读取默认设置 (非法值 / 读取失败一律回退默认) */
export const getDefaultOptions = (): NesOptions => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return normalizeOptions(DEFAULT_OPTIONS);
    return normalizeOptions(JSON.parse(raw) as Partial<NesOptions>);
  } catch {
    return normalizeOptions(DEFAULT_OPTIONS);
  }
};

/** 写入默认设置 (已归一化; 返回真正写入的值) */
export const setDefaultOptions = (raw?: Partial<NesOptions> | null): NesOptions => {
  const next = normalizeOptions(raw);
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 忽略 */
  }
  return next;
};

/** 局部更新默认设置 (未提供的字段保持原值) */
export const patchDefaultOptions = (patch: Partial<NesOptions>): NesOptions =>
  setDefaultOptions({ ...getDefaultOptions(), ...patch });

/** 两组选项是否一致 (用于「保存为默认设置」按钮的禁用状态) */
export const isSameOptions = (a: NesOptions, b: NesOptions): boolean =>
  a.volume === b.volume && a.showFps === b.showFps && a.smooth === b.smooth && a.speed === b.speed
  && PAD_BUTTONS.every((btn) => (a.keys[btn] ?? []).join('|') === (b.keys[btn] ?? []).join('|'));

// ---- 存档 (jsnes 的 toJSON 结果) ----

/** 存档文本 (文件内容): 头部 + Base64 */
export const encodeSaveState = (json: string): string => `${STATE_FILE_HEADER}\n${Base64.encode(json)}`;

/** 存档文本 -> JSON 字符串 (格式错误抛异常) */
export const decodeSaveState = (text: string): string => {
  const raw = String(text ?? '').trim();
  if (raw === '') throw new Error('empty state');
  const body = raw.startsWith(STATE_FILE_HEADER) ? raw.slice(STATE_FILE_HEADER.length).trim() : raw;
  const json = Base64.decode(body);
  // 只做一次语法校验, 确保写回前是合法 JSON
  JSON.parse(json);
  return json;
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

// ---- 最近打开 (只记录元信息, 不保存 ROM 内容) ----

export interface RecentRom {
  name: string;
  mapper: number;
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
        mapper: Number(it.mapper) || 0,
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
