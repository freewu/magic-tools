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
