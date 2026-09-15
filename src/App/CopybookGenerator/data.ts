// 字帖生成器: 格型 / 字体 / 颜色 / 内容模式 / 版式常量 (zh 原文即文案 key, 由 lang.ts 翻译)

/** 格型: 米字格 / 田字格 / 回宫格 / 作文格 */
export type GridStyle = 'mi' | 'tian' | 'hui' | 'zuowen';

export const GRID_STYLES: GridStyle[] = [ 'mi', 'tian', 'hui', 'zuowen' ];

export const GRID_STYLE_LABEL: Record<GridStyle, string> = {
  mi: '米字格',
  tian: '田字格',
  hui: '回宫格',
  zuowen: '作文格',
};

export interface FontOption {
  /** 显示名 (zh 原文, 由 lang.ts 翻译) */
  label: string;
  /** CSS font-family 栈 (中文字体在各平台名称不同, 依次回退) */
  family: string;
}

/** 可选字体 (均为系统自带中文字体, 按平台逐级回退) */
export const FONTS: FontOption[] = [
  { label: '楷体', family: 'KaiTi, STKaiti, "Kaiti SC", 楷体, serif' },
  { label: '行楷', family: 'STXingkai, "Xingkai SC", 行楷, cursive' },
  { label: '隶书', family: 'LiSu, 隶书, serif' },
  { label: '宋体', family: 'SimSun, STSong, "Songti SC", 宋体, serif' },
  { label: '黑体', family: 'SimHei, STHeiti, "Heiti SC", 黑体, sans-serif' },
  { label: '仿宋', family: 'FangSong, STFangsong, 仿宋, serif' },
  { label: '微软雅黑', family: '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", sans-serif' },
];

export const FONT_DEFAULT = '楷体';

/** 自定义上传字体的 @font-face 家族名 (固定名, 避免注入) */
export const CUSTOM_FAMILY = 'CopybookCustom';
/** 自定义字体体积上限 (字节) */
export const MAX_FONT_BYTES = 12 * 1024 * 1024;
export const FONT_ACCEPT = '.ttf,.otf,.woff,.woff2';

/** 格线颜色 */
export type LineColor = 'red' | 'gray' | 'blue' | 'green';

export const LINE_COLORS: LineColor[] = [ 'red', 'gray', 'blue', 'green' ];

export const LINE_COLOR_VALUE: Record<LineColor, string> = {
  red: '#d98a8a',
  gray: '#b9b9b9',
  blue: '#93aed8',
  green: '#92d3a8',
};

export const LINE_COLOR_LABEL: Record<LineColor, string> = {
  red: '红色',
  gray: '灰色',
  blue: '蓝色',
  green: '淡绿',
};

/** 内容模式: 描红 (浅灰) / 黑字 / 首字示范 (每行首格浅灰) / 空白格 */
export type ContentMode = 'trace' | 'ink' | 'demo' | 'blank';

export const CONTENT_MODES: ContentMode[] = [ 'trace', 'ink', 'demo', 'blank' ];

export const CONTENT_MODE_LABEL: Record<ContentMode, string> = {
  trace: '描红 (浅灰)',
  ink: '黑字',
  demo: '首字示范',
  blank: '空白格',
};

/** 文字颜色: 描红 / 示范用浅灰, 黑字模式用近黑 */
export const TEXT_COLOR_GRAY = '#c8c8c8';
export const TEXT_COLOR_INK = '#111111';

/** 各格型的默认行列数 (作文格即稿纸, 默认 15 列 × 20 行) */
export const DEFAULT_GRID: Record<GridStyle, { cols: number; rows: number }> = {
  mi: { cols: 10, rows: 12 },
  tian: { cols: 10, rows: 12 },
  hui: { cols: 10, rows: 12 },
  zuowen: { cols: 15, rows: 20 },
};

export const COLS_MIN = 4;
export const COLS_MAX = 24;
export const COLS_DEFAULT = 10;
export const ROWS_MIN = 3;
export const ROWS_MAX = 24;
export const ROWS_DEFAULT = 12;
export const PAGES_MIN = 1;
export const PAGES_MAX = 10;
export const PAGES_DEFAULT = 2;

/** 格间距 (mm): 相邻格子之间的空隙, 0 = 紧贴 (相邻格共用一条格线) */
export const GAP_MIN = 0;
export const GAP_MAX = 5;
export const GAP_DEFAULT = 0;
export const GAP_STEP = 0.5;

/** 默认文本: 一次填满 10 × 12 的两页还有余, 且是常见名句 */
export const TEXT_DEFAULT = '落霞与孤鹜齐飞秋水共长天一色';
export const TEXT_MAX = 200;
export const TITLE_DEFAULT = '字帖练习';

/** 格线宽 (mm): 外框线 0.3 / 内部辅助线 0.2 */
export const CELL_LINE_MM = 0.3;
export const GUIDE_LINE_MM = 0.2;
/** 页眉 / 页脚预留高度 (mm) */
export const HEADER_MM = 14;
export const FOOTER_MM = 6;
/** 汉字在格内的字号占比 */
export const CHAR_RATIO = 0.72;

/** 设置项存储 key */
export const KEY_STYLE = 'copybook-generator.style';
export const KEY_FONT = 'copybook-generator.font';
export const KEY_LINE = 'copybook-generator.line';
export const KEY_MODE = 'copybook-generator.mode';
export const KEY_COLS = 'copybook-generator.cols';
export const KEY_ROWS = 'copybook-generator.rows';
export const KEY_PAGES = 'copybook-generator.pages';
export const KEY_GAP = 'copybook-generator.gap';
export const KEY_TEXT = 'copybook-generator.text';
export const KEY_LOOP = 'copybook-generator.loop';

/** 上/下 之外的其他常量: 每格字符数上限 (防止一次生成过多页面) */
export const CELLS_MAX = 24 * 24 * 10;
