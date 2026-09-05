import {
  DEFAULT_REGEX_PRESETS,
  listRegexPresets,
  saveRegexPresets,
  resetRegexPresets,
  compileRegex,
  lineMatches,
  matchAllCount,
} from './lib';

describe('正则表达式工具 lib', () => {
  beforeEach(() => { localStorage.clear(); });

  it('默认预设全部可以编译', () => {
    for (const p of DEFAULT_REGEX_PRESETS) {
      expect(compileRegex(p.pattern, p.flags)).not.toBeNull();
    }
  });

  it('默认预设数量与结构', () => {
    expect(DEFAULT_REGEX_PRESETS.length).toBeGreaterThanOrEqual(10);
    const preset = listRegexPresets();
    expect(preset.length).toBe(DEFAULT_REGEX_PRESETS.length);
  });

  it('保存/读取往返', () => {
    const custom = [{ id: 99, name: '自定义', pattern: '^abc$', flags: 'i' }];
    saveRegexPresets(custom);
    expect(listRegexPresets()).toEqual(custom);
  });

  it('损坏数据回退默认', () => {
    localStorage.setItem('regex-presets', '{bad json');
    expect(listRegexPresets().length).toBe(DEFAULT_REGEX_PRESETS.length);
    localStorage.setItem('regex-presets', JSON.stringify([{ id: 'x' }]));
    expect(listRegexPresets().length).toBe(DEFAULT_REGEX_PRESETS.length);
  });

  it('恢复默认', () => {
    saveRegexPresets([{ id: 1, name: 'x', pattern: 'y', flags: '' }]);
    resetRegexPresets();
    expect(listRegexPresets().length).toBe(DEFAULT_REGEX_PRESETS.length);
  });

  it('lineMatches 单行匹配 / 不匹配', () => {
    const email = compileRegex('^[\\w.%+-]+@[\\w.-]+\\.[A-Za-z]{2,}$', '');
    expect(lineMatches(email, 'a@b.com')).toBe(true);
    expect(lineMatches(email, 'not-an-email')).toBe(false);
    expect(lineMatches(null, 'x')).toBeNull();
  });

  it('flags 忽略大小写生效', () => {
    const re = compileRegex('^abc$', 'i');
    expect(lineMatches(re, 'ABC')).toBe(true);
  });

  it('matchAllCount 统计匹配次数', () => {
    const re = compileRegex('\\d+', '');
    expect(matchAllCount(re, 'a1b22c333')).toBe(3);
    expect(matchAllCount(null, 'text')).toBe(0);
    expect(matchAllCount(re, '')).toBe(0);
  });

  it('lineMatches 循环使用会重置 lastIndex (g 标志安全)', () => {
    const re = compileRegex('a', 'g');
    expect(lineMatches(re, 'banana')).toBe(true);
    expect(lineMatches(re, 'banana')).toBe(true);
  });
});
