import { pointToString, tencentMapPointToString, bd09Togcj02, gcj02Tobd09, wgs84Togcj02, gcj02Towgs84, outOfChina, getDefaultType, setDefaultType } from './lib';

describe('GPSConvert lib', () => {
  beforeEach(() => localStorage.clear());

  test('pointToString: 经度在前; 腾讯地图纬度在前', () => {
    expect(pointToString({ lng: 116.4, lat: 39.9 })).toBe('116.4,39.9');
    expect(tencentMapPointToString({ lng: 116.4, lat: 39.9 })).toBe('39.9,116.4');
  });

  test('outOfChina: 中国境外判定 (北京/上海在境内, 海外在境外)', () => {
    expect(outOfChina(116.4, 39.9)).toBe(false); // 北京
    expect(outOfChina(121.47, 31.23)).toBe(false); // 上海
    expect(outOfChina(-74.0, 40.7)).toBe(true); // 纽约
    expect(outOfChina(139.7, 35.7)).toBe(true); // 东京
    expect(outOfChina(0, 0)).toBe(true); // 大西洋赤道
  });

  test('百度 ↔ 火星坐标互为逆运算 (往返近似还原)', () => {
    const p = { lng: 116.404, lat: 39.915 };
    const back = gcj02Tobd09(bd09Togcj02(p));
    expect(back.lng).toBeCloseTo(p.lng, 5);
    expect(back.lat).toBeCloseTo(p.lat, 5);
  });

  test('WGS84 ↔ 火星坐标互为逆运算', () => {
    const p = { lng: 116.404, lat: 39.915 };
    const g = wgs84Togcj02(p);
    const back = gcj02Towgs84(g);
    expect(back.lng).toBeCloseTo(p.lng, 5);
    expect(back.lat).toBeCloseTo(p.lat, 5);
  });

  test('默认类型持久化', () => {
    expect(getDefaultType()).toBeDefined();
    setDefaultType('gcj02');
    expect(getDefaultType()).toBe('gcj02');
  });
});
