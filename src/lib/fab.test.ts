import { FAB_POS_DEFAULT, clamp01, getFabPos, setFabPos } from './fab';

beforeEach(() => {
  localStorage.clear();
});

describe('clamp01', () => {
  test('夹紧到 [0, 1]', () => {
    expect(clamp01(-2)).toBe(0);
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(1.7)).toBe(1);
    expect(clamp01(1)).toBe(1);
  });

  test('非有限数回退 0', () => {
    expect(clamp01(NaN)).toBe(0);
    expect(clamp01(Infinity)).toBe(0);
  });
});

describe('悬浮入口位置', () => {
  test('默认位置', () => {
    expect(getFabPos()).toEqual(FAB_POS_DEFAULT);
  });

  test('写入后可读回 (夹紧保存)', () => {
    setFabPos({ x: 2, y: -1 });
    expect(getFabPos()).toEqual({ x: 1, y: 0 });
    setFabPos({ x: 0.25, y: 0.5 });
    expect(getFabPos()).toEqual({ x: 0.25, y: 0.5 });
  });

  test('非法存储值回退默认', () => {
    localStorage.setItem('favorites-fab-pos', '{bad json');
    expect(getFabPos()).toEqual(FAB_POS_DEFAULT);
    localStorage.setItem('favorites-fab-pos', JSON.stringify({ x: 'a', y: 2 }));
    expect(getFabPos()).toEqual(FAB_POS_DEFAULT);
  });
});
