import {
  boardWithMines, bestKey, chordCell, clearBestTimes, coordsOf, createBoard, dimsOf, faceOf, flagCount,
  formatBest, formatTime, getBestTime, getBestTimes, getDefaultOptions, indexOf, isSameOptions, isTypingTarget,
  isWin, levelOf, minesLeft, neighbors, normalizeDims, normalizeOptions, patchDefaultOptions, placeMines,
  revealCell, revealedCount, safeZone, setBestTime, setDefaultOptions, setMark, showMines, startGame, toggleMark,
  wrongFlags, DEFAULT_OPTIONS, type Cell,
} from './lib';
import { PRESETS, SAFE_AREA } from './data';

/** 5×5 棋盘, 仅 (0,0) 是雷: 便于手算邻域数字 */
const tinyBoard = () => boardWithMines(5, 5, [ 0 ]);

const cellOf = (): Cell => ({ mine: false, adj: 0, revealed: false, mark: 'none' });

beforeEach(() => {
  localStorage.clear();
});

describe('坐标与邻域', () => {
  test('indexOf / coordsOf 互为反函数', () => {
    expect(indexOf(2, 3, 9)).toBe(29);
    expect(coordsOf(29, 9)).toEqual({ x: 2, y: 3 });
  });

  test('neighbors: 中心 8 个, 角落 3 个, 边上 5 个', () => {
    expect(neighbors(indexOf(1, 1, 9), 9, 9)).toHaveLength(8);
    expect(neighbors(indexOf(0, 0, 9), 9, 9)).toHaveLength(3);
    expect(neighbors(indexOf(4, 0, 9), 9, 9)).toHaveLength(5);
  });

  test('safeZone 含自身与 3×3 邻域, 越界自动截断', () => {
    expect(safeZone(indexOf(4, 4, 9), 9, 9).size).toBe(9);
    expect(safeZone(indexOf(0, 0, 9), 9, 9).size).toBe(4);
    expect(safeZone(0, 5, 5)).toEqual(new Set([ 0, 1, 5, 6 ]));
  });
});

describe('棋盘生成', () => {
  test('createBoard: 格子数正确且全部未布雷', () => {
    const board = createBoard(9, 9, 10);
    expect(board.cells).toHaveLength(81);
    expect(board.placed).toBe(false);
    expect(board.exploded).toBe(-1);
    expect(board.cells.every((c) => !c.mine && !c.revealed && c.mark === 'none')).toBe(true);
  });

  test('placeMines: 首点 3×3 无雷, 雷数正确', () => {
    const board = placeMines(createBoard(9, 9, 10), indexOf(4, 4, 9), 10, () => 0.5);
    expect(board.placed).toBe(true);
    expect(board.cells.filter((c) => c.mine)).toHaveLength(10);
    const zone = safeZone(indexOf(4, 4, 9), 9, 9);
    for (const i of zone) expect(board.cells[i].mine).toBe(false);
  });

  test('placeMines: 周围雷数统计正确', () => {
    const board = tinyBoard();
    // (0,0) 是雷, 于是 (1,0) / (0,1) / (1,1) 的邻雷数为 1, 远处为 0
    expect(board.cells[indexOf(1, 0, 5)].adj).toBe(1);
    expect(board.cells[indexOf(0, 1, 5)].adj).toBe(1);
    expect(board.cells[indexOf(1, 1, 5)].adj).toBe(1);
    expect(board.cells[indexOf(2, 2, 5)].adj).toBe(0);
    expect(board.cells[indexOf(0, 0, 5)].adj).toBe(0);
  });

  test('placeMines: 安全区装不下时退化为「只保证首点安全」', () => {
    const board = placeMines(createBoard(5, 5, 24), 12, 24, () => 0.5);
    expect(board.cells.filter((c) => c.mine)).toHaveLength(24);
    expect(board.cells[12].mine).toBe(false);
  });

  test('placeMines: rng 决定雷的位置 (可复现)', () => {
    const a = placeMines(createBoard(9, 9, 10), 0, 10, () => 0.25);
    const b = placeMines(createBoard(9, 9, 10), 0, 10, () => 0.25);
    expect(a.cells.map((c) => c.mine)).toEqual(b.cells.map((c) => c.mine));
  });

  test('startGame 等价于 createBoard + placeMines', () => {
    const board = startGame(9, 9, 10, 40, () => 0.7);
    expect(board.width).toBe(9);
    expect(board.mines).toBe(10);
    expect(board.placed).toBe(true);
    expect(board.cells.filter((c) => c.mine)).toHaveLength(10);
  });
});

