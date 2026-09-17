import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppItem from './app-item';
import { AppContext } from '../../hook/app-context';

// app-context 依赖 App/index.tsx 的顶层 await + import.meta.glob (jest commonjs 不支持), 故打桩
jest.mock('../../hook/app-context', () => ({
  AppContext: require('react').createContext(null),
}));

const setApp = jest.fn();

const renderItem = (desktop?: boolean) => render(
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
      <AppItem uri="DnsQuery" icon="" label="DNS 查询" desktop={ desktop } />
    </AppContext.Provider>
  </MemoryRouter>
);

beforeEach(() => setApp.mockClear());

describe('AppStore 应用卡片', () => {
  test('仅桌面版应用展示「仅桌面版」标识', () => {
    renderItem(true);
    expect(screen.getByText('DNS 查询')).toBeInTheDocument();
    expect(screen.getByText('仅桌面版')).toBeInTheDocument();
  });

  test('普通应用不展示标识', () => {
    renderItem(false);
    expect(screen.queryByText('仅桌面版')).not.toBeInTheDocument();
  });

  test('点击卡片切换当前应用', () => {
    renderItem(false);
    fireEvent.click(screen.getByText('DNS 查询'));
    expect(setApp).toHaveBeenCalledWith('DnsQuery');
  });
});
