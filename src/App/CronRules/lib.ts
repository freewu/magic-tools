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

// ---------- Cron 规则解析 / 最近触发时间 ----------
export interface ParsedCronField {
  key: CronFieldKey;
  raw: string;   // 原始字段文本
  any: boolean;  // 是否为 *
  allow: number[]; // 允许取值 (升序去重, 非 any 时)
  desc: string;  // 中文解读
}

export interface ParsedCronRule {
  format: CronFormatValue;
  keys: CronFieldKey[];
  fields: ParsedCronField[];
}

const MONTH_NAMES :Record<string, number> = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
const WEEK_NAMES :Record<string, number> = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };

const nameValue = (meta :CronFieldMeta, raw :string) :number | undefined => {
  const up = raw.toUpperCase();
  if (meta.key === 'month') return MONTH_NAMES[up];
  if (meta.key === 'week') return WEEK_NAMES[up];
  return undefined;
};

// 解析一个字段片段: 支持 *, */n, a, a-b, a-b/n, 以及逗号列表与月份/星期英文名
const parseFieldSegment = (expr :string, meta :CronFieldMeta) :ParsedCronField => {
  const seg = expr.trim();
  const allow = new Set<number>();
  const frags :string[] = [];

  const pushRange = (a :number, b :number, step :number) => {
    const lo = Math.min(a, b), hi = Math.max(a, b);
    if (lo < meta.min || hi > meta.max) {
      throw new Error(`字段「${meta.label}」取值 ${lo < meta.min ? lo : hi} 超出范围 ${meta.min}-${meta.max}`);
    }
    for (let v = lo; v <= hi; v += step) allow.add(v);
  };

  if (seg === '*') {
    return { key: meta.key, raw: seg, any: true, allow: [], desc: '任意 (*)' };
  }

  for (const part of seg.split(',')) {
    const p = part.trim();
    if (p === '') throw new Error(`字段「${meta.label}」存在空项`);
    let body = p;
    let step = 1;
    const slashIdx = p.indexOf('/');
    if (slashIdx >= 0) {
      body = p.slice(0, slashIdx);
      const sRaw = p.slice(slashIdx + 1).trim();
      step = parseInt(sRaw, 10);
      if (!Number.isFinite(step) || step < 1) throw new Error(`字段「${meta.label}」步长无效: ${sRaw}`);
    }
    if (body === '*') {
      pushRange(meta.min, meta.max, step);
      frags.push(step > 1 ? `每 ${step} 个` : '任意');
    } else {
      const dashIdx = body.indexOf('-');
      if (dashIdx >= 0) {
        const aRaw = body.slice(0, dashIdx).trim();
        const bRaw = body.slice(dashIdx + 1).trim();
        let a = parseInt(aRaw, 10);
        let b = parseInt(bRaw, 10);
        if (!Number.isFinite(a)) a = nameValue(meta, aRaw) as number;
        if (!Number.isFinite(b)) b = nameValue(meta, bRaw) as number;
        if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error(`字段「${meta.label}」范围无效: ${p}`);
        pushRange(a, b, step);
        frags.push(step > 1 ? `${Math.min(a, b)}-${Math.max(a, b)} 内每 ${step}` : `${Math.min(a, b)}-${Math.max(a, b)}`);
      } else {
        let v = parseInt(body, 10);
        if (!Number.isFinite(v)) v = nameValue(meta, body) as number;
        if (!Number.isFinite(v)) throw new Error(`字段「${meta.label}」无法识别的取值: ${body}`);
        pushRange(v, v, 1);
        const label = meta.optionsLabel && meta.key === 'week' ? meta.optionsLabel(v) : String(v);
        frags.push(label);
      }
    }
  }

  const arr = [ ...allow ].sort((x, y) => x - y);
  if (arr.length === 0) throw new Error(`字段「${meta.label}」没有可取值`);
  return { key: meta.key, raw: seg, any: false, allow: arr, desc: frags.join('、') };
};

