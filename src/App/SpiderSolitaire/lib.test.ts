import {
  DEFAULT_OPTIONS,
  EMPTY_RECORDS,
  applyMove,
  canMove,
  canStackOn,
  cardId,
  cardText,
  clearRecords,
  cloneState,
  collectCompleted,
  collectedCount,
  dealFromSeed,
  dealStock,
  dealsLeft,
  emptyColumnCount,
  faceDownCount,
  faceUpCount,
  findHint,
  formatTime,
  getDefaultOptions,
  getLastSeed,
  getRecords,
  hasAnyMove,
  isRedCard,
  isRun,
  isSameOptions,
  isStuck,
  isTypingTarget,
  isWin,
  keyToAction,
  makeDeck,
  makeSeededRng,
  movableRun,
  normalizeOptions,
  normalizeRecords,
  normalizeSeed,
  normalizeSuits,
  patchDefaultOptions,
  randomSeed,
  recordPlay,
  recordWin,
  runFrom,
  setDefaultOptions,
  setLastSeed,
  setRecords,
  topCard,
  totalCards,
  type Card,
  type GameState,
} from './lib';
import {
  DEAL_ANIM_MS, DEAL_ANIM_TOTAL_MS, DEAL_ROW_ANIM_TOTAL_MS, DEAL_ROW_STAGGER_STEP, DEAL_STAGGER_MS,
  DEFAULTS_STORAGE_KEY,
  INITIAL_COUNTS, RECORDS_STORAGE_KEY, SEED_STORAGE_KEY, SERIES_COUNT, SP_CSS, STOCK_DEAL_SIZE, type Suit,
} from './data';

/** 造一张牌 */
const mk = (suit: Suit, rank: number, faceUp = true, uid = 0): Card => ({ uid, suit, rank, faceUp });

/** 造一个牌局 (默认难度 1, 空牌堆) */
const mkState = (
  tableau: Card[][],
  extra?: { stock?: Card[]; done?: Suit[]; moves?: number }
): GameState => ({
  tableau,
  stock: extra?.stock ?? [],
  done: extra?.done ?? [],
  moves: extra?.moves ?? 0,
  suits: 1,
});

/** 空列 (测试里占位) */
const empty = (): Card[] => [];

beforeEach(() => {
  localStorage.clear();
});

describe('牌的基本属性', () => {
  test('cardId 用 uid 保证两副牌里重复花色牌值也不冲突', () => {
    expect(cardId(mk('S', 5, true, 3))).toBe('c3');
    expect(cardId(mk('S', 5, true, 56))).toBe('c56');
  });

  test('cardText 输出花色符号 + 牌值', () => {
    expect(cardText(mk('H', 1))).toBe('♥A');
    expect(cardText(mk('S', 13))).toBe('♠K');
  });

  test('isRedCard 只对红桃 / 方块为真', () => {
    expect(isRedCard(mk('H', 2))).toBe(true);
    expect(isRedCard(mk('D', 2))).toBe(true);
    expect(isRedCard(mk('S', 2))).toBe(false);
    expect(isRedCard(mk('C', 2))).toBe(false);
  });
});

describe('makeDeck 造牌', () => {
  test('任何难度都是 104 张, 且 uid 不重复', () => {
    for (const suits of [ 1, 2, 4 ] as const) {
      const deck = makeDeck(suits);
      expect(deck).toHaveLength(104);
      expect(new Set(deck.map((c) => c.uid)).size).toBe(104);
      expect(deck.every((c) => c.faceUp === false)).toBe(true);
    }
  });

  test('一花色难度: 全是黑桃, 每个牌值 8 张', () => {
    const deck = makeDeck(1);
    expect(deck.every((c) => c.suit === 'S')).toBe(true);
    for (let rank = 1; rank <= 13; rank += 1) {
      expect(deck.filter((c) => c.rank === rank)).toHaveLength(8);
    }
  });

  test('两花色难度: 黑桃 + 红桃, 每个牌值各 4 张', () => {
    const deck = makeDeck(2);
    expect(new Set(deck.map((c) => c.suit))).toEqual(new Set([ 'S', 'H' ]));
    for (let rank = 1; rank <= 13; rank += 1) {
      expect(deck.filter((c) => c.rank === rank)).toHaveLength(8);
      expect(deck.filter((c) => c.rank === rank && c.suit === 'S')).toHaveLength(4);
    }
  });

  test('四花色难度: 四种花色每个牌值各 2 张', () => {
    const deck = makeDeck(4);
    expect(new Set(deck.map((c) => c.suit))).toEqual(new Set([ 'S', 'H', 'D', 'C' ]));
    for (const suit of [ 'S', 'H', 'D', 'C' ] as const) {
      expect(deck.filter((c) => c.suit === suit)).toHaveLength(26);
      expect(deck.filter((c) => c.suit === suit && c.rank === 7)).toHaveLength(2);
    }
  });

  test('normalizeSuits 只接受 1 / 2 / 4', () => {
    expect(normalizeSuits(1)).toBe(1);
    expect(normalizeSuits(2)).toBe(2);
    expect(normalizeSuits('4')).toBe(4);
    expect(normalizeSuits(3)).toBe(1);
    expect(normalizeSuits(null)).toBe(1);
  });
});

