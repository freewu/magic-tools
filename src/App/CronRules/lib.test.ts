import {
  CRON_FIELD_META,
  CRON_FORMAT_LIST,
  CRON_PRESETS,
  defaultCronValues,
  buildCronExpr,
  applyPreset,
  renderField,
  optionsFor,
} from './lib';

const values = defaultCronValues();

describe('cron 规则 lib', () => {
  it('默认任意: 标准 7 段 / Linux 5 段', () => {
    expect(buildCronExpr('standard', values)).toBe('* * * * * * *');
    expect(buildCronExpr('linux', values)).toBe('* * * * *');
  });

  it('range 生成 a-b', () => {
    const v :Record<string, import('./lib').CronFieldValue> = { ...values, hour: { mode: 'range', from: 9, to: 18 } };
    expect(buildCronExpr('standard', v)).toBe('* * 9-18 * * * *');
    expect(buildCronExpr('linux', v)).toBe('* 9-18 * * *');
  });

  it('range 数值颠倒时自动排序 / 越界自动夹取', () => {
    expect(renderField({ mode: 'range', from: 59, to: 1 }, CRON_FIELD_META.minute)).toBe('1-59');
    expect(renderField({ mode: 'range', from: 1, to: 99 }, CRON_FIELD_META.minute)).toBe('1-59');
  });

  it('step 生成 */n, 步长为 0 或负数时按 1 处理', () => {
    expect(renderField({ mode: 'step', step: 5 }, CRON_FIELD_META.minute)).toBe('*/5');
    expect(renderField({ mode: 'step', step: 0 }, CRON_FIELD_META.minute)).toBe('*/1');
  });

  it('list 排序去重并夹取范围', () => {
    const v :Record<string, import('./lib').CronFieldValue> = { ...values, minute: { mode: 'list', list: [59, 5, 3, 99, 5] } };
    expect(buildCronExpr('standard', v)).toBe('* 3,5,59 * * * * *');
    expect(renderField({ mode: 'list', list: [] }, CRON_FIELD_META.minute)).toBe('*');
  });

  it('Linux 格式隐藏秒与年', () => {
    const v :Record<string, import('./lib').CronFieldValue> = { ...values, second: { mode: 'list', list: [0] }, year: { mode: 'list', list: [2030] } };
    expect(buildCronExpr('linux', v)).toBe('* * * * *');
  });

  it('预设: 每天 00:00', () => {
    const p = CRON_PRESETS.find((x) => x.label === '每天 00:00')!;
    expect(buildCronExpr('standard', applyPreset('standard', p))).toBe('0 0 0 * * * *');
    expect(buildCronExpr('linux', applyPreset('linux', p))).toBe('0 0 * * *');
  });

  it('预设: 每周一 09:00', () => {
    const p = CRON_PRESETS.find((x) => x.label === '每周一 09:00')!;
    expect(buildCronExpr('standard', applyPreset('standard', p))).toBe('0 0 9 * * 1 *');
    expect(buildCronExpr('linux', applyPreset('linux', p))).toBe('0 9 * * 1');
  });

  it('预设: 每 1 秒 (仅标准, linux 下秒字段被忽略)', () => {
    const p = CRON_PRESETS.find((x) => x.label === '每 1 秒')!;
    expect(buildCronExpr('standard', applyPreset('standard', p))).toBe('*/1 * * * * * *');
    expect(buildCronExpr('linux', applyPreset('linux', p))).toBe('* * * * *');
  });

  it('预设数量与格式列表完整', () => {
    expect(CRON_PRESETS.length).toBeGreaterThanOrEqual(8);
    expect(CRON_FORMAT_LIST.map((f) => f.value)).toEqual(['standard', 'linux']);
  });

  it('字段取值范围: 秒/分 0-59, 时 0-23, 日 1-31, 月 1-12, 周 0-7, 年 2024+', () => {
    expect(optionsFor(CRON_FIELD_META.second).length).toBe(60);
    expect(optionsFor(CRON_FIELD_META.minute).length).toBe(60);
    expect(optionsFor(CRON_FIELD_META.hour).length).toBe(24);
    expect(optionsFor(CRON_FIELD_META.day).length).toBe(31);
    expect(optionsFor(CRON_FIELD_META.month).length).toBe(12);
    const week = optionsFor(CRON_FIELD_META.week);
    expect(week.length).toBe(8);
    expect(week[0].label).toBe('周日 (0)');
    expect(week[7].label).toBe('周日 (7)');
    expect(optionsFor(CRON_FIELD_META.year)[0].value).toBe(2024);
  });
});

import { parseCronExpr, nextCronTimes } from './lib';

