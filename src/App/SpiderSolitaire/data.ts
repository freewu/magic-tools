// 蜘蛛纸牌 (Spider Solitaire): 常量 (花色 / 牌值 / 布局 / 难度 / localStorage key / 样式)
// 规则与计算全在 lib.ts (纯函数, 便于单测), 本文件只放数值、配色与样式

/** 四种花色 */
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

/** 牌桌列数 (标准蜘蛛纸牌 10 列) */
export const TABLEAU_COLS = 10;

/** 整副牌张数 (两副牌 104 张) */
export const TOTAL_CARDS = 104;

/** 需要集齐的同花 K→A 组数 (通关条件) */
export const SERIES_COUNT = 8;

/** 每发一轮牌, 每列各补 1 张 -> 一次消耗 10 张 */
export const STOCK_DEAL_SIZE = TABLEAU_COLS;

/** 开局每列的张数: 前 4 列 6 张, 后 6 列 5 张 (共 54 张) */
export const INITIAL_COUNTS: readonly number[] = [ 6, 6, 6, 6, 5, 5, 5, 5, 5, 5 ];

/** 难度 = 使用的花色数 (1 花色简单 / 2 花色中等 / 4 花色困难) */
export type Difficulty = 1 | 2 | 4;
export const DIFFICULTIES: readonly Difficulty[] = [ 1, 2, 4 ];
export const DEFAULT_DIFFICULTY: Difficulty = 1;

/** 难度 -> 使用的花色 (同花组数 = SERIES_COUNT / 花色数) */
export const SUITS_BY_DIFFICULTY: Record<Difficulty, readonly Suit[]> = {
  1: [ 'S' ],
  2: [ 'S', 'H' ],
  4: [ 'S', 'H', 'D', 'C' ],
};

/** 局号范围 (相同局号 + 相同难度必得相同牌局) */
export const SEED_MIN = 1;
export const SEED_MAX = 1000000;
/** 默认局号 */
export const SEED_DEFAULT = 2026;

/** localStorage key: 默认设置 / 战绩 / 上次局号 */
export const DEFAULTS_STORAGE_KEY = 'magic-tools-spider-defaults';
export const RECORDS_STORAGE_KEY = 'magic-tools-spider-records';
export const SEED_STORAGE_KEY = 'magic-tools-spider-seed';

/** 撤销历史的最大深度 */
export const HISTORY_LIMIT = 3000;

/** 发牌动画: 单张动画时长 / 相邻两张之间的错开间隔 / 清标记的兜底时长 */
export const DEAL_ANIM_MS = 300;
export const DEAL_STAGGER_MS = 18;
export const DEAL_ANIM_TOTAL_MS = 1500;
/** 发一轮牌 (10 张) 的动画总时长: 每张间隔 3 个错开单位, 看得清是逐张发下来的 */
export const DEAL_ROW_ANIM_TOTAL_MS = 900;
export const DEAL_ROW_STAGGER_STEP = 3;

/** 牌面宽度 (CSS 长度): 普通模式按视口自适应, 全屏模式更大一些 */
export const CARD_SIZE_CSS = 'min(7.4vw, 62px)';
export const CARD_SIZE_CSS_FULL = 'min(6.2vw, 82px)';

