import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import Snake from './index';
import { BEST_STORAGE_KEY, SPEED_MS, WALL_MAP } from './data';

// app-context 依赖 App/index.tsx 的顶层 await + import.meta.glob (jest commonjs 不支持), 故打桩
jest.mock('../../hook/app-context', () => ({
  AppContext: require('react').createContext(null),
}));

const press = (key: string) => fireEvent.keyDown(window, { key });

/** 棋盘格子数 (20 × 20) */
const cellCount = (container: HTMLElement) =>
  container.querySelectorAll('[data-testid="snake-board"] [data-cell]').length;

/** 某类格子 (head / body / tail / wall / food / gold) 的坐标列表 */
const cellsOf = (container: HTMLElement, kind: string) =>
  Array.from(container.querySelectorAll(`[data-testid="snake-board"] [data-filled="${kind}"]`))
    .map((el) => el.getAttribute('data-cell') as string);

/** 蛇头坐标 */
const head = (container: HTMLElement) => cellsOf(container, 'head')[0];

/** 记分框数值 (结构: 外层 div 内的 label + value, value 带 data-stat) */
const statText = (container: HTMLElement, label: string): string =>
  container.querySelector(`[data-stat="${label}"]`)?.textContent ?? '';

const score = (container: HTMLElement) => Number(statText(container, '得分'));

/** 推进 n 个走格间隔 (fake timers 下) */
const tick = (n = 1, ms = SPEED_MS.mid) => {
  for (let i = 0; i < n; i += 1) {
    act(() => { jest.advanceTimersByTime(ms); });
  }
};

