// 应用中心展示分类的 React 订阅 hook
// 设置里勾选 / 取消勾选会广播 VISIBLE_TYPES_EVENT, 应用中心与左侧菜单据此实时过滤,
// 无需刷新页面 (「我的收藏」不订阅此事件, 因此不受影响)
import { useEffect, useState } from 'react';
import {
  VISIBLE_TYPES_EVENT,
  VISIBLE_TYPES_STORAGE_KEY,
  getVisibleAppTypes,
} from '../lib/app-type-filter';

/** 订阅当前展示的分类 key 列表 (随设置变化实时更新) */
export const useVisibleAppTypes = () :string[] => {
  const [ list, setList ] = useState<string[]>(() => getVisibleAppTypes());

  useEffect(() => {
    const onChange = (e :Event) => {
      const detail = (e as CustomEvent<string[]>).detail;
      setList(Array.isArray(detail) ? detail : getVisibleAppTypes());
    };
    // 其它标签页 / 窗口改动时同步 (storage 事件不会在本页触发)
    const onStorage = (e :StorageEvent) => {
      if (e.key === null || e.key === VISIBLE_TYPES_STORAGE_KEY) setList(getVisibleAppTypes());
    };
    window.addEventListener(VISIBLE_TYPES_EVENT, onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(VISIBLE_TYPES_EVENT, onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return list;
};

export default useVisibleAppTypes;