/** 牌面 / 棋盘样式 (只做视觉, 不影响逻辑) */
export const SP_CSS = `
.sp-stage { box-sizing: border-box; }
.sp-stage.sp-full { position: fixed; inset: 0; z-index: 1000; display: flex; flex-direction: column;
  gap: 10px; padding: 10px; overflow: auto; background: var(--sp-bg, #12161f); }
.sp-card { position: relative; width: var(--sp-w); height: var(--sp-h); border-radius: 6px;
  box-sizing: border-box; background: var(--sp-card-bg, #ffffff); color: #1f2933;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(148, 163, 184, 0.55);
  display: flex; flex-direction: column; justify-content: space-between; padding: 1px 3px;
  font-weight: 700; line-height: 1.05; user-select: none; cursor: pointer;
  touch-action: none; overflow: hidden; }
.sp-card.is-red { color: #cf1322; }
.sp-card.is-black { color: #1f2933; }
.sp-card .sp-rank { font-size: calc(var(--sp-w) * 0.26); }
.sp-card .sp-suit-big { align-self: center; font-size: calc(var(--sp-w) * 0.4); }
.sp-card .sp-suit-mini { align-self: flex-end; font-size: calc(var(--sp-w) * 0.2); }
.sp-card.is-loose { cursor: default; }
.sp-card.is-down { cursor: default;
  background: repeating-linear-gradient(45deg, #1e40af 0 5px, #2563eb 5px 10px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35), inset 0 0 0 2px rgba(255, 255, 255, 0.85); }
.sp-card.is-down::after { content: ''; position: absolute; inset: 3px; border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.45); }
.sp-card.is-selected { outline: none; background: #dbeafe;
  box-shadow: inset 0 0 0 2px #1677ff, 0 1px 3px rgba(0, 0, 0, 0.35); }
.sp-card.is-dragging { opacity: 0.25; }
.sp-card.sp-card-ghost { position: absolute; left: 0; cursor: grabbing;
  box-shadow: 0 14px 26px rgba(0, 0, 0, 0.34), inset 0 0 0 1px rgba(148, 163, 184, 0.55);
  transform: rotate(-1.6deg) scale(1.03); }
.sp-card.is-hint { background: #fff7e6; animation: sp-pulse 1.1s ease-in-out infinite; }
@keyframes sp-pulse {
  0%, 100% { box-shadow: inset 0 0 0 2px rgba(250, 173, 20, 0.5), 0 1px 3px rgba(0, 0, 0, 0.35); }
  50% { box-shadow: inset 0 0 0 3px rgba(250, 173, 20, 1), 0 1px 3px rgba(0, 0, 0, 0.35); }
}
/* 发牌动画: 从牌堆方向飞入, 按 --sp-order 逐张错开 */
.sp-card[data-deal] { animation: sp-deal-in 300ms cubic-bezier(0.2, 0.7, 0.3, 1) backwards;
  animation-delay: calc(var(--sp-order, 0) * 18ms); }
@keyframes sp-deal-in {
  from { opacity: 0; transform: translate(-34px, -170px) rotate(5deg) scale(0.94); }
  to { opacity: 1; transform: none; }
}
.sp-drag-layer { position: fixed; z-index: 1200; pointer-events: none; touch-action: none; }
.sp-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: flex-start; }
.sp-col { position: relative; width: var(--sp-w); border-radius: 6px; }
.sp-col.is-empty { box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.4);
  background: rgba(148, 163, 184, 0.08); height: var(--sp-h); }
.sp-col .sp-card { position: absolute; left: 0; }
.sp-col.is-drop, .sp-slot.is-drop { outline: 2px solid #1677ff; outline-offset: 2px; }
.sp-slot { width: var(--sp-w); height: var(--sp-h); border-radius: 6px; box-sizing: border-box;
  display: flex; align-items: center; justify-content: center; }
.sp-slot.is-empty { box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.4);
  background: rgba(148, 163, 184, 0.08); }
.sp-stock { cursor: pointer; }
.sp-mini { width: calc(var(--sp-w) * 0.5); height: calc(var(--sp-h) * 0.5); border-radius: 4px;
  box-sizing: border-box; display: flex; align-items: center; justify-content: center;
  font-size: calc(var(--sp-w) * 0.24); font-weight: 700;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.5); background: var(--sp-card-bg, #fff); }
.sp-mini.is-empty { box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.3); background: transparent;
  opacity: 0.45; }
@media (prefers-reduced-motion: reduce) {
  .sp-card.is-hint, .sp-card[data-deal] { animation: none; }
}
`;
