import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Favorites from './index';
import { LocaleProvider } from '../../hook/locale-context';
import { AppContext } from '../../hook/app-context';
import { getFavorites, setFavorites } from '../../lib/favorite';
import { getDefaultGroupByType, setDefaultGroupByType } from './lib';

// jsdom 未实现 PointerEvent: 提供最小实现 (继承 MouseEvent 保留 clientX/clientY),
// 使拖动排序用例可真实走通 pointerdown/move/up 逻辑
if (typeof (window as any).PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    public pointerId :number;
    constructor(type :string, init :any = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      if (init.pointerType) (this as any).pointerType = init.pointerType;
    }
  }
  (window as any).PointerEvent = PointerEventPolyfill;
}

// App/index.tsx 有顶层 await + import.meta.glob (jest commonjs 不支持), 故打桩成固定应用列表
jest.mock('../index', () => {
  const appList = [
    { key: 'AESCrypto', label: 'AES 加解密', type: 'crypto', desktop: false, web: false, icon: null },
    { key: 'SM4Crypto', label: 'SM4 加解密', type: 'crypto', desktop: false, web: false, icon: null },
    { key: 'DnsQuery', label: 'DNS 查询', type: 'webmaster', desktop: true, web: false, icon: null },
  ];
  return { appList, genMenuList: () => [] };
});

// app-item 依赖 app-context (而 app-context 又依赖 ../App), 打桩成空 context (由卡片内部只取 setApp)
jest.mock('../../hook/app-context', () => ({
  AppContext: require('react').createContext(null),
}));

// 语言包全量导入较重且与本用例无关: 仅让 en 名与 zh-CN 不同, 用于验证多语言搜索
jest.mock('../app-i18n', () => ({
  appNameOf: (locale :string, key :string, fallback :string) => {
    const en :Record<string, string> = { AESCrypto: 'AES Encrypt & Decrypt' };
    return locale === 'en' ? (en[key] ?? fallback) : fallback;
  },
}));

const renderPage = () => render(
  <MemoryRouter initialEntries={ [ '/' ] }>
    <AppContext.Provider value={ {
      app: '',
      setApp: jest.fn(),
      tabs: [],
      closeTab: jest.fn(),
      closeLeft: jest.fn(),
      closeRight: jest.fn(),
      closeOthers: jest.fn(),
    } }>
      <LocaleProvider>
        <Favorites />
      </LocaleProvider>
    </AppContext.Provider>
  </MemoryRouter>
);

beforeEach(() => {
  localStorage.clear();
  document.body.classList.remove('favorites-dragging');
});

