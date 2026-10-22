// 2048 游戏: 纯规则逻辑 (移动 / 合并 / 生成新方块 / 胜负判定 / 存档 / 默认设置)
// 说明: 本文件不依赖 DOM 与 React, 全部为纯函数 (随机数由调用方注入), 便于单测;
//       页面 (index.tsx) 只负责渲染与键盘 / 触摸等副作用。
import {
  BEST_STORAGE_KEY,
  BOARD_SIZES,
  BOARD_SIZE_DEFAULT,
  DEFAULTS_STORAGE_KEY,
  FOUR_RATE,
  START_TILES,
  STATE_STORAGE_KEY,
  TILE_COLORS,
  TILE_COLOR_HIGH,
  TILE_FONT_SCALE,
  TILE_FONT_SCALE_MIN,
  WIN_DEFAULT,
  WIN_OPTIONS,
  type BoardSize,
} from './data';

/** 棋盘: board[r][c], 0 表示空位, 其余为方块数字 (2 的幂) */
export type Board = number[][];

export type Direction = 'left' | 'up' | 'right' | 'down';

/** 一个格子坐标 */
export interface Cell { r: number; c: number }

/** 合并产生的格子 (含合并后的数字, 供动画高亮) */
export interface MergeCell extends Cell { v: number }

/** 一次移动的结果 */
export interface MoveResult {
  /** 移动 + 合并后的棋盘 (尚未生成新方块) */
  board: Board;
  /** 本次合并获得的分数 */
  gained: number;
  /** 是否有方块位置变化 (无变化时不应生成新方块) */
  moved: boolean;
  /** 本次发生合并的格子 */
  merges: MergeCell[];
}

/** 随机数发生器: 返回 [0, 1), 默认 Math.random (测试时注入可复现的序列) */
export type Rng = () => number;

/** 新建空白棋盘 (size 为内部尺寸参数, 不强制 4/5/6, 便于规则函数与测试使用) */
export const createBoard = (size: number): Board => {
  const n = Number.isFinite(size) && size > 0 ? Math.floor(size) : BOARD_SIZE_DEFAULT;
  return Array.from({ length: n }, () => new Array<number>(n).fill(0));
};

/** 深拷贝棋盘 */
export const cloneBoard = (board: Board): Board => board.map((row) => [ ...row ]);

/** 任意输入 -> 合法棋盘边长 (4 / 5 / 6), 非法值回退默认 */
export const normalizeSize = (v: unknown): BoardSize => {
  const n = typeof v === 'number' ? v : Number(v);
  return (BOARD_SIZES as readonly number[]).includes(n) ? (n as BoardSize) : BOARD_SIZE_DEFAULT;
};

/** 棋盘边长 (以行数为准) */
export const boardSize = (board: Board): number => board.length;

/** 全部空格坐标 (行优先) */
export const emptyCells = (board: Board): Cell[] => {
  const out: Cell[] = [];
  board.forEach((row, r) => row.forEach((v, c) => { if (v === 0) out.push({ r, c }); }));
  return out;
};

/** 棋盘上的最大数字 (空棋盘为 0) */
export const maxTile = (board: Board): number =>
  board.reduce((m, row) => row.reduce((mm, v) => (v > mm ? v : mm), m), 0);

/** 已合成的目标数字是否已出现 */
export const hasReached = (board: Board, target: number): boolean => maxTile(board) >= target;

/**
 * 一行数字向左压缩并合并 (经典规则)
 * - 非零数字依次靠左; 相邻且相等的两个合并成两倍, 且每个方块一次移动只合并一次
 * - 返回值里的 mergedAt 是「合并结果在输出行中的下标」, 供动画定位到合并后的格子
 */
export const collapseLine = (line: readonly number[]): { line: number[]; gained: number; mergedAt: number[] } => {
  const tiles = line.filter((v) => v > 0);
  const out: number[] = [];
  const mergedAt: number[] = [];
  let gained = 0;
  for (let i = 0; i < tiles.length; i += 1) {
    if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
      const v = tiles[i] * 2;
      out.push(v);
      mergedAt.push(out.length - 1);
      gained += v;
      i += 1; // 跳过后一个 (同一次移动不重复合并)
    } else {
      out.push(tiles[i]);
    }
  }
  while (out.length < line.length) out.push(0);
  return { line: out, gained, mergedAt };
};

/** 某个方向下, 每条「移动轴」的坐标顺序 (第一个元素为目标方向的起点) */
export const linesOf = (size: number, dir: Direction): Cell[][] => {
  const out: Cell[][] = [];
  if (dir === 'left' || dir === 'right') {
    for (let r = 0; r < size; r += 1) {
      const row = Array.from({ length: size }, (_, c) => ({ r, c }));
      out.push(dir === 'left' ? row : [ ...row ].reverse());
    }
    return out;
  }
  for (let c = 0; c < size; c += 1) {
    const col = Array.from({ length: size }, (_, r) => ({ r, c }));
    out.push(dir === 'up' ? col : [ ...col ].reverse());
  }
  return out;
};

