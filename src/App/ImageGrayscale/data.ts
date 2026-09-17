// 图片黑白化: 参数范围与默认值
/** 处理模式: gray = 灰度 (保留明暗层次), binary = 黑白二值 (只有纯黑 / 纯白) */
export const MODES = [ 'gray', 'binary' ] as const;
export type Mode = typeof MODES[number];
export const MODE_DEFAULT: Mode = 'gray';

/** 灰度算法: 亮度 (Rec.709) / 平均 / 最大值 / 最小值 */
export const GRAY_METHODS = [ 'luma', 'average', 'max', 'min' ] as const;
export type GrayMethod = typeof GRAY_METHODS[number];
export const METHOD_DEFAULT: GrayMethod = 'luma';

/** 二值化阈值来源: auto = Otsu 自动, manual = 手动指定 */
export const THRESHOLD_MODES = [ 'auto', 'manual' ] as const;
export type ThresholdMode = typeof THRESHOLD_MODES[number];

/** 手动阈值范围 (0~255) */
export const THRESHOLD_MIN = 0;
export const THRESHOLD_MAX = 255;
export const THRESHOLD_DEFAULT = 128;

/** 结果预览区尺寸上限 (仅影响页面预览, 不影响导出) */
export const PREVIEW_MAX_W = 260;
export const PREVIEW_MAX_H = 200;

/** JPEG / WebP 输出质量 */
export const QUALITY_DEFAULT = 0.92;
export const QUALITY_MIN = 0.5;
export const QUALITY_MAX = 1;

/** 导出文件名后缀: 原名_grayscale.png / 原名_blackwhite.png */
export const FILE_SUFFIX = { gray: 'grayscale', binary: 'blackwhite' } as const;