describe('局号与发牌', () => {
  test('normalizeSeed 收敛到 1 ~ 1000000', () => {
    expect(normalizeSeed(0)).toBe(1);
    expect(normalizeSeed(-5)).toBe(1);
    expect(normalizeSeed(2000000)).toBe(1000000);
    expect(normalizeSeed('123')).toBe(123);
    expect(normalizeSeed('abc')).toBe(2026);
    expect(normalizeSeed(null)).toBe(2026);
  });

  test('randomSeed 落在合法范围内且可注入随机源', () => {
    expect(randomSeed(() => 0)).toBe(1);
    expect(randomSeed(() => 0.9999999)).toBe(1000000);
    expect(randomSeed(() => 0.5)).toBeGreaterThan(1);
  });

  test('makeSeededRng 同种子输出一致', () => {
    const a = makeSeededRng(42);
    const b = makeSeededRng(42);
    const seqA = [ a(), a(), a() ];
    const seqB = [ b(), b(), b() ];
    expect(seqA).toEqual(seqB);
    expect(seqA.every((v) => v >= 0 && v <= 0x7fff)).toBe(true);
  });

  test('发牌: 10 列共 54 张 (前 4 列 6 张, 后 6 列 5 张), 牌堆 50 张', () => {
    const state = dealFromSeed(1, 1);
    expect(state.tableau).toHaveLength(10);
    expect(state.tableau.map((pile) => pile.length)).toEqual([ 6, 6, 6, 6, 5, 5, 5, 5, 5, 5 ]);
    expect(state.stock).toHaveLength(50);
    expect(totalCards(state)).toBe(104);
    expect(state.moves).toBe(0);
    expect(state.done).toHaveLength(0);
  });

  test('发牌: 每列只有顶牌翻开, 牌堆全部盖着', () => {
    const state = dealFromSeed(7, 2);
    state.tableau.forEach((pile) => {
      expect(pile[pile.length - 1].faceUp).toBe(true);
      expect(pile.slice(0, -1).every((card) => !card.faceUp)).toBe(true);
    });
    expect(state.stock.every((card) => !card.faceUp)).toBe(true);
    expect(faceUpCount(state)).toBe(10);
    expect(faceDownCount(state)).toBe(44);
  });

  test('相同局号 + 相同难度必得相同牌局', () => {
    const a = dealFromSeed(777, 4);
    const b = dealFromSeed(777, 4);
    const sig = (s: GameState) => s.tableau.map((pile) => pile.map((c) => `${c.suit}${c.rank}`).join(','));
    expect(sig(a)).toEqual(sig(b));
    expect(a.stock.map((c) => c.uid)).toEqual(b.stock.map((c) => c.uid));
  });

  test('不同局号 / 不同难度牌局不同', () => {
    const sig = (s: GameState) => s.tableau.flat().map((c) => `${c.suit}${c.rank}`).join(',');
    expect(sig(dealFromSeed(1, 1))).not.toBe(sig(dealFromSeed(2, 1)));
    expect(sig(dealFromSeed(1, 1))).not.toBe(sig(dealFromSeed(1, 2)));
  });

  test('cloneState 是深拷贝', () => {
    const state = dealFromSeed(3, 1);
    const copy = cloneState(state);
    copy.tableau[0][0].faceUp = true;
    copy.stock.pop();
    copy.done.push('S');
    copy.moves = 9;
    expect(state.tableau[0][0].faceUp).toBe(false);
    expect(state.stock).toHaveLength(50);
    expect(state.done).toHaveLength(0);
    expect(state.moves).toBe(0);
  });
});