/** 向某个方向移动并合并 (不生成新方块) */
export const moveBoard = (board: Board, dir: Direction): MoveResult => {
  const size = boardSize(board);
  const next = createBoard(size);
  const merges: MergeCell[] = [];
  let gained = 0;
  let moved = false;
  for (const coords of linesOf(size, dir)) {
    const values = coords.map(({ r, c }) => board[r][c]);
    const res = collapseLine(values);
    gained += res.gained;
    res.line.forEach((v, i) => {
      const { r, c } = coords[i];
      next[r][c] = v;
      if (v !== values[i]) moved = true;
    });
    for (const at of res.mergedAt) {
      const { r, c } = coords[at];
      merges.push({ r, c, v: res.line[at] });
    }
  }
  return { board: next, gained, moved, merges };
};

/** 是否还有可行的移动 (棋盘有空位, 或存在相邻且相等的方块) */
export const canMove = (board: Board): boolean => {
  const size = boardSize(board);
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const v = board[r][c];
      if (v === 0) return true;
      if (c + 1 < size && board[r][c + 1] === v) return true;
      if (r + 1 < size && board[r + 1][c] === v) return true;
    }
  }
  return false;
};

/** 是否已无法继续 (满盘且没有可合并的相邻方块) */
export const isGameOver = (board: Board): boolean => !canMove(board);

/** 在随机空位生成一个 2 或 4; 棋盘已满时返回 null */
export const spawnTile = (board: Board, rng: Rng = Math.random): { board: Board; tile: MergeCell } | null => {
  const empty = emptyCells(board);
  if (empty.length === 0) return null;
  const next = cloneBoard(board);
  const idx = Math.min(empty.length - 1, Math.max(0, Math.floor(rng() * empty.length)));
  const { r, c } = empty[idx];
  const v = rng() < FOUR_RATE ? 4 : 2;
  next[r][c] = v;
  return { board: next, tile: { r, c, v } };
};

/** 开局: 空白棋盘 + START_TILES 个随机方块 */
export const startBoard = (size: number, rng: Rng = Math.random): { board: Board; tiles: MergeCell[] } => {
  let board = createBoard(size);
  const tiles: MergeCell[] = [];
  for (let i = 0; i < START_TILES; i += 1) {
    const res = spawnTile(board, rng);
    if (!res) break;
    board = res.board;
    tiles.push(res.tile);
  }
  return { board, tiles };
};

/** 按方向键 / WASD 映射移动方向; 非移动键返回 null */
export const dirOfKey = (e: { key?: string; code?: string } | null | undefined): Direction | null => {
  if (!e) return null;
  switch (e.key) {
    case 'ArrowLeft': case 'a': case 'A': return 'left';
    case 'ArrowRight': case 'd': case 'D': return 'right';
    case 'ArrowUp': case 'w': case 'W': return 'up';
    case 'ArrowDown': case 's': case 'S': return 'down';
    default: return null;
  }
};

/** 键盘事件是否来自输入控件 (此时方向键归控件自己处理) */
export const isTypingTarget = (
  node: { tagName?: string; isContentEditable?: boolean } | null | undefined
): boolean => {
  if (!node) return false;
  const tag = String(node.tagName ?? '').toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable === true;
};

/** 方块配色: 超出配色表的超大数字用兜底色 */
export const tileColor = (v: number): { bg: string; fg: string } => TILE_COLORS[v] ?? TILE_COLOR_HIGH;

/** 字号系数 (按数字位数): 位数越多字号越小, 避免撑破格子 */
export const tileFontScale = (v: number): number => {
  const digits = String(Math.max(0, Math.floor(v))).length;
  const hit = TILE_FONT_SCALE.find((it) => digits <= it.digits);
  return hit ? hit.scale : TILE_FONT_SCALE_MIN;
};

/** 格子坐标 -> React key / data 属性用的字符串 */
export const cellKey = (cell: { r: number; c: number }): string => `${cell.r}-${cell.c}`;

// ---- 最高分 (按棋盘边长分别记录) ----

/** 读取全部最高分 (读取失败返回空对象) */
export const getBestScores = (): Record<string, number> => {
  try {
    const raw = localStorage.getItem(BEST_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [ k, v ] of Object.entries(parsed ?? {})) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) out[k] = Math.floor(n);
    }
    return out;
  } catch {
    return {};
  }
};

/** 某个棋盘边长的最高分 (无记录为 0) */
export const getBestScore = (size: unknown): number => getBestScores()[String(normalizeSize(size))] ?? 0;

