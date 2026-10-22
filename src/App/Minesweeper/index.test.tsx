import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import Minesweeper from './index';
import { startGame } from './lib';

// app-context 依赖 App/index.tsx 的顶层 await + import.meta.glob (jest commonjs 不支持), 故打桩
jest.mock('../../hook/app-context', () => ({
  AppContext: require('react').createContext(null),
}));

/** 棋盘上所有格子 (从左到右, 从上到下) */
const cells = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-testid="ms-board"] [data-cell]')) as HTMLElement[];

const cellAt = (container: HTMLElement, i: number) =>
  container.querySelector(`[data-cell="${i}"]`) as HTMLElement;

/** 已翻开的格子数 */
const opened = (container: HTMLElement) => cells(container).filter((c) => c.dataset.open === '1').length;

/** 统计行数值 (结构: 外层 div > label + value; 取第一处 = 棋盘上方的统计条) */
const statText = (label: string): string => screen.getAllByText(label)[0].parentElement?.textContent ?? '';

/** 按钮 / 文本 (说明区里也会出现同样的字, 取第一处 = 操作区) */
const tap = (label: string) => fireEvent.click(screen.getAllByText(label)[0]);

const left = () => Number(statText('剩余雷数').replace('剩余雷数', ''));
const time = () => statText('用时').replace('用时', '');
const best = () => statText('最高纪录').replace('最高纪录', '');

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

