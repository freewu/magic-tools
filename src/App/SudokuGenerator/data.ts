// 数独生成器: 题型 / 难度 / 版式常量 (zh 原文即文案 key, 由 lang.ts 翻译)

/** 支持的宫格规格: 4 宫 (4×4) / 6 宫 (6×6) / 9 宫 (9×9) */
export type GridSize = 4 | 6 | 9;

export const GRID_SIZES: GridSize[] = [4, 6, 9];

/** 每宫的行列数: 4 宫 = 2×2 宫, 6 宫 = 2 行 3 列宫, 9 宫 = 3×3 宫 */
export const BOX_SHAPE: Record<GridSize, { rows: number; cols: number }> = {
  4: { rows: 2, cols: 2 },
  6: { rows: 2, cols: 3 },
  9: { rows: 3, cols: 3 },
};

/** 难度三级: 高 / 中 / 低 */
export type Difficulty = 'hard' | 'medium' | 'easy';

export const DIFFICULTIES: Difficulty[] = ['hard', 'medium', 'easy'];

/**
 * 难度对应的目标提示数 (题目里保留的数字个数)。
 * 挖空到该数量即停; 因需保证唯一解, 实际提示数可能略多。
 */
export const TARGET_CLUES: Record<GridSize, Record<Difficulty, number>> = {
  4: { hard: 6, medium: 8, easy: 10 },
  6: { hard: 13, medium: 17, easy: 22 },
  9: { hard: 26, medium: 34, easy: 45 },
};

/** A4 每页放几个宫格: 4 宫 4 个 / 6 宫上下 2 个 / 9 宫 1 个 */
export const PER_PAGE: Record<GridSize, number> = { 4: 4, 6: 2, 9: 1 };

/** 每页排布 (列数 × 行数), 与 PER_PAGE 一致 */
export const PAGE_LAYOUT: Record<GridSize, { cols: number; rows: number }> = {
  4: { cols: 2, rows: 2 },
  6: { cols: 1, rows: 2 },
  9: { cols: 1, rows: 1 },
};

/** 打印内容: 仅题目 / 仅答案 (红色) / 题目 + 答案 */
export type PrintMode = 'puzzle' | 'answer' | 'both';

export const PRINT_MODES: PrintMode[] = ['puzzle', 'answer', 'both'];

export const PAGES_MIN = 1;
export const PAGES_MAX = 20;
export const PAGES_DEFAULT = 4;

export const TITLE_DEFAULT = '数独练习';

/** 宫格线宽 (mm): 宫内细线 / 宫与宫之间的粗线 */
export const CELL_LINE_MM = 0.25;
export const BOX_LINE_MM = 0.6;
export const LINE_COLOR = '#444444';
/** 每页内宫格之间的间距与每题标题行高 (mm) */
export const GRID_GAP_MM = 8;
export const CAPTION_MM = 8;

/** 设置项存储 key */
export const KEY_SIZE = 'sudoku-generator.size';
export const KEY_DIFFICULTY = 'sudoku-generator.difficulty';
export const KEY_PAGES = 'sudoku-generator.pages';
export const KEY_MODE = 'sudoku-generator.mode';

/** 题型显示名 (zh 原文) */
export const sizeLabel = (size: GridSize): string => `${size} 宫格`;

/** 难度显示名 (zh 原文) */
export const difficultyLabel = (d: Difficulty): string => (d === 'hard' ? '高' : d === 'medium' ? '中' : '低');
