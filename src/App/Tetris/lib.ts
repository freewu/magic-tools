// 俄罗斯方块: 纯规则逻辑 (碰撞 / 旋转 / 下落 / 消行 / 计分 / 7-bag 随机 / 最高分 / 默认设置)
// 说明: 本文件不依赖 DOM 与 React, 全部为纯函数 (随机数由调用方注入), 便于单测;
//       页面 (index.tsx) 只负责渲染与键盘 / 触摸 / 计时等副作用。
import {
  BEST_STORAGE_KEY,
  BOARD_COLS,
  BOARD_ROWS,
  DEFAULTS_STORAGE_KEY,
  GRAVITY_BASE_MS,
  GRAVITY_MIN_MS,
  GRAVITY_STEP_MS,
  HARD_DROP_SCORE,
  LEVEL_DEFAULT,
  LEVEL_MAX,
  LEVEL_MIN,
  LINES_PER_LEVEL,
  LINE_SCORES,
  PIECE_TYPES,
  PREVIEW_QUEUE,
  SHAPES,
  SOFT_DROP_SCORE,
  WALL_KICKS,
  type PieceType,
} from './data';

/** 棋盘: board[r][c] 为已锁定的方块类型, null 表示空位 */
export type Board = (PieceType | null)[][];

/** 一个正在下落的方块: 类型 + 旋转态下标 + 包围盒左上角在棋盘上的位置 */
export interface Piece {
  type: PieceType;
  rot: number;
  r: number;
  c: number;
}

/** 一个格子坐标 */
export interface Cell { r: number; c: number }

/** 随机数发生器: 返回 [0, 1), 默认 Math.random (测试时注入可复现的序列) */
export type Rng = () => number;

/** 键盘动作 */
export type Action =
  | 'left' | 'right' | 'softDrop' | 'rotateCW' | 'rotateCCW' | 'hardDrop' | 'hold' | 'pause';

/** 新建空白棋盘 */
export const createBoard = (rows: number = BOARD_ROWS, cols: number = BOARD_COLS): Board => {
  const r = Number.isFinite(rows) && rows > 0 ? Math.floor(rows) : BOARD_ROWS;
  const c = Number.isFinite(cols) && cols > 0 ? Math.floor(cols) : BOARD_COLS;
  return Array.from({ length: r }, () => new Array<PieceType | null>(c).fill(null));
};

/** 深拷贝棋盘 */
export const cloneBoard = (board: Board): Board => board.map((row) => [ ...row ]);

/** 棋盘行列数 */
export const boardRows = (board: Board): number => board.length;
export const boardCols = (board: Board): number => (board[0]?.length ?? 0);

/** 方块的包围盒宽度 (I 是 4, 其余是 3) */
const boxWidth = (type: PieceType): number => (type === 'I' ? 4 : 3);

/** 方块当前旋转态占用的格子坐标 */
export const pieceCells = (piece: Piece): Cell[] => {
  const states = SHAPES[piece.type];
  const shape = states[((piece.rot % states.length) + states.length) % states.length];
  return shape.map(([ dr, dc ]) => ({ r: piece.r + dr, c: piece.c + dc }));
};

/** 方块类型在某旋转态下的格子偏移 (不含棋盘位置, 供预览图用) */
export const shapeOf = (type: PieceType, rot = 0): ReadonlyArray<readonly [ number, number ]> => {
  const states = SHAPES[type];
  return states[((rot % states.length) + states.length) % states.length];
};

/** 是否与棋盘边界 / 已锁定方块冲突 */
export const collides = (board: Board, piece: Piece): boolean => {
  const rows = boardRows(board);
  const cols = boardCols(board);
  return pieceCells(piece).some(({ r, c }) => c < 0 || c >= cols || r >= rows || (r >= 0 && board[r][c] !== null));
};

/** 生成一个方块 (顶部居中) */
export const spawnPiece = (type: PieceType, cols: number = BOARD_COLS): Piece => ({
  type,
  rot: 0,
  r: 0,
  c: Math.max(0, Math.floor((cols - boxWidth(type)) / 2)),
});

/** 左右平移 1 格; 无法移动时返回 null */
export const movePiece = (board: Board, piece: Piece, dc: number): Piece | null => {
  const next: Piece = { ...piece, c: piece.c + dc };
  return collides(board, next) ? null : next;
};

/** 下降 1 格; 已落地返回 null */
export const softDropPiece = (board: Board, piece: Piece): Piece | null => {
  const next: Piece = { ...piece, r: piece.r + 1 };
  return collides(board, next) ? null : next;
};