/** 让棋盘每次都把食物放在 (0,0) 且是普通苹果 (10 分) */
const spawnAtOrigin = () => {
  const spy = jest.spyOn(Math, 'random');
  // 首次 createState (useState 初始化) 与 start() 的 createState 各消费两次随机数
  spy.mockReturnValueOnce(0).mockReturnValueOnce(0.9)
    .mockReturnValueOnce(0).mockReturnValueOnce(0.9)
    .mockReturnValue(0.9);
  return spy;
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('贪吃蛇页面', () => {
  test('初始渲染 20×20 棋盘与开局提示', () => {
    const { container } = render(<Snake />);
    expect(cellCount(container)).toBe(400);
    expect(cellsOf(container, 'head')).toHaveLength(1);
    expect(cellsOf(container, 'body')).toHaveLength(1);
    expect(cellsOf(container, 'tail')).toHaveLength(1);
    expect(screen.getByText('开始游戏')).toBeInTheDocument();
    expect(statText(container, '得分')).toBe('0');
    expect(statText(container, '长度')).toBe('3');
    expect(statText(container, '速度')).toBe('标准');
    // 开局就有食物
    const food = [ ...cellsOf(container, 'food'), ...cellsOf(container, 'gold') ];
    expect(food).toHaveLength(1);
  });

  test('点击开始后计时器让蛇前进一格', () => {
    jest.useFakeTimers();
    const { container } = render(<Snake />);
    fireEvent.click(screen.getByText('开始游戏'));
    expect(screen.queryByText('开始游戏')).not.toBeInTheDocument();
    expect(head(container)).toBe('9,10');
    tick(1);
    expect(head(container)).toBe('10,10');
    tick(1);
    expect(head(container)).toBe('11,10');
  });

  test('空格开局, 方向键转向', () => {
    jest.useFakeTimers();
    const { container } = render(<Snake />);
    press(' ');
    tick(1);
    expect(head(container)).toBe('10,10');
    press('ArrowUp');
    tick(1);
    expect(head(container)).toBe('10,9');
    press('a');
    tick(1);
    expect(head(container)).toBe('9,9');
  });

  test('吃到苹果: 得分 +10, 长度 +1', () => {
    jest.useFakeTimers();
    const spy = spawnAtOrigin();
    const { container } = render(<Snake />);
    expect(cellsOf(container, 'food')).toEqual([ '0,0' ]);
    press(' ');
    // 先向上 10 格到 (9,0), 再向左 9 格吃到 (0,0) 的苹果
    press('ArrowUp');
    tick(10);
    expect(head(container)).toBe('9,0');
    press('ArrowLeft');
    tick(9);
    expect(score(container)).toBe(10);
    expect(statText(container, '长度')).toBe('4');
    expect(spy).toHaveBeenCalled();
  });

  test('不穿墙时撞到右边界游戏结束', () => {
    jest.useFakeTimers();
    const { container } = render(<Snake />);
    press(' ');
    // 头在 x=9, 走到 x=19 后下一格撞墙
    tick(11);
    expect(screen.getAllByText('游戏结束').length).toBeGreaterThan(0);
    // 结束后不再前进
    const before = head(container);
    tick(3);
    expect(head(container)).toBe(before);
  });

  test('打开穿墙后从对边进来, 不会撞墙', () => {
    jest.useFakeTimers();
    const { container } = render(<Snake />);
    fireEvent.click(screen.getByTestId('snake-wrap'));
    press(' ');
    tick(11);
    expect(head(container)).toBe('0,10');
    expect(screen.queryByText('游戏结束')).not.toBeInTheDocument();
  });

  test('打开障碍物后棋盘上出现 12 格障碍', () => {
    const { container } = render(<Snake />);
    expect(cellsOf(container, 'wall')).toHaveLength(0);
    fireEvent.click(screen.getByTestId('snake-walls'));
    expect(cellsOf(container, 'wall')).toHaveLength(WALL_MAP.length);
  });

  test('P 暂停 / 空格继续', () => {
    jest.useFakeTimers();
    const { container } = render(<Snake />);
    press(' ');
    tick(1);
    press('p');
    expect(screen.getByText('已暂停')).toBeInTheDocument();
    const paused = head(container);
    tick(5);
    expect(head(container)).toBe(paused);
    press(' ');
    tick(1);
    expect(screen.queryByText('已暂停')).not.toBeInTheDocument();
    expect(head(container)).not.toBe(paused);
  });

  test('屏幕方向盘可以转向', () => {
    jest.useFakeTimers();
    const { container } = render(<Snake />);
    press(' ');
    fireEvent.click(screen.getByTestId('snake-up'));
    tick(1);
    expect(head(container)).toBe('9,9');
    fireEvent.click(screen.getByTestId('snake-left'));
    tick(1);
    expect(head(container)).toBe('8,9');
  });

  test('结束后点「再来一局」重置得分与蛇身', () => {
    jest.useFakeTimers();
    const { container } = render(<Snake />);
    press(' ');
    tick(11);
    fireEvent.click(screen.getAllByRole('button', { name: /再来一局/ })[0]);
    expect(score(container)).toBe(0);
    expect(statText(container, '长度')).toBe('3');
    expect(screen.queryByText('游戏结束')).not.toBeInTheDocument();
    tick(1);
    expect(head(container)).toBe('10,10');
  });

  test('切换速度档位立刻生效', () => {
    jest.useFakeTimers();
    const { container } = render(<Snake />);
    press(' ');
    fireEvent.click(screen.getByText('极速'));
    expect(statText(container, '速度')).toBe('极速');
    tick(1, SPEED_MS.insane);
    expect(head(container)).toBe('10,10');
    // 110ms 档位下, 再走一次仍然是 110ms
    tick(1, SPEED_MS.insane);
    expect(head(container)).toBe('11,10');
    // 换成 200ms 的标准速度后, 110ms 内不会前进
    fireEvent.click(screen.getByText('标准'));
    const now = head(container);
    tick(1, SPEED_MS.insane);
    expect(head(container)).toBe(now);
    tick(1, SPEED_MS.mid);
    expect(head(container)).toBe('12,10');
  });

  test('读取最高分', () => {
    localStorage.setItem(BEST_STORAGE_KEY, '999');
    const { container } = render(<Snake />);
    expect(statText(container, '最高分')).toBe('999');
  });

  test('全屏模式可以进入与退出', () => {
    const { container } = render(<Snake />);
    fireEvent.click(screen.getByRole('button', { name: /全屏/ }));
    expect(screen.getByTestId('snake-full')).toBeInTheDocument();
    expect(cellCount(container)).toBe(400);
    fireEvent.click(screen.getByRole('button', { name: /退出全屏/ }));
    expect(screen.queryByTestId('snake-full')).not.toBeInTheDocument();
  });

  test('音效开关可以切换', () => {
    render(<Snake />);
    const sw = screen.getByTestId('snake-sound');
    expect(sw).toBeChecked();
    fireEvent.click(sw);
    expect(sw).not.toBeChecked();
  });

  test('读取默认设置 (速度 / 穿墙 / 障碍物)', () => {
    localStorage.setItem('magic-tools-snake-defaults', JSON.stringify({
      speed: 'fast', wrap: true, walls: true, sound: false,
    }));
    const { container } = render(<Snake />);
    expect(statText(container, '速度')).toBe('快');
    expect(screen.getByTestId('snake-wrap')).toBeChecked();
    expect(screen.getByTestId('snake-walls')).toBeChecked();
    expect(screen.getByTestId('snake-sound')).not.toBeChecked();
    // 未开局时直接按默认设置铺好障碍物
    expect(cellsOf(container, 'wall')).toHaveLength(WALL_MAP.length);
  });
});
