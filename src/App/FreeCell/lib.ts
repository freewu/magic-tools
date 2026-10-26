// 空档接龙 (FreeCell): 纯规则逻辑
//   - 发牌 (按局号确定性洗牌, 相同局号必得相同牌局)
//   - 移动校验 (牌桌降序异色 / 自由格单张 / 收集区同花色升序)
//   - 多张移动容量 (空自由格 + 空列) / 自动收牌安全判定 / 提示 / 胜利判定
//   - 默认设置与战绩 (localStorage, 「配置文件」导入导出共用 getDefault* + setDefault* 约定)
// 说明: 不依赖 DOM 与 React, 全部为纯函数 (随机数由调用方注入), 便于单测
import {
  DECK_SIZE,
  DEFAULTS_STORAGE_KEY,
  FREE_CELL_COUNT,
  IS_RED,
  RANK_LABEL,
  RANK_MAX,
  RECORDS_STORAGE_KEY,
  SEED_DEFAULT,
  SEED_MAX,
  SEED_MIN,
  SEED_STORAGE_KEY,
  SUIT_SYMBOL,
  SUITS,
  TABLEAU_COLS,
  type Suit,
} from './data';

/** 一张牌: 花色 + 牌值 (1 = A, 13 = K) */
export interface Card { suit: Suit; rank: number }

/** 牌堆种类: 牌桌列 / 自由格 / 收集区 */
export type PileKind = 'tableau' | 'free' | 'foundation';

/** 牌堆引用 (index 为该种类下的下标) */
export interface PileRef { kind: PileKind; index: number }

/** 一次移动: 从 from 取走最上面 count 张放到 to */
export interface Move { from: PileRef; to: PileRef; count: number }

/** 牌局状态 (全部为不可变更新, 撤销靠保存历史快照) */
export interface GameState {
  /** 牌桌 8 列, 数组末尾 = 最上面一张 */
  tableau: Card[][];
  /** 4 个自由格, null 表示空 */
  free: Array<Card | null>;
  /** 4 个收集区, 按 SUITS 顺序 (0 黑桃 / 1 红桃 / 2 方块 / 3 梅花) */
  foundations: Card[][];
  /** 步数 (自动收牌不计入) */
  moves: number;
}

/** 随机数发生器: 返回 [0, 1) */
export type Rng = () => number;

/** 键盘动作 */
export type KeyAction = 'new' | 'restart' | 'undo' | 'hint' | 'autoCollect';

// ---- 牌的基本属性 ----

/** 牌的唯一标识 (花色 + 牌值) */
export const cardId = (card: Card): string => `${card.suit}${card.rank}`;

/** 牌面文字 (如 ♠A) */
export const cardText = (card: Card): string => `${SUIT_SYMBOL[card.suit]}${RANK_LABEL[card.rank] ?? ''}`;

/** 是否红色牌 (红桃 / 方块) */
export const isRedCard = (card: Card): boolean => IS_RED[card.suit] === true;

/** 花色对应的收集区下标 */
export const foundationIndex = (suit: Suit): number => Math.max(0, SUITS.indexOf(suit));

/** 一副按花色 / 牌值排好的 52 张牌 */
export const makeDeck = (): Card[] =>
  SUITS.flatMap((suit) => Array.from({ length: RANK_MAX }, (_, i) => ({ suit, rank: i + 1 })));

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
 * 经典空档接龙用的线性同余随机数 (32 位溢出):
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
 * 按局号发牌: 从剩下的牌里随机抽一张, 依次填进 8 列 (行优先: 第 0 行填满 8 列, 再第 1 行…)
 * 结果: 前 4 列各 7 张, 后 4 列各 6 张, 共 52 张
 */
export const dealFromSeed = (seed: number): GameState => {
  const rand = makeSeededRng(seed);
  const remaining = makeDeck();
  const tableau: Card[][] = Array.from({ length: TABLEAU_COLS }, () => []);
  for (let i = 0; i < DECK_SIZE; i += 1) {
    const j = Math.floor((rand() / 0x8000) * remaining.length) % remaining.length;
    const [ card ] = remaining.splice(j, 1);
    tableau[i % TABLEAU_COLS].push(card);
  }
  return {
    tableau,
    free: new Array<Card | null>(FREE_CELL_COUNT).fill(null),
    foundations: SUITS.map(() => []),
    moves: 0,
  };
};

