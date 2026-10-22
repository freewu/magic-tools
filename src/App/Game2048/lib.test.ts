import {
  BEST_STORAGE_KEY,
  BOARD_SIZE_DEFAULT,
  DEFAULTS_STORAGE_KEY,
  STATE_STORAGE_KEY,
  WIN_DEFAULT,
} from './data';
import {
  DEFAULT_OPTIONS,
  cellKey,
  canMove,
  clearBestScores,
  clearState,
  collapseLine,
  createBoard,
  dirOfKey,
  emptyCells,
  getBestScore,
  getBestScores,
  getDefaultOptions,
  hasReached,
  isGameOver,
  isSameOptions,
  isTypingTarget,
  linesOf,
  loadState,
  maxTile,
  moveBoard,
  normalizeOptions,
  normalizeSize,
  normalizeWin,
  patchDefaultOptions,
  saveState,
  setBestScore,
  setDefaultOptions,
  spawnTile,
  startBoard,
  tileColor,
  tileFontScale,
  type Board,
} from './lib';

beforeEach(() => {
  localStorage.clear();
});

/** 固定序列随机数: 依次返回给定值 (用尽后返回最后一个) */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
};

describe('棋盘基础', () => {
  test('createBoard 生成 size×size 的全 0 棋盘', () => {
    const b = createBoard(4);
    expect(b).toHaveLength(4);
    expect(b.every((row) => row.length === 4)).toBe(true);
    expect(b.flat().every((v) => v === 0)).toBe(true);
  });

  test('normalizeSize 只接受 4 / 5 / 6, 其余回退默认', () => {
    expect(normalizeSize(5)).toBe(5);
    expect(normalizeSize('6')).toBe(6);
    expect(normalizeSize(3)).toBe(BOARD_SIZE_DEFAULT);
    expect(normalizeSize(undefined)).toBe(BOARD_SIZE_DEFAULT);
    expect(normalizeSize('abc')).toBe(BOARD_SIZE_DEFAULT);
  });

  test('emptyCells 按行优先列出空位', () => {
    const b: Board = [
      [ 2, 0 ],
      [ 0, 4 ],
    ];
    expect(emptyCells(b)).toEqual([ { r: 0, c: 1 }, { r: 1, c: 0 } ]);
  });

  test('maxTile / hasReached', () => {
    const b: Board = [ [ 2, 4 ], [ 8, 16 ] ];
    expect(maxTile(b)).toBe(16);
    expect(hasReached(b, 16)).toBe(true);
    expect(hasReached(b, 2048)).toBe(false);
    expect(maxTile(createBoard(3))).toBe(0);
  });

  test('cellKey 拼装行列', () => {
    expect(cellKey({ r: 1, c: 2 })).toBe('1-2');
  });
});

describe('collapseLine (单行合并)', () => {
  test('非零靠左, 空位补在末尾', () => {
    expect(collapseLine([ 0, 2, 0, 4 ])).toEqual({ line: [ 2, 4, 0, 0 ], gained: 0, mergedAt: [] });
  });

  test('相邻相等合并为两倍并计分', () => {
    expect(collapseLine([ 2, 2, 0, 0 ])).toEqual({ line: [ 4, 0, 0, 0 ], gained: 4, mergedAt: [ 0 ] });
  });

  test('四连相同只合并成两对 (每个方块一次移动只合并一次)', () => {
    expect(collapseLine([ 2, 2, 2, 2 ])).toEqual({ line: [ 4, 4, 0, 0 ], gained: 8, mergedAt: [ 0, 1 ] });
  });

  test('[4,4,8,8] 合并为 [8,16]', () => {
    expect(collapseLine([ 4, 4, 8, 8 ])).toEqual({ line: [ 8, 16, 0, 0 ], gained: 24, mergedAt: [ 0, 1 ] });
  });

  test('[2,2,4] 先合并 2 再留下 4 (不连锁合并)', () => {
    // 结果是 4,4 而不是 8: 合并出的方块本次不再参与合并
    expect(collapseLine([ 2, 2, 4 ])).toEqual({ line: [ 4, 4, 0 ], gained: 4, mergedAt: [ 0 ] });
  });

  test('无法合并时原样返回', () => {
    expect(collapseLine([ 2, 4, 2, 4 ])).toEqual({ line: [ 2, 4, 2, 4 ], gained: 0, mergedAt: [] });
  });
});

