// 罗马数字 ↔ 阿拉伯数字互转 (标准减法写法, 支持 1 - 3999)
//
// 规则:
//   基本符号   I=1  V=5  X=10  L=50  C=100  D=500  M=1000   (V/L/D 不重复书写)
//   减法组合   IV=4  IX=9  XL=40  XC=90  CD=400  CM=900
//   同一符号最多连续 3 次 (如 III=3, XXX=30, CCC=300, MMM=3000)
//   3999 = MMMCMXCIX, 是不加上划线(乘 1000)写法能表示的最大值

/** 可表示的最小值 (罗马数字没有 0) */
export const ROMAN_MIN = 1;
/** 可表示的最大值 (MMMCMXCIX) */
export const ROMAN_MAX = 3999;

/** 七个基本符号及对应数值 (由大到小) */
export const ROMAN_SYMBOLS: ReadonlyArray<{ symbol: string; value: number }> = [
  { symbol: 'M', value: 1000 },
  { symbol: 'D', value: 500 },
  { symbol: 'C', value: 100 },
  { symbol: 'L', value: 50 },
  { symbol: 'X', value: 10 },
  { symbol: 'V', value: 5 },
  { symbol: 'I', value: 1 },
];

/** 符号 → 数值 (解析用) */
export const SYMBOL_VALUE: Record<string, number> = {
  I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000,
};

/** 由大到小的 (数值, 符号) 表, 含减法组合; 贪心拼接即为标准写法 */
const PAIRS: ReadonlyArray<readonly [number, string]> = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

/** 转换失败原因 (供界面映射为三语文案) */
export type ConvertError =
  | 'empty' // 输入为空
  | 'notInteger' // 阿拉伯数字一侧不是整数
  | 'outOfRange' // 阿拉伯数字超出 1 - 3999
  | 'invalidRoman'; // 非标准 / 非法的罗马数字 (含超出 1 - 3999)

export type ConvertResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ConvertError };

/** 阿拉伯数字 → 罗马数字 (接受两侧空白, 以及 "007" 这类前导零写法) */
export function arabicToRoman(input: string | number): ConvertResult<string> {
  const raw = (typeof input === 'number' ? String(input) : input).trim();
  if (raw === '') return { ok: false, error: 'empty' };
  // 负号 / 小数点 / 字母等一律不接受: 负数归为超范围, 其余归为「不是整数」
  if (!/^\d+$/.test(raw)) return { ok: false, error: raw.startsWith('-') ? 'outOfRange' : 'notInteger' };
  const n = Number(raw);
  if (!Number.isInteger(n)) return { ok: false, error: 'notInteger' };
  if (n < ROMAN_MIN || n > ROMAN_MAX) return { ok: false, error: 'outOfRange' };
  let rest = n;
  let out = '';
  for (const [value, symbol] of PAIRS) {
    while (rest >= value) {
      out += symbol;
      rest -= value;
    }
  }
  return { ok: true, value: out };
}

/** 罗马数字 → 阿拉伯数字 (大小写均可, 但必须是标准写法, 如 IC / IIII 会被拒绝) */
export function romanToArabic(input: string): ConvertResult<number> {
  const raw = input.trim().toUpperCase();
  if (raw === '') return { ok: false, error: 'empty' };
  if (!/^[IVXLCDM]+$/.test(raw)) return { ok: false, error: 'invalidRoman' };
  let total = 0;
  for (let i = 0; i < raw.length; i++) {
    const cur = SYMBOL_VALUE[raw[i]];
    const next = i + 1 < raw.length ? SYMBOL_VALUE[raw[i + 1]] : 0;
    total += cur < next ? -cur : cur;
  }
  if (total < ROMAN_MIN || total > ROMAN_MAX) return { ok: false, error: 'invalidRoman' };
  // 规范性校验: 反算结果必须与输入完全一致, 否则是 IIII / IC / VX 之类的非标准写法
  const back = arabicToRoman(total);
  if (!back.ok || back.value !== raw) return { ok: false, error: 'invalidRoman' };
  return { ok: true, value: total };
}

/** 是否为标准写法的罗马数字 (1 - 3999) */
export function isValidRoman(input: string): boolean {
  return romanToArabic(input).ok;
}
