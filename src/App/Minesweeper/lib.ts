// 扫雷: 纯逻辑 (棋盘生成 / 首点安全 / 泛洪展开 / 插旗 / 连开 / 胜负判定 / 最高纪录 / 默认设置)
// 规则参考 https://minesweeper.online/ : 左键翻开, 右键插旗 (旗 → 问号 → 空), 数字周围旗数够了可一键连开
// 本文件不依赖 DOM / React, 便于单测; 页面只负责渲染与交互
import {
  BEST_STORAGE_KEY, CELL_DEFAULT, CELL_SIZES, DEFAULTS_STORAGE_KEY, FACES, HEIGHT_MAX, HEIGHT_MIN,
  MINES_MIN, PRESETS, SAFE_AREA, WIDTH_MAX, WIDTH_MIN, type Dims, type Level,
} from './data';

/** 格子标记: 无 / 旗子 / 问号 */
export type CellMark = 'none' | 'flag' | 'question';

/** 单个格子: 是否地雷 / 周围雷数 / 是否已翻开 / 标记 */
export interface Cell {
  mine: boolean;
  adj: number;
  revealed: boolean;
  mark: CellMark;
}

/** 棋盘: 尺寸 + 格子 + 是否已布雷 (首点后才布雷) + 踩中雷的下标 (-1 表示没踩雷) */
export interface Board {
  width: number;
  height: number;
  mines: number;
  placed: boolean;
  cells: Cell[];
  exploded: number;
}

/** 局面: 未开局 / 进行中 / 通关 / 踩雷 */
export type GameStatus = 'ready' | 'playing' | 'won' | 'lost';

/** 扫雷默认设置 (与 app-config 的 getDefaultOptions / setDefaultOptions 配对) */
export interface MinesweeperOptions {
  /** 打开时默认难度 */
  level: Level;
  /** 格子边长 (px, 取 CELL_SIZES 之一) */
  cell: number;
  /** 插旗是否经过「问号」状态 */
  question: boolean;
}

/** 一次翻开操作的结算结果 */
export interface RevealResult {
  board: Board;
  /** 本次是否踩雷 */
  hitMine: boolean;
  /** 本次新翻开的格子数 */
  opened: number;
}

/** 默认随机源 (每次调用时再取 Math.random, 便于测试里 jest.spyOn 打桩) */
const RNG = (): number => Math.random();

// ---- 坐标 ----

/** 行列 -> 一维下标 */
export const indexOf = (x: number, y: number, width: number): number => y * width + x;

/** 一维下标 -> 行列 */
export const coordsOf = (i: number, width: number): { x: number; y: number } => ({
  x: i % width,
  y: Math.floor(i / width),
});

/** 八邻域下标 (越界自动剔除) */
export const neighbors = (i: number, width: number, height: number): number[] => {
  const { x, y } = coordsOf(i, width);
  const out: number[] = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      out.push(indexOf(nx, ny, width));
    }
  }
  return out;
};

/** 首点安全区: 以 i 为中心的 3×3 (棋盘太小时自动截断) */
export const safeZone = (i: number, width: number, height: number): Set<number> => {
  const set = new Set<number>([ i ]);
  for (const n of neighbors(i, width, height)) set.add(n);
  return set;
};

// ---- 棋盘 ----

/** 全新棋盘 (草地, 未布雷) */
export const createBoard = (width: number, height: number, mines: number): Board => ({
  width,
  height,
  mines,
  placed: false,
  exploded: -1,
  cells: Array.from({ length: width * height }, () => ({ mine: false, adj: 0, revealed: false, mark: 'none' })),
});

/** 复制棋盘 (react state 不可变更新用) */
export const cloneBoard = (board: Board): Board => ({
  ...board,
  cells: board.cells.map((c) => ({ ...c })),
});

/** 统计周围雷数 (要求 cells 上的 mine 已设好; 返回 placed = true 的新棋盘) */
export const computeAdj = (board: Board): Board => {
  const next = cloneBoard(board);
  next.placed = true;
  for (let i = 0; i < next.cells.length; i += 1) {
    const cell = next.cells[i];
    if (cell.mine) {
      cell.adj = 0;
      continue;
    }
    cell.adj = neighbors(i, next.width, next.height).filter((n) => next.cells[n].mine).length;
  }
  return next;
};