/** 深拷贝牌局 (撤销 / 试算用) */
export const cloneState = (state: GameState): GameState => ({
  tableau: state.tableau.map((pile) => [ ...pile ]),
  free: [ ...state.free ],
  foundations: state.foundations.map((pile) => [ ...pile ]),
  moves: state.moves,
});

// ---- 读取牌堆 ----

/** 牌堆引用 -> 牌数组 (自由格最多一张) */
export const pileOf = (state: GameState, ref: PileRef): Card[] => {
  if (ref.kind === 'tableau') return state.tableau[ref.index] ?? [];
  if (ref.kind === 'foundation') return state.foundations[ref.index] ?? [];
  const card = state.free[ref.index];
  return card ? [ card ] : [];
};

/** 牌堆最上面一张 (空堆返回 null) */
export const topCard = (pile: readonly Card[]): Card | null => (pile.length ? pile[pile.length - 1] : null);

/** 某花色收集区最上面一张 */
export const foundationTop = (state: GameState, suit: Suit): Card | null =>
  topCard(state.foundations[foundationIndex(suit)] ?? []);

/** 已收进收集区的牌数 */
export const collectedCount = (state: GameState): number =>
  state.foundations.reduce((n, pile) => n + pile.length, 0);

/** 空列数量 */
export const emptyColumnCount = (state: GameState): number =>
  state.tableau.filter((pile) => pile.length === 0).length;

/** 空自由格数量 */
export const emptyFreeCount = (state: GameState): number =>
  state.free.filter((card) => !card).length;

// ---- 规则校验 ----

/**
 * 牌桌是否可以接住 card (降到目标牌上):
 * 目标为空列时任何牌都可以放; 否则要求目标牌比它大 1 且颜色相反
 */
export const canStackOnTableau = (card: Card, target: Card | null | undefined): boolean => {
  if (!target) return true;
  return target.rank === card.rank + 1 && IS_RED[target.suit] !== IS_RED[card.suit];
};

/** card 是否可以收进它自己花色的收集区 (A 起, 同花色升序) */
export const canGoToFoundation = (state: GameState, card: Card): boolean => {
  const top = foundationTop(state, card.suit);
  return top ? top.rank + 1 === card.rank : card.rank === 1;
};

/** 一组牌 (顺序同牌桌数组: cards[0] 在最底下) 是否是合法的降序异色连牌 */
export const isRun = (cards: readonly Card[]): boolean => {
  if (cards.length === 0) return true;
  for (let i = 1; i < cards.length; i += 1) {
    // cards[i] 叠在 cards[i - 1] 上, 故 cards[i - 1] 必须是 cards[i] + 1 的异色牌
    if (!canStackOnTableau(cards[i], cards[i - 1])) return false;
  }
  return true;
};

/**
 * 一次最多能搬几张牌 (超级移动容量):
 *   (空自由格 + 1) × 2^(空列数)  —— 目标为空列时该列本身不能当周转位, 故空列数减 1
 * 关闭「多张连续移动」时固定为 1
 */
export const superMoveLimit = (state: GameState, destinationEmpty = false, superMove = true): number => {
  if (!superMove) return 1;
  const free = emptyFreeCount(state);
  const cols = Math.max(0, emptyColumnCount(state) - (destinationEmpty ? 1 : 0));
  return (free + 1) * (2 ** cols);
};

/** 从某列自 start 位置到末尾的一组牌是否可整体移动 (start 越界 / 连牌不合法返回 null) */
export const runFrom = (state: GameState, col: number, start: number): Card[] | null => {
  const pile = state.tableau[col] ?? [];
  if (start < 0 || start >= pile.length) return null;
  const run = pile.slice(start);
  return isRun(run) ? run : null;
};

/** 从某堆取最上面 count 张 (不校验规则) */
const takeCards = (state: GameState, ref: PileRef, count: number): Card[] => {
  if (ref.kind === 'tableau') {
    const pile = state.tableau[ref.index];
    return pile ? pile.splice(Math.max(0, pile.length - count), count) : [];
  }
  if (ref.kind === 'foundation') {
    const pile = state.foundations[ref.index];
    return pile ? pile.splice(Math.max(0, pile.length - count), count) : [];
  }
  const card = state.free[ref.index];
  state.free[ref.index] = null;
  return card ? [ card ] : [];
};

