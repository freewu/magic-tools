import {
  applyAppConfig,
  applyAppConfigs,
  collectAppConfig,
  collectAppConfigs,
  itemNameOf,
  normalizeAppConfigMap,
  type AppLibModule,
} from './app-config';

/** 模拟一个 app 的 lib.ts: 成对 getDefault<Item> / setDefault<Item> 加干扰项 */
const makeModule = (): AppLibModule => ({
  getDefaultMode: () => localStorage.getItem('m') ?? 'CBC',
  setDefaultMode: (v: unknown) => localStorage.setItem('m', String(v)),
  getDefaultSize: () => ({ w: 640, h: 480 }),
  // 多参 setter, 由对象值顺序展开
  setDefaultSize: (w: unknown, h: unknown) => {
    localStorage.setItem('w', String(w));
    localStorage.setItem('h', String(h));
  },
  // 有参 getter: 不是配置读取函数, 应跳过
  getDefaultType: (ut: unknown) => `type:${String(ut)}`,
  setDefaultType: (v: unknown) => localStorage.setItem('type', String(v)),
  // 无同名 setter, 应跳过
  getDefaultOrphan: () => 'orphan',
  // 非 getDefault 前缀
  getMode: () => 'other',
});

describe('app 配置项名解析', () => {
  test('itemNameOf 提取 getDefault 后缀', () => {
    expect(itemNameOf('getDefaultMode')).toBe('Mode');
    expect(itemNameOf('getDefault')).toBeNull();
    expect(itemNameOf('getMode')).toBeNull();
    expect(itemNameOf('setDefaultMode')).toBeNull();
  });
});

describe('app 配置收集 (getDefault*)', () => {
  beforeEach(() => localStorage.clear());

  test('仅收集无参且存在同名 setter 的项', () => {
    localStorage.setItem('m', 'GCM');
    expect(collectAppConfig(makeModule())).toEqual({
      Mode: 'GCM',
      Size: { w: 640, h: 480 },
    });
  });

  test('空配置的 app 不写入结果, 失败模块被跳过', () => {
    const map = collectAppConfigs([
      { key: 'AESCrypto', mod: makeModule() },
      { key: 'Empty', mod: {} },
    ]);
    expect(Object.keys(map)).toEqual([ 'AESCrypto' ]);
  });
});

describe('app 配置写回 (setDefault*)', () => {
  beforeEach(() => localStorage.clear());

  test('单参 setter 直接调用, 多参 setter 按对象值展开', () => {
    const count = applyAppConfig(makeModule(), { Mode: 'GCM', Size: { w: 800, h: 600 } });
    expect(count).toBe(2);
    expect(localStorage.getItem('m')).toBe('GCM');
    expect(localStorage.getItem('w')).toBe('800');
    expect(localStorage.getItem('h')).toBe('600');
    // 有参 getter 对应的项即使出现也不写入
    expect(localStorage.getItem('type')).toBeNull();
  });

  test('批量写回仅处理配置中出现的 app', () => {
    const count = applyAppConfigs(
      [ { key: 'AESCrypto', mod: makeModule() } ],
      { AESCrypto: { Mode: 'ECB' }, Unknown: { Mode: 'X' } },
    );
    expect(count).toBe(1);
    expect(localStorage.getItem('m')).toBe('ECB');
  });
});

describe('apps 字段规整', () => {
  test('仅保留对象型条目, 非对象 / 数组 / null 丢弃', () => {
    expect(normalizeAppConfigMap({
      A: { Mode: 'CBC' },
      B: 'bad',
      C: null,
      D: [ 1, 2 ],
    })).toEqual({ A: { Mode: 'CBC' } });
    expect(normalizeAppConfigMap(null)).toEqual({});
    expect(normalizeAppConfigMap([ 'x' ])).toEqual({});
  });
});