describe('linesOf / moveBoard', () => {
  const b: Board = [
    [ 2, 2, 0, 0 ],
    [ 0, 4, 0, 4 ],
    [ 0, 0, 8, 8 ],
    [ 2, 0, 2, 2 ],
  ];

  test('linesOf 四个方向的读行顺序', () => {
    const left = linesOf(2, 'left');
    expect(left).toEqual([ [ { r: 0, c: 0 }, { r: 0, c: 1 } ], [ { r: 1, c: 0 }, { r: 1, c: 1 } ] ]);
    const right = linesOf(2, 'right');
    expect(right[0]).toEqual([ { r: 0, c: 1 }, { r: 0, c: 0 } ]);
    const up = linesOf(2, 'up');
    expect(up[0]).toEqual([ { r: 0, c: 0 }, { r: 1, c: 0 } ]);
    const down = linesOf(2, 'down');
    expect(down[0]).toEqual([ { r: 1, c: 0 }, { r: 0, c: 0 } ]);
  });

  test('向左移动: 合并 + 计分 + 记录合并格子', () => {
    const res = moveBoard(b, 'left');
    expect(res.board).toEqual([
      [ 4, 0, 0, 0 ],
      [ 8, 0, 0, 0 ],
      [ 16, 0, 0, 0 ],
      [ 4, 2, 0, 0 ],
    ]);
    expect(res.gained).toBe(4 + 8 + 16 + 4);
    expect(res.moved).toBe(true);
    expect(res.merges).toEqual([
      { r: 0, c: 0, v: 4 },
      { r: 1, c: 0, v: 8 },
      { r: 2, c: 0, v: 16 },
      { r: 3, c: 0, v: 4 },
    ]);
  });

  test('向右移动: 合并后的方块靠右', () => {
    const res = moveBoard(b, 'right');
    expect(res.board).toEqual([
      [ 0, 0, 0, 4 ],
      [ 0, 0, 0, 8 ],
      [ 0, 0, 0, 16 ],
      [ 0, 0, 2, 4 ],
    ]);
    expect(res.gained).toBe(32);
  });

  test('向上 / 向下移动: 按列合并', () => {
    const up = moveBoard([ [ 2, 0 ], [ 2, 0 ] ], 'up');
    expect(up.board).toEqual([ [ 4, 0 ], [ 0, 0 ] ]);
    expect(up.gained).toBe(4);
    const down = moveBoard([ [ 2, 0 ], [ 2, 0 ] ], 'down');
    expect(down.board).toEqual([ [ 0, 0 ], [ 4, 0 ] ]);
    expect(down.gained).toBe(4);
  });

  test('无法移动时 moved = false (不应生成新方块)', () => {
    const stuck: Board = [ [ 2, 4 ], [ 8, 16 ] ];
    for (const dir of [ 'left', 'right', 'up', 'down' ] as const) {
      expect(moveBoard(stuck, dir).moved).toBe(false);
    }
    // 仍可合并的方向则 moved = true
    expect(moveBoard([ [ 2, 2 ], [ 8, 16 ] ], 'left').moved).toBe(true);
  });

  test('moveBoard 不修改传入的棋盘', () => {
    const src: Board = [ [ 2, 2 ], [ 0, 0 ] ];
    moveBoard(src, 'left');
    expect(src).toEqual([ [ 2, 2 ], [ 0, 0 ] ]);
  });
});

