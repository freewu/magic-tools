// 俄罗斯方块: 棋盘规格 / 七种方块形状 / 配色 / 计分 / localStorage key 等常量
// 说明: 数值、形状与配色集中在此; 规则与计算逻辑全在 lib.ts (纯函数, 便于单测), 页面只做渲染

/** 棋盘列数 / 行数 (标准 10×20) */
export const BOARD_COLS = 10;
export const BOARD_ROWS = 20;

/** 七种方块 */
export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';
export const PIECE_TYPES: readonly PieceType[] = [ 'I', 'J', 'L', 'O', 'S', 'T', 'Z' ];

/**
 * 每种方块的 4 个旋转态 (SRS 形状), 每个格子用相对包围盒左上角的 [行, 列] 偏移表示
 * I 用 4×4 包围盒, 其余用 3×3 包围盒
 */
export const SHAPES: Record<PieceType, ReadonlyArray<ReadonlyArray<readonly [ number, number ]>>> = {
  I: [
    [ [ 1, 0 ], [ 1, 1 ], [ 1, 2 ], [ 1, 3 ] ],
    [ [ 0, 2 ], [ 1, 2 ], [ 2, 2 ], [ 3, 2 ] ],
    [ [ 2, 0 ], [ 2, 1 ], [ 2, 2 ], [ 2, 3 ] ],
    [ [ 0, 1 ], [ 1, 1 ], [ 2, 1 ], [ 3, 1 ] ],
  ],
  J: [
    [ [ 0, 0 ], [ 1, 0 ], [ 1, 1 ], [ 1, 2 ] ],
    [ [ 0, 1 ], [ 0, 2 ], [ 1, 1 ], [ 2, 1 ] ],
    [ [ 1, 0 ], [ 1, 1 ], [ 1, 2 ], [ 2, 2 ] ],
    [ [ 0, 1 ], [ 1, 1 ], [ 2, 0 ], [ 2, 1 ] ],
  ],
  L: [
    [ [ 0, 2 ], [ 1, 0 ], [ 1, 1 ], [ 1, 2 ] ],
    [ [ 0, 1 ], [ 1, 1 ], [ 2, 1 ], [ 2, 2 ] ],
    [ [ 1, 0 ], [ 1, 1 ], [ 1, 2 ], [ 2, 0 ] ],
    [ [ 0, 0 ], [ 0, 1 ], [ 1, 1 ], [ 2, 1 ] ],
  ],
  O: [
    [ [ 0, 1 ], [ 0, 2 ], [ 1, 1 ], [ 1, 2 ] ],
  ],
  S: [
    [ [ 0, 1 ], [ 0, 2 ], [ 1, 0 ], [ 1, 1 ] ],
    [ [ 0, 1 ], [ 1, 1 ], [ 1, 2 ], [ 2, 2 ] ],
    [ [ 1, 1 ], [ 1, 2 ], [ 2, 0 ], [ 2, 1 ] ],
    [ [ 0, 0 ], [ 1, 0 ], [ 1, 1 ], [ 2, 1 ] ],
  ],
  T: [
    [ [ 0, 1 ], [ 1, 0 ], [ 1, 1 ], [ 1, 2 ] ],
    [ [ 0, 1 ], [ 1, 1 ], [ 2, 1 ], [ 1, 2 ] ],
    [ [ 1, 0 ], [ 1, 1 ], [ 1, 2 ], [ 2, 1 ] ],
    [ [ 0, 1 ], [ 1, 0 ], [ 1, 1 ], [ 2, 1 ] ],
  ],
  Z: [
    [ [ 0, 0 ], [ 0, 1 ], [ 1, 1 ], [ 1, 2 ] ],
    [ [ 0, 2 ], [ 1, 1 ], [ 1, 2 ], [ 2, 1 ] ],
    [ [ 1, 0 ], [ 1, 1 ], [ 2, 1 ], [ 2, 2 ] ],
    [ [ 0, 1 ], [ 1, 0 ], [ 1, 1 ], [ 2, 0 ] ],
  ],
};

/** 旋转态的个数 (O 只有一个形状, 旋转时保持不变) */
export const rotationCount = (type: PieceType): number => SHAPES[type].length;

