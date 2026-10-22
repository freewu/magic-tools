import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import Tetris from './index';

// app-context 依赖 App/index.tsx 的顶层 await + import.meta.glob (jest commonjs 不支持), 故打桩
jest.mock('../../hook/app-context', () => ({
  AppContext: require('react').createContext(null),
}));

const press = (key: string) => fireEvent.keyDown(window, { key });

/** 棋盘上已填充的格子坐标 (不含幽灵方块) */
const filled = (container: HTMLElement) => {
  const board = container.querySelector('[data-testid="tetris-board"]');
  return Array.from(board?.querySelectorAll('[data-cell]') ?? [])
    .filter((el) => el.getAttribute('data-filled'))
    .map((el) => el.getAttribute('data-cell') as string);
};

/** 棋盘上所有格子数 (10 × 20) */
const cellCount = (container: HTMLElement) =>
  container.querySelectorAll('[data-testid="tetris-board"] [data-cell]').length;

/** 记分框数值 (结构: 外层 div > label + value) */
const statText = (label: string): string => screen.getByText(label).parentElement?.textContent ?? '';

const score = () => Number(statText('分数').replace('分数', ''));

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  jest.useRealTimers();
});

describe('俄罗斯方块页面', () => {
  test('初始渲染 10×20 棋盘与开局提示', () => {
    const { container } = render(<Tetris />);
    expect(cellCount(container)).toBe(200);
    expect(filled(container)).toHaveLength(0);
    expect(screen.getByText('开始游戏')).toBeInTheDocument();
    expect(score()).toBe(0);
    expect(screen.getByText('最高分')).toBeInTheDocument();
  });

  test('点击开始后出现当前方块, 开局提示消失', () => {
    const { container } = render(<Tetris />);
    fireEvent.click(screen.getByText('开始游戏'));
    expect(filled(container)).toHaveLength(4);
    expect(screen.queryByText('开始游戏')).not.toBeInTheDocument();
  });

  test('空格硬降: 方块落底并加分', () => {
    const { container } = render(<Tetris />);
    fireEvent.click(screen.getByText('开始游戏'));
    press(' ');
    // 落底后棋盘上仍有 4 格方块 (锁定后的方块 + 新出的方块不重叠)
    expect(filled(container).length).toBeGreaterThanOrEqual(4);
    expect(score()).toBeGreaterThan(0);
    // 硬降后落点应靠近底部
    const rows = filled(container).map((k) => Number(k.split('-')[0]));
    expect(Math.max(...rows)).toBeGreaterThanOrEqual(18);
  });

  test('左右移动改变方块所在列', () => {
    const { container } = render(<Tetris />);
    fireEvent.click(screen.getByText('开始游戏'));
    const before = filled(container).map((k) => Number(k.split('-')[1]));
    press('ArrowLeft');
    const after = filled(container).map((k) => Number(k.split('-')[1]));
    expect(Math.min(...after)).toBe(Math.min(...before) - 1);
    press('ArrowRight');
    expect(filled(container).map((k) => Number(k.split('-')[1])).sort()).toEqual(before.sort());
  });

  test('旋转后仍是 4 格方块', () => {
    const { container } = render(<Tetris />);
    fireEvent.click(screen.getByText('开始游戏'));
    press('ArrowUp');
    expect(filled(container)).toHaveLength(4);
  });

  test('P 暂停 / 继续', () => {
    const { container } = render(<Tetris />);
    fireEvent.click(screen.getByText('开始游戏'));
    press('p');
    expect(screen.getByText('已暂停')).toBeInTheDocument();
    // 暂停时按键不应移动方块
    const before = filled(container).sort();
    press('ArrowLeft');
    expect(filled(container).sort()).toEqual(before);
    press('p');
    expect(screen.queryByText('已暂停')).not.toBeInTheDocument();
  });

  test('C 暂存当前方块, 每个方块只能暂存一次', () => {
    const { container } = render(<Tetris />);
    fireEvent.click(screen.getByText('开始游戏'));
    const boxes = () => container.querySelectorAll('.t4-box');
    expect(boxes()[1].querySelectorAll('.t4-piece')).toHaveLength(0);
    press('c');
    expect(boxes()[1].querySelectorAll('.t4-piece').length).toBeGreaterThan(0);
    expect(screen.getByText('本方块已暂存')).toBeInTheDocument();
    // 同一方块不能再次暂存
    press('c');
    expect(screen.getByText('本方块已暂存')).toBeInTheDocument();
    // 硬降锁定后可以再次暂存
    press(' ');
    expect(screen.queryByText('本方块已暂存')).not.toBeInTheDocument();
  });

  test('自动下落: 到时间后方块下移一格', () => {
    jest.useFakeTimers();
    const { container } = render(<Tetris />);
    fireEvent.click(screen.getByText('开始游戏'));
    const rowsBefore = filled(container).map((k) => Number(k.split('-')[0]));
    act(() => { jest.advanceTimersByTime(900); });
    const rowsAfter = filled(container).map((k) => Number(k.split('-')[0]));
    expect(Math.min(...rowsAfter)).toBe(Math.min(...rowsBefore) + 1);
  });

  test('新游戏按钮重置分数与棋盘', () => {
    const { container } = render(<Tetris />);
    fireEvent.click(screen.getByText('开始游戏'));
    press(' ');
    expect(score()).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /重新开始/ }));
    expect(score()).toBe(0);
    expect(filled(container)).toHaveLength(4);
  });

  test('顶部堆满后游戏结束', () => {
    render(<Tetris />);
    fireEvent.click(screen.getByText('开始游戏'));
    for (let i = 0; i < 120; i += 1) press(' ');
    expect(screen.getAllByText('游戏结束').length).toBeGreaterThan(0);
  });

  test('全屏模式可以进入与退出', () => {
    const { container } = render(<Tetris />);
    fireEvent.click(screen.getByText('开始游戏'));
    fireEvent.click(screen.getByRole('button', { name: /全屏/ }));
    expect(screen.getByTestId('tetris-full')).toBeInTheDocument();
    // 全屏下棋盘仍然是 10×20
    expect(container.querySelectorAll('[data-testid="tetris-board"] [data-cell]')).toHaveLength(200);
    fireEvent.click(screen.getByRole('button', { name: /退出全屏/ }));
    expect(screen.queryByTestId('tetris-full')).not.toBeInTheDocument();
  });

  test('读取默认起始等级设置', () => {
    localStorage.setItem('magic-tools-tetris-defaults', JSON.stringify({ level: 5, ghost: false, grid: false }));
    const { container } = render(<Tetris />);
    expect(screen.getByText('等级')).toBeInTheDocument();
    expect(statText('等级')).toBe('等级5');
    // 关闭网格线后格子不再有网格样式
    expect(container.querySelectorAll('.t4-cell-grid')).toHaveLength(0);
  });
});