/** 写入某个棋盘边长的最高分 (自动取较大值; 返回写入后的全部记录) */
export const setBestScore = (size: unknown, score: unknown): Record<string, number> => {
  const key = String(normalizeSize(size));
  const n = Number(score);
  const next = getBestScores();
  const value = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  if (value > (next[key] ?? 0)) next[key] = value;
  try {
    localStorage.setItem(BEST_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 隐私模式等写入失败: 忽略 */
  }
  return next;
};

/** 清空最高分 */
export const clearBestScores = (): void => {
  try {
    localStorage.removeItem(BEST_STORAGE_KEY);
  } catch {
    /* 忽略 */
  }
};

// ---- 默认设置 (设置中心 / 「配置文件」导入导出共用 getDefault* + setDefault* 成对约定) ----

export interface GameOptions {
  /** 棋盘边长 */
  size: BoardSize;
  /** 胜利目标: 合成出该数字即通关 */
  win: number;
  /** 是否播放方块弹出动画 */
  anim: boolean;
}

export const DEFAULT_OPTIONS: GameOptions = {
  size: BOARD_SIZE_DEFAULT,
  win: WIN_DEFAULT,
  anim: true,
};

/** 任意输入 -> 合法胜利目标 (只取预设档位里最接近的一个) */
export const normalizeWin = (v: unknown): number => {
  const n = Number(v);
  if (!Number.isFinite(n)) return WIN_DEFAULT;
  let best: number = WIN_OPTIONS[0];
  for (const opt of WIN_OPTIONS) {
    if (Math.abs(opt - n) < Math.abs(best - n)) best = opt;
  }
  return best;
};

/** 任意输入 -> 完整合法的选项 */
export const normalizeOptions = (raw?: Partial<GameOptions> | null): GameOptions => ({
  size: normalizeSize(raw?.size),
  win: normalizeWin(raw?.win),
  anim: raw?.anim === undefined ? DEFAULT_OPTIONS.anim : raw.anim === true,
});

/** 读取默认设置 (非法值 / 读取失败一律回退默认) */
export const getDefaultOptions = (): GameOptions => {
  try {
    const raw = localStorage.getItem(DEFAULTS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_OPTIONS };
    return normalizeOptions(JSON.parse(raw) as Partial<GameOptions>);
  } catch {
    return { ...DEFAULT_OPTIONS };
  }
};

/** 写入默认设置 (已归一化; 返回真正写入的值) */
export const setDefaultOptions = (raw?: Partial<GameOptions> | null): GameOptions => {
  const next = normalizeOptions(raw);
  try {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 忽略 */
  }
  return next;
};

/** 局部更新默认设置 (未提供的字段保持原值) */
export const patchDefaultOptions = (patch: Partial<GameOptions>): GameOptions =>
  setDefaultOptions({ ...getDefaultOptions(), ...patch });

/** 两组选项是否一致 (用于「保存为默认设置」按钮的禁用状态) */
export const isSameOptions = (a: GameOptions, b: GameOptions): boolean =>
  a.size === b.size && a.win === b.win && a.anim === b.anim;

// ---- 对局存档 (刷新页面 / 切换标签后接着玩) ----

export interface GameState {
  /** 当前棋盘 */
  board: Board;
  /** 当前分数 */
  score: number;
  /** 本局是否已达成胜利目标 (达成后仍可继续挑战) */
  won: boolean;
}

/** 校验存档棋盘: 必须是 0 或 2 的幂的非负整数方阵 */
const isValidBoard = (raw: unknown, size: number): raw is Board => {
  if (!Array.isArray(raw) || raw.length !== size) return false;
  return raw.every((row) => Array.isArray(row) && row.length === size && row.every((v) => {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return false;
    if (v === 0) return true;
    return v >= 2 && Number.isInteger(Math.log2(v));
  }));
};

/** 读取存档; 棋盘边长不匹配 / 数据损坏返回 null */
export const loadState = (size: unknown): GameState | null => {
  const n = normalizeSize(size);
  try {
    const raw = localStorage.getItem(STATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { size?: unknown; board?: unknown; score?: unknown; won?: unknown };
    if (normalizeSize(parsed?.size) !== n || !isValidBoard(parsed.board, n)) return null;
    const score = Number(parsed.score);
    return {
      board: cloneBoard(parsed.board),
      score: Number.isFinite(score) && score > 0 ? Math.floor(score) : 0,
      won: parsed.won === true,
    };
  } catch {
    return null;
  }
};

/** 写入存档 (棋盘已归一化; 写入失败忽略) */
export const saveState = (state: GameState, size: unknown): void => {
  const n = normalizeSize(size);
  const board = Array.isArray(state.board) && state.board.length === n
    ? state.board.map((row) => [ ...row ].slice(0, n))
    : createBoard(n);
  const score = Number(state.score);
  try {
    localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify({
      size: n,
      board,
      score: Number.isFinite(score) && score > 0 ? Math.floor(score) : 0,
      won: state.won === true,
    }));
  } catch {
    /* 忽略 */
  }
};

/** 清空存档 (重新开局时调用) */
export const clearState = (): void => {
  try {
    localStorage.removeItem(STATE_STORAGE_KEY);
  } catch {
    /* 忽略 */
  }
};
