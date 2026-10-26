import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import FreeCell from './index';
import { dealFromSeed, type Card } from './lib';

// app-context 依赖 App/index.tsx 的顶层 await + import.meta.glob (jest commonjs 不支持), 故打桩
jest.mock('../../hook/app-context', () => ({
  AppContext: require('react').createContext(null),
}));

const press = (key: string) => fireEvent.keyDown(window, { key });

/** 棋盘上所有牌的唯一 id */
const cardIds = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-card]')).map((el) => el.getAttribute('data-card') as string);

/** 8 列各自的张数 */
const columnCounts = (container: HTMLElement) =>
  Array.from({ length: 8 }, (_, i) =>
    Number(container.querySelector(`[data-testid="tableau-${i}"]`)?.getAttribute('data-count')));

const freeEmpty = (container: HTMLElement, i: number) =>
  container.querySelector(`[data-testid="free-${i}"]`)?.getAttribute('data-empty') === '1';

const freeCard = (container: HTMLElement, i: number) =>
  container.querySelector(`[data-testid="free-${i}"] [data-card]`)?.getAttribute('data-card') ?? null;

const foundationCount = (container: HTMLElement, suit: string) =>
  Number(container.querySelector(`[data-testid="foundation-${suit}"]`)?.getAttribute('data-count'));

const stat = (testId: string) => Number(screen.getByTestId(testId).textContent);

/** 「已收牌」显示为 "n/52", 只取前一个数字 */
const collected = () => Number((screen.getByTestId('stat-collected').textContent ?? '').split('/')[0]);

/** 某列的顶牌 (data-card 元素) */
const topCardEl = (container: HTMLElement, col: number): HTMLElement | null => {
  const pile = container.querySelectorAll(`[data-testid="tableau-${col}"] [data-card]`);
  return (pile[pile.length - 1] as HTMLElement | undefined) ?? null;
};

const seedInput = () => screen.getByRole('spinbutton') as HTMLInputElement;

/** 找出一个「某列顶牌是 A」的局号 (确定性发牌, 便于断言双击上收) */
const seedWithTopAce = (): { seed: number; card: Card } => {
  for (let seed = 1; seed < 5000; seed += 1) {
    const s = dealFromSeed(seed);
    for (const pile of s.tableau) {
      const top = pile[pile.length - 1];
      if (top.rank === 1) return { seed, card: top };
    }
  }
  throw new Error('no seed with a top ace found');
};

const useSeed = (seed: number) => localStorage.setItem('magic-tools-freecell-seed', String(seed));

/** jsdom 没有实现 elementFromPoint, 这里手动指定拖拽落点 */
const dropOn = (el: Element | null) => {
  (document as unknown as { elementFromPoint: () => Element | null }).elementFromPoint = () => el;
};

/** 模拟一次指针拖拽: 按下 -> 移动 (超过阀值) -> 松手 */
/**
 * jsdom 没有 PointerEvent, fireEvent.pointerDown 拿不到 clientX/clientY,
 * 这里用带坐标的 MouseEvent 冒充 pointer 事件, 才能真正测到拖拽阈值与幽灵牌位置
 */
const pointer = (
  target: Element | Window,
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  x: number,
  y: number
) =>
  fireEvent(
    target,
    new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 })
  );

const drag = (fromEl: HTMLElement, target: Element | null) => {
  pointer(fromEl, 'pointerdown', 20, 20);
  dropOn(target);
  pointer(window, 'pointermove', 80, 90);
  pointer(window, 'pointerup', 80, 90);
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  delete (document as unknown as { elementFromPoint?: () => Element | null }).elementFromPoint;
});