/** 把一组牌放到某堆上 (不校验规则) */
const putCards = (state: GameState, ref: PileRef, cards: readonly Card[]): void => {
  if (ref.kind === 'tableau') {
    state.tableau[ref.index].push(...cards);
    return;
  }
  if (ref.kind === 'foundation') {
    state.foundations[ref.index].push(...cards);
    return;
  }
  state.free[ref.index] = cards[0] ?? null;
};

/** 校验一次移动是否合法 */
export const canMove = (
  state: GameState,
  move: Move,
  opts?: { superMove?: boolean }
): boolean => {
  const superMove = opts?.superMove !== false;
  const { from, to } = move;
  const count = Math.floor(move.count);
  if (count <= 0) return false;
  if (from.kind === to.kind && from.index === to.index) return false;
  if (from.kind === 'tableau' && !state.tableau[from.index]) return false;
  if (from.kind === 'foundation' && !state.foundations[from.index]) return false;
  if (from.kind === 'free' && (from.index < 0 || from.index >= state.free.length)) return false;

  const source = pileOf(state, from);
  if (source.length < count) return false;
  const cards = source.slice(source.length - count);
  if (!isRun(cards)) return false;
  const moving = cards[0];

  // 自由格 / 收集区只能一张一张动
  if (from.kind !== 'tableau' && count !== 1) return false;

  if (to.kind === 'free') {
    if (count !== 1) return false;
    if (to.index < 0 || to.index >= state.free.length) return false;
    return !state.free[to.index];
  }

  if (to.kind === 'foundation') {
    if (count !== 1) return false;
    if (to.index !== foundationIndex(moving.suit)) return false;
    return canGoToFoundation(state, moving);
  }

  const dest = state.tableau[to.index];
  if (!dest) return false;
  if (!canStackOnTableau(moving, topCard(dest))) return false;
  if (count > 1 && count > superMoveLimit(state, dest.length === 0, superMove)) return false;
  return true;
};

/** 执行一次移动 (非法返回 null, 合法返回新状态) */
export const applyMove = (
  state: GameState,
  move: Move,
  opts?: { superMove?: boolean }
): GameState | null => {
  if (!canMove(state, move, opts)) return null;
  const next = cloneState(state);
  const cards = takeCards(next, move.from, Math.floor(move.count));
  putCards(next, move.to, cards);
  next.moves = state.moves + 1;
  return next;
};

/** 是否通关 (四个收集区各 13 张) */
export const isWin = (state: GameState): boolean =>
  state.foundations.length > 0 && state.foundations.every((pile) => pile.length === RANK_MAX);

// ---- 自动收牌 ----

/**
 * 这张牌现在收进收集区是否「绝对安全」(不会因此堵死还没翻出来的牌):
 * 牌值 ≤ 2 一定安全; 其它牌要求两个反色花色的收集区都已到 牌值 − 1
 */
export const isSafeToAutoPlay = (state: GameState, card: Card): boolean => {
  if (card.rank <= 2) return true;
  const opposite = SUITS.filter((suit) => IS_RED[suit] !== IS_RED[card.suit]);
  return opposite.every((suit) => (foundationTop(state, suit)?.rank ?? 0) >= card.rank - 1);
};

/**
 * 自动收牌: 反复把能收的牌送进收集区
 * @param safeOnly true 只收安全牌 (默认, 与经典空档接龙一致); false 把当时能收的全收掉
 * @returns 新状态与实际收走的张数 (收牌不计步数, moves 保持原样)
 */