/**
 * 旋转 (dir = 1 顺时针, -1 逆时针)
 * O 方块只有一个形状; 贴墙 / 贴其它方块时依次尝试左右偏移 (简化 wall kick)
 */
export const rotatePiece = (board: Board, piece: Piece, dir: 1 | -1): Piece | null => {
  const states = SHAPES[piece.type].length;
  if (states <= 1) return null;
  const rot = (piece.rot + (dir === 1 ? 1 : -1) + states) % states;
  for (const kick of WALL_KICKS) {
    const next: Piece = { ...piece, rot, c: piece.c + kick };
    if (!collides(board, next)) return next;
  }
  return null;
};

/** 从当前位置硬降还能下落多少格 */
export const dropDistance = (board: Board, piece: Piece): number => {
  let dist = 0;
  while (!collides(board, { ...piece, r: piece.r + dist + 1 })) dist += 1;
  return dist;
};

/** 硬降: 返回落地后的方块与其下落格数 */
export const hardDropPiece = (board: Board, piece: Piece): { piece: Piece; distance: number } => {
  const distance = dropDistance(board, piece);
  return { piece: { ...piece, r: piece.r + distance }, distance };
};

/** 幽灵方块 (落点预览) */
export const ghostPiece = (board: Board, piece: Piece): Piece =>
  ({ ...piece, r: piece.r + dropDistance(board, piece) });

/** 把方块固定到棋盘上 (返回新棋盘) */
export const lockPiece = (board: Board, piece: Piece): Board => {
  const next = cloneBoard(board);
  for (const { r, c } of pieceCells(piece)) {
    if (r >= 0 && r < next.length && c >= 0 && c < (next[0]?.length ?? 0)) next[r][c] = piece.type;
  }
  return next;
};

/** 消掉填满的行; 返回新棋盘、消除行数与被消掉的行号 (供动画) */
export const clearLines = (board: Board): { board: Board; cleared: number; rows: number[] } => {
  const kept = board.filter((row) => row.some((v) => v === null));
  const rows: number[] = [];
  board.forEach((row, r) => { if (!row.some((v) => v === null)) rows.push(r); });
  const cleared = rows.length;
  if (cleared === 0) return { board: cloneBoard(board), cleared, rows };
  const width = board[0]?.length ?? 0;
  const fresh: Board = Array.from({ length: cleared }, () => new Array<PieceType | null>(width).fill(null));
  return { board: [ ...fresh, ...kept ], cleared, rows };
};

/** 起始等级 + 已消行数 -> 当前等级 */
export const levelOf = (startLevel: number, lines: number): number => {
  const start = Number.isFinite(startLevel) ? Math.floor(startLevel) : LEVEL_DEFAULT;
  const n = Number.isFinite(lines) && lines > 0 ? Math.floor(lines) : 0;
  return Math.max(LEVEL_MIN, start) + Math.floor(n / LINES_PER_LEVEL);
};

/** 等级对应的自动下落间隔 (ms), 等级越高越快 */
export const gravityMs = (level: number): number => {
  const lv = Number.isFinite(level) ? Math.max(LEVEL_MIN, Math.floor(level)) : LEVEL_MIN;
  return Math.max(GRAVITY_MIN_MS, GRAVITY_BASE_MS - (lv - 1) * GRAVITY_STEP_MS);
};

/** 一次消行的得分 (按行数与等级计) */
export const scoreForClear = (cleared: number, level: number): number => {
  const n = Number.isFinite(cleared) ? Math.max(0, Math.min(LINE_SCORES.length - 1, Math.floor(cleared))) : 0;
  const lv = Number.isFinite(level) ? Math.max(LEVEL_MIN, Math.floor(level)) : LEVEL_MIN;
  return LINE_SCORES[n] * lv;
};

// ---- 7-bag 随机器: 每 7 个方块为一轮, 保证七种各出现一次 (体验更公平) ----

/** 洗好的一轮七种方块 */
export const makeBag = (rng: Rng = Math.random): PieceType[] => {
  const bag = [ ...PIECE_TYPES ];
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.min(i, Math.max(0, Math.floor(rng() * (i + 1))));
    [ bag[i], bag[j] ] = [ bag[j], bag[i] ];
  }
  return bag;
};

/** 补齐队列到所需长度 (不足时按 7-bag 续上新的一轮) */
export const refillQueue = (
  queue: readonly PieceType[],
  rng: Rng = Math.random,
  size: number = PREVIEW_QUEUE
): PieceType[] => {
  const out = [ ...queue ];
  while (out.length < size) out.push(...makeBag(rng));
  return out.slice(0, Math.max(size, 0));
};

