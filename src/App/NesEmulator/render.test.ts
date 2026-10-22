import { createRenderer } from './render';

/** 最小 canvas 桩: 只实现渲染用到的接口 (jsdom 里 canvas 2D 上下文不可用) */
const makeCanvas = (width = 256, height = 240) => {
  const data = new Uint8ClampedArray(4 * width * height);
  const ctx = {
    createImageData: (w: number, h: number) => ({ width: w, height: h, data } as unknown as ImageData),
    putImageData: jest.fn(),
    clearRect: jest.fn(),
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: jest.fn(() => ctx),
    toDataURL: jest.fn(() => 'data:image/png;base64,AAA'),
  };
  return { canvas: canvas as unknown as HTMLCanvasElement, ctx, data };
};

describe('画面渲染器', () => {
  test('没有 canvas / 取不到 2D 上下文时返回 null', () => {
    expect(createRenderer(null)).toBeNull();
    const broken = { getContext: () => null } as unknown as HTMLCanvasElement;
    expect(createRenderer(broken)).toBeNull();
    const throwing = { getContext: () => { throw new Error('nope'); } } as unknown as HTMLCanvasElement;
    expect(createRenderer(throwing)).toBeNull();
  });

  test('draw 把帧缓冲整块写入 ImageData 并刷新画面', () => {
    const { canvas, ctx, data } = makeCanvas();
    const renderer = createRenderer(canvas);
    expect(renderer).not.toBeNull();
    expect(canvas.width).toBe(256);
    expect(canvas.height).toBe(240);

    const frame = new Uint32Array(256 * 240);
    frame[0] = 0xff0000ff; // jsnes 的 0xAABBGGRR: 红
    frame[1] = 0xff00ff00; // 绿
    renderer?.draw(frame);
    expect(ctx.putImageData).toHaveBeenCalledTimes(1);
    expect(Array.from(data.slice(0, 4))).toEqual([ 255, 0, 0, 255 ]);
    expect(Array.from(data.slice(4, 8))).toEqual([ 0, 255, 0, 255 ]);
  });

  test('帧数据长度不足时跳过绘制', () => {
    const { canvas, ctx } = makeCanvas();
    const renderer = createRenderer(canvas);
    renderer?.draw(new Uint32Array(1));
    expect(ctx.putImageData).not.toHaveBeenCalled();
  });

  test('snapshot 导出 PNG, clear 清空画面', () => {
    const { canvas, ctx } = makeCanvas();
    const renderer = createRenderer(canvas);
    expect(renderer?.snapshot()).toBe('data:image/png;base64,AAA');
    renderer?.clear();
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 256, 240);
  });

  test('snapshot 失败时返回 null', () => {
    const { canvas } = makeCanvas();
    (canvas as unknown as { toDataURL: () => string }).toDataURL = () => { throw new Error('tainted'); };
    expect(createRenderer(canvas)?.snapshot()).toBeNull();
  });
});
