// 每个 app 的默认配置收集 / 应用 (纯函数, 供设置中心「配置文件」导出导入使用)
//
// 约定: App/<appname>/lib.ts 中以成对函数声明配置项:
//   export const getDefault<Item> = () => ...   // 读取当前默认值
//   export const setDefault<Item> = (v) => ...  // 写回默认值
// 本模块按函数名成对匹配 (getDefaultMode <-> setDefaultMode), Item 作为配置项名。
// 说明: 需要入参的 getter (如 getDefaultType(ut)) 或无同名 setter 的 getter 会被跳过;
//       多参 setter (如 setDefaultSize(w, h)) 会按对象/数组值顺序展开。
export type AppLibModule = Record<string, unknown>;
/** 单个 app 的配置项: item 名 -> 值 */
export type AppConfigValues = Record<string, unknown>;
/** 全部 app 配置: appKey -> 配置项 */
export type AppConfigMap = Record<string, AppConfigValues>;
/** appKey + 其 lib 模块 */
export interface AppLibSource {
  key: string;
  mod: AppLibModule;
}

const GET_PREFIX = 'getDefault';
const SET_PREFIX = 'setDefault';

/** 'getDefaultMode' -> 'Mode'; 非 getDefault 前缀或空后缀 -> null */
export function itemNameOf(getterName: string): string | null {
  if (!getterName.startsWith(GET_PREFIX)) return null;
  const item = getterName.slice(GET_PREFIX.length);
  return item.length > 0 ? item : null;
}

/** 判断是否为 thenable (避免把异步 getter 的 Promise 写进配置) */
const isThenable = (v: unknown): boolean =>
  v !== null && (typeof v === 'object' || typeof v === 'function') && typeof (v as { then?: unknown }).then === 'function';

/** 收集单个 app 的配置 (仅无参 getter 且存在同名 setter 的项) */
export function collectAppConfig(mod: AppLibModule): AppConfigValues {
  const out: AppConfigValues = {};
  for (const name of Object.keys(mod)) {
    const item = itemNameOf(name);
    if (item === null) continue;
    const getter = mod[name];
    const setter = mod[SET_PREFIX + item];
    if (typeof getter !== 'function' || typeof setter !== 'function') continue;
    // 需要入参的 getter 不是配置读取函数, 跳过
    if (getter.length > 0) continue;
    try {
      const value = (getter as () => unknown)();
      if (isThenable(value)) continue;
      out[item] = value;
    } catch {
      // 单个 getter 异常不影响其它配置
    }
  }
  return out;
}

/** 批量收集 (空配置的 app 不写入, 保持配置文件精简) */
export function collectAppConfigs(sources: AppLibSource[]): AppConfigMap {
  const map: AppConfigMap = {};
  for (const { key, mod } of sources) {
    const values = collectAppConfig(mod);
    if (Object.keys(values).length > 0) map[key] = values;
  }
  return map;
}

/** 应用单个 app 的配置 (调用同名 setter), 返回成功写入项数 */
export function applyAppConfig(mod: AppLibModule, values: AppConfigValues): number {
  let count = 0;
  for (const [item, value] of Object.entries(values)) {
    if (itemNameOf(GET_PREFIX + item) === null) continue;
    const setter = mod[SET_PREFIX + item];
    if (typeof setter !== 'function') continue;
    try {
      const fn = setter as (...args: unknown[]) => unknown;
      if (fn.length <= 1) {
        fn(value);
      } else if (Array.isArray(value)) {
        fn(...value);
      } else if (value !== null && typeof value === 'object') {
        fn(...Object.values(value as Record<string, unknown>));
      } else {
        fn(value);
      }
      count += 1;
    } catch {
      // 单项写入失败忽略 (如类型不符)
    }
  }
  return count;
}

/** 批量应用, 返回成功写入项数 (配置文件中未知 app / 未知配置项自动忽略) */
export function applyAppConfigs(sources: AppLibSource[], map: AppConfigMap): number {
  let count = 0;
  for (const { key, mod } of sources) {
    const values = map[key];
    if (values === null || typeof values !== 'object' || Array.isArray(values)) continue;
    count += applyAppConfig(mod, values);
  }
  return count;
}

/** 校验并规整配置文件读到的 apps 字段 (仅保留 app -> 普通对象 的条目) */
export function normalizeAppConfigMap(raw: unknown): AppConfigMap {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const map: AppConfigMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) continue;
    map[key] = value as AppConfigValues;
  }
  return map;
}
