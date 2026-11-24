import { arabicToRoman, isValidRoman, romanToArabic, ROMAN_MAX, ROMAN_MIN } from './lib';

/** 取成功结果, 失败时直接失败并给出原因 */
const okRoman = (input: string | number): string => {
  const r = arabicToRoman(input);
  if (!r.ok) throw new Error(`期望转换成功, 实际失败: ${r.error}`);
  return r.value;
};
const okArabic = (input: string): number => {
  const r = romanToArabic(input);
  if (!r.ok) throw new Error(`期望转换成功, 实际失败: ${r.error}`);
  return r.value;
};

describe('常量', () => {
  test('支持范围 1 - 3999', () => {
    expect(ROMAN_MIN).toBe(1);
    expect(ROMAN_MAX).toBe(3999);
  });
});

describe('阿拉伯数字 → 罗马数字', () => {
  test.each([
    [1, 'I'],
    [2, 'II'],
    [3, 'III'],
    [4, 'IV'],
    [5, 'V'],
    [6, 'VI'],
    [7, 'VII'],
    [8, 'VIII'],
    [9, 'IX'],
    [10, 'X'],
    [11, 'XI'],
    [14, 'XIV'],
    [19, 'XIX'],
    [40, 'XL'],
    [44, 'XLIV'],
    [49, 'XLIX'],
    [50, 'L'],
    [90, 'XC'],
    [99, 'XCIX'],
    [100, 'C'],
    [400, 'CD'],
    [444, 'CDXLIV'],
    [500, 'D'],
    [900, 'CM'],
    [999, 'CMXCIX'],
    [1000, 'M'],
    [1666, 'MDCLXVI'],
    [1994, 'MCMXCIV'],
    [2024, 'MMXXIV'],
    [3888, 'MMMDCCCLXXXVIII'],
    [3999, 'MMMCMXCIX'],
  ])('%i => %s', (n, roman) => {
    expect(okRoman(n)).toBe(roman);
    expect(okRoman(String(n))).toBe(roman);
  });

  test('容忍两侧空白与前导零', () => {
    expect(okRoman('  2024  ')).toBe('MMXXIV');
    expect(okRoman('007')).toBe('VII');
  });

  test('1 - 3999 全部可以往返转换', () => {
    for (let n = ROMAN_MIN; n <= ROMAN_MAX; n++) {
      const roman = okRoman(n);
      expect(okArabic(roman)).toBe(n);
    }
  });

  test('空输入', () => {
    expect(arabicToRoman('')).toEqual({ ok: false, error: 'empty' });
    expect(arabicToRoman('   ')).toEqual({ ok: false, error: 'empty' });
  });

  test('非整数入参', () => {
    expect(arabicToRoman('abc')).toEqual({ ok: false, error: 'notInteger' });
    expect(arabicToRoman('12a')).toEqual({ ok: false, error: 'notInteger' });
    expect(arabicToRoman('1.5')).toEqual({ ok: false, error: 'notInteger' });
    expect(arabicToRoman('MMXXIV')).toEqual({ ok: false, error: 'notInteger' });
  });

  test('超出 1 - 3999', () => {
    expect(arabicToRoman('0')).toEqual({ ok: false, error: 'outOfRange' });
    expect(arabicToRoman('4000')).toEqual({ ok: false, error: 'outOfRange' });
    expect(arabicToRoman('-1')).toEqual({ ok: false, error: 'outOfRange' });
  });
});

describe('罗马数字 → 阿拉伯数字', () => {
  test('大小写均可, 忽略两侧空白', () => {
    expect(okArabic('mmxxiv')).toBe(2024);
    expect(okArabic('  Xii ')).toBe(12);
  });

  test('标准写法边界值', () => {
    expect(okArabic('I')).toBe(1);
    expect(okArabic('MMMCMXCIX')).toBe(3999);
    expect(okArabic('IV')).toBe(4);
    expect(okArabic('XLIX')).toBe(49);
    expect(okArabic('CMXCIX')).toBe(999);
  });

  test('非标准写法被拒绝 (IIII / IC / VX 等)', () => {
    for (const bad of ['IIII', 'IC', 'VX', 'IL', 'XM', 'VV', 'IIV', 'CCCC', 'MMMM', 'IXI']) {
      expect(romanToArabic(bad)).toEqual({ ok: false, error: 'invalidRoman' });
    }
  });

  test('非法字符与空输入', () => {
    expect(romanToArabic('')).toEqual({ ok: false, error: 'empty' });
    expect(romanToArabic('ABC')).toEqual({ ok: false, error: 'invalidRoman' });
    expect(romanToArabic('X I')).toEqual({ ok: false, error: 'invalidRoman' });
    expect(romanToArabic('Ⅻ')).toEqual({ ok: false, error: 'invalidRoman' });
    expect(romanToArabic('2024')).toEqual({ ok: false, error: 'invalidRoman' });
  });

  test('isValidRoman', () => {
    expect(isValidRoman('MMXXIV')).toBe(true);
    expect(isValidRoman('mmxxiv')).toBe(true);
    expect(isValidRoman('IIII')).toBe(false);
    expect(isValidRoman('')).toBe(false);
  });
});
