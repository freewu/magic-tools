import {
  applyMove, autoCollect, canGoToFoundation, canMove, canStackOnTableau, cardId, cardText, clearRecords,
  cloneState, collectedCount, dealFromSeed, emptyColumnCount, emptyFreeCount, findHint, formatTime,
  foundationIndex, foundationTop, getDefaultOptions, getLastSeed, getRecords, hasAnyMove, isRedCard, isRun,
  isSafeToAutoPlay, isSameOptions, isTypingTarget, isWin, keyToAction, makeDeck, makeSeededRng, normalizeOptions,
  normalizeRecords, normalizeSeed, patchDefaultOptions, pileOf, randomSeed, recordPlay, recordWin, runFrom,
  setDefaultOptions, setLastSeed, setRecords, superMoveLimit, topCard,
  type Card, type GameState,
} from './lib';
import { SEED_DEFAULT, SEED_MAX, SEED_MIN, SUITS, type Suit } from './data';

const card = (suit: Suit, rank: number): Card => ({ suit, rank });

/** 空牌局: 8 空列 + 4 空自由格 + 4 空收集区 */
const emptyState = (): GameState => ({
  tableau: Array.from({ length: 8 }, () => [] as Card[]),
  free: [ null, null, null, null ],
  foundations: [ [], [], [], [] ],
  moves: 0,
});

/** 8 列各放一张 K (任何牌都接不上), 4 个自由格塞满 2♠~5♠ -> 完全无路可走 */
const stuckState = (): GameState => {
  const s = emptyState();
  s.tableau = s.tableau.map(() => [ card('S', 13) ]);
  s.free = [ card('S', 2), card('S', 3), card('S', 4), card('S', 5) ];
  return s;
};

beforeEach(() => {
  localStorage.clear();
});

describe('牌与花色', () => {
  test('makeDeck: 52 张互不相同, 每花色 13 张', () => {
    const deck = makeDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map(cardId)).size).toBe(52);
    for (const suit of SUITS) {
      expect(deck.filter((c) => c.suit === suit)).toHaveLength(13);
    }
  });

  test('cardId / cardText / isRedCard / foundationIndex', () => {
    expect(cardId(card('H', 10))).toBe('H10');
    expect(cardText(card('D', 1))).toBe('♦A');
    expect(isRedCard(card('H', 5))).toBe(true);
    expect(isRedCard(card('D', 5))).toBe(true);
    expect(isRedCard(card('S', 5))).toBe(false);
    expect(isRedCard(card('C', 5))).toBe(false);
    expect(foundationIndex('S')).toBe(0);
    expect(foundationIndex('C')).toBe(3);
  });
});