describe('连牌与移动校验', () => {
  test('isRun: 同花降序为真', () => {
    expect(isRun([ mk('S', 9), mk('S', 8), mk('S', 7) ])).toBe(true);
    expect(isRun([ mk('H', 13) ])).toBe(true);
    expect(isRun([])).toBe(true);
  });

  test('isRun: 花色不同 / 不连续 / 有盖牌都为假', () => {
    expect(isRun([ mk('S', 9), mk('H', 8) ])).toBe(false);
    expect(isRun([ mk('S', 9), mk('S', 7) ])).toBe(false);
    expect(isRun([ mk('S', 9), mk('S', 8, false) ])).toBe(false);
  });

  test('runFrom 取不出合法连牌时返回 null', () => {
    const state = mkState([ [ mk('S', 9, true, 1), mk('S', 8, true, 2), mk('H', 5, true, 3) ], empty() ]);
    expect(runFrom(state, 0, 0)).toBeNull();
    expect(runFrom(state, 0, 1)).toBeNull();
    expect(runFrom(state, 0, 2)?.map(cardId)).toEqual([ 'c3' ]);
    expect(runFrom(state, 0, 5)).toBeNull();
  });

  test('movableRun 取出整段同花连牌', () => {
    const state = mkState([
      [ mk('S', 4, false, 1), mk('S', 9, true, 2), mk('S', 8, true, 3), mk('S', 7, true, 4) ],
    ]);
    expect(movableRun(state, 0)?.map(cardId)).toEqual([ 'c2', 'c3', 'c4' ]);
  });

  test('canStackOn: 空列随便放, 否则要大 1 (花色不限)', () => {
    expect(canStackOn(mk('S', 5), null)).toBe(true);
    expect(canStackOn(mk('S', 5), mk('H', 6))).toBe(true);
    expect(canStackOn(mk('S', 5), mk('S', 6))).toBe(true);
    expect(canStackOn(mk('S', 5), mk('S', 7))).toBe(false);
    expect(canStackOn(mk('S', 5), mk('S', 6, false))).toBe(false);
  });

  test('canMove: 合法连牌可以搬到更大 1 的牌上', () => {
    const state = mkState([
      [ mk('S', 9, true, 1), mk('S', 8, true, 2) ],
      [ mk('H', 10, true, 3) ],
    ]);
    // 整段 ♠9 ♠8 可以放到 10 上
    expect(canMove(state, { from: 0, to: 1, count: 2 })).toBe(true);
    // 但只搬最上面那张 ♠8 时, 落点必须是 9
    expect(canMove(state, { from: 0, to: 1, count: 1 })).toBe(false);
    expect(canMove(state, { from: 1, to: 0, count: 1 })).toBe(false);
    const s2 = mkState([ [ mk('S', 9, true, 1), mk('S', 8, true, 2) ], [ mk('H', 9, true, 3) ] ]);
    expect(canMove(s2, { from: 0, to: 1, count: 1 })).toBe(true);
  });

  test('canMove: 混花色的连牌只能单张搬, 整段不合法', () => {
    const state = mkState([
      [ mk('S', 9, true, 1), mk('H', 8, true, 2) ],
      [ mk('S', 9, true, 3) ],
    ]);
    expect(canMove(state, { from: 0, to: 1, count: 2 })).toBe(false);
    expect(canMove(state, { from: 0, to: 1, count: 1 })).toBe(true);
  });

  test('canMove: 空列可放整段, 盖着的牌拿不起来', () => {
    const state = mkState([
      [ mk('S', 9, false, 1), mk('S', 8, true, 2) ],
      empty(),
    ]);
    expect(canMove(state, { from: 0, to: 1, count: 1 })).toBe(true);
    expect(canMove(state, { from: 0, to: 1, count: 2 })).toBe(false);
  });

  test('canMove: 列相同 / 张数越界 / 张数为 0 都不合法', () => {
    const state = mkState([ [ mk('S', 5, true, 1), mk('S', 4, true, 2) ], [ mk('S', 6, true, 3) ] ]);
    expect(canMove(state, { from: 0, to: 0, count: 1 })).toBe(false);
    expect(canMove(state, { from: 0, to: 1, count: 3 })).toBe(false);
    expect(canMove(state, { from: 0, to: 1, count: 0 })).toBe(false);
    expect(canMove(state, { from: 0, to: 9, count: 1 })).toBe(false);
  });
});

