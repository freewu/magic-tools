// 我的收藏 (Favorites) 默认配置
//
// 约定: getDefault<Item> / setDefault<Item> 成对函数 (设置中心「导出配置」会收集,
// 导入时经 setDefault* 写回)。

const GROUP_BY_TYPE_ITEM = 'favorites:group-by-type';

/** 分组开关变更事件 (设置页 → 收藏页实时同步) */
export const GROUP_BY_TYPE_EVENT = 'favorites:group-by-type-changed';

// 获取收藏是否按类型分组展示 (默认关闭: 平铺展示)
export function getDefaultGroupByType() :boolean {
  try {
    return localStorage.getItem(GROUP_BY_TYPE_ITEM) === 'true';
  } catch (e) {
    return false;
  }
}

// 设置收藏是否按类型分组展示
export function setDefaultGroupByType(value :boolean) :void {
  try {
    localStorage.setItem(GROUP_BY_TYPE_ITEM, value ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent(GROUP_BY_TYPE_EVENT, { detail: value }));
  } catch (e) { /* ignore */ }
}
