import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import MtrQuery from './index';
import { mtrProbe, mtrResolve, reverseDns } from './net';
import { runMtrTrace, summarizeHop } from './lib';
import type { MtrProbeReply, MtrTraceOptions } from './lib';

// 网络命令与探测编排打桩: 页面只负责参数与状态编排
jest.mock('./net', () => ({
  DESKTOP_ONLY_ERROR: '该功能仅在桌面应用中可用',
  mtrResolve: jest.fn(),
  mtrProbe: jest.fn(),
  reverseDns: jest.fn(),
}));
jest.mock('./lib', () => ({
  ...(jest.requireActual('./lib') as Record<string, unknown>),
  runMtrTrace: jest.fn(),
}));
const mockIsTauri = jest.fn(() => true);
jest.mock('../../lib/tauri', () => ({
  isTauri: () => mockIsTauri(),
  openUrl: jest.fn(),
}));

const mockResolve = mtrResolve as jest.Mock;
const mockProbe = mtrProbe as jest.Mock;
const mockReverse = reverseDns as jest.Mock;
const mockRun = runMtrTrace as jest.Mock;

const TARGET = { input: 'example.com', address: '1.1.1.1', kind: 'ipv4', hasIpv4: true, isLiteral: false };

const reply = (ttl: number, patch: Partial<MtrProbeReply> = {}): MtrProbeReply => ({
  ttl, status: 'ttlExpired', ok: true, rttMs: 12, addr: '10.0.0.1', detail: null, reached: false, elapsedMs: 13,
  ...patch,
});

const HOPS = [
  summarizeHop(1, [ { reply: reply(1, { rttMs: 1.2 }), error: null } ]),
  summarizeHop(2, [ { reply: reply(2, { rttMs: 12, reached: true, status: 'reply', addr: '1.1.1.1' }), error: null } ]),
];

const messageText = () => document.querySelector('.ant-message')?.textContent ?? '';
const inputBox = () => screen.getByPlaceholderText('输入域名或 IP, 如 example.com 或 1.1.1.1');
const queryBtn = () => screen.getByRole('button', { name: /查\s*询/ });

beforeEach(() => {
  jest.clearAllMocks();
  mockIsTauri.mockReturnValue(true);
  mockResolve.mockResolvedValue(TARGET);
  mockProbe.mockResolvedValue(reply(1));
  mockReverse.mockResolvedValue('gw.local');
  mockRun.mockImplementation(async (opts: MtrTraceOptions) => {
    opts.onRound?.(1, HOPS, new Map());
    opts.onRound?.(2, HOPS, new Map());
    return HOPS;
  });
  message.destroy();
});