describe('我的收藏页面', () => {
  test('无收藏时展示空状态与提示', () => {
    renderPage();
    expect(screen.getByText('还没有收藏的应用')).toBeInTheDocument();
    expect(screen.getByText(/应用中心/)).toBeInTheDocument();
    expect(screen.getByText('共 0 个收藏')).toBeInTheDocument();
    // 无收藏时不展示清空按钮
    expect(screen.queryByRole('button', { name: /清空收藏/ })).not.toBeInTheDocument();
  });

  test('按收藏顺序展示已收藏应用, 过滤未知 key', () => {
    setFavorites([ 'SM4Crypto', 'AESCrypto', 'NotExist' ]);
    renderPage();
    expect(screen.getByText('SM4 加解密')).toBeInTheDocument();
    expect(screen.getByText('AES 加解密')).toBeInTheDocument();
    expect(screen.queryByText('DNS 查询')).not.toBeInTheDocument();
    expect(screen.getByText('共 2 个收藏')).toBeInTheDocument();
  });

  test('可搜索收藏的应用 (支持目录名)', () => {
    setFavorites([ 'AESCrypto', 'SM4Crypto' ]);
    renderPage();
    fireEvent.change(screen.getByPlaceholderText('搜索收藏的应用'), { target: { value: 'sm4' } });
    expect(screen.getByText('SM4 加解密')).toBeInTheDocument();
    expect(screen.queryByText('AES 加解密')).not.toBeInTheDocument();
    // 有收藏但搜索无匹配
    fireEvent.change(screen.getByPlaceholderText('搜索收藏的应用'), { target: { value: '不存在' } });
    expect(screen.getByText('没有匹配的收藏')).toBeInTheDocument();
  });

  test('清空收藏 (确认后回到空状态)', async () => {
    setFavorites([ 'AESCrypto' ]);
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /清空收藏/ }) );
    // Popconfirm 确认按钮与触发按钮同名, 取最后一个 (浮层内)
    await waitFor(() => expect(screen.getAllByRole('button', { name: /清空收藏/ }).length).toBeGreaterThan(1));
    const buttons = screen.getAllByRole('button', { name: /清空收藏/ });
    fireEvent.click(buttons[buttons.length - 1]);
    await waitFor(() => expect(screen.getByText('还没有收藏的应用')).toBeInTheDocument());
    expect(screen.getByText('共 0 个收藏')).toBeInTheDocument();
  });

  test('卡片右上角星标可取消收藏', () => {
    setFavorites([ 'AESCrypto', 'SM4Crypto' ]);
    renderPage();
    // 已收藏 -> 星标 aria-label 为「取消收藏」, 点击后从收藏列表移除
    const stars = screen.getAllByRole('button', { name: '取消收藏' });
    fireEvent.click(stars[0]);
    expect(screen.queryByText('AES 加解密')).not.toBeInTheDocument();
    expect(screen.getByText('SM4 加解密')).toBeInTheDocument();
    expect(screen.getByText('共 1 个收藏')).toBeInTheDocument();
  });

  test('可拖动卡片调整收藏顺序 (并持久化新顺序)', () => {
    setFavorites([ 'AESCrypto', 'SM4Crypto', 'DnsQuery' ]);
    renderPage();
    // 卡片顺序: 读取每张卡片 data-uri
    const order = () => Array.from(document.querySelectorAll('.favorites-sortable .app'))
      .map((el) => el.getAttribute('data-uri'));
    expect(order()).toEqual([ 'AESCrypto', 'SM4Crypto', 'DnsQuery' ]);

    // jsdom 中 getBoundingClientRect 恒为 0: 模拟三张卡片横向排列 (每张 100x50)
    const wrappers = Array.from(document.querySelectorAll<HTMLElement>('.favorites-sortable'));
    wrappers.forEach((el, i) => {
      el.getBoundingClientRect = () => ({
        left: i * 100, right: (i + 1) * 100, top: 0, bottom: 50,
        width: 100, height: 50, x: i * 100, y: 0, toJSON: () => ({}),
      } as DOMRect);
    });

    // 把第 1 张 (AESCrypto) 拖到第 3 张位置
    const dt = { pointerId: 1, button: 0, pointerType: 'mouse' };
    fireEvent.pointerDown(wrappers[0], { ...dt, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(wrappers[0], { ...dt, clientX: 250, clientY: 10 });
    fireEvent.pointerUp(wrappers[0], { ...dt, clientX: 250, clientY: 10 });

    expect(order()).toEqual([ 'SM4Crypto', 'DnsQuery', 'AESCrypto' ]);
    expect(getFavorites()).toEqual([ 'SM4Crypto', 'DnsQuery', 'AESCrypto' ]);
  });

  test('拖动结束后那次 click 不触发卡片跳转', () => {
    setFavorites([ 'AESCrypto', 'SM4Crypto' ]);
    renderPage();
    const wrappers = Array.from(document.querySelectorAll<HTMLElement>('.favorites-sortable'));
    wrappers.forEach((el, i) => {
      el.getBoundingClientRect = () => ({
        left: i * 100, right: (i + 1) * 100, top: 0, bottom: 50,
        width: 100, height: 50, x: i * 100, y: 0, toJSON: () => ({}),
      } as DOMRect);
    });
    const card = wrappers[0].querySelector('.app') as HTMLElement;
    const spy = jest.fn();
    card.addEventListener('click', spy);

    const dt = { pointerId: 2, button: 0, pointerType: 'mouse' };
    fireEvent.pointerDown(wrappers[0], { ...dt, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(wrappers[0], { ...dt, clientX: 150, clientY: 10 });
    fireEvent.pointerUp(wrappers[0], { ...dt, clientX: 150, clientY: 10 });
    fireEvent.click(card);

    expect(spy).not.toHaveBeenCalled();
  });

  test('拖动结束后点击星标仍可取消收藏 (未被误吞)', () => {
    setFavorites([ 'AESCrypto', 'SM4Crypto' ]);
    renderPage();
    const wrappers = Array.from(document.querySelectorAll<HTMLElement>('.favorites-sortable'));
    wrappers.forEach((el, i) => {
      el.getBoundingClientRect = () => ({
        left: i * 100, right: (i + 1) * 100, top: 0, bottom: 50,
        width: 100, height: 50, x: i * 100, y: 0, toJSON: () => ({}),
      } as DOMRect);
    });
    // 先拖动一次 (movedRef 置位)
    const dt = { pointerId: 3, button: 0, pointerType: 'mouse' };
    fireEvent.pointerDown(wrappers[0], { ...dt, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(wrappers[0], { ...dt, clientX: 150, clientY: 10 });
    fireEvent.pointerUp(wrappers[0], { ...dt, clientX: 150, clientY: 10 });

    // 紧接着点击某张卡片的星标: 应正常取消收藏 (而不是被当作拖动尾巴吞掉)
    const star = document.querySelector('.favorites-sortable .app-star') as HTMLElement;
    fireEvent.pointerDown(star, { pointerId: 4, button: 0, pointerType: 'mouse' });
    fireEvent.pointerUp(star, { pointerId: 4 });
    fireEvent.click(star);
    expect(screen.getByText('共 1 个收藏')).toBeInTheDocument();
  });

  test('拖动过程中给 body 加抓握手型类, 结束后移除', () => {
    setFavorites([ 'AESCrypto', 'SM4Crypto' ]);
    renderPage();
    const wrappers = Array.from(document.querySelectorAll<HTMLElement>('.favorites-sortable'));
    wrappers.forEach((el, i) => {
      el.getBoundingClientRect = () => ({
        left: i * 100, right: (i + 1) * 100, top: 0, bottom: 50,
        width: 100, height: 50, x: i * 100, y: 0, toJSON: () => ({}),
      } as DOMRect);
    });
    const dt = { pointerId: 9, button: 0, pointerType: 'mouse' };
    fireEvent.pointerDown(wrappers[0], { ...dt, clientX: 10, clientY: 10 });
    // 未越过拖动阈值: 仍视为普通点击, 不加类
    fireEvent.pointerMove(wrappers[0], { ...dt, clientX: 12, clientY: 10 });
    expect(document.body.classList.contains('favorites-dragging')).toBe(false);
    // 越过阈值: 进入拖动, 整页切换为抓握手型
    fireEvent.pointerMove(wrappers[0], { ...dt, clientX: 150, clientY: 10 });
    expect(document.body.classList.contains('favorites-dragging')).toBe(true);
    // 抬手: 移除类, 光标恢复
    fireEvent.pointerUp(wrappers[0], { ...dt, clientX: 150, clientY: 10 });
    expect(document.body.classList.contains('favorites-dragging')).toBe(false);
  });

  test('拖动中卸载页面时也会移除抓握手型类', () => {
    setFavorites([ 'AESCrypto', 'SM4Crypto' ]);
    const { unmount } = renderPage();
    const wrappers = Array.from(document.querySelectorAll<HTMLElement>('.favorites-sortable'));
    wrappers.forEach((el, i) => {
      el.getBoundingClientRect = () => ({
        left: i * 100, right: (i + 1) * 100, top: 0, bottom: 50,
        width: 100, height: 50, x: i * 100, y: 0, toJSON: () => ({}),
      } as DOMRect);
    });
    const dt = { pointerId: 10, button: 0, pointerType: 'mouse' };
    fireEvent.pointerDown(wrappers[0], { ...dt, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(wrappers[0], { ...dt, clientX: 150, clientY: 10 });
    expect(document.body.classList.contains('favorites-dragging')).toBe(true);
    unmount();
    expect(document.body.classList.contains('favorites-dragging')).toBe(false);
  });

  test('仅未搜索且收藏>1 时展示拖动把手', () => {
    setFavorites([ 'AESCrypto', 'SM4Crypto' ]);
    renderPage();
    expect(document.querySelectorAll('.favorites-drag-handle').length).toBe(2);
    // 搜索时禁用拖动 (过滤视图下顺序歧义)
    fireEvent.change(screen.getByPlaceholderText('搜索收藏的应用'), { target: { value: 'aes' } });
    expect(document.querySelectorAll('.favorites-drag-handle').length).toBe(0);
    expect(document.querySelector('.favorites-sortable-draggable')).toBeNull();
  });
});

describe('我的收藏 按类型展示', () => {
  test('默认平铺展示, 工具栏提供「按类型展示」按钮', () => {
    setFavorites([ 'AESCrypto', 'DnsQuery' ]);
    renderPage();
    expect(document.querySelectorAll('.appstore-group').length).toBe(0);
    expect(screen.getByRole('button', { name: /按类型展示/ })).toHaveAttribute('aria-pressed', 'false');
    expect(getDefaultGroupByType()).toBe(false);
  });

  test('点击按钮按应用类型分组 (仅当前视图), 再点回到平铺', () => {
    setFavorites([ 'AESCrypto', 'SM4Crypto', 'DnsQuery' ]);
    renderPage();

    const btn = screen.getByRole('button', { name: /按类型展示/ });
    fireEvent.click(btn);

    // 分组顺序遵循 APP_TYPES: 加解密(crypto) 在 站长工具(webmaster) 之前
    const names = Array.from(document.querySelectorAll('.appstore-group-name')).map((el) => el.textContent);
    expect(names).toEqual([ '加解密', '站长工具' ]);
    expect(document.querySelectorAll('.appstore-group .app').length).toBe(3);
    // 分组视图禁用拖动排序
    expect(document.querySelector('.favorites-drag-handle')).toBeNull();
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    // 页面按钮只切换当前视图, 不修改设置中的默认值
    expect(getDefaultGroupByType()).toBe(false);

    fireEvent.click(btn);
    expect(document.querySelectorAll('.appstore-group').length).toBe(0);
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  test('设置为按类型展示时, 页面初始即为分组视图', () => {
    setDefaultGroupByType(true);
    setFavorites([ 'AESCrypto', 'DnsQuery' ]);
    renderPage();
    expect(document.querySelectorAll('.appstore-group').length).toBe(2);
  });

  test('分组视图下搜索仅保留命中项对应分组', () => {
    setDefaultGroupByType(true);
    setFavorites([ 'AESCrypto', 'SM4Crypto', 'DnsQuery' ]);
    renderPage();
    fireEvent.change(screen.getByPlaceholderText('搜索收藏的应用'), { target: { value: 'dns' } });
    const names = Array.from(document.querySelectorAll('.appstore-group-name')).map((el) => el.textContent);
    expect(names).toEqual([ '站长工具' ]);
    expect(screen.queryByText('AES 加解密')).not.toBeInTheDocument();
  });

  test('设置页修改默认值时, 已打开的收藏页实时同步', () => {
    setFavorites([ 'AESCrypto', 'DnsQuery' ]);
    renderPage();
    expect(document.querySelectorAll('.appstore-group').length).toBe(0);
    act(() => { setDefaultGroupByType(true); });
    expect(document.querySelectorAll('.appstore-group').length).toBe(2);
    act(() => { setDefaultGroupByType(false); });
    expect(document.querySelectorAll('.appstore-group').length).toBe(0);
  });
});