describe('翻开与连开', () => {
  test('点中空地会泛洪展开相邻区域', () => {
    const board = tinyBoard();
    const res = revealCell(board, indexOf(4, 4, 5));
    expect(res.hitMine).toBe(false);
    // 除地雷格之外全部被翻开
    expect(revealedCount(res.board)).toBe(24);
    expect(res.board.cells[indexOf(0, 0, 5)].revealed).toBe(false);
  });

  test('点中数字格只翻开自己', () => {
    const board = tinyBoard();
    const res = revealCell(board, indexOf(1, 0, 5));
    expect(res.opened).toBe(1);
    expect(revealedCount(res.board)).toBe(1);
    expect(res.board.exploded).toBe(-1);
  });

  test('踩雷: 标记 exploded 并结束', () => {
    const board = tinyBoard();
    const res = revealCell(board, 0);
    expect(res.hitMine).toBe(true);
    expect(res.board.exploded).toBe(0);
    expect(res.board.cells[0].revealed).toBe(true);
  });

  test('已翻开 / 已插旗的格子不再翻开', () => {
    const board = tinyBoard();
    const opened = revealCell(board, indexOf(1, 0, 5)).board;
    expect(revealCell(opened, indexOf(1, 0, 5))).toMatchObject({ opened: 0, hitMine: false });
    const flagged = setMark(board, indexOf(4, 4, 5), true);
    expect(revealCell(flagged, indexOf(4, 4, 5)).opened).toBe(0);
  });

  test('chord: 旗数不足 / 未翻开 / 数字为 0 时不开', () => {
    const board = tinyBoard();
    expect(chordCell(board, indexOf(1, 0, 5))).toBeNull();
    const opened = revealCell(board, indexOf(1, 0, 5)).board;
    // 数字 1 但周围没有旗子
    expect(chordCell(opened, indexOf(1, 0, 5))).toBeNull();
    // 空地 (邻雷数 0)
    const zero = revealCell(tinyBoard(), indexOf(4, 4, 5)).board;
    expect(chordCell(zero, indexOf(4, 4, 5))).toBeNull();
  });

  test('chord: 旗数够了会一次翻开周围格子', () => {
    let board = tinyBoard();
    board = revealCell(board, indexOf(1, 1, 5)).board; // 数字 1
    board = setMark(board, 0, true); // 给唯一的雷插旗
    const res = chordCell(board, indexOf(1, 1, 5));
    expect(res).not.toBeNull();
    expect(res?.hitMine).toBe(false);
    expect(revealedCount(res!.board)).toBeGreaterThan(revealedCount(board));
  });

  test('chord: 旗插错位置会踩雷', () => {
    let board = tinyBoard();
    board = revealCell(board, indexOf(1, 1, 5)).board; // 数字 1
    board = setMark(board, indexOf(2, 2, 5), true); // 插在 (1,1) 邻域的空地上
    const res = chordCell(board, indexOf(1, 1, 5));
    expect(res?.hitMine).toBe(true);
  });
});

