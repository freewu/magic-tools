// Sega 模拟器: 选项读写 / ROM 文件名解析 / 播放器页 URL / 消息解析等纯逻辑
// 页面 (index.tsx) 只做渲染与副作用, 这里全部是可直接单测的纯函数
import {
  BUTTON_IDS, CORE_BY_EXT, CORE_LABELS, DEFAULT_CORE, DEFAULT_KEYS, KEYS_STORAGE_KEY, MSG_ERROR, MSG_LOADING, MSG_READY,
  MSG_ROM_FILE, MSG_STARTED, PLAYER_PAGE, ROM_EXTENSIONS, SEGA_BUTTONS, SETTINGS_STORAGE_KEY, VOLUME_DEFAULT, VOLUME_MAX,
  VOLUME_MIN, type SegaButton,
} from './data';

/** 模拟器选项 (设置中心「默认音量 / 启动后自动全屏」) */
export type SegaOptions = {
  /** 默认音量 (0~100) */
  volume: number;
  /** 选择 ROM 后自动进入全屏 */
  autoFullscreen: boolean;
};

export const DEFAULT_OPTIONS: SegaOptions = {
  volume: VOLUME_DEFAULT,
  autoFullscreen: false,
};

/** 任意输入 -> 合法音量 (非法值回退默认, 越界 clamp) */
export const normalizeVolume = (value: unknown): number => {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return VOLUME_DEFAULT;
  return Math.min(VOLUME_MAX, Math.max(VOLUME_MIN, Math.round(num)));
};

/** 任意输入 -> 完整合法的选项 */
export const normalizeOptions = (raw?: Partial<SegaOptions> | null): SegaOptions => ({
  volume: raw?.volume === undefined ? DEFAULT_OPTIONS.volume : normalizeVolume(raw.volume),
  autoFullscreen: raw?.autoFullscreen === undefined ? DEFAULT_OPTIONS.autoFullscreen : raw.autoFullscreen === true,
});

/** 读取默认设置 (非法值 / 读取失败一律回退默认) */
export const getDefaultOptions = (): SegaOptions => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return normalizeOptions(DEFAULT_OPTIONS);
    return normalizeOptions(JSON.parse(raw) as Partial<SegaOptions>);
  } catch {
    return normalizeOptions(DEFAULT_OPTIONS);
  }
};

/** 写入默认设置 (已归一化; 返回真正写入的值) */
export const setDefaultOptions = (raw?: Partial<SegaOptions> | null): SegaOptions => {
  const next = normalizeOptions(raw);
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 忽略 */
  }
  return next;
};

/** 局部更新默认设置 (未提供的字段保持原值) */
export const patchDefaultOptions = (patch: Partial<SegaOptions>): SegaOptions =>
  setDefaultOptions({ ...getDefaultOptions(), ...patch });

// ---- 键位 (键盘按键) ----

/** 键位表: 每个手柄按键对应一个 KeyboardEvent.keyCode */
export type SegaKeys = Record<SegaButton, number>;

/** 是否为合法的按键码 (0 表示未绑定, 这里不接受) */
const isKeyCode = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 && value < 256;

/**
 * 任意输入 -> 完整合法的键位表
 * 规则: 缺失 / 非法的项回退默认; 两个按键绑同一个键时, 后一个回退默认 (默认值也被占用则清成 0)
 */
export const normalizeKeys = (raw?: Partial<Record<string, unknown>> | null): SegaKeys => {
  const out = {} as SegaKeys;
  const used = new Set<number>();
  const source = raw && typeof raw === 'object' ? raw : {};
  // 先按默认填, 保证顺序稳定
  SEGA_BUTTONS.forEach((btn) => {
    const value = (source as Record<string, unknown>)[btn];
    const code = isKeyCode(value) && !used.has(value) ? value : 0;
    if (code) used.add(code);
    out[btn] = code;
  });
  SEGA_BUTTONS.forEach((btn) => {
    if (out[btn]) return;
    const fallback = DEFAULT_KEYS[btn];
    if (!used.has(fallback)) {
      out[btn] = fallback;
      used.add(fallback);
    }
  });
  return out;
};

