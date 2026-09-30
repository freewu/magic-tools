import { ImageError, type ImageFile, type Size } from '../../lib/image';
import { BG_IMAGE_MAX_CHARS, BG_IMAGE_MAX_SIDE, BG_IMAGE_QUALITY, TOO_LARGE, prepareBackgroundImage } from './bg';

// 只 mock 掉 canvas 相关管线, 保持 bg.ts 的判定逻辑 (尺寸/上限/回退) 可测
const loadImageFile = jest.fn();
const fitWithin = jest.fn();
const drawToCanvas = jest.fn();
const exportDataUrl = jest.fn();
const dataUrlBytes = jest.fn();

jest.mock('../../lib/image', () => {
  const actual = jest.requireActual('../../lib/image');
  return {
    ...actual,
    loadImageFile: (...args: unknown[]) => loadImageFile(...args),
    fitWithin: (...args: unknown[]) => fitWithin(...args),
    drawToCanvas: (...args: unknown[]) => drawToCanvas(...args),
    exportDataUrl: (...args: unknown[]) => exportDataUrl(...args),
    dataUrlBytes: (...args: unknown[]) => dataUrlBytes(...args),
  };
});

const file = new File([ 'x' ], 'a.png', { type: 'image/png' });
const img = {} as HTMLImageElement;
const original: Size = { width: 4000, height: 3000 };
const target: Size = { width: 1920, height: 1440 };
const canvas = { width: 1920, height: 1440 } as HTMLCanvasElement;
const ORIGINAL_URL = 'data:image/png;base64,ORIGINAL';
const SMALL = 'data:image/jpeg;base64,SMALL';

const mockLoad = (image: ImageFile): void => {
  loadImageFile.mockResolvedValue(image);
};

describe('番茄时钟 bg: prepareBackgroundImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoad({ url: ORIGINAL_URL, img, size: original, bytes: 10, base: 'a' });
    fitWithin.mockReturnValue(target);
    drawToCanvas.mockReturnValue(canvas);
    exportDataUrl.mockReturnValue(SMALL);
    dataUrlBytes.mockReturnValue(1234);
  });

  test('按最长边等比压缩, 铺白底并用 JPEG 质量编码', async () => {
    const out = await prepareBackgroundImage(file);
    expect(fitWithin).toHaveBeenCalledWith(original, BG_IMAGE_MAX_SIDE, BG_IMAGE_MAX_SIDE);
    expect(drawToCanvas).toHaveBeenCalledWith(img, target, true);
    expect(exportDataUrl).toHaveBeenCalledWith(canvas, 'JPEG', BG_IMAGE_QUALITY);
    expect(out).toEqual({ url: SMALL, bytes: 1234 });
  });

  test('canvas 不可用时回退原图 (仍走上限校验)', async () => {
    drawToCanvas.mockReturnValue(null);
    const out = await prepareBackgroundImage(file);
    expect(exportDataUrl).not.toHaveBeenCalled();
    expect(out.url).toBe(ORIGINAL_URL);
  });

  test('压缩后仍超限抛 TOO_LARGE', async () => {
    exportDataUrl.mockReturnValue(`data:image/jpeg;base64,${'A'.repeat(BG_IMAGE_MAX_CHARS)}`);
    await expect(prepareBackgroundImage(file)).rejects.toThrow(TOO_LARGE);
  });

  test('非图片 / 解码失败的原样抛出 ImageError', async () => {
    loadImageFile.mockRejectedValue(new ImageError('not-image'));
    await expect(prepareBackgroundImage(file)).rejects.toMatchObject({ code: 'not-image' });
    loadImageFile.mockRejectedValue(new ImageError('decode-failed'));
    await expect(prepareBackgroundImage(file)).rejects.toMatchObject({ code: 'decode-failed' });
  });
});