describe('canMove / isGameOver', () => {
  test('有空格可以移动', () => {
    expect(canMove([ [ 2, 4 ], [ 8, 0 ] ])).toBe(true);
  });

  test('满盘但存在相邻相同也能移动', () => {
    expect(canMove([ [ 2, 2 ], [ 4, 8 ] ])).toBe(true);
    expect(canMove([ [ 2, 4 ], [ 2, 8 ] ])).toBe(true);
  });

  test('满盘且无相邻相同即结束', () => {
    const board: Board = [ [ 2, 4 ], [ 8, 16 ] ];
    expect(canMove(board)).toBe(false);
    expect(isGameOver(board)).toBe(true);
    expect(isGameOver([ [ 2, 2 ], [ 4, 8 ] ])).toBe(false);
  });
});

describe('spawnTile / startBoard', () => {
  test('按随机数选空位; rng >= FOUR_RATE 生成 2', () => {
    const board: Board = [ [ 0, 4 ], [ 8, 16 ] ];
    // 第一个 rng 决定位置 (0 -> 第一个空位), 第二个决定数字 (0.5 -> 2)
    const res = spawnTile(board, seq(0, 0.5));
    expect(res?.tile).toEqual({ r: 0, c: 0, v: 2 });
    expect(board[0][0]).toBe(0); // 原棋盘不被修改
  });

  test('rng < FOUR_RATE 生成 4', () => {
    const res = spawnTile(createBoard(4), seq(0, 0.05));
    expect(res?.tile.v).toBe(4);
  });

  test('棋盘已满时返回 null', () => {
    expect(spawnTile([ [ 2, 4 ], [ 8, 16 ] ])).toBeNull();
  });

  test('startBoard 开局放 2 个方块', () => {
    const { board, tiles } = startBoard(4, seq(0, 0.9));
    expect(tiles).toHaveLength(2);
    expect(board.flat().filter((v) => v > 0).length).toBe(2);
    expect(board.flat().every((v) => v === 0 || v === 2 || v === 4)).toBe(true);
  });
});

