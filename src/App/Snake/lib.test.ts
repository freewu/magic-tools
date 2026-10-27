import {
  BEST_STORAGE_KEY, COLS, GOLD_CHANCE, GOLD_LIFE_MS, QUEUE_MAX, ROWS, SCORE_APPLE, SCORE_GOLD, SPEED_MS,
  START_SNAKE, WALL_MAP,
} from './data';
import {
  begin, cellKey, clearBestScores, createState, createWalls, DEFAULT_OPTIONS, expireFood, freeCells,
  getBestScore, getDefaultOptions, isTypingTarget, isWall, keyToInput, normalizeOptions, normalizeSpeed, pause,
  patchDefaultOptions, placeFood, setBestScore, setDefaultOptions, snakeLength, speedMs, step, swipeToDir,
  togglePause, turn, type Rng, type SnakeState,
} from './lib';

/** 固定序列的随机数发生器 (用完后重复最后一个值) */
const seq = (...values: number[]): Rng => {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
};

// 每个用例都从序列开头重新取 (序列是闭包状态, 复用会串味)
let noGold: Rng;
let gold: Rng;

const head = (s: SnakeState) => s.snake[0];

/** 走 n 步 (返回最后一步的结果事件集合) */
const run = (state: SnakeState, n: number, rng: Rng = noGold) => {
  let cur = state;
  const events: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const r = step(cur, rng, 0);
    cur = r.state;
    events.push(r.event);
  }
  return { state: cur, events };
};

beforeEach(() => {
  localStorage.clear();
  noGold = seq(0, 0.9);
  gold = seq(0, 0.01);
});

describe('初始状态', () => {
  test('20×20 棋盘, 蛇长 3, 头在 (9,10), 朝右, 未开局', () => {
    const s = createState({}, noGold);
    expect(s.cols).toBe(COLS);
    expect(s.rows).toBe(ROWS);
    expect(snakeLength(s)).toBe(3);
    expect(head(s)).toEqual({ x: 9, y: 10 });
    expect(s.snake).toEqual(START_SNAKE.map((c) => ({ ...c })));
    expect(s.dir).toBe('right');
    expect(s.status).toBe('idle');
    expect(s.score).toBe(0);
    expect(s.walls).toHaveLength(0);
  });

  test('打开障碍物后有 12 格障碍', () => {
    const s = createState({ walls: true }, noGold);
    expect(s.walls).toHaveLength(WALL_MAP.length);
    expect(isWall(s, 5, 5)).toBe(true);
    expect(isWall(s, 0, 0)).toBe(false);
    expect(createWalls(false)).toHaveLength(0);
  });

  test('开局就有食物, 且不会落在蛇身 / 障碍物上', () => {
    const s = createState({ walls: true }, seq(0.5, 0.9));
    expect(s.food).not.toBeNull();
    const blocked = new Set([ ...s.snake.map(cellKey), ...s.walls.map(cellKey) ]);
    expect(blocked.has(cellKey(s.food!))).toBe(false);
  });

  test('rng 恒为 0 时食物落在按行扫描的第一个空格 (0,0)', () => {
    const s = createState({}, noGold);
    expect(s.food).toEqual({ x: 0, y: 0, type: 'apple', until: 0 });
  });

  test('金苹果带上过期时间戳', () => {
    const s = createState({}, gold);
    expect(s.food?.type).toBe('gold');
    expect(s.food?.until).toBe(GOLD_LIFE_MS);
  });
});

describe('空格与食物', () => {
  test('空格 = 棋盘数 - 蛇身 - 障碍物', () => {
    const s = createState({ walls: true }, noGold);
    expect(freeCells(s)).toHaveLength(COLS * ROWS - 3 - WALL_MAP.length);
  });

  test('棋盘填满时无食物 (placeFood 返回 null)', () => {
    const full: SnakeState = {
      ...createState({ cols: 2, rows: 1 }, noGold),
      snake: [ { x: 0, y: 0 }, { x: 1, y: 0 } ],
      food: null,
    };
    expect(freeCells(full)).toHaveLength(0);
    expect(placeFood(full, noGold)).toBeNull();
  });

  test('金苹果到点变回普通苹果', () => {
    const s = createState({}, gold);
    const same = expireFood(s, GOLD_LIFE_MS - 1);
    expect(same.food?.type).toBe('gold');
    const expired = expireFood(s, GOLD_LIFE_MS);
    expect(expired.food?.type).toBe('apple');
    expect(expired.food?.until).toBe(0);
  });

  test('普通苹果不会过期', () => {
    const s = createState({}, noGold);
    expect(expireFood(s, 1e9)).toBe(s);
  });
});