describe('空档接龙页面', () => {
  test('初始渲染 52 张牌, 8 列分别为 7/7/7/7/6/6/6/6, 4 自由格与 4 收集区全空', () => {
    const { container } = render(<FreeCell />);
    expect(cardIds(container)).toHaveLength(52);
    expect(new Set(cardIds(container)).size).toBe(52);
    expect(columnCounts(container)).toEqual([ 7, 7, 7, 7, 6, 6, 6, 6 ]);
    for (let i = 0; i < 4; i += 1) expect(freeEmpty(container, i)).toBe(true);
    for (const suit of [ 'S', 'H', 'D', 'C' ]) expect(foundationCount(container, suit)).toBe(0);
    expect(stat('stat-moves')).toBe(0);
    expect(collected()).toBe(0);
    expect(screen.getByTestId('stat-time')).toHaveTextContent('00:00');
    expect(screen.getAllByText('用时').length).toBeGreaterThan(0);
    expect(screen.getAllByText('步数').length).toBeGreaterThan(0);
  });

  test('局号输入框显示上次局号 (默认 617)', () => {
    render(<FreeCell />);
    expect(seedInput().value).toBe('617');
    useSeed(2001);
    cleanup();
    render(<FreeCell />);
    expect(seedInput().value).toBe('2001');
  });

  test('点击顶牌会选中它', () => {
    const { container } = render(<FreeCell />);
    const top = topCardEl(container, 0);
    expect(top).not.toBeNull();
    fireEvent.click(top!);
    expect(topCardEl(container, 0)).toHaveAttribute('data-selected', '1');
    // 再点一次取消选中
    fireEvent.click(topCardEl(container, 0)!);
    expect(topCardEl(container, 0)).toHaveAttribute('data-selected', '0');
  });

  test('把顶牌挪进空自由格: 步数 +1, 自由格不再为空', () => {
    const { container } = render(<FreeCell />);
    fireEvent.click(topCardEl(container, 0)!);
    fireEvent.click(container.querySelector('[data-testid="free-0"]')!);
    expect(freeEmpty(container, 0)).toBe(false);
    expect(stat('stat-moves')).toBe(1);
    expect(columnCounts(container)[0]).toBe(6);
    expect(cardIds(container)).toHaveLength(52);
  });

  test('撤销可以恢复上一步', () => {
    const { container } = render(<FreeCell />);
    fireEvent.click(topCardEl(container, 0)!);
    fireEvent.click(container.querySelector('[data-testid="free-0"]')!);
    expect(stat('stat-moves')).toBe(1);
    fireEvent.click(screen.getByText('撤销 (Z)'));
    expect(freeEmpty(container, 0)).toBe(true);
    expect(stat('stat-moves')).toBe(0);
    expect(columnCounts(container)[0]).toBe(7);
  });

  test('键盘 Z 也能撤销', () => {
    const { container } = render(<FreeCell />);
    fireEvent.click(topCardEl(container, 0)!);
    fireEvent.click(container.querySelector('[data-testid="free-0"]')!);
    press('z');
    expect(freeEmpty(container, 0)).toBe(true);
  });

  test('双击 A 自动送进收集区', () => {
    const { seed, card } = seedWithTopAce();
    useSeed(seed);
    const { container } = render(<FreeCell />);
    fireEvent.doubleClick(screen.getByTestId(`card-${card.suit}${card.rank}`));
    // 自动收牌可能顺带把后面露出来的安全牌也收掉, 故只校验下限
    expect(foundationCount(container, card.suit)).toBeGreaterThanOrEqual(1);
    expect(stat('stat-moves')).toBe(1);
    expect(collected()).toBeGreaterThanOrEqual(1);
  });

  test('设置关闭「双击自动移牌」后双击不动牌', () => {
    localStorage.setItem(
      'magic-tools-freecell-defaults',
      JSON.stringify({ autoCollect: true, superMove: true, doubleClick: false })
    );
    const { seed, card } = seedWithTopAce();
    useSeed(seed);
    const { container } = render(<FreeCell />);
    fireEvent.doubleClick(screen.getByTestId(`card-${card.suit}${card.rank}`));
    expect(foundationCount(container, card.suit)).toBe(0);
    expect(stat('stat-moves')).toBe(0);
  });

  test('提示按钮会高亮一处可行的移动', () => {
    const { container } = render(<FreeCell />);
    fireEvent.click(screen.getByText('提示 (H)'));
    expect(container.querySelectorAll('.fc-card.is-hint').length).toBeGreaterThan(0);
  });

  test('自动收牌按钮把安全牌送上收集区 (不计步数)', () => {
    const { seed, card } = seedWithTopAce();
    useSeed(seed);
    const { container } = render(<FreeCell />);
    fireEvent.click(screen.getByText('自动收牌 (A)'));
    expect(foundationCount(container, card.suit)).toBeGreaterThanOrEqual(1);
    expect(stat('stat-moves')).toBe(0);
    expect(collected()).toBeGreaterThanOrEqual(1);
  });

  test('改局号后点发牌会换成另一局, 牌数仍是 52', () => {
    const { container } = render(<FreeCell />);
    const before = cardIds(container).join(',');
    fireEvent.change(seedInput(), { target: { value: '1234' } });
    fireEvent.click(screen.getByText('发牌'));
    expect(seedInput().value).toBe('1234');
    expect(cardIds(container)).toHaveLength(52);
    expect(cardIds(container).join(',')).not.toBe(before);
    expect(localStorage.getItem('magic-tools-freecell-seed')).toBe('1234');
  });

  test('新局使用随机局号 (N 键同效)', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    render(<FreeCell />);
    fireEvent.click(screen.getByText('新局 (N)'));
    expect(seedInput().value).toBe('500001');
    press('n');
    expect(seedInput().value).toBe('500001');
  });

  test('全屏模式只保留牌桌, Esc / 按钮可退出', () => {
    const { container } = render(<FreeCell />);
    fireEvent.click(screen.getByText('全屏'));
    expect(screen.getByTestId('freecell-full')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-card]')).toHaveLength(52);
    fireEvent.click(screen.getByText('退出全屏'));
    expect(screen.queryByTestId('freecell-full')).not.toBeInTheDocument();
    expect(screen.getByTestId('freecell-top')).toBeInTheDocument();
    fireEvent.click(screen.getByText('全屏'));
    press('Escape');
    expect(screen.queryByTestId('freecell-full')).not.toBeInTheDocument();
  });

  test('拖起来又放回原处时按点击处理, 不会吞掉选中', () => {
    const { container } = render(<FreeCell />);
    const from = topCardEl(container, 0)!;
    pointer(from, 'pointerdown', 20, 20);
    pointer(window, 'pointermove', 90, 100);
    expect(screen.getByTestId('freecell-drag')).toBeInTheDocument();
    pointer(window, 'pointerup', 90, 100);
    expect(screen.queryByTestId('freecell-drag')).not.toBeInTheDocument();
    expect(stat('stat-moves')).toBe(0);
    // 松手后浏览器补发的 click 必须还能选中
    fireEvent.click(from);
    expect(from.getAttribute('data-selected')).toBe('1');
  });

  test('窗口失焦 (拖到窗口外松手) 会放弃拖拽, 不会卡住后续点击', () => {
    const { container } = render(<FreeCell />);
    const from = topCardEl(container, 0)!;
    pointer(from, 'pointerdown', 20, 20);
    pointer(window, 'pointermove', 90, 100);
    expect(screen.getByTestId('freecell-drag')).toBeInTheDocument();
    fireEvent.blur(window);
    expect(screen.queryByTestId('freecell-drag')).not.toBeInTheDocument();
    expect(stat('stat-moves')).toBe(0);
    fireEvent.click(from);
    expect(from.getAttribute('data-selected')).toBe('1');
  });

  test('全屏时工具条 (局号 / 发牌 / 新局 / 撤销 ...) 在最上方', () => {
    const { container } = render(<FreeCell />);
    fireEvent.click(screen.getByText('全屏'));
    const stage = screen.getByTestId('freecell-full');
    const bar = screen.getByTestId('freecell-toolbar');
    expect(stage.firstElementChild).toBe(bar);
    [ '发牌', '新局 (N)', '重开本局 (R)', '撤销 (Z)', '提示 (H)', '自动收牌 (A)', '退出全屏' ]
      .forEach((label) => {
        expect(bar.textContent).toContain(label);
      });
    expect(bar.querySelector('[data-testid="freecell-seed"]')).toBeTruthy();
    const board = screen.getByTestId('freecell-tableau');
    expect(bar.compareDocumentPosition(board) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelectorAll('[data-card]')).toHaveLength(52);
  });

  test('拖拽顶牌到空自由格可以直接落位', () => {
    const { container } = render(<FreeCell />);
    const from = topCardEl(container, 0)!;
    const target = container.querySelector('[data-testid="free-0"]')!;
    drag(from, target);
    expect(freeEmpty(container, 0)).toBe(false);
    expect(freeCard(container, 0)).toBe(from.getAttribute('data-card'));
    expect(stat('stat-moves')).toBe(1);
    // 拖拽结束后不应再触发选中
    expect(container.querySelectorAll('[data-selected="1"]')).toHaveLength(0);
  });

  test('拖拽时显示跟随指针的幽灵牌, 松手后消失', () => {
    const { container } = render(<FreeCell />);
    const from = topCardEl(container, 0)!;
    pointer(from, 'pointerdown', 20, 20);
    dropOn(container.querySelector('[data-testid="free-1"]'));
    pointer(window, 'pointermove', 80, 90);
    const ghost = screen.getByTestId('freecell-drag');
    expect(ghost).toBeInTheDocument();
    // 源牌变暗, 悬停的落点高亮
    expect(container.querySelectorAll('.fc-card.is-dragging')).toHaveLength(1);
    expect(container.querySelector('[data-testid="free-1"]')).toHaveClass('is-drop');
    pointer(window, 'pointerup', 80, 90);
    expect(screen.queryByTestId('freecell-drag')).not.toBeInTheDocument();
    expect(freeEmpty(container, 1)).toBe(false);
  });

  test('拖到已占用的自由格 (非法目标) 不会动牌', () => {
    const { container } = render(<FreeCell />);
    // 先合法地把第 0 列顶牌放进 free-0
    drag(topCardEl(container, 0)!, container.querySelector('[data-testid="free-0"]'));
    expect(stat('stat-moves')).toBe(1);
    // 再把第 1 列顶牌拖到已占用的 free-0
    drag(topCardEl(container, 1)!, container.querySelector('[data-testid="free-0"]'));
    expect(stat('stat-moves')).toBe(1);
    expect(columnCounts(container)[1]).toBe(7);
  });

  test('拖拽中途取消 (pointercancel) 不会动牌', () => {
    const { container } = render(<FreeCell />);
    const from = topCardEl(container, 0)!;
    pointer(from, 'pointerdown', 20, 20);
    dropOn(container.querySelector('[data-testid="free-2"]'));
    pointer(window, 'pointermove', 80, 90);
    pointer(window, 'pointercancel', 80, 90);
    expect(stat('stat-moves')).toBe(0);
    expect(freeEmpty(container, 2)).toBe(true);
    expect(screen.queryByTestId('freecell-drag')).not.toBeInTheDocument();
  });

  test('小幅度移动仍算点击 (不会误拖)', () => {
    const { container } = render(<FreeCell />);
    const from = topCardEl(container, 0)!;
    pointer(from, 'pointerdown', 20, 20);
    pointer(window, 'pointermove', 22, 21);
    pointer(window, 'pointerup', 22, 21);
    expect(screen.queryByTestId('freecell-drag')).not.toBeInTheDocument();
    expect(stat('stat-moves')).toBe(0);
    expect(columnCounts(container)[0]).toBe(7);
  });

  test('每次拖拽只记一步, 且可撤销', () => {
    const { container } = render(<FreeCell />);
    drag(topCardEl(container, 0)!, container.querySelector('[data-testid="free-3"]'));
    expect(stat('stat-moves')).toBe(1);
    fireEvent.click(screen.getByText('撤销 (Z)'));
    expect(stat('stat-moves')).toBe(0);
    expect(freeEmpty(container, 3)).toBe(true);
  });

  test('说明区展示玩法要点', () => {
    render(<FreeCell />);
    expect(screen.getByText('空档接龙说明')).toBeInTheDocument();
    expect(screen.getByText('这个工具做什么')).toBeInTheDocument();
  });
});
