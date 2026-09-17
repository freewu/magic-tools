import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import WhoisQuery from './index';
import { whoisQuery } from './net';

// 网络命令打桩 (真实实现只走 Tauri)
jest.mock('./net', () => ({
  DESKTOP_ONLY_ERROR: '该功能仅在桌面应用中可用',
  whoisQuery: jest.fn(),
}));
const mockIsTauri = jest.fn(() => true);
jest.mock('../../lib/tauri', () => ({
  isTauri: () => mockIsTauri(),
  openUrl: jest.fn(),
}));

const mockWhois = whoisQuery as jest.Mock;

const SECTION = `   Domain Name: EXAMPLE.COM
   Registrar: RESERVED-Internet Assigned Numbers Authority
   Creation Date: 1995-08-14T04:00:00Z
   Registry Expiry Date: 2025-08-14T04:00:00Z
   Domain Status: clientTransferProhibited https://icann.org/epp#clientTransferProhibited
   Name Server: A.IANA-SERVERS.NET
   Name Server: B.IANA-SERVERS.NET
   DNSSEC: signedDelegation`;

const RESULT = {
  query: 'example.com',
  kind: 'domain',
  sections: [ { server: 'whois.verisign-grs.com', text: SECTION, note: null } ],
};

const messageText = () => document.querySelector('.ant-message')?.textContent ?? '';

beforeEach(() => {
  jest.clearAllMocks();
  mockIsTauri.mockReturnValue(true);
  mockWhois.mockResolvedValue(RESULT);
  message.destroy();
});

