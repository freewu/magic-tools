// 收藏的应用 (系统级功能)
// - 持久化到 localStorage('favorite-apps'), 存 app key 数组, 按收藏先后顺序 (新收藏追加在末尾)
// - 变更时广播 window 自定义事件, 已挂载的收藏页 / 应用中心卡片 / 悬浮入口实时同步
// - 纯函数实现 (不依赖 React), 便于单测; React 侧订阅见 src/hook/use-favorites.ts
import { moveItem } from './array';

const FAVORITE_KEY = 'favorite-apps';

/** 收藏变更事件名 (detail = 最新的 key 列表) */
export const FAVORITE_EVENT = 'favorite-change';

/** 规范化列表: 仅保留非空字符串并去重 (保持首次出现的顺序) */
export const normalizeFavorites = (input :unknown) :string[] => {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of input) {
    if (typeof item === 'string' && item !== '' && !seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}

/** 读取收藏列表 (无记录 / 非法 / 读取失败时返回空数组) */
export function getFavorites() :string[] {
  try {
    const raw = localStorage.getItem(FAVORITE_KEY);
    if (!raw) return [];
    return normalizeFavorites(JSON.parse(raw));
  } catch {
    return [];
  }
}

/** 是否已收藏 */
export function isFavorite(app :string) :boolean {
  return getFavorites().includes(app);
}

/**
 * 写入收藏列表 (自动去重), 持久化并广播变更事件。
 * @returns 实际写入的列表
 */
export function setFavorites(list :ReadonlyArray<string>) :string[] {
  const next = normalizeFavorites(list);
  try {
    localStorage.setItem(FAVORITE_KEY, JSON.stringify(next));
  } catch {
    // 隐私模式等场景写入失败时忽略 (本次会话内仍可收藏, 只是不记忆)
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<string[]>(FAVORITE_EVENT, { detail: next }));
  }
  return next;
}

/**
 * 收藏 / 取消收藏。
 * @param app 应用 key
 * @param on  true = 收藏, false = 取消收藏
 * @returns 变更后的收藏列表 (无变化时原样返回)
 */
export function setFavorite(app :string, on :boolean) :string[] {
  const list = getFavorites();
  const has = list.includes(app);
  if (on && !has) return setFavorites([...list, app]);
  if (!on && has) return setFavorites(list.filter((k) => k !== app));
  return list;
}

/**
 * 切换收藏状态。
 * @returns 切换后是否处于收藏状态
 */
export function toggleFavorite(app :string) :boolean {
  const next = !isFavorite(app);
  setFavorite(app, next);
  return next;
}

/** 清空全部收藏 */
export function clearFavorites() :void {
  setFavorites([]);
}

/**
 * 调整收藏顺序: 把 from 位置的收藏移到 to 位置 (拖动排序)
 * @returns 变更后的收藏列表
 */
export function moveFavorite(from :number, to :number) :string[] {
  const list = getFavorites();
  const next = moveItem(list, from, to);
  // 顺序未变化时不重复写入 / 广播
  if (next.every((k, i) => k === list[i])) return list;
  return setFavorites(next);
}
