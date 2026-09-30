import { calcLineCount, removeEmptyLine } from './lib';

describe('LineCount lib', () => {
  test('calcLineCount: 行数统计', () => {
    expect(calcLineCount('')).toBe(0);
    expect(calcLineCount('a')).toBe(1);
    expect(calcLineCount('a\nb')).toBe(2);
    expect(calcLineCount('a\nb\nc')).toBe(3);
    expect(calcLineCount('\n')).toBe(2);
  });

  test('removeEmptyLine: 移除空行 (保留内容行)', () => {
    expect(removeEmptyLine('')).toBe('');
    expect(removeEmptyLine('   ')).toBe('');
    expect(removeEmptyLine('a\n\nb')).toBe('a\nb');
    expect(removeEmptyLine('a\n  \nb')).toBe('a\nb');
    expect(removeEmptyLine('a\nb')).toBe('a\nb');
    expect(removeEmptyLine('\na\n\nb\n')).toBe('a\nb');
  });
});
