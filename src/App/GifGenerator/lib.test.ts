import {
  BG_KEY, COLORS_DEFAULT, COLORS_KEY, DELAY_KEY, DELAY_MAX, DELAY_MIN, DITHER_KEY, FIT_DEFAULT, FIT_KEY,
  GIF_GEN_CHANGED, LOOP_DEFAULT, MAX_IMAGES, buildFrames, canvasSizeFor, clampInt, defaultGifName, fitRect,
  getDefaultGen, getGenDefaults, moveItem, normalizeColor, normalizeColors, normalizeDelay, normalizeDither, normalizeFit,
  normalizeLoop, parseColor, removeItem, reverseItems, setDefaultGen, setGenDefault, totalMs, withAllDelays, withDelay,
} from './lib';

const fillRects: string[] = [];
const drawImages: number[][] = [];
const ctx = {
  fillStyle: '',
  fillRect: () => { fillRects.push(String(ctx.fillStyle)); },
  drawImage: (...args: unknown[]) => { drawImages.push(args.slice(1) as number[]); },
  getImageData: (_x: number, _y: number, w: number, h: number) => ({
    data: new Uint8ClampedArray(w * h * 4).fill(7), width: w, height: h,
  }),
};
const canvas = () => document.createElement('canvas');

beforeEach(() => {
  localStorage.clear();
  fillRects.length = 0;
  drawImages.length = 0;
  ctx.fillStyle = '';
});

describe('GifGenerator 参数规范化', () => {
  test('MAX_IMAGES 为正整数上限', () => {
    expect(MAX_IMAGES).toBeGreaterThan(0);
    expect(Number.isInteger(MAX_IMAGES)).toBe(true);
  });

  test('clampInt 取整并夹到区间, 空值回退', () => {
    expect(clampInt(33.4, 20, 100, 50)).toBe(33);
    expect(clampInt(1, 20, 100, 50)).toBe(20);
    expect(clampInt(9999, 20, 100, 50)).toBe(100);
    expect(clampInt(null, 20, 100, 50)).toBe(50);
    expect(clampInt('', 20, 100, 50)).toBe(50);
    expect(clampInt('abc', 20, 100, 50)).toBe(50);
  });

  test('normalizeDelay / Loop / Colors', () => {
    expect(normalizeDelay(null)).toBe(100);
    expect(normalizeDelay(5)).toBe(DELAY_MIN);
    expect(normalizeDelay(999999)).toBe(DELAY_MAX);
    expect(normalizeDelay(120.6)).toBe(121);

    expect(normalizeLoop(null)).toBe(LOOP_DEFAULT);
    expect(normalizeLoop(-3)).toBe(0);
    expect(normalizeLoop(1000)).toBe(100);

    expect(normalizeColors(null)).toBe(COLORS_DEFAULT);
    expect(normalizeColors(1)).toBe(2);
    expect(normalizeColors(300)).toBe(255);
  });

  test('normalizeDither / normalizeFit 只接受白名单', () => {
    expect(normalizeDither('atkinson')).toBe('atkinson');
    expect(normalizeDither('bogus')).toBe('none');
    expect(normalizeDither(undefined)).toBe('none');
    expect(normalizeFit('cover')).toBe('cover');
    expect(normalizeFit('bogus')).toBe(FIT_DEFAULT);
  });

  test('normalizeColor 展开三位短写并去 alpha', () => {
    expect(normalizeColor('#ABC')).toBe('#aabbcc');
    expect(normalizeColor('#AABBCC')).toBe('#aabbcc');
    expect(normalizeColor('#aabbcc80')).toBe('#aabbcc');
    expect(normalizeColor('  #aabbcc  ')).toBe('#aabbcc');
    expect(normalizeColor('')).toBe('');
    expect(normalizeColor(null)).toBe('');
    expect(normalizeColor('red', '#123456')).toBe('#123456');
  });

  test('parseColor -> rgba, 透明 / 非法为 null', () => {
    expect(parseColor('#ff0080')).toEqual([ 255, 0, 128, 255 ]);
    expect(parseColor('#fff')).toEqual([ 255, 255, 255, 255 ]);
    expect(parseColor('')).toBeNull();
    expect(parseColor('nope')).toBeNull();
  });
});

