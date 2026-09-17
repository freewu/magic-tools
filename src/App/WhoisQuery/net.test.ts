// Whois 查询网络层: 断言 invoke 参数与浏览器环境拦截

import { DESKTOP_ONLY_ERROR, whoisQuery } from './net';

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
  mockInvoke.mockResolvedValue({ query: 'example.com', kind: 'domain', sections: [] });
});

describe('WhoisQuery net', () => {
  test('查询参数与后端命令名一致', async () => {
    await whoisQuery('example.com');
    expect(mockInvoke).toHaveBeenCalledWith('whois_query', { query: 'example.com' });
  });

  test('IP 查询原样传递', async () => {
    await whoisQuery('8.8.8.8');
    expect(mockInvoke).toHaveBeenCalledWith('whois_query', { query: '8.8.8.8' });
  });

  test('后端错误向上抛出', async () => {
    mockInvoke.mockRejectedValue(new Error('连接 whois.verisign-grs.com:43 失败'));
    await expect(whoisQuery('example.com')).rejects.toThrow('连接 whois.verisign-grs.com:43 失败');
  });

  test('浏览器环境直接抛错且不触发 invoke', async () => {
    mockIsTauri.mockReturnValue(false);
    await expect(whoisQuery('example.com')).rejects.toThrow(DESKTOP_ONLY_ERROR);
    expect(mockInvoke).not.toHaveBeenCalled();
  });
});