describe('MtrQuery 页面 - 桌面版', () => {
  test('查询后按参数编排探测并渲染逐跳表格', async () => {
    render(<MtrQuery />);
    fireEvent.change(inputBox(), { target: { value: 'https://example.com/x' } });
    fireEvent.click(queryBtn());

    await waitFor(() => expect(mockRun).toHaveBeenCalledTimes(1));
    expect(mockResolve).toHaveBeenCalledWith('example.com');
    const opts = mockRun.mock.calls[0][0] as MtrTraceOptions;
    expect(opts.target).toEqual(TARGET);
    expect(opts.maxHops).toBe(30);
    expect(opts.rounds).toBe(10);
    expect(opts.timeoutMs).toBe(1000);
    expect(opts.intervalMs).toBe(1000);
    expect(opts.resolveNames).toBe(true);

    // 表格与汇总标签
    expect(await screen.findByText('10.0.0.1')).toBeInTheDocument();
    expect(screen.getByText('目标: 1.1.1.1')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('共 2 跳')).toBeInTheDocument();
    expect(screen.getByText('第 2 轮')).toBeInTheDocument();
    expect(screen.getByText('已到达')).toBeInTheDocument();
    expect(screen.getByText('转发中')).toBeInTheDocument();
    await waitFor(() => expect(messageText()).toContain('探测完成: 1.1.1.1 共 2 跳'));
  });

  test('probe / reverse 回调转发到网络层', async () => {
    render(<MtrQuery />);
    fireEvent.change(inputBox(), { target: { value: 'example.com' } });
    fireEvent.click(queryBtn());
    await waitFor(() => expect(mockRun).toHaveBeenCalledTimes(1));
    const opts = mockRun.mock.calls[0][0] as MtrTraceOptions;

    await opts.probe('1.1.1.1', 4, 500);
    expect(mockProbe).toHaveBeenCalledWith('1.1.1.1', 4, 500);
    await opts.reverse('1.1.1.1');
    expect(mockReverse).toHaveBeenCalledWith('1.1.1.1');
    expect(opts.shouldStop?.()).toBe(false);
  });

  test('IPv6 目标提示无法探测', async () => {
    mockResolve.mockResolvedValue({ input: '2001:db8::1', address: '2001:db8::1', kind: 'ipv6', hasIpv4: false, isLiteral: true });
    render(<MtrQuery />);
    fireEvent.change(inputBox(), { target: { value: '2001:db8::1' } });
    fireEvent.click(queryBtn());
    await waitFor(() => expect(messageText()).toContain('该域名没有 IPv4 地址'));
    expect(mockRun).not.toHaveBeenCalled();
  });

  test('非法输入只提示不请求', async () => {
    render(<MtrQuery />);
    fireEvent.change(inputBox(), { target: { value: '中文.com' } });
    fireEvent.click(queryBtn());
    await waitFor(() => expect(messageText()).toContain('暂不支持中文域名'));
    expect(mockResolve).not.toHaveBeenCalled();
  });

  test('解析失败展示错误信息', async () => {
    mockResolve.mockRejectedValue(new Error('域名解析失败: 未找到主机'));
    render(<MtrQuery />);
    fireEvent.change(inputBox(), { target: { value: 'no-such-host.example' } });
    fireEvent.click(queryBtn());
    await waitFor(() => expect(messageText()).toContain('查询失败: 域名解析失败: 未找到主机'));
  });

  test('探测编排异常展示错误信息', async () => {
    mockRun.mockRejectedValue(new Error('目标只支持 IPv4'));
    render(<MtrQuery />);
    fireEvent.change(inputBox(), { target: { value: 'example.com' } });
    fireEvent.click(queryBtn());
    await waitFor(() => expect(messageText()).toContain('查询失败: 目标只支持 IPv4'));
  });

  test('回车可直接查询', async () => {
    render(<MtrQuery />);
    const box = inputBox();
    fireEvent.change(box, { target: { value: '1.1.1.1' } });
    fireEvent.keyDown(box, { key: 'Enter', code: 'Enter', charCode: 13 });
    await waitFor(() => expect(mockResolve).toHaveBeenCalledWith('1.1.1.1'));
  });

  test('运行中出现停止按钮, 点击后 shouldStop 为真并提示已停止', async () => {
    let captured: MtrTraceOptions | null = null;
    mockRun.mockImplementation((opts: MtrTraceOptions) => {
      captured = opts;
      return new Promise(() => { /* 保持运行中 */ });
    });
    render(<MtrQuery />);
    fireEvent.change(inputBox(), { target: { value: 'example.com' } });
    fireEvent.click(queryBtn());

    const stopBtn = await screen.findByRole('button', { name: /停\s*止/ });
    expect(captured).not.toBeNull();
    expect((captured as unknown as MtrTraceOptions).shouldStop?.()).toBe(false);
    fireEvent.click(stopBtn);
    expect((captured as unknown as MtrTraceOptions).shouldStop?.()).toBe(true);
  });

  test('未查询时展示使用提示', () => {
    render(<MtrQuery />);
    expect(screen.getByText(/工具会先完整发现到目标的路径/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /复制结果/ })).not.toBeInTheDocument();
  });

  test('有结果时出现复制结果与清空按钮', async () => {
    render(<MtrQuery />);
    fireEvent.change(inputBox(), { target: { value: 'example.com' } });
    fireEvent.click(queryBtn());
    expect(await screen.findByRole('button', { name: /复制结果/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /清\s*空/ }));
    await waitFor(() => expect(screen.queryByText('共 2 跳')).not.toBeInTheDocument());
  });
});

describe('MtrQuery 页面 - 浏览器演示版', () => {
  beforeEach(() => mockIsTauri.mockReturnValue(false));

  test('提示仅桌面版可用并禁用查询按钮', () => {
    render(<MtrQuery />);
    expect(screen.getByText('该功能仅在桌面应用中可用')).toBeInTheDocument();
    expect(screen.getByText(/浏览器不允许发送原始 ICMP 包/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /下载桌面版/ })).toBeInTheDocument();
    expect(queryBtn()).toBeDisabled();
  });
});
