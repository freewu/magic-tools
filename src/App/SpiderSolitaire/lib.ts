// 蜘蛛纸牌 (Spider Solitaire): 纯规则逻辑
//   - 发牌 (局号 + 难度 -> 确定性牌局, 相同输入必得相同牌局)
//   - 移动校验 (同花降序连牌 -> 任何花色大 1 的牌 / 空列)
//   - 发牌堆 (每列各补 1 张, 经典规则要求没有空列) / 凑齐 K→A 自动收走
//   - 提示 / 死局判定 / 默认设置与战绩 (localStorage)
// 说明: 不依赖 DOM 与 React, 全部为纯函数 (随机数由调用方注入), 便于单测
import {
  DEFAULT_DIFFICULTY,
  DEFAULTS_STORAGE_KEY,
  INITIAL_COUNTS,
  IS_RED,
  RANK_LABEL,
  RANK_MAX,
  RECORDS_STORAGE_KEY,
  SEED_DEFAULT,
  SEED_MAX,
  SEED_MIN,
  SEED_STORAGE_KEY,
  SERIES_COUNT,
  STOCK_DEAL_SIZE,
  SUITS_BY_DIFFICULTY,
  SUIT_SYMBOL,
  TABLEAU_COLS,
  TOTAL_CARDS,
  type Difficulty,
  type Suit,
} from './data';

/** 一张牌: uid 全局唯一 (两副牌里有重复的花色 + 牌值), faceUp 表示是否翻开 */
export interface Card { uid: number; suit: Suit; rank: number; faceUp: boolean }

/** 一次移动: 从 from 列取走最上面 count 张放到 to 列 */
export interface Move { from: number; to: number; count: number }

/** 牌局状态 (全部为不可变更新, 撤销靠保存历史快照) */
export interface GameState {
  /** 牌桌 10 列, 数组末尾 = 最上面一张 */
  tableau: Card[][];
  /** 牌堆 (未发的牌, 全部盖着) */
  stock: Card[];
  /** 已收走的同花 K→A 组的花色 (长度即已收组数) */
  done: Suit[];
  /** 步数 (发牌 / 自动收牌不计入) */
  moves: number;
  /** 本局难度 */
  suits: Difficulty;
}

/** 随机数发生器: 返回 [0, 1) */
export type Rng = () => number;

/** 键盘动作 */
export type KeyAction = 'new' | 'restart' | 'undo' | 'hint' | 'deal' | 'collect';

/** 提示: 走一步牌 / 从牌堆发一轮 / 没有可走的 */
export type SpiderHint = Move | { deal: true } | null;

/** 发牌堆结果 */
export type DealResult =
  | { ok: true; state: GameState }
  | { ok: false; reason: 'stock' | 'empty' };

// ---- 牌的基本属性 ----

/** 牌的唯一标识 */
export const cardId = (card: Card): string => `c${card.uid}`;

/** 牌面文字 (如 ♠A) */
export const cardText = (card: Card): string => `${SUIT_SYMBOL[card.suit]}${RANK_LABEL[card.rank] ?? ''}`;

/** 是否红色牌 (红桃 / 方块) */
export const isRedCard = (card: Card): boolean => IS_RED[card.suit] === true;

/** 难度归一化 (只接受 1 / 2 / 4) */
export const normalizeSuits = (v: unknown): Difficulty => {
  const n = typeof v === 'number' ? v : Number(v);
  if (n === 4) return 4;
  if (n === 2) return 2;
  return DEFAULT_DIFFICULTY;
};

/**
 * 按难度造一副 104 张的牌 (uid 从 0 递增):
 *   1 花色 = 8 组黑桃; 2 花色 = 各 4 组黑桃 / 红桃; 4 花色 = 各 2 组
 */
export const makeDeck = (suits: Difficulty = DEFAULT_DIFFICULTY): Card[] => {
  const use = SUITS_BY_DIFFICULTY[normalizeSuits(suits)];
  const copies = SERIES_COUNT / use.length;
  const cards: Card[] = [];
  let uid = 0;
  for (let c = 0; c < copies; c += 1) {
    for (const suit of use) {
      for (let rank = 1; rank <= RANK_MAX; rank += 1) {
        cards.push({ uid, suit, rank, faceUp: false });
        uid += 1;
      }
    }
  }
  return cards;
};

// ---- 局号与发牌 ----

/** 任意输入 -> 合法局号 (1 ~ 1,000,000; 空值 / 非法值回退默认局号) */
export const normalizeSeed = (v: unknown): number => {
  if (v === null || v === undefined || v === '') return SEED_DEFAULT;
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return SEED_DEFAULT;
  return Math.min(SEED_MAX, Math.max(SEED_MIN, Math.floor(n)));
};

