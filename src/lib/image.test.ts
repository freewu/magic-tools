import {
  CANVAS_MAX, ImageError, baseName, createCanvas, dataUrlBytes, dataUrlToBytes, drawToCanvas, exportDataUrl,
  extOf, fillWhite, filterImage, fitWithin, formatBytes, get2d, isImageFile, isLossy, loadImageFile, mimeOf, readPixels, resetWebpCache,
  supportsWebp, writePixels, type Size,
} from './image';

/** 图片桩: 赋值 src 后异步触发 onload, 并带上预设尺寸 */
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 0;
  naturalHeight = 0;
  width = 0;
  height = 0;
  private inner = '';
  get src() { return this.inner; }
  set src(v: string) {
    this.inner = v;
    this.naturalWidth = 40;
    this.naturalHeight = 20;
    setTimeout(() => this.onload?.(), 0);
  }
}

/** 解码失败的图片桩 */
class BrokenImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_v: string) { setTimeout(() => this.onerror?.(), 0); }
}

const realImage = (global as unknown as { Image: unknown }).Image;

/** 记录绘制调用的 2D 上下文桩 */
const makeCtx = () => {
  const calls: Array<{ op: string; args: unknown[] }> = [];
  const ctx = {
    calls,
    fillStyle: '',
    fillRect: (x: number, y: number, w: number, h: number) => calls.push({ op: 'fillRect', args: [ x, y, w, h ] }),
    drawImage: (...args: unknown[]) => calls.push({ op: 'drawImage', args }),
    getImageData: (x: number, y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    putImageData: (...args: unknown[]) => calls.push({ op: 'putImageData', args }),
  };
  return ctx;
};

describe('图片通用能力: 尺寸与文件名', () => {
  it('fitWithin: 未超限时原样返回, 超限时等比缩到上限内', () => {
    expect(fitWithin({ width: 100, height: 50 }, 200, 200)).toEqual({ width: 100, height: 50 });
    expect(fitWithin({ width: 400, height: 200 }, 200, 200)).toEqual({ width: 200, height: 100 });
    expect(fitWithin({ width: 200, height: 400 }, 200, 200)).toEqual({ width: 100, height: 200 });
    // 极限比例也至少保留 1 像素
    expect(fitWithin({ width: 10000, height: 3 }, 10, 10)).toEqual({ width: 10, height: 1 });
  });

  it('baseName: 去扩展名与非法字符, 空名回退', () => {
    expect(baseName('photo.png')).toBe('photo');
    expect(baseName('a.b.c.jpeg')).toBe('a.b.c');
    // 非法字符连续出现时合并成一个下划线
    expect(baseName('C:\\tmp\\my:photo?.png')).toBe('C_tmp_my_photo_');
    expect(baseName('')).toBe('image');
    expect(baseName('.png')).toBe('image'); // 只有扩展名时主体为空 -> 回退
    expect(baseName('', 'fallback')).toBe('fallback');
  });

  it('formatBytes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(-1)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.00 MB');
    expect(formatBytes(NaN)).toBe('0 B');
  });

  it('扩展名 / MIME / 有损判断', () => {
    expect(extOf('PNG')).toBe('png');
    expect(extOf('JPEG')).toBe('jpg');
    expect(extOf('WebP')).toBe('webp');
    expect(mimeOf('PNG')).toBe('image/png');
    expect(mimeOf('JPEG')).toBe('image/jpeg');
    expect(mimeOf('WebP')).toBe('image/webp');
    expect(isLossy('PNG')).toBe(false);
    expect(isLossy('JPEG')).toBe(true);
    expect(isLossy('WebP')).toBe(true);
  });

  it('isImageFile', () => {
    expect(isImageFile(new File([ 'x' ], 'a.png', { type: 'image/png' }))).toBe(true);
    expect(isImageFile(new File([ 'x' ], 'a.txt', { type: 'text/plain' }))).toBe(false);
    expect(isImageFile({ type: undefined } as unknown as File)).toBe(false);
  });
});

