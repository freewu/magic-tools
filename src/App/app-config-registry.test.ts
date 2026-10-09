import { loadAppConfigs, saveAppConfigs } from './app-config-registry';

// app-modules 用 import.meta.glob (Vite 专用), 测试中改为可注入的假枚举表
jest.mock('./app-modules', () => {
  const mod = {
    getDefaultMode: () => localStorage.getItem('mode') ?? 'CBC',
    setDefaultMode: (v: unknown) => localStorage.setItem('mode', String(v)),
  };
  return {
    appLibKeys: () => [ 'AESCrypto', 'Empty', 'Broken', 'NoLoader' ],
    libLoader: (key: string) => ({
      AESCrypto: async () => mod,
      Empty: async () => ({ unrelated: 1 }),
      Broken: async () => { throw new Error('boom'); },
    } as Record<string, (() => Promise<Record<string, unknown>>) | undefined>)[key],
  };
});

beforeEach(() => localStorage.clear());

describe('各 app 配置运行时收集 / 写回', () => {
  test('loadAppConfigs 跳过空配置与加载失败的 app', async () => {
    localStorage.setItem('mode', 'GCM');
    await expect(loadAppConfigs()).resolves.toEqual({ AESCrypto: { Mode: 'GCM' } });
  });

  test('saveAppConfigs 经 setDefault* 写回, 未知 app 忽略', async () => {
    const count = await saveAppConfigs({ AESCrypto: { Mode: 'ECB' }, Unknown: { Mode: 'X' } });
    expect(count).toBe(1);
    expect(localStorage.getItem('mode')).toBe('ECB');
  });
});
