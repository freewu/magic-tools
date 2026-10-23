// 应用中心 / 左侧菜单的分类展示开关 (设置 -> 系统设置 -> 应用中心展示类型)
// - 持久化到 localStorage('visible-app-types'), 存分类 key 数组 (顺序无关, 读取时按 APP_TYPES 归一)
// - 未写过的视为「全部展示」; 允许全部取消勾选 (此时应用中心为空, 可在设置里重新勾选)
// - 变更时广播 window 自定义事件, 已挂载的应用中心 / 左侧菜单实时同步
// - 只影响「应用中心」与「左侧菜单」两个列表, 不影响「我的收藏」的展示
// - 纯函数实现 (不依赖 React), 便于单测; React 侧订阅见 src/hook/use-visible-app-types.ts
import { APP_TYPES } from '../App/app-types';

/** localStorage key */
export const VISIBLE_TYPES_STORAGE_KEY = 'visible-app-types';

/** 展示类型变更事件名 (detail = 最新的分类 key 列表) */
export const VISIBLE_TYPES_EVENT = 'visible-app-types-change';

/** 全部分类 key (按 APP_TYPES 规范顺序) */
export const ALL_APP_TYPES: string[] = APP_TYPES.map((t) => t.key);

/**
 * 规范化分类列表: 仅保留合法分类 key 并去重, 结果按 APP_TYPES 顺序排列
 * (非法输入按「全部展示」处理, 显式传入的空数组表示「一个都不展示」)
 */
export const normalizeVisibleTypes = (input :unknown) :string[] => {
  if (!Array.isArray(input)) return [ ...ALL_APP_TYPES ];
  const picked = new Set(input.filter((v) :v is string => typeof v === 'string'));
  return ALL_APP_TYPES.filter((key) => picked.has(key));
}

/** 读取展示的分类列表 (无记录 / 非法 / 读取失败时返回全部分类) */
export function getVisibleAppTypes() :string[] {
  try {
    const raw = localStorage.getItem(VISIBLE_TYPES_STORAGE_KEY);
    if (raw === null) return [ ...ALL_APP_TYPES ];
    return normalizeVisibleTypes(JSON.parse(raw));
  } catch {
    return [ ...ALL_APP_TYPES ];
  }
}

/** 指定分类是否展示 (可传入已读取的列表避免重复读取 localStorage) */
export function isAppTypeVisible(key :string, visible :ReadonlyArray<string> = getVisibleAppTypes()) :boolean {
  return visible.includes(key);
}

/**
 * 写入展示的分类列表 (自动去重 / 排序), 持久化并广播变更事件。
 * @returns 实际写入的列表
 */
export function setVisibleAppTypes(list :ReadonlyArray<string>) :string[] {
  const next = normalizeVisibleTypes([ ...list ]);
  try {
    localStorage.setItem(VISIBLE_TYPES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 隐私模式等写入失败时忽略 (本次会话内仍生效, 只是不记忆)
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<string[]>(VISIBLE_TYPES_EVENT, { detail: next }));
  }
  return next;
}

/**
 * 切换单个分类的展示状态
 * @returns 变更后的列表
 */
export function toggleAppTypeVisible(key :string) :string[] {
  const list = getVisibleAppTypes();
  return setVisibleAppTypes(list.includes(key) ? list.filter((k) => k !== key) : [ ...list, key ]);
}

/** 恢复默认 (全部展示) */
export function resetVisibleAppTypes() :string[] {
  return setVisibleAppTypes(ALL_APP_TYPES);
}
