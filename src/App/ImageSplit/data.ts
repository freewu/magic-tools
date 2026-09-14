// 图片分割: 预设分割布局 (份数 -> 行列) 与默认值
/** 可选的份数 (2 / 3 / 4 / 6 / 9) */
export const PART_OPTIONS = [2, 3, 4, 6, 9] as const;
export type PartCount = (typeof PART_OPTIONS)[number];

/** 分割布局: rows 行 × cols 列, key = `${rows}x${cols}` */
export interface SplitLayout { key: string; parts: PartCount; rows: number; cols: number; }

/** 全部布局 (同一份数可能有横 / 纵两种方向) */
export const SPLIT_LAYOUTS: SplitLayout[] = [
  { key: '1x2', parts: 2, rows: 1, cols: 2 },
  { key: '2x1', parts: 2, rows: 2, cols: 1 },
  { key: '1x3', parts: 3, rows: 1, cols: 3 },
  { key: '3x1', parts: 3, rows: 3, cols: 1 },
  { key: '2x2', parts: 4, rows: 2, cols: 2 },
  { key: '2x3', parts: 6, rows: 2, cols: 3 },
  { key: '3x2', parts: 6, rows: 3, cols: 2 },
  { key: '3x3', parts: 9, rows: 3, cols: 3 },
];

/** 布局按钮文案 (zh 即 key, 渲染处经 lang.ts 取词) */
export const LAYOUT_LABEL: Record<string, string> = {
  '1x2': '左右两份 (1 × 2)',
  '2x1': '上下两份 (2 × 1)',
  '1x3': '三列 (1 × 3)',
  '3x1': '三行 (3 × 1)',
  '2x2': '四宫格 (2 × 2)',
  '2x3': '两行三列 (2 × 3)',
  '3x2': '三行两列 (3 × 2)',
  '3x3': '九宫格 (3 × 3)',
};

/** 默认份数 */
export const DEFAULT_PARTS: PartCount = 4;
/** 默认布局 (份数切换时优先保留) */
export const DEFAULT_LAYOUT_KEY = '2x2';
/** 文件名前缀默认值 */
export const DEFAULT_PREFIX = 'image';
/** JPEG 质量 */
export const QUALITY_DEFAULT = 0.92;
export const QUALITY_MIN = 0.5;
export const QUALITY_MAX = 1;
/** 每块输出宽度: 0 = 保持原尺寸 */
export const WIDTH_AUTO = 0;
export const WIDTH_MIN = 0;
export const WIDTH_MAX = 10000;
/** 预览图块间隔 (px): 0 = 无分割线, 仅影响预览, 不影响导出的图片 */
export const GAP_DEFAULT = 2;
export const GAP_MIN = 0;
export const GAP_MAX = 12;
