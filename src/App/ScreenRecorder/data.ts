// 屏幕录制 (浏览器专享): 封装格式 / 帧率 / 码率 / 音轨 / 分辨率等常量
// 说明: 采集与录制全部走浏览器原生能力 (getDisplayMedia + MediaRecorder), 不依赖桌面端

/** MediaRecorder 支持的编码格式候选 (从前到后挑第一个浏览器支持的) */
export interface MimeCandidate {
  /** MIME 串 ('' 表示交给浏览器自己决定) */
  mime: string;
  /** 文件后缀 */
  ext: string;
  /** 下拉/结果展示用标签 (语言无关) */
  label: string;
}

export const MIME_CANDIDATES: readonly MimeCandidate[] = [
  { mime: 'video/webm;codecs=vp9,opus', ext: 'webm', label: 'WebM · VP9 + Opus' },
  { mime: 'video/webm;codecs=vp8,opus', ext: 'webm', label: 'WebM · VP8 + Opus' },
  { mime: 'video/webm', ext: 'webm', label: 'WebM' },
  { mime: 'video/mp4;codecs=h264,aac', ext: 'mp4', label: 'MP4 · H.264 + AAC' },
  { mime: 'video/mp4', ext: 'mp4', label: 'MP4' },
];

/** 帧率候选 */
export const FPS_OPTIONS: readonly number[] = [ 15, 24, 30, 60 ];
export const FPS_DEFAULT = 30;
export const FPS_MIN = 5;
export const FPS_MAX = 60;

/** 视频码率候选 (bps) */
export const BITRATE_OPTIONS: readonly number[] = [ 2_000_000, 4_000_000, 8_000_000, 16_000_000 ];
export const BITRATE_DEFAULT = 8_000_000;
export const BITRATE_MIN = 500_000;
export const BITRATE_MAX = 40_000_000;
/** 声音轨道码率 */
export const AUDIO_BITRATE = 128_000;

/** 声音来源: 不录 / 只录系统声音 / 系统声音 + 麦克风 */
export type AudioMode = 'none' | 'system' | 'both';
export const AUDIO_OPTIONS: readonly AudioMode[] = [ 'none', 'system', 'both' ];
export const AUDIO_DEFAULT: AudioMode = 'none';

/** 分辨率上限: 原始 = 不限制, 其余按高度限制 */
export type SizeKey = 'source' | '1080p' | '720p';
export const SIZE_OPTIONS: ReadonlyArray<{ value: SizeKey; maxHeight: number | null }> = [
  { value: 'source', maxHeight: null },
  { value: '1080p', maxHeight: 1080 },
  { value: '720p', maxHeight: 720 },
];
export const SIZE_DEFAULT: SizeKey = 'source';
/** 16:9 推导宽度上限时使用 (只限制上限, 不会放大画面) */
export const ASPECT = 16 / 9;

/** 录制分片切片时长 (ms): 每 1s 落一个 Blob, 长时间录制不必把整段留在内存里等最后一次性产出 */
export const TIMESLICE_MS = 1000;
/** 时长 / 大小刷新间隔 (ms) */
export const CLOCK_INTERVAL_MS = 250;

/** 文件名默认前缀 (设置中心可改) */
export const FILE_PREFIX_DEFAULT = 'screen-recording';
export const FILE_PREFIX_MAX = 40;
/** 文件名里不允许出现的字符 (跨平台) */
export const FILE_ILLEGAL = /[\\/:*?"<>|\u0000-\u001f]/g;

/** 录制中红点闪烁周期 (CSS) */
export const REC_DOT_MS = 1000;

/** 默认设置 key: 修改入口 设置中心「其它 → 屏幕录制」 */
export const DEFAULTS_STORAGE_KEY = 'screen-recorder-defaults';
