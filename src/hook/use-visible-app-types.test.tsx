import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';
import { useVisibleAppTypes } from './use-visible-app-types';
import {
  ALL_APP_TYPES,
  VISIBLE_TYPES_STORAGE_KEY,
  setVisibleAppTypes,
} from '../lib/app-type-filter';

describe('展示分类订阅 (useVisibleAppTypes)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('初始值取本地存储 (未设置时为全部分类)', () => {
    const { result } = renderHook(() => useVisibleAppTypes());
    expect(result.current).toEqual(ALL_APP_TYPES);
  });

  test('设置变更后实时更新 (无需重新挂载)', () => {
    const { result } = renderHook(() => useVisibleAppTypes());
    act(() => {
      setVisibleAppTypes([ 'game' ]);
    });
    expect(result.current).toEqual([ 'game' ]);
  });

  test('其它标签页修改 (storage 事件) 也能同步', () => {
    const { result } = renderHook(() => useVisibleAppTypes());
    act(() => {
      localStorage.setItem(VISIBLE_TYPES_STORAGE_KEY, JSON.stringify([ 'crypto' ]));
      window.dispatchEvent(new StorageEvent('storage', { key: VISIBLE_TYPES_STORAGE_KEY }));
    });
    expect(result.current).toEqual([ 'crypto' ]);
    // 与展示无关的键变化不影响
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'theme-mode' }));
    });
    expect(result.current).toEqual([ 'crypto' ]);
  });

  test('卸载后不再响应变更', () => {
    const { result, unmount } = renderHook(() => useVisibleAppTypes());
    unmount();
    setVisibleAppTypes([ 'game' ]);
    expect(result.current).toEqual(ALL_APP_TYPES);
  });
});