describe('局号与发牌', () => {
  test('normalizeSeed: 越界截断 / 小数取整 / 非法值回退默认', () => {
    expect(normalizeSeed(0)).toBe(SEED_MIN);
    expect(normalizeSeed(-5)).toBe(SEED_MIN);
    expect(normalizeSeed(SEED_MAX + 10)).toBe(SEED_MAX);
    expect(normalizeSeed(12.9)).toBe(12);
    expect(normalizeSeed('88')).toBe(88);
    expect(normalizeSeed('abc')).toBe(SEED_DEFAULT);
    expect(normalizeSeed(undefined)).toBe(SEED_DEFAULT);
    expect(normalizeSeed(null)).toBe(SEED_DEFAULT);
  });

  test('randomSeed: 落在 1 ~ 1000000 内, 随机源可注入', () => {
    expect(randomSeed(() => 0)).toBe(SEED_MIN);
    expect(randomSeed(() => 0.9999999)).toBe(SEED_MAX);
    expect(randomSeed(() => 1)).toBe(SEED_MAX);
  });

  test('makeSeededRng: 同种子序列相同, 值域 [0, 0x7fff]', () => {
    const a = makeSeededRng(42);
    const b = makeSeededRng(42);
    const seq = [ a(), a(), a(), a() ];
    expect([ b(), b(), b(), b() ]).toEqual(seq);
    for (const v of seq) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(0x7fff);
    }
    expect(makeSeededRng(42)()).not.toBe(makeSeededRng(43)());
  });

  test('dealFromSeed: 52 张全发完, 前 4 列 7 张 / 后 4 列 6 张, 自由格与收集区为空', () => {
    const s = dealFromSeed(SEED_DEFAULT);
    expect(s.tableau).toHaveLength(8);
    expect(s.tableau.map((p) => p.length)).toEqual([ 7, 7, 7, 7, 6, 6, 6, 6 ]);
    expect(s.tableau.flat()).toHaveLength(52);
    expect(new Set(s.tableau.flat().map(cardId)).size).toBe(52);
    expect(s.free).toEqual([ null, null, null, null ]);
    expect(s.foundations).toEqual([ [], [], [], [] ]);
    expect(s.moves).toBe(0);
  });

  test('dealFromSeed: 相同局号牌局完全一致, 不同局号不同', () => {
    expect(dealFromSeed(617)).toEqual(dealFromSeed(617));
    expect(dealFromSeed(617)).not.toEqual(dealFromSeed(618));
    expect(dealFromSeed(0)).toEqual(dealFromSeed(SEED_MIN));
  });

  test('cloneState: 深拷贝, 改动副本不影响原状态', () => {
    const s = dealFromSeed(7);
    const copy = cloneState(s);
    copy.tableau[0].pop();
    copy.free[0] = card('S', 1);
    copy.foundations[0].push(card('S', 1));
    expect(s.tableau[0]).toHaveLength(7);
    expect(s.free[0]).toBeNull();
    expect(s.foundations[0]).toHaveLength(0);
  });
});

describe('牌堆读取', () => {
  test('pileOf / topCard / foundationTop', () => {
    const s = emptyState();
    s.tableau[2] = [ card('S', 5), card('H', 4) ];
    s.free[1] = card('C', 9);
    s.foundations[0] = [ card('S', 1) ];
    expect(pileOf(s, { kind: 'tableau', index: 2 })).toHaveLength(2);
    expect(pileOf(s, { kind: 'free', index: 1 })).toEqual([ card('C', 9) ]);
    expect(pileOf(s, { kind: 'free', index: 0 })).toEqual([]);
    expect(pileOf(s, { kind: 'tableau', index: 99 })).toEqual([]);
    expect(topCard([ card('S', 3), card('D', 2) ])).toEqual(card('D', 2));
    expect(topCard([])).toBeNull();
    expect(foundationTop(s, 'S')).toEqual(card('S', 1));
    expect(foundationTop(s, 'H')).toBeNull();
  });

  test('collectedCount / emptyColumnCount / emptyFreeCount', () => {
    const s = emptyState();
    s.foundations[0] = [ card('S', 1), card('S', 2) ];
    s.tableau[0] = [ card('S', 3) ];
    s.free[3] = card('C', 7);
    expect(collectedCount(s)).toBe(2);
    expect(emptyColumnCount(s)).toBe(7);
    expect(emptyFreeCount(s)).toBe(3);
  });
});

describe('牌桌接牌规则', () => {
  test('必须小 1 且颜色相反', () => {
    expect(canStackOnTableau(card('H', 6), card('S', 7))).toBe(true);
    expect(canStackOnTableau(card('C', 6), card('D', 7))).toBe(true);
    expect(canStackOnTableau(card('H', 6), card('D', 7))).toBe(false);
    expect(canStackOnTableau(card('H', 6), card('S', 8))).toBe(false);
    expect(canStackOnTableau(card('H', 6), card('S', 6))).toBe(false);
  });

  test('空列可以放任意牌', () => {
    expect(canStackOnTableau(card('D', 13), null)).toBe(true);
    expect(canStackOnTableau(card('D', 13), undefined)).toBe(true);
  });

  test('isRun: 连续降序异色才算合法连牌', () => {
    expect(isRun([])).toBe(true);
    expect(isRun([ card('S', 8) ])).toBe(true);
    expect(isRun([ card('S', 8), card('H', 7), card('C', 6), card('D', 5) ])).toBe(true);
    expect(isRun([ card('S', 8), card('C', 7) ])).toBe(false);
    expect(isRun([ card('S', 8), card('H', 6) ])).toBe(false);
  });

  test('runFrom: 从指定下标起的连牌', () => {
    const s = emptyState();
    s.tableau[0] = [ card('D', 10), card('S', 9), card('H', 8) ];
    expect(runFrom(s, 0, 1)).toEqual([ card('S', 9), card('H', 8) ]);
    expect(runFrom(s, 0, 2)).toEqual([ card('H', 8) ]);
    expect(runFrom(s, 0, 3)).toBeNull();
    expect(runFrom(s, 1, 0)).toBeNull();
  });
});

