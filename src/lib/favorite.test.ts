import {
  FAVORITE_EVENT,
  clearFavorites,
  getFavorites,
  isFavorite,
  normalizeFavorites,
  setFavorite,
  setFavorites,
  toggleFavorite,
} from './favorite';

beforeEach(() => {
  localStorage.clear();
});

describe('normalizeFavorites', () => {
  test('非数组返回空数组', () => {
    expect(normalizeFavorites(null)).toEqual([]);
    expect(normalizeFavorites('AES')).toEqual([]);
    expect(normalizeFavorites(undefined)).toEqual([]);
  });

  test('过滤非字符串与空串, 并按首次出现去重', () => {
    expect(normalizeFavorites(['a', 1, '', 'b', null, 'a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
  });
});

describe('收藏列表持久化', () => {
  test('默认无收藏', () => {
    expect(getFavorites()).toEqual([]);
    expect(isFavorite('AES')).toBe(false);
  });

  test('setFavorite(true) 追加收藏并持久化', () => {
    expect(setFavorite('AES', true)).toEqual(['AES']);
    expect(setFavorite('SM4', true)).toEqual(['AES', 'SM4']);
    expect(getFavorites()).toEqual(['AES', 'SM4']);
    expect(isFavorite('SM4')).toBe(true);
  });

  test('重复收藏不产生重复项', () => {
    setFavorite('AES', true);
    expect(setFavorite('AES', true)).toEqual(['AES']);
  });

  test('setFavorite(false) 取消收藏', () => {
    setFavorites(['AES', 'SM4']);
    expect(setFavorite('AES', false)).toEqual(['SM4']);
    expect(isFavorite('AES')).toBe(false);
  });

  test('toggleFavorite 切换并返回最新状态', () => {
    expect(toggleFavorite('AES')).toBe(true);
    expect(isFavorite('AES')).toBe(true);
    expect(toggleFavorite('AES')).toBe(false);
    expect(isFavorite('AES')).toBe(false);
  });

  test('clearFavorites 清空', () => {
    setFavorites(['AES', 'SM4']);
    clearFavorites();
    expect(getFavorites()).toEqual([]);
  });

  test('非法 JSON 容错为无收藏', () => {
    localStorage.setItem('favorite-apps', '{not json');
    expect(getFavorites()).toEqual([]);
  });

  test('变更时广播 FAVORITE_EVENT (detail 为最新列表)', () => {
    const seen: string[][] = [];
    const on = (e: Event) => seen.push((e as CustomEvent<string[]>).detail);
    window.addEventListener(FAVORITE_EVENT, on);
    setFavorite('AES', true);
    setFavorite('SM4', true);
    clearFavorites();
    window.removeEventListener(FAVORITE_EVENT, on);
    expect(seen).toEqual([['AES'], ['AES', 'SM4'], []]);
  });
});
