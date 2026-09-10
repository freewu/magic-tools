import { calcColorSchemes, detectColorType, transalte2Hex } from './lib';

// 参考色相表 (color-convert hsl.hex, S/L = 100/50):
//  30=FF8000 60=FFFF00 90=80FF00 120=00FF00 150=00FF80 180=00FFFF
// 210=007FFF 240=0000FF 270=7F00FF 300=FF00FF 330=FF0080

describe('transalte2Hex', () => {
  it('LAB 负通道可解析 (取色器回填 lab(47, 1, -23))', () => {
    expect(transalte2Hex('lab(47, 1, -23)', 'LAB')).toBe('587196');
  });
  it('HSV 用 hsv 转换而非 hsl', () => {
    expect(transalte2Hex('hsv(215, 42, 59)', 'HSV')).toBe('577296');
    expect(transalte2Hex('hsv(215, 42, 59)', 'HSV')).not.toBe('567095'); // hsl 的旧错误结果
  });
  it('LCH / XYZ 可解析', () => {
    expect(transalte2Hex('lch(47, 23, 271)', 'LCH')).toBe('577196');
    expect(transalte2Hex('xyz(15, 16, 31)', 'XYZ')).toBe('537296');
  });
  it('AUTO 按前缀识别各格式', () => {
    expect(transalte2Hex('rgb(87, 113, 150)', 'AUTO')).toBe('577196');
    expect(transalte2Hex('hsl(215, 27%, 46%)', 'AUTO')).toBe('567095');
    expect(transalte2Hex('hsv(215, 42, 59)', 'AUTO')).toBe('577296');
    expect(transalte2Hex('cmyk(0, 0, 0, 100)', 'AUTO')).toBe('000000');
    expect(transalte2Hex('lab(47, 1, -23)', 'AUTO')).toBe('587196');
  });
  it('AUTO 识别 HEX 与无前缀元组', () => {
    expect(transalte2Hex('#577196', 'AUTO')).toBe('#577196');
    expect(transalte2Hex('577196', 'AUTO')).toBe('577196');
    expect(transalte2Hex('(215, 27%, 46%)', 'AUTO')).toBe('567095'); // 带 % 的 3 通道按 HSL
    expect(transalte2Hex('(87, 113, 150)', 'AUTO')).toBe('577196'); // 无 % 的 3 通道按 RGB
  });
  it('AUTO 无法识别时返回空串', () => {
    expect(transalte2Hex('hello world', 'AUTO')).toBe('');
  });
});

describe('detectColorType', () => {
  it('按前缀识别格式 (大小写不敏感)', () => {
    expect(detectColorType('rgb(1,2,3)')).toBe('RGB');
    expect(detectColorType('rgba(1,2,3,0.5)')).toBe('RGB');
    expect(detectColorType('HSL(215, 27%, 46%)')).toBe('HSL');
    expect(detectColorType('hsla(215, 27%, 46%, 0.5)')).toBe('HSL');
    expect(detectColorType('hsv(215, 42, 59)')).toBe('HSV');
    expect(detectColorType('cmyk(0,0,0,100)')).toBe('CMYK');
    expect(detectColorType('lab(47, 1, -23)')).toBe('LAB');
    expect(detectColorType('lch(47, 23, 271)')).toBe('LCH');
    expect(detectColorType('xyz(15, 16, 31)')).toBe('XYZ');
  });
  it('无前缀元组按通道数与 % 判定', () => {
    expect(detectColorType('(215, 27%, 46%)')).toBe('HSL');
    expect(detectColorType('(87, 113, 150)')).toBe('RGB');
    expect(detectColorType('(0, 0, 0, 100)')).toBe('CMYK');
  });
  it('HEX 与前缀、元组互不误判', () => {
    expect(detectColorType('#577196')).toBe('HEX');
    expect(detectColorType('577196')).toBe('HEX');
    expect(detectColorType('abc')).toBe('HEX');
    expect(detectColorType('#ABCDEF')).toBe('HEX');
    expect(detectColorType('abcdefg')).toBe(''); // 7 位非法十六进制
  });
  it('空串/无关文本无法识别', () => {
    expect(detectColorType('')).toBe('');
    expect(detectColorType('   ')).toBe('');
    expect(detectColorType('hello world')).toBe('');
  });
});

describe('calcColorSchemes', () => {
  it('返回 7 组方案', () => {
    const s = calcColorSchemes('#ff0000');
    expect(s.map((x) => x.label)).toEqual([
      '相似色', '分离色', '三角色', '四角色', '方形色', '复合色', '双分离色',
    ]);
  });

  it('每组均含主色 (isMain, 偏移 0), 值为输入色', () => {
    const s = calcColorSchemes('#00ff00');
    for (const scheme of s) {
      const main = scheme.colors.find((c) => c.isMain);
      expect(main).toBeDefined();
      expect(main!.offset).toBe(0);
      expect(main!.hex).toBe('#00FF00');
      expect(scheme.colors[0].hex).toBe('#00FF00'); // 主色排首位
    }
  });

  it('红 #FF0000 各方案色值', () => {
    const s = calcColorSchemes('#FF0000');
    const byKey = Object.fromEntries(s.map((x) => [x.key, x]));
    expect(byKey['analogous'].colors.map((c) => c.hex)).toEqual(['#FF0000', '#FF0080', '#FF8000']);
    expect(byKey['split'].colors.map((c) => c.hex)).toEqual(['#FF0000', '#00FF80', '#007FFF']);
    expect(byKey['triadic'].colors.map((c) => c.hex)).toEqual(['#FF0000', '#00FF00', '#0000FF']);
    expect(byKey['tetradic'].colors.map((c) => c.hex)).toEqual(['#FF0000', '#FFFF00', '#00FFFF', '#0000FF']);
    expect(byKey['square'].colors.map((c) => c.hex)).toEqual(['#FF0000', '#80FF00', '#00FFFF', '#7F00FF']);
    expect(byKey['compound'].colors.map((c) => c.hex)).toEqual(['#FF0000', '#FF8000', '#00FF80', '#00FFFF']);
    expect(byKey['doubleSplit'].colors.map((c) => c.hex)).toEqual(['#FF0000', '#FF0080', '#FF8000', '#00FF80', '#007FFF']);
    // 色相 180 标记为互补色
    expect(byKey['tetradic'].colors[2].isComplement).toBe(true);
  });

  it('偏移环绕 360 (主色青 #00FFFF h=180: -30 => 150, +30 => 210)', () => {
    const s = calcColorSchemes('#00FFFF');
    const main = s.find((x) => x.key === 'analogous')!;
    expect(main.colors.map((c) => c.hex)).toEqual(['#00FFFF', '#00FF80', '#007FFF']);
  });

  it('无效输入返回空数组', () => {
    expect(calcColorSchemes('')).toEqual([]);
    expect(calcColorSchemes('#12')).toEqual([]);
    expect(calcColorSchemes('xyzabc')).toEqual([]);
  });

  it('无 # 前缀亦可', () => {
    const s = calcColorSchemes('0000ff');
    expect(s[0].colors[0].hex).toBe('#0000FF');
  });
});