describe('applyMove 执行移动', () => {
  test('搬牌后步数 +1, 并自动翻开露出的盖牌', () => {
    const state = mkState([
      [ mk('S', 5, false, 1), mk('S', 9, true, 2) ],
      [ mk('H', 10, true, 3) ],
    ]);
    const next = applyMove(state, { from: 0, to: 1, count: 1 })!;
    expect(next).not.toBeNull();
    expect(next.tableau[0]).toHaveLength(1);
    expect(next.tableau[0][0].faceUp).toBe(true);
    expect(next.tableau[1].map(cardId)).toEqual([ 'c3', 'c2' ]);
    expect(next.moves).toBe(1);
    // 原状态不变
    expect(state.tableau[0]).toHaveLength(2);
    expect(state.tableau[0][0].faceUp).toBe(false);
  });

  test('非法移动返回 null', () => {
    const state = mkState([ [ mk('S', 5, true, 1) ], [ mk('S', 9, true, 2) ] ]);
    expect(applyMove(state, { from: 0, to: 1, count: 1 })).toBeNull();
  });

  test('搬到空列后整列清空, 不留空牌', () => {
    const state = mkState([ [ mk('S', 5, true, 1) ], empty() ]);
    const next = applyMove(state, { from: 0, to: 1, count: 1 })!;
    expect(next.tableau[0]).toHaveLength(0);
    expect(emptyColumnCount(next)).toBe(1);
  });
});

describe('凑齐同花 K→A 自动收走', () => {
  /** K..A 同花顺 (自下而上 K→A) */
  const series = (suit: Suit, baseUid = 100): Card[] =>
    Array.from({ length: 13 }, (_, i) => mk(suit, 13 - i, true, baseUid + i));

  test('collectCompleted 收走一整组并记录花色', () => {
    const state = mkState([ series('S'), [ mk('H', 3, true, 1) ] ]);
    const { state: next, collected } = collectCompleted(state);
    expect(collected).toBe(1);
    expect(next.done).toEqual([ 'S' ]);
    expect(next.tableau[0]).toHaveLength(0);
    expect(collectedCount(next)).toBe(1);
    // 原状态不变
    expect(state.tableau[0]).toHaveLength(13);
  });

  test('K→A 顺序不对 / 花色不统一时不收', () => {
    const broken = series('S');
    broken[5] = mk('H', 8, true, 105);
    expect(collectCompleted(mkState([ broken ])).collected).toBe(0);

    const reversed = [ ...series('S') ].reverse();
    expect(collectCompleted(mkState([ reversed ])).collected).toBe(0);
  });

  test('收走后露出新的顶牌并翻开', () => {
    const state = mkState([ [ mk('H', 4, false, 1), ...series('S') ] ]);
    const { state: next } = collectCompleted(state);
    expect(next.tableau[0]).toHaveLength(1);
    expect(next.tableau[0][0].faceUp).toBe(true);
  });

  test('一组 13 张里混了盖着的牌不收', () => {
    const pile = series('S');
    pile[3].faceUp = false;
    expect(collectCompleted(mkState([ pile ])).collected).toBe(0);
  });

  test('autoCollect 关闭时 applyMove 不自动收牌', () => {
    const cards = series('S', 100);
    // 第一列只有 ♠A, 第二列是 K→2, 把 A 放上去刚好凑齐
    const state = mkState([ [ cards[12] ], cards.slice(0, 12) ]);
    const next = applyMove(state, { from: 0, to: 1, count: 1 }, { autoCollect: false })!;
    expect(next.done).toHaveLength(0);
    expect(next.tableau[1]).toHaveLength(13);
    // 自动收牌打开时, 同样一步会收走
    const auto = applyMove(state, { from: 0, to: 1, count: 1 }, { autoCollect: true })!;
    expect(auto.done).toEqual([ 'S' ]);
    expect(auto.tableau[1]).toHaveLength(0);
    expect(state.done).toHaveLength(0);
  });
});

