// 贪吃蛇: 纯规则逻辑 (移动 / 转向 / 吃食物 / 金苹果限时 / 撞墙自撞 / 穿墙 / 障碍物 / 计分 / 最高分 / 默认设置)
// 说明: 本文件不依赖 DOM 与 React, 全部为纯函数 (随机数由调用方注入), 便于单测;
//       页面 (index.tsx) 只负责渲染与键盘 / 触摸 / 计时等副作用。
import {
  BEST_STORAGE_KEY,
  COLS,
  DEFAULTS_STORAGE_KEY,
  DIR_DELTA,
  GOLD_CHANCE,
  GOLD_LIFE_MS,
  OPPOSITE,
  QUEUE_MAX,
  ROWS,
  SCORE_APPLE,
  SCORE_GOLD,
  SIZE_DEFAULT,
  SIZE_ORDER,
  SPEED_DEFAULT,
  SPEED_MS,
  SPEED_ORDER,
  START_DIR,
  START_SNAKE,
  WALL_MAP,
  type Dir,
  type SizeKey,
  type SpeedKey,
} from './data';

/** 一个格子坐标 (x = 列, y = 行, 均从 0 开始) */
export interface Cell { x: number; y: number }

/** 食物: 普通苹果 (10 分) 或金苹果 (30 分, 限时消失后变回普通苹果) */
export interface Food extends Cell {
  type: 'apple' | 'gold';
  /** 金苹果的过期时间戳 (ms); 普通苹果为 0 */
  until: number;
}

/** 游戏状态: idle 未开局 / running 进行中 / paused 暂停 / over 撞死 / won 棋盘填满 */
export type Status = 'idle' | 'running' | 'paused' | 'over' | 'won';

/** 一局棋的完整状态 (不可变更新) */
export interface SnakeState {
  cols: number;
  rows: number;
  /** 蛇身, 头在第一位 */
  snake: Cell[];
  /** 当前朝向 */
  dir: Dir;
  /** 待执行的转向指令队列 (每走一格消费一个) */
  queue: Dir[];
  /** 当前食物 (棋盘填满时为 null) */
  food: Food | null;
  /** 障碍物格子 (关闭障碍物时为空数组) */
  walls: Cell[];
  /** 穿墙模式: 从一边出去, 从对边进来 */
  wrap: boolean;
  status: Status;
  score: number;
  /** 已经走了多少格 (统计用, 不含转向) */
  steps: number;
}

/** 走一格的结果事件 (页面据此播报音效 / 提示) */
export type StepEvent = 'none' | 'eat' | 'gold' | 'die' | 'win';

export interface StepResult { state: SnakeState; event: StepEvent }

/** 随机数发生器: 返回 [0, 1), 默认 Math.random (测试时注入可复现的序列) */
export type Rng = () => number;

/** 格子唯一键 (用于 Set / Map) */
export const cellKey = (c: Cell): string => `${c.x},${c.y}`;

/** 蛇身长度 */
export const snakeLength = (state: SnakeState): number => state.snake.length;

/** 是否是障碍物格子 */
export const isWall = (state: SnakeState, x: number, y: number): boolean =>
  state.walls.some((w) => w.x === x && w.y === y);

/** 按开关生成障碍物 (固定布局, 只保留棋盘内的格子) */
export const createWalls = (enabled: boolean, cols: number = COLS, rows: number = ROWS): Cell[] =>
  enabled ? WALL_MAP.filter((w) => w.x >= 0 && w.x < cols && w.y >= 0 && w.y < rows).map((w) => ({ ...w })) : [];

/** 棋盘上所有空格 (排除蛇身与障碍物) */
export const freeCells = (state: SnakeState): Cell[] => {
  const busy = new Set<string>(state.walls.map(cellKey));
  for (const c of state.snake) busy.add(cellKey(c));
  const out: Cell[] = [];
  for (let y = 0; y < state.rows; y += 1) {
    for (let x = 0; x < state.cols; x += 1) {
      if (!busy.has(`${x},${y}`)) out.push({ x, y });
    }
  }
  return out;
};

/**
 * 随机挑一个空格放食物 (注入 rng 便于单测)
 * rng 恒为 0 时取「按行扫描的第一个空格」; 棋盘已满返回 null (即通关)
 */
export const placeFood = (state: SnakeState, rng: Rng, now = 0): Food | null => {
  const free = freeCells(state);
  if (free.length === 0) return null;
  const idx = Math.min(free.length - 1, Math.max(0, Math.floor(rng() * free.length)));
  const at = free[idx];
  const gold = rng() < GOLD_CHANCE;
  return { x: at.x, y: at.y, type: gold ? 'gold' : 'apple', until: gold ? now + GOLD_LIFE_MS : 0 };
};

