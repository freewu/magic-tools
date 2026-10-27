// 贪吃蛇: 棋盘规格 / 方向 / 速度档位 / 障碍物布局 / 计分 / localStorage key 等常量
// 玩法参考 https://tanchishe.513game.com/ : 20×20 棋盘, 四档速度, 穿墙与障碍物开关, 金苹果 (限时高分)
// 说明: 数值与配色集中在此; 规则与计算逻辑全在 lib.ts (纯函数, 便于单测), 页面只做渲染

/** 棋盘列数 / 行数 (20×20) */
export const COLS = 20;
export const ROWS = 20;

/** 速度档位: 每走一格的间隔 (ms), 数值越小越快 */
export type SpeedKey = 'slow' | 'mid' | 'fast' | 'insane';

/** 档位顺序 (界面上按此顺序展示) */
export const SPEED_ORDER: readonly SpeedKey[] = [ 'slow', 'mid', 'fast', 'insane' ];

export const SPEED_MS: Record<SpeedKey, number> = {
  slow: 280,
  mid: 200,
  fast: 150,
  insane: 110,
};

export const SPEED_DEFAULT: SpeedKey = 'mid';

/** 方向 */
export type Dir = 'up' | 'down' | 'left' | 'right';

/** 方向顺序 (屏幕方向盘按此顺序: 上 下 左 右) */
export const DIR_LIST: readonly Dir[] = [ 'up', 'down', 'left', 'right' ];

/** 每个方向的坐标增量 (y 向下为正) */
export const DIR_DELTA: Record<Dir, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/** 反方向 (禁止 180 度掉头) */
export const OPPOSITE: Record<Dir, Dir> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

/** 开局蛇身 (头在数组第一位), 朝右, 长度 3 */
export const START_SNAKE: readonly { x: number; y: number }[] = [
  { x: 9, y: 10 },
  { x: 8, y: 10 },
  { x: 7, y: 10 },
];

/** 开局方向 */
export const START_DIR: Dir = 'right';

/** 打开「障碍物」后固定出现的障碍格子 (左右对称的 12 格) */
export const WALL_MAP: readonly { x: number; y: number }[] = [
  { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 13, y: 5 }, { x: 14, y: 5 },
  { x: 5, y: 14 }, { x: 6, y: 14 }, { x: 13, y: 14 }, { x: 14, y: 14 },
  { x: 9, y: 3 }, { x: 10, y: 3 }, { x: 9, y: 16 }, { x: 10, y: 16 },
];

/** 吃到普通苹果 / 金苹果的得分 */
export const SCORE_APPLE = 10;
export const SCORE_GOLD = 30;

/** 金苹果出现概率, 以及它变成普通苹果前的存活时间 (ms) */
export const GOLD_CHANCE = 0.22;
export const GOLD_LIFE_MS = 9000;

/** 转向指令队列上限 (连按几下方向键时最多缓存几个) */
export const QUEUE_MAX = 3;

/** 最高分 / 默认设置存档 key */
export const BEST_STORAGE_KEY = 'magic-tools-snake-best';
export const DEFAULTS_STORAGE_KEY = 'magic-tools-snake-defaults';

/** 棋盘边长 (CSS 长度表达式): 普通模式居中, 全屏模式按视口铺满 */
export const BOARD_SIZE_CSS = 'min(88vw, 46vh)';
export const BOARD_SIZE_CSS_FULL = 'min(64vw, 58vh)';

/** 蛇头 / 蛇身 / 苹果 / 金苹果 / 障碍配色 */
export const COLOR_HEAD = '#22c55e';
export const COLOR_BODY = '#4ade80';
export const COLOR_TAIL = '#86efac';
export const COLOR_APPLE = '#ef4444';
export const COLOR_GOLD = '#f59e0b';
export const COLOR_WALL = 'rgba(100, 116, 139, 0.55)';
export const CELL_BG = 'rgba(148, 163, 184, 0.10)';
export const GRID_LINE = 'rgba(148, 163, 184, 0.22)';

/** 棋盘 / 蛇身 / 食物 / 方向盘样式 (只做视觉, 不影响逻辑) */
export const SNAKE_CSS = `
.sk-stage { box-sizing: border-box; }
.sk-stage.sk-full { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center;
  justify-content: center; gap: 20px; padding: 16px; overflow: auto; background: var(--sk-bg, #12161f); }
.sk-wrap { display: flex; align-items: flex-start; justify-content: center; gap: 16px; flex-wrap: wrap; }
.sk-board-box { position: relative; flex: none; }
.sk-board { display: grid; grid-template-columns: repeat(${COLS}, 1fr); width: var(--sk-board);
  max-width: 100%; padding: 4px; border-radius: 8px; background: var(--sk-board-bg, #0f1420);
  box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.25); touch-action: none;
  user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; -webkit-user-drag: none; }
.sk-cell { position: relative; aspect-ratio: 1 / 1; box-sizing: border-box; box-shadow: inset 0 0 0 0.5px ${GRID_LINE}; }
.sk-cell:not([data-filled=""]) { box-shadow: inset 0 0 0 0.5px ${GRID_LINE}; }
.sk-seg { position: absolute; inset: 1px; border-radius: 3px; }
.sk-head { position: absolute; inset: 0; border-radius: 4px; background: ${COLOR_HEAD};
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.22), 0 0 6px rgba(34, 197, 94, 0.55); }
.sk-body { position: absolute; inset: 1px; border-radius: 3px; background: ${COLOR_BODY};
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.18); }
.sk-tail { position: absolute; inset: 2px; border-radius: 3px; background: ${COLOR_TAIL};
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.14); }
.sk-apple { position: absolute; inset: 3px; border-radius: 50%; background: ${COLOR_APPLE};
  box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.18); }
.sk-gold { position: absolute; inset: 2px; border-radius: 50%; background: ${COLOR_GOLD};
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.75); animation: sk-pulse 900ms ease-in-out infinite; }
.sk-wall { position: absolute; inset: 1px; border-radius: 2px; background: ${COLOR_WALL}; }
@keyframes sk-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.14); } }
.sk-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; gap: 8px; align-items: center;
  justify-content: center; border-radius: 8px; background: rgba(15, 20, 32, 0.82); color: #f1f5f9;
  font-weight: 700; text-align: center; padding: 12px; z-index: 2; }
.sk-dpad { display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr);
  gap: 6px; width: 156px; }
.sk-side { display: flex; flex-direction: column; gap: 10px; flex: 1 1 190px; min-width: 190px; }
@media (prefers-reduced-motion: reduce) { .sk-gold { animation: none; } }
`;