/** 随机局号 (随机源可注入, 便于单测) */
export const randomSeed = (rng: Rng = Math.random): number => {
  const raw = rng();
  const r = Math.min(0.999999, Math.max(0, Number.isFinite(raw) ? raw : 0));
  return normalizeSeed(SEED_MIN + Math.floor(r * (SEED_MAX - SEED_MIN + 1)));
};

/**
 * 线性同余随机数 (32 位溢出):
 * state = state * 214013 + 2531011, 取高 15 位作为随机值
 */
export const makeSeededRng = (seed: number): Rng => {
  let state = (normalizeSeed(seed) >>> 0);
  return () => {
    state = (Math.imul(state, 214013) + 2531011) >>> 0;
    return (state >>> 16) & 0x7fff;
  };
};

/**
 * 按局号 + 难度发牌:
 *   - Fisher-Yates 洗牌, 前 54 张铺满 10 列 (前 4 列 6 张, 后 6 列 5 张), 每列只有顶牌翻开
 *   - 剩下 50 张进牌堆 (5 轮, 每轮每列各 1 张)
 */
export const dealFromSeed = (seed: number, suits: Difficulty = DEFAULT_DIFFICULTY): GameState => {
  const rand = makeSeededRng(seed);
  const deck = makeDeck(suits);
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor((rand() / 0x8000) * (i + 1)) % (i + 1);
    [ deck[i], deck[j] ] = [ deck[j], deck[i] ];
  }
  const tableau: Card[][] = [];
  let cursor = 0;
  for (let col = 0; col < TABLEAU_COLS; col += 1) {
    const count = INITIAL_COUNTS[col] ?? 5;
    tableau.push(deck.slice(cursor, cursor + count));
    cursor += count;
  }
  tableau.forEach((pile) => {
    const top = pile[pile.length - 1];
    if (top) top.faceUp = true;
  });
  return {
    tableau,
    stock: deck.slice(cursor),
    done: [],
    moves: 0,
    suits: normalizeSuits(suits),
  };
};

/** 深拷贝牌局 (撤销 / 试算用) */
export const cloneState = (state: GameState): GameState => ({
  tableau: state.tableau.map((pile) => pile.map((card) => ({ ...card }))),
  stock: state.stock.map((card) => ({ ...card })),
  done: [ ...state.done ],
  moves: state.moves,
  suits: state.suits,
});

// ---- 读取牌堆 ----

/** 牌堆最上面一张 (空堆返回 null) */
export const topCard = (pile: readonly Card[]): Card | null => (pile.length ? pile[pile.length - 1] : null);

/** 已翻开的牌数 */
export const faceUpCount = (state: GameState): number =>
  state.tableau.reduce((n, pile) => n + pile.filter((card) => card.faceUp).length, 0);

/** 还盖着的牌数 */
export const faceDownCount = (state: GameState): number =>
  state.tableau.reduce((n, pile) => n + pile.filter((card) => !card.faceUp).length, 0);

/** 空列数量 */
export const emptyColumnCount = (state: GameState): number =>
  state.tableau.filter((pile) => pile.length === 0).length;

/** 还能从牌堆发几轮 */
export const dealsLeft = (state: GameState): number => Math.floor(state.stock.length / STOCK_DEAL_SIZE);

/** 已收走的组数 */
export const collectedCount = (state: GameState): number => state.done.length;

// ---- 规则校验 ----

/**
 * 一组牌 (顺序同牌桌数组: cards[0] 在最下面) 是否是合法的同花降序连牌:
 *   全部翻开, 花色相同, 且自下而上逐张递减 1
 */
export const isRun = (cards: readonly Card[]): boolean => {
  if (cards.length === 0) return true;
  for (let i = 0; i < cards.length; i += 1) {
    if (!cards[i].faceUp) return false;
    if (i === 0) continue;
    const prev = cards[i - 1];
    const cur = cards[i];
    if (cur.suit !== prev.suit || cur.rank !== prev.rank - 1) return false;
  }
  return true;
};

/** 从某列自 start 位置到末尾的一组牌是否可整体移动 (start 越界 / 连牌不合法返回 null) */
export const runFrom = (state: GameState, col: number, start: number): Card[] | null => {
  const pile = state.tableau[col] ?? [];
  if (start < 0 || start >= pile.length) return null;
  const run = pile.slice(start);
  return isRun(run) ? run : null;
};