describe('收集区规则', () => {
  test('A 空收集区可以收, 之后必须同花色 +1', () => {
    const s = emptyState();
    expect(canGoToFoundation(s, card('S', 1))).toBe(true);
    expect(canGoToFoundation(s, card('H', 2))).toBe(false);
    s.foundations[0] = [ card('S', 1) ];
    expect(canGoToFoundation(s, card('S', 2))).toBe(true);
    expect(canGoToFoundation(s, card('S', 3))).toBe(false);
    expect(canGoToFoundation(s, card('H', 2))).toBe(false);
  });
});

describe('多张移动容量', () => {
  test('(空自由格 + 1) × 2^空列', () => {
    const s = emptyState();
    expect(emptyFreeCount(s)).toBe(4);
    // 8 列全空: (4 + 1) × 2^8
    expect(superMoveLimit(s)).toBe(1280);
    s.tableau = s.tableau.map(() => [ card('S', 13) ]);
    expect(superMoveLimit(s)).toBe(5); // 没有空列
    s.tableau[0] = [];
    expect(superMoveLimit(s)).toBe(10); // 1 个空列
    s.tableau[1] = [];
    expect(superMoveLimit(s)).toBe(20); // 2 个空列
  });

  test('目标列本身是空列时少算一列', () => {
    const s = emptyState();
    s.tableau = s.tableau.map(() => [ card('S', 13) ]);
    s.tableau[0] = [];
    expect(superMoveLimit(s, true)).toBe(5);
  });

  test('关闭多张移动后容量固定为 1', () => {
    const s = emptyState();
    expect(superMoveLimit(s, false, false)).toBe(1);
  });
});

