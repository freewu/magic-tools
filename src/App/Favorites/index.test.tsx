import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Favorites from './index';
import { LocaleProvider } from '../../hook/locale-context';
import { AppContext } from '../../hook/app-context';
import { setFavorites } from '../../lib/favorite';

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

beforeEach(() => localStorage.clear());

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
});
