// 2048 游戏: 棋盘规格 / 胜利目标 / 配色 / localStorage key 等常量
// 说明: 数值与配色集中在此, 规则与计算逻辑全在 lib.ts (纯函数, 便于单测), 页面只做渲染

/** 支持的棋盘边长: 4 (经典) / 5 / 6 (挑战) */
export const BOARD_SIZES = [ 4, 5, 6 ] as const;
export type BoardSize = (typeof BOARD_SIZES)[number];
export const BOARD_SIZE_DEFAULT: BoardSize = 4;

/** 胜利目标: 合成出该数字即通关 (通关后仍可继续挑战更大的数字) */
export const WIN_OPTIONS = [ 512, 1024, 2048, 4096, 8192 ] as const;
export const WIN_DEFAULT = 2048;

/** 开局随机放几个数字方块 */
export const START_TILES = 2;

/** 新方块是 4 的概率 (其余为 2), 与经典规则一致 */
export const FOUR_RATE = 0.1;

/** 撤销可回退的步数上限 (内存中保存, 刷新页面即失效) */
export const UNDO_LIMIT = 20;

/** 新方块 / 合并方块的弹出动画时长 (ms) */
export const ANIM_MS = 130;

/** 动画关闭后仍保留的一点点过渡时长 (ms), 避免瞬间跳变 */
export const ANIM_OFF_MS = 0;

/** 触摸滑动触发一次移动的最小位移 (px) */
export const SWIPE_MIN_PX = 24;

// ---- localStorage ----
/** 设置中心「默认设置」 */
export const DEFAULTS_STORAGE_KEY = 'magic-tools-game2048-defaults';
/** 对局存档 (刷新/切页后继续) */
export const STATE_STORAGE_KEY = 'magic-tools-game2048-state';
/** 最高分 (按棋盘边长分别记录) */
export const BEST_STORAGE_KEY = 'magic-tools-game2048-best';

// ---- 配色 (沿用经典 2048 的米色 / 橙色系) ----
/** 棋盘底色 */
export const BOARD_BG = '#bbada0';
/** 空位底色 */
export const CELL_BG = 'rgba(238, 228, 218, 0.35)';

/** 数字方块配色: bg = 底色, fg = 文字色 */
export const TILE_COLORS: Record<number, { bg: string; fg: string }> = {
  2: { bg: '#eee4da', fg: '#776e65' },
  4: { bg: '#ede0c8', fg: '#776e65' },
  8: { bg: '#f2b179', fg: '#f9f6f2' },
  16: { bg: '#f59563', fg: '#f9f6f2' },
  32: { bg: '#f67c5f', fg: '#f9f6f2' },
  64: { bg: '#f65e3b', fg: '#f9f6f2' },
  128: { bg: '#edcf72', fg: '#f9f6f2' },
  256: { bg: '#edcc61', fg: '#f9f6f2' },
  512: { bg: '#edc850', fg: '#f9f6f2' },
  1024: { bg: '#edc53f', fg: '#f9f6f2' },
  2048: { bg: '#edc22e', fg: '#f9f6f2' },
  4096: { bg: '#3c3a32', fg: '#f9f6f2' },
  8192: { bg: '#2f2d26', fg: '#f9f6f2' },
};
/** 超出配色表的超大数字 (16384 及以上) */
export const TILE_COLOR_HIGH = { bg: '#1f1d18', fg: '#f9f6f2' };

/** 字号系数: 数字位数越多字越小 (系数按格子边长的倍数, 由页面换算成 CSS calc) */
export const TILE_FONT_SCALE: ReadonlyArray<{ digits: number; scale: number }> = [
  { digits: 2, scale: 0.46 },
  { digits: 3, scale: 0.38 },
  { digits: 4, scale: 0.31 },
  { digits: 5, scale: 0.25 },
];
/** 6 位及以上数字的字号系数 */
export const TILE_FONT_SCALE_MIN = 0.21;

/** 棋盘边框 / 格子间距 (px, 参考尺寸下) */
export const BOARD_GAP = 10;
/** 棋盘最大边长 (px): 超出视口宽度时按 88vw 缩放 */
export const BOARD_MAX_PX = 460;

/** 棋盘边长 (CSS 长度表达式): 普通模式居中限宽, 全屏模式按视口铺满 */
export const BOARD_SIZE_CSS = `min(88vw, ${BOARD_MAX_PX}px)`;
export const BOARD_SIZE_CSS_FULL = 'min(86vh, 92vw)';

/** 棋盘样式 (动画 / 方块外观); 只做视觉, 不影响逻辑 */
export const BOARD_CSS = `
.g2048-stage { box-sizing: border-box; }
.g2048-stage.g2048-full { position: fixed; inset: 0; z-index: 1000; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px; padding: 16px; overflow: auto;
  background: var(--g2048-bg, #faf9f7); }
.g2048-bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: center; }
.g2048-board { display: grid; padding: 10px; border-radius: 10px; touch-action: none; user-select: none; box-sizing: border-box; }
.g2048-cell { position: relative; aspect-ratio: 1 / 1; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
.g2048-tile { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; border-radius: 6px;
  font-weight: 700; line-height: 1; transition: background 90ms linear, color 90ms linear; }
.g2048-tile-new { animation: g2048-pop 130ms ease-out; }
.g2048-tile-merge { animation: g2048-bump 130ms ease-out; }
@keyframes g2048-pop { from { transform: scale(0.2); opacity: 0.3; } to { transform: scale(1); opacity: 1; } }
@keyframes g2048-bump { 0% { transform: scale(1); } 55% { transform: scale(1.16); } 100% { transform: scale(1); } }
@media (prefers-reduced-motion: reduce) {
  .g2048-tile-new, .g2048-tile-merge { animation: none; }
}
`;
