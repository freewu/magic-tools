// 俄罗斯方块纯逻辑单测 (棋盘 / 碰撞 / 旋转 / 下落 / 消行 / 计分 / 7-bag / 最高分 / 默认设置)
import {
  BOARD_COLS, BOARD_ROWS, DEFAULTS_STORAGE_KEY, BEST_STORAGE_KEY, LEVEL_MAX, LEVEL_MIN, LINE_SCORES,
  PIECE_TYPES, PREVIEW_QUEUE,
} from './data';
import {
  boardCols, boardRows, clearLines, cloneBoard, collides, createBoard, dropDistance, dropScore, ghostPiece,
  getBestScore, getDefaultOptions, gravityMs, hardDropPiece, initialQueue, isSameOptions, isTopOut, keyToAction,
  levelOf, lockPiece, makeBag, movePiece, nextFromQueue, normalizeLevel, normalizeOptions, patchDefaultOptions,
  pieceCells, refillQueue, rotatePiece, scoreForClear, setBestScore, setDefaultOptions, shapeOf, softDropPiece,
  spawnPiece, isTypingTarget, clearBestScores, createBoard as mkBoard, type Board, type Piece,
} from './lib';

/** 固定序列 rng (可复现) */
const seq = (values: number[]) => {
  let i = 0;
  return () => values[(i++) % values.length];
};

const piece = (over: Partial<Piece> = {}): Piece => ({ type: 'T', rot: 0, r: 0, c: 3, ...over });

beforeEach(() => {
  localStorage.clear();
});

describe('棋盘基础', () => {
  test('默认 10×20 且全空', () => {
    const b = createBoard();
    expect(boardRows(b)).toBe(BOARD_ROWS);
    expect(boardCols(b)).toBe(BOARD_COLS);
    expect(b.every((row) => row.every((v) => v === null))).toBe(true);
  });

  test('cloneBoard 是深拷贝', () => {
    const b = createBoard(4, 4);
    b[0][0] = 'T';
    const c = cloneBoard(b);
    c[0][1] = 'I';
    expect(b[0][1]).toBeNull();
    expect(c[0][0]).toBe('T');
  });

  test('pieceCells 随旋转态变化', () => {
    const cells = pieceCells(piece({ type: 'I', rot: 0 }));
    expect(cells).toEqual([ { r: 1, c: 3 }, { r: 1, c: 4 }, { r: 1, c: 5 }, { r: 1, c: 6 } ]);
    expect(shapeOf('O', 5)).toBe(shapeOf('O', 0));
  });
});

describe('生成与碰撞', () => {
  test('spawnPiece 顶部居中', () => {
    const p = spawnPiece('I');
    expect(p.c).toBe(3);
    expect(p.r).toBe(0);
    expect(spawnPiece('O').c).toBe(3);
  });

  test('越界 / 重叠都算冲突', () => {
    const board = createBoard();
    expect(collides(board, piece({ c: -1 }))).toBe(true);
    expect(collides(board, piece({ c: BOARD_COLS }))).toBe(true);
    expect(collides(board, piece({ r: BOARD_ROWS - 1 }))).toBe(true);
    const b2 = createBoard();
    b2[1][4] = 'I';
    expect(collides(b2, piece({ type: 'O', r: 0, c: 3 }))).toBe(true);
  });

  test('顶部已被占满 -> 游戏结束', () => {
    const board = createBoard();
    for (let c = 0; c < BOARD_COLS; c += 1) board[0][c] = 'I';
    expect(isTopOut(board, spawnPiece('O'))).toBe(true);
    expect(isTopOut(createBoard(), spawnPiece('O'))).toBe(false);
  });
});