/** 方块配色 */
export const PIECE_COLORS: Record<PieceType, string> = {
  I: '#4ec9e8',
  J: '#5a7bf5',
  L: '#f59f3c',
  O: '#f2cb3a',
  S: '#4cd964',
  T: '#a55eea',
  Z: '#ef5b5b',
};

/** 已锁定方块的描边色 (比底色略深, 提升区分度) */
export const PIECE_BORDER = 'rgba(0, 0, 0, 0.28)';

/** 棋盘空位底色 / 网格线色 */
export const CELL_BG = 'rgba(148, 163, 184, 0.10)';
export const GRID_LINE = 'rgba(148, 163, 184, 0.22)';

/** 消行得分表 (按一次消除的行数): 1 行 100, 2 行 300, 3 行 500, 4 行 (Tetris) 800, 再乘等级 */
export const LINE_SCORES: readonly number[] = [ 0, 100, 300, 500, 800 ];

/** 软降 / 硬降每格得分 */
export const SOFT_DROP_SCORE = 1;
export const HARD_DROP_SCORE = 2;

/** 每消多少行升 1 级 */
export const LINES_PER_LEVEL = 10;

/** 起始等级范围 */
export const LEVEL_MIN = 1;
export const LEVEL_MAX = 10;
export const LEVEL_DEFAULT = 1;

/** 下落间隔 (ms): 等级越高越快 */
export const GRAVITY_BASE_MS = 800;
export const GRAVITY_STEP_MS = 70;
export const GRAVITY_MIN_MS = 90;

/** 「下一个」预览的方块个数 */
export const PREVIEW_QUEUE = 3;

/** 旋转时依次尝试的横向偏移 (简化版 wall kick: 踢墙 / 贴墙旋转) */
export const WALL_KICKS: readonly number[] = [ 0, -1, 1, -2, 2 ];

/** 棋盘边长 (CSS 长度表达式): 普通模式居中, 全屏模式按视口铺满 (高比宽 = 2:1) */
export const BOARD_SIZE_CSS = 'min(84vw, 44vh)';
export const BOARD_SIZE_CSS_FULL = 'min(62vw, 46vh)';

/** 存档 key */
export const DEFAULTS_STORAGE_KEY = 'magic-tools-tetris-defaults';
export const BEST_STORAGE_KEY = 'magic-tools-tetris-best';

/** 棋盘 / 方块样式 (只做视觉, 不影响逻辑) */
export const TETRIS_CSS = `
.t4-stage { box-sizing: border-box; }
.t4-stage.t4-full { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center;
  justify-content: center; gap: 24px; padding: 16px; overflow: auto; background: var(--t4-bg, #12161f); }
.t4-wrap { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; }
.t4-board { display: grid; grid-template-columns: repeat(${BOARD_COLS}, 1fr); width: var(--t4-board);
  max-width: 100%; padding: 4px; border-radius: 8px; background: var(--t4-board-bg, #0f1420);
  box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.25); touch-action: none; user-select: none; }
.t4-cell { position: relative; aspect-ratio: 1 / 1; box-sizing: border-box; }
.t4-cell-grid { box-shadow: inset 0 0 0 0.5px ${GRID_LINE}; }
.t4-piece { position: absolute; inset: 1px; border-radius: 2px; box-shadow: inset 0 0 0 1px ${PIECE_BORDER}; }
.t4-ghost { position: absolute; inset: 1px; border-radius: 2px; box-shadow: inset 0 0 0 2px currentColor;
  opacity: 0.45; }
.t4-side { display: flex; flex-direction: column; gap: 10px; align-items: center; }
.t4-box { display: grid; grid-template-columns: repeat(4, 1fr); width: 76px; padding: 4px; border-radius: 6px;
  background: var(--t4-board-bg, #0f1420); box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.25); }
.t4-box-cell { position: relative; aspect-ratio: 1 / 1; }
.t4-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; gap: 8px; align-items: center;
  justify-content: center; border-radius: 8px; background: rgba(15, 20, 32, 0.82); color: #f1f5f9;
  font-weight: 700; text-align: center; z-index: 2; }
.t4-stage-relative { position: relative; }
@media (prefers-reduced-motion: reduce) { .t4-piece { transition: none; } }
`;
