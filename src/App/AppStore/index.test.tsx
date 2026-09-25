import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppStore from './index';
import { LocaleProvider } from '../../hook/locale-context';
import { AppContext } from '../../hook/app-context';

// App/index.tsx 有顶层 await + import.meta.glob (jest commonjs 不支持), 故打桩成固定应用列表
jest.mock('../index', () => {
  const appList = [
    { key: 'AESCrypto', label: 'AES 加解密', type: 'crypto', desktop: false, icon: null },
    { key: 'SM4Crypto', label: 'SM4 加解密', type: 'crypto', desktop: false, icon: null },
    { key: 'LatLngConvert', label: '经纬度格式转换', type: 'convert', desktop: false, icon: null },
    { key: 'QRCodeGenerator', label: '二维码生成', type: 'generator', desktop: false, icon: null },
    { key: 'DnsQuery', label: 'DNS 查询', type: 'webmaster', desktop: true, icon: null },
  ];
  const cats: Array<[ string, string ]> = [
    [ 'convert', '类型转换' ],
    [ 'crypto', '加解密' ],
    [ 'generator', '生成器' ],
    [ 'webmaster', '站长工具' ],
  ];
  // 与真实 genMenuList 结构对齐 (只保留应用中心用到的 key/name/children)
  const genMenuList = (items :typeof appList) => cats
    .map(([ key, name ]) => ({ key, name, label: name, icon: null, children: items.filter((i) => i.type === key) }))
    .filter((g) => g.children.length > 0);
  return { appList, genMenuList };
});

// 语言包全量导入较重且与本用例无关: 只让 en 界面名与 zh-CN 不同, 用于验证多语言搜索
jest.mock('../app-i18n', () => ({
  appNameOf: (locale :string, key :string, fallback :string) => {
    const en :Record<string, string> = {
      AESCrypto: 'AES Encrypt & Decrypt',
      LatLngConvert: 'Lat/Lng Converter',
      DnsQuery: 'DNS Query',
    };
    return locale === 'en' ? (en[key] ?? fallback) : fallback;
  },
}));

jest.mock('../../hook/app-context', () => ({
  AppContext: require('react').createContext(null),
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
        <AppStore />
      </LocaleProvider>
    </AppContext.Provider>
  </MemoryRouter>
);

const getSearch = () => screen.getByPlaceholderText('搜索应用名 / 分类名') as HTMLInputElement;

const search = (v :string) => fireEvent.change(getSearch(), { target: { value: v } });

describe('AppStore 搜索', () => {
  test('默认展示全部应用与总数', () => {
    renderPage();
    expect(screen.getByText('共 5 个应用')).toBeInTheDocument();
    expect(screen.getByText('AES 加解密')).toBeInTheDocument();
    expect(screen.getByText('SM4 加解密')).toBeInTheDocument();
    expect(screen.getByText('经纬度格式转换')).toBeInTheDocument();
    expect(screen.getByText('DNS 查询')).toBeInTheDocument();
  });

  test('按应用名搜索: 命中项保留, 非命中项与空分类隐藏', () => {
    renderPage();
    search('sm4');
    expect(screen.getByText('SM4 加解密')).toBeInTheDocument();
    expect(screen.queryByText('AES 加解密')).not.toBeInTheDocument();
    expect(screen.queryByText('经纬度格式转换')).not.toBeInTheDocument();
    expect(screen.getByText('共 1 个应用')).toBeInTheDocument();
    // 无匹配应用的分类标题不再展示; 剩余分类标题仅一个「加解密」(卡片名 'AES 加解密' 非精确匹配)
    expect(screen.getAllByText('加解密')).toHaveLength(1);
  });

  test('搜索忽略大小写, 支持目录名片段', () => {
    renderPage();
    search('  sm4crypto  ');
    expect(screen.getByText('SM4 加解密')).toBeInTheDocument();
    search('latlng');
    expect(screen.getByText('经纬度格式转换')).toBeInTheDocument();
    expect(screen.queryByText('SM4 加解密')).not.toBeInTheDocument();
  });

  test('分类名参与匹配: 输入分类名列出该分类全部应用', () => {
    renderPage();
    search('加解密');
    expect(screen.getByText('AES 加解密')).toBeInTheDocument();
    expect(screen.getByText('SM4 加解密')).toBeInTheDocument();
    expect(screen.queryByText('经纬度格式转换')).not.toBeInTheDocument();
    expect(screen.getByText('共 2 个应用')).toBeInTheDocument();
  });

  test('英文界面名可命中 (当前语言非英文)', () => {
    renderPage();
    search('Encrypt');
    expect(screen.getByText('AES 加解密')).toBeInTheDocument();
    expect(screen.queryByText('SM4 加解密')).not.toBeInTheDocument();
  });

  test('多个关键词为「与」关系 (可跨名称与分类)', () => {
    renderPage();
    search('sm4 加解密');
    expect(screen.getByText('SM4 加解密')).toBeInTheDocument();
    expect(screen.queryByText('AES 加解密')).not.toBeInTheDocument();
  });

  test('无匹配时展示空状态提示且总数为 0', () => {
    renderPage();
    search('不存在的应用');
    expect(screen.getByText('共 0 个应用')).toBeInTheDocument();
    expect(screen.getByText('没有匹配的应用')).toBeInTheDocument();
    expect(screen.queryByText('AES 加解密')).not.toBeInTheDocument();
  });

  test('清空搜索框后恢复全部应用', () => {
    renderPage();
    search('sm4');
    expect(screen.getByText('共 1 个应用')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('close-circle'));
    expect(screen.getByText('共 5 个应用')).toBeInTheDocument();
    expect(screen.getByText('AES 加解密')).toBeInTheDocument();
  });

  test('搜索与分类筛选叠加', async () => {
    renderPage();
    // 分类选择「加解密」后再搜索 dns: 结果为 0
    fireEvent.mouseDown(screen.getByRole('combobox'));
    const options = await screen.findAllByTitle('加解密');
    fireEvent.click(options[options.length - 1]);
    await waitFor(() => expect(screen.queryByText('经纬度格式转换')).not.toBeInTheDocument());
    expect(screen.getByText('共 2 个应用')).toBeInTheDocument();
    search('dns');
    expect(screen.getByText('共 0 个应用')).toBeInTheDocument();
    expect(screen.getByText('没有匹配的应用')).toBeInTheDocument();
  });
});
