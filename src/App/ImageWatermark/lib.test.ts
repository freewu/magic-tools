import {
  FONT_STACKS, OUTPUT_FORMATS, POSITIONS, anchorOf, baseName, buildPlan, clampNum, contrastStroke, dataUrlToBytes,
  drawPlan, extOf, fitFontSize, fontString, formatBytes, isLossy, layoutPositions, luminance, measureTextBlock,
  mimeOf, normalizeFontScale, normalizeFormat, normalizeGap, normalizeKind, normalizeLayout, normalizeLogoScale,
  normalizeMargin, normalizeOpacity, normalizePosition, normalizeRotate, outputFileName, parseHex, rotatedBBox,
  splitLines, strokeWidthOf, tilePositions, widestLine,
  type BuildPlanOptions, type WatermarkPlan,
} from './lib';

/** 桩度量: 每个字符宽度 = 字号 × 0.5 (西文近似), 便于断言 */
const stubMeasure = (text: string, font: string): number => {
  const size = Number(/(\d+)px/.exec(font)?.[1] ?? 0);
  return text.length * size * 0.5;
};

const planOptions = (over: Partial<BuildPlanOptions> = {}): BuildPlanOptions => ({
  kind: 'text',
  text: '内部资料',
  font: 'sans',
  fontScale: 5,
  bold: false,
  italic: false,
  color: '#ffffff',
  stroke: false,
  fit: true,
  logoSize: { width: 200, height: 100 },
  logoScale: 20,
  layout: 'single',
  position: 'br',
  margin: 24,
  gap: 120,
  rotate: 0,
  opacity: 0.35,
  measure: stubMeasure,
  ...over,
});

describe('取值校验', () => {
  it('clampNum 夹取并回退默认值', () => {
    expect(clampNum(5, 1, 10, 3)).toBe(5);
    expect(clampNum(-5, 1, 10, 3)).toBe(1);
    expect(clampNum(50, 1, 10, 3)).toBe(10);
    expect(clampNum('abc', 1, 10, 3)).toBe(3);
    expect(clampNum(null, 1, 10, 3)).toBe(3);
    expect(clampNum('', 1, 10, 3)).toBe(3);
    expect(clampNum('7', 1, 10, 3)).toBe(7);
  });

  it('枚举回退', () => {
    expect(normalizeKind('image')).toBe('image');
    expect(normalizeKind('xxx')).toBe('text');
    expect(normalizePosition('mc')).toBe('mc');
    expect(normalizePosition('zz')).toBe('br');
    expect(normalizeLayout('tile')).toBe('tile');
    expect(normalizeLayout('')).toBe('single');
    expect(normalizeFormat('webp')).toBe('WebP');
    expect(normalizeFormat('jpeg')).toBe('JPEG');
    expect(normalizeFormat('bmp')).toBe('PNG');
  });

  it('数值回退与夹取', () => {
    expect(normalizeOpacity(0.42)).toBe(0.42);
    expect(normalizeOpacity(0)).toBe(0.05);
    expect(normalizeOpacity(9)).toBe(1);
    expect(normalizeOpacity('x')).toBe(0.35);
    expect(normalizeFontScale(1000)).toBe(30);
    expect(normalizeFontScale(-1)).toBe(1);
    expect(normalizeLogoScale(1)).toBe(2);
    expect(normalizeMargin(-20)).toBe(0);
    expect(normalizeMargin(1e9)).toBe(400);
    expect(normalizeGap(1)).toBe(20);
    expect(normalizeGap(1e9)).toBe(600);
    expect(normalizeRotate(400)).toBe(90);
    expect(normalizeRotate(-400)).toBe(-90);
    expect(normalizeRotate(12.4)).toBe(12);
  });
});

