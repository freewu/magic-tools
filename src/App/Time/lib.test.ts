import { taiMinusUtc, gpsTimeOf, bdtTimeOf, gstTimeOf, glonassTimeText, julianDayOf } from './lib';

// 固定锚点 UTC 时刻 (独立于本地时区)
const t = (s: string): number => new Date(s).getTime();

describe('闰秒表 taiMinusUtc', () => {
  it('2017-01-01 起为 37, 2015-07-01 起为 36', () => {
    expect(taiMinusUtc(t('2017-01-01T00:00:00Z'))).toBe(37);
    expect(taiMinusUtc(t('2016-12-31T23:59:59Z'))).toBe(36);
    expect(taiMinusUtc(t('2015-07-01T00:00:00Z'))).toBe(36);
    expect(taiMinusUtc(t('2015-06-30T23:59:59Z'))).toBe(35);
  });

  it('1980/2006/1999 锚点', () => {
    expect(taiMinusUtc(t('1980-01-06T00:00:00Z'))).toBe(19);
    expect(taiMinusUtc(t('2006-01-01T00:00:00Z'))).toBe(33);
    expect(taiMinusUtc(t('1999-08-22T00:00:00Z'))).toBe(32);
  });

  it('1972 年之前近似 10', () => {
    expect(taiMinusUtc(t('1970-01-01T00:00:00Z'))).toBe(10);
  });
});

describe('GPS 时间 (GPST, 历元 1980-01-06)', () => {
  it('历元时刻为 0 周 0 秒', () => {
    expect(gpsTimeOf(t('1980-01-06T00:00:00Z'))).toEqual({ week: 0, tow: 0, total: 0 });
  });

  it('2000-01-01T00:00:00Z → 周 1042, TOW 518413 (含 13 闰秒差)', () => {
    expect(gpsTimeOf(t('2000-01-01T00:00:00Z'))).toEqual({ week: 1042, tow: 518413, total: 630720013 });
  });
});

describe('北斗时间 (BDT, 历元 2006-01-01)', () => {
  it('历元时刻为 0 周 0 秒', () => {
    expect(bdtTimeOf(t('2006-01-01T00:00:00Z'))).toEqual({ week: 0, tow: 0, total: 0 });
  });

  it('2017-01-01T00:00:00Z → 周 574, TOW 4 (含 4 闰秒差)', () => {
    expect(bdtTimeOf(t('2017-01-01T00:00:00Z'))).toEqual({ week: 574, tow: 4, total: 347155204 });
  });
});

describe('伽利略时间 (GST, 与 GPS 同步 - 1024 周)', () => {
  it('1999-08-22T00:00:00Z (GPS 1024 周起点) → 周 0', () => {
    expect(gstTimeOf(t('1999-08-22T00:00:00Z')).week).toBe(0);
  });

  it('与 GPS 周内秒一致 (GGTO≈0)', () => {
    const ms = t('2026-09-07T12:34:56Z');
    expect(gstTimeOf(ms).tow).toBe(gpsTimeOf(ms).tow);
    expect(gstTimeOf(ms).total).toBe(gpsTimeOf(ms).total - 1024 * 604800);
  });
});

describe('格洛纳斯时间 (UTC+3)', () => {
  it('2000-01-01 00:00:00Z → 莫斯科 03:00:00', () => {
    expect(glonassTimeText(t('2000-01-01T00:00:00Z'))).toBe('2000-01-01 03:00:00');
  });
});

describe('儒略日', () => {
  it('2000-01-01T00:00:00Z → JD 2451544.5, MJD 51544', () => {
    const r = julianDayOf(t('2000-01-01T00:00:00Z'));
    expect(r.jd).toBeCloseTo(2451544.5, 6);
    expect(r.mjd).toBeCloseTo(51544, 6);
  });

  it('1970-01-01T00:00:00Z → JD 2440587.5, MJD 40587', () => {
    const r = julianDayOf(t('1970-01-01T00:00:00Z'));
    expect(r.jd).toBeCloseTo(2440587.5, 6);
    expect(r.mjd).toBeCloseTo(40587, 6);
  });
});
