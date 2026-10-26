import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import SpiderSolitaire from './index';
import {
  DEFAULT_OPTIONS, dealFromSeed, dealStock, findHint, runFrom, type Card, type GameState, type Move,
} from './lib';
import { INITIAL_COUNTS, type Difficulty } from './data';

// app-context 依赖 App/index.tsx 的顶层 await + import.meta.glob (jest commonjs 不支持), 故打桩
jest.mock('../../hook/app-context', () => ({
  AppContext: require('react').createContext(null),
}));

const SEED_KEY = 'magic-tools-spider-seed';
const DEFAULTS_KEY = 'magic-tools-spider-defaults';

const press = (key: string) => fireEvent.keyDown(window, { key });

/** 牌桌上一共渲染多少张牌 (牌堆只渲染一张牌背, 不计入) */
const TABLEAU_CARDS = 54;

/** 棋盘上所有牌的唯一 id */
const cardIds = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-card]')).map((el) => el.getAttribute('data-card') as string);

/** 10 列各自的张数 */
const columnCounts = (container: HTMLElement) =>
  Array.from({ length: 10 }, (_, i) =>
    Number(container.querySelector(`[data-testid="tableau-${i}"]`)?.getAttribute('data-count')));

const colEl = (container: HTMLElement, col: number) =>
  container.querySelector(`[data-testid="tableau-${col}"]`) as HTMLElement;

const stockCount = (container: HTMLElement) =>
  Number(container.querySelector('[data-testid="spider-stock"]')?.getAttribute('data-count'));

const filledDone = (container: HTMLElement) =>
  Array.from({ length: 8 }, (_, i) =>
    container.querySelector(`[data-testid="done-${i}"]`)?.getAttribute('data-filled')).filter((v) => v === '1').length;

const stat = (testId: string) => Number(screen.getByTestId(testId).textContent);

/** 「已收牌」显示为 "n/8", 只取前一个数字 */
const collected = () => Number((screen.getByTestId('stat-collected').textContent ?? '').split('/')[0]);

const seedInput = () => screen.getByRole('spinbutton') as HTMLInputElement;

/** 某张牌对应的 DOM 元素 */
const cardEl = (container: HTMLElement, card: Card) =>
  container.querySelector(`[data-card="c${card.uid}"]`) as HTMLElement;

/** 找出一个开局就有合法走法的局号 */
const seedWithMove = (
  suits: Difficulty = 1
): { seed: number; state: GameState; move: Move } => {
  for (let seed = 1; seed < 500; seed += 1) {
    const state = dealFromSeed(seed, suits);
    const hint = findHint(state, DEFAULT_OPTIONS, false);
    if (hint && 'from' in hint) return { seed, state, move: hint };
  }
  throw new Error('no seed with a legal move found');
};

const useSeed = (seed: number) => localStorage.setItem(SEED_KEY, String(seed));

/** jsdom 没有实现 elementFromPoint, 这里手动指定拖拽落点 */
const dropOn = (el: Element | null) => {
  (document as unknown as { elementFromPoint: () => Element | null }).elementFromPoint = () => el;
};

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

/** 模拟一次指针拖拽: 按下 -> 移动 (超过阀值) -> 松手 */
const drag = (fromEl: HTMLElement, target: Element | null) => {
  pointer(fromEl, 'pointerdown', 20, 20);
  dropOn(target);
  pointer(window, 'pointermove', 80, 90);
  pointer(window, 'pointerup', 80, 90);
};

/** 发一轮牌 (拿不到就抛错, 简化用例里的类型收敛) */
const dealRow = (st: GameState): GameState => {
  const res = dealStock(st, DEFAULT_OPTIONS);
  if (!res.ok) throw new Error(`deal failed: ${res.reason}`);
  return res.state;
};

/** 重算发过 deals 轮之后的牌局 (给连牌高亮的用例用) */
const dealStockRows = (seed: number, deals: number): Card[][] => {
  let st = dealFromSeed(seed, 1);
  for (let i = 0; i < deals; i += 1) st = dealRow(st);
  return st.tableau;
};

/** 一段连牌里最下面那张 (拖拽从这里按下) */
const runHead = (state: GameState, move: Move): Card => {
  const pile = state.tableau[move.from];
  return pile[pile.length - move.count];
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  delete (document as unknown as { elementFromPoint?: () => Element | null }).elementFromPoint;
});