describe('转向', () => {
  test('接受左 / 右 / 上转向, 拒绝 180 度掉头', () => {
    const s = createState({}, noGold);
    expect(turn(s, 'up').queue).toEqual([ 'up' ]);
    // 朝右时不能直接向左 (180 度), 同向也忽略
    expect(turn(s, 'left').queue).toEqual([]);
    expect(turn(s, 'right').queue).toEqual([]);
    // 先转上, 再转左是合法的
    expect(turn(turn(s, 'up'), 'left').queue).toEqual([ 'up', 'left' ]);
  });

  test('队列里连续两个不同方向都会保留, 同向 / 反向被忽略', () => {
    const s = turn(createState({}, noGold), 'up');
    const two = turn(s, 'left');
    expect(two.queue).toEqual([ 'up', 'left' ]);
    expect(turn(two, 'left').queue).toEqual([ 'up', 'left' ]);
    expect(turn(two, 'right').queue).toEqual([ 'up', 'left' ]);
  });

  test('队列长度有上限', () => {
    let s = createState({}, noGold);
    for (const d of [ 'up', 'left', 'down', 'right', 'up' ] as const) s = turn(s, d);
    expect(s.queue.length).toBeLessThanOrEqual(QUEUE_MAX);
  });

  test('结束后不能再转向', () => {
    const over: SnakeState = { ...createState({}, noGold), status: 'over' };
    expect(turn(over, 'up')).toBe(over);
  });
});

describe('走一格', () => {
  test('未开局 / 暂停时不推进', () => {
    const idle = createState({}, noGold);
    expect(step(idle, noGold).state).toBe(idle);
    const paused = pause(begin(idle));
    expect(step(paused, noGold).state).toBe(paused);
  });

  test('前进一格: 头移动, 长度不变 (尾巴让位)', () => {
    const s = begin(createState({}, noGold));
    const { state, events } = run(s, 1);
    expect(head(state)).toEqual({ x: 10, y: 10 });
    expect(snakeLength(state)).toBe(3);
    expect(state.steps).toBe(1);
    expect(events).toEqual([ 'none' ]);
  });

  test('转向队列每走一格消费一个', () => {
    let s = begin(createState({}, noGold));
    s = turn(turn(s, 'up'), 'left');
    s = step(s, noGold).state;
    expect(s.dir).toBe('up');
    expect(head(s)).toEqual({ x: 9, y: 9 });
    s = step(s, noGold).state;
    expect(s.dir).toBe('left');
    expect(head(s)).toEqual({ x: 8, y: 9 });
    expect(s.queue).toHaveLength(0);
  });

  test('吃苹果: +10 分, 长 1 格, 换新食物', () => {
    const base = begin(createState({}, noGold));
    // 把食物放到前方一格
    const s: SnakeState = { ...base, food: { x: 10, y: 10, type: 'apple', until: 0 } };
    const r = step(s, noGold);
    expect(r.event).toBe('eat');
    expect(r.state.score).toBe(SCORE_APPLE);
    expect(snakeLength(r.state)).toBe(4);
    expect(r.state.food).not.toBeNull();
    expect(r.state.food).not.toEqual({ x: 10, y: 10, type: 'apple', until: 0 });
  });

  test('吃金苹果: +30 分', () => {
    const base = begin(createState({}, noGold));
    const s: SnakeState = { ...base, food: { x: 10, y: 10, type: 'gold', until: 5000 } };
    const r = step(s, noGold, 100);
    expect(r.event).toBe('gold');
    expect(r.state.score).toBe(SCORE_GOLD);
  });

  test('不穿墙时撞墙结束', () => {
    let s = begin(createState({}, noGold));
    const { state } = run(s, 10);
    expect(head(state)).toEqual({ x: 19, y: 10 });
    expect(state.status).toBe('running');
    const dead = step(state, noGold);
    expect(dead.event).toBe('die');
    expect(dead.state.status).toBe('over');
    // 撞死后蛇身保持原样
    expect(head(dead.state)).toEqual({ x: 19, y: 10 });
  });

  test('穿墙时从对边进来', () => {
    let s = begin(createState({}, noGold));
    s = { ...s, wrap: true };
    const { state } = run(s, 11);
    expect(head(state)).toEqual({ x: 0, y: 10 });
    expect(state.status).toBe('running');
  });

  test('撞到障碍物结束', () => {
    const base = begin(createState({ walls: true }, noGold));
    const s: SnakeState = { ...base, snake: [ { x: 4, y: 5 }, { x: 3, y: 5 } ], dir: 'right', queue: [] };
    const r = step(s, noGold);
    expect(r.event).toBe('die');
    expect(r.state.status).toBe('over');
  });

  test('撞到自己结束', () => {
    // 长 5 的蛇绕成一圈: 头往右会撞到自己的身体
    const base = begin(createState({}, noGold));
    const snake = [
      { x: 5, y: 5 }, { x: 4, y: 5 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 6, y: 5 },
    ];
    const s: SnakeState = { ...base, snake, dir: 'down', queue: [] };
    // 向下走到 (5,6) —— 那里是身体
    const r = step(s, noGold);
    expect(r.event).toBe('die');
    expect(r.state.status).toBe('over');
  });

  test('可以走进尾巴所在的格子 (尾巴会让位)', () => {
    const base = begin(createState({}, noGold));
    // 头 (5,5) 向右, 尾巴在 (6,5)
    const snake = [ { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 6, y: 5 } ];
    const s: SnakeState = { ...base, snake, dir: 'right', queue: [], food: { x: 0, y: 0, type: 'apple', until: 0 } };
    const r = step(s, noGold);
    expect(r.event).toBe('none');
    expect(r.state.status).toBe('running');
    expect(head(r.state)).toEqual({ x: 6, y: 5 });
  });

  test('吃掉最后一格空格时通关', () => {
    const base = begin(createState({ cols: 3, rows: 1 }, noGold));
    const s: SnakeState = {
      ...base, snake: [ { x: 1, y: 0 }, { x: 2, y: 0 } ], dir: 'left', queue: [],
      food: { x: 0, y: 0, type: 'apple', until: 0 },
    };
    const r = step(s, noGold);
    expect(r.event).toBe('win');
    expect(r.state.status).toBe('won');
    expect(r.state.food).toBeNull();
    expect(snakeLength(r.state)).toBe(3);
  });
});