const fillAdj = computeAdj;

/** 手动布置地雷 (测试 / 回放用): 只在给定下标放雷, 其余格子保持安全 */
export const boardWithMines = (width: number, height: number, mines: readonly number[]): Board => {
  const board = createBoard(width, height, mines.length);
  for (const i of mines) if (board.cells[i]) board.cells[i].mine = true;
  return computeAdj(board);
};

/**
 * 布雷 (首点安全): 从安全区之外随机取 mines 个格子, Fisher-Yates 洗牌
 * 棋盘小到装不下时, 安全区退化为「只保证首点本身不漏雷」
 */
export const placeMines = (board: Board, safeIndex: number, mines = board.mines, rng: () => number = RNG): Board => {
  const total = board.width * board.height;
  const count = Math.min(Math.max(0, mines), total - 1);
  let avoid = safeZone(safeIndex, board.width, board.height);
  if (total - avoid.size < count) avoid = new Set<number>([ safeIndex ]);
  const pool: number[] = [];
  for (let i = 0; i < total; i += 1) if (!avoid.has(i)) pool.push(i);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [ pool[i], pool[j] ] = [ pool[j], pool[i] ];
  }
  const next = cloneBoard(board);
  next.mines = count;
  next.placed = true;
  next.exploded = -1;
  for (const idx of pool.slice(0, count)) next.cells[idx].mine = true;
  return fillAdj(next);
};

/** 开局: 按首点安全布雷并算好周围雷数 */
export const startGame = (
  width: number, height: number, mines: number, safeIndex: number, rng: () => number = RNG,
): Board => placeMines(createBoard(width, height, mines), safeIndex, mines, rng);

/** 翻开的格子数 */
export const revealedCount = (board: Board): number => board.cells.filter((c) => c.revealed).length;

/** 已插旗数 */
export const flagCount = (board: Board): number => board.cells.filter((c) => c.mark === 'flag').length;

/** 剩余雷数 (雷数 - 已插旗数, 可为负) */
export const minesLeft = (board: Board): number => board.mines - flagCount(board);

/** 是否通关: 所有非雷格子都已翻开 */
export const isWin = (board: Board): boolean =>
  board.cells.length - board.mines <= revealedCount(board) && board.exploded < 0;

/** 翻开单个格子 (含 0 邻域的泛洪展开); 已翻开 / 已插旗的格子不做处理 */
export const revealCell = (board: Board, i: number): RevealResult => {
  const target = board.cells[i];
  if (!target || target.revealed || target.mark === 'flag') return { board, hitMine: false, opened: 0 };
  if (target.mine) {
    const next = cloneBoard(board);
    next.cells[i].revealed = true;
    next.exploded = i;
    return { board: next, hitMine: true, opened: 1 };
  }
  const next = cloneBoard(board);
  const stack = [ i ];
  let opened = 0;
  while (stack.length > 0) {
    const idx = stack.pop() as number;
    const cell = next.cells[idx];
    if (cell.revealed || cell.mine || cell.mark === 'flag') continue;
    cell.revealed = true;
    opened += 1;
    if (cell.adj === 0) {
      for (const n of neighbors(idx, next.width, next.height)) {
        const nc = next.cells[n];
        if (!nc.revealed && !nc.mine && nc.mark !== 'flag') stack.push(n);
      }
    }
  }
  return { board: next, hitMine: false, opened };
};

/**
 * 连开 (chord): 已翻开的数字格周围旗数够了, 一次性翻开周围未插旗的格子
 * 不满足条件 (未翻开 / 数字为 0 / 旗数不对) 时返回 null
 */
