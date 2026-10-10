import { FONT_NAMES, DEFAULT_FONT, DEFAULT_TEXT, getDefaultFont, setDefaultFont, getDefaultText, setDefaultText, nonAsciiChars, isAsciiText } from './lib';

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

describe('nonAsciiChars / isAsciiText', () => {
  it('纯 ASCII (含换行/制表符) 视为合法', () => {
    expect(nonAsciiChars('')).toEqual([]);
    expect(nonAsciiChars('bluefrog')).toEqual([]);
    expect(nonAsciiChars('Hello, World! 123 ~`-=[]\\;\',./')).toEqual([]);
    expect(nonAsciiChars('ab\ncd\r\n\tef')).toEqual([]);   // 多行排版用空白放行
    expect(isAsciiText('a b\tc')).toBe(true);
  });

  it('中文 / 全角标点 / emoji 逐个列出并去重', () => {
    expect(nonAsciiChars('你好')).toEqual([ '你', '好' ]);
    expect(nonAsciiChars('a你b你c')).toEqual([ '你' ]);
    expect(nonAsciiChars('，。！')).toEqual([ '，', '。', '！' ]);
    expect(nonAsciiChars('😀ab😀')).toEqual([ '😀' ]);          // emoji 按码点整体处理
    expect(nonAsciiChars('héllo')).toEqual([ 'é' ]);
    expect(isAsciiText('hello 世界')).toBe(false);
  });

  it('不可打印字符 (控制符 / DEL) 也算未收录', () => {
    expect(nonAsciiChars('a\u0001b')).toEqual([ '\u0001' ]);
    expect(nonAsciiChars('a\u007fb')).toEqual([ '\u007f' ]);
  });

  it('首个未收录字符就能判定为非法', () => {
    expect(isAsciiText('中文')).toBe(false);
    expect(isAsciiText('')).toBe(true);
  });
});