describe('插旗与胜负', () => {
  test('toggleMark: 空 → 旗 → 问号 → 空', () => {
    const c = cellOf();
    expect(toggleMark(c, true)).toBe('flag');
    expect(toggleMark({ ...c, mark: 'flag' }, true)).toBe('question');
    expect(toggleMark({ ...c, mark: 'question' }, true)).toBe('none');
  });

  test('toggleMark: 关闭问号时只在 旗 / 空 之间切换', () => {
    const c = cellOf();
    expect(toggleMark({ ...c, mark: 'flag' }, false)).toBe('none');
    expect(toggleMark({ ...c, mark: 'question' }, false)).toBe('none');
  });

  test('setMark 不改动已翻开的格子', () => {
    const board = revealCell(tinyBoard(), indexOf(1, 0, 5)).board;
    expect(setMark(board, indexOf(1, 0, 5), true)).toBe(board);
  });

  test('剩余雷数 = 雷数 - 旗数', () => {
    let board = tinyBoard();
    expect(minesLeft(board)).toBe(1);
    board = setMark(board, indexOf(4, 4, 5), true);
    expect(flagCount(board)).toBe(1);
    expect(minesLeft(board)).toBe(0);
  });

  test('isWin: 非雷格子全部翻开才算通关', () => {
    const board = tinyBoard();
    expect(isWin(board)).toBe(false);
    const all = revealCell(board, indexOf(4, 4, 5)).board;
    expect(isWin(all)).toBe(true);
  });

  test('isWin: 踩雷后不算通关', () => {
    const board = revealCell(tinyBoard(), indexOf(1, 1, 5)).board;
    expect(isWin(board)).toBe(false);
  });

  test('showMines 亮出全部地雷, 已插旗的雷保留旗子', () => {
    let board = tinyBoard();
    board = setMark(board, 0, true);
    const shown = showMines(board);
    expect(shown.cells[0].revealed).toBe(false);
    expect(shown.cells[0].mark).toBe('flag');
  });

  test('wrongFlags 找出插错的旗子', () => {
    let board = tinyBoard();
    board = setMark(board, 0, true); // 正确
    board = setMark(board, indexOf(4, 4, 5), true); // 错误
    expect(wrongFlags(board)).toEqual([ indexOf(4, 4, 5) ]);
  });
});

describe('显示与格式化', () => {
  test('faceOf 按局面切换表情', () => {
    expect(faceOf('ready')).toBe('🙂');
    expect(faceOf('playing')).toBe('🙂');
    expect(faceOf('won')).toBe('😎');
    expect(faceOf('lost')).toBe('😵');
  });

  test('formatTime: 分:秒, 秒补零', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(7)).toBe('0:07');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(750)).toBe('12:30');
    expect(formatTime(-1)).toBe('0:00');
    expect(formatTime(Number.NaN)).toBe('0:00');
  });

  test('formatBest: 无纪录显示 --', () => {
    expect(formatBest(null)).toBe('--');
    expect(formatBest(undefined)).toBe('--');
    expect(formatBest(90)).toBe('1:30');
  });

  test('isTypingTarget 命中输入类元素', () => {
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget({ tagName: 'INPUT' })).toBe(true);
    expect(isTypingTarget({ tagName: 'textarea' })).toBe(true);
    expect(isTypingTarget({ tagName: 'DIV', isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: 'BUTTON' })).toBe(false);
  });
});

describe('尺寸与难度', () => {
  test('normalizeDims 夹到合法范围, 雷数留出安全区', () => {
    expect(normalizeDims({ width: 3, height: 100, mines: 999 })).toEqual({
      width: 5, height: 30, mines: 5 * 30 - SAFE_AREA,
    });
    expect(normalizeDims({ width: 9, height: 9, mines: 0 })).toEqual({ width: 9, height: 9, mines: 1 });
    expect(normalizeDims(null)).toEqual(normalizeDims(PRESETS.beginner));
  });

  test('dimsOf 返回预设或归一化后的自定义规格', () => {
    expect(dimsOf('beginner')).toEqual(PRESETS.beginner);
    expect(dimsOf('expert')).toEqual({ width: 30, height: 16, mines: 99 });
    expect(dimsOf('custom', { width: 12, height: 10, mines: 20 })).toEqual({ width: 12, height: 10, mines: 20 });
  });

  test('levelOf 反查难度', () => {
    expect(levelOf(PRESETS.intermediate)).toBe('intermediate');
    expect(levelOf({ width: 12, height: 10, mines: 20 })).toBe('custom');
  });
});