describe('Cron 规则解析', () => {
  const fmt = (d: Date) => {
    const p = (n: number, l = 2) => String(n).padStart(l, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };
  const from = (y: number, m: number, d: number, h = 0, mi = 0, s = 0) => new Date(y, m - 1, d, h, mi, s);

  it('解析标准/快捷语义与字段解读', () => {
    const r = parseCronExpr('*/15 0 12 1-15 JAN * 2025', 'standard');
    expect(r.keys.length).toBe(7);
    const by = (k: string) => r.fields.find((f) => f.key === k)!;
    expect(by('second').desc).toBe('每 15 个');
    expect(by('minute').desc).toBe('0');
    expect(by('day').desc).toBe('1-15');
    expect(by('day').allow).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    expect(by('month').desc).toBe('1'); // JAN
    expect(by('week').any).toBe(true);
    expect(by('year').allow).toEqual([2025]);
    // 周字段与英文星期名
    const l = parseCronExpr('0 9 * * MON', 'linux');
    expect(l.fields[4].desc).toBe('周一 (1)');
  });

  it('字段数量/越界/非法取值报错', () => {
    expect(() => parseCronExpr('0 99 * * *', 'linux')).toThrow(/超出范围/);
    expect(() => parseCronExpr('0 0 * * * * *', 'linux')).toThrow(/字段数量应为 5/);
    expect(() => parseCronExpr('0 0 * * *', 'standard')).toThrow(/字段数量应为 7/);
    expect(() => parseCronExpr('0 0 * X *', 'linux')).toThrow(/无法识别/);
    expect(() => parseCronExpr('0 0 * * */0', 'linux')).toThrow(/步长无效/);
  });

  it('每周一 09:00 (Linux): 未来 10 次均为周一 9 点整', () => {
    const rule = parseCronExpr('0 9 * * 1', 'linux');
    const times = nextCronTimes(rule, from(2024, 1, 5), 10);
    expect(times.length).toBe(10);
    expect(fmt(times[0])).toBe('2024-01-08 09:00:00');
    expect(times.every((d) => d.getDay() === 1 && d.getHours() === 9 && d.getMinutes() === 0)).toBe(true);
  });

  it('每 30 秒 (标准): 相邻两次触发相差 30 秒', () => {
    const rule = parseCronExpr('*/30 * * * * * *', 'standard');
    const times = nextCronTimes(rule, from(2024, 6, 1, 12, 0, 10), 6);
    expect(times.length).toBe(6);
    for (let i = 1; i < times.length; i++) {
      expect(times[i].getTime() - times[i - 1].getTime()).toBe(30000);
    }
    expect(fmt(times[0])).toBe('2024-06-01 12:00:30');
  });

  it('闰年 2 月 29 日: 从 2024-03 起下一个是 2028', () => {
    const rule = parseCronExpr('0 0 0 29 2 * *', 'standard');
    const times = nextCronTimes(rule, from(2024, 3, 1), 3);
    expect(times.map(fmt)).toEqual([
      '2028-02-29 00:00:00', '2032-02-29 00:00:00', '2036-02-29 00:00:00',
    ]);
  });

  it('不可达规则 (2 月 30 日): 返回空', () => {
    const rule = parseCronExpr('0 0 0 30 2 * *', 'standard');
    expect(nextCronTimes(rule, from(2024, 1, 1))).toEqual([]);
  });

  it('日与周同时限制按「或」匹配 (13 号 或 周五)', () => {
    const rule = parseCronExpr('0 0 0 13 * 5 *', 'standard');
    const times = nextCronTimes(rule, from(2024, 1, 1), 10).map(fmt);
    expect(times[0]).toBe('2024-01-05 00:00:00'); // 周五
    expect(times).toContain('2024-01-13 00:00:00'); // 周六 13 号
    expect(times.length).toBe(10);
  });

  it('限 2026 年: 只有 2026-01-01 一次', () => {
    const rule = parseCronExpr('0 0 0 1 1 * 2026', 'standard');
    const times = nextCronTimes(rule, from(2025, 1, 2));
    expect(times.map(fmt)).toEqual([ '2026-01-01 00:00:00' ]);
  });

  it('周日 (0 与 7) 均可匹配', () => {
    const a = nextCronTimes(parseCronExpr('0 12 * * SUN', 'linux'), from(2024, 1, 2), 2).map(fmt);
    const b = nextCronTimes(parseCronExpr('0 12 * * 0', 'linux'), from(2024, 1, 2), 2).map(fmt);
    expect(a).toEqual([ '2024-01-07 12:00:00', '2024-01-14 12:00:00' ]);
    expect(b).toEqual(a);
  });
});
