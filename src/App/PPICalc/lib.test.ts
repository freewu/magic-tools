import { calcPpi, SCREEN_PRESETS } from './lib';

describe('PPI 值计算 (标准 RGB 排列 / Pentile 排列)', () => {

  it('1920×1080 @ 24″ (16:9 显示器)', () => {
    const r = calcPpi({ widthPx: 1920, heightPx: 1080, diagInch: 24 });
    // sqrt(1920²+1080²)=2202.907, /24 = 91.79
    expect(r.ppi).toBe(91.79);
    expect(r.pentilePpi).toBeCloseTo(91.79 * Math.sqrt(2 / 3), 1); // ≈ 74.94 (内部用未取整 ppi 计算)
    expect(r.rgbSubpixelPpi).toBeCloseTo(91.79 * 3, 1);
    expect(r.pentileSubpixelPpi).toBeCloseTo(91.79 * 2, 1);
    expect(r.widthInch).toBeCloseTo(24 * 1920 / Math.hypot(1920, 1080), 2);
    expect(r.heightInch).toBeCloseTo(24 * 1080 / Math.hypot(1920, 1080), 2);
    expect(r.ratio).toBe('16:9');
    expect(r.totalPx).toBe(2073600);
    expect(r.megapixel).toBe(2.07);
  });

  it('1080×1920 @ 5.5″ (经典 16:9 手机)', () => {
    const r = calcPpi({ widthPx: 1080, heightPx: 1920, diagInch: 5.5 });
    // sqrt(1080²+1920²) / 5.5 = 400.53
    expect(r.ppi).toBe(400.53);
    expect(r.pentilePpi).toBeCloseTo(400.53 * Math.sqrt(2 / 3), 2); // ≈ 327.03
    expect(r.megapixel).toBe(2.07);
  });

  it('1440×3120 @ 6.7″ (QHD+ 手机) PPI 约 513', () => {
    const r = calcPpi({ widthPx: 1440, heightPx: 3120, diagInch: 6.7 });
    expect(r.ppi).toBeGreaterThan(500);
    expect(r.ppi).toBeLessThan(530);
    expect(r.pentilePpi).toBeLessThan(r.ppi);
    expect(r.ratio).toBe('6:13'); // 1440:3120, gcd=240
  });

  it('Pentile 等效密度恒低于标准 RGB (√(2/3) ≈ 0.8165)', () => {
    for (const p of SCREEN_PRESETS) {
      const r = calcPpi({ widthPx: p.widthPx, heightPx: p.heightPx, diagInch: p.diagInch });
      expect(r.ppi).toBeGreaterThan(0);
      expect(r.pentilePpi / r.ppi).toBeCloseTo(Math.sqrt(2 / 3), 3); // round2 引入约 1e-4 级误差
      expect(r.totalPx).toBe(p.widthPx * p.heightPx);
    }
  });

  it('宽高比化简: 宽:高最简整数, 过大简化比退化为长/短数值', () => {
    const r = (w: number, h: number) => calcPpi({ widthPx: w, heightPx: h, diagInch: 10 }).ratio;
    expect(r(1920, 1080)).toBe('16:9');
    expect(r(2560, 1440)).toBe('16:9');
    expect(r(1440, 3120)).toBe('6:13'); // gcd=240
    expect(r(1170, 2532)).toBe('2.16 : 1'); // gcd=6 -> 195:422 过大 -> 数值
    expect(r(3440, 1440)).toBe('43:18');
    expect(r(2732, 2048)).toBe('1.33 : 1'); // gcd=4 -> 683:512 过大 -> 数值
  });

  it('参数校验: 非法输入抛错', () => {
    expect(() => calcPpi({ widthPx: 0, heightPx: 1080, diagInch: 24 })).toThrow();
    expect(() => calcPpi({ widthPx: -100, heightPx: 1080, diagInch: 24 })).toThrow();
    expect(() => calcPpi({ widthPx: 1920, heightPx: 1080, diagInch: 0 })).toThrow();
    expect(() => calcPpi({ widthPx: NaN, heightPx: 1080, diagInch: 24 })).toThrow();
  });
});
