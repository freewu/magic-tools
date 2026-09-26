import {
  SIDER_WIDTH_DEFAULT,
  SIDER_WIDTH_EVENT,
  SIDER_WIDTH_MAX,
  SIDER_WIDTH_MIN,
  clampSiderWidth,
  getSiderWidth,
  setSiderWidth,
} from './setting';

describe('侧边栏宽度存储 (sider-width)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('未设置时取默认宽度', () => {
    expect(getSiderWidth()).toBe(SIDER_WIDTH_DEFAULT);
  });

  test('非法值回退默认宽度', () => {
    localStorage.setItem('sider-width', '');
    expect(getSiderWidth()).toBe(SIDER_WIDTH_DEFAULT);
    localStorage.setItem('sider-width', 'abc');
    expect(getSiderWidth()).toBe(SIDER_WIDTH_DEFAULT);
    localStorage.setItem('sider-width', '0');
    expect(getSiderWidth()).toBe(SIDER_WIDTH_DEFAULT);
    localStorage.setItem('sider-width', '-20');
    expect(getSiderWidth()).toBe(SIDER_WIDTH_DEFAULT);
  });

  test('越界值被夹紧到上下限', () => {
    localStorage.setItem('sider-width', '10');
    expect(getSiderWidth()).toBe(SIDER_WIDTH_MIN);
    localStorage.setItem('sider-width', '9999');
    expect(getSiderWidth()).toBe(SIDER_WIDTH_MAX);
  });

  test('clampSiderWidth: 四舍五入 + 夹紧 + 非法值兜底', () => {
    expect(clampSiderWidth(260.6)).toBe(261);
    expect(clampSiderWidth(100)).toBe(SIDER_WIDTH_MIN);
    expect(clampSiderWidth(1000)).toBe(SIDER_WIDTH_MAX);
    expect(clampSiderWidth(Number.NaN)).toBe(SIDER_WIDTH_DEFAULT);
  });

  test('setSiderWidth 持久化夹紧后的值并广播事件', () => {
    const seen: number[] = [];
    const onWidth = (e: Event) => seen.push((e as CustomEvent<number>).detail);
    window.addEventListener(SIDER_WIDTH_EVENT, onWidth);
    setSiderWidth(300.4);
    expect(localStorage.getItem('sider-width')).toBe('300');
    expect(getSiderWidth()).toBe(300);
    setSiderWidth(9999);
    expect(localStorage.getItem('sider-width')).toBe(String(SIDER_WIDTH_MAX));
    window.removeEventListener(SIDER_WIDTH_EVENT, onWidth);
    expect(seen).toEqual([ 300, SIDER_WIDTH_MAX ]);
  });
});