describe('移动 / 旋转 / 下落', () => {
  test('左右平移, 贴墙时返回 null', () => {
    const board = createBoard();
    expect(movePiece(board, piece({ c: 3 }), -1)?.c).toBe(2);
    expect(movePiece(board, piece({ c: 0 }), -1)).toBeNull();
    expect(movePiece(board, piece({ c: BOARD_COLS - 1 }), 1)).toBeNull();
  });

  test('软降到底后返回 null', () => {
    const board = createBoard();
    let p: Piece | null = spawnPiece('O');
    let steps = 0;
    while (p) {
      p = softDropPiece(board, p);
      if (p) steps += 1;
    }
    // O 占 2 行, 从第 0 行落到第 18 行
    expect(steps).toBe(BOARD_ROWS - 2);
  });

  test('旋转 4 次回到原状态', () => {
    const board = createBoard();
    let p: Piece | null = piece({ type: 'T', rot: 0 });
    for (let i = 0; i < 4; i += 1) p = rotatePiece(board, p as Piece, 1);
    expect(p).toEqual(piece({ type: 'T', rot: 0 }));
  });

  test('逆时针旋转等价于 3 次顺时针', () => {
    const board = createBoard();
    const cw3 = rotatePiece(board, rotatePiece(board, rotatePiece(board, piece({ type: 'L' }), 1) as Piece, 1) as Piece, 1);
    expect(rotatePiece(board, piece({ type: 'L' }), -1)).toEqual(cw3);
  });

  test('O 方块无法旋转', () => {
    expect(rotatePiece(createBoard(), piece({ type: 'O' }), 1)).toBeNull();
  });

  test('贴墙旋转时自动左右微调 (wall kick)', () => {
    const board = createBoard();
    // I 竖放于最左列时, 竖 -> 横 需要右移
    const vertical: Piece = { type: 'I', rot: 1, r: 0, c: -2 };
    const rotated = rotatePiece(board, vertical, 1);
    expect(rotated).not.toBeNull();
    expect(collides(board, rotated as Piece)).toBe(false);
  });

  test('硬降: 距离 + 落点与幽灵方块一致', () => {
    const board = createBoard();
    const p = spawnPiece('T');
    const { piece: dropped, distance } = hardDropPiece(board, p);
    expect(distance).toBeGreaterThan(0);
    expect(ghostPiece(board, p)).toEqual(dropped);
    expect(dropDistance(board, dropped)).toBe(0);
    expect(collides(board, { ...dropped, r: dropped.r + 1 })).toBe(true);
  });

  test('软降 / 硬降计分', () => {
    expect(dropScore(3)).toBe(3);
    expect(dropScore(3, false)).toBe(6);
    expect(dropScore(-2, false)).toBe(0);
  });
});

describe('锁定与消行', () => {
  test('lockPiece 把方块写进棋盘 (不改原棋盘)', () => {
    const board = createBoard();
    const p = spawnPiece('O');
    const locked = lockPiece(board, p);
    expect(locked[0][4]).toBe('O');
    expect(board[0][4]).toBeNull();
  });

  test('填满的行被消除, 上方内容整体下移', () => {
    const board: Board = createBoard(4, 3);
    board[3] = [ 'I', 'I', 'I' ];
    board[2] = [ 'T', null, null ];
    const res = clearLines(board);
    expect(res.cleared).toBe(1);
    expect(res.rows).toEqual([ 3 ]);
    expect(boardRows(res.board)).toBe(4);
    expect(res.board[3]).toEqual([ 'T', null, null ]);
    expect(res.board[0]).toEqual([ null, null, null ]);
  });

  test('一次消 4 行 (Tetris)', () => {
    const board: Board = createBoard(4, 2);
    for (let r = 0; r < 4; r += 1) board[r] = [ 'I', 'I' ];
    const res = clearLines(board);
    expect(res.cleared).toBe(4);
    expect(res.board.every((row) => row.every((v) => v === null))).toBe(true);
  });

  test('没有满行时棋盘不变', () => {
    const board = mkBoard(4, 4);
    board[3] = [ 'I', 'I', 'I', null ];
    const res = clearLines(board);
    expect(res.cleared).toBe(0);
    expect(res.board).toEqual(board);
  });
});

describe('等级与计分', () => {
  test('每 10 行升 1 级', () => {
    expect(levelOf(1, 0)).toBe(1);
    expect(levelOf(1, 9)).toBe(1);
    expect(levelOf(1, 10)).toBe(2);
    expect(levelOf(3, 25)).toBe(5);
  });

  test('消行得分 = 基础分 × 等级', () => {
    expect(scoreForClear(1, 1)).toBe(LINE_SCORES[1]);
    expect(scoreForClear(4, 1)).toBe(LINE_SCORES[4]);
    expect(scoreForClear(4, 3)).toBe(LINE_SCORES[4] * 3);
    expect(scoreForClear(0, 5)).toBe(0);
  });

  test('等级越高下落越快, 有下限', () => {
    expect(gravityMs(1)).toBeGreaterThan(gravityMs(5));
    expect(gravityMs(5)).toBeGreaterThan(gravityMs(10));
    expect(gravityMs(999)).toBeGreaterThan(0);
  });
});

