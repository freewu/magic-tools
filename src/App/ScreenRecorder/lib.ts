// 屏幕录制: 纯逻辑 (能力检测 / 编码格式挑选 / 参数校验 / 文件命名 / 默认设置读写)
// 说明: 本文件不直接调用浏览器 API, 仅做判定与格式化, 便于单测
import {
  ASPECT,
  AUDIO_DEFAULT,
  AUDIO_OPTIONS,
  BITRATE_DEFAULT,
  BITRATE_MAX,
  BITRATE_MIN,
  BITRATE_OPTIONS,
  DEFAULTS_STORAGE_KEY,
  FILE_ILLEGAL,
  FILE_PREFIX_DEFAULT,
  FILE_PREFIX_MAX,
  FPS_DEFAULT,
  FPS_MAX,
  FPS_MIN,
  FPS_OPTIONS,
  MIME_CANDIDATES,
  SIZE_DEFAULT,
  SIZE_OPTIONS,
  type AudioMode,
  type MimeCandidate,
  type SizeKey,
} from './data';

/** 录制参数 (页面状态 + 默认设置共用同一结构) */
export interface RecorderOptions {
  /** 帧率 */
  fps: number;
  /** 视频码率 (bps) */
  bitrate: number;
  /** 声音来源 */
  audio: AudioMode;
  /** 分辨率上限 */
  size: SizeKey;
  /** 文件名前缀 */
  prefix: string;
}

export const DEFAULT_OPTIONS: RecorderOptions = {
  fps: FPS_DEFAULT,
  bitrate: BITRATE_DEFAULT,
  audio: AUDIO_DEFAULT,
  size: SIZE_DEFAULT,
  prefix: FILE_PREFIX_DEFAULT,
};

const toNum = (v: unknown): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : Number.NaN;
  if (typeof v === 'string' && v.trim() !== '') return Number(v);
  return Number.NaN;
};

/** 帧率: 取候选列表里最接近的一个 (非正数 / 非数字回退默认) */
export const clampFps = (v: unknown): number => {
  const n = toNum(v);
  if (!Number.isFinite(n) || n <= 0) return FPS_DEFAULT;
  let best = FPS_OPTIONS[0];
  for (const opt of FPS_OPTIONS) {
    if (Math.abs(opt - n) < Math.abs(best - n)) best = opt;
  }
  return best;
};

/** 码率: 取候选列表里最接近的一个 (非正数 / 非数字回退默认) */
export const clampBitrate = (v: unknown): number => {
  const n = toNum(v);
  if (!Number.isFinite(n) || n <= 0) return BITRATE_DEFAULT;
  let best = BITRATE_OPTIONS[0];
  for (const opt of BITRATE_OPTIONS) {
    if (Math.abs(opt - n) < Math.abs(best - n)) best = opt;
  }
  return Math.min(BITRATE_MAX, Math.max(BITRATE_MIN, best));
};

/** 声音来源: 非法值回退默认 */
export const normalizeAudio = (v: unknown): AudioMode =>
  AUDIO_OPTIONS.includes(v as AudioMode) ? (v as AudioMode) : AUDIO_DEFAULT;

/** 分辨率: 非法值回退默认 */
export const normalizeSize = (v: unknown): SizeKey =>
  SIZE_OPTIONS.some((s) => s.value === v) ? (v as SizeKey) : SIZE_DEFAULT;

/** 文件名前缀: 去掉非法字符与空白, 空则回退默认 */
export const normalizePrefix = (v: unknown): string => {
  if (typeof v !== 'string') return FILE_PREFIX_DEFAULT;
  const cleaned = v.replace(FILE_ILLEGAL, '').replace(/^\s+|\s+$/g, '').slice(0, FILE_PREFIX_MAX);
  return cleaned === '' ? FILE_PREFIX_DEFAULT : cleaned;
};

/** 任意输入 -> 完整合法的参数 */
export const normalizeOptions = (raw?: Partial<RecorderOptions> | null): RecorderOptions => ({
  fps: clampFps(raw?.fps),
  bitrate: clampBitrate(raw?.bitrate),
  audio: normalizeAudio(raw?.audio),
  size: normalizeSize(raw?.size),
  prefix: normalizePrefix(raw?.prefix),
});

/** 读取默认设置 (读取失败/非法值一律回退默认) */
export const getDefaultOptions = (): RecorderOptions => {
  try {
    const raw = localStorage.getItem(DEFAULTS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_OPTIONS };
    return normalizeOptions(JSON.parse(raw) as Partial<RecorderOptions>);
  } catch {
    return { ...DEFAULT_OPTIONS };
  }
};

/** 写入默认设置 (已归一化; 返回真正写入的值) */
export const setDefaultOptions = (raw?: Partial<RecorderOptions> | null): RecorderOptions => {
  const next = normalizeOptions(raw);
  try {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 隐私模式等场景写入失败: 忽略 */
  }
  return next;
};

/** 局部更新默认设置 (未提供的字段保持原值) */
export const patchDefaultOptions = (patch: Partial<RecorderOptions>): RecorderOptions =>
  setDefaultOptions({ ...getDefaultOptions(), ...patch });

/** 两组参数是否一致 (用于「保存为默认设置」按钮的禁用状态) */
export const isSameOptions = (a: RecorderOptions, b: RecorderOptions): boolean =>
  a.fps === b.fps &&
  a.bitrate === b.bitrate &&
  a.audio === b.audio &&
  a.size === b.size &&
  a.prefix === b.prefix;