/** 读取本机保存的键位 (读取失败 / 未保存过一律回退默认) */
export const getKeys = (): SegaKeys => {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE_KEY);
    if (!raw) return normalizeKeys(null);
    return normalizeKeys(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return normalizeKeys(null);
  }
};

/** 写入键位 (已归一化; 返回真正写入的值) */
export const setKeys = (raw?: Partial<Record<string, unknown>> | null): SegaKeys => {
  const next = normalizeKeys(raw);
  try {
    localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 忽略 */
  }
  return next;
};

/** 恢复默认键位 (返回默认值, 同时写回本机) */
export const resetKeys = (): SegaKeys => setKeys(DEFAULT_KEYS);

/** 是否改过默认键位 */
export const isCustomKeys = (keys: SegaKeys): boolean =>
  SEGA_BUTTONS.some((btn) => keys[btn] !== DEFAULT_KEYS[btn]);

/** 找一个已经占用该按键的手柄按键 (没有返回 null) */
export const keyOwner = (keys: SegaKeys, code: number, except?: SegaButton): SegaButton | null =>
  SEGA_BUTTONS.find((btn) => btn !== except && keys[btn] === code) ?? null;

/** keyCode -> 显示文本 (字母大写, 方向键用箭头, 未收录的键显示编号) */
export const keyLabelOf = (code: number): string => {
  const named: Record<number, string> = {
    8: 'Backspace', 9: 'Tab', 13: 'Enter', 16: 'Shift', 17: 'Ctrl', 18: 'Alt', 19: 'Pause', 20: 'Caps', 27: 'Esc',
    32: 'Space', 33: 'PgUp', 34: 'PgDn', 35: 'End', 36: 'Home', 37: '←', 38: '↑', 39: '→', 40: '↓',
    45: 'Insert', 46: 'Delete', 91: 'Win', 92: 'Win', 93: 'Menu',
    186: ';', 187: '=', 188: ',', 189: '-', 190: '.', 191: '/', 192: '`',
    219: '[', 220: '\\', 221: ']', 222: "'",
  };
  if (!isKeyCode(code)) return '-';
  if (named[code]) return named[code];
  if (code >= 48 && code <= 57) return String(code - 48);
  if (code >= 65 && code <= 90) return String.fromCharCode(code);
  if (code >= 96 && code <= 105) return `Num${code - 96}`;
  if (code >= 112 && code <= 123) return `F${code - 111}`;
  return `#${code}`;
};

/**
 * 键位表 -> 播放器页需要的「按钮编号 -> keyCode」映射
 * 播放器页只按编号赋值, 不用认识按键名字, 两边保持解耦
 */
export const keysToIds = (keys: SegaKeys): Record<string, number> => {
  const ids: Record<string, number> = {};
  SEGA_BUTTONS.forEach((btn) => {
    const code = keys[btn];
    if (isKeyCode(code)) ids[String(BUTTON_IDS[btn])] = code;
  });
  return ids;
};

/** 键位表 -> 播放器页 URL 参数 (JSON 字符串) */
export const keysParam = (keys: SegaKeys): string => JSON.stringify(keysToIds(keys));

// ---- ROM 文件名 ----

/** 小写扩展名 (带点; 无扩展名返回空串) */
export const extOf = (fileName: string): string => {
  const name = String(fileName ?? '').trim();
  const idx = name.lastIndexOf('.');
  if (idx <= 0 || idx === name.length - 1) return '';
  return name.slice(idx).toLowerCase();
};

/** 去掉扩展名的文件名 (用作存档名) */
export const romBaseName = (fileName: string): string => {
  const name = String(fileName ?? '').trim();
  const ext = extOf(name);
  return ext ? name.slice(0, -ext.length) : name;
};

/** 是否为支持的 ROM 文件名 (只认扩展名, 内容由模拟核心判断) */
export const isRomFileName = (fileName: string): boolean =>
  (ROM_EXTENSIONS as readonly string[]).includes(extOf(fileName));

