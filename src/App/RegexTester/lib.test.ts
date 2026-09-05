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

describe('常用正则新增 5 条预设', () => {
  const byName = (name: string) => DEFAULT_REGEX_PRESETS.find((p) => p.name === name);

  it('中文字符 [\\u4e00-\\u9fa5]', () => {
    const p = byName('中文字符');
    expect(p).toBeDefined();
    const re = compileRegex(p!.pattern, '');
    expect(lineMatches(re, 'hello 世界')).toBe(true);
    expect(lineMatches(re, 'abc123')).toBe(false);
  });

  it('双字节字符 [^\\x00-\\xff]', () => {
    const p = byName('双字节字符');
    const re = compileRegex(p!.pattern, '');
    expect(lineMatches(re, '中文，。')).toBe(true);
    expect(lineMatches(re, 'abc123!@#')).toBe(false);
  });

  it('网址 (http/https/ftp/rtsp/mms 可选协议头)', () => {
    const p = byName('网址');
    const re = compileRegex(p!.pattern, '');
    for (const s of [ 'https://example.com/path?a=1', 'http://x.cn', 'ftp://files/x', 'rtsp://stream/x', 'mms://media/x' ]) {
      expect(lineMatches(re, s)).toBe(true);
    }
    expect(lineMatches(re, 'abc http://x')).toBe(false); // 须位于行首 (或为提取片段使用)
  });

  it('邮编 6 位数字', () => {
    const p = byName('邮编');
    const re = compileRegex(p!.pattern, '');
    expect(lineMatches(re, '100010')).toBe(true);
    expect(lineMatches(re, '邮编 200001')).toBe(true); // 无锚点, 片段提取
    expect(lineMatches(re, '12345')).toBe(false);
  });

  it('QQ号码 [1-9] 开头 6-12 位', () => {
    const p = byName('QQ号码');
    const re = compileRegex(p!.pattern, '');
    expect(lineMatches(re, '1234567')).toBe(true);
    expect(lineMatches(re, '12345')).toBe(false);   // 仅 5 位不足
    expect(matchAllCount(compileRegex(p!.pattern, 'g'), '1234567 7654321')).toBe(2);
    expect(matchAllCount(compileRegex(p!.pattern, 'g'), '0123456')).toBe(1); // 无锚点从第 2 位起扫到 123456
  });
});
