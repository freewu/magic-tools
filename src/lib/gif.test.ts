import type { ParsedFrame, ParsedGif } from 'gifuct-js';
import {
  GIF_COLORS_DEFAULT, GIF_COLORS_MAX, GIF_COLORS_MIN, GIF_DELAY_DEFAULT, GIF_DITHERS,
  GIF_LOOP_INFINITE, GIF_LOOP_ONCE, composeFrames, composeSprite, encodeGif, formatDuration,
  formatFps, frameFileName, loopCountOf, loopTextKey, padNum, parseGif, rgbaToDataUrl,
  rgbaToPngBytes, spriteLayout, totalDuration,
} from './gif';

/** 造一个 gifuct-js 风格的帧 (只带 composeFrames 需要的字段) */
const frameOf = (opts: {
  left?: number; top?: number; width: number; height: number;
  patch: number[]; delay?: number; disposal?: number;
}): ParsedFrame => ({
  dims: { left: opts.left ?? 0, top: opts.top ?? 0, width: opts.width, height: opts.height },
  patch: new Uint8ClampedArray(opts.patch),
  delay: opts.delay,
  disposalType: opts.disposal,
} as unknown as ParsedFrame);

/** 生成 solid 色的 RGBA patch */
const solid = (w: number, h: number, rgba: [number, number, number, number]): number[] => {
  const out: number[] = [];
  for (let i = 0; i < w * h; i++) out.push(rgba[0], rgba[1], rgba[2], rgba[3]);
  return out;
};
const px = (data: Uint8ClampedArray, w: number, x: number, y: number) => {
  const i = (y * w + x) * 4;
  return [ data[i], data[i + 1], data[i + 2], data[i + 3] ];
};

describe('gif 常量', () => {
  test('颜色数 / 延时 / 抖动常量取值合理', () => {
    expect(GIF_COLORS_MIN).toBe(2);
    expect(GIF_COLORS_MAX).toBe(255);
    expect(GIF_COLORS_DEFAULT).toBe(255);
    expect(GIF_DELAY_DEFAULT).toBe(100);
    expect(GIF_LOOP_INFINITE).toBe(0);
    expect(GIF_LOOP_ONCE).toBe(-1);
    expect(GIF_DITHERS).toEqual([ 'none', 'floyd-steinberg', 'atkinson', 'stucki' ]);
  });
});

describe('loopCountOf', () => {
  const parsed = (frames: unknown[]) => ({ frames } as unknown as ParsedGif);

  test('NETSCAPE2.0 扩展解析出循环次数 (16 位小端)', () => {
    expect(loopCountOf(parsed([ { application: { id: 'NETSCAPE2.0', codes: [ 1, 3, 0 ] } } ]))).toBe(3);
    expect(loopCountOf(parsed([ { application: { id: 'NETSCAPE2.0', codes: [ 1, 0, 0 ] } } ]))).toBe(0);
    expect(loopCountOf(parsed([ { application: { id: 'NETSCAPE2.0', codes: [ 1, 0x10, 0x01 ] } } ]))).toBe(272);
  });

  test('无扩展返回 null, 空 codes 返回 0', () => {
    expect(loopCountOf(parsed([ {}, { gce: {} } ]))).toBeNull();
    expect(loopCountOf(parsed([]))).toBeNull();
    expect(loopCountOf(parsed([ { application: { id: 'ANIMEXTS1.0', codes: [] } } ]))).toBe(0);
    expect(loopCountOf(parsed([ { application: { id: 'XMP DataXMP', codes: [ 1, 5, 0 ] } } ]))).toBeNull();
  });
});