describe('发牌堆', () => {
  const stockState = (stockCount: number, extraCols: Card[][] = []): GameState => {
    const stock = Array.from({ length: stockCount }, (_, i) => mk('S', (i % 13) + 1, false, 1000 + i));
    const tableau = Array.from({ length: 10 }, (_, i) => extraCols[i] ?? [ mk('H', (i % 13) + 1, true, i) ]);
    return mkState(tableau, { stock });
  };

  test('发一轮: 每列各补 1 张明牌, 牌堆少 10 张', () => {
    const state = stockState(20);
    const result = dealStock(state);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.stock).toHaveLength(10);
    result.state.tableau.forEach((pile, i) => {
      expect(pile).toHaveLength(2);
      expect(pile[pile.length - 1].faceUp).toBe(true);
      // 牌堆从末尾开始发, 所以第 0 列拿到的是原来最上面那张
      expect(pile[pile.length - 1].uid).toBe(1000 + (20 - 1 - i));
    });
    expect(dealsLeft(state)).toBe(2);
  });

  test('有空列时禁止发牌 (经典规则)', () => {
    const state = stockState(20, [ empty() ]);
    const blocked = dealStock(state, { strictDeal: true });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.reason).toBe('empty');
    // 关掉严格模式就能发
    const loose = dealStock(state, { strictDeal: false });
    expect(loose.ok).toBe(true);
  });

  test('牌堆不足 10 张时发不了', () => {
    const result = dealStock(stockState(9));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('stock');
  });
});

describe('通关 / 死局 / 提示', () => {
  test('收齐 8 组即通关', () => {
    const done = Array.from({ length: SERIES_COUNT }, () => 'S' as Suit);
    expect(isWin(mkState([ empty() ], { done }))).toBe(true);
    expect(isWin(mkState([ empty() ]))).toBe(false);
  });

  test('findHint 找到同花接龙的走法', () => {
    const state = mkState([
      [ mk('S', 9, true, 1) ],
      [ mk('S', 10, true, 2) ],
      [ mk('H', 4, true, 3) ],
    ]);
    const hint = findHint(state);
    expect(hint).not.toBeNull();
    if (hint && 'from' in hint) {
      expect(hint.from).toBe(0);
      expect(hint.to).toBe(1);
      expect(hint.count).toBe(1);
    } else {
      throw new Error('应当返回走牌提示');
    }
  });

  test('findHint 优先同花接龙 (而不是随便找个能接的)', () => {
    const state = mkState([
      [ mk('S', 9, true, 1) ],
      [ mk('H', 10, true, 2) ],
      [ mk('S', 10, true, 3) ],
    ]);
    const hint = findHint(state);
    if (!hint || !('from' in hint)) throw new Error('应当返回走牌提示');
    expect(hint.to).toBe(2);
  });

  test('走不了牌但能发牌时, 提示发牌', () => {
    const stock = Array.from({ length: 10 }, (_, i) => mk('S', (i % 13) + 1, false, 500 + i));
    // 每列都只有一张 K, 互相都接不上
    const state = mkState(
      Array.from({ length: 10 }, (_, i) => [ mk('S', 13, true, i) ]),
      { stock }
    );
    const hint = findHint(state);
    expect(hint).toEqual({ deal: true });
    expect(hasAnyMove(state)).toBe(true);
    expect(hasAnyMove(state, undefined, false)).toBe(false);
    expect(isStuck(state)).toBe(false);
  });

  test('既走不了牌又不能发牌即为死局', () => {
    const state = mkState(Array.from({ length: 10 }, (_, i) => [ mk('S', 13, true, i) ]));
    expect(findHint(state)).toBeNull();
    expect(hasAnyMove(state)).toBe(false);
    expect(isStuck(state)).toBe(true);
    // 已经通关时不算死局
    const done = Array.from({ length: SERIES_COUNT }, () => 'S' as Suit);
    expect(isStuck(mkState([ empty() ], { done }))).toBe(false);
  });
});