describe('WhoisQuery 页面 - 桌面版', () => {
  test('查询后展示关键信息与原始结果', async () => {
    render(<WhoisQuery />);
    fireEvent.change(screen.getByPlaceholderText('输入域名或 IP, 如 example.com 或 8.8.8.8'), { target: { value: 'HTTPS://Example.COM/x' } });
    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }));

    // 输入被归一化后再请求
    await waitFor(() => expect(mockWhois).toHaveBeenCalledWith('example.com'));
    expect(await screen.findByText('EXAMPLE.COM')).toBeInTheDocument();
    expect(screen.getByText('关键信息')).toBeInTheDocument();
    // 关键字段 (含名称服务器标签)
    expect(screen.getByText('注册商')).toBeInTheDocument();
    expect(screen.getByText('RESERVED-Internet Assigned Numbers Authority')).toBeInTheDocument();
    expect(screen.getByText('名称服务器')).toBeInTheDocument();
    expect(screen.getByText('A.IANA-SERVERS.NET')).toBeInTheDocument();
    expect(screen.getByText('B.IANA-SERVERS.NET')).toBeInTheDocument();
    // 汇总标签 (「域名」同时是关键信息行标签, 这里限定在 ant-tag 内查找)
    const tags = Array.from(document.querySelectorAll('.ant-tag')).map((el) => el.textContent);
    expect(tags).toContain('域名');
    expect(screen.getByText('共 1 跳')).toBeInTheDocument();
    // 原始结果 (默认展开)
    expect(screen.getByText('原始结果')).toBeInTheDocument();
    expect(screen.getByText('1. whois.verisign-grs.com')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  test('查询成功提示包含查询对象与类型', async () => {
    render(<WhoisQuery />);
    fireEvent.change(screen.getByPlaceholderText('输入域名或 IP, 如 example.com 或 8.8.8.8'), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }));
    await waitFor(() => expect(messageText()).toContain('查询完成: example.com (域名)'));
  });

  test('回车可直接查询', async () => {
    render(<WhoisQuery />);
    const input = screen.getByPlaceholderText('输入域名或 IP, 如 example.com 或 8.8.8.8');
    fireEvent.change(input, { target: { value: '8.8.8.8' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    await waitFor(() => expect(mockWhois).toHaveBeenCalledWith('8.8.8.8'));
  });

  test('非法输入只提示不请求', async () => {
    render(<WhoisQuery />);
    fireEvent.change(screen.getByPlaceholderText('输入域名或 IP, 如 example.com 或 8.8.8.8'), { target: { value: '中文.com' } });
    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }));
    await waitFor(() => expect(messageText()).toContain('暂不支持中文域名'));
    expect(mockWhois).not.toHaveBeenCalled();
  });

  test('空输入提示填写', async () => {
    render(<WhoisQuery />);
    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }));
    await waitFor(() => expect(messageText()).toContain('请输入域名或 IP 地址'));
    expect(mockWhois).not.toHaveBeenCalled();
  });

  test('查询失败展示错误信息', async () => {
    mockWhois.mockRejectedValue(new Error('连接 whois.verisign-grs.com:43 失败'));
    render(<WhoisQuery />);
    fireEvent.change(screen.getByPlaceholderText('输入域名或 IP, 如 example.com 或 8.8.8.8'), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }));
    await waitFor(() => expect(messageText()).toContain('查询失败: 连接 whois.verisign-grs.com:43 失败'));
    expect(screen.queryByText('关键信息')).not.toBeInTheDocument();
  });

  test('后续跳失败时标记警告但仍展示已取得字段', async () => {
    mockWhois.mockResolvedValue({
      query: 'example.com',
      kind: 'domain',
      sections: [
        { server: 'whois.verisign-grs.com', text: SECTION, note: null },
        { server: 'whois.iana.org', text: '', note: '连接失败: 拒绝连接' },
      ],
    });
    render(<WhoisQuery />);
    fireEvent.change(screen.getByPlaceholderText('输入域名或 IP, 如 example.com 或 8.8.8.8'), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }));
    expect(await screen.findByText('共 2 跳')).toBeInTheDocument();
    expect(screen.getByText('2. whois.iana.org')).toBeInTheDocument();
    expect(screen.getByText('连接失败: 拒绝连接')).toBeInTheDocument();
    expect(screen.getAllByText('查询失败 (可查看其它跳结果)').length).toBeGreaterThan(0);
    // 已取得的关键字段仍展示
    expect(screen.getByText('RESERVED-Internet Assigned Numbers Authority')).toBeInTheDocument();
  });

  test('无关键字段时给出提示', async () => {
    mockWhois.mockResolvedValue({
      query: 'example.com',
      kind: 'domain',
      sections: [ { server: 'whois.iana.org', text: 'No match for "EXAMPLE.COM".', note: null } ],
    });
    render(<WhoisQuery />);
    fireEvent.change(screen.getByPlaceholderText('输入域名或 IP, 如 example.com 或 8.8.8.8'), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }));
    expect(await screen.findByText('未解析出关键信息, 请查看下方原始结果')).toBeInTheDocument();
  });

  test('未查询时展示使用提示, 查询后隐藏', async () => {
    render(<WhoisQuery />);
    expect(screen.getByText(/输入域名或 IP 后点击「查询」/)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('输入域名或 IP, 如 example.com 或 8.8.8.8'), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }));
    await waitFor(() => expect(screen.queryByText(/输入域名或 IP 后点击「查询」/)).not.toBeInTheDocument());
  });

  test('复制关键信息按钮仅在有关键信息时出现', async () => {
    render(<WhoisQuery />);
    expect(screen.queryByRole('button', { name: /复制关键信息/ })).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('输入域名或 IP, 如 example.com 或 8.8.8.8'), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /查\s*询/ }));
    expect(await screen.findByRole('button', { name: /复制关键信息/ })).toBeInTheDocument();
  });
});

describe('WhoisQuery 页面 - 浏览器演示版', () => {
  beforeEach(() => mockIsTauri.mockReturnValue(false));

  test('提示仅桌面版可用并禁用查询按钮', () => {
    render(<WhoisQuery />);
    expect(screen.getByText('该功能仅在桌面应用中可用')).toBeInTheDocument();
    expect(screen.getByText(/浏览器不允许直接建立 TCP 43 连接/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /下载桌面版/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /查\s*询/ })).toBeDisabled();
  });
});
