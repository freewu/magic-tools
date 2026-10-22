// 扫雷: 难度预设 / 自定义限制 / 格子尺寸 / 图标 / 样式与存档 key 等常量
// 说明: 数值与样式集中在此; 规则与计算逻辑全在 lib.ts (纯函数, 便于单测), 页面只做渲染

/** 难度: 初级 / 中级 / 高级 + 自定义 (规则参考 https://minesweeper.online/ ) */
export type Level = 'beginner' | 'intermediate' | 'expert' | 'custom';
export const LEVELS: readonly Level[] = [ 'beginner', 'intermediate', 'expert', 'custom' ];

/** 棋盘规格: 宽 × 高 (列 × 行) 与雷数 */
export interface Dims {
  width: number;
  height: number;
  mines: number;
}

/** 三个标准难度 (与 Windows 扫雷 / minesweeper.online 一致) */
export const PRESETS: Record<Exclude<Level, 'custom'>, Dims> = {
  beginner: { width: 9, height: 9, mines: 10 },
  intermediate: { width: 16, height: 16, mines: 40 },
  expert: { width: 30, height: 16, mines: 99 },
};

/** 自定义棋盘限制 (与首点安全区 3×3 对应: 雷数最多留出 9 格安全区) */
export const WIDTH_MIN = 5;
export const WIDTH_MAX = 40;
export const HEIGHT_MIN = 5;
export const HEIGHT_MAX = 30;
export const MINES_MIN = 1;

/** 首点安全区: 第一次点击的 3×3 邻域内不放雷 (棋盘太小时自动缩小) */
export const SAFE_AREA = 9;

/** 格子边长档位 (px) */
export const CELL_SIZES: readonly number[] = [ 22, 26, 30 ];
export const CELL_DEFAULT = 26;

/** 触屏长按插旗的判定时长 (ms) */
export const LONG_PRESS_MS = 380;

/** 格子间距 (px) */
export const BOARD_GAP = 2;

/** 表情按钮: 按局面切换 (未开局 / 进行中 / 通关 / 踩雷) */
export const FACES: Record<'ready' | 'playing' | 'won' | 'lost', string> = {
  ready: '🙂',
  playing: '🙂',
  won: '😎',
  lost: '😵',
};

/** 剩余雷数 / 计时 / 最高纪录等统计口径 */
export const CLOCK_TICK_MS = 200;

/** 存档 key */
export const DEFAULTS_STORAGE_KEY = 'magic-tools-minesweeper-defaults';
export const BEST_STORAGE_KEY = 'magic-tools-minesweeper-best';

/** 棋盘 / 页面样式 (只做视觉, 不影响逻辑) */
export const MINESWEEPER_CSS = `
.ms-stage { box-sizing: border-box; }
.ms-stage.ms-full { position: fixed; inset: 0; z-index: 1000; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px; padding: 16px; overflow: auto;
  background: var(--ms-bg, #0f172a); }
.ms-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: center; }
.ms-scroll { max-width: 100%; overflow: auto; }
.ms-board { display: grid; gap: ${BOARD_GAP}px; padding: 4px; border-radius: 6px; width: max-content;
  background: rgba(148, 163, 184, 0.35); touch-action: manipulation; user-select: none; -webkit-user-select: none; }
.ms-cell { width: var(--ms-cell); height: var(--ms-cell); box-sizing: border-box; padding: 0; border: 0;
  border-radius: 2px; display: flex; align-items: center; justify-content: center; cursor: pointer;
  font-weight: 700; font-size: calc(var(--ms-cell) * 0.56); line-height: 1; font-variant-numeric: tabular-nums;
  color: #f8fafc; background-color: #64748b;
  background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0));
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.35), inset 1px 1px 0 rgba(255, 255, 255, 0.35); }
.ms-cell:hover:not(.ms-open) { filter: brightness(1.08); }
.ms-cell:active:not(.ms-open) { filter: brightness(0.94); }
.ms-cell.ms-open { cursor: default; background: rgba(148, 163, 184, 0.18); background-image: none;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.4); color: #334155; }
.ms-cell.ms-mine { background-color: #ef4444; background-image: none; color: #fff; }
.ms-cell.ms-boom { background-color: #b91c1c; background-image: none; color: #fff; }
.ms-cell.ms-wrong { background-color: #f59e0b; background-image: none; color: #fff; }
.ms-cell.ms-flag { color: #fff; }
.ms-cell[data-n="1"] { color: #1d4ed8; }
.ms-cell[data-n="2"] { color: #15803d; }
.ms-cell[data-n="3"] { color: #dc2626; }
.ms-cell[data-n="4"] { color: #4c1d95; }
.ms-cell[data-n="5"] { color: #9a3412; }
.ms-cell[data-n="6"] { color: #0e7490; }
.ms-cell[data-n="7"] { color: #111827; }
.ms-cell[data-n="8"] { color: #6b7280; }
.ms-face { font-size: 20px; line-height: 1; width: 34px; height: 30px; padding: 0; }
@media (prefers-reduced-motion: reduce) { .ms-cell { transition: none; } }
`;