describe('键盘与时间格式化', () => {
  test('keyToAction 映射 n/r/z/h/d/c', () => {
    expect(keyToAction({ key: 'n' })).toBe('new');
    expect(keyToAction({ key: 'N' })).toBe('new');
    expect(keyToAction({ key: 'r' })).toBe('restart');
    expect(keyToAction({ key: 'z' })).toBe('undo');
    expect(keyToAction({ key: 'h' })).toBe('hint');
    expect(keyToAction({ key: 'd' })).toBe('deal');
    expect(keyToAction({ key: 'C' })).toBe('collect');
    expect(keyToAction({ key: 'x' })).toBeNull();
    expect(keyToAction(null)).toBeNull();
  });

  test('isTypingTarget 识别输入控件', () => {
    expect(isTypingTarget({ tagName: 'INPUT' })).toBe(true);
    expect(isTypingTarget({ tagName: 'textarea' })).toBe(true);
    expect(isTypingTarget({ isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: 'DIV' })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });

  test('formatTime 输出 mm:ss / h:mm:ss', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(5000)).toBe('00:05');
    expect(formatTime(65000)).toBe('01:05');
    expect(formatTime(3600000)).toBe('1:00:00');
    expect(formatTime(3661000)).toBe('1:01:01');
    expect(formatTime(-1)).toBe('00:00');
  });
});

describe('默认设置', () => {
  test('DEFAULT_OPTIONS 是一花色 / 严格发牌 / 双击 / 自动收牌', () => {
    expect(DEFAULT_OPTIONS).toEqual({ suits: 1, strictDeal: true, doubleClick: true, autoCollect: true });
  });

  test('normalizeOptions 补齐缺省字段并校正非法值', () => {
    expect(normalizeOptions(null)).toEqual(DEFAULT_OPTIONS);
    expect(normalizeOptions({ suits: 4 })).toEqual({ ...DEFAULT_OPTIONS, suits: 4 });
    expect(normalizeOptions({ suits: 3 as never, strictDeal: false })).toEqual({
      ...DEFAULT_OPTIONS,
      suits: 1,
      strictDeal: false,
    });
    expect(normalizeOptions({ strictDeal: 'yes' as never }).strictDeal).toBe(false);
  });

  test('读写默认设置 (损坏数据回退默认)', () => {
    expect(getDefaultOptions()).toEqual(DEFAULT_OPTIONS);
    setDefaultOptions({ suits: 2, autoCollect: false });
    expect(getDefaultOptions()).toEqual({ ...DEFAULT_OPTIONS, suits: 2, autoCollect: false });
    localStorage.setItem(DEFAULTS_STORAGE_KEY, '{oops');
    expect(getDefaultOptions()).toEqual(DEFAULT_OPTIONS);
  });

  test('patchDefaultOptions 局部更新, isSameOptions 比较', () => {
    const next = patchDefaultOptions({ doubleClick: false });
    expect(next.doubleClick).toBe(false);
    expect(next.suits).toBe(1);
    expect(isSameOptions(next, getDefaultOptions())).toBe(true);
    expect(isSameOptions(next, { ...next, strictDeal: false })).toBe(false);
  });
});