/** 开一局 (未开始状态: 蛇在起始位置, 食物已就位) */
export const createState = (
  opts: { cols?: number; rows?: number; walls?: boolean; wrap?: boolean } = {},
  rng: Rng = Math.random,
  now = 0,
): SnakeState => {
  const cols = opts.cols ?? COLS;
  const rows = opts.rows ?? ROWS;
  const base: SnakeState = {
    cols,
    rows,
    snake: START_SNAKE.map((c) => ({ ...c })),
    dir: START_DIR,
    queue: [],
    food: null,
    walls: createWalls(opts.walls === true, cols, rows),
    wrap: opts.wrap === true,
    status: 'idle',
    score: 0,
    steps: 0,
  };
  return { ...base, food: placeFood(base, rng, now) };
};

/** 开始 / 继续 (暂停中调用即继续) */
export const begin = (state: SnakeState): SnakeState =>
  state.status === 'running' || state.status === 'over' || state.status === 'won'
    ? state
    : { ...state, status: 'running' };

/** 暂停 */
export const pause = (state: SnakeState): SnakeState =>
  state.status === 'running' ? { ...state, status: 'paused' } : state;

/** 暂停 / 继续 切换 (未开局时不动) */
export const togglePause = (state: SnakeState): SnakeState => {
  if (state.status === 'running') return { ...state, status: 'paused' };
  if (state.status === 'paused') return { ...state, status: 'running' };
  return state;
};

/**
 * 接受一个转向指令
 * - 与当前朝向相反 / 与队列里最后一个方向相同 -> 忽略 (不能 180 度掉头)
 * - 队列最多缓存 QUEUE_MAX 个, 超出的丢弃
 */
export const turn = (state: SnakeState, dir: Dir): SnakeState => {
  if (state.status === 'over' || state.status === 'won') return state;
  const last = state.queue.length > 0 ? state.queue[state.queue.length - 1] : state.dir;
  if (dir === last || dir === OPPOSITE[last]) return state;
  if (state.queue.length >= QUEUE_MAX) return state;
  return { ...state, queue: [ ...state.queue, dir ] };
};

/** 金苹果到点变回普通苹果 (普通苹果 / 没有食物时原样返回) */
export const expireFood = (state: SnakeState, now: number): SnakeState => {
  const food = state.food;
  if (!food || food.type !== 'gold' || food.until <= 0) return state;
  if (now < food.until) return state;
  return { ...state, food: { ...food, type: 'apple', until: 0 } };
};

/** 撞到障碍物 / 自己 / 墙: 结束本局 (蛇身保持原样, 便于页面展示最后位置) */
const die = (state: SnakeState): StepResult => ({ state: { ...state, status: 'over' }, event: 'die' });

/**
 * 走一格 (只在 running 时推进)
 * 规则: 先消费转向队列 -> 算下一格 -> 穿墙或撞墙 -> 撞障碍物 -> 撞自己 (不吃时尾巴会让位) -> 吃食物
 */
export const step = (state: SnakeState, rng: Rng = Math.random, now = 0): StepResult => {
  if (state.status !== 'running') return { state, event: 'none' };

  const queue = state.queue.slice();
  const dir = queue.length > 0 ? queue.shift() as Dir : state.dir;
  const head = state.snake[0];
  const delta = DIR_DELTA[dir];
  let nx = head.x + delta.x;
  let ny = head.y + delta.y;

  if (state.wrap) {
    nx = ((nx % state.cols) + state.cols) % state.cols;
    ny = ((ny % state.rows) + state.rows) % state.rows;
  } else if (nx < 0 || ny < 0 || nx >= state.cols || ny >= state.rows) {
    return die({ ...state, dir, queue });
  }

  if (isWall(state, nx, ny)) return die({ ...state, dir, queue });

  const eating = state.food !== null && state.food.x === nx && state.food.y === ny;
  // 不吃时不长身体, 尾巴会腾出位置 (所以可以走到尾巴所在的格子)
  const body = eating ? state.snake : state.snake.slice(0, Math.max(0, state.snake.length - 1));
  if (body.some((c) => c.x === nx && c.y === ny)) return die({ ...state, dir, queue });

  const snake: Cell[] = eating
    ? [ { x: nx, y: ny }, ...state.snake ]
    : [ { x: nx, y: ny }, ...state.snake.slice(0, Math.max(0, state.snake.length - 1)) ];

  if (!eating) {
    return { state: { ...state, snake, dir, queue, steps: state.steps + 1 }, event: 'none' };
  }

  const gold = state.food?.type === 'gold';
  const score = state.score + (gold ? SCORE_GOLD : SCORE_APPLE);
  const grown: SnakeState = { ...state, snake, dir, queue, score, steps: state.steps + 1, food: null };
  const food = placeFood(grown, rng, now);
  if (food === null) {
    return { state: { ...grown, food: null, status: 'won' }, event: 'win' };
  }
  return { state: { ...grown, food }, event: gold ? 'gold' : 'eat' };
};

