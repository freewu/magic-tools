// 应用配置的导入 / 导出 (设置中心 -> 系统设置 -> 配置文件)
//
// 配置文件为 JSON, 结构如下:
// {
//   "app": "magic-tools",
//   "fileVersion": 2,
//   "appVersion": "2.22.1",
//   "exportedAt": "2025-01-02T03:04:05.000Z",
//   "settings": { "theme-mode": "dark", "app-locale": "zh-CN", ... },
//   "apps": { "AESCrypto": { "Mode": "CBC", ... }, ... }
// }
//
// 文件名: magic-tools.config.<appVersion>.<yyyyMMddHHmmss>.json
// 说明: settings 为本应用写入 localStorage 的整份快照 (主题 / 语言 / 侧边栏 / 用户数据等);
//       apps 为各 app 的默认配置 (App/<app>/lib.ts 的 getDefault*/setDefault* 成对函数),
//       导出时经 getter 读取, 导入时经 setter 写回。导入覆盖同名键并保留未涉及的键。
import { getVersion } from '../version';
import { normalizeAppConfigMap, type AppConfigMap } from './app-config';

/** 配置文件的应用标识 (校验用) */
export const CONFIG_APP_ID = 'magic-tools';
/** 配置文件结构版本 (结构不兼容变更时递增; 2 起增加 apps 字段) */
export const CONFIG_FILE_VERSION = 2;
/** 导出文件名前缀 */
export const CONFIG_FILE_PREFIX = 'magic-tools.config';
/** 纯 UI 临时状态, 不参与导入导出 (设置中心当前选中分类) */
export const CONFIG_EXCLUDE_KEYS: readonly string[] = ['setting-active-category'];

/** 配置文件对象结构 */
export interface AppConfig {
  /** 应用标识, 固定为 'magic-tools' */
  app: string;
  /** 配置文件结构版本 */
  fileVersion: number;
  /** 导出时的应用版本号 */
  appVersion: string;
  /** 导出时间 (ISO 8601) */
  exportedAt: string;
  /** 全部配置键值 (localStorage 快照) */
  settings: Record<string, string>;
  /** 各 app 的默认配置 (按 appKey 分组, 可选) */
  apps?: AppConfigMap;
}

/** 解析配置失败的原因码 (供 UI 本地化文案) */
export type ConfigErrorCode =
  | 'invalid-json'
  | 'invalid-format'
  | 'not-magic-tools'
  | 'missing-settings';

/** 配置文件解析错误 */
export class ConfigError extends Error {
  code: ConfigErrorCode;

  constructor(code: ConfigErrorCode) {
    super(code);
    this.name = 'ConfigError';
    this.code = code;
  }
}

/** 两位补零 */
const pad2 = (n: number): string => String(n).padStart(2, '0');

/** 时间戳 yyyyMMddHHmmss (本地时间), 用于导出文件名 */
export function formatConfigStamp(date: Date = new Date()): string {
  return (
    `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}` +
    `${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`
  );
}

/** 导出文件名: magic-tools.config.<version>.<yyyyMMddHHmmss>.json */
export function configFileName(version: string = getVersion(), date: Date = new Date()): string {
  return `${CONFIG_FILE_PREFIX}.${version}.${formatConfigStamp(date)}.json`;
}

/** 收集当前 localStorage 中可导出的配置项 (排除纯 UI 状态) */
export function collectSettings(): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key === null || CONFIG_EXCLUDE_KEYS.includes(key)) continue;
    const value = localStorage.getItem(key);
    if (value !== null) out[key] = value;
  }
  return out;
}

/** 生成当前配置对象 (含应用版本号与导出时间; apps 由调用方经各 app 的 getter 收集后传入) */
export function buildConfig(date: Date = new Date(), apps?: AppConfigMap): AppConfig {
  const config: AppConfig = {
    app: CONFIG_APP_ID,
    fileVersion: CONFIG_FILE_VERSION,
    appVersion: getVersion(),
    exportedAt: date.toISOString(),
    settings: collectSettings(),
  };
  if (apps !== undefined) config.apps = apps;
  return config;
}

/** 序列化配置 (缩进 2 空格, 便于人工查看与 diff) */
export function serializeConfig(config: AppConfig): string {
  return JSON.stringify(config, null, 2);
}

/** 解析并校验配置文本, 非法时抛 ConfigError */
export function parseConfig(text: string): AppConfig {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ConfigError('invalid-json');
  }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ConfigError('invalid-format');
  }
  const obj = raw as Record<string, unknown>;
  if (obj.app !== CONFIG_APP_ID) throw new ConfigError('not-magic-tools');
  const rawSettings = obj.settings;
  const hasSettings = rawSettings !== null && typeof rawSettings === 'object' && !Array.isArray(rawSettings);
  const apps = normalizeAppConfigMap(obj.apps);
  // settings 与 apps 至少有一个, 否则视为缺少配置内容
  if (!hasSettings && Object.keys(apps).length === 0) {
    throw new ConfigError('missing-settings');
  }
  // 仅接收字符串值, 过滤被排除的键, 保证写回 localStorage 安全
  const settings: Record<string, string> = {};
  if (hasSettings) {
    for (const [key, value] of Object.entries(rawSettings as Record<string, unknown>)) {
      if (CONFIG_EXCLUDE_KEYS.includes(key)) continue;
      if (typeof value === 'string') settings[key] = value;
    }
  }
  return {
    app: CONFIG_APP_ID,
    fileVersion: typeof obj.fileVersion === 'number' ? obj.fileVersion : CONFIG_FILE_VERSION,
    appVersion: typeof obj.appVersion === 'string' ? obj.appVersion : '',
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : '',
    settings,
    apps,
  };
}

/** 把配置写回 localStorage (覆盖同名键, 保留未涉及的键), 返回写入条数 */
export function applyConfig(config: AppConfig): number {
  let count = 0;
  for (const [key, value] of Object.entries(config.settings)) {
    if (CONFIG_EXCLUDE_KEYS.includes(key)) continue;
    try {
      localStorage.setItem(key, value);
      count += 1;
    } catch {
      // 隐私模式 / 配额不足时忽略单条失败
    }
  }
  return count;
}

/** 刷新页面让导入的配置全面生效 (主题 / 语言 / 侧边栏等仅在初始化时读取) */
export function reloadPage(): void {
  try {
    window.location.reload();
  } catch {
    // jsdom 等非浏览器环境忽略
  }
}
