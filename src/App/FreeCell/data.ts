// 空档接龙 (FreeCell): 常量 (花色 / 牌值 / 布局 / localStorage key / 样式)
// 规则与计算全在 lib.ts (纯函数, 便于单测), 本文件只放数值、配色与样式

/** 四种花色 (也是收集区从左到右的顺序) */
export type Suit = 'S' | 'H' | 'D' | 'C';
export const SUITS: readonly Suit[] = [ 'S', 'H', 'D', 'C' ];

/** 花色符号 */
export const SUIT_SYMBOL: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };

/** 花色是否为红色 (红桃 / 方块) */
export const IS_RED: Record<Suit, boolean> = { S: false, H: true, D: true, C: false };

/** 牌值文案 (下标即牌值, 0 位占位) */
export const RANK_LABEL: readonly string[] = [
  '', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K',
];

/** 牌值上限 (K) */
export const RANK_MAX = 13;

/** 牌桌列数 (标准空档接龙 8 列) */
export const TABLEAU_COLS = 8;

/** 自由格数量 */
export const FREE_CELL_COUNT = 4;

/** 一副牌张数 */
export const DECK_SIZE = 52;

/** 局号范围 (相同局号必得相同牌局) */
export const SEED_MIN = 1;
export const SEED_MAX = 1000000;
/** 默认局号: 617 是经典可解局 */
export const SEED_DEFAULT = 617;

/** localStorage key: 默认设置 / 战绩 / 上次局号 */
export const DEFAULTS_STORAGE_KEY = 'magic-tools-freecell-defaults';
export const RECORDS_STORAGE_KEY = 'magic-tools-freecell-records';
export const SEED_STORAGE_KEY = 'magic-tools-freecell-seed';

/** 撤销历史的最大深度 */
export const HISTORY_LIMIT = 2000;

/** 牌面宽度 (CSS 长度): 普通模式按视口自适应, 全屏模式更大一些 */
export const CARD_SIZE_CSS = 'min(9vw, 76px)';
export const CARD_SIZE_CSS_FULL = 'min(7vw, 96px)';

/** 牌面 / 棋盘样式 (只做视觉, 不影响逻辑) */
export const FC_CSS = `
.fc-stage { box-sizing: border-box; }
.fc-stage.fc-full { position: fixed; inset: 0; z-index: 1000; display: flex; flex-direction: column;
  gap: 12px; padding: 12px; overflow: auto; background: var(--fc-bg, #12161f); }
.fc-slot { width: var(--fc-w); height: var(--fc-h); border-radius: 6px; box-sizing: border-box; }
.fc-slot-empty { box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.4);
  background: rgba(148, 163, 184, 0.08); }
.fc-card { position: relative; width: var(--fc-w); height: var(--fc-h); border-radius: 6px;
  box-sizing: border-box; background: var(--fc-card-bg, #ffffff); color: #1f2933;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(148, 163, 184, 0.55);
  display: flex; flex-direction: column; justify-content: space-between; padding: 2px 4px;
  font-weight: 700; line-height: 1.05; user-select: none; cursor: pointer;
  touch-action: none; }
.fc-card.is-dragging { opacity: 0.25; }
.fc-card.fc-card-ghost { position: absolute; left: 0; cursor: grabbing;
  box-shadow: 0 14px 26px rgba(0, 0, 0, 0.34), inset 0 0 0 1px rgba(148, 163, 184, 0.55);
  transform: rotate(-1.6deg) scale(1.03); }
.fc-drag-layer { position: fixed; z-index: 1200; pointer-events: none; touch-action: none; }
.fc-slot.is-drop, .fc-col.is-drop { outline: 2px solid #1677ff; outline-offset: 2px; }
.fc-card.is-red { color: #cf1322; }
.fc-card.is-black { color: #1f2933; }
.fc-card .fc-rank { font-size: calc(var(--fc-w) * 0.25); }
.fc-card .fc-suit-big { align-self: center; font-size: calc(var(--fc-w) * 0.42); }
.fc-card .fc-suit-mini { align-self: flex-end; font-size: calc(var(--fc-w) * 0.22); }
/* 牌大多被下一张盖住, 只有顶部一条窄边可见, 所以高亮要走 inset 描边 + 底色 */
.fc-card.is-selected { outline: none; background: #dbeafe;
  box-shadow: inset 0 0 0 2px #1677ff, 0 1px 3px rgba(0, 0, 0, 0.35); }
.fc-card.is-hint { background: #fff7e6; animation: fc-pulse 1.1s ease-in-out infinite; }
@keyframes fc-pulse {
  0%, 100% { box-shadow: inset 0 0 0 2px rgba(250, 173, 20, 0.5), 0 1px 3px rgba(0, 0, 0, 0.35); }
  50% { box-shadow: inset 0 0 0 3px rgba(250, 173, 20, 1), 0 1px 3px rgba(0, 0, 0, 0.35); }
}
.fc-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: flex-start; }
.fc-col { position: relative; width: var(--fc-w); border-radius: 6px; transition: outline-color 0.1s; }
.fc-col.is-empty { box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.4);
  background: rgba(148, 163, 184, 0.08); height: var(--fc-h); }
.fc-col .fc-card { position: absolute; left: 0; }
.fc-col-hit { position: absolute; left: 0; right: 0; bottom: 0; }
@media (prefers-reduced-motion: reduce) { .fc-card.is-hint { animation: none; } }
`;