describe('蜘蛛纸牌页面', () => {
  test('初始渲染 54 张牌桌牌, 10 列分别为 6/6/6/6/5/5/5/5/5/5, 牌堆 50 张', () => {
    const { container } = render(<SpiderSolitaire />);
    expect(cardIds(container)).toHaveLength(TABLEAU_CARDS);
    expect(new Set(cardIds(container)).size).toBe(TABLEAU_CARDS);
    expect(columnCounts(container)).toEqual([ 6, 6, 6, 6, 5, 5, 5, 5, 5, 5 ]);
    expect(stockCount(container)).toBe(50);
    expect(filledDone(container)).toBe(0);
    expect(stat('stat-moves')).toBe(0);
    expect(collected()).toBe(0);
    expect(screen.getByTestId('stat-time')).toHaveTextContent('00:00');
    expect(screen.getAllByText('用时').length).toBeGreaterThan(0);
    expect(screen.getAllByText('步数').length).toBeGreaterThan(0);
  });

  test('每列只有顶牌是明牌', () => {
    const { container } = render(<SpiderSolitaire />);
    for (let col = 0; col < 10; col += 1) {
      const up = Number(colEl(container, col).getAttribute('data-up'));
      expect(up).toBe(1);
    }
  });

  test('局号输入框显示上次局号 (默认 2026)', () => {
    render(<SpiderSolitaire />);
    expect(seedInput().value).toBe('2026');
    useSeed(1234);
    cleanup();
    render(<SpiderSolitaire />);
    expect(seedInput().value).toBe('1234');
  });

  test('相同局号 + 相同难度发出相同牌局', () => {
    useSeed(555);
    const first = render(<SpiderSolitaire />);
    const before = cardIds(first.container).join(',');
    first.unmount();
    const second = render(<SpiderSolitaire />);
    expect(cardIds(second.container).join(',')).toBe(before);
  });

  test('设置里的默认难度是四花色时, 牌桌上有四种花色', () => {
    localStorage.setItem(DEFAULTS_KEY, JSON.stringify({ suits: 4 }));
    const { container } = render(<SpiderSolitaire />);
    const suits = new Set(Array.from(container.querySelectorAll('[data-suit]')).map((el) => el.getAttribute('data-suit')));
    expect(suits).toEqual(new Set([ 'S', 'H', 'D', 'C' ]));
    expect(columnCounts(container)).toEqual([ 6, 6, 6, 6, 5, 5, 5, 5, 5, 5 ]);
  });

  test('点击顶牌会选中它, 再点一次取消', () => {
    const { container } = render(<SpiderSolitaire />);
    const top = colEl(container, 0).querySelector('[data-up="1"]') as HTMLElement;
    fireEvent.click(top);
    expect(container.querySelectorAll('[data-selected="1"]').length).toBeGreaterThan(0);
    fireEvent.click(colEl(container, 0).querySelector('[data-up="1"]') as HTMLElement);
    expect(container.querySelectorAll('[data-selected="1"]')).toHaveLength(0);
  });

  test('选中顶牌后点击目标列即可移动, 步数 +1', () => {
    const { seed, state, move } = seedWithMove();
    useSeed(seed);
    const { container } = render(<SpiderSolitaire />);
    fireEvent.click(cardEl(container, runHead(state, move)));
    fireEvent.click(colEl(container, move.to));
    expect(stat('stat-moves')).toBe(1);
    expect(columnCounts(container)[move.from]).toBe(state.tableau[move.from].length - move.count);
    expect(columnCounts(container)[move.to]).toBe(state.tableau[move.to].length + move.count);
    expect(cardIds(container)).toHaveLength(TABLEAU_CARDS);
  });

  test('双击一张牌会自动移到能接住它的列', () => {
    const { seed } = seedWithMove();
    useSeed(seed);
    const { container } = render(<SpiderSolitaire />);
    // 找一张双击后确实能走的牌 (试前几张, 保证有落点)
    let moved = false;
    for (const el of Array.from(container.querySelectorAll('[data-up="1"]')) as HTMLElement[]) {
      fireEvent.doubleClick(el);
      if (stat('stat-moves') > 0) {
        moved = true;
        break;
      }
    }
    expect(moved).toBe(true);
    expect(cardIds(container)).toHaveLength(TABLEAU_CARDS);
  });

  test('撤销可以恢复上一步 (Z 键同效)', () => {
    const { seed, state, move } = seedWithMove();
    useSeed(seed);
    const { container } = render(<SpiderSolitaire />);
    fireEvent.click(cardEl(container, runHead(state, move)));
    fireEvent.click(colEl(container, move.to));
    expect(stat('stat-moves')).toBe(1);
    fireEvent.click(screen.getByText('撤销 (Z)'));
    expect(stat('stat-moves')).toBe(0);
    expect(columnCounts(container)).toEqual([ 6, 6, 6, 6, 5, 5, 5, 5, 5, 5 ]);

    // 键盘 Z 也能撤销
    fireEvent.click(cardEl(container, runHead(state, move)));
    fireEvent.click(colEl(container, move.to));
    expect(stat('stat-moves')).toBe(1);
    press('z');
    expect(stat('stat-moves')).toBe(0);
  });

  test('提示按钮会高亮一处可行的移动', () => {
    const { seed } = seedWithMove();
    useSeed(seed);
    const { container } = render(<SpiderSolitaire />);
    fireEvent.click(screen.getByText('提示 (H)'));
    expect(container.querySelectorAll('.sp-card.is-hint').length).toBeGreaterThan(0);
  });

  test('发一轮牌: 每列各补 1 张, 牌堆少 10 张, 不计步数', () => {
    const { container } = render(<SpiderSolitaire />);
    fireEvent.click(screen.getByText('发一轮牌 (D)'));
    expect(stockCount(container)).toBe(40);
    expect(columnCounts(container)).toEqual([ 7, 7, 7, 7, 6, 6, 6, 6, 6, 6 ]);
    expect(stat('stat-moves')).toBe(0);
    expect(cardIds(container)).toHaveLength(TABLEAU_CARDS + 10);
    // 键盘 D 同效
    press('d');
    expect(stockCount(container)).toBe(30);
  });

  test('发牌有动画: 初始 54 张 + 每轮新发的 10 张带 data-deal, 动画结束后自动清除', async () => {
    const { container } = render(<SpiderSolitaire />);
    const dealing = () => Array.from(container.querySelectorAll('[data-deal]')) as HTMLElement[];
    // 初始发牌: 牌桌上每张牌都带动画标记, 顺序 0 .. 53
    expect(dealing()).toHaveLength(TABLEAU_CARDS);
    const orders = dealing()
      .map((el) => Number(el.style.getPropertyValue('--sp-order')))
      .sort((a, b) => a - b);
    expect(orders[0]).toBe(0);
    expect(orders[orders.length - 1]).toBe(TABLEAU_CARDS - 1);
    // 动画结束后标记自动清掉 (之后移动牌不会重播)
    await waitFor(() => expect(dealing()).toHaveLength(0), { timeout: 6000 });

    // 发一轮牌: 只有新发的 10 张带动画标记, 顺序互不相同
    fireEvent.click(screen.getByText('发一轮牌 (D)'));
    expect(dealing()).toHaveLength(10);
    expect(new Set(dealing().map((el) => el.style.getPropertyValue('--sp-order'))).size).toBe(10);
    await waitFor(() => expect(dealing()).toHaveLength(0), { timeout: 6000 });
    expect(columnCounts(container)).toEqual([ 7, 7, 7, 7, 6, 6, 6, 6, 6, 6 ]);
  });

  test('新局会重新播放发牌动画', () => {
    const { container } = render(<SpiderSolitaire />);
    fireEvent.click(screen.getByText('新局 (N)'));
    expect(container.querySelectorAll('[data-deal]')).toHaveLength(TABLEAU_CARDS);
  });

  test('点牌堆也能发牌', () => {
    const { container } = render(<SpiderSolitaire />);
    fireEvent.click(screen.getByTestId('spider-stock'));
    expect(stockCount(container)).toBe(40);
  });

  test('没有可收的同花顺时, 收牌给出提示', async () => {
    render(<SpiderSolitaire />);
    fireEvent.click(screen.getByText('收牌 (C)'));
    expect(await screen.findByText('还没有能收的同花顺')).toBeInTheDocument();
    expect(stat('stat-moves')).toBe(0);
  });

  test('新局使用随机局号 (N 键同效)', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    render(<SpiderSolitaire />);
    fireEvent.click(screen.getByText('新局 (N)'));
    expect(seedInput().value).toBe('500001');
    press('n');
    expect(seedInput().value).toBe('500001');
  });

  test('输入局号后点发牌会换成另一局, 牌数仍是 104', () => {
    const { container } = render(<SpiderSolitaire />);
    const before = cardIds(container).join(',');
    fireEvent.change(seedInput(), { target: { value: '4321' } });
    fireEvent.click(screen.getByText('发牌'));
    expect(seedInput().value).toBe('4321');
    expect(cardIds(container)).toHaveLength(TABLEAU_CARDS);
    expect(cardIds(container).join(',')).not.toBe(before);
    expect(localStorage.getItem(SEED_KEY)).toBe('4321');
  });

  test('全屏模式只保留牌桌, Esc / 按钮可退出', () => {
    const { container } = render(<SpiderSolitaire />);
    fireEvent.click(screen.getByText('全屏'));
    expect(screen.getByTestId('spider-full')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-card]')).toHaveLength(TABLEAU_CARDS);
    fireEvent.click(screen.getByText('退出全屏'));
    expect(screen.queryByTestId('spider-full')).not.toBeInTheDocument();
    expect(screen.getByTestId('spider-top')).toBeInTheDocument();
    fireEvent.click(screen.getByText('全屏'));
    press('Escape');
    expect(screen.queryByTestId('spider-full')).not.toBeInTheDocument();
  });

  test('全屏时工具条 (局号 / 发牌 / 新局 / 撤销 ...) 在最上方', () => {
    const { container } = render(<SpiderSolitaire />);
    fireEvent.click(screen.getByText('全屏'));
    const stage = screen.getByTestId('spider-full');
    const bar = screen.getByTestId('spider-toolbar');
    expect(bar).toBeInTheDocument();
    // 是牌桌之前的第一个子节点
    expect(stage.firstElementChild).toBe(bar);
    // 开局 / 操作按钮都在工具条里, 不用滚到底部去找
    [ '发牌', '新局 (N)', '重开本局 (R)', '撤销 (Z)', '提示 (H)', '发一轮牌 (D)', '收牌 (C)', '退出全屏' ]
      .forEach((label) => {
        expect(bar.textContent).toContain(label);
      });
    expect(bar.querySelector('[data-testid="spider-seed"]')).toBeTruthy();
    expect(bar.querySelector('[data-testid="spider-difficulty"]')).toBeTruthy();
    // 牌桌在工具条下面
    const board = screen.getByTestId('spider-tableau');
    expect(bar.compareDocumentPosition(board) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelectorAll('[data-card]')).toHaveLength(TABLEAU_CARDS);
  });

  test('全屏时点工具条上的新局会重新发牌', () => {
    const { container } = render(<SpiderSolitaire />);
    fireEvent.click(screen.getByText('全屏'));
    fireEvent.click(screen.getByText('新局 (N)'));
    expect(columnCounts(container)).toEqual([ ...INITIAL_COUNTS ]);
    expect(stockCount(container)).toBe(50);
    expect(screen.getByTestId('spider-full')).toBeInTheDocument();
  });

  test('命中测试失效时按列的矩形范围兜底, 仍然能落位', () => {
    const { seed, state, move } = seedWithMove();
    useSeed(seed);
    const { container } = render(<SpiderSolitaire />);
    // elementFromPoint 永远找不到 (例如被弹层遮挡 / 落在缝隙上)
    dropOn(null);
    const target = colEl(container, move.to);
    jest.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, right: 300, bottom: 300, width: 300, height: 300, x: 0, y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    drag(cardEl(container, runHead(state, move)), null);
    expect(stat('stat-moves')).toBe(1);
    expect(columnCounts(container)[move.to]).toBe(state.tableau[move.to].length + move.count);
  });

  test('落点以松手时的坐标为准 (最后一次 pointermove 还在半路也能落对)', () => {
    const { seed, state, move } = seedWithMove();
    useSeed(seed);
    const { container } = render(<SpiderSolitaire />);
    const target = colEl(container, move.to);
    // 只有松手那一处 (80, 90) 能命中目标列, 中途的移动全落空
    (document as unknown as { elementFromPoint: (x: number, y: number) => Element | null }).elementFromPoint =
      (x: number, y: number) => (x === 80 && y === 90 ? target : null);
    pointer(cardEl(container, runHead(state, move)), 'pointerdown', 20, 20);
    pointer(window, 'pointermove', 30, 30);
    expect(stat('stat-moves')).toBe(0);
    pointer(window, 'pointerup', 80, 90);
    expect(stat('stat-moves')).toBe(1);
  });

  test('选中多张连牌时只高亮这几张, 不会一直高亮到列底', () => {
    // 连牌只会在发牌后出现 (新牌落在同花降序的牌上), 找一个发过 k 轮后有连牌的局号
    let found: { seed: number; deals: number; row: number; col: number; head: number; len: number } | null = null;
    for (let seed = 1; seed < 400 && !found; seed += 1) {
      let st = dealFromSeed(seed, 1);
      for (let deals = 1; deals <= 5 && !found; deals += 1) {
        const res = dealStock(st, DEFAULT_OPTIONS);
        if (!res.ok) break;
        st = res.state;
        st.tableau.forEach((pile, col) => {
          if (found) return;
          pile.forEach((card, head) => {
            if (found || !card.faceUp) return;
            const run = runFrom(st, col, head);
            if (run && run.length >= 2) {
              found = { seed, deals, row: st.tableau[col].length, col, head, len: run.length };
            }
          });
        });
      }
    }
    expect(found).not.toBeNull();
    const { seed, deals, head, len } = found!;
    const col = found!.col;
    useSeed(seed);
    const { container } = render(<SpiderSolitaire />);
    const dealBtn = screen.getByText('发一轮牌 (D)');
    for (let i = 0; i < deals; i += 1) fireEvent.click(dealBtn);
    const pile = dealStockRows(seed, deals);
    fireEvent.click(cardEl(container, pile[col][head]));
    expect(container.querySelectorAll('[data-selected="1"]')).toHaveLength(len);
  });

  test('拖拽一张牌到合法目标列可以直接落位', () => {
    const { seed, state, move } = seedWithMove();
    useSeed(seed);
    const { container } = render(<SpiderSolitaire />);
    drag(cardEl(container, runHead(state, move)), colEl(container, move.to));
    expect(stat('stat-moves')).toBe(1);
    expect(columnCounts(container)[move.from]).toBe(state.tableau[move.from].length - move.count);
    expect(columnCounts(container)[move.to]).toBe(state.tableau[move.to].length + move.count);
    // 拖拽结束后不应再触发选中
    expect(container.querySelectorAll('[data-selected="1"]')).toHaveLength(0);
  });

  test('拖拽时显示跟随指针的幽灵牌, 松手后消失', () => {
    const { seed, state, move } = seedWithMove();
    useSeed(seed);
    const { container } = render(<SpiderSolitaire />);
    const from = cardEl(container, runHead(state, move));
    pointer(from, 'pointerdown', 20, 20);
    dropOn(colEl(container, move.to));
    pointer(window, 'pointermove', 80, 90);
    const ghostLayer = screen.getByTestId('spider-drag');
    expect(ghostLayer).toBeInTheDocument();
    // 幽灵牌跟随指针 (按下点偏移被扣掉): 抬起点 80 - 20 = 60px
    expect(ghostLayer.style.left).toBe('60px');
    expect(ghostLayer.style.top).toBe('70px');
    expect(ghostLayer.querySelectorAll('[data-card]')).toHaveLength(0);
    expect(container.querySelectorAll('.sp-card.is-dragging').length).toBe(move.count);
    expect(colEl(container, move.to)).toHaveClass('is-drop');
    pointer(window, 'pointerup', 80, 90);
    expect(screen.queryByTestId('spider-drag')).not.toBeInTheDocument();
    expect(stat('stat-moves')).toBe(1);
  });

  test('拖起来又放回原列时按点击处理, 不会吞掉选中', () => {
    const { container } = render(<SpiderSolitaire />);
    const from = colEl(container, 0).querySelector('[data-up="1"]') as HTMLElement;
    pointer(from, 'pointerdown', 20, 20);
    dropOn(colEl(container, 0));
    pointer(window, 'pointermove', 90, 100);
    expect(screen.getByTestId('spider-drag')).toBeInTheDocument();
    pointer(window, 'pointerup', 90, 100);
    expect(screen.queryByTestId('spider-drag')).not.toBeInTheDocument();
    expect(stat('stat-moves')).toBe(0);
    // 松手后浏览器补发的 click 必须还能选中
    fireEvent.click(from);
    expect(from.getAttribute('data-selected')).toBe('1');
  });

  test('窗口失焦 (拖到窗口外松手) 会放弃拖拽, 不会卡住后续点击', () => {
    const { container } = render(<SpiderSolitaire />);
    const from = colEl(container, 0).querySelector('[data-up="1"]') as HTMLElement;
    pointer(from, 'pointerdown', 20, 20);
    dropOn(colEl(container, 1));
    pointer(window, 'pointermove', 90, 100);
    expect(screen.getByTestId('spider-drag')).toBeInTheDocument();
    fireEvent.blur(window);
    expect(screen.queryByTestId('spider-drag')).not.toBeInTheDocument();
    expect(stat('stat-moves')).toBe(0);
    fireEvent.click(from);
    expect(from.getAttribute('data-selected')).toBe('1');
  });

  test('拖到接不住的那一列不会动牌', () => {
    const { seed, state, move } = seedWithMove();
    useSeed(seed);
    const { container } = render(<SpiderSolitaire />);
    // 找一个肯定接不住的列 (顶牌与要移动的牌差 2 以上)
    const bad = state.tableau.findIndex((pile, col) => {
      if (col === move.from) return false;
      const top = pile[pile.length - 1];
      return !!top && top.rank !== runHead(state, move).rank + 1;
    });
    expect(bad).toBeGreaterThanOrEqual(0);
    drag(cardEl(container, runHead(state, move)), colEl(container, bad));
    expect(stat('stat-moves')).toBe(0);
    expect(columnCounts(container)).toEqual([ 6, 6, 6, 6, 5, 5, 5, 5, 5, 5 ]);
  });

  test('拖拽中途取消 (pointercancel) 不会动牌', () => {
    const { seed, state, move } = seedWithMove();
    useSeed(seed);
    const { container } = render(<SpiderSolitaire />);
    pointer(cardEl(container, runHead(state, move)), 'pointerdown', 20, 20);
    dropOn(colEl(container, move.to));
    pointer(window, 'pointermove', 80, 90);
    pointer(window, 'pointercancel', 80, 90);
    expect(stat('stat-moves')).toBe(0);
    expect(screen.queryByTestId('spider-drag')).not.toBeInTheDocument();
  });

  test('小幅度移动仍算点击 (不会误拖)', () => {
    const { container } = render(<SpiderSolitaire />);
    const top = colEl(container, 0).querySelector('[data-up="1"]') as HTMLElement;
    pointer(top, 'pointerdown', 20, 20);
    pointer(window, 'pointermove', 22, 21);
    pointer(window, 'pointerup', 22, 21);
    expect(screen.queryByTestId('spider-drag')).not.toBeInTheDocument();
    expect(stat('stat-moves')).toBe(0);
    expect(columnCounts(container)[0]).toBe(6);
  });

  test('每次拖拽只记一步, 且可撤销', () => {
    const { seed, state, move } = seedWithMove();
    useSeed(seed);
    const { container } = render(<SpiderSolitaire />);
    drag(cardEl(container, runHead(state, move)), colEl(container, move.to));
    expect(stat('stat-moves')).toBe(1);
    press('z');
    expect(stat('stat-moves')).toBe(0);
    expect(columnCounts(container)).toEqual([ 6, 6, 6, 6, 5, 5, 5, 5, 5, 5 ]);
  });

  test('说明区展示玩法要点', () => {
    render(<SpiderSolitaire />);
    expect(screen.getByText('蜘蛛纸牌说明')).toBeInTheDocument();
    expect(screen.getByText('这个工具做什么')).toBeInTheDocument();
  });
});