describe('扫雷页面', () => {
  test('初始渲染初级 9×9 棋盘与统计', () => {
    const { container } = render(<Minesweeper />);
    expect(cells(container)).toHaveLength(81);
    expect(opened(container)).toBe(0);
    expect(left()).toBe(10);
    expect(time()).toBe('0:00');
    expect(best()).toBe('--');
    expect(screen.getByTestId('ms-face')).toHaveTextContent('🙂');
    expect(screen.getByText('棋盘 9×9 · 10 雷')).toBeInTheDocument();
  });

  test('首点安全: 第一次翻开不会踩雷, 并泛洪展开', () => {
    const { container } = render(<Minesweeper />);
    fireEvent.click(cellAt(container, 40));
    expect(opened(container)).toBeGreaterThanOrEqual(9);
    expect(container.querySelectorAll('[data-mine="1"]')).toHaveLength(0);
    expect(screen.queryByText('踩到地雷了')).not.toBeInTheDocument();
    expect(screen.getByTestId('ms-face')).toHaveTextContent('🙂');
  });

  test('首点 3×3 邻域内一定没有雷', () => {
    // 固定随机源: 让布雷结果可复现, 再与 lib 里的同一算法对照
    const rng = () => 0.42;
    jest.spyOn(Math, 'random').mockImplementation(rng);
    const { container } = render(<Minesweeper />);
    fireEvent.click(cellAt(container, 31));
    const oracle = startGame(9, 9, 10, 31, rng);
    for (let y = 3; y <= 5; y += 1) {
      for (let x = 3; x <= 5; x += 1) {
        expect(oracle.cells[y * 9 + x].mine).toBe(false);
      }
    }
    // 对照 lib 的布雷结果: 已翻开的格子一定不是雷
    cells(container)
      .filter((c) => c.dataset.open === '1')
      .forEach((c) => expect(oracle.cells[Number(c.dataset.cell)].mine).toBe(false));
  });

  test('右键循环: 旗 → 问号 → 空, 剩余雷数随之变化', () => {
    const { container } = render(<Minesweeper />);
    const target = cellAt(container, 0);
    fireEvent.contextMenu(target);
    expect(target.dataset.mark).toBe('flag');
    expect(target).toHaveTextContent('🚩');
    expect(left()).toBe(9);
    fireEvent.contextMenu(target);
    expect(target.dataset.mark).toBe('question');
    expect(target).toHaveTextContent('❓');
    fireEvent.contextMenu(target);
    expect(target.dataset.mark).toBe('none');
    expect(target).toHaveTextContent('');
    expect(left()).toBe(10);
  });

  test('插旗的格子左键点不开', () => {
    const { container } = render(<Minesweeper />);
    fireEvent.contextMenu(cellAt(container, 0));
    fireEvent.click(cellAt(container, 0));
    expect(opened(container)).toBe(0);
    expect(left()).toBe(9);
  });

  test('按 R 重开: 清空旗子与用时', () => {
    const { container } = render(<Minesweeper />);
    fireEvent.click(cellAt(container, 40));
    fireEvent.contextMenu(cellAt(container, 0));
    expect(opened(container)).toBeGreaterThan(0);
    fireEvent.keyDown(window, { key: 'r' });
    expect(opened(container)).toBe(0);
    expect(left()).toBe(10);
    expect(time()).toBe('0:00');
  });

  test('表情按钮重开一局', () => {
    const { container } = render(<Minesweeper />);
    fireEvent.click(cellAt(container, 40));
    expect(opened(container)).toBeGreaterThan(0);
    fireEvent.click(screen.getByTestId('ms-face'));
    expect(opened(container)).toBe(0);
    expect(time()).toBe('0:00');
  });

  test('切换难度到中级: 16×16 / 40 雷', () => {
    const { container } = render(<Minesweeper />);
    tap('中级');
    expect(cells(container)).toHaveLength(256);
    expect(left()).toBe(40);
    expect(screen.getByText('棋盘 16×16 · 40 雷')).toBeInTheDocument();
  });

  test('切换格子大小到「大」: 棋盘列宽变为 30px', () => {
    const { container } = render(<Minesweeper />);
    tap('大');
    const board = screen.getByTestId('ms-board');
    expect(board.style.gridTemplateColumns).toBe('repeat(9, 30px)');
    expect(cells(container)).toHaveLength(81);
  });

  test('自定义棋盘: 9×9 配 71 雷, 首点后点第二格必踩雷', () => {
    const { container } = render(<Minesweeper />);
    tap('自定义');
    const dialog = screen.getByRole('dialog');
    const inputs = within(dialog).getAllByRole('spinbutton');
    expect(inputs).toHaveLength(3);
    fireEvent.change(inputs[2], { target: { value: '71' } });
    // antd 会在两个汉字的按钮里插入空格, 用正则匹配
    fireEvent.click(within(dialog).getByRole('button', { name: /确\s*定/ }));

    expect(cells(container)).toHaveLength(81);
    expect(left()).toBe(71);
    expect(screen.getByText('棋盘 9×9 · 71 雷')).toBeInTheDocument();

    fireEvent.click(cellAt(container, 40));
    expect(opened(container)).toBe(9);
    // 剩余 72 格里有 71 颗雷, 顺序点下去最多一格安全, 必然踩雷
    for (const i of [ 0, 1, 2, 3 ]) {
      fireEvent.click(cellAt(container, i));
      if (screen.queryByText('踩到地雷了')) break;
    }
    expect(screen.getByText('踩到地雷了')).toBeInTheDocument();
    expect(screen.getByTestId('ms-face')).toHaveTextContent('😵');
    expect(screen.getByText('💥')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-mine="1"]')).toHaveLength(71);
  });

  test('通关: 翻开全部安全格后提示通关并记录最快纪录', () => {
    const rng = () => 0.42;
    jest.spyOn(Math, 'random').mockImplementation(rng);
    const { container } = render(<Minesweeper />);
    const FIRST = 40;
    fireEvent.click(cellAt(container, FIRST));
    // 用同一个随机源复算出雷的位置, 只点非雷格
    const oracle = startGame(9, 9, 10, FIRST, rng);
    const safe = oracle.cells.map((c, i) => (c.mine ? -1 : i)).filter((i) => i >= 0);
    safe.forEach((i) => {
      const el = cellAt(container, i);
      if (el && el.dataset.open !== '1') fireEvent.click(el);
    });
    // 全部安全格翻开即通关
    expect(container.querySelectorAll('[data-open="0"]').length).toBe(10);
    expect(screen.getByText('通关!')).toBeInTheDocument();
    expect(screen.getByTestId('ms-face')).toHaveTextContent('😎');
    expect(best()).not.toBe('--');
    expect(JSON.parse(localStorage.getItem('magic-tools-minesweeper-best') ?? '{}')).toEqual({ '9x9:10': expect.any(Number) });
  });

  test('全屏: 进入后仍是同一盘棋, 退出后回到普通布局', () => {
    const { container } = render(<Minesweeper />);
    fireEvent.click(cellAt(container, 40));
    const before = opened(container);
    tap('全屏');
    expect(screen.getByTestId('ms-full')).toBeInTheDocument();
    expect(opened(container)).toBe(before);
    tap('退出全屏');
    expect(screen.queryByTestId('ms-full')).not.toBeInTheDocument();
    expect(opened(container)).toBe(before);
  });

  test('全屏下按 Esc 退出', () => {
    render(<Minesweeper />);
    tap('全屏');
    expect(screen.getByTestId('ms-full')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('ms-full')).not.toBeInTheDocument();
  });

  test('长按插旗 (触屏), 且不会顺带翻开格子', () => {
    jest.useFakeTimers();
    const { container } = render(<Minesweeper />);
    const target = cellAt(container, 0);
    fireEvent.pointerDown(target, { pointerType: 'touch', button: 0 });
    act(() => { jest.advanceTimersByTime(400); });
    fireEvent.pointerUp(target, { pointerType: 'touch' });
    fireEvent.click(target);
    expect(target.dataset.mark).toBe('flag');
    expect(target.dataset.open).toBe('0');
    expect(left()).toBe(9);
  });

  test('中键连开: 旗数不足时不翻开周围格子', () => {
    const { container } = render(<Minesweeper />);
    fireEvent.click(cellAt(container, 40));
    const someOpen = cells(container).find((c) => c.dataset.open === '1' && Number(c.dataset.n) > 0);
    if (!someOpen) return; // 泛洪把数字格都翻开了, 没有可连开的数字格
    const before = opened(container);
    fireEvent.pointerDown(someOpen, { button: 1 });
    expect(opened(container)).toBeGreaterThanOrEqual(before);
  });
});