describe('最高纪录', () => {
  test('无纪录返回 null, 写入后可读', () => {
    expect(getBestTime(9, 9, 10)).toBeNull();
    setBestTime(9, 9, 10, 42);
    expect(getBestTime(9, 9, 10)).toBe(42);
    expect(bestKey(9, 9, 10)).toBe('9x9:10');
    expect(getBestTimes()).toEqual({ '9x9:10': 42 });
  });

  test('只保留更快的纪录, 且按规格分别记', () => {
    setBestTime(9, 9, 10, 42);
    setBestTime(9, 9, 10, 99); // 更慢: 不覆盖
    expect(getBestTime(9, 9, 10)).toBe(42);
    setBestTime(9, 9, 10, 30);
    expect(getBestTime(9, 9, 10)).toBe(30);
    setBestTime(16, 16, 40, 88);
    expect(getBestTime(16, 16, 40)).toBe(88);
    expect(getBestTime(9, 9, 10)).toBe(30);
  });

  test('纪录至少 1 秒 (避免 0 秒纪录)', () => {
    setBestTime(5, 5, 1, 0);
    expect(getBestTime(5, 5, 1)).toBe(1);
  });

  test('清空纪录 / 脏数据容错', () => {
    setBestTime(9, 9, 10, 42);
    clearBestTimes();
    expect(getBestTimes()).toEqual({});
    localStorage.setItem('magic-tools-minesweeper-best', 'not json');
    expect(getBestTimes()).toEqual({});
    localStorage.setItem('magic-tools-minesweeper-best', '{ "9x9:10": "abc", "5x5:1": 12 }');
    expect(getBestTimes()).toEqual({ '5x5:1': 12 });
  });
});

describe('默认设置', () => {
  test('无存储时返回内置默认值', () => {
    expect(getDefaultOptions()).toEqual(DEFAULT_OPTIONS);
    expect(DEFAULT_OPTIONS).toEqual({ level: 'beginner', cell: 26, question: true });
  });

  test('setDefaultOptions 归一化后写回', () => {
    const saved = setDefaultOptions({ level: 'expert', cell: 22, question: false });
    expect(saved).toEqual({ level: 'expert', cell: 22, question: false });
    expect(getDefaultOptions()).toEqual(saved);
  });

  test('非法值回退: 难度 / 格子档位 / 问号开关', () => {
    expect(normalizeOptions({ level: 'nope', cell: 99, question: 'yes' })).toEqual(DEFAULT_OPTIONS);
    // 自定义难度不能作为默认值
    expect(normalizeOptions({ level: 'custom' }).level).toBe('beginner');
  });

  test('存储内容损坏时回退默认值', () => {
    localStorage.setItem('magic-tools-minesweeper-defaults', '{oops');
    expect(getDefaultOptions()).toEqual(DEFAULT_OPTIONS);
  });

  test('patchDefaultOptions 局部更新', () => {
    patchDefaultOptions({ cell: 30 });
    expect(getDefaultOptions().cell).toBe(30);
    patchDefaultOptions({ level: 'intermediate' });
    expect(getDefaultOptions()).toMatchObject({ cell: 30, level: 'intermediate' });
  });

  test('isSameOptions 比较全部字段', () => {
    expect(isSameOptions(DEFAULT_OPTIONS, normalizeOptions(DEFAULT_OPTIONS))).toBe(true);
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS, cell: 30 })).toBe(false);
  });
});
