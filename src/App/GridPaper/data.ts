// 格子纸: 纸张 / 方向 / 格型 / 线色 / 版面常量 (zh 原文即文案 key, 由 lang.ts 翻译)

/** 纸张 (ISO 216, 尺寸为纵向 mm) */
export type PaperId = 'A3' | 'A4' | 'B5' | 'B6';

export interface PaperDef {
  id: PaperId;
  /** 显示名 (含尺寸, 无需翻译) */
  label: string;
  /** 短边 (纵向宽度) */
  w: number;
  /** 长边 (纵向高度) */
  h: number;
}

export const PAPERS: PaperDef[] = [
  { id: 'A3', label: 'A3 (297×420mm)', w: 297, h: 420 },
  { id: 'A4', label: 'A4 (210×297mm)', w: 210, h: 297 },
  { id: 'B5', label: 'B5 (176×250mm)', w: 176, h: 250 },
  { id: 'B6', label: 'B6 (125×176mm)', w: 125, h: 176 },
];

export const PAPER_DEFAULT: PaperId = 'A4';

/** 纸张方向 */
export type Orientation = 'portrait' | 'landscape';

export const ORIENTATIONS: Orientation[] = [ 'portrait', 'landscape' ];

export const ORIENTATION_LABEL: Record<Orientation, string> = {
  portrait: '纵向',
  landscape: '横向',
};

/** 格型: 方格 / 点阵 / 横线 */
export type Pattern = 'grid' | 'dots' | 'lines';

export const PATTERNS: Pattern[] = [ 'grid', 'dots', 'lines' ];

export const PATTERN_LABEL: Record<Pattern, string> = {
  grid: '方格',
  dots: '点阵',
  lines: '横线',
};

/** 线色 (均为浅色, 打印后不干扰书写) */
export type InkColor = 'gray' | 'blue' | 'green' | 'red';

export const INK_COLORS: InkColor[] = [ 'gray', 'blue', 'green', 'red' ];

export const INK_VALUE: Record<InkColor, string> = {
  gray: '#c9c9c9',
  blue: '#a8c1de',
  green: '#a9d3b4',
  red: '#dcaeae',
};

export const INK_LABEL: Record<InkColor, string> = {
  gray: '灰色',
  blue: '蓝色',
  green: '淡绿',
  red: '淡红',
};

export const INK_DEFAULT: InkColor = 'gray';

/** 格子大小 (mm): 边长, 决定网格密度 */
export const CELL_MIN = 2;
export const CELL_MAX = 50;
export const CELL_STEP = 0.5;
export const CELL_DEFAULT = 5;
/** 常用格子大小的快捷选项 */
export const CELL_PRESETS: number[] = [ 3, 5, 8, 10 ];

/** 页边距 (mm): 网格在纸张内的留白 (网格整体居中, 实际边距可能略大于该值) */
export const MARGIN_MIN = 0;
export const MARGIN_MAX = 40;
export const MARGIN_STEP = 1;
export const MARGIN_DEFAULT = 10;

/** 线宽 (mm) */
export const LINE_MIN = 0.1;
export const LINE_MAX = 1;
export const LINE_STEP = 0.05;
export const LINE_DEFAULT = 0.2;
/** 加粗线相对普通线的倍数 */
export const MAJOR_SCALE = 1.9;
/** 点阵圆点半径 = 线宽 × 该倍数 (并保证不小于 DOT_MIN_R) */
export const DOT_R_SCALE = 1.3;
export const DOT_MIN_R = 0.18;

/** 页数 */
export const PAGES_MIN = 1;
export const PAGES_MAX = 20;
export const PAGES_DEFAULT = 1;

/** 加粗间隔: 每 N 格加深一条线, 0 = 关闭 */
export const MAJOR_MIN = 0;
export const MAJOR_MAX = 20;
export const MAJOR_DEFAULT = 0;

/** 打印任务名 */
export const TITLE_DEFAULT = '格子纸';

/** 设置项存储 key (记住上次使用纸张的参数) */
export const KEY_PAPER = 'grid-paper.paper';
export const KEY_ORIENTATION = 'grid-paper.orientation';
export const KEY_PATTERN = 'grid-paper.pattern';
export const KEY_INK = 'grid-paper.ink';
export const KEY_CELL = 'grid-paper.cell';
export const KEY_MARGIN = 'grid-paper.margin';
export const KEY_LINE = 'grid-paper.line';
export const KEY_PAGES = 'grid-paper.pages';
export const KEY_MAJOR = 'grid-paper.major';

/** 版面参数 (生成网格所需的全部输入) */
export interface GridOptions {
  paper: PaperId;
  orientation: Orientation;
  pattern: Pattern;
  ink: InkColor;
  /** 格子边长 (mm) */
  cell: number;
  /** 页边距 (mm) */
  margin: number;
  /** 线宽 (mm) */
  lineWidth: number;
  /** 页数 */
  pages: number;
  /** 每 N 格加粗, 0 = 关闭 */
  major: number;
}