export const autoCollect = (state: GameState, safeOnly = true): { state: GameState; played: number } => {
  let cur = cloneState(state);
  let played = 0;
  const wanted = (card: Card): boolean => canGoToFoundation(cur, card) && (!safeOnly || isSafeToAutoPlay(cur, card));
  for (;;) {
    let moved = false;
    for (let i = 0; i < cur.free.length; i += 1) {
      const card = cur.free[i];
      if (!card || !wanted(card)) continue;
      const next = applyMove(cur, {
        from: { kind: 'free', index: i },
        to: { kind: 'foundation', index: foundationIndex(card.suit) },
        count: 1,
      });
      if (!next) continue;
      cur = next;
      played += 1;
      moved = true;
    }
    for (let i = 0; i < cur.tableau.length; i += 1) {
      const card = topCard(cur.tableau[i]);
      if (!card || !wanted(card)) continue;
      const next = applyMove(cur, {
        from: { kind: 'tableau', index: i },
        to: { kind: 'foundation', index: foundationIndex(card.suit) },
        count: 1,
      });
      if (!next) continue;
      cur = next;
      played += 1;
      moved = true;
    }
    if (!moved) break;
  }
  cur.moves = state.moves;
  return { state: cur, played };
};

// ---- 提示 ----

/**
 * 找到一步可行的移动 (优先上收, 其次牌桌之间, 再退到自由格), 没有则返回 null
 * @param allowTakeBack 是否把「从收集区取回一张」也算作可行移动 (判断死局时应传 false)
 */
export const findHint = (state: GameState, superMove = true, allowTakeBack = true): Move | null => {
  const toFoundation = (ref: PileRef, card: Card): Move =>
    ({ from: ref, to: { kind: 'foundation', index: foundationIndex(card.suit) }, count: 1 });

  // 1) 上收: 自由格 / 牌桌顶牌
  for (let i = 0; i < state.free.length; i += 1) {
    const card = state.free[i];
    if (card && canGoToFoundation(state, card)) return toFoundation({ kind: 'free', index: i }, card);
  }
  for (let i = 0; i < state.tableau.length; i += 1) {
    const card = topCard(state.tableau[i]);
    if (card && canGoToFoundation(state, card)) return toFoundation({ kind: 'tableau', index: i }, card);
  }

  // 2) 牌桌之间搬牌 (从最长的连牌开始试, 优先搬到非空列)
  const order = [ ...state.tableau.keys() ].sort((a, b) => {
    const ea = state.tableau[a].length === 0 ? 1 : 0;
    const eb = state.tableau[b].length === 0 ? 1 : 0;
    return ea - eb;
  });
  for (let i = 0; i < state.tableau.length; i += 1) {
    const pile = state.tableau[i];
    if (!pile.length) continue;
    for (let start = 0; start < pile.length; start += 1) {
      const run = runFrom(state, i, start);
      if (!run) continue;
      for (const target of order) {
        if (target === i) continue;
        const move: Move = { from: { kind: 'tableau', index: i }, to: { kind: 'tableau', index: target }, count: run.length };
        if (canMove(state, move, { superMove })) return move;
      }
    }
  }

  // 3) 自由格的牌放回牌桌
  for (let i = 0; i < state.free.length; i += 1) {
    const card = state.free[i];
    if (!card) continue;
    for (const target of order) {
      const move: Move = { from: { kind: 'free', index: i }, to: { kind: 'tableau', index: target }, count: 1 };
      if (canMove(state, move, { superMove })) return move;
    }
  }

  // 4) 牌桌顶牌挪到空自由格 (腾出下一张)
  for (let i = 0; i < state.tableau.length; i += 1) {
    if (!state.tableau[i].length) continue;
    for (let f = 0; f < state.free.length; f += 1) {
      const move: Move = { from: { kind: 'tableau', index: i }, to: { kind: 'free', index: f }, count: 1 };
      if (canMove(state, move, { superMove })) return move;
    }
  }

  // 5) 最后手段: 从收集区取回一张牌 (避免被卡死)
  if (!allowTakeBack) return null;
  for (let i = 0; i < state.foundations.length; i += 1) {
    const card = topCard(state.foundations[i]);
    if (!card) continue;
    for (const target of order) {
      const move: Move = { from: { kind: 'foundation', index: i }, to: { kind: 'tableau', index: target }, count: 1 };
      if (canMove(state, move, { superMove })) return move;
    }
  }
  return null;
};

/** 当前是否还有牌可走 (判断死局时传 allowTakeBack = false) */
export const hasAnyMove = (state: GameState, superMove = true, allowTakeBack = true): boolean =>
  findHint(state, superMove, allowTakeBack) !== null;

// ---- 键盘 ----