describe('移动校验与执行', () => {
  test('canMove: 牌桌之间按降序异色接牌', () => {
    const s = emptyState();
    s.tableau[0] = [ card('S', 7) ];
    s.tableau[1] = [ card('H', 8) ];
    expect(canMove(s, { from: { kind: 'tableau', index: 0 }, to: { kind: 'tableau', index: 1 }, count: 1 })).toBe(true);
    s.tableau[1] = [ card('D', 8) ]; // 黑 7 接红 8, 合法
    expect(canMove(s, { from: { kind: 'tableau', index: 0 }, to: { kind: 'tableau', index: 1 }, count: 1 })).toBe(true);
    s.tableau[1] = [ card('C', 8) ]; // 黑接黑, 不合法
    expect(canMove(s, { from: { kind: 'tableau', index: 0 }, to: { kind: 'tableau', index: 1 }, count: 1 })).toBe(false);
  });

  test('canMove: 空列可以放, 同一列不行, 空来源不行', () => {
    const s = emptyState();
    s.tableau[0] = [ card('S', 7) ];
    expect(canMove(s, { from: { kind: 'tableau', index: 0 }, to: { kind: 'tableau', index: 5 }, count: 1 })).toBe(true);
    expect(canMove(s, { from: { kind: 'tableau', index: 0 }, to: { kind: 'tableau', index: 0 }, count: 1 })).toBe(false);
    expect(canMove(s, { from: { kind: 'tableau', index: 3 }, to: { kind: 'tableau', index: 5 }, count: 1 })).toBe(false);
    expect(canMove(s, { from: { kind: 'tableau', index: 0 }, to: { kind: 'tableau', index: 5 }, count: 0 })).toBe(false);
    expect(canMove(s, { from: { kind: 'tableau', index: 0 }, to: { kind: 'tableau', index: 5 }, count: 2 })).toBe(false);
  });

  test('canMove: 自由格只能放一张且必须是空格', () => {
    const s = emptyState();
    s.tableau[0] = [ card('S', 7), card('H', 6) ];
    expect(canMove(s, { from: { kind: 'tableau', index: 0 }, to: { kind: 'free', index: 0 }, count: 1 })).toBe(true);
    expect(canMove(s, { from: { kind: 'tableau', index: 0 }, to: { kind: 'free', index: 0 }, count: 2 })).toBe(false);
    s.free[2] = card('D', 3);
    expect(canMove(s, { from: { kind: 'tableau', index: 0 }, to: { kind: 'free', index: 2 }, count: 1 })).toBe(false);
  });

  test('canMove: 收集区必须同花色升序, 下标要匹配花色', () => {
    const s = emptyState();
    s.free[0] = card('S', 1);
    expect(canMove(s, { from: { kind: 'free', index: 0 }, to: { kind: 'foundation', index: 0 }, count: 1 })).toBe(true);
    expect(canMove(s, { from: { kind: 'free', index: 0 }, to: { kind: 'foundation', index: 3 }, count: 1 })).toBe(false);
    s.free[1] = card('S', 3);
    expect(canMove(s, { from: { kind: 'free', index: 1 }, to: { kind: 'foundation', index: 0 }, count: 1 })).toBe(false);
  });

  test('canMove: 自由格 / 收集区一次只能动一张, 收集区可以取回牌桌', () => {
    const s = emptyState();
    s.free[0] = card('S', 1);
    s.free[1] = card('H', 1);
    expect(canMove(s, { from: { kind: 'free', index: 0 }, to: { kind: 'tableau', index: 0 }, count: 1 })).toBe(true);
    expect(canMove(s, { from: { kind: 'free', index: 0 }, to: { kind: 'tableau', index: 0 }, count: 2 })).toBe(false);
    s.foundations[0] = [ card('S', 1), card('S', 2) ];
    expect(canMove(s, { from: { kind: 'foundation', index: 0 }, to: { kind: 'tableau', index: 0 }, count: 1 })).toBe(true);
    expect(canMove(s, { from: { kind: 'foundation', index: 0 }, to: { kind: 'tableau', index: 0 }, count: 2 })).toBe(false);
  });

  test('canMove: 多张移动受容量限制, 关闭多张移动后只能一张', () => {
    const s = emptyState();
    // 8 列全都有牌 -> 没有空列, 容量 = 空自由格 4 + 1 = 5
    for (let i = 0; i < 8; i += 1) s.tableau[i] = [ card('S', 13) ];
    s.tableau[0] = [ card('S', 8), card('H', 7), card('C', 6), card('D', 5), card('S', 4), card('H', 3) ];
    s.tableau[1] = [ card('H', 9) ]; // 整叠 6 张的底牌黑 8 能接上
    s.tableau[2] = [ card('C', 4) ]; // 顶牌红 3 能接上
    const from = { kind: 'tableau' as const, index: 0 };
    const to = { kind: 'tableau' as const, index: 1 };
    const toTop = { kind: 'tableau' as const, index: 2 };
    expect(canMove(s, { from, to: toTop, count: 1 })).toBe(true);
    expect(canMove(s, { from, to, count: 6 })).toBe(false); // 超容量
    expect(canMove(s, { from, to, count: 5 })).toBe(false); // 红 7 接不上红 9
    expect(canMove(s, { from, to: toTop, count: 1 }, { superMove: false })).toBe(true);
    // 空出一列后容量翻倍 -> 6 张可以一次搬走
    s.tableau[3] = [];
    expect(canMove(s, { from, to, count: 6 })).toBe(true);
    expect(canMove(s, { from, to, count: 6 }, { superMove: false })).toBe(false);
  });

  test('applyMove: 移动成功并累加步数, 原状态不变', () => {
    const s = emptyState();
    s.tableau[0] = [ card('S', 7) ];
    const next = applyMove(s, { from: { kind: 'tableau', index: 0 }, to: { kind: 'tableau', index: 4 }, count: 1 });
    expect(next).not.toBeNull();
    expect(next!.tableau[0]).toHaveLength(0);
    expect(next!.tableau[4]).toEqual([ card('S', 7) ]);
    expect(next!.moves).toBe(1);
    expect(s.tableau[0]).toHaveLength(1);
    expect(s.moves).toBe(0);
  });

  test('applyMove: 连牌整体搬走', () => {
    const s = emptyState();
    s.tableau[0] = [ card('D', 9), card('S', 8), card('H', 7) ];
    s.tableau[1] = [ card('H', 9) ]; // 黑 8 接红 9
    const next = applyMove(s, { from: { kind: 'tableau', index: 0 }, to: { kind: 'tableau', index: 1 }, count: 2 });
    expect(next!.tableau[0]).toEqual([ card('D', 9) ]);
    expect(next!.tableau[1]).toEqual([ card('H', 9), card('S', 8), card('H', 7) ]);
  });

  test('applyMove: 非法移动返回 null', () => {
    const s = emptyState();
    s.tableau[0] = [ card('S', 7) ];
    expect(applyMove(s, { from: { kind: 'tableau', index: 0 }, to: { kind: 'foundation', index: 0 }, count: 1 })).toBeNull();
  });

  test('applyMove: 进收集区 / 自由格', () => {
    const s = emptyState();
    s.free[0] = card('S', 1);
    const a = applyMove(s, { from: { kind: 'free', index: 0 }, to: { kind: 'foundation', index: 0 }, count: 1 })!;
    expect(a.foundations[0]).toEqual([ card('S', 1) ]);
    expect(a.free[0]).toBeNull();
    const b = applyMove(s, { from: { kind: 'free', index: 0 }, to: { kind: 'free', index: 1 }, count: 1 })!;
    expect(b.free[1]).toEqual(card('S', 1));
    expect(b.free[0]).toBeNull();
  });
});