export const chordCell = (board: Board, i: number): RevealResult | null => {
  const cell = board.cells[i];
  if (!cell || !cell.revealed || cell.adj === 0) return null;
  const around = neighbors(i, board.width, board.height);
  const flags = around.filter((n) => board.cells[n].mark === 'flag').length;
  if (flags !== cell.adj) return null;
  let cur = board;
  let opened = 0;
  for (const n of around) {
    const nc = cur.cells[n];
    if (nc.revealed || nc.mark === 'flag') continue;
    const res = revealCell(cur, n);
    cur = res.board;
    opened += res.opened;
    if (res.hitMine) return { board: cur, hitMine: true, opened };
  }
  return { board: cur, hitMine: false, opened };
};

/**
 * 提示 (双击数字格): 返回该数字格周围所有「未翻开」的格子下标
 * 只做视觉提示, 不改动棋盘; 非数字格 (未翻开 / 数字为 0) 返回空数组
 */
export const hintCells = (board: Board, i: number): number[] => {
  const cell = board.cells[i];
  if (!cell || !cell.revealed || cell.adj === 0) return [];
  return neighbors(i, board.width, board.height).filter((n) => !board.cells[n].revealed);
};

/** 切换标记: 空 → 旗 → (允许问号时) 问号 → 空 */
export const toggleMark = (cell: Cell, allowQuestion: boolean): CellMark => {
  if (cell.revealed) return cell.mark;
  if (cell.mark === 'none') return 'flag';
  if (cell.mark === 'flag') return allowQuestion ? 'question' : 'none';
  return 'none';
};

/** 给指定格子设置标记 (返回新棋盘) */
export const setMark = (board: Board, i: number, allowQuestion: boolean): Board => {
  const cell = board.cells[i];
  if (!cell || cell.revealed) return board;
  const next = cloneBoard(board);
  next.cells[i].mark = toggleMark(cell, allowQuestion);
  return next;
};

/** 踩雷后亮出全部地雷 (已插旗的雷保留旗子) */
export const showMines = (board: Board): Board => {
  const next = cloneBoard(board);
  for (const cell of next.cells) if (cell.mine && cell.mark !== 'flag') cell.revealed = true;
  return next;
};

/** 结算后的错误插旗 (插在非雷格子上), 供界面标红 */
export const wrongFlags = (board: Board): number[] => {
  const out: number[] = [];
  board.cells.forEach((cell, i) => {
    if (cell.mark === 'flag' && !cell.mine) out.push(i);
  });
  return out;
};

// ---- 显示 ----

/** 表情按钮图标 */
export const faceOf = (status: GameStatus): string => FACES[status];