/** 键盘事件 -> 动作 (仅 n / r / z / h / a) */
export const keyToAction = (e: { key?: string } | null | undefined): KeyAction | null => {
  if (!e) return null;
  switch (e.key) {
    case 'n': case 'N': return 'new';
    case 'r': case 'R': return 'restart';
    case 'z': case 'Z': return 'undo';
    case 'h': case 'H': return 'hint';
    case 'a': case 'A': return 'autoCollect';
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

export interface FreeCellOptions {
  /** 每次移动后自动把「安全牌」送上收集区 */
  autoCollect: boolean;
  /** 允许多张连续移动 (容量 = (空自由格 + 1) × 2^空列) */
  superMove: boolean;
  /** 双击一张牌时自动找位置移动 */
  doubleClick: boolean;
}

export const DEFAULT_OPTIONS: FreeCellOptions = {
  autoCollect: true,
  superMove: true,
  doubleClick: true,
};

/** 任意输入 -> 完整合法的选项 (非布尔值按默认处理) */
export const normalizeOptions = (raw?: Partial<FreeCellOptions> | null): FreeCellOptions => ({
  autoCollect: raw?.autoCollect === undefined ? DEFAULT_OPTIONS.autoCollect : raw.autoCollect === true,
  superMove: raw?.superMove === undefined ? DEFAULT_OPTIONS.superMove : raw.superMove === true,
  doubleClick: raw?.doubleClick === undefined ? DEFAULT_OPTIONS.doubleClick : raw.doubleClick === true,
});

/** 读取默认设置 (非法值 / 读取失败回退默认) */
export const getDefaultOptions = (): FreeCellOptions => {
  try {
    const raw = localStorage.getItem(DEFAULTS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_OPTIONS };
    return normalizeOptions(JSON.parse(raw) as Partial<FreeCellOptions>);
  } catch {
    return { ...DEFAULT_OPTIONS };
  }
};

/** 写入默认设置 (归一化后写入; 返回真正写入的值) */
export const setDefaultOptions = (raw?: Partial<FreeCellOptions> | null): FreeCellOptions => {
  const next = normalizeOptions(raw);
  try {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 忽略 */
  }
  return next;
};

/** 局部更新默认设置 */
export const patchDefaultOptions = (patch: Partial<FreeCellOptions>): FreeCellOptions =>
  setDefaultOptions({ ...getDefaultOptions(), ...patch });

/** 两组设置是否一致 */
export const isSameOptions = (a: FreeCellOptions, b: FreeCellOptions): boolean =>
  a.autoCollect === b.autoCollect && a.superMove === b.superMove && a.doubleClick === b.doubleClick;

// ---- 战绩 ----

export interface FreeCellRecords {
  /** 开局次数 */
  plays: number;
  /** 通关次数 */
  wins: number;
  /** 最快通关用时 (ms), 0 表示还没有记录 */
  bestTimeMs: number;
  /** 最少步数通关, 0 表示还没有记录 */
  bestMoves: number;
}

export const EMPTY_RECORDS: FreeCellRecords = { plays: 0, wins: 0, bestTimeMs: 0, bestMoves: 0 };

const intOf = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

/** 任意输入 -> 合法战绩 */
export const normalizeRecords = (raw?: Partial<FreeCellRecords> | null): FreeCellRecords => ({
  plays: intOf(raw?.plays),
  wins: intOf(raw?.wins),
  bestTimeMs: intOf(raw?.bestTimeMs),
  bestMoves: intOf(raw?.bestMoves),
});

/** 读取战绩 (无记录 / 损坏返回全 0) */
export const getRecords = (): FreeCellRecords => {
  try {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    if (!raw) return { ...EMPTY_RECORDS };
    return normalizeRecords(JSON.parse(raw) as Partial<FreeCellRecords>);
  } catch {
    return { ...EMPTY_RECORDS };
  }
};

/** 写入战绩 */
export const setRecords = (raw?: Partial<FreeCellRecords> | null): FreeCellRecords => {
  const next = normalizeRecords(raw);
  try {
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 忽略 */
  }
  return next;
};

/** 记一次开局 */
export const recordPlay = (): FreeCellRecords => {
  const cur = getRecords();
  return setRecords({ ...cur, plays: cur.plays + 1 });
};

/** 记一次通关 (自动刷新最快用时 / 最少步数) */
export const recordWin = (timeMs: number, moves: number): FreeCellRecords => {
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
