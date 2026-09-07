import { calcColorSchemes } from './lib';

// 参考色相表 (color-convert hsl.hex, S/L = 100/50):
//  30=FF8000 60=FFFF00 90=80FF00 120=00FF00 150=00FF80 180=00FFFF
// 210=007FFF 240=0000FF 270=7F00FF 300=FF00FF 330=FF0080

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
