// 图片水印: 默认值与取值范围
/** 单边最大像素 (浏览器 canvas 安全上限, 超过会渲染失败) */
export const CANVAS_MAX = 16384;

// ---- 文字水印 ----
/** 字号 (占图片宽度的百分比, 保证不同尺寸图片观感一致) */
export const FONT_SCALE_DEFAULT = 5;
export const FONT_SCALE_MIN = 1;
export const FONT_SCALE_MAX = 30;
/** 自动缩小后的最小字号 (px) */
export const FONT_SIZE_MIN = 8;
/** 行高倍数 */
export const LINE_HEIGHT_RATIO = 1.25;
/** 默认文字颜色 (半透明白在深浅背景上都比较自然, 配合描边可读性更好) */
export const COLOR_DEFAULT = '#ffffff';
/** 描边宽度与字号的比例 (字号 / 12, 至少 1px) */
export const STROKE_RATIO = 12;

// ---- 图片水印 (logo) ----
/** logo 宽度 (占图片宽度的百分比) */
export const LOGO_SCALE_DEFAULT = 20;
export const LOGO_SCALE_MIN = 2;
export const LOGO_SCALE_MAX = 60;

// ---- 通用外观 ----
/** 透明度 */
export const OPACITY_DEFAULT = 0.35;
export const OPACITY_MIN = 0.05;
export const OPACITY_MAX = 1;
/** 边距 (px, 单个水印与图片边缘的距离) */
export const MARGIN_DEFAULT = 24;
export const MARGIN_MAX = 400;
/** 平铺间距 (px, 相邻两个水印之间的空隙) */
export const GAP_DEFAULT = 120;
export const GAP_MIN = 20;
export const GAP_MAX = 600;
/** 旋转角度 (度, 顺时针为正; canvas 坐标为顺时针) */
export const ROTATE_MIN = -90;
export const ROTATE_MAX = 90;
export const ROTATE_STEP = 5;
export const ROTATE_DEFAULT = 0;
/** 切到平铺时的默认倾角 (斜向水印是常见观感) */
export const TILE_ROTATE_DEFAULT = -30;

// ---- 输出 ----
/** JPEG / WebP 质量 */
export const QUALITY_DEFAULT = 0.92;
export const QUALITY_MIN = 0.5;
export const QUALITY_MAX = 1;

// ---- 文件名与预设 ----
/** 文件名主体兜底 */
export const DEFAULT_BASE = 'image';
/** 输出文件名后缀 (避免直接覆盖原图) */
export const NAME_SUFFIX = 'watermark';
/** 文字水印快捷预设 (点一下即填入) */
export const TEXT_PRESETS = [ '内部资料', '仅供内部使用', '机密', '禁止外传', '样张', '© MagicTools' ] as const;
/** 「载入示例文字」用 */
export const TEXT_SAMPLE = '内部资料\n请勿外传';