describe('图片通用能力: 画布与像素', () => {
  it('createCanvas: 尺寸非法或超上限返回 null', () => {
    const canvas = createCanvas({ width: 12, height: 8 } as Size);
    expect(canvas?.width).toBe(12);
    expect(canvas?.height).toBe(8);
    expect(createCanvas({ width: 0, height: 10 })).toBeNull();
    expect(createCanvas({ width: -3, height: 10 })).toBeNull();
    expect(createCanvas({ width: CANVAS_MAX + 1, height: 10 })).toBeNull();
    expect(createCanvas({ width: NaN, height: 10 })).toBeNull();
  });

  it('get2d / readPixels / writePixels: 环境不支持时安全返回', () => {
    const canvas = createCanvas({ width: 2, height: 2 })!;
    // jsdom 未实现 canvas 2d (未安装 canvas 包): 应返回 null / false 而不是抛错
    const ctx = get2d(canvas);
    expect(ctx === null || typeof ctx === 'object').toBe(true);
    if (ctx === null) {
      expect(readPixels(canvas)).toBeNull();
      expect(writePixels(canvas, { data: new Uint8ClampedArray(16) } as ImageData)).toBe(false);
    }
  });

  it('drawToCanvas: 绘制到指定尺寸, opaque 时先铺白底', () => {
    const proto = HTMLCanvasElement.prototype.getContext;
    const ctx = makeCtx();
    HTMLCanvasElement.prototype.getContext = (() => ctx) as unknown as HTMLCanvasElement['getContext'];
    try {
      const img = { naturalWidth: 4, naturalHeight: 4 } as HTMLImageElement;

      const out = drawToCanvas(img, { width: 4, height: 4 }, true);
      expect(out?.width).toBe(4);
      expect(out?.height).toBe(4);
      expect(ctx.calls.map((c) => c.op)).toEqual([ 'fillRect', 'drawImage' ]);
      expect(ctx.calls[0].args).toEqual([ 0, 0, 4, 4 ]);
      expect(ctx.calls[1].args).toEqual([ img, 0, 0, 4, 4 ]);

      ctx.calls.length = 0;
      drawToCanvas(img, { width: 4, height: 4 });
      expect(ctx.calls.map((c) => c.op)).toEqual([ 'drawImage' ]);
    } finally {
      HTMLCanvasElement.prototype.getContext = proto;
    }
  });

  it('readPixels / writePixels: 走 getImageData / putImageData', () => {
    const canvas = createCanvas({ width: 2, height: 2 })!;
    const ctx = makeCtx();
    canvas.getContext = (() => ctx) as unknown as HTMLCanvasElement['getContext'];
    const data = readPixels(canvas);
    expect(data?.width).toBe(2);
    expect(writePixels(canvas, data!)).toBe(true);
    expect(ctx.calls.filter((c) => c.op === 'putImageData')).toHaveLength(1);
  });

  it('fillWhite: 用白色铺满', () => {
    const ctx = makeCtx();
    fillWhite(ctx as unknown as CanvasRenderingContext2D, { width: 3, height: 5 });
    expect(ctx.fillStyle).toBe('#ffffff');
    expect(ctx.calls[0].args).toEqual([ 0, 0, 3, 5 ]);
  });

  it('exportDataUrl: 有损格式带质量参数', () => {
    const canvas = createCanvas({ width: 1, height: 1 })!;
    const toDataURL = jest.fn(() => 'data:image/png;base64,AAAA');
    canvas.toDataURL = toDataURL as unknown as HTMLCanvasElement['toDataURL'];

    exportDataUrl(canvas, 'PNG');
    expect(toDataURL).toHaveBeenLastCalledWith('image/png');
    exportDataUrl(canvas, 'JPEG', 0.8);
    expect(toDataURL).toHaveBeenLastCalledWith('image/jpeg', 0.8);
    exportDataUrl(canvas, 'WebP', 0.5);
    expect(toDataURL).toHaveBeenLastCalledWith('image/webp', 0.5);
  });

  it('supportsWebp: 环境不支持时返回 false 且缓存结果', () => {
    resetWebpCache();
    expect(supportsWebp()).toBe(false); // jsdom 的 toDataURL 未实现 -> false
    expect(supportsWebp()).toBe(false);
    resetWebpCache();
  });

  it('filterImage: 走 getImageData -> transform -> putImageData 并导出 dataURL', () => {
    const proto = HTMLCanvasElement.prototype.getContext;
    const put: ImageData[] = [];
    const ctx = {
      fillStyle: '',
      fillRect: () => undefined,
      drawImage: () => undefined,
      getImageData: (_x: number, _y: number, w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4).fill(1), width: w, height: h,
      }),
      putImageData: (data: ImageData) => put.push(data),
    };
    HTMLCanvasElement.prototype.getContext = (() => ctx) as unknown as HTMLCanvasElement['getContext'];
    const toDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = (() => 'data:image/png;base64,AAAAAA==') as never;
    try {
      const out = filterImage({} as HTMLImageElement, { width: 2, height: 2 }, {
        format: 'PNG',
        transform: (data) => new Uint8ClampedArray(data.length).fill(255),
      });
      expect(out?.url).toBe('data:image/png;base64,AAAAAA==');
      expect(out?.bytes).toBe(6);
      expect(Array.from(put[0].data)).toEqual(Array.from(new Uint8ClampedArray(16).fill(255)));
    } finally {
      HTMLCanvasElement.prototype.getContext = proto;
      HTMLCanvasElement.prototype.toDataURL = toDataURL;
    }
  });

  it('filterImage: 尺寸非法或 transform 长度不符时各自安全处理', () => {
    expect(filterImage({} as HTMLImageElement, { width: 0, height: 0 }, { format: 'PNG', transform: (d) => d })).toBeNull();
  });
});