describe('自动收牌', () => {
  test('只收安全牌: A / 2 一定收, 高位牌不收', () => {
    const s = emptyState();
    s.tableau[0] = [ card('S', 5) ];
    s.tableau[1] = [ card('S', 1) ];
    s.free[0] = card('H', 1);
    const { state: next, played } = autoCollect(s, true);
    expect(played).toBe(2);
    expect(next.foundations[0]).toEqual([ card('S', 1) ]);
    expect(next.foundations[1]).toEqual([ card('H', 1) ]);
    expect(next.tableau[0]).toEqual([ card('S', 5) ]);
  });

  test('同花色连续多张会一路收下去', () => {
    const s = emptyState();
    // 数组顺序即牌桌显示顺序: 最右边 (末尾) 才是可以动的那张
    s.tableau[0] = [ card('S', 3), card('S', 2), card('S', 1) ];
    const safe = autoCollect(s, true);
    expect(safe.played).toBe(2); // A / 2 属于安全牌, 3 还要等红桃 / 方块跟上
    expect(safe.state.foundations[0]).toEqual([ card('S', 1), card('S', 2) ]);
    expect(safe.state.tableau[0]).toEqual([ card('S', 3) ]);
    const all = autoCollect(s, false);
    expect(all.played).toBe(3);
    expect(all.state.foundations[0]).toEqual([ card('S', 1), card('S', 2), card('S', 3) ]);
    expect(all.state.tableau[0]).toHaveLength(0);
  });

  test('safeOnly = false 时会收掉当时能收的全部牌', () => {
    const s = emptyState();
    s.foundations[0] = [ card('S', 1), card('S', 2), card('S', 3), card('S', 4) ];
    s.tableau[0] = [ card('S', 6), card('S', 5) ];
    expect(autoCollect(s, true).played).toBe(0); // 5 不是安全牌 (红桃 / 方块都还没到 4)
    const all = autoCollect(s, false);
    expect(all.played).toBe(2); // 5 收走后 6 也露出来了
    expect(all.state.foundations[0]).toHaveLength(6);
  });

  test('收牌不计步数', () => {
    const s = emptyState();
    s.moves = 7;
    s.tableau[0] = [ card('S', 1) ];
    const { state: next } = autoCollect(s, true);
    expect(next.moves).toBe(7);
  });

  test('isSafeToAutoPlay: 高位牌要等两个反色收集区跟上', () => {
    const s = emptyState();
    expect(isSafeToAutoPlay(s, card('S', 2))).toBe(true);
    expect(isSafeToAutoPlay(s, card('S', 5))).toBe(false);
    // 只跟上红桃还不够
    s.foundations[1] = [ 1, 2, 3, 4 ].map((r) => card('H', r));
    expect(isSafeToAutoPlay(s, card('S', 5))).toBe(false);
    // 红桃 / 方块都到 4 -> 黑色 5 安全
    s.foundations[2] = [ 1, 2, 3, 4 ].map((r) => card('D', r));
    expect(isSafeToAutoPlay(s, card('S', 5))).toBe(true);
    expect(isSafeToAutoPlay(s, card('S', 6))).toBe(false);
    // 红桃 / 方块都到 5 -> 黑色 6 安全
    s.foundations[1].push(card('H', 5));
    s.foundations[2].push(card('D', 5));
    expect(isSafeToAutoPlay(s, card('S', 6))).toBe(true);
    // 红色牌看的是黑色收集区 (此时还空着)
    expect(isSafeToAutoPlay(s, card('H', 3))).toBe(false);
  });
});

