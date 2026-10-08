// 收藏悬浮入口 (FAB) 的位置
// - 以「相对可视区域的比例坐标」保存 (x / y ∈ [0, 1], 0=贴左/上, 1=贴右/下),
//   窗口尺寸变化后仍保持在可视范围内, 不会跑到屏幕外
// - 持久化到 localStorage('favorites-fab-pos'), 双击可恢复默认位置
export type FabPos = { x :number, y :number };

const FAB_POS_KEY = 'favorites-fab-pos';

/** 默认位置: 右侧偏下 (不遮挡内容区左上角的主要操作区) */
export const FAB_POS_DEFAULT :FabPos = { x: 1, y: 0.72 };

/** 把比例坐标夹紧到 [0, 1] (非有限数回退 0) */
export const clamp01 = (n :number) :number => {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/** 读取悬浮入口位置 (无记录 / 非法 / 读取失败时回退默认值并夹紧) */
export function getFabPos() :FabPos {
  try {
    const raw = localStorage.getItem(FAB_POS_KEY);
    if (!raw) return FAB_POS_DEFAULT;
    const obj = JSON.parse(raw) as Partial<FabPos> | null;
    if (obj && typeof obj.x === 'number' && typeof obj.y === 'number') {
      return { x: clamp01(obj.x), y: clamp01(obj.y) };
    }
  } catch {
    // ignore
  }
  return FAB_POS_DEFAULT;
}

/** 持久化悬浮入口位置 (夹紧后保存) */
export function setFabPos(pos :FabPos) :void {
  try {
    localStorage.setItem(FAB_POS_KEY, JSON.stringify({ x: clamp01(pos.x), y: clamp01(pos.y) }));
  } catch {
    // 写入失败时忽略 (本次会话内仍可拖动)
  }
}
