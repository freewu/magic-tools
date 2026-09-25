import {
  convertCoordinate,
  CoordError,
  detectFormat,
  formatDD,
  formatDM,
  formatDMS,
  formatNMEA,
  parseCoord,
  splitPair,
} from './lib';
import { sampleList } from './data';

const okFormat = (input: string, format: 'AUTO' | 'DD' | 'DMS' | 'DM' | 'NMEA' = 'AUTO', order: 'latlng' | 'lnglat' = 'latlng') => {
  const r = convertCoordinate(input, { format, order });
  const map: Record<string, { lat: string; lng: string; pair: string }> = {};
  r.rows.forEach((row) => { map[row.key] = { lat: row.lat, lng: row.lng, pair: row.pair }; });
  return { r, map };
};

describe('经纬度格式: 单值解析', () => {
  it('十进制 带符号 / 方向字母', () => {
    expect(parseCoord('39.20567', 'DD').value).toBeCloseTo(39.20567, 9);
    expect(parseCoord('-116.5', 'DD').value).toBeCloseTo(-116.5, 9);
    expect(parseCoord('39.20567N', 'DD').value).toBeCloseTo(39.20567, 9);
    expect(parseCoord('39.20567S', 'DD').value).toBeCloseTo(-39.20567, 9);
    expect(parseCoord('116.5W', 'DD').value).toBeCloseTo(-116.5, 9);
  });

  it('度分秒 (含多种符号分隔)', () => {
    expect(parseCoord('39°12′20.4″N', 'DMS').value).toBeCloseTo(39.2056666, 6);
    expect(parseCoord(`39°12'20.4"N`, 'DMS').value).toBeCloseTo(39.2056666, 6);
    expect(parseCoord('39d12m20.4sN', 'DMS').value).toBeCloseTo(39.2056666, 6);
    expect(parseCoord('39 12 20.4 N', 'DMS').value).toBeCloseTo(39.2056666, 6);
    expect(parseCoord('39°54′27″S', 'DMS').value).toBeCloseTo(-(39 + 54 / 60 + 27 / 3600), 9);
  });

  it('度分', () => {
    expect(parseCoord('116°23.26′E', 'DM').value).toBeCloseTo(116 + 23.26 / 60, 9);
  });

  it('国家标准 DDMM.mm / DDDMM.mm', () => {
    expect(parseCoord('3912.3402N', 'NMEA').value).toBeCloseTo(39 + 12.3402 / 60, 9);
    expect(parseCoord('11607.4070E', 'NMEA').value).toBeCloseTo(116 + 7.407 / 60, 9);
  });

  it('无法识别时抛出 INVALID', () => {
    expect(() => parseCoord('abc', 'DD')).toThrow(CoordError);
  });
});

describe('经纬度格式: 识别 / 切分', () => {
  it('detectFormat 按数字个数与量级判定', () => {
    expect(detectFormat('39.20567')).toBe('DD');
    expect(detectFormat('39.20567N')).toBe('DD');
    expect(detectFormat('39°12′20″N')).toBe('DMS');
    expect(detectFormat('116°23.26′E')).toBe('DM');
    expect(detectFormat('3912.3402N')).toBe('NMEA');
    expect(detectFormat('11607.4070E')).toBe('NMEA');
  });

  it('splitPair 支持逗号 / 方向字母 / 空白', () => {
    expect(splitPair('39.20567, 116.12345')).toEqual(['39.20567', '116.12345']);
    expect(splitPair('39°12′20″N，116°7′24″E')).toEqual(['39°12′20″N', '116°7′24″E']);
    expect(splitPair('39.20567N 116.12345E')).toEqual(['39.20567N', '116.12345E']);
    expect(splitPair('39.20567 116.12345')).toEqual(['39.20567', '116.12345']);
  });
});