/** 秒数 -> 分:秒 (例: 0:07 / 1:05 / 12:30) */
export const formatTime = (seconds: number): string => {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

/** 最高纪录展示 (无纪录显示 --) */
export const formatBest = (seconds: number | null | undefined): string =>
  seconds === null || seconds === undefined || !Number.isFinite(seconds) ? '--' : formatTime(seconds);

/** 在输入框 / 文本域里打字时不抢键盘事件 */
export const isTypingTarget = (el: { tagName?: string; isContentEditable?: boolean } | null): boolean => {
  if (!el) return false;
  const tag = (el.tagName ?? '').toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable === true;
};

// ---- 尺寸 / 难度 ----

/** 整数化 (NaN / 空值回退默认值) */
const asInt = (v: unknown, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
};

/** 自定义规格: 夹到合法范围, 雷数给足首点安全区 */
export const normalizeDims = (raw: Partial<Dims> | null | undefined): Dims => {
  const width = Math.min(WIDTH_MAX, Math.max(WIDTH_MIN, asInt(raw?.width, PRESETS.beginner.width)));
  const height = Math.min(HEIGHT_MAX, Math.max(HEIGHT_MIN, asInt(raw?.height, PRESETS.beginner.height)));
  const maxMines = Math.max(MINES_MIN, width * height - SAFE_AREA);
  const mines = Math.min(maxMines, Math.max(MINES_MIN, asInt(raw?.mines, PRESETS.beginner.mines)));
  return { width, height, mines };
};

/** 某难度对应的棋盘规格 (自定义时用 custom 参数) */
export const dimsOf = (level: Level, custom: Dims = PRESETS.beginner): Dims =>
  level === 'custom' ? normalizeDims(custom) : { ...PRESETS[level] };

/** 反查规格对应的难度 (与预设完全一致才算预设, 否则算自定义) */
export const levelOf = (dims: Dims): Level => {
  const hit = (Object.keys(PRESETS) as Array<Exclude<Level, 'custom'>>)
    .find((k) => PRESETS[k].width === dims.width && PRESETS[k].height === dims.height && PRESETS[k].mines === dims.mines);
  return hit ?? 'custom';
};

// ---- 最高纪录 (按 宽×高:雷数 分别记录, 单位秒) ----

export type BestMap = Record<string, number>;

/** 纪录 key: 12x12:30 */
export const bestKey = (width: number, height: number, mines: number): string => `${width}x${height}:${mines}`;

/** 读取全部纪录 (脏数据自动剔除) */
export const getBestTimes = (): BestMap => {
  try {
    const raw = localStorage.getItem(BEST_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: BestMap = {};
    for (const [ key, value ] of Object.entries(parsed as Record<string, unknown>)) {
      const sec = Number(value);
      if (Number.isFinite(sec) && sec > 0) out[key] = sec;
    }
    return out;
  } catch {
    return {};
  }
};

/** 读取某个规格的纪录 (无纪录返回 null) */
export const getBestTime = (width: number, height: number, mines: number): number | null =>
  getBestTimes()[bestKey(width, height, mines)] ?? null;

/** 写入纪录 (只在更快时覆盖), 返回更新后的全部纪录 */
export const setBestTime = (width: number, height: number, mines: number, seconds: number): BestMap => {
  const map = getBestTimes();
  const key = bestKey(width, height, mines);
  const sec = Math.max(1, Math.round(seconds));
  const prev = map[key];
  if (prev === undefined || sec < prev) {
    map[key] = sec;
    try {
      localStorage.setItem(BEST_STORAGE_KEY, JSON.stringify(map));
    } catch {
      /* 隐私模式等写入失败: 忽略 */
    }
  }
  return map;
};

/** 清空全部纪录 */
export const clearBestTimes = (): void => {
  try {
    localStorage.removeItem(BEST_STORAGE_KEY);
  } catch {
    /* 忽略 */
  }
};

// ---- 默认设置 ----

export const DEFAULT_OPTIONS: MinesweeperOptions = {
  level: 'beginner',
  cell: CELL_DEFAULT,
  question: true,
};

/** 归一化 (非法 / 自定义难度回退初级, 格子边长夹到档位内, 问号标记缺省开启) */
export const normalizeOptions = (raw: unknown): MinesweeperOptions => {
  const src = (raw ?? {}) as Partial<MinesweeperOptions>;
  const preset = src.level === 'beginner' || src.level === 'intermediate' || src.level === 'expert';
  const level = preset ? (src.level as Level) : DEFAULT_OPTIONS.level;
  const cellNum = Number(src.cell);
  const cell = CELL_SIZES.includes(cellNum) ? cellNum : DEFAULT_OPTIONS.cell;
  const question = typeof src.question === 'boolean' ? src.question : DEFAULT_OPTIONS.question;
  return { level, cell, question };
};

/** 读取默认设置 (无存储 / 脏数据时回退内置默认) */
export const getDefaultOptions = (): MinesweeperOptions => {
  try {
    const raw = localStorage.getItem(DEFAULTS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_OPTIONS };
    return normalizeOptions(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_OPTIONS };
  }
};

/** 写回默认设置 (自动归一化), 返回写入后的值 */
export const setDefaultOptions = (next: Partial<MinesweeperOptions>): MinesweeperOptions => {
  const opts = normalizeOptions({ ...getDefaultOptions(), ...next });
  try {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify(opts));
  } catch {
    /* 忽略 */
  }
  return opts;
};

/** 局部更新默认设置 */
export const patchDefaultOptions = (patch: Partial<MinesweeperOptions>): MinesweeperOptions => setDefaultOptions(patch);

/** 比较两份设置是否一致 */
export const isSameOptions = (a: MinesweeperOptions, b: MinesweeperOptions): boolean =>
  a.level === b.level && a.cell === b.cell && a.question === b.question;
