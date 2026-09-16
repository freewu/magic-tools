import {
  taiMinusUtc, gpsTimeOf, bdtTimeOf, gstTimeOf, glonassTimeText, julianDayOf,
  formatDateTime, getMonthBegin, getMonthEnd, getLastMonthBegin, getLastMonthEnd,
  getNextMonthBegin, getNextMonthEnd, getLastMonth, getNextMonth,
} from './lib';

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

// ==================== 月历边界 (围绕系统时间, 用假定时器固定"现在") ====================
describe('月初 / 月末 (固定本地时间)', () => {
  const at = (s: string) => {
    jest.useFakeTimers().setSystemTime(new Date(s));
  };
  const txt = (d: Date) => formatDateTime(d);
  afterEach(() => jest.useRealTimers());

  it('2026-09-16: 本月初 00:00:00, 本月末 23:59:59', () => {
    at('2026-09-16T10:20:30');
    expect(txt(getMonthBegin())).toBe('2026-09-01 00:00:00');
    expect(txt(getMonthEnd())).toBe('2026-09-30 23:59:59');
    expect(txt(getLastMonthBegin())).toBe('2026-08-01 00:00:00');
    expect(txt(getLastMonthEnd())).toBe('2026-08-31 23:59:59');
    expect(txt(getNextMonthBegin())).toBe('2026-10-01 00:00:00');
    expect(txt(getNextMonthEnd())).toBe('2026-10-31 23:59:59');
  });

  it('上月末 / 下月末 用 23:59:59 (本月末一致), 月初用 00:00:00', () => {
    at('2026-09-16T10:20:30');
    expect(txt(getLastMonthEnd()).endsWith('23:59:59')).toBe(true);
    expect(txt(getNextMonthEnd()).endsWith('23:59:59')).toBe(true);
    expect(txt(getMonthEnd()).endsWith('23:59:59')).toBe(true);
    expect(txt(getLastMonthBegin()).endsWith('00:00:00')).toBe(true);
    expect(txt(getNextMonthBegin()).endsWith('00:00:00')).toBe(true);
  });

  it('跨年: 1 月的上月为去年 12 月, 12 月的下月为明年 1 月', () => {
    at('2026-01-05T08:00:00');
    expect(txt(getLastMonthBegin())).toBe('2025-12-01 00:00:00');
    expect(txt(getLastMonthEnd())).toBe('2025-12-31 23:59:59');
    expect(txt(getNextMonthEnd())).toBe('2026-02-28 23:59:59');

    at('2026-12-20T08:00:00');
    expect(txt(getLastMonthEnd())).toBe('2026-11-30 23:59:59');
    expect(txt(getNextMonthBegin())).toBe('2027-01-01 00:00:00');
    expect(txt(getNextMonthEnd())).toBe('2027-01-31 23:59:59');
  });

  it('闰年 2 月: 2024-02 为 29 天', () => {
    at('2024-02-10T00:00:00');
    expect(txt(getMonthEnd())).toBe('2024-02-29 23:59:59');
    expect(txt(getLastMonthEnd())).toBe('2024-01-31 23:59:59');
    expect(txt(getNextMonthEnd())).toBe('2024-03-31 23:59:59');
  });
});

describe('上月 / 下月 (同一天同一时刻, 日期不存在时取月末)', () => {
  const at = (s: string) => jest.useFakeTimers().setSystemTime(new Date(s));
  const txt = (d: Date) => formatDateTime(d);
  afterEach(() => jest.useRealTimers());

  it('普通日期保持时分秒', () => {
    at('2026-09-16T10:20:30');
    expect(txt(getLastMonth())).toBe('2026-08-16 10:20:30');
    expect(txt(getNextMonth())).toBe('2026-10-16 10:20:30');
  });

  it('3-31 的上月为 2-28 (不再错成去年 3-28)', () => {
    at('2026-03-31T09:00:00');
    expect(txt(getLastMonth())).toBe('2026-02-28 09:00:00');
  });

  it('1-31 的下月为 2-28 (不再错成去年 1-28)', () => {
    at('2026-01-31T09:00:00');
    expect(txt(getNextMonth())).toBe('2026-02-28 09:00:00');
  });

  it('跨年: 1-15 的上月为去年 12-15, 12-15 的下月为明年 1-15', () => {
    at('2026-01-15T23:30:00');
    expect(txt(getLastMonth())).toBe('2025-12-15 23:30:00');
    at('2026-12-15T23:30:00');
    expect(txt(getNextMonth())).toBe('2027-01-15 23:30:00');
  });
});
