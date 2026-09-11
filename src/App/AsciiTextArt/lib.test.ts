import { FONT_NAMES, DEFAULT_FONT, DEFAULT_TEXT, getDefaultFont, setDefaultFont, getDefaultText, setDefaultText } from './lib';

describe('ASCII 文字', () => {
  it('字体清单完整: 289 款, 无重复, 含默认字体', () => {
    expect(FONT_NAMES.length).toBe(289);
    expect(new Set(FONT_NAMES).size).toBe(FONT_NAMES.length);
    expect(FONT_NAMES).toContain(DEFAULT_FONT);
    for (const sample of ['3-D', 'ANSI Shadow', "Patorjk's Cheese", 'Star Wars', 'Big Money-ne']) {
      expect(FONT_NAMES).toContain(sample);
    }
  });

  it('默认字体设置: 默认 Standard, 设置/读取往返一致', () => {
    localStorage.clear();
    expect(getDefaultFont()).toBe('Standard');
    setDefaultFont('Slant');
    expect(getDefaultFont()).toBe('Slant');
    setDefaultFont('Big');
    expect(getDefaultFont()).toBe('Big');
  });

  it('默认字体设置: 非法值回退 Standard', () => {
    localStorage.clear();
    setDefaultFont('No-Such-Font');
    expect(getDefaultFont()).toBe('Standard');
  });

  it('默认文字设置: 默认 bluefrog, 设置/读取往返一致, 清空回退默认', () => {
    localStorage.clear();
    expect(DEFAULT_TEXT).toBe('bluefrog');
    expect(getDefaultText()).toBe('bluefrog');
    setDefaultText('MagicTools');
    expect(getDefaultText()).toBe('MagicTools');
    setDefaultText('');        // 清空 => 回退默认值
    expect(getDefaultText()).toBe('bluefrog');
    setDefaultText('   ');     // 空白同样视为未设置
    expect(getDefaultText()).toBe('bluefrog');
  });
});