/** 从队列取下一个方块, 并补齐队列 */
export const nextFromQueue = (
  queue: readonly PieceType[],
  rng: Rng = Math.random,
  size: number = PREVIEW_QUEUE
): { type: PieceType; queue: PieceType[] } => {
  const filled = refillQueue(queue, rng, Math.max(size, 1));
  const [ type, ...rest ] = filled;
  return { type, queue: refillQueue(rest, rng, size) };
};

/** 开局队列 */
export const initialQueue = (rng: Rng = Math.random, size: number = PREVIEW_QUEUE): PieceType[] =>
  refillQueue([], rng, Math.max(size, 1));

/** 新方块出现位置已被占用 -> 游戏结束 */
export const isTopOut = (board: Board, piece: Piece): boolean => collides(board, piece);

// ---- 键盘映射 ----

/** 键盘事件 -> 游戏动作; 非操作键返回 null */
export const keyToAction = (e: { key?: string } | null | undefined): Action | null => {
  if (!e) return null;
  switch (e.key) {
    case 'ArrowLeft': case 'a': case 'A': return 'left';
    case 'ArrowRight': case 'd': case 'D': return 'right';
    case 'ArrowDown': case 's': case 'S': return 'softDrop';
    case 'ArrowUp': case 'w': case 'W': case 'x': case 'X': return 'rotateCW';
    case 'z': case 'Z': return 'rotateCCW';
    case ' ': case 'Spacebar': return 'hardDrop';
    case 'c': case 'C': case 'Shift': return 'hold';
    case 'p': case 'P': case 'Escape': return 'pause';
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

// ---- 最高分 ----

/** 读取最高分 (无记录 / 损坏返回 0) */
export const getBestScore = (): number => {
  try {
    const n = Number(localStorage.getItem(BEST_STORAGE_KEY));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
};

/** 写入最高分 (自动取较大值; 返回写入后的最高分) */
export const setBestScore = (score: unknown): number => {
  const n = Number(score);
  const value = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  const best = Math.max(getBestScore(), value);
  try {
    localStorage.setItem(BEST_STORAGE_KEY, String(best));
  } catch {
    /* 隐私模式等写入失败: 忽略 */
  }
  return best;
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

export interface TetrisOptions {
  /** 起始等级 (1~10), 等级越高下落越快 */
  level: number;
  /** 是否显示幽灵方块 (落点预览) */
  ghost: boolean;
  /** 是否显示网格线 */
  grid: boolean;
}

export const DEFAULT_OPTIONS: TetrisOptions = {
  level: LEVEL_DEFAULT,
  ghost: true,
  grid: true,
};

/** 任意输入 -> 合法起始等级 */
export const normalizeLevel = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return LEVEL_DEFAULT;
  return Math.min(LEVEL_MAX, Math.max(LEVEL_MIN, Math.floor(n)));
};

/** 任意输入 -> 完整合法的选项 */
export const normalizeOptions = (raw?: Partial<TetrisOptions> | null): TetrisOptions => ({
  level: normalizeLevel(raw?.level),
  ghost: raw?.ghost === undefined ? DEFAULT_OPTIONS.ghost : raw.ghost === true,
  grid: raw?.grid === undefined ? DEFAULT_OPTIONS.grid : raw.grid === true,
});

/** 读取默认设置 (非法值 / 读取失败一律回退默认) */
export const getDefaultOptions = (): TetrisOptions => {
  try {
    const raw = localStorage.getItem(DEFAULTS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_OPTIONS };
    return normalizeOptions(JSON.parse(raw) as Partial<TetrisOptions>);
  } catch {
    return { ...DEFAULT_OPTIONS };
  }
};

/** 写入默认设置 (已归一化; 返回真正写入的值) */
export const setDefaultOptions = (raw?: Partial<TetrisOptions> | null): TetrisOptions => {
  const next = normalizeOptions(raw);
  try {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 忽略 */
  }
  return next;
};

/** 局部更新默认设置 (未提供的字段保持原值) */
export const patchDefaultOptions = (patch: Partial<TetrisOptions>): TetrisOptions =>
  setDefaultOptions({ ...getDefaultOptions(), ...patch });

/** 两组选项是否一致 (用于「保存为默认设置」按钮的禁用状态) */
export const isSameOptions = (a: TetrisOptions, b: TetrisOptions): boolean =>
  a.level === b.level && a.ghost === b.ghost && a.grid === b.grid;

/** 硬降 / 软降得分 */
export const dropScore = (distance: number, soft = true): number =>
  Math.max(0, Math.floor(distance)) * (soft ? SOFT_DROP_SCORE : HARD_DROP_SCORE);