/** 能力检测环境 (便于单测注入) */
export interface SupportEnv {
  getDisplayMedia?: unknown;
  MediaRecorder?: unknown;
}

export interface Support {
  /** 是否支持屏幕采集 */
  screen: boolean;
  /** 是否支持录制器 */
  recorder: boolean;
  /** 两者齐备才算支持 */
  supported: boolean;
}

/** 检测浏览器是否具备屏幕录制能力 (缺一不可) */
export const detectSupport = (env?: SupportEnv): Support => {
  const gdm = env
    ? env.getDisplayMedia
    : typeof navigator !== 'undefined'
      ? navigator.mediaDevices?.getDisplayMedia
      : undefined;
  const rec = env
    ? env.MediaRecorder
    : typeof window !== 'undefined'
      ? (window as unknown as { MediaRecorder?: unknown }).MediaRecorder
      : undefined;
  const screen = typeof gdm === 'function';
  const recorder = typeof rec === 'function';
  return { screen, recorder, supported: screen && recorder };
};

/** 从候选格式里挑第一个浏览器支持的 (isTypeSupported 抛错时按不支持处理) */
export const pickMimeType = (
  isSupported: (mime: string) => boolean,
  candidates: readonly MimeCandidate[] = MIME_CANDIDATES
): MimeCandidate | null => {
  for (const c of candidates) {
    try {
      if (isSupported(c.mime)) return c;
    } catch {
      /* 忽略: 当作不支持继续试下一个 */
    }
  }
  return null;
};

/** MIME -> 文件后缀 (浏览器默认格式按 webm 处理: 目前 Chromium / Firefox 都产出 webm) */
export const extensionOf = (mime: string): string => {
  const m = String(mime ?? '').toLowerCase();
  if (m.includes('mp4')) return 'mp4';
  if (m.includes('webm')) return 'webm';
  return 'webm';
};

/** 采集时的视频约束 (只限制上限, 不放大; 分辨率选择「原始」时不加宽高约束) */
export const videoConstraintsOf = (
  options: Pick<RecorderOptions, 'fps' | 'size'>
): MediaTrackConstraints => {
  const maxHeight = SIZE_OPTIONS.find((s) => s.value === options.size)?.maxHeight ?? null;
  const constraints: MediaTrackConstraints = { frameRate: clampFps(options.fps) };
  if (maxHeight !== null) {
    constraints.height = { max: maxHeight };
    constraints.width = { max: Math.round(maxHeight * ASPECT) };
  }
  return constraints;
};

/** 是否需要向用户申请麦克风 */
export const needsMic = (audio: AudioMode): boolean => audio === 'both';

/** 毫秒 -> h:mm:ss / m:ss */
export const formatDuration = (ms: unknown): string => {
  const total = Math.max(0, Math.floor((Number.isFinite(toNum(ms)) ? toNum(ms) : 0) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

/** 字节 -> 人类可读 (保留 1 位小数) */
export const formatBytes = (bytes: unknown): string => {
  const n = Number.isFinite(toNum(bytes)) ? Math.max(0, toNum(bytes)) : 0;
  if (n < 1024) return `${Math.round(n)} B`;
  const units = [ 'KB', 'MB', 'GB', 'TB' ];
  let value = n / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
};

/** 每分钟预计产出的文件大小 (字节): 码率 / 8 * 60 */
export const estimateBytesPerMinute = (bitrate: unknown): number =>
  Math.round((clampBitrate(bitrate) / 8) * 60);

const pad2 = (n: number) => String(n).padStart(2, '0');

/** 文件名: screen-recording-20260926-153012.webm */
export const recordFileName = (prefix: unknown, ext: string, date: Date = new Date()): string => {
  const base = normalizePrefix(prefix);
  const suffix = String(ext ?? '').replace(/^\./, '') || 'webm';
  const stamp = `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`
    + `-${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`;
  return `${base}-${stamp}.${suffix}`;
};

/** 采集到的轨道信息 (用于显示分辨率 / 帧率 / 是否带声音) */
export interface TrackInfo {
  width: number;
  height: number;
  frameRate: number;
  hasAudio: boolean;
}

/** 读取媒体流的视频轨道信息 (设置项缺失时为 0) */
export const trackInfoOf = (stream: {
  getVideoTracks?: () => unknown[];
  getAudioTracks?: () => unknown[];
}): TrackInfo => {
  const videos = typeof stream.getVideoTracks === 'function' ? stream.getVideoTracks() : [];
  const audios = typeof stream.getAudioTracks === 'function' ? stream.getAudioTracks() : [];
  const first = videos[0] as { getSettings?: () => Record<string, unknown> } | undefined;
  const settings = first && typeof first.getSettings === 'function' ? first.getSettings() ?? {} : {};
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : 0);
  return {
    width: num(settings.width),
    height: num(settings.height),
    frameRate: num(settings.frameRate),
    hasAudio: audios.length > 0,
  };
};

/** 是否为空格键 (开始 / 停止) */
export const isToggleKey = (e: { key?: string; code?: string } | null | undefined): boolean => {
  if (!e) return false;
  return e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space';
};

/** 键盘事件是否来自输入控件 (此时快捷键归控件自己处理) */
export const isTypingTarget = (
  node: { tagName?: string; isContentEditable?: boolean } | null | undefined
): boolean => {
  if (!node) return false;
  const tag = String(node.tagName ?? '').toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable === true;
};
