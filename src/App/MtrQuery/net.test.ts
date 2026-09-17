// MTR 查询网络层: 断言 invoke 参数映射与浏览器环境拦截

import { DESKTOP_ONLY_ERROR, mtrProbe, mtrResolve, reverseDns } from './net';

const mockInvoke = jest.fn();
const mockIsTauri = jest.fn(() => true);

jest.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));
jest.mock('../../lib/tauri', () => ({
  isTauri: () => mockIsTauri(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockIsTauri.mockReturnValue(true);
  mockInvoke.mockResolvedValue(null);
});

describe('MtrQuery net', () => {
  test('mtrResolve 参数与命令名', async () => {
    await mtrResolve('example.com');
    expect(mockInvoke).toHaveBeenCalledWith('mtr_resolve', { host: 'example.com' });
  });

  test('mtrProbe 传递 host / ttl / timeoutMs', async () => {
    await mtrProbe('1.1.1.1', 3, 1000);
    expect(mockInvoke).toHaveBeenCalledWith('mtr_probe', { host: '1.1.1.1', ttl: 3, timeoutMs: 1000 });
  });

  test('reverseDns 结果为 null 时返回空串', async () => {
    mockInvoke.mockResolvedValue(null);
    await expect(reverseDns('1.1.1.1')).resolves.toBe('');
    mockInvoke.mockResolvedValue('one.one.one.one');
    await expect(reverseDns('1.1.1.1')).resolves.toBe('one.one.one.one');
    expect(mockInvoke).toHaveBeenCalledWith('reverse_dns', { ip: '1.1.1.1' });
  });

  test('后端错误向上抛出', async () => {
    mockInvoke.mockRejectedValue(new Error('探测任务异常退出'));
    await expect(mtrProbe('1.1.1.1', 1, 1000)).rejects.toThrow('探测任务异常退出');
  });

  test('浏览器环境直接抛错且不触发 invoke', async () => {
    mockIsTauri.mockReturnValue(false);
    await expect(mtrResolve('example.com')).rejects.toThrow(DESKTOP_ONLY_ERROR);
    await expect(mtrProbe('1.1.1.1', 1, 1000)).rejects.toThrow(DESKTOP_ONLY_ERROR);
    await expect(reverseDns('1.1.1.1')).rejects.toThrow(DESKTOP_ONLY_ERROR);
    expect(mockInvoke).not.toHaveBeenCalled();
  });
});
