// 图片取色: 常量
/** 预览放大倍数选项 (CSS 放大, 不重采样) */
export const ZOOM_OPTIONS = [ 4, 8, 16 ] as const;
export const ZOOM_DEFAULT = 8;

/** 放大镜取样区域边长 (像素), 奇数便于正好对准中心像素 */
export const LOUPE_SPAN = 11;

/** 最近取色最多保留的条数 */
export const RECENT_MAX = 12;