/** 目标列能否接住 rank 这张牌 (空列随便放, 否则要求顶牌翻开且比它大 1, 花色不限) */
export const canStackOn = (card: Card, target: Card | null | undefined): boolean => {
  if (!target) return true;
  if (!target.faceUp) return false;
  return target.rank === card.rank + 1;
};

/** 校验一次移动是否合法 */
export const canMove = (state: GameState, move: Move): boolean => {
  const from = Math.floor(move.from);
  const to = Math.floor(move.to);
  const count = Math.floor(move.count);
  if (count <= 0) return false;
  if (from === to) return false;
  const src = state.tableau[from];
  const dst = state.tableau[to];
  if (!src || !dst) return false;
  if (src.length < count) return false;
  const moving = src.slice(src.length - count);
  if (!isRun(moving)) return false;
  return canStackOn(moving[0], topCard(dst));
};

/** 某列最上面一张能拿起来的连牌 (顶牌没翻开返回 null) */
export const movableRun = (state: GameState, col: number): Card[] | null => {
  const pile = state.tableau[col] ?? [];
  if (!pile.length) return null;
  let start = pile.length - 1;
  while (start > 0 && isRun(pile.slice(start - 1))) start -= 1;
  const run = pile.slice(start);
  return run.length ? run : null;
};

/** 把某列顶牌翻开 (内部使用, 会原地修改传入的 state) */
const flipTop = (state: GameState, col: number): void => {
  const pile = state.tableau[col];
  const top = pile ? pile[pile.length - 1] : null;
  if (top) top.faceUp = true;
};

/**
 * 收走所有凑齐的同花 K→A 组 (每组 13 张, 从 K 到 A 且花色相同)
 * @returns collected 本次收走的组数
 */
export const collectCompleted = (state: GameState): { state: GameState; collected: number } => {
  const next = cloneState(state);
  let collected = 0;
  for (let col = 0; col < next.tableau.length; col += 1) {
    for (;;) {
      const pile = next.tableau[col];
      if (pile.length < RANK_MAX) break;
      const tail = pile.slice(pile.length - RANK_MAX);
      const suit = tail[0].suit;
      const okTail = tail.every((card, i) => card.faceUp && card.suit === suit && card.rank === RANK_MAX - i);
      if (!okTail) break;
      pile.splice(pile.length - RANK_MAX, RANK_MAX);
      next.done.push(suit);
      collected += 1;
      flipTop(next, col);
      if (next.done.length >= SERIES_COUNT) break;
    }
  }
  return { state: next, collected };
};

/** 执行一次移动 (非法返回 null, 合法返回新状态), 顺手翻开被挪走后露出的牌 */
export const applyMove = (
  state: GameState,
  move: Move,
  opts?: { autoCollect?: boolean }
): GameState | null => {
  if (!canMove(state, move)) return null;
  const autoCollect = opts?.autoCollect !== false;
  const count = Math.floor(move.count);
  const next = cloneState(state);
  const cards = next.tableau[Math.floor(move.from)].splice(-count, count);
  next.tableau[Math.floor(move.to)].push(...cards);
  flipTop(next, Math.floor(move.from));
  next.moves = state.moves + 1;
  return autoCollect ? collectCompleted(next).state : next;
};

/** 从牌堆给每列各发 1 张 (顶牌翻开) */
export const dealStock = (
  state: GameState,
  opts?: { strictDeal?: boolean; autoCollect?: boolean }
): DealResult => {
  const strictDeal = opts?.strictDeal !== false;
  const autoCollect = opts?.autoCollect !== false;
  if (state.stock.length < STOCK_DEAL_SIZE) return { ok: false, reason: 'stock' };
  // 经典规则: 有空列时不允许发牌
  if (strictDeal && emptyColumnCount(state) > 0) return { ok: false, reason: 'empty' };
  const next = cloneState(state);
  for (let col = 0; col < TABLEAU_COLS; col += 1) {
    const card = next.stock.pop();
    if (!card) break;
    next.tableau[col].push({ ...card, faceUp: true });
  }
  return {
    ok: true,
    state: autoCollect ? collectCompleted(next).state : next,
  };
};

/** 是否通关 (收齐 8 组) */
export const isWin = (state: GameState): boolean => state.done.length >= SERIES_COUNT;

/** 是否死局 (既走不了牌, 也发不了牌) */
export const isStuck = (state: GameState, opts?: SpiderOptions): boolean =>
  !isWin(state) && findHint(state, opts, true) === null;

// ---- 提示 ----