// 解析完整 cron 表达式 (字段数须与所选格式一致), 非法时抛错
export const parseCronExpr = (expr :string, format :CronFormatValue) :ParsedCronRule => {
  const def = CRON_FORMAT_LIST.find((f) => f.value === format) ?? CRON_FORMAT_LIST[0];
  const segs = expr.trim().split(/\s+/).filter(Boolean);
  if (segs.length !== def.keys.length) {
    const expect = def.keys.map((k) => CRON_FIELD_META[k].label).join(' ');
    throw new Error(`字段数量应为 ${def.keys.length} 个 (${expect}), 实际输入 ${segs.length} 个`);
  }
  const fields = def.keys.map((k, i) => parseFieldSegment(segs[i], CRON_FIELD_META[k]));
  return { format, keys: def.keys, fields };
};

const fullRange = (min :number, max :number) :number[] => {
  const out :number[] = [];
  for (let n = min; n <= max; n++) out.push(n);
  return out;
};

/**
 * 计算未来 count 次触发时间 (含语义: 日与周同时受限时按「或」匹配, 参照 Vixie cron)
 * 返回升序 Date 数组; 若至 2099 年仍不足 count 次则返回找到的次数
 */
export const nextCronTimes = (rule :ParsedCronRule, from :Date = new Date(), count = 10) :Date[] => {
  const byKey = (k :CronFieldKey) :ParsedCronField | undefined => rule.fields.find((f) => f.key === k);
  const hasSec = rule.keys.includes('second');
  const secField = byKey('second');
  const minField = byKey('minute');
  const hourField = byKey('hour');
  const dayField = byKey('day');
  const monthField = byKey('month');
  const weekField = byKey('week');
  const yearField = byKey('year');

  const secs = !hasSec ? [ 0 ] : secField?.any ? fullRange(0, 59) : (secField?.allow ?? [ 0 ]);
  const mins = minField?.any ? fullRange(0, 59) : (minField?.allow ?? fullRange(0, 59));
  const hours = hourField?.any ? fullRange(0, 23) : (hourField?.allow ?? fullRange(0, 23));
  const months = monthField?.any ? fullRange(1, 12) : (monthField?.allow ?? fullRange(1, 12));
  const years = yearField && !yearField.any ? yearField.allow : null;
  const capYear = years ? Math.max(...years) : 2099;

  const domRes = !!dayField && !dayField.any;
  const dowRes = !!weekField && !weekField.any;
  const doms = dayField?.allow ?? [];
  const dows = weekField?.allow ?? [];

  const out :Date[] = [];
  const fromMs = from.getTime();
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate()); // 当天 00:00 起逐日扫
  let guard = 0;

  while (out.length < count && guard++ < 200000) {
    const y = cursor.getFullYear();
    if (y > capYear) break;
    if (y < from.getFullYear()) { cursor.setDate(cursor.getDate() + 1); continue; }
    if (years && !years.includes(y)) { cursor.setDate(cursor.getDate() + 1); continue; }
    const mo = cursor.getMonth() + 1;
    if (!months.includes(mo)) { cursor.setDate(cursor.getDate() + 1); continue; }
    const d = cursor.getDate();
    const dow = cursor.getDay();

    const domOk = !domRes || doms.includes(d);
    const dowOk = !dowRes || dows.includes(dow) || (dow === 0 && dows.includes(7));
    const dayOk = (domRes && dowRes) ? (domOk || dowOk) : (domRes ? domOk : dowRes ? dowOk : true);

    if (dayOk) {
      for (const h of hours) {
        for (const mi of mins) {
          for (const s of secs) {
            const t = new Date(y, mo - 1, d, h, mi, s).getTime();
            if (t > fromMs) {
              out.push(new Date(t));
              if (out.length >= count) return out;
            }
          }
        }
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
};