describe('经纬度格式: 组合转换', () => {
  it('十进制 -> 四种格式 (golden)', () => {
    const { r, map } = okFormat('39.20567, 116.12345');
    expect(r.lat).toBeCloseTo(39.20567, 9);
    expect(r.lng).toBeCloseTo(116.12345, 9);
    expect(map.DD).toMatchObject({ lat: '39.20567', lng: '116.12345' });
    expect(map.DM).toMatchObject({ lat: '39°12.3402′N', lng: '116°07.407′E' });
    expect(map.DMS).toMatchObject({ lat: '39°12′20.41″N', lng: '116°07′24.42″E' });
    expect(map.NMEA).toMatchObject({ lat: '3912.3402N', lng: '11607.4070E' });
  });

  it('带方向字母的度分秒输入 (自动识别 + 经度在前自动纠正)', () => {
    const { r, map } = okFormat('116°7′24.42″E, 39°12′20.41″N');
    expect(r.lat).toBeCloseTo(39.2056694, 6);
    expect(r.lng).toBeCloseTo(116.12345, 6);
    expect(map.DD.lat).toBe('39.205669');
    expect(map.DD.lng).toBe('116.12345');
  });

  it('南纬 / 西经为负, 输出带 S/W', () => {
    const { r, map } = okFormat('39.20567S, 116.12345W');
    expect(r.lat).toBeLessThan(0);
    expect(r.lng).toBeLessThan(0);
    expect(map.DD).toMatchObject({ lat: '-39.20567', lng: '-116.12345' });
    expect(map.DMS.lat.endsWith('S')).toBe(true);
    expect(map.DMS.lng.endsWith('W')).toBe(true);
  });

  it('经度在前选项', () => {
    const { r } = okFormat('116.12345, 39.20567', 'AUTO', 'lnglat');
    expect(r.lat).toBeCloseTo(39.20567, 9);
    expect(r.lng).toBeCloseTo(116.12345, 9);
  });

  it('显式指定输入格式 (关闭自动识别)', () => {
    const { map } = okFormat('3912.3402N, 11607.4070E', 'NMEA');
    expect(map.DD).toMatchObject({ lat: '39.20567', lng: '116.12345' });
  });

  it('组合串 (pair) 为「纬度, 经度」顺序', () => {
    const { map } = okFormat('39.20567, 116.12345');
    expect(map.DD.pair).toBe('39.20567, 116.12345');
    expect(map.DMS.pair).toBe('39°12′20.41″N, 116°07′24.42″E');
  });
});

describe('经纬度格式: 错误处理', () => {
  it('空输入', () => {
    expect(() => convertCoordinate('  ', { format: 'AUTO', order: 'latlng' })).toThrow(/请输入经纬度/);
  });

  it('只给一个坐标', () => {
    try {
      convertCoordinate('39.20567', { format: 'AUTO', order: 'latlng' });
      throw new Error('should throw');
    } catch (e) {
      expect((e as CoordError).code).toBe('PAIR');
    }
  });

  it('纬度超范围', () => {
    try {
      convertCoordinate('100, 116.12345', { format: 'AUTO', order: 'latlng' });
      throw new Error('should throw');
    } catch (e) {
      expect((e as CoordError).code).toBe('LAT_RANGE');
    }
  });

  it('经度超范围', () => {
    try {
      convertCoordinate('39.20567, 200', { format: 'AUTO', order: 'latlng' });
      throw new Error('should throw');
    } catch (e) {
      expect((e as CoordError).code).toBe('LNG_RANGE');
    }
  });
});

describe('经纬度格式: 格式化函数', () => {
  it('formatDD 去掉多余尾零', () => {
    expect(formatDD(39.2)).toBe('39.2');
    expect(formatDD(-116)).toBe('-116');
    expect(formatDD(116.123456789)).toBe('116.123457');
  });

  it('formatDMS / formatDM / formatNMEA 进位正确', () => {
    // 29.99999° -> 30°00′00″
    expect(formatDMS(29.99999999, true)).toBe('30°00′00″N');
    expect(formatDM(29.9999999, true)).toBe('30°00′N');
    expect(formatNMEA(29.9999999, true)).toBe('3000.0000N');
  });

  it('formatNMEA 纬度两位度 / 经度三位度', () => {
    expect(formatNMEA(39.20567, true)).toBe('3912.3402N');
    expect(formatNMEA(116.12345, false)).toBe('11607.4070E');
    expect(formatNMEA(7.5, false)).toBe('00730.0000E');
  });
});

describe('经纬度格式: 页面示例', () => {
  it('每个示例都能被自动识别并算出四种格式', () => {
    sampleList.forEach((s) => {
      const r = convertCoordinate(s.text, { format: 'AUTO', order: 'latlng' });
      expect(r.rows.map((x) => x.key)).toEqual([ 'DD', 'DMS', 'DM', 'NMEA' ]);
      expect(Math.abs(Number(r.rows[0].lat))).toBeLessThanOrEqual(90);
      expect(Math.abs(Number(r.rows[0].lng))).toBeLessThanOrEqual(180);
    });
  });

  it('「经度在前」示例自动纠正为纬度在前', () => {
    const s = sampleList.find((x) => x.key === 'lnglat');
    const r = convertCoordinate(s!.text, { format: 'AUTO', order: 'latlng' });
    expect(r.rows[0].lat).toBe('39.908722');
    expect(r.rows[0].lng).toBe('116.3975');
  });

  it('南纬 / 西经示例输出带 S / W', () => {
    const s = sampleList.find((x) => x.key === 'south');
    const r = convertCoordinate(s!.text, { format: 'AUTO', order: 'latlng' });
    expect(r.rows[0].lat).toBe('-22.906847');
    expect(r.rows[0].lng).toBe('-43.172896');
    expect(r.rows[1].lat).toContain('S');
    expect(r.rows[1].lng).toContain('W');
  });
});
