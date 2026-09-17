// DNS 查询网络层: 断言 invoke 参数映射与浏览器环境拦截

import { DESKTOP_ONLY_ERROR, isAllTypes, queryAllDns, queryDns } from './net';
import { ALL_RECORD_TYPES, RECORD_TYPES } from './lib';

// 模拟 @tauri-apps/api/core 与 isTauri (动态 import 在 CJS 下同样会命中 jest.mock)
const mockInvoke = jest.fn();
const mockIsTauri = jest.fn(() => true);

jest.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));
jest.mock('../../lib/tauri', () => ({
  isTauri: () => mockIsTauri(),
}));

const OK_RESULT = { status: 'ok', records: [], elapsedMs: 1, server: '1.1.1.1', message: null };

beforeEach(() => {
  jest.clearAllMocks();
  mockIsTauri.mockReturnValue(true);
  mockInvoke.mockResolvedValue(OK_RESULT);
});

describe('DnsQuery net - isAllTypes', () => {
  test('只对 ALL 成立', () => {
    expect(isAllTypes(ALL_RECORD_TYPES)).toBe(true);
    expect(isAllTypes('A')).toBe(false);
    expect(isAllTypes('')).toBe(false);
  });
});

describe('DnsQuery net - queryDns', () => {
  test('系统默认服务器传 null', async () => {
    await queryDns('example.com', 'A', 'system');
    expect(mockInvoke).toHaveBeenCalledWith('dns_query', { name: 'example.com', recordType: 'A', server: null });
  });

  test('空字符串服务器也传 null', async () => {
    await queryDns('example.com', 'MX', '   ');
    expect(mockInvoke).toHaveBeenCalledWith('dns_query', { name: 'example.com', recordType: 'MX', server: null });
  });

  test('自定义服务器原样传递', async () => {
    await queryDns('example.com', 'AAAA', '8.8.8.8');
    expect(mockInvoke).toHaveBeenCalledWith('dns_query', { name: 'example.com', recordType: 'AAAA', server: '8.8.8.8' });
  });

  test('浏览器环境直接抛错且不触发 invoke', async () => {
    mockIsTauri.mockReturnValue(false);
    await expect(queryDns('example.com', 'A', 'system')).rejects.toThrow(DESKTOP_ONLY_ERROR);
    expect(mockInvoke).not.toHaveBeenCalled();
  });
});

describe('DnsQuery net - queryAllDns', () => {
  test('并发查询全部 7 种记录类型', async () => {
    const out = await queryAllDns('example.com', '1.1.1.1');
    expect(out).toHaveLength(RECORD_TYPES.length);
    expect(out.map((item) => item.recordType)).toEqual([ ...RECORD_TYPES ]);
    expect(mockInvoke).toHaveBeenCalledTimes(RECORD_TYPES.length);
    expect(mockInvoke.mock.calls.map((c) => (c[1] as { recordType: string }).recordType))
      .toEqual([ ...RECORD_TYPES ]);
  });

  test('单个类型失败不影响其它类型', async () => {
    mockInvoke.mockImplementation((_cmd: string, args: { recordType: string }) => (
      args.recordType === 'MX'
        ? Promise.reject(new Error('查询超时'))
        : Promise.resolve(OK_RESULT)
    ));
    const out = await queryAllDns('example.com', '1.1.1.1');
    const mx = out.find((item) => item.recordType === 'MX');
    expect(mx?.result.status).toBe('error');
    expect(mx?.result.message).toBe('查询超时');
    expect(mx?.result.server).toBe('1.1.1.1');
    expect(out.filter((item) => item.result.status === 'ok')).toHaveLength(RECORD_TYPES.length - 1);
  });

  test('失败类型使用系统默认时服务器文案保持一致', async () => {
    mockInvoke.mockRejectedValue(new Error('boom'));
    const out = await queryAllDns('example.com', 'system');
    expect(out.every((item) => item.result.status === 'error')).toBe(true);
    expect(out[0].result.server).toBe('系统默认');
  });

  test('浏览器环境直接抛错', async () => {
    mockIsTauri.mockReturnValue(false);
    await expect(queryAllDns('example.com', 'system')).rejects.toThrow(DESKTOP_ONLY_ERROR);
    expect(mockInvoke).not.toHaveBeenCalled();
  });
});