describe('composeFrames', () => {
  test('整幅 opaque 帧的像素即 patch', () => {
    const frames = composeFrames([ frameOf({ width: 2, height: 2, patch: solid(2, 2, [ 255, 0, 0, 255 ]), delay: 50 }) ], 2, 2);
    expect(frames).toHaveLength(1);
    expect(frames[0].delay).toBe(50);
    expect(px(frames[0].data, 2, 0, 0)).toEqual([ 255, 0, 0, 255 ]);
    expect(px(frames[0].data, 2, 1, 1)).toEqual([ 255, 0, 0, 255 ]);
  });

  test('透明像素不覆盖上一帧底色', () => {
    const first = frameOf({ width: 2, height: 2, patch: solid(2, 2, [ 0, 255, 0, 255 ]), delay: 10 });
    // 第二帧只画左上角一个不透明像素, 其余透明
    const second = frameOf({
      width: 2, height: 2, delay: 10,
      patch: [ 255, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    });
    const frames = composeFrames([ first, second ], 2, 2);
    expect(px(frames[1].data, 2, 0, 0)).toEqual([ 255, 0, 0, 255 ]);
    expect(px(frames[1].data, 2, 1, 0)).toEqual([ 0, 255, 0, 255 ]);
  });

  test('局部帧按 left/top 贴到画布对应位置', () => {
    const frames = composeFrames([ frameOf({ left: 1, top: 1, width: 1, height: 1, patch: solid(1, 1, [ 9, 8, 7, 255 ]), delay: 0 }) ], 2, 2);
    expect(px(frames[0].data, 2, 1, 1)).toEqual([ 9, 8, 7, 255 ]);
    expect(px(frames[0].data, 2, 0, 0)).toEqual([ 0, 0, 0, 0 ]);
  });

  test('处置方式 2 绘制后清空该帧矩形', () => {
    const frames = composeFrames([
      frameOf({ width: 2, height: 2, patch: solid(2, 2, [ 255, 0, 0, 255 ]), delay: 10, disposal: 2 }),
      frameOf({ left: 0, top: 0, width: 1, height: 1, patch: solid(1, 1, [ 0, 0, 255, 255 ]), delay: 10 }),
    ], 2, 2);
    // 第一帧自身仍是原样
    expect(px(frames[0].data, 2, 0, 0)).toEqual([ 255, 0, 0, 255 ]);
    // 第二帧只在左上角画蓝点, 其余被处置方式 2 清成透明
    expect(px(frames[1].data, 2, 0, 0)).toEqual([ 0, 0, 255, 255 ]);
    expect(px(frames[1].data, 2, 1, 1)).toEqual([ 0, 0, 0, 0 ]);
  });

  test('处置方式 3 绘制后还原上一帧画面', () => {
    const frames = composeFrames([
      frameOf({ width: 2, height: 2, patch: solid(2, 2, [ 255, 0, 0, 255 ]), delay: 10 }),
      // 全透明帧 + disposal 3: 还原到上一帧
      frameOf({ width: 2, height: 2, patch: solid(2, 2, [ 0, 0, 0, 0 ]), delay: 10, disposal: 3 }),
      frameOf({ left: 1, top: 0, width: 1, height: 2, patch: solid(1, 2, [ 0, 0, 255, 255 ]), delay: 10 }),
    ], 2, 2);
    expect(px(frames[2].data, 2, 0, 0)).toEqual([ 255, 0, 0, 255 ]);
    expect(px(frames[2].data, 2, 1, 0)).toEqual([ 0, 0, 255, 255 ]);
  });

  test('缺失 patch / patch 过短时跳过绘制, 延时缺失用默认值', () => {
    const bare = { dims: { left: 0, top: 0, width: 4, height: 4 } } as unknown as ParsedFrame;
    const short = frameOf({ width: 2, height: 2, patch: [ 255, 0, 0, 255 ] });
    const frames = composeFrames([ bare, short ], 2, 2);
    expect(frames[0].delay).toBe(GIF_DELAY_DEFAULT);
    expect(Array.from(frames[0].data)).toEqual([ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]);
    expect(Array.from(frames[1].data)).toEqual([ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]);
  });

  test('画布尺寸非法返回空数组', () => {
    expect(composeFrames([ frameOf({ width: 1, height: 1, patch: solid(1, 1, [ 1, 2, 3, 255 ]) }) ], 0, 5)).toEqual([]);
  });

  test('半透明像素按 α 混合', () => {
    const frames = composeFrames([
      frameOf({ width: 1, height: 1, patch: [ 0, 0, 0, 255 ], delay: 10 }),
      frameOf({ width: 1, height: 1, patch: [ 255, 255, 255, 128 ], delay: 10 }),
    ], 1, 1);
    const [ r, g, b, a ] = px(frames[1].data, 1, 0, 0);
    expect(r).toBeGreaterThan(120);
    expect(r).toBeLessThan(135);
    expect(g).toBe(r);
    expect(b).toBe(r);
    expect(a).toBe(255);
  });
});

describe('解析 / 编码往返', () => {
  const twoFrames = () => ([
    { data: new Uint8ClampedArray([ 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255 ]), delay: 100 },
    { data: new Uint8ClampedArray([ 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255 ]), delay: 200 },
  ]);

  test('encodeGif → parseGif 往返: 尺寸 / 帧数 / 循环 / 像素', async () => {
    const bytes = await encodeGif(twoFrames(), { width: 2, height: 2, loop: GIF_LOOP_INFINITE, maxColors: 4 });
    expect(bytes).toBeInstanceOf(Uint8Array);
    // GIF89a 头
    expect(String.fromCharCode(...bytes.subarray(0, 6))).toBe('GIF89a');
    const data = parseGif(bytes);
    expect(data.width).toBe(2);
    expect(data.height).toBe(2);
    expect(data.frames).toHaveLength(2);
    expect(data.loopCount).toBe(0);
    expect(data.bytes).toBe(bytes.length);
    expect(px(data.frames[0].data, 2, 0, 0)).toEqual([ 255, 0, 0, 255 ]);
    expect(px(data.frames[1].data, 2, 1, 1)).toEqual([ 0, 0, 255, 255 ]);
    expect(data.frames[0].index).toBe(0);
    expect(data.frames[1].index).toBe(1);
    expect(totalDuration(data.frames)).toBeGreaterThan(0);
  });

  test('loop = -1 时不写 NETSCAPE 扩展 (只播放一次)', async () => {
    const bytes = await encodeGif(twoFrames(), { width: 2, height: 2, loop: GIF_LOOP_ONCE, maxColors: 4 });
    expect(parseGif(bytes).loopCount).toBeNull();
  });

  test('解析非 GIF 数据抛错', () => {
    expect(() => parseGif(new Uint8Array([ 1, 2, 3, 4, 5, 6, 7, 8 ]))).toThrow();
  });

  test('encodeGif 参数校验: 无帧 / 尺寸非法', async () => {
    await expect(encodeGif([], { width: 2, height: 2 })).rejects.toThrow('no-frames');
    await expect(encodeGif(twoFrames(), { width: 0, height: 2 })).rejects.toThrow('invalid-gif-size');
  });
});

describe('时长与文本', () => {
  test('totalDuration 累计延时并忽略非法值', () => {
    expect(totalDuration([ { delay: 100 }, { delay: 200 } ])).toBe(300);
    expect(totalDuration([ { delay: -5 }, { delay: Number.NaN } ])).toBe(0);
  });

  test('formatDuration: ms / s', () => {
    expect(formatDuration(0)).toBe('0 ms');
    expect(formatDuration(999)).toBe('999 ms');
    expect(formatDuration(1000)).toBe('1.00 s');
    expect(formatDuration(12345)).toBe('12.35 s');
  });

  test('formatFps', () => {
    expect(formatFps([ { delay: 100 }, { delay: 100 } ])).toBe('10.0');
    expect(formatFps([ { delay: 0 } ])).toBe('-');
  });

  test('loopTextKey', () => {
    expect(loopTextKey(null)).toBe('只播放一次');
    expect(loopTextKey(0)).toBe('无限循环');
    expect(loopTextKey(3)).toBe('循环 3 次');
  });

  test('padNum / frameFileName', () => {
    expect(padNum(1, 3)).toBe('001');
    expect(padNum(42, 1)).toBe('42');
    expect(frameFileName('frame', 0, 12)).toBe('frame_01.png');
    expect(frameFileName('shot', 9, 120, 'jpg')).toBe('shot_010.jpg');
  });
});

describe('精灵图', () => {
  test('spriteLayout 收缩列数并计算行数', () => {
    expect(spriteLayout(0, 4)).toEqual({ cols: 0, rows: 0 });
    expect(spriteLayout(4, 2)).toEqual({ cols: 2, rows: 2 });
    expect(spriteLayout(5, 3)).toEqual({ cols: 3, rows: 2 });
    expect(spriteLayout(2, 10)).toEqual({ cols: 2, rows: 1 });
  });

  test('composeSprite 按行列铺开, 支持间隔', () => {
    const red = new Uint8ClampedArray(solid(2, 2, [ 255, 0, 0, 255 ]));
    const blue = new Uint8ClampedArray(solid(2, 2, [ 0, 0, 255, 255 ]));
    const sprite = composeSprite([ red, blue ], 2, 2, 2, 1);
    expect(sprite.cols).toBe(2);
    expect(sprite.rows).toBe(1);
    expect(sprite.width).toBe(5);
    expect(sprite.height).toBe(2);
    expect(px(sprite.data, 5, 0, 0)).toEqual([ 255, 0, 0, 255 ]);
    expect(px(sprite.data, 5, 2, 0)).toEqual([ 0, 0, 0, 0 ]); // 间隔透明
    expect(px(sprite.data, 5, 3, 0)).toEqual([ 0, 0, 255, 255 ]);
  });

  test('composeSprite 空 / 尺寸非法返回空结果', () => {
    expect(composeSprite([], 2, 2, 2)).toEqual({ data: new Uint8ClampedArray(0), width: 0, height: 0, cols: 0, rows: 0 });
    expect(composeSprite([ new Uint8ClampedArray(4) ], 0, 0, 1).data.length).toBe(0);
  });

  test('间隔色填充', () => {
    const red = new Uint8ClampedArray(solid(1, 1, [ 255, 0, 0, 255 ]));
    const sprite = composeSprite([ red, red ], 1, 1, 2, 1, [ 255, 255, 255, 255 ]);
    expect(px(sprite.data, 3, 1, 0)).toEqual([ 255, 255, 255, 255 ]);
  });
});

describe('像素导出 (需 canvas)', () => {
  const proto = HTMLCanvasElement.prototype;
  const originals = { getContext: proto.getContext, toDataURL: proto.toDataURL };
  let put: ImageData | null = null;

  beforeAll(() => {
    HTMLCanvasElement.prototype.getContext = (() => ({
      createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
      putImageData: (data: ImageData) => { put = data; },
    })) as unknown as HTMLCanvasElement['getContext'];
    HTMLCanvasElement.prototype.toDataURL = (() => 'data:image/png;base64,QUJD') as never;
  });

  afterAll(() => {
    HTMLCanvasElement.prototype.getContext = originals.getContext;
    HTMLCanvasElement.prototype.toDataURL = originals.toDataURL;
  });

  beforeEach(() => { put = null; });

  test('rgbaToDataUrl 写入像素并导出 dataURL', () => {
    const data = new Uint8ClampedArray(solid(1, 1, [ 1, 2, 3, 255 ]));
    expect(rgbaToDataUrl(data, 1, 1)).toBe('data:image/png;base64,QUJD');
    expect(Array.from(put!.data)).toEqual([ 1, 2, 3, 255 ]);
  });

  test('rgbaToDataUrl 数据不足返回 null', () => {
    expect(rgbaToDataUrl(new Uint8ClampedArray(2), 1, 1)).toBeNull();
    expect(rgbaToDataUrl(new Uint8ClampedArray(4), 0, 1)).toBeNull();
  });

  test('rgbaToPngBytes 解码 base64', () => {
    const bytes = rgbaToPngBytes(new Uint8ClampedArray(solid(1, 1, [ 1, 2, 3, 255 ])), 1, 1);
    expect(Array.from(bytes!)).toEqual([ 65, 66, 67 ]);
  });

  test('canvas 不可用时返回 null', () => {
    HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];
    expect(rgbaToDataUrl(new Uint8ClampedArray(solid(1, 1, [ 1, 2, 3, 255 ])), 1, 1)).toBeNull();
    HTMLCanvasElement.prototype.getContext = originals.getContext;
  });
});