describe('状态切换', () => {
  test('begin / pause / togglePause', () => {
    const idle = createState({}, noGold);
    expect(idle.status).toBe('idle');
    const running = begin(idle);
    expect(running.status).toBe('running');
    expect(pause(running).status).toBe('paused');
    expect(togglePause(running).status).toBe('paused');
    expect(togglePause(pause(running)).status).toBe('running');
    // 未开局 / 已结束不受影响
    expect(togglePause(idle).status).toBe('idle');
    const over: SnakeState = { ...running, status: 'over' };
    expect(begin(over)).toBe(over);
  });
});

describe('速度 / 输入', () => {
  test('四档速度的间隔', () => {
    expect(speedMs('slow')).toBe(SPEED_MS.slow);
    expect(speedMs('mid')).toBe(SPEED_MS.mid);
    expect(speedMs('fast')).toBe(SPEED_MS.fast);
    expect(speedMs('insane')).toBe(SPEED_MS.insane);
    expect(speedMs('slow')).toBeGreaterThan(speedMs('insane'));
  });

  test('键盘 -> 动作', () => {
    expect(keyToInput({ key: 'ArrowUp' })).toBe('up');
    expect(keyToInput({ key: 'w' })).toBe('up');
    expect(keyToInput({ key: 'S' })).toBe('down');
    expect(keyToInput({ key: 'ArrowLeft' })).toBe('left');
    expect(keyToInput({ key: 'd' })).toBe('right');
    expect(keyToInput({ key: ' ' })).toBe('start');
    expect(keyToInput({ key: 'Enter' })).toBe('start');
    expect(keyToInput({ key: 'p' })).toBe('pause');
    expect(keyToInput({ key: 'Escape' })).toBe('pause');
    expect(keyToInput({ key: 'x' })).toBeNull();
  });

  test('滑动位移 -> 方向', () => {
    expect(swipeToDir(40, 0)).toBe('right');
    expect(swipeToDir(-40, 0)).toBe('left');
    expect(swipeToDir(0, 40)).toBe('down');
    expect(swipeToDir(0, -40)).toBe('up');
    expect(swipeToDir(5, 5)).toBeNull();
    expect(swipeToDir(Number.NaN, 0)).toBeNull();
  });

  test('输入框内不拦截键盘', () => {
    const input = document.createElement('input');
    expect(isTypingTarget(input)).toBe(true);
    expect(isTypingTarget(document.createElement('div'))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

describe('最高分', () => {
  test('读写 / 只增不减 / 清空', () => {
    expect(getBestScore()).toBe(0);
    expect(setBestScore(30)).toBe(30);
    expect(getBestScore()).toBe(30);
    expect(setBestScore(10)).toBe(30);
    expect(setBestScore('abc')).toBe(30);
    clearBestScores();
    expect(getBestScore()).toBe(0);
    expect(localStorage.getItem(BEST_STORAGE_KEY)).toBeNull();
  });
});

describe('默认设置', () => {
  test('缺省值', () => {
    expect(getDefaultOptions()).toEqual(DEFAULT_OPTIONS);
    expect(DEFAULT_OPTIONS).toEqual({ speed: 'mid', wrap: false, walls: false, sound: true });
  });

  test('写入 / 局部更新 / 归一化', () => {
    setDefaultOptions({ speed: 'insane', wrap: true } as never);
    expect(getDefaultOptions()).toEqual({ speed: 'insane', wrap: true, walls: false, sound: true });
    patchDefaultOptions({ walls: true, sound: false });
    expect(getDefaultOptions()).toEqual({ speed: 'insane', wrap: true, walls: true, sound: false });
    expect(normalizeSpeed('nope')).toBe('mid');
    expect(normalizeOptions({ speed: 'fast', wrap: 'yes' as never })).toEqual({
      speed: 'fast', wrap: false, walls: false, sound: true,
    });
  });

  test('存档损坏时回退默认', () => {
    localStorage.setItem('magic-tools-snake-defaults', '{oops');
    expect(getDefaultOptions()).toEqual(DEFAULT_OPTIONS);
  });

  test('GOLD_CHANCE 在合理区间', () => {
    expect(GOLD_CHANCE).toBeGreaterThan(0);
    expect(GOLD_CHANCE).toBeLessThan(1);
  });
});
