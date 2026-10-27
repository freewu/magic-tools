// Sega 模拟器: 选项读写 / ROM 文件名解析 / 播放器页 URL / 消息解析等纯逻辑
// 页面 (index.tsx) 只做渲染与副作用, 这里全部是可直接单测的纯函数
import {
  CORE_BY_EXT, CORE_LABELS, DEFAULT_CORE, MSG_ERROR, MSG_LOADING, MSG_READY, MSG_ROM_FILE, MSG_STARTED, PLAYER_PAGE,
  ROM_EXTENSIONS, SETTINGS_STORAGE_KEY, VOLUME_DEFAULT, VOLUME_MAX, VOLUME_MIN,
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