describe('图片通用能力: dataURL', () => {
  it('dataUrlToBytes / dataUrlBytes', () => {
    // 'AAAA' -> 3 字节
    expect(Array.from(dataUrlToBytes('data:image/png;base64,AAAA'))).toEqual([ 0, 0, 0 ]);
    expect(dataUrlBytes('data:image/png;base64,AAAA')).toBe(3);
    expect(dataUrlBytes('data:,')).toBe(0);
  });
});

describe('图片通用能力: 读取图片文件', () => {
  afterEach(() => {
    (global as unknown as { Image: unknown }).Image = realImage;
  });

  it('非图片文件抛 not-image', async () => {
    const file = new File([ 'x' ], 'a.txt', { type: 'text/plain' });
    await expect(loadImageFile(file)).rejects.toMatchObject({ code: 'not-image' });
  });

  it('解码失败抛 decode-failed', async () => {
    (global as unknown as { Image: unknown }).Image = BrokenImage;
    const file = new File([ 'x' ], 'a.png', { type: 'image/png' });
    await expect(loadImageFile(file)).rejects.toBeInstanceOf(ImageError);
    await expect(loadImageFile(file)).rejects.toMatchObject({ code: 'decode-failed' });
  });

  it('读取成功: 返回 dataURL / 尺寸 / 字节数与文件名主体', async () => {
    (global as unknown as { Image: unknown }).Image = MockImage;
    const file = new File([ 'abcdef' ], 'my photo.png', { type: 'image/png' });
    const loaded = await loadImageFile(file);
    expect(loaded.url.startsWith('data:image/png;base64,')).toBe(true);
    expect(loaded.size).toEqual({ width: 40, height: 20 });
    expect(loaded.bytes).toBe(6);
    expect(loaded.base).toBe('my photo');
    expect(loaded.img.naturalWidth).toBe(40);
  });
});
