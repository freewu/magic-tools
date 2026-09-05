// Cron 规则: 字段定义 / 表达式构建 / 预设
export type CronMode = 'any' | 'range' | 'step' | 'list';

export type CronFieldKey = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'week' | 'year';

export interface CronFieldMeta {
  key: CronFieldKey;
  label: string;  // 中文名
  min: number;    // 最小取值
  max: number;    // 最大取值
  tip: string;    // 提示
  optionsLabel?: (v :number) => string; // 指定值时显示的文字 (默认纯数字)
}

export const CRON_FIELD_META :Record<CronFieldKey, CronFieldMeta> = {
  second: { key: 'second', label: '秒',   min: 0,  max: 59, tip: '0-59' },
  minute: { key: 'minute', label: '分',   min: 0,  max: 59, tip: '0-59' },
  hour:   { key: 'hour',   label: '时',   min: 0,  max: 23, tip: '0-23' },
  day:    { key: 'day',    label: '日',   min: 1,  max: 31, tip: '1-31' },
  month:  { key: 'month',  label: '月',   min: 1,  max: 12, tip: '1-12' },
  week:   {
    key: 'week', label: '周', min: 0, max: 7,
    tip: '0 与 7 均表示周日',
    optionsLabel: (v) => v === 0 ? '周日 (0)' : v === 7 ? '周日 (7)' : `周${ ['', '一', '二', '三', '四', '五', '六'][v] } (${v})`,
  },
  year:   { key: 'year',   label: '年',   min: 2024, max: 2099, tip: '仅标准格式 (可选)' },
};

// 标准格式字段顺序: 秒 分 时 日 月 周 年
export const CRON_FIELD_ORDER :CronFieldKey[] = ['second', 'minute', 'hour', 'day', 'month', 'week', 'year'];

export interface CronFieldValue {
  mode: CronMode;
  from?: number; // range 起始
  to?: number;   // range 结束
  step?: number; // step 步长
  list?: number[]; // list 指定值
}

export const newFieldValue = () :CronFieldValue => ({ mode: 'any' });

export type CronFormatValue = 'standard' | 'linux';

export interface CronFormatDef {
  value: CronFormatValue;
  label: string;
  keys: CronFieldKey[];
}

export const CRON_FORMAT_LIST :CronFormatDef[] = [
  { value: 'standard', label: '标准 (秒 分 时 日 月 周 年)', keys: CRON_FIELD_ORDER },
  { value: 'linux',    label: 'Linux (分 时 日 月 周, 无秒/年)', keys: ['minute', 'hour', 'day', 'month', 'week'] },
];

export const defaultCronValues = () :Record<CronFieldKey, CronFieldValue> => {
  const v = {} as Record<CronFieldKey, CronFieldValue>;
  for (const k of CRON_FIELD_ORDER) v[k] = newFieldValue();
  return v;
};

const clamp = (n :number, min :number, max :number) => Math.min(max, Math.max(min, n));

// 渲染单个字段为 cron 片段
export const renderField = (fv :CronFieldValue, meta :CronFieldMeta) :string => {
  switch (fv.mode) {
    case 'any':
      return '*';
    case 'range': {
      const lo = clamp(Math.min(fv.from ?? meta.min, fv.to ?? meta.max), meta.min, meta.max);
      const hi = clamp(Math.max(fv.from ?? meta.min, fv.to ?? meta.max), meta.min, meta.max);
      return `${lo}-${hi}`;
    }
    case 'step':
      return `*/${Math.max(1, Math.round(fv.step ?? 1))}`;
    case 'list': {
      const arr = (fv.list ?? [])
        .filter((n) => Number.isFinite(n))
        .map((n) => clamp(Math.round(n), meta.min, meta.max));
      const uniq = [ ...new Set(arr) ].sort((a, b) => a - b);
      return uniq.length === 0 ? '*' : uniq.join(',');
    }
    default:
      return '*';
  }
};

// 按格式构建完整 cron 表达式
export const buildCronExpr = (format :CronFormatValue, values :Record<CronFieldKey, CronFieldValue>) :string => {
  const def = CRON_FORMAT_LIST.find((f) => f.value === format) ?? CRON_FORMAT_LIST[1];
  return def.keys.map((k) => renderField(values[k], CRON_FIELD_META[k])).join(' ');
};

// 预设
export interface CronPreset {
  label: string;
  note?: string;                       // 备注 (如 仅标准格式)
  onlyStandard?: boolean;              // 需要秒字段的预设
  values: Partial<Record<CronFieldKey, CronFieldValue>>;
}

export const CRON_PRESETS :CronPreset[] = [
  { label: '每 1 秒',        note: '每秒执行', onlyStandard: true, values: { second: { mode: 'step', step: 1 } } },
  { label: '每 30 秒',       onlyStandard: true, values: { second: { mode: 'step', step: 30 } } },
  { label: '每 1 分钟',      values: { second: { mode: 'list', list: [0] } } },
  { label: '每 5 分钟',      values: { second: { mode: 'list', list: [0] }, minute: { mode: 'step', step: 5 } } },
  { label: '每小时整点',     values: { second: { mode: 'list', list: [0] }, minute: { mode: 'list', list: [0] } } },
  { label: '每天 00:00',     values: { second: { mode: 'list', list: [0] }, minute: { mode: 'list', list: [0] }, hour: { mode: 'list', list: [0] } } },
  { label: '每周一 09:00',   values: { second: { mode: 'list', list: [0] }, minute: { mode: 'list', list: [0] }, hour: { mode: 'list', list: [9] }, week: { mode: 'list', list: [1] } } },
  { label: '每月 1 日 00:00', values: { second: { mode: 'list', list: [0] }, minute: { mode: 'list', list: [0] }, hour: { mode: 'list', list: [0] }, day: { mode: 'list', list: [1] } } },
  { label: '每年 1 月 1 日 00:00', values: { second: { mode: 'list', list: [0] }, minute: { mode: 'list', list: [0] }, hour: { mode: 'list', list: [0] }, day: { mode: 'list', list: [1] }, month: { mode: 'list', list: [1] } } },
];

// 应用预设: 先全部重置为任意, 再把预设覆盖到该格式可见的字段上
export const applyPreset = (format :CronFormatValue, preset :CronPreset) :Record<CronFieldKey, CronFieldValue> => {
  const def = CRON_FORMAT_LIST.find((f) => f.value === format) ?? CRON_FORMAT_LIST[1];
  const next = defaultCronValues();
  for (const k of def.keys) {
    const pv = preset.values[k];
    if (pv) next[k] = { mode: pv.mode, from: pv.from, to: pv.to, step: pv.step, list: pv.list ? [ ...pv.list ] : undefined };
  }
  return next;
};

// 字段的全部候选数值 (指定值下拉用)
export const optionsFor = (meta :CronFieldMeta) :Array<{ value: number; label: string }> => {
  const arr :Array<{ value: number; label: string }> = [];
  for (let n = meta.min; n <= meta.max; n++) {
    arr.push({ value: n, label: meta.optionsLabel ? meta.optionsLabel(n) : String(n) });
  }
  return arr;
};
