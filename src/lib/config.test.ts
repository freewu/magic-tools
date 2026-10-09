import {
  CONFIG_APP_ID,
  CONFIG_EXCLUDE_KEYS,
  CONFIG_FILE_PREFIX,
  CONFIG_FILE_VERSION,
  ConfigError,
  applyConfig,
  buildConfig,
  collectSettings,
  configFileName,
  formatConfigStamp,
  parseConfig,
  serializeConfig,
  type AppConfig,
} from './config';
import { getVersion } from '../version';

/** 固定一个本地时间点用于断言时间戳与文件名 */
const FIXED = new Date(2025, 0, 2, 3, 4, 5);

describe('配置文件名 (含版本号与时间)', () => {
  test('formatConfigStamp 输出 yyyyMMddHHmmss', () => {
    expect(formatConfigStamp(FIXED)).toBe('20250102030405');
    expect(formatConfigStamp(new Date(2024, 11, 31, 23, 59, 9))).toBe('20241231235909');
  });

  test('configFileName 形如 magic-tools.config.<version>.<stamp>.json', () => {
    expect(configFileName('9.9.9', FIXED)).toBe('magic-tools.config.9.9.9.20250102030405.json');
    // 默认取当前应用版本, 前缀固定
    expect(configFileName(undefined, FIXED).startsWith(`${CONFIG_FILE_PREFIX}.${getVersion()}.20250102030405`)).toBe(true);
  });
});

describe('配置导出', () => {
  beforeEach(() => localStorage.clear());

  test('buildConfig 带应用标识 / 结构版本 / 应用版本 / 导出时间与设置快照', () => {
    localStorage.setItem('theme-mode', 'dark');
    localStorage.setItem('app-locale', 'en');
    const config = buildConfig(FIXED);
    expect(config.app).toBe(CONFIG_APP_ID);
    expect(config.fileVersion).toBe(CONFIG_FILE_VERSION);
    expect(config.appVersion).toBe(getVersion());
    expect(config.exportedAt).toBe(FIXED.toISOString());
    expect(config.settings).toEqual({ 'theme-mode': 'dark', 'app-locale': 'en' });
  });

  test('纯 UI 状态不参与导出', () => {
    localStorage.setItem('sider-width', '260');
    localStorage.setItem(CONFIG_EXCLUDE_KEYS[0], 'crypto');
    expect(collectSettings()).toEqual({ 'sider-width': '260' });
  });

  test('serializeConfig 输出可读 JSON', () => {
    const config: AppConfig = {
      app: CONFIG_APP_ID,
      fileVersion: CONFIG_FILE_VERSION,
      appVersion: '1.2.3',
      exportedAt: FIXED.toISOString(),
      settings: { 'theme-mode': 'light' },
    };
    const text = serializeConfig(config);
    expect(text).toContain('\n  "app"');
    expect(JSON.parse(text)).toEqual(config);
  });

  test('buildConfig 传入 apps 时写入各 app 配置', () => {
    localStorage.setItem('theme-mode', 'dark');
    const config = buildConfig(FIXED, { AESCrypto: { Mode: 'CBC' } });
    expect(config.apps).toEqual({ AESCrypto: { Mode: 'CBC' } });
    // 不传时不含 apps 字段, 保持兼容
    expect(buildConfig(FIXED).apps).toBeUndefined();
  });
});

describe('配置导入', () => {
  beforeEach(() => localStorage.clear());

  test('解析合法配置并写回 localStorage (覆盖同名键, 保留其它键)', () => {
    localStorage.setItem('theme-mode', 'light');
    localStorage.setItem('untouched', '1');
    const text = JSON.stringify({
      app: CONFIG_APP_ID,
      fileVersion: CONFIG_FILE_VERSION,
      appVersion: '2.0.0',
      exportedAt: FIXED.toISOString(),
      settings: { 'theme-mode': 'dark', 'app-locale': 'en' },
    });

    const config = parseConfig(text);
    const count = applyConfig(config);

    expect(count).toBe(2);
    expect(localStorage.getItem('theme-mode')).toBe('dark');
    expect(localStorage.getItem('app-locale')).toBe('en');
    expect(localStorage.getItem('untouched')).toBe('1'); // 未涉及的键保留
  });

  test('导入时忽略被排除的键与非字符串值', () => {
    const text = JSON.stringify({
      app: CONFIG_APP_ID,
      settings: { 'sider-width': '300', [CONFIG_EXCLUDE_KEYS[0]]: 'misc', bad: 123 },
    });
    const config = parseConfig(text);
    expect(config.settings).toEqual({ 'sider-width': '300' });
  });

  test('缺省字段回退 (fileVersion / appVersion / exportedAt)', () => {
    const config = parseConfig(JSON.stringify({ app: CONFIG_APP_ID, settings: {} }));
    expect(config.fileVersion).toBe(CONFIG_FILE_VERSION);
    expect(config.appVersion).toBe('');
    expect(config.exportedAt).toBe('');
  });

  test('解析 apps 字段 (按 app 分组) 并仅保留对象条目', () => {
    const config = parseConfig(JSON.stringify({
      app: CONFIG_APP_ID,
      settings: {},
      apps: {
        AESCrypto: { Mode: 'CBC', Padding: 'Pkcs7' },
        Broken: 'not-object',
      },
    }));
    expect(config.apps).toEqual({ AESCrypto: { Mode: 'CBC', Padding: 'Pkcs7' } });
  });

  test('仅含 apps 的配置文件也可导入', () => {
    const config = parseConfig(JSON.stringify({ app: CONFIG_APP_ID, apps: { BOMCheck: { Bom: 'utf8' } } }));
    expect(config.settings).toEqual({});
    expect(config.apps).toEqual({ BOMCheck: { Bom: 'utf8' } });
  });

  test('非法内容抛出带错误码的 ConfigError', () => {
    const codes = (text: string) => {
      try {
        parseConfig(text);
        return '';
      } catch (err) {
        return err instanceof ConfigError ? err.code : 'unknown';
      }
    };
    expect(codes('{ not json')).toBe('invalid-json');
    expect(codes('[]')).toBe('invalid-format');
    expect(codes(JSON.stringify({ app: 'other', settings: {} }))).toBe('not-magic-tools');
    expect(codes(JSON.stringify({ app: CONFIG_APP_ID }))).toBe('missing-settings');
  });

  test('导出 -> 导入 往返一致', () => {
    localStorage.setItem('theme-mode', 'dark');
    localStorage.setItem('regex-presets', '[{"name":"a"}]');
    const text = serializeConfig(buildConfig(FIXED));

    localStorage.clear();
    applyConfig(parseConfig(text));

    expect(localStorage.getItem('theme-mode')).toBe('dark');
    expect(localStorage.getItem('regex-presets')).toBe('[{"name":"a"}]');
  });
});
