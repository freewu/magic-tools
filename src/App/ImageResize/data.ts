// 图片尺寸调整: 预设比例与默认值
/** 快捷缩放比例预设 (%) */
export const PERCENT_PRESETS = [ 25, 50, 75, 100 ] as const;

/** 缩放比例范围 (%) */
export const PERCENT_DEFAULT = 50;
export const PERCENT_MIN = 1;
export const PERCENT_MAX = 400;

/** 目标像素范围 */
export const SIZE_MIN = 1;
export const SIZE_MAX = 10000;

/** 单边最大像素 (浏览器 canvas 安全上限, 超过会渲染失败) */
export const CANVAS_MAX = 16384;

/** JPEG 质量 */
export const QUALITY_DEFAULT = 0.92;
export const QUALITY_MIN = 0.5;
export const QUALITY_MAX = 1;

/** 文件名默认后缀 (无法从文件名取到时) */
export const DEFAULT_BASE = 'image';