/** 为一次候选移动打分 (越高越值得推荐) */
const scoreMove = (state: GameState, move: Move): number => {
  const src = state.tableau[move.from];
  const dst = state.tableau[move.to];
  const moving = src.slice(src.length - move.count);
  const below = src[src.length - move.count - 1];
  const target = topCard(dst);
  let score = 0;
  if (target && target.suit === moving[0].suit) score += 4; // 同花接龙最值钱
  if (below && !below.faceUp) score += 3; // 能把盖着的牌翻开
  if (target) score += 2; // 尽量别占空列
  if (move.count > 1) score += 1; // 一次搬得多
  if (src.length === move.count) score += 2; // 能把整列清空
  return score;
};

/**
 * 找到一步推荐的操作: 优先走牌 (同花接龙 > 翻牌 > 少占空列), 否则发牌
 * @param allowDeal 没有可走的牌时, 是否把「发一轮牌」也算作有活路
 */
export const findHint = (
  state: GameState,
  opts?: SpiderOptions,
  allowDeal = true
): SpiderHint => {
  const candidates: Move[] = [];
  for (let from = 0; from < state.tableau.length; from += 1) {
    const pile = state.tableau[from];
    for (let start = 0; start < pile.length; start += 1) {
      const run = runFrom(state, from, start);
      if (!run) continue;
      for (let to = 0; to < state.tableau.length; to += 1) {
        if (to === from) continue;
        const move: Move = { from, to, count: run.length };
        if (canMove(state, move)) candidates.push(move);
      }
    }
  }
  if (candidates.length) {
    const sorted = candidates
      .map((move) => ({ move, score: scoreMove(state, move) }))
      .sort((a, b) => b.score - a.score);
    return sorted[0].move;
  }
  if (!allowDeal) return null;
  const deal = dealStock(state, { strictDeal: opts?.strictDeal, autoCollect: false });
  return deal.ok ? { deal: true } : null;
};

/** 当前是否还有活路 (allowDeal = false 时只看能不能走牌) */
export const hasAnyMove = (state: GameState, opts?: SpiderOptions, allowDeal = true): boolean =>
  findHint(state, opts, allowDeal) !== null;

// ---- 键盘 ----

/** 键盘事件 -> 动作 (仅 n / r / z / h / d / c) */
export const keyToAction = (e: { key?: string } | null | undefined): KeyAction | null => {
  if (!e) return null;
  switch (e.key) {
    case 'n': case 'N': return 'new';
    case 'r': case 'R': return 'restart';
    case 'z': case 'Z': return 'undo';
    case 'h': case 'H': return 'hint';
    case 'd': case 'D': return 'deal';
    case 'c': case 'C': return 'collect';
    default: return null;
  }
};

/** 键盘事件是否来自输入控件 (此时按键归控件自己处理) */
export const isTypingTarget = (
  node: { tagName?: string; isContentEditable?: boolean } | null | undefined
): boolean => {
  if (!node) return false;
  const tag = String(node.tagName ?? '').toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable === true;
};

// ---- 用时格式化 ----