/**
 * 按扩展名判断该用哪颗核心: Master System / Game Gear 各一颗, 其余 (含压缩包) 按 Mega Drive
 */
export const coreOfRomName = (fileName: string): string => CORE_BY_EXT[extOf(fileName)] ?? DEFAULT_CORE;

/** 核心名 -> 机型显示名 */
export const coreLabelOf = (core: string): string => CORE_LABELS[core] ?? CORE_LABELS[DEFAULT_CORE];

/** 文件大小 -> 可读文本 */
export const formatFileSize = (bytes: unknown): string => {
  const size = typeof bytes === 'number' && Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${size} B`;
};

// ---- 播放器页 URL ----

/** 应用语言 -> EmulatorJS 界面语言 (它只有 zh-CN / en-US 两个中文相关的语言包) */
export const playerLang = (locale: string): string => {
  if (locale === 'zh-CN') return 'zh-CN';
  if (locale === 'zh-TW') return 'zh-CN';
  return 'en-US';
};

export type PlayerUrlOptions = {
  /** 应用语言 (zh-CN / zh-TW / en) */
  locale: string;
  /** 音量 (0~100) */
  volume: number;
  /** 核心名, 缺省按 Mega Drive */
  core?: string;
  /** 键位表, 缺省用默认键位 */
  keys?: SegaKeys;
};

/**
 * 播放器页地址 (相对当前页面解析: Web 版在 /tools/ 子路径下, 桌面端在应用协议根目录下)
 * 注意: 用 HashRouter, 所以 location.hash 不参与解析, 只在末尾追加一份
 */
export const playerUrl = (opts: PlayerUrlOptions, href?: string): string => {
  const base = href ?? (typeof window === 'undefined' ? 'http://localhost/' : window.location.href);
  const url = new URL(PLAYER_PAGE, base);
  url.searchParams.set('lang', playerLang(opts.locale));
  url.searchParams.set('volume', String(normalizeVolume(opts.volume)));
  url.searchParams.set('core', opts.core ?? DEFAULT_CORE);
  url.searchParams.set('keys', keysParam(opts.keys ?? normalizeKeys(null)));
  url.hash = '';
  return url.href;
};

// ---- 播放器页 -> 父页面的消息 ----

export type PlayerMessage =
  | { kind: 'loading'; name: string }
  | { kind: 'ready'; name: string }
  | { kind: 'started'; name: string }
  | { kind: 'error'; message: string }
  | { kind: 'rom-file'; file: File };

/** 是否像 File (跨 realm 时 instanceof 会失效, 用字段判断) */
export const isFileLike = (value: unknown): value is File => {
  if (typeof value !== 'object' || value === null) return false;
  const file = value as File;
  return typeof file.name === 'string' && typeof file.size === 'number';
};

/** 解析播放器页发来的消息 (非法消息返回 null) */
export const parsePlayerMessage = (data: unknown): PlayerMessage | null => {
  if (typeof data !== 'object' || data === null) return null;
  const msg = data as { type?: unknown; name?: unknown; message?: unknown; file?: unknown };
  if (msg.type === MSG_LOADING) return { kind: 'loading', name: String(msg.name ?? '') };
  if (msg.type === MSG_READY) return { kind: 'ready', name: String(msg.name ?? '') };
  if (msg.type === MSG_STARTED) return { kind: 'started', name: String(msg.name ?? '') };
  if (msg.type === MSG_ERROR) return { kind: 'error', message: String(msg.message ?? '') };
  if (msg.type === MSG_ROM_FILE && isFileLike(msg.file)) return { kind: 'rom-file', file: msg.file };
  return null;
};

/** 从拖放 / 选择结果里取出第一个文件 */
export const pickRomFile = (input: unknown): File | null => {
  if (!input) return null;
  if (isFileLike(input)) return input;
  const list = input as ArrayLike<unknown>;
  if (typeof list.length === 'number' && list.length > 0) {
    const first = list[0];
    if (isFileLike(first)) return first;
  }
  return null;
};