describe('GifGenerator 尺寸适配', () => {
  test('fitRect: contain 居中留白', () => {
    expect(fitRect(100, 50, 200, 200, 'contain')).toEqual({ x: 0, y: 50, width: 200, height: 100 });
  });

  test('fitRect: cover 放大到铺满且偏移非正', () => {
    const r = fitRect(100, 50, 200, 200, 'cover') as { x: number; y: number; width: number; height: number };
    expect(r.width).toBeGreaterThanOrEqual(200);
    expect(r.height).toBeGreaterThanOrEqual(200);
    expect(r.x).toBeLessThanOrEqual(0);
    expect(r.y).toBeLessThanOrEqual(0);
  });

  test('fitRect: stretch 铺满 / source 与 contain 一致', () => {
    expect(fitRect(100, 50, 200, 200, 'stretch')).toEqual({ x: 0, y: 0, width: 200, height: 200 });
    expect(fitRect(100, 50, 200, 200, 'source')).toEqual(fitRect(100, 50, 200, 200, 'contain'));
    // 默认 contain
    expect(fitRect(100, 50, 200, 200)).toEqual(fitRect(100, 50, 200, 200, 'contain'));
  });

  test('fitRect: 尺寸非法返回 null', () => {
    expect(fitRect(0, 50, 200, 200, 'contain')).toBeNull();
    expect(fitRect(100, 50, 0, 200, 'cover')).toBeNull();
  });

  test('canvasSizeFor: source 用首图, 其余用自定义', () => {
    expect(canvasSizeFor([ { width: 80, height: 40 } ], 'source', { width: 320, height: 320 })).toEqual({ width: 80, height: 40 });
    expect(canvasSizeFor([], 'source', { width: 320, height: 240 })).toEqual({ width: 320, height: 240 });
    expect(canvasSizeFor([ { width: 80, height: 40 } ], 'contain', { width: 320, height: 240 })).toEqual({ width: 320, height: 240 });
    expect(canvasSizeFor([], 'contain', { width: 0, height: -5 })).toEqual({ width: 1, height: 1 });
  });
});

describe('GifGenerator 帧合成', () => {
  const sources = [
    { img: canvas(), size: { width: 4, height: 4 } },
    { img: canvas(), size: { width: 8, height: 8 } },
  ];

  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ctx) as unknown as HTMLCanvasElement['getContext'];
  });

  test('每张图片一帧, 逐帧延时优先于全局延时', () => {
    const frames = buildFrames(sources, { width: 10, height: 10, fit: 'contain', delay: 100, bg: '' }, [ 40, 250 ]);
    expect(frames).toHaveLength(2);
    expect(frames?.map((f) => f.delay)).toEqual([ 40, 250 ]);
    expect(frames?.[0].data.length).toBe(10 * 10 * 4);
    expect(frames?.[0].data[0]).toBe(7); // 来自 getImageData 桩
  });

  test('未给逐帧延时时用全局延时, 越界延时被规范化', () => {
    const frames = buildFrames(sources, { width: 4, height: 4, fit: 'stretch', delay: 70, bg: '' });
    expect(frames?.map((f) => f.delay)).toEqual([ 70, 70 ]);
    const clamped = buildFrames(sources, { width: 4, height: 4, fit: 'stretch', delay: 1, bg: '' });
    expect(clamped?.[0].delay).toBe(DELAY_MIN);
  });

  test('背景色会先铺底, 透明时不动 fillStyle', () => {
    buildFrames(sources, { width: 10, height: 10, fit: 'contain', delay: 100, bg: '#ff0000' });
    expect(fillRects.length).toBe(2);
    fillRects.length = 0;
    buildFrames(sources, { width: 10, height: 10, fit: 'contain', delay: 100, bg: '' });
    expect(fillRects).toHaveLength(0);
  });

  test('按尺寸模式绘制目标矩形', () => {
    buildFrames([ sources[0] ], { width: 10, height: 10, fit: 'contain', delay: 100, bg: '' });
    expect(drawImages[0]).toEqual([ 0, 0, 10, 10 ]);
    drawImages.length = 0;
    buildFrames([ sources[0] ], { width: 10, height: 10, fit: 'stretch', delay: 100, bg: '' });
    expect(drawImages[0]).toEqual([ 0, 0, 10, 10 ]);
    drawImages.length = 0;
    buildFrames([ sources[1] ], { width: 10, height: 10, fit: 'contain', delay: 100, bg: '' });
    expect(drawImages[0]).toEqual([ 0, 0, 10, 10 ]);
  });

  test('空列表返回空数组, canvas 不可用返回 null', () => {
    expect(buildFrames([], { width: 10, height: 10, fit: 'contain', delay: 100, bg: '' })).toEqual([]);
    HTMLCanvasElement.prototype.getContext = jest.fn(() => null) as unknown as HTMLCanvasElement['getContext'];
    expect(buildFrames(sources, { width: 10, height: 10, fit: 'contain', delay: 100, bg: '' })).toBeNull();
  });
});

