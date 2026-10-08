// 收藏列表的 React 订阅 hook
// 收藏/取消收藏会广播 FAVORITE_EVENT, 所有使用方 (应用中心卡片 / 收藏页 / 悬浮入口)
// 据此实时更新, 无需手动刷新
import { useEffect, useState } from 'react';
import { FAVORITE_EVENT, getFavorites } from '../lib/favorite';

/** 订阅当前收藏的应用 key 列表 (随收藏/取消收藏实时变化) */
export const useFavorites = () :string[] => {
  const [ list, setList ] = useState<string[]>(() => getFavorites());

  useEffect(() => {
    const onChange = (e :Event) => {
      const detail = (e as CustomEvent<string[]>).detail;
      setList(Array.isArray(detail) ? detail : getFavorites());
    };
    window.addEventListener(FAVORITE_EVENT, onChange);
    return () => window.removeEventListener(FAVORITE_EVENT, onChange);
  }, []);

  return list;
};

export default useFavorites;