describe('胜利判定', () => {
  test('四个收集区各 13 张才算通关', () => {
    const s = emptyState();
    expect(isWin(s)).toBe(false);
    s.foundations = SUITS.map((suit) => Array.from({ length: 13 }, (_, i) => card(suit, i + 1)));
    expect(isWin(s)).toBe(true);
    s.foundations[3].pop();
    expect(isWin(s)).toBe(false);
  });
});

describe('提示', () => {
  test('优先把能收的牌送上收集区', () => {
    const s = emptyState();
    s.free[2] = card('D', 1);
    s.tableau[0] = [ card('S', 13) ];
    const move = findHint(s);
    expect(move).not.toBeNull();
    expect(move!.to.kind).toBe('foundation');
    expect(move!.from).toEqual({ kind: 'free', index: 2 });
    expect(canMove(s, move!)).toBe(true);
  });

  test('牌桌之间搬牌: 返回的一定是合法移动', () => {
    const s = emptyState();
    s.tableau[0] = [ card('S', 7) ];
    s.tableau[1] = [ card('H', 8) ];
    const move = findHint(s);
    expect(move).not.toBeNull();
    expect(canMove(s, move!)).toBe(true);
  });

  test('死局返回 null', () => {
    expect(findHint(stuckState())).toBeNull();
    expect(hasAnyMove(stuckState(), true, false)).toBe(false);
  });

  test('真实牌局上提示始终是合法移动', () => {
    const s = dealFromSeed(617);
    const move = findHint(s);
    expect(move).not.toBeNull();
    expect(canMove(s, move!)).toBe(true);
  });
});

describe('键盘与用时', () => {
  test('keyToAction 只认 n / r / z / h / a', () => {
    expect(keyToAction({ key: 'n' })).toBe('new');
    expect(keyToAction({ key: 'R' })).toBe('restart');
    expect(keyToAction({ key: 'z' })).toBe('undo');
    expect(keyToAction({ key: 'h' })).toBe('hint');
    expect(keyToAction({ key: 'a' })).toBe('autoCollect');
    expect(keyToAction({ key: 'x' })).toBeNull();
    expect(keyToAction(null)).toBeNull();
  });

  test('isTypingTarget: 输入控件内不抢键', () => {
    expect(isTypingTarget({ tagName: 'input' })).toBe(true);
    expect(isTypingTarget({ tagName: 'TEXTAREA' })).toBe(true);
    expect(isTypingTarget({ tagName: 'select' })).toBe(true);
    expect(isTypingTarget({ tagName: 'div', isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: 'div' })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });

  test('formatTime', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(999)).toBe('00:00');
    expect(formatTime(61_000)).toBe('01:01');
    expect(formatTime(3_600_000)).toBe('1:00:00');
    expect(formatTime(-5)).toBe('00:00');
    expect(formatTime(Number.NaN)).toBe('00:00');
  });
});

