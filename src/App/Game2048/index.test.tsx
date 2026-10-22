import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import Game2048 from './index';
import { DEFAULTS_STORAGE_KEY, STATE_STORAGE_KEY } from './data';

// app-context 依赖 App/index.tsx 的顶层 await + import.meta.glob (jest commonjs 不支持), 故打桩
jest.mock('../../hook/app-context', () => ({
  AppContext: require('react').createContext(null),
}));

/** 预置一局存档 (省去随机开局, 让移动 / 结算断言可复现) */
const seed = (board: number[][], score = 0, won = false) => {
  localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify({ size: board.length, board, score, won }));
};

const emptyRow = (n: number) => new Array<number>(n).fill(0);

const tiles = (container: HTMLElement) => Array.from(container.querySelectorAll('[data-tile]'))
  .map((el) => Number(el.getAttribute('data-tile')));

/** 取「分数」记分框的数值 (结构: 外层 div > label + value) */
const scoreText = (): string => screen.getByText('分数').parentElement?.textContent ?? '';

const press = (key: string) => fireEvent.keyDown(window, { key });

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => cleanup());

describe('2048 页面', () => {
  test('开局渲染 2 个方块且分数为 0', () => {
    const { container } = render(<Game2048 />);
    expect(tiles(container)).toHaveLength(2);
    expect(scoreText()).toBe('分数0');
    expect(screen.getByText('最高分')).toBeInTheDocument();
    expect(screen.getByTestId('game2048-board')).toBeInTheDocument();
  });

  test('方向键合并后按合并数字加分, 并生成一个新方块', () => {
    seed([ [ 2, 2, 0, 0 ], emptyRow(4), emptyRow(4), emptyRow(4) ]);
    const { container } = render(<Game2048 />);
    press('ArrowLeft');
    expect(scoreText()).toBe('分数4');
    // 合并出的 4 + 新生成的方块
    expect(tiles(container)).toHaveLength(2);
    expect(tiles(container)).toContain(4);
    expect(screen.getByText('第 1 步')).toBeInTheDocument();
  });

  test('WASD 同样可以移动', () => {
    seed([ [ 2, 0, 0, 0 ], [ 2, 0, 0, 0 ], emptyRow(4), emptyRow(4) ]);
    const { container } = render(<Game2048 />);
    fireEvent.keyDown(window, { key: 'w' });
    expect(scoreText()).toBe('分数4');
    expect(tiles(container)).toContain(4);
  });

  test('无效移动不记步也不加分', () => {
    seed([ [ 2, 4, 0, 0 ], emptyRow(4), emptyRow(4), emptyRow(4) ]);
    const { container } = render(<Game2048 />);
    press('ArrowLeft');
    expect(scoreText()).toBe('分数0');
    expect(tiles(container)).toHaveLength(2);
    expect(screen.queryByText('第 1 步')).not.toBeInTheDocument();
  });

  test('撤销回到上一步并清空步数', () => {
    seed([ [ 2, 2, 0, 0 ], emptyRow(4), emptyRow(4), emptyRow(4) ]);
    const { container } = render(<Game2048 />);
    press('ArrowLeft');
    expect(scoreText()).toBe('分数4');
    fireEvent.click(screen.getByRole('button', { name: /撤\s*销|撤销/ }));
    expect(scoreText()).toBe('分数0');
    expect(tiles(container)).toEqual([ 2, 2 ]);
    expect(screen.queryByText('第 1 步')).not.toBeInTheDocument();
  });

  test('新游戏清空棋盘并重置分数', () => {
    seed([ [ 2, 2, 0, 0 ], emptyRow(4), emptyRow(4), emptyRow(4) ], 40);
    const { container } = render(<Game2048 />);
    expect(scoreText()).toBe('分数40');
    fireEvent.click(screen.getByRole('button', { name: /新游戏|新\s*游\s*戏/ }));
    expect(scoreText()).toBe('分数0');
    expect(tiles(container)).toHaveLength(2);
  });

  test('切换棋盘尺寸会以新边长重开一局', () => {
    const { container } = render(<Game2048 />);
    fireEvent.click(screen.getByText('5×5'));
    // 5×5 棋盘共 25 个格子, 开局 2 个方块
    const board = screen.getByTestId('game2048-board');
    expect(board.children).toHaveLength(25);
    expect(tiles(container)).toHaveLength(2);
  });

  test('合成出目标数字后提示通关, 「继续挑战」后可继续移动', () => {
    seed([ [ 1024, 1024, 0, 0 ], emptyRow(4), emptyRow(4), emptyRow(4) ]);
    render(<Game2048 />);
    press('ArrowLeft');
    expect(screen.getByText('达成 2048!')).toBeInTheDocument();
    // 棋盘锁定: 再按方向键不会记步
    press('ArrowRight');
    expect(screen.queryByText('第 2 步')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /继续挑战|繼續挑戰/ }));
    expect(screen.queryByText('达成 2048!')).not.toBeInTheDocument();
    press('ArrowRight');
    expect(screen.getByText('第 2 步')).toBeInTheDocument();
  });

  test('棋盘满且无法合并时提示游戏结束', () => {
    seed([ [ 2, 4, 8, 16 ], [ 32, 64, 128, 256 ], [ 512, 1024, 2, 4 ], [ 8, 16, 32, 64 ] ]);
    render(<Game2048 />);
    expect(screen.getByText('游戏结束')).toBeInTheDocument();
    expect(screen.getByText('棋盘已满, 也再没有可以合并的方块了')).toBeInTheDocument();
  });

  test('触摸滑动可以移动方块', () => {
    seed([ [ 2, 0, 0, 0 ], [ 2, 0, 0, 0 ], emptyRow(4), emptyRow(4) ]);
    const { container } = render(<Game2048 />);
    const board = screen.getByTestId('game2048-board');
    fireEvent.touchStart(board, { touches: [ { clientX: 200, clientY: 200 } ] });
    fireEvent.touchEnd(board, { changedTouches: [ { clientX: 200, clientY: 100 } ] });
    expect(scoreText()).toBe('分数4');
    expect(tiles(container)).toContain(4);
  });

  test('移动后写入存档, 再次打开接着玩', () => {
    seed([ [ 2, 2, 0, 0 ], emptyRow(4), emptyRow(4), emptyRow(4) ], 0);
    const first = render(<Game2048 />);
    press('ArrowLeft');
    const saved = JSON.parse(localStorage.getItem(STATE_STORAGE_KEY) ?? '{}');
    expect(saved.score).toBe(4);
    first.unmount();

    const second = render(<Game2048 />);
    expect(scoreText()).toBe('分数4');
    expect(tiles(second.container)).toHaveLength(2);
  });

  test('默认设置决定开局棋盘边长', () => {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify({ size: 6, win: 4096, anim: false }));
    render(<Game2048 />);
    expect(screen.getByTestId('game2048-board').children).toHaveLength(36);
    expect(screen.getByText('目标 4096')).toBeInTheDocument();
  });

  test('可进入全屏 (原生全屏不可用时用窗口内全屏兜底) 并从全屏继续游玩', () => {
    seed([ [ 2, 2, 0, 0 ], emptyRow(4), emptyRow(4), emptyRow(4) ]);
    const { container } = render(<Game2048 />);

    fireEvent.click(screen.getByRole('button', { name: /全\s*屏/ }));
    const stage = screen.getByTestId('game2048-full');
    expect(stage).toBeInTheDocument();
    expect(stage.className).toContain('g2048-full');
    // 全屏下棋盘与记分都在, 且说明区隐藏
    expect(screen.getByTestId('game2048-board')).toBeInTheDocument();
    expect(screen.getByText('分数')).toBeInTheDocument();
    expect(screen.queryByText('2048 说明')).not.toBeInTheDocument();

    // 全屏中依旧可以操作
    press('ArrowLeft');
    expect(scoreText()).toBe('分数4');
    expect(tiles(container)).toContain(4);

    fireEvent.click(screen.getByRole('button', { name: /退出全\s*屏/ }));
    expect(screen.queryByTestId('game2048-full')).not.toBeInTheDocument();
    expect(screen.getByText('2048 说明')).toBeInTheDocument();
  });

  test('全屏下按 Esc 退出', () => {
    render(<Game2048 />);
    fireEvent.click(screen.getByRole('button', { name: /全\s*屏/ }));
    expect(screen.getByTestId('game2048-full')).toBeInTheDocument();
    press('Escape');
    expect(screen.queryByTestId('game2048-full')).not.toBeInTheDocument();
  });
});
