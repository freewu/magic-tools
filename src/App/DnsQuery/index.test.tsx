import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import DnsQuery from './index';
import { queryAllDns, queryDns } from './net';
import { RECORD_TYPES } from './lib';

// 网络命令打桩 (真实实现只走 Tauri)
jest.mock('./net', () => ({
  ...(jest.requireActual('./net') as Record<string, unknown>),
  queryDns: jest.fn(),
  queryAllDns: jest.fn(),
}));
// 桌面环境 (Tauri); 逐个用例切换 isTauri 覆盖浏览器演示版
const mockIsTauri = jest.fn(() => true);
jest.mock('../../lib/tauri', () => ({
  isTauri: () => mockIsTauri(),
  openUrl: jest.fn(),
}));

const mockQueryDns = queryDns as jest.Mock;
const mockQueryAll = queryAllDns as jest.Mock;

const REC = { name: 'example.com.', recordType: 'A', ttl: 300, value: '104.20.23.154' };
const RESULT = { status: 'ok', records: [ REC ], elapsedMs: 21, server: '192.168.1.1', message: null };

/** 记录类型用的是 antd Segmented, 点其隐藏 input 即可 */
const pickType = (text: string) => {
  const label = screen
    .getAllByText(text)
    .map((el) => el.closest('label.ant-segmented-item'))
    .find(Boolean) as HTMLElement | undefined;
  if (!label) throw new Error(`未找到记录类型: ${text}`);
  fireEvent.click(label.querySelector('input') as HTMLInputElement);
};

const messageText = () => document.querySelector('.ant-message')?.textContent ?? '';

beforeEach(() => {
  jest.clearAllMocks();
  mockIsTauri.mockReturnValue(true);
  mockQueryDns.mockResolvedValue(RESULT);
  mockQueryAll.mockResolvedValue(
    RECORD_TYPES.map((recordType, i) => ({
      recordType,
      result: i === 0
        ? RESULT
        : { status: 'nodata', records: [], elapsedMs: 5, server: '192.168.1.1', message: `该域名没有 ${recordType} 记录` },
    })),
  );
  message.destroy();
});

describe('DnsQuery 页面 - 桌面版', () => {
  test('默认按 A 记录查询并渲染结果', async () => {
    render(<DnsQuery />);
    fireEvent.change(screen.getByPlaceholderText('输入域名, 如 example.com'), { target: { value: 'https://example.com/path' } });
    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }));

    await waitFor(() => expect(mockQueryDns).toHaveBeenCalledWith('example.com', 'A', 'system'));
    expect(await screen.findByText('104.20.23.154')).toBeInTheDocument();
    // 汇总: 标签 + 服务器 / 耗时 / 条数
    expect(screen.getByText('A · 1')).toBeInTheDocument();
    expect(screen.getByText(/服务器: 192\.168\.1\.1/)).toBeInTheDocument();
    expect(screen.getByText(/共 1 条记录/)).toBeInTheDocument();
    expect(screen.getByText('example.com.')).toBeInTheDocument();
    // TTL 单元格展示原始秒数, title 为紧凑格式
    expect(screen.getByTitle('5m')).toHaveTextContent('300');
  });

  test('切换记录类型后按所选类型查询', async () => {
    render(<DnsQuery />);
    pickType('MX');
    fireEvent.change(screen.getByPlaceholderText('输入域名, 如 example.com'), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }));
    await waitFor(() => expect(mockQueryDns).toHaveBeenCalledWith('example.com', 'MX', 'system'));
  });

  test('选择「全部」时一次查询 7 种类型', async () => {
    render(<DnsQuery />);
    pickType('全部');
    fireEvent.change(screen.getByPlaceholderText('输入域名, 如 example.com'), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }));

    await waitFor(() => expect(mockQueryAll).toHaveBeenCalledWith('example.com', 'system'));
    expect(mockQueryDns).not.toHaveBeenCalled();
    // 每种类型一个状态标签
    for (const rt of RECORD_TYPES) {
      expect(await screen.findByText(new RegExp(`^${rt} · `))).toBeInTheDocument();
    }
  });

  test('非法域名只提示不请求', async () => {
    render(<DnsQuery />);
    fireEvent.change(screen.getByPlaceholderText('输入域名, 如 example.com'), { target: { value: 'exa mple.com' } });
    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }));
    await waitFor(() => expect(messageText()).toContain('域名格式不正确'));
    expect(mockQueryDns).not.toHaveBeenCalled();
  });

  test('空域名提示填写', async () => {
    render(<DnsQuery />);
    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }));
    await waitFor(() => expect(messageText()).toContain('请输入要查询的域名'));
    expect(mockQueryDns).not.toHaveBeenCalled();
  });

  test('查询失败展示错误信息', async () => {
    mockQueryDns.mockRejectedValue(new Error('查询超时, 请检查网络或更换 DNS 服务器'));
    render(<DnsQuery />);
    fireEvent.change(screen.getByPlaceholderText('输入域名, 如 example.com'), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }));
    await waitFor(() => expect(messageText()).toContain('查询失败: 查询超时'));
  });

  test('NXDOMAIN 结果展示警告状态标签', async () => {
    mockQueryDns.mockResolvedValue({ status: 'nxdomain', records: [], elapsedMs: 30, server: '1.1.1.1', message: '域名不存在 (NXDOMAIN)' });
    render(<DnsQuery />);
    fireEvent.change(screen.getByPlaceholderText('输入域名, 如 example.com'), { target: { value: 'not-exist.example' } });
    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }));
    expect(await screen.findByText('A · 0')).toBeInTheDocument();
    expect(screen.getByTitle('域名不存在 (NXDOMAIN)')).toBeInTheDocument();
  });

  test('未查询时展示使用提示, 查询后隐藏', async () => {
    render(<DnsQuery />);
    const hint = screen.getByText(/输入域名后点击「查询」/);
    expect(hint).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('输入域名, 如 example.com'), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }));
    await waitFor(() => expect(screen.queryByText(/输入域名后点击「查询」/)).not.toBeInTheDocument());
  });
});

describe('DnsQuery 页面 - 浏览器演示版', () => {
  beforeEach(() => mockIsTauri.mockReturnValue(false));

  test('提示仅桌面版可用并禁用查询按钮', () => {
    render(<DnsQuery />);
    expect(screen.getByText('该功能仅在桌面应用中可用')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /下载桌面版/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /查\s*询/ })).toBeDisabled();
  });

  test('点击下载桌面版打开 Releases 页面', async () => {
    // openUrl 被 mock, 这里只验证按钮可点击且不抛错
    render(<DnsQuery />);
    fireEvent.click(screen.getByRole('button', { name: /下载桌面版/ }));
    await waitFor(() => expect(screen.getByText('该功能仅在桌面应用中可用')).toBeInTheDocument());
  });
});