describe('格式与文件名', () => {
  it('扩展名 / MIME / 是否有损', () => {
    expect(extOf('PNG')).toBe('png');
    expect(extOf('JPEG')).toBe('jpg');
    expect(extOf('WebP')).toBe('webp');
    expect(mimeOf('PNG')).toBe('image/png');
    expect(mimeOf('JPEG')).toBe('image/jpeg');
    expect(mimeOf('WebP')).toBe('image/webp');
    expect(OUTPUT_FORMATS.map(isLossy)).toEqual([ false, true, true ]);
  });

  it('文件名主体清洗与输出名 (不覆盖原图)', () => {
    expect(baseName('photo.png')).toBe('photo');
    expect(baseName('a.b.c.jpg')).toBe('a.b.c');
    expect(baseName('a/b:c*.png')).toBe('a_b_c_');
    expect(baseName('.png')).toBe('image');
    expect(baseName('   ')).toBe('image');
    expect(outputFileName('photo', 'JPEG')).toBe('photo_watermark.jpg');
    expect(outputFileName('', 'PNG')).toBe('image_watermark.png');
  });

  it('体积格式化', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(-1)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.00 MB');
  });

  it('dataURL -> 字节数组 (base64 解码)', () => {
    // "Hi" = 0x48 0x69
    expect(Array.from(dataUrlToBytes('data:image/png;base64,SGk='))).toEqual([ 0x48, 0x69 ]);
  });
});

describe('旋转外接矩形', () => {
  it('0 / 90 / 180 度', () => {
    expect(rotatedBBox({ width: 200, height: 50 }, 0)).toEqual({ width: 200, height: 50 });
    expect(rotatedBBox({ width: 200, height: 50 }, 90)).toEqual({ width: 50, height: 200 });
    expect(rotatedBBox({ width: 200, height: 50 }, 180)).toEqual({ width: 200, height: 50 });
    expect(rotatedBBox({ width: 200, height: 50 }, -90)).toEqual({ width: 50, height: 200 });
  });

  it('45 度时按正弦余弦展开', () => {
    const r = rotatedBBox({ width: 100, height: 100 }, 45);
    expect(r.width).toBe(141); // 100*(√2/2)*2 ≈ 141.4
    expect(r.height).toBe(141);
  });
});

describe('九宫格锚点', () => {
  const img = { width: 1000, height: 800 };
  const box = { width: 200, height: 50 };

  it('九个位置 (边距 24)', () => {
    expect(anchorOf('tl', img, box, 24)).toEqual({ x: 24, y: 24 });
    expect(anchorOf('tc', img, box, 24)).toEqual({ x: 400, y: 24 });
    expect(anchorOf('tr', img, box, 24)).toEqual({ x: 776, y: 24 });
    expect(anchorOf('ml', img, box, 24)).toEqual({ x: 24, y: 375 });
    expect(anchorOf('mc', img, box, 24)).toEqual({ x: 400, y: 375 });
    expect(anchorOf('mr', img, box, 24)).toEqual({ x: 776, y: 375 });
    expect(anchorOf('bl', img, box, 24)).toEqual({ x: 24, y: 726 });
    expect(anchorOf('bc', img, box, 24)).toEqual({ x: 400, y: 726 });
    expect(anchorOf('br', img, box, 24)).toEqual({ x: 776, y: 726 });
  });

  it('边距为 0 时贴边', () => {
    expect(anchorOf('br', img, box, 0)).toEqual({ x: 800, y: 750 });
    expect(anchorOf('tl', img, box, 0)).toEqual({ x: 0, y: 0 });
  });

  it('POSITIONS 顺序即九宫格阅读顺序', () => {
    expect(POSITIONS).toEqual([ 'tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br' ]);
  });
});