describe('GifGenerator 列表操作', () => {
  const list = [ 'a', 'b', 'c' ];

  test('moveItem 上移 / 下移, 越界不动', () => {
    expect(moveItem(list, 1, -1)).toEqual([ 'b', 'a', 'c' ]);
    expect(moveItem(list, 0, 1)).toEqual([ 'b', 'a', 'c' ]);
    expect(moveItem(list, 0, -1)).toEqual(list);
    expect(moveItem(list, 2, 1)).toEqual(list);
    expect(moveItem(list, 9, 1)).toEqual(list);
    expect(list).toEqual([ 'a', 'b', 'c' ]); // 原数组不变
  });

  test('removeItem / reverseItems', () => {
    expect(removeItem(list, 1)).toEqual([ 'a', 'c' ]);
    expect(removeItem(list, 9)).toEqual(list);
    expect(reverseItems(list)).toEqual([ 'c', 'b', 'a' ]);
    expect(list).toEqual([ 'a', 'b', 'c' ]);
  });

  test('withDelay / withAllDelays 规范化延时', () => {
    const frames = [ { delay: 100 }, { delay: 100 } ];
    expect(withDelay(frames, 1, 250)).toEqual([ { delay: 100 }, { delay: 250 } ]);
    expect(withDelay(frames, 5, 250)).toEqual(frames);
    expect(withAllDelays(frames, 1).map((f) => f.delay)).toEqual([ DELAY_MIN, DELAY_MIN ]);
    expect(frames).toEqual([ { delay: 100 }, { delay: 100 } ]);
  });

  test('totalMs 累加 (非法延时按 0)', () => {
    expect(totalMs([ { delay: 100 }, { delay: 250 } ])).toBe(350);
    expect(totalMs([])).toBe(0);
    expect(totalMs([ { delay: Number.NaN } ])).toBe(0);
  });

  test('defaultGifName 用首图名, 无图回退 animation.gif', () => {
    expect(defaultGifName([ { name: 'cat photo.png' } ])).toBe('cat photo.gif');
    expect(defaultGifName([])).toBe('animation.gif');
  });
});

describe('GifGenerator 默认值', () => {
  test('未设置时返回内置默认值', () => {
    const d = getGenDefaults();
    expect(d.delay).toBe(100);
    expect(d.loop).toBe(LOOP_DEFAULT);
    expect(d.colors).toBe(COLORS_DEFAULT);
    expect(d.dither).toBe('none');
    expect(d.fit).toBe(FIT_DEFAULT);
    expect(d.bg).toBe('');
  });

  test('写入后读取一致并广播', () => {
    const seen: string[] = [];
    const onChange = () => seen.push('changed');
    window.addEventListener(GIF_GEN_CHANGED, onChange);

    setGenDefault('delay', 250);
    setGenDefault('loop', 3);
    setGenDefault('colors', 64);
    setGenDefault('dither', 'atkinson');
    setGenDefault('fit', 'cover');
    setGenDefault('bg', '#ff8800');

    const d = getGenDefaults();
    expect(d).toEqual({ delay: 250, loop: 3, colors: 64, dither: 'atkinson', fit: 'cover', bg: '#ff8800' });
    expect(localStorage.getItem(DELAY_KEY)).toBe('250');
    expect(localStorage.getItem(COLORS_KEY)).toBe('64');
    expect(localStorage.getItem(DITHER_KEY)).toBe('atkinson');
    expect(localStorage.getItem(FIT_KEY)).toBe('cover');
    expect(localStorage.getItem(BG_KEY)).toBe('#ff8800');
    expect(seen).toHaveLength(6);

    window.removeEventListener(GIF_GEN_CHANGED, onChange);
  });

  test('非法存量被规范化, localStorage 不可用时回退默认', () => {
    localStorage.setItem(FIT_KEY, 'bogus');
    localStorage.setItem(BG_KEY, 'not-a-color');
    expect(getGenDefaults().fit).toBe(FIT_DEFAULT);
    expect(getGenDefaults().bg).toBe('');

    const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    expect(getGenDefaults().delay).toBe(100);
    spy.mockRestore();
  });

  test('配置文件导入导出: getDefaultGen / setDefaultGen 成对可用', () => {
    expect(getDefaultGen()).toEqual(getGenDefaults());

    setDefaultGen({ delay: 300, fit: 'cover', dither: 'stucki', colors: 999, loop: -2, bg: '#FF8800' });
    expect(getGenDefaults()).toEqual({
      delay: 300, loop: 0, colors: 255, dither: 'stucki', fit: 'cover', bg: '#ff8800',
    });

    // 缺失项保持原值, 非对象值忽略
    setDefaultGen({ delay: 60 } as never);
    expect(getGenDefaults()).toEqual({
      delay: 60, loop: 0, colors: 255, dither: 'stucki', fit: 'cover', bg: '#ff8800',
    });
    setDefaultGen(null);
    setDefaultGen('nope' as never);
    expect(getGenDefaults().delay).toBe(60);
  });
});
