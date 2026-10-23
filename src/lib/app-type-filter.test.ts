import {
  ALL_APP_TYPES,
  VISIBLE_TYPES_EVENT,
  VISIBLE_TYPES_STORAGE_KEY,
  getVisibleAppTypes,
  isAppTypeVisible,
  normalizeVisibleTypes,
  resetVisibleAppTypes,
  setVisibleAppTypes,
  toggleAppTypeVisible,
} from './app-type-filter';
import { APP_TYPES } from '../App/app-types';

describe('应用中心展示分类 (visible-app-types)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('默认全部展示, 且顺序与 APP_TYPES 一致', () => {
    expect(getVisibleAppTypes()).toEqual(APP_TYPES.map((t) => t.key));
    expect(ALL_APP_TYPES).toEqual(APP_TYPES.map((t) => t.key));
  });

  test('非法值 / 损坏 JSON 回退为全部展示', () => {
    localStorage.setItem(VISIBLE_TYPES_STORAGE_KEY, '');
    expect(getVisibleAppTypes()).toEqual(ALL_APP_TYPES);
    localStorage.setItem(VISIBLE_TYPES_STORAGE_KEY, '{oops');
    expect(getVisibleAppTypes()).toEqual(ALL_APP_TYPES);
    localStorage.setItem(VISIBLE_TYPES_STORAGE_KEY, JSON.stringify('game'));
    expect(getVisibleAppTypes()).toEqual(ALL_APP_TYPES);
  });

  test('规范化: 过滤未知分类 / 去重 / 按 APP_TYPES 顺序', () => {
    expect(normalizeVisibleTypes([ 'game', 'convert', 'game', 'unknown', 1, null ]))
      .toEqual([ 'convert', 'game' ]);
    // 显式空数组 = 一个都不展示 (区别于「未设置」)
    expect(normalizeVisibleTypes([])).toEqual([]);
    expect(normalizeVisibleTypes(null)).toEqual(ALL_APP_TYPES);
  });

  test('写入后立即生效并持久化, 空数组也被保留', () => {
    expect(setVisibleAppTypes([ 'crypto', 'game' ])).toEqual([ 'crypto', 'game' ]);
    expect(JSON.parse(localStorage.getItem(VISIBLE_TYPES_STORAGE_KEY) as string)).toEqual([ 'crypto', 'game' ]);
    expect(getVisibleAppTypes()).toEqual([ 'crypto', 'game' ]);
    setVisibleAppTypes([]);
    expect(getVisibleAppTypes()).toEqual([]);
    expect(isAppTypeVisible('game')).toBe(false);
  });

  test('变更时广播事件 (detail = 最新列表)', () => {
    const seen: string[][] = [];
    const onTypes = (e: Event) => seen.push((e as CustomEvent<string[]>).detail);
    window.addEventListener(VISIBLE_TYPES_EVENT, onTypes);
    setVisibleAppTypes([ 'game' ]);
    toggleAppTypeVisible('convert');
    resetVisibleAppTypes();
    window.removeEventListener(VISIBLE_TYPES_EVENT, onTypes);
    expect(seen).toEqual([ [ 'game' ], [ 'convert', 'game' ], ALL_APP_TYPES ]);
  });

  test('toggleAppTypeVisible: 取消 / 恢复单个分类', () => {
    expect(toggleAppTypeVisible('game')).toEqual(ALL_APP_TYPES.filter((k) => k !== 'game'));
    expect(isAppTypeVisible('game')).toBe(false);
    expect(toggleAppTypeVisible('game')).toEqual(ALL_APP_TYPES);
    expect(isAppTypeVisible('game')).toBe(true);
    // 可传入列表避免重复读取
    expect(isAppTypeVisible('game', [ 'crypto' ])).toBe(false);
  });
});