describe('平铺排布', () => {
  it('行列数覆盖整图且向外多铺一圈', () => {
    const img = { width: 1000, height: 1000 };
    const box = { width: 100, height: 40 };
    const pts = tilePositions(img, box, 50); // cell = 150 × 90
    expect(pts.length).toBe(8 * 13); // cols = ceil(1000/150)+1 = 8, rows = ceil(1000/90)+1 = 13
  });

  it('首尾中心关于图片中心对称', () => {
    const img = { width: 1000, height: 1000 };
    const box = { width: 100, height: 40 };
    const pts = tilePositions(img, box, 50);
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const cx = (Math.min(...xs) + box.width / 2 + Math.max(...xs) + box.width / 2) / 2;
    const cy = (Math.min(...ys) + box.height / 2 + Math.max(...ys) + box.height / 2) / 2;
    expect(cx).toBeCloseTo(img.width / 2, 6);
    expect(cy).toBeCloseTo(img.height / 2, 6);
  });

  it('间距为 0 时退化为紧密平铺', () => {
    const pts = tilePositions({ width: 200, height: 100 }, { width: 100, height: 50 }, 0);
    expect(pts.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
    expect(pts.length).toBeGreaterThan(0);
  });

  it('layoutPositions: 单个用锚点, 平铺用网格', () => {
    const img = { width: 1000, height: 800 };
    const box = { width: 200, height: 50 };
    expect(layoutPositions({ img, box, layout: 'single', position: 'br', margin: 24, gap: 120 }))
      .toEqual([ anchorOf('br', img, box, 24) ]);
    expect(layoutPositions({ img, box, layout: 'tile', position: 'br', margin: 24, gap: 120 }).length)
      .toBe(tilePositions(img, box, 120).length);
  });
});

describe('文字拆分 / 度量 / 自动缩放', () => {
  it('按行拆分: 兼容 CRLF / CR, 去空行与首尾空白', () => {
    expect(splitLines('a\r\n\r\nb\n  c  ')).toEqual([ 'a', 'b', 'c' ]);
    expect(splitLines('a\rb')).toEqual([ 'a', 'b' ]);
    expect(splitLines('   ')).toEqual([]);
  });

  it('fontString 组合粗体 / 斜体 / 字号', () => {
    expect(fontString({ bold: false, italic: false, fontSize: 48, family: 'serif' })).toBe('48px serif');
    expect(fontString({ bold: true, italic: true, fontSize: 48.4, family: 'serif' })).toBe('italic bold 48px serif');
  });

  it('最宽一行与文字块尺寸', () => {
    const lines = [ 'abc', 'abcde' ]; // 宽 = 字数 × 字号 × 0.5
    expect(widestLine(lines, 20, 'sans', false, false, stubMeasure)).toBe(50);
    expect(measureTextBlock({ lines, fontSize: 20, family: 'sans', bold: false, italic: false, measure: stubMeasure }))
      .toEqual({ width: 50, height: 50 }); // 2 行 × 20 × 1.25
  });

  it('自动缩放: 超宽时收敛到 maxWidth 之内, 且不小于下限', () => {
    const lines = [ '这是一段很长的水印文字内容' ]; // 14 字
    const r = fitFontSize({ lines, fontSize: 100, maxWidth: 200, family: 'sans', bold: false, italic: false, measure: stubMeasure });
    expect(r).toBeLessThan(100);
    expect(widestLine(lines, r, 'sans', false, false, stubMeasure)).toBeLessThanOrEqual(200);
    // 极端情况也不会小于 8px
    const tiny = fitFontSize({ lines, fontSize: 100, maxWidth: 1, family: 'sans', bold: false, italic: false, measure: stubMeasure });
    expect(tiny).toBe(8);
  });

  it('放得下时字号不变; 空文本原样返回', () => {
    expect(fitFontSize({ lines: [ 'hi' ], fontSize: 20, maxWidth: 999, family: 'sans', bold: false, italic: false, measure: stubMeasure })).toBe(20);
    expect(fitFontSize({ lines: [], fontSize: 20, maxWidth: 999, family: 'sans', bold: false, italic: false, measure: stubMeasure })).toBe(20);
    expect(fitFontSize({ lines: [ 'hi' ], fontSize: 20, maxWidth: 0, family: 'sans', bold: false, italic: false, measure: stubMeasure })).toBe(20);
  });
});

describe('颜色与描边', () => {
  it('解析 #rgb / #rrggbb, 非法返回 null', () => {
    expect(parseHex('#fff')).toEqual([ 255, 255, 255 ]);
    expect(parseHex('#000000')).toEqual([ 0, 0, 0 ]);
    expect(parseHex('ff8800')).toEqual([ 255, 136, 0 ]);
    expect(parseHex('rgb(1,2,3)')).toBeNull();
    expect(parseHex('#12345')).toBeNull();
  });

  it('亮度: 白 1, 黑 0', () => {
    expect(luminance('#ffffff')).toBeCloseTo(1, 5);
    expect(luminance('#000000')).toBeCloseTo(0, 5);
    expect(luminance('bad-color')).toBe(1); // 解析失败按白色
  });

  it('描边颜色自动对比', () => {
    expect(contrastStroke('#ffffff')).toBe('#000000');
    expect(contrastStroke('#ffff00')).toBe('#000000'); // 亮黄 -> 黑描边
    expect(contrastStroke('#000000')).toBe('#ffffff');
    expect(contrastStroke('#001133')).toBe('#ffffff');
  });

  it('描边宽度随字号缩放, 至少 1px', () => {
    expect(strokeWidthOf(12)).toBe(1);
    expect(strokeWidthOf(48)).toBe(4);
    expect(strokeWidthOf(1)).toBe(1);
  });
});

describe('buildPlan', () => {
  const img = { width: 1000, height: 600 };

  it('文字水印: 字号按图片宽度百分比, 九宫格锚点按旋转后外接矩形计算', () => {
    const plan = buildPlan(img, planOptions({ rotate: 0, position: 'br' }));
    expect(plan.kind).toBe('text');
    expect(plan.text?.fontSize).toBe(50); // 1000 × 5%
    expect(plan.text?.lineHeight).toBe(63); // 50 × 1.25
    expect(plan.text?.lines).toEqual([ '内部资料' ]);
    expect(plan.box.width).toBe(100); // 4 字 × 50 × 0.5
    expect(plan.rotated).toEqual(plan.box); // 未旋转
    expect(plan.positions).toEqual([ { x: 876, y: 513 } ]); // 1000-100-24 / 600-63-24
    expect(plan.opacity).toBe(0.35);
  });

  it('文字水印: 旋转 90 度时外接矩形宽高互换, 边距按外接矩形算', () => {
    const plan = buildPlan(img, planOptions({ rotate: 90, margin: 20 }));
    expect(plan.rotated).toEqual({ width: plan.box.height, height: plan.box.width });
    const p = plan.positions[0];
    expect(p.x).toBe(img.width - plan.rotated.width - 20);
    expect(p.y).toBe(img.height - plan.rotated.height - 20);
  });

  it('文字水印: 多行 + 自动缩放不会超出可用宽度', () => {
    const plan = buildPlan({ width: 800, height: 400 }, planOptions({ text: '内部资料\n请勿外传\n这是一段很长的说明文字', fontScale: 20, margin: 40 }));
    expect(plan.text?.lines.length).toBe(3);
    expect(plan.box.width).toBeLessThanOrEqual(800 - 80);
  });

  it('文字水印: 关闭自动缩放时按原字号渲染', () => {
    const long = '这是一段很长的水印文字内容哈哈哈';
    const fit = buildPlan(img, planOptions({ text: long, fontScale: 20, fit: true }));
    const raw = buildPlan(img, planOptions({ text: long, fontScale: 20, fit: false }));
    expect(fit.text?.fontSize).toBeLessThan(raw.text?.fontSize ?? 0);
    expect(raw.text?.fontSize).toBe(200);
  });

  it('文字水印: 描边开启时自动配对比色与线宽, 关闭时为 0', () => {
    const on = buildPlan(img, planOptions({ color: '#ffffff', stroke: true }));
    expect(on.text?.strokeColor).toBe('#000000');
    expect(on.text?.strokeWidth).toBe(4); // 50 / 12 ≈ 4
    const off = buildPlan(img, planOptions({ stroke: false }));
    expect(off.text?.strokeWidth).toBe(0);
  });

  it('文字水印: 字体族来自预置栈', () => {
    expect(buildPlan(img, planOptions({ font: 'serif' })).text?.family).toBe(FONT_STACKS.serif);
    expect(buildPlan(img, planOptions({ font: 'mono' })).text?.family).toBe(FONT_STACKS.mono);
  });

  it('图片水印: 宽度按百分比, 高度按 logo 原始宽高比', () => {
    const plan = buildPlan(img, planOptions({ kind: 'image', logoSize: { width: 200, height: 100 }, logoScale: 30 }));
    expect(plan.logo).toEqual({ width: 300, height: 150 });
    expect(plan.box).toEqual({ width: 300, height: 150 });
    expect(plan.text).toBeUndefined();
  });

  it('图片水印: logo 尺寸非法时按正方形兜底', () => {
    const plan = buildPlan(img, planOptions({ kind: 'image', logoSize: { width: 0, height: 0 }, logoScale: 10 }));
    expect(plan.logo).toEqual({ width: 100, height: 100 });
  });

  it('平铺: 生成多个位置且覆盖整图', () => {
    const plan = buildPlan(img, planOptions({ layout: 'tile', gap: 100, rotate: -30 }));
    expect(plan.positions.length).toBeGreaterThan(4);
    expect(plan.rotate).toBe(-30);
  });

  it('非法参数回退默认值 (不抛异常)', () => {
    const plan = buildPlan(img, planOptions({
      opacity: 99, margin: -5, gap: 'x' as unknown as number, rotate: 999, fontScale: 'y' as unknown as number,
    }));
    expect(plan.opacity).toBe(1);
    expect(plan.positions.length).toBe(1);
  });
});

describe('drawPlan', () => {
  interface Call { op: string; args: Array<string | number> }
  /** 记录所有绘制调用的桩 ctx */
  const stubCtx = () => {
    const calls: Call[] = [];
    const state = { alpha: 1, font: '', fillStyle: '', strokeStyle: '', lineWidth: 0, lineJoin: '', textAlign: '', textBaseline: '' };
    const ctx = {
      calls,
      state,
      save: () => calls.push({ op: 'save', args: [] }),
      restore: () => calls.push({ op: 'restore', args: [] }),
      translate: (x: number, y: number) => calls.push({ op: 'translate', args: [ x, y ] }),
      rotate: (r: number) => calls.push({ op: 'rotate', args: [ r ] }),
      fillText: (t: string, x: number, y: number) => calls.push({ op: 'fillText', args: [ t, x, y ] }),
      strokeText: (t: string, x: number, y: number) => calls.push({ op: 'strokeText', args: [ t, x, y ] }),
      drawImage: (...a: unknown[]) => calls.push({ op: 'drawImage', args: a.slice(1) as number[] }),
      get globalAlpha() { return state.alpha; },
      set globalAlpha(v: number) { state.alpha = v; },
      get font() { return state.font; },
      set font(v: string) { state.font = v; },
      get fillStyle() { return state.fillStyle; },
      set fillStyle(v: string) { state.fillStyle = v; },
      get strokeStyle() { return state.strokeStyle; },
      set strokeStyle(v: string) { state.strokeStyle = v; },
      get lineWidth() { return state.lineWidth; },
      set lineWidth(v: number) { state.lineWidth = v; },
      get lineJoin() { return state.lineJoin; },
      set lineJoin(v: string) { state.lineJoin = v; },
      get textAlign() { return state.textAlign; },
      set textAlign(v: string) { state.textAlign = v; },
      get textBaseline() { return state.textBaseline; },
      set textBaseline(v: string) { state.textBaseline = v; },
    };
    return ctx;
  };

  const asCtx = (stub: ReturnType<typeof stubCtx>) => stub as unknown as CanvasRenderingContext2D;

  it('文字水印: 每个位置各 save/restore 一次, 绕自身中心绘制并居中', () => {
    const stub = stubCtx();
    const plan = buildPlan({ width: 1000, height: 600 }, planOptions({ position: 'mc', rotate: 0 })) as WatermarkPlan;
    const drawn = drawPlan(asCtx(stub), plan);

    expect(drawn).toBe(1);
    const ops = stub.calls.map((c) => c.op);
    expect(ops.filter((o) => o === 'save').length).toBe(1);
    expect(ops.filter((o) => o === 'restore').length).toBe(1);
    // 中心点 = 锚点 + 外接矩形的一半
    const center = stub.calls.find((c) => c.op === 'translate')?.args;
    expect(center).toEqual([ plan.positions[0].x + plan.box.width / 2, plan.positions[0].y + plan.box.height / 2 ]);
    // 居中绘制: fillText(text, 0, y)
    const fill = stub.calls.find((c) => c.op === 'fillText');
    expect(fill?.args[0]).toBe('内部资料');
    expect(fill?.args[1]).toBe(0);
    expect(stub.state.alpha).toBe(0.35); // restore 后回到初始值 (桩未真的恢复, 但写入过 0.35)
    expect(stub.state.textAlign).toBe('center');
    expect(stub.state.textBaseline).toBe('middle');
  });

  it('文字水印: 行数为 2 时两行上下对称, 描边开启会先 strokeText', () => {
    const stub = stubCtx();
    const plan = buildPlan({ width: 1000, height: 600 }, planOptions({ text: '内部资料\n请勿外传', stroke: true }));
    drawPlan(asCtx(stub), plan);

    const fills = stub.calls.filter((c) => c.op === 'fillText').map((c) => c.args as [ string, number, number ]);
    const strokes = stub.calls.filter((c) => c.op === 'strokeText');
    expect(fills.map((f) => f[0])).toEqual([ '内部资料', '请勿外传' ]);
    // 两行 y 关于 0 对称 (total = 2 × lineHeight)
    expect(fills[0][2]).toBeCloseTo(-fills[1][2], 6);
    expect(strokes.length).toBe(2);
    // strokeText 必须发生在 fillText 之前
    const firstStroke = stub.calls.findIndex((c) => c.op === 'strokeText');
    const firstFill = stub.calls.findIndex((c) => c.op === 'fillText');
    expect(firstStroke).toBeLessThan(firstFill);
  });

  it('旋转角度写入 ctx.rotate (弧度)', () => {
    const stub = stubCtx();
    const plan = buildPlan({ width: 1000, height: 600 }, planOptions({ rotate: -30 }));
    drawPlan(asCtx(stub), plan);
    const rad = stub.calls.find((c) => c.op === 'rotate')?.args[0] as number;
    expect(rad).toBeCloseTo(-30 * Math.PI / 180, 6);
  });

  it('旋转 0 度时不调用 rotate', () => {
    const stub = stubCtx();
    drawPlan(asCtx(stub), buildPlan({ width: 1000, height: 600 }, planOptions({ rotate: 0 })));
    expect(stub.calls.some((c) => c.op === 'rotate')).toBe(false);
  });

  it('图片水印: 用 drawImage 按 box 尺寸绘制, 平铺时绘制多次', () => {
    const stub = stubCtx();
    const plan = buildPlan({ width: 400, height: 400 }, planOptions({ kind: 'image', layout: 'tile', gap: 50, logoSize: { width: 100, height: 100 }, logoScale: 20 }));
    const drawn = drawPlan(asCtx(stub), plan, { logo: {} as CanvasImageSource });

    expect(drawn).toBe(plan.positions.length);
    const imgs = stub.calls.filter((c) => c.op === 'drawImage');
    expect(imgs.length).toBe(drawn);
    const args = imgs[0].args as number[];
    expect(args.slice(2)).toEqual([ plan.box.width, plan.box.height ]); // drawImage(logo, x, y, w, h)
    expect(args[0]).toBeCloseTo(-plan.box.width / 2, 6);
    expect(args[1]).toBeCloseTo(-plan.box.height / 2, 6);
  });

  it('图片水印: 未提供 logo 素材时什么都不画', () => {
    const stub = stubCtx();
    const plan = buildPlan({ width: 400, height: 400 }, planOptions({ kind: 'image' }));
    expect(drawPlan(asCtx(stub), plan)).toBe(0);
    expect(stub.calls.length).toBeGreaterThan(0); // save/restore 仍然成对执行
    expect(stub.calls.some((c) => c.op === 'drawImage')).toBe(false);
  });

  it('文字为空时不做任何文字绘制', () => {
    const stub = stubCtx();
    const plan = buildPlan({ width: 1000, height: 600 }, planOptions({ text: '   ' }));
    expect(drawPlan(asCtx(stub), plan)).toBe(0);
    expect(stub.calls.some((c) => c.op === 'fillText')).toBe(false);
  });

  it('每个位置都单独 save/restore (平铺时成对出现)', () => {
    const stub = stubCtx();
    const plan = buildPlan({ width: 600, height: 600 }, planOptions({ layout: 'tile', gap: 200 }));
    const drawn = drawPlan(asCtx(stub), plan);
    expect(stub.calls.filter((c) => c.op === 'save').length).toBe(drawn);
    expect(stub.calls.filter((c) => c.op === 'restore').length).toBe(drawn);
  });
});