describe('7-bag 随机器', () => {
  test('一轮里七种方块各出现一次', () => {
    const bag = makeBag(seq([ 0.1, 0.5, 0.9, 0.3, 0.7, 0.2 ]));
    expect(bag).toHaveLength(PIECE_TYPES.length);
    expect([ ...bag ].sort()).toEqual([ ...PIECE_TYPES ].sort());
  });

  test('队列不足时自动补齐', () => {
    const q = refillQueue([ 'I' ], seq([ 0.4 ]), 3);
    expect(q).toHaveLength(3);
    expect(q[0]).toBe('I');
  });

  test('nextFromQueue 取出队首并补齐', () => {
    const { type, queue } = nextFromQueue([ 'T', 'I' ], seq([ 0.6 ]), 3);
    expect(type).toBe('T');
    expect(queue).toHaveLength(3);
    expect(queue[0]).toBe('I');
  });

  test('开局队列长度符合预览数量', () => {
    expect(initialQueue(Math.random, PREVIEW_QUEUE + 1)).toHaveLength(PREVIEW_QUEUE + 1);
  });
});

describe('键盘映射', () => {
  test('方向键 / WASD / 空格 / C / P', () => {
    expect(keyToAction({ key: 'ArrowLeft' })).toBe('left');
    expect(keyToAction({ key: 'd' })).toBe('right');
    expect(keyToAction({ key: 's' })).toBe('softDrop');
    expect(keyToAction({ key: 'ArrowUp' })).toBe('rotateCW');
    expect(keyToAction({ key: 'x' })).toBe('rotateCW');
    expect(keyToAction({ key: 'z' })).toBe('rotateCCW');
    expect(keyToAction({ key: ' ' })).toBe('hardDrop');
    expect(keyToAction({ key: 'c' })).toBe('hold');
    expect(keyToAction({ key: 'p' })).toBe('pause');
    expect(keyToAction({ key: 'Escape' })).toBe('pause');
    expect(keyToAction({ key: 'F5' })).toBeNull();
    expect(keyToAction(null)).toBeNull();
  });

  test('输入框内的按键不拦截', () => {
    expect(isTypingTarget({ tagName: 'INPUT' })).toBe(true);
    expect(isTypingTarget({ tagName: 'textarea' })).toBe(true);
    expect(isTypingTarget({ isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: 'DIV' })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

describe('最高分', () => {
  test('只写入更大值', () => {
    expect(getBestScore()).toBe(0);
    expect(setBestScore(120)).toBe(120);
    expect(setBestScore(80)).toBe(120);
    expect(getBestScore()).toBe(120);
    expect(localStorage.getItem(BEST_STORAGE_KEY)).toBe('120');
  });

  test('非法值不写入 / 清空', () => {
    expect(setBestScore('abc')).toBe(0);
    expect(setBestScore(-5)).toBe(0);
    setBestScore(50);
    clearBestScores();
    expect(getBestScore()).toBe(0);
  });
});

describe('默认设置', () => {
  test('无记录时为默认值', () => {
    expect(getDefaultOptions()).toEqual({ level: 1, ghost: true, grid: true });
  });

  test('normalizeLevel 夹在 1~10', () => {
    expect(normalizeLevel(0)).toBe(LEVEL_MIN);
    expect(normalizeLevel(99)).toBe(LEVEL_MAX);
    expect(normalizeLevel('4')).toBe(4);
    expect(normalizeLevel('x')).toBe(1);
  });

  test('normalizeOptions 补齐非法字段', () => {
    expect(normalizeOptions({ level: 3, ghost: false })).toEqual({ level: 3, ghost: false, grid: true });
    expect(normalizeOptions(null)).toEqual({ level: 1, ghost: true, grid: true });
  });

  test('写入 / 读取 / 局部更新', () => {
    expect(setDefaultOptions({ level: 5, ghost: false })).toEqual({ level: 5, ghost: false, grid: true });
    expect(getDefaultOptions()).toEqual({ level: 5, ghost: false, grid: true });
    expect(patchDefaultOptions({ grid: false })).toEqual({ level: 5, ghost: false, grid: false });
    expect(JSON.parse(localStorage.getItem(DEFAULTS_STORAGE_KEY) as string)).toEqual({
      level: 5, ghost: false, grid: false,
    });
  });

  test('isSameOptions 比较三个字段', () => {
    const a = { level: 2, ghost: true, grid: false };
    expect(isSameOptions(a, { ...a })).toBe(true);
    expect(isSameOptions(a, { ...a, grid: true })).toBe(false);
  });

  test('存档损坏时回退默认', () => {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, '{oops');
    expect(getDefaultOptions()).toEqual({ level: 1, ghost: true, grid: true });
  });
});
