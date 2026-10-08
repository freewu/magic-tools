import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import FavoritesFab from './favorites-fab';
import { LocaleProvider } from '../hook/locale-context';
import { AppContext } from '../hook/app-context';
import { setFavorites } from '../lib/favorite';

// jsdom 未实现 PointerEvent: 提供最小实现 (继承 MouseEvent 以保留 clientX/clientY),
// 使拖动用例可真实走通 pointerdown/move/up 逻辑
if (typeof (window as any).PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    public pointerId :number;
    constructor(type :string, init :any = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
    }
  }
  (window as any).PointerEvent = PointerEventPolyfill;
}

jest.mock('../hook/app-context', () => ({
  AppContext: require('react').createContext(null),
}));

const setApp = jest.fn();

const Location = () => {
  const loc = useLocation();
  return <span data-testid="loc">{ loc.pathname }</span>;
};

const renderFab = () => render(
  <MemoryRouter initialEntries={ [ '/' ] }>
    <AppContext.Provider value={ {
      app: '',
      setApp,
      tabs: [],
      closeTab: jest.fn(),
      closeLeft: jest.fn(),
      closeRight: jest.fn(),
      closeOthers: jest.fn(),
    } }>
      <LocaleProvider>
        <Routes>
          <Route path="*" element={ <><FavoritesFab /><Location /></> } />
        </Routes>
      </LocaleProvider>
    </AppContext.Provider>
  </MemoryRouter>
);

beforeEach(() => {
  setApp.mockClear();
  localStorage.clear();
});

describe('收藏悬浮入口', () => {
  test('点击进入我的收藏', () => {
    renderFab();
    fireEvent.click(screen.getByRole('button'));
    expect(setApp).toHaveBeenCalledWith('Favorites');
    expect(screen.getByTestId('loc')).toHaveTextContent('/Favorites');
  });

  test('有收藏时展示数量角标, 无收藏时不展示', () => {
    setFavorites([ 'AES', 'SM4' ]);
    renderFab();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('按比例坐标渲染默认位置 (右下)', () => {
    renderFab();
    // jsdom: innerWidth=1024, innerHeight=768; FAB_SIZE=46
    // x=1 -> left = 1024 - 46 = 978; y=0.72 -> top = (768 - 46) * 0.72 = 519.84
    expect(screen.getByRole('button')).toHaveStyle({ left: '978px' });
  });

  test('拖动后持久化位置, 且那次 click 不跳转', () => {
    renderFab();
    const btn = screen.getByRole('button');
    fireEvent.pointerDown(btn, { pointerId: 1, clientX: 978, clientY: 520 });
    fireEvent.pointerMove(btn, { pointerId: 1, clientX: 800, clientY: 300 });
    fireEvent.pointerUp(btn, { pointerId: 1 });

    const raw = localStorage.getItem('favorites-fab-pos');
    expect(raw).not.toBeNull();
    const pos = JSON.parse(raw as string);
    expect(pos.x).toBeLessThan(1);
    expect(pos.y).toBeLessThan(0.72);

    // 拖动结束派发的 click 不应触发跳转
    fireEvent.click(btn);
    expect(setApp).not.toHaveBeenCalled();
  });
});