/** 该速度档位的走格间隔 (ms) */
export const speedMs = (speed: SpeedKey): number => SPEED_MS[speed] ?? SPEED_MS[SPEED_DEFAULT];

/** 键盘输入 -> 动作 (方向 / 暂停 / 开局); 未命中返回 null */
export type KeyAction = Dir | 'pause' | 'start';

export const keyToInput = (e: { key?: string }): KeyAction | null => {
  const key = (e.key ?? '').toLowerCase();
  switch (key) {
    case 'arrowup':
    case 'w':
      return 'up';
    case 'arrowdown':
    case 's':
      return 'down';
    case 'arrowleft':
    case 'a':
      return 'left';
    case 'arrowright':
    case 'd':
      return 'right';
    case ' ':
    case 'enter':
      return 'start';
    case 'p':
    case 'escape':
      return 'pause';
    default:
      return null;
  }
};

/** 是否在输入框 / 可编辑区域里 (此时不拦截键盘) */
export const isTypingTarget = (el: HTMLElement | null): boolean => {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return el.isContentEditable === true;
};

/** 屏幕方向盘 / 滑动: 由起点到终点的位移判断方向 (位移太小时返回 null) */
export const swipeToDir = (dx: number, dy: number, min = 16): Dir | null => {
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return null;
  if (Math.abs(dx) < min && Math.abs(dy) < min) return null;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
};

// ---- 最高分 ----

/** 读取最高分 (读不到 / 非法值返回 0) */
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

// ---- 默认设置 (设置中心 / 页面上的开关共用 getDefault* + setDefault* 成对约定) ----

export interface SnakeOptions {
  /** 速度档位 */
  speed: SpeedKey;
  /** 棋盘尺寸档位 (只影响视觉, 棋盘始终保持 20×20) */
  size: SizeKey;
  /** 穿墙模式: 从一边出去, 从对边进来 */
  wrap: boolean;
  /** 是否出现障碍物 */
  walls: boolean;
  /** 是否播放音效 */
  sound: boolean;
}

export const DEFAULT_OPTIONS: SnakeOptions = {
  speed: SPEED_DEFAULT,
  size: SIZE_DEFAULT,
  wrap: false,
  walls: false,
  sound: true,
};

/** 任意输入 -> 合法速度档位 */
export const normalizeSpeed = (v: unknown): SpeedKey => (SPEED_ORDER.includes(v as SpeedKey) ? v as SpeedKey : SPEED_DEFAULT);

/** 任意输入 -> 合法尺寸档位 */
export const normalizeSize = (v: unknown): SizeKey => (SIZE_ORDER.includes(v as SizeKey) ? v as SizeKey : SIZE_DEFAULT);

/** 任意输入 -> 完整合法的选项 */
export const normalizeOptions = (raw?: Partial<SnakeOptions> | null): SnakeOptions => ({
  speed: normalizeSpeed(raw?.speed),
  size: normalizeSize(raw?.size),
  wrap: raw?.wrap === undefined ? DEFAULT_OPTIONS.wrap : raw.wrap === true,
  walls: raw?.walls === undefined ? DEFAULT_OPTIONS.walls : raw.walls === true,
  sound: raw?.sound === undefined ? DEFAULT_OPTIONS.sound : raw.sound === true,
});

/** 读取默认设置 (非法值 / 读取失败一律回退默认) */
export const getDefaultOptions = (): SnakeOptions => {
  try {
    const raw = localStorage.getItem(DEFAULTS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_OPTIONS };
    return normalizeOptions(JSON.parse(raw) as Partial<SnakeOptions>);
  } catch {
    return { ...DEFAULT_OPTIONS };
  }
};

/** 写入默认设置 (已归一化; 返回真正写入的值) */
export const setDefaultOptions = (raw?: Partial<SnakeOptions> | null): SnakeOptions => {
  const next = normalizeOptions(raw);
  try {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 忽略 */
  }
  return next;
};

/** 局部更新默认设置 (未提供的字段保持原值) */
export const patchDefaultOptions = (patch: Partial<SnakeOptions>): SnakeOptions =>
  setDefaultOptions({ ...getDefaultOptions(), ...patch });