describe('战绩与局号', () => {
  test('normalizeRecords 过滤非法值', () => {
    expect(normalizeRecords(null)).toEqual(EMPTY_RECORDS);
    expect(normalizeRecords({ plays: -3, wins: 2, bestTimeMs: 12.7, bestMoves: 'x' as never })).toEqual({
      plays: 0,
      wins: 2,
      bestTimeMs: 12,
      bestMoves: 0,
    });
  });

  test('recordPlay / recordWin / clearRecords', () => {
    expect(getRecords()).toEqual(EMPTY_RECORDS);
    recordPlay();
    recordPlay();
    expect(getRecords().plays).toBe(2);
    recordWin(65000, 120);
    expect(getRecords().wins).toBe(1);
    expect(getRecords().bestTimeMs).toBe(65000);
    recordWin(90000, 100);
    expect(getRecords().bestTimeMs).toBe(65000);
    expect(getRecords().bestMoves).toBe(100);
    clearRecords();
    expect(getRecords()).toEqual(EMPTY_RECORDS);
  });

  test('写入损坏战绩时回退空记录', () => {
    setRecords({ plays: 5, wins: 1, bestTimeMs: 1000, bestMoves: 10 });
    expect(getRecords().plays).toBe(5);
    localStorage.setItem(RECORDS_STORAGE_KEY, 'not-json');
    expect(getRecords()).toEqual(EMPTY_RECORDS);
  });

  test('上次局号读写', () => {
    expect(getLastSeed()).toBe(2026);
    setLastSeed(888);
    expect(getLastSeed()).toBe(888);
    setLastSeed(0);
    expect(getLastSeed()).toBe(1);
    localStorage.setItem(SEED_STORAGE_KEY, 'NaN');
    expect(getLastSeed()).toBe(2026);
  });
});

describe('样式与动画 (data.ts)', () => {
  test('选中高亮用 inset 描边 + 底色, 否则会被下一张牌盖住看不见', () => {
    expect(SP_CSS).toMatch(/\.sp-card\.is-selected[^}]*inset/s);
    expect(SP_CSS).toMatch(/\.sp-card\.is-selected[^}]*background/s);
  });

  test('提示高亮同样用 inset 描边', () => {
    expect(SP_CSS).toMatch(/@keyframes sp-pulse[\s\S]*?inset[\s\S]*?\}/);
  });

  test('发牌动画按 --sp-order 错开, 且总时长够所有牌飞完', () => {
    expect(SP_CSS).toMatch(/\.sp-card\[data-deal\]/);
    expect(SP_CSS).toMatch(/@keyframes sp-deal-in/);
    expect(SP_CSS).toMatch(/var\(--sp-order/);
    const dealt = INITIAL_COUNTS.reduce((a, b) => a + b, 0);
    expect(DEAL_ANIM_TOTAL_MS).toBeGreaterThan(DEAL_ANIM_MS + DEAL_STAGGER_MS * dealt);
    expect(DEAL_ROW_ANIM_TOTAL_MS).toBeGreaterThan(
      DEAL_ANIM_MS + DEAL_STAGGER_MS * STOCK_DEAL_SIZE * DEAL_ROW_STAGGER_STEP
    );
  });

  test('尊重 reduced-motion: 动画可关闭', () => {
    expect(SP_CSS).toMatch(/prefers-reduced-motion[\s\S]*?animation: none/);
  });

  test('拖动时给可落位列加 is-ok 高亮, 不可移动的牌用 not-allowed', () => {
    expect(SP_CSS).toMatch(/\.sp-col\.is-ok[^}]*outline/s);
    expect(SP_CSS).toMatch(/\.sp-card\.is-loose[^}]*not-allowed/s);
  });

  test('触屏上拖牌不会被系统菜单 / 原生拖拽打断', () => {
    expect(SP_CSS).toMatch(/\.sp-card \{[^}]*-webkit-touch-callout: none/s);
    expect(SP_CSS).toMatch(/\.sp-card \{[^}]*-webkit-user-drag: none/s);
    expect(SP_CSS).toMatch(/\.sp-card \{[^}]*touch-action: none/s);
  });
});

describe('杂项', () => {
  test('topCard 取末尾一张', () => {
    expect(topCard([])).toBeNull();
    expect(topCard([ mk('S', 3, true, 1), mk('S', 4, true, 2) ])?.uid).toBe(2);
  });

  test('totalCards 统计牌桌上 + 牌堆 + 已收走的牌', () => {
    const state = dealFromSeed(5, 1);
    expect(totalCards(state)).toBe(104);
    state.done.push('S');
    expect(totalCards(state)).toBe(117); // 多算了一组 13 张 (只用于自检)
  });

  test('dealsLeft 按 10 张一轮计算', () => {
    expect(dealsLeft(mkState([ empty() ], { stock: new Array(50).fill(mk('S', 1)) }))).toBe(5);
    expect(dealsLeft(mkState([ empty() ], { stock: new Array(9).fill(mk('S', 1)) }))).toBe(0);
  });
});