describe('键盘映射', () => {
  test('方向键 / WASD 映射到四个方向', () => {
    expect(dirOfKey({ key: 'ArrowLeft' })).toBe('left');
    expect(dirOfKey({ key: 'ArrowRight' })).toBe('right');
    expect(dirOfKey({ key: 'ArrowUp' })).toBe('up');
    expect(dirOfKey({ key: 'ArrowDown' })).toBe('down');
    expect(dirOfKey({ key: 'a' })).toBe('left');
    expect(dirOfKey({ key: 'D' })).toBe('right');
    expect(dirOfKey({ key: 'w' })).toBe('up');
    expect(dirOfKey({ key: 'S' })).toBe('down');
    expect(dirOfKey({ key: 'Enter' })).toBeNull();
    expect(dirOfKey(null)).toBeNull();
  });

  test('输入控件内的按键不拦截', () => {
    expect(isTypingTarget({ tagName: 'input' })).toBe(true);
    expect(isTypingTarget({ tagName: 'TEXTAREA' })).toBe(true);
    expect(isTypingTarget({ tagName: 'div', isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: 'div' })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

describe('配色与字号', () => {
  test('已知数字用配色表, 超大数字用兜底色', () => {
    expect(tileColor(2).bg).toBe('#eee4da');
    expect(tileColor(2048).bg).toBe('#edc22e');
    expect(tileColor(65536)).toEqual({ bg: '#1f1d18', fg: '#f9f6f2' });
  });

  test('位数越多字号系数越小', () => {
    expect(tileFontScale(2)).toBeGreaterThan(tileFontScale(128));
    expect(tileFontScale(128)).toBeGreaterThan(tileFontScale(16384));
    expect(tileFontScale(1234567)).toBeCloseTo(0.21, 5);
  });
});

describe('最高分', () => {
  test('按棋盘边长分别记录, 只升不降', () => {
    setBestScore(4, 120);
    setBestScore(4, 80);
    setBestScore(5, 300);
    expect(getBestScore(4)).toBe(120);
    expect(getBestScore(5)).toBe(300);
    expect(getBestScores()).toEqual({ '4': 120, '5': 300 });
    expect(localStorage.getItem(BEST_STORAGE_KEY)).toContain('120');
  });

  test('非法输入不写入; clearBestScores 清空', () => {
    setBestScore(4, Number.NaN);
    expect(getBestScore(4)).toBe(0);
    setBestScore(4, 10);
    clearBestScores();
    expect(getBestScores()).toEqual({});
  });

  test('存档损坏时按空记录处理', () => {
    localStorage.setItem(BEST_STORAGE_KEY, 'not-json');
    expect(getBestScores()).toEqual({});
    expect(getBestScore(4)).toBe(0);
  });
});

describe('默认设置', () => {
  test('normalizeOptions 归一化非法值', () => {
    expect(normalizeOptions()).toEqual(DEFAULT_OPTIONS);
    expect(normalizeOptions({ size: 9 as never, win: 3000, anim: 'bad' as never }))
      .toEqual({ size: BOARD_SIZE_DEFAULT, win: WIN_DEFAULT, anim: false });
    expect(normalizeOptions({ size: 6 as never, win: 4096, anim: true }))
      .toEqual({ size: 6, win: 4096, anim: true });
  });

  test('normalizeWin 取最接近的档位', () => {
    expect(normalizeWin(2000)).toBe(2048);
    expect(normalizeWin(500)).toBe(512);
    expect(normalizeWin('bad')).toBe(WIN_DEFAULT);
  });

  test('读写 / 局部更新默认设置', () => {
    expect(getDefaultOptions()).toEqual(DEFAULT_OPTIONS);
    setDefaultOptions({ size: 5 as never, win: 4096, anim: false });
    expect(getDefaultOptions()).toEqual({ size: 5, win: 4096, anim: false });
    patchDefaultOptions({ anim: true });
    expect(getDefaultOptions()).toEqual({ size: 5, win: 4096, anim: true });
    expect(localStorage.getItem(DEFAULTS_STORAGE_KEY)).toContain('"size":5');
  });

  test('默认设置损坏时回退', () => {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, '{{{');
    expect(getDefaultOptions()).toEqual(DEFAULT_OPTIONS);
  });

  test('isSameOptions 比较三个字段', () => {
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS })).toBe(true);
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS, anim: false })).toBe(false);
  });
});

describe('对局存档', () => {
  const board4: Board = [ [ 2, 4, 0, 0 ], [ 0, 0, 0, 0 ], [ 0, 0, 0, 0 ], [ 0, 0, 0, 0 ] ];
  const state = { board: board4, score: 12, won: false };

  test('写入后可按同一边长读回', () => {
    // 边长非法 (3) 会被归一化为默认的 4
    saveState({ ...state, board: createBoard(3) }, 3);
    expect(loadState(4)).toEqual({ board: createBoard(4), score: 12, won: false });
    saveState(state, 4);
    expect(loadState(4)).toEqual({ board: board4, score: 12, won: false });
  });

  test('边长不匹配 / 无存档返回 null', () => {
    saveState(state, 4);
    expect(loadState(5)).toBeNull();
    clearState();
    expect(loadState(4)).toBeNull();
  });

  test('棋盘数据非法时视为无存档', () => {
    localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify({ size: 2, board: [ [ 3, 0 ], [ 0, 0 ] ], score: 1 }));
    expect(loadState(2)).toBeNull();
    localStorage.setItem(STATE_STORAGE_KEY, 'not-json');
    expect(loadState(4)).toBeNull();
  });

  test('saveState 不改动传入的棋盘', () => {
    const board: Board = [ [ 2, 0, 0, 0 ], [ 0, 0, 0, 0 ], [ 0, 0, 0, 0 ], [ 0, 0, 0, 0 ] ];
    saveState({ board, score: 0, won: true }, 4);
    expect(board[0]).toEqual([ 2, 0, 0, 0 ]);
    expect(loadState(4)).toEqual({ board, score: 0, won: true });
  });
});
