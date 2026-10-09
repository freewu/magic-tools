// 各 app 配置的运行时收集 / 应用 (Vite 侧)
//
// 通过 app-modules 的 import.meta.glob 枚举 src/App/<app>/lib.ts,
// 交由 src/lib/app-config.ts 的纯函数按 getDefault*/setDefault* 成对函数收集与写回。
// 说明: 各 lib 模块按需动态加载 (不影响首屏体积), 单个模块加载失败只跳过该 app。
import { appLibKeys, libLoader } from './app-modules';
import { applyAppConfigs, collectAppConfigs, type AppConfigMap, type AppLibSource } from '../lib/app-config';

/** 动态加载全部 app 的 lib 模块 (并行, 失败的跳过) */
async function loadSources(): Promise<AppLibSource[]> {
  const keys = appLibKeys();
  const list = await Promise.all(keys.map(async (key): Promise<AppLibSource | null> => {
    const loader = libLoader(key);
    if (!loader) return null;
    try {
      return { key, mod: await loader() };
    } catch (err) {
      console.error('加载应用配置失败:', key, err);
      return null;
    }
  }));
  return list.filter((item): item is AppLibSource => item !== null);
}

/** 收集全部 app 的当前配置 (经各 app 的 getDefault* 函数) */
export async function loadAppConfigs(): Promise<AppConfigMap> {
  return collectAppConfigs(await loadSources());
}

/** 把配置文件中各 app 的配置写回 (经各 app 的 setDefault* 函数), 返回写入项数 */
export async function saveAppConfigs(map: AppConfigMap): Promise<number> {
  return applyAppConfigs(await loadSources(), map);
}
