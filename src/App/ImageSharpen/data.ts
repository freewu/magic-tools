// 图片锐化: 参数范围与默认值 (USM 钝化蒙版)
/** 半径 (像素): 参与模糊的邻域范围, 越大越"粗" */
export const RADIUS_MIN = 1;
export const RADIUS_MAX = 5;
export const RADIUS_DEFAULT = 1;

/** 强度 (%): 细节叠加回原图的比例, 100% = 原样叠加, 0% = 不锐化 */
export const AMOUNT_MIN = 0;
export const AMOUNT_MAX = 300;
export const AMOUNT_DEFAULT = 100;

/** 阈值 (0~255): 细节差值小于该值的像素不参与锐化, 用来避免放大噪点 */
export const THRESHOLD_MIN = 0;
export const THRESHOLD_MAX = 255;
export const THRESHOLD_DEFAULT = 0;

/** 结果预览区尺寸上限 (仅影响页面预览, 不影响导出) */
export const PREVIEW_MAX_W = 260;
export const PREVIEW_MAX_H = 200;

/** JPEG / WebP 输出质量 */
export const QUALITY_DEFAULT = 0.92;
export const QUALITY_MIN = 0.5;
export const QUALITY_MAX = 1;

/** 导出文件名后缀: 原名_sharpen.png */
export const FILE_SUFFIX = 'sharpen';