describe('默认设置', () => {
  test('默认值: 自动收牌 / 多张移动 / 双击移牌 全开', () => {
    const o = getDefaultOptions();
    expect(o).toEqual({ autoCollect: true, superMove: true, doubleClick: true });
  });

  test('写入 / 读取 / 局部更新', () => {
    setDefaultOptions({ autoCollect: false, superMove: false, doubleClick: false });
    expect(getDefaultOptions()).toEqual({ autoCollect: false, superMove: false, doubleClick: false });
    const patched = patchDefaultOptions({ superMove: true });
    expect(patched).toEqual({ autoCollect: false, superMove: true, doubleClick: false });
    expect(getDefaultOptions().superMove).toBe(true);
  });

  test('normalizeOptions: 非布尔值按原值严格判定, 缺省回退默认', () => {
    expect(normalizeOptions(null)).toEqual({ autoCollect: true, superMove: true, doubleClick: true });
    expect(normalizeOptions({ autoCollect: 1 as unknown as boolean })).toEqual({
      autoCollect: false, superMove: true, doubleClick: true,
    });
  });

  test('isSameOptions', () => {
    const a = getDefaultOptions();
    expect(isSameOptions(a, { ...a })).toBe(true);
    expect(isSameOptions(a, { ...a, autoCollect: !a.autoCollect })).toBe(false);
  });

  test('损坏的存储值回退默认', () => {
    localStorage.setItem('magic-tools-freecell-defaults', '{not json');
    expect(getDefaultOptions()).toEqual({ autoCollect: true, superMove: true, doubleClick: true });
  });
});

describe('战绩', () => {
  test('记录开局 / 通关, 自动保留最快用时与最少步数', () => {
    expect(getRecords()).toEqual({ plays: 0, wins: 0, bestTimeMs: 0, bestMoves: 0 });
    recordPlay();
    recordPlay();
    let r = recordWin(90_000, 120);
    expect(r).toEqual({ plays: 2, wins: 1, bestTimeMs: 90_000, bestMoves: 120 });
    r = recordWin(60_000, 150);
    expect(r.bestTimeMs).toBe(60_000);
    expect(r.bestMoves).toBe(120);
    r = recordWin(120_000, 90);
    expect(r.bestTimeMs).toBe(60_000);
    expect(r.bestMoves).toBe(90);
    expect(getRecords()).toEqual({ plays: 2, wins: 3, bestTimeMs: 60_000, bestMoves: 90 });
  });

  test('normalizeRecords: 负数 / NaN 归 0', () => {
    expect(normalizeRecords({ plays: -3, wins: Number.NaN, bestTimeMs: 'x' as unknown as number, bestMoves: 4.8 }))
      .toEqual({ plays: 0, wins: 0, bestTimeMs: 0, bestMoves: 4 });
  });

  test('setRecords / clearRecords', () => {
    setRecords({ plays: 1, wins: 1, bestTimeMs: 1000, bestMoves: 3 });
    expect(getRecords()).toEqual({ plays: 1, wins: 1, bestTimeMs: 1000, bestMoves: 3 });
    clearRecords();
    expect(getRecords()).toEqual({ plays: 0, wins: 0, bestTimeMs: 0, bestMoves: 0 });
  });

  test('损坏的战绩值回退全 0', () => {
    localStorage.setItem('magic-tools-freecell-records', 'not json');
    expect(getRecords()).toEqual({ plays: 0, wins: 0, bestTimeMs: 0, bestMoves: 0 });
  });
});

describe('上次局号', () => {
  test('默认局号 / 写入 / 越界归一化', () => {
    expect(getLastSeed()).toBe(SEED_DEFAULT);
    expect(setLastSeed(1234)).toBe(1234);
    expect(getLastSeed()).toBe(1234);
    expect(setLastSeed(0)).toBe(SEED_MIN);
    expect(getLastSeed()).toBe(SEED_MIN);
    localStorage.setItem('magic-tools-freecell-seed', 'garbage');
    expect(getLastSeed()).toBe(SEED_DEFAULT);
  });
});
