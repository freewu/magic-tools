// 获取侧边栏展示状态 true 展开 false 关闭 
export function getSiderFlag()  {
  const siderFlag = localStorage.getItem('sider-flag');
  return (siderFlag === "true")? true : false;
}

// 侧边栏宽度 (左右两栏分隔条可拖动调整, 单位 px)
const SIDER_WIDTH_ITEM = 'sider-width';
/** 侧边栏默认宽度 (与历史固定值一致) */
export const SIDER_WIDTH_DEFAULT = 230;
/** 侧边栏最小宽度 (低于菜单文字宽度会换行, 且与 CSS 的 min-width 留出余量) */
export const SIDER_WIDTH_MIN = 180;
/** 侧边栏最大宽度 (再宽会挤压右侧内容区) */
export const SIDER_WIDTH_MAX = 420;
/** 侧边栏宽度变化事件: 设置中心调整时让侧边栏实时更新 (无需重启) */
export const SIDER_WIDTH_EVENT = 'sider-width-change';

/** 把宽度限制在 [SIDER_WIDTH_MIN, SIDER_WIDTH_MAX] 并取整 */
export function clampSiderWidth(width: number) :number {
  if (!Number.isFinite(width)) return SIDER_WIDTH_DEFAULT;
  return Math.min(SIDER_WIDTH_MAX, Math.max(SIDER_WIDTH_MIN, Math.round(width)));
}

// 获取侧边栏宽度 (未设置 / 非法 / 越界时回退默认值并夹紧)
export function getSiderWidth() :number {
  const raw = localStorage.getItem(SIDER_WIDTH_ITEM);
  if (raw === null || raw.trim() === '') return SIDER_WIDTH_DEFAULT;
  const width = Number(raw);
  if (!Number.isFinite(width) || width <= 0) return SIDER_WIDTH_DEFAULT;
  return clampSiderWidth(width);
}

// 设置侧边栏宽度: 夹紧后持久化, 并广播事件让已挂载的侧边栏同步更新
export function setSiderWidth(width: number) :void {
  const value = clampSiderWidth(width);
  try {
    localStorage.setItem(SIDER_WIDTH_ITEM, String(value));
  } catch {
    // 隐私模式等写入失败时忽略 (本次会话内仍可拖动, 只是不记忆)
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<number>(SIDER_WIDTH_EVENT, { detail: value }));
  }
}

// 获取默认展示的 app
import { getDefaultApp } from "../App/AppStore/lib"
export {
  getDefaultApp
}