/** 毫秒 -> mm:ss (超过 1 小时显示 h:mm:ss) */
export const formatTime = (ms: number): string => {
  const total = Math.max(0, Math.floor((Number.isFinite(ms) ? ms : 0) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

// ---- 默认设置 (设置中心 / 「配置文件」导入导出共用 getDefault* + setDefault* 约定) ----

export interface SpiderOptions {
  /** 新局默认难度 (花色数) */
  suits: Difficulty;
  /** 有空列时不允许发牌 (经典规则) */
  strictDeal: boolean;
  /** 双击一张牌时自动找位置移动 */
  doubleClick: boolean;
  /** 凑齐同花 K→A 时自动收走 */
  autoCollect: boolean;
}

export const DEFAULT_OPTIONS: SpiderOptions = {
  suits: DEFAULT_DIFFICULTY,
  strictDeal: true,
  doubleClick: true,
  autoCollect: true,
};

/** 任意输入 -> 完整合法的选项 (非布尔值按默认处理) */
export const normalizeOptions = (raw?: Partial<SpiderOptions> | null): SpiderOptions => ({
  suits: raw?.suits === undefined ? DEFAULT_OPTIONS.suits : normalizeSuits(raw.suits),
  strictDeal: raw?.strictDeal === undefined ? DEFAULT_OPTIONS.strictDeal : raw.strictDeal === true,
  doubleClick: raw?.doubleClick === undefined ? DEFAULT_OPTIONS.doubleClick : raw.doubleClick === true,
  autoCollect: raw?.autoCollect === undefined ? DEFAULT_OPTIONS.autoCollect : raw.autoCollect === true,
});

/** 读取默认设置 (非法值 / 读取失败回退默认) */
export const getDefaultOptions = (): SpiderOptions => {
  try {
    const raw = localStorage.getItem(DEFAULTS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_OPTIONS };
    return normalizeOptions(JSON.parse(raw) as Partial<SpiderOptions>);
  } catch {
    return { ...DEFAULT_OPTIONS };
  }
};

/** 写入默认设置 (归一化后写入; 返回真正写入的值) */
export const setDefaultOptions = (raw?: Partial<SpiderOptions> | null): SpiderOptions => {
  const next = normalizeOptions(raw);
  try {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 忽略 */
  }
  return next;
};

/** 局部更新默认设置 */
export const patchDefaultOptions = (patch: Partial<SpiderOptions>): SpiderOptions =>
  setDefaultOptions({ ...getDefaultOptions(), ...patch });

/** 两组设置是否一致 */
export const isSameOptions = (a: SpiderOptions, b: SpiderOptions): boolean =>
  a.suits === b.suits && a.strictDeal === b.strictDeal
  && a.doubleClick === b.doubleClick && a.autoCollect === b.autoCollect;

// ---- 战绩 ----

export interface SpiderRecords {
  /** 开局次数 */
  plays: number;
  /** 通关次数 */
  wins: number;
  /** 最快通关用时 (ms), 0 表示还没有记录 */
  bestTimeMs: number;
  /** 最少步数通关, 0 表示还没有记录 */
  bestMoves: number;
}

export const EMPTY_RECORDS: SpiderRecords = { plays: 0, wins: 0, bestTimeMs: 0, bestMoves: 0 };

const intOf = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

/** 任意输入 -> 合法战绩 */
export const normalizeRecords = (raw?: Partial<SpiderRecords> | null): SpiderRecords => ({
  plays: intOf(raw?.plays),
  wins: intOf(raw?.wins),
  bestTimeMs: intOf(raw?.bestTimeMs),
  bestMoves: intOf(raw?.bestMoves),
});

/** 读取战绩 (无记录 / 损坏返回全 0) */
export const getRecords = (): SpiderRecords => {
  try {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    if (!raw) return { ...EMPTY_RECORDS };
    return normalizeRecords(JSON.parse(raw) as Partial<SpiderRecords>);
  } catch {
    return { ...EMPTY_RECORDS };
  }
};

/** 写入战绩 */
export const setRecords = (raw?: Partial<SpiderRecords> | null): SpiderRecords => {
  const next = normalizeRecords(raw);
  try {
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 忽略 */
  }
  return next;
};

/** 记一次开局 */
export const recordPlay = (): SpiderRecords => {
  const cur = getRecords();
  return setRecords({ ...cur, plays: cur.plays + 1 });
};

/** 记一次通关 (自动刷新最快用时 / 最少步数) */
export const recordWin = (timeMs: number, moves: number): SpiderRecords => {
  const cur = getRecords();
  const time = intOf(timeMs);
  const steps = intOf(moves);
  return setRecords({
    plays: cur.plays,
    wins: cur.wins + 1,
    bestTimeMs: cur.bestTimeMs > 0 && time > 0 ? Math.min(cur.bestTimeMs, time) : time,
    bestMoves: cur.bestMoves > 0 && steps > 0 ? Math.min(cur.bestMoves, steps) : steps,
  });
};

/** 清空战绩 */
export const clearRecords = (): void => {
  try {
    localStorage.removeItem(RECORDS_STORAGE_KEY);
  } catch {
    /* 忽略 */
  }
};

// ---- 上次局号 ----

/** 读取上次玩的局号 (无记录返回默认局号) */
export const getLastSeed = (): number => {
  try {
    const raw = localStorage.getItem(SEED_STORAGE_KEY);
    if (!raw) return SEED_DEFAULT;
    return normalizeSeed(Number(raw));
  } catch {
    return SEED_DEFAULT;
  }
};

/** 记住局号 (下次打开同一局) */
export const setLastSeed = (seed: unknown): number => {
  const value = normalizeSeed(seed);
  try {
    localStorage.setItem(SEED_STORAGE_KEY, String(value));
  } catch {
    /* 忽略 */
  }
  return value;
};

/** 牌局总张数自检 (供测试与调试) */
export const totalCards = (state: GameState): number =>
  state.tableau.reduce((n, pile) => n + pile.length, 0) + state.stock.length
  + state.done.length * RANK_MAX;

export { TABLEAU_COLS, TOTAL_CARDS };
