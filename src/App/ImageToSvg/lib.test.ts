import {
  clampParam, countPaths, injectViewBox, normalizeConfig, sizeRatio, svgBytes, svgDataUrl, svgDataUrl as dataUrl,
  toGrayPixels, toRequest, traceSizeOf,
} from './lib';
import { DEFAULT_CONFIG, TRACE_PIXEL_LIMIT } from './data';

describe('图片转 SVG: 参数归一化', () => {
  it('clampParam: 夹取区间 / 吸附步长 / 非法值回退默认', () => {
    expect(clampParam('pathPrecision', 99)).toBe(8);
    expect(clampParam('pathPrecision', -3)).toBe(0);
    expect(clampParam('filterSpeckle', 10.4)).toBe(10);
    // lengthThreshold 步长 0.5
    expect(clampParam('lengthThreshold', 3.4)).toBe(3.5);
    expect(clampParam('lengthThreshold', 0.1)).toBe(0.5);
    expect(clampParam('lengthThreshold', 999)).toBe(10);
    expect(clampParam('maxIterations', '25')).toBe(25);
    expect(clampParam('maxIterations', '')).toBe(DEFAULT_CONFIG.maxIterations);
    expect(clampParam('maxIterations', NaN)).toBe(DEFAULT_CONFIG.maxIterations);
  });

  it('normalizeConfig: 非法枚举回退默认, 数值按各自区间夹取', () => {
    const c = normalizeConfig({ colorMode: 'nope' as never, mode: 'pixel', pathPrecision: -5, layerDifference: 999 });
    expect(c.colorMode).toBe(DEFAULT_CONFIG.colorMode);
    expect(c.mode).toBe('pixel');
    expect(c.pathPrecision).toBe(0);
    expect(c.layerDifference).toBe(255);
    // 未给出的字段全部落到默认值
    expect(c.filterSpeckle).toBe(DEFAULT_CONFIG.filterSpeckle);
    expect(c.hierarchical).toBe(DEFAULT_CONFIG.hierarchical);
    expect(normalizeConfig(null)).toEqual(DEFAULT_CONFIG);
  });

  it('toRequest: binary 只由 colorMode 决定, 11 个字段一个不少', () => {
    const color = toRequest(DEFAULT_CONFIG);
    expect(Object.keys(color).sort()).toEqual([
      'binary', 'colorPrecision', 'cornerThreshold', 'filterSpeckle', 'hierarchical',
      'layerDifference', 'lengthThreshold', 'maxIterations', 'mode', 'pathPrecision', 'spliceThreshold',
    ]);
    expect(color.binary).toBe(false);
    expect(color.mode).toBe('spline');
    const bw = toRequest(normalizeConfig({ colorMode: 'binary', mode: 'polygon' }));
    expect(bw.binary).toBe(true);
    expect(bw.mode).toBe('polygon');
    // 二值下这些参数仍要发给 wasm (缺字段会 panic), 只是不生效
    expect(typeof bw.colorPrecision).toBe('number');
    expect(typeof bw.layerDifference).toBe('number');
  });
});

describe('图片转 SVG: 灰度与尺寸', () => {
  it('toGrayPixels: 按 Rec.709 亮度, α 保持不变', () => {
    const src = new Uint8ClampedArray([ 0, 1, 2, 3, 255, 255, 255, 200 ]);
    const out = toGrayPixels(src);
    expect(out.length).toBe(8);
    expect(out[0]).toBe(1); // round(0*0.2126 + 1*0.7152 + 2*0.0722) = 1
    expect(out[1]).toBe(1);
    expect(out[2]).toBe(1);
    expect(out[3]).toBe(3);
    expect(out[4]).toBe(255);
    expect(out[7]).toBe(200);
    // 不改动原数组
    expect(src[0]).toBe(0);
  });

  it('traceSizeOf: 最长边限制 / 原尺寸 / 像素总量兜底', () => {
    expect(traceSizeOf({ width: 4000, height: 2000 }, 1024)).toEqual({ size: { width: 1024, height: 512 }, scaled: true });
    expect(traceSizeOf({ width: 800, height: 600 }, 1024)).toEqual({ size: { width: 800, height: 600 }, scaled: false });
    expect(traceSizeOf({ width: 800, height: 600 }, 0)).toEqual({ size: { width: 800, height: 600 }, scaled: false });
    expect(traceSizeOf({ width: 512, height: 256 }, 512).scaled).toBe(false);
    // 竖图按长边缩放
    expect(traceSizeOf({ width: 1000, height: 4000 }, 1000)).toEqual({ size: { width: 250, height: 1000 }, scaled: true });
    // 原尺寸但像素总量超限 -> 兜底缩小
    const side = Math.ceil(Math.sqrt(TRACE_PIXEL_LIMIT)) + 5000;
    const capped = traceSizeOf({ width: side, height: side }, 0);
    expect(capped.scaled).toBe(true);
    expect(capped.size.width * capped.size.height).toBeLessThanOrEqual(TRACE_PIXEL_LIMIT);
    // 非法尺寸至少 1 px
    expect(traceSizeOf({ width: 0, height: 0 }, 0)).toEqual({ size: { width: 1, height: 1 }, scaled: false });
  });
});

describe('图片转 SVG: SVG 后处理', () => {
  const raw = '<?xml version="1.0"?>\n<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path d="M0 0h1v1z" fill="#000000" transform="translate(0,0)"/></svg>';

  it('injectViewBox: 补上 viewBox, 幂等且不破坏其它属性', () => {
    const out = injectViewBox(raw, 16, 16);
    expect(out).toContain('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">');
    expect(out).toContain('fill="#000000"');
    expect(injectViewBox(out, 16, 16)).toBe(out);
    // 已是 viewBox 的输入不再重复注入
    expect(injectViewBox('<svg viewBox="0 0 8 8">', 8, 8)).toBe('<svg viewBox="0 0 8 8">');
    // 非 svg 文本原样返回
    expect(injectViewBox('not svg', 8, 8)).toBe('not svg');
    expect(injectViewBox('', 8, 8)).toBe('');
  });

  it('countPaths / svgBytes / svgDataUrl / sizeRatio', () => {
    const svg = '<svg><path d="M0 0"/><path d="M1 1"/></svg>';
    expect(countPaths(svg)).toBe(2);
    expect(countPaths('')).toBe(0);
    expect(svgBytes('abc')).toBe(3);
    // 中文注释按 UTF-8 3 字节计算
    expect(svgBytes('<!-- 中 -->')).toBe('<!-- '.length + 3 + ' -->'.length);
    expect(svgDataUrl(svg)).toBe(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
    expect(dataUrl('<svg><path d="M0 0"/></svg>')).toContain('%22');
    expect(sizeRatio(50, 100)).toBe(50);
    expect(sizeRatio(50, 0)).toBe(0);
  });
});
