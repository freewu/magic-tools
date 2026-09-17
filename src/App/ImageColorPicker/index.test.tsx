import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { message } from 'antd';
import ImageColorPicker from './index';

jest.mock('../../lib/tauri', () => ({
  isTauri: () => true,
  savePngFile: jest.fn().mockResolvedValue(true),
  saveBytesFile: jest.fn().mockResolvedValue(true),
}));

// ---- canvas 桩: 每个像素 (x, y) = [x * 10, y * 10, 128, 255] ----
const loupeImages: { data: Uint8ClampedArray; width: number; height: number }[] = [];
const stubCtx = {
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high',
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  fillRect: () => undefined,
  strokeRect: () => undefined,
  drawImage: () => undefined,
  createImageData: (w: number, h: number) => ({
    data: new Uint8ClampedArray(w * h * 4),
    width: w,
    height: h,
  }),
  getImageData: (sx: number, sy: number, w: number, h: number) => {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      data[i * 4] = ((sx + (i % w)) * 10) % 256;
      data[i * 4 + 1] = ((sy + Math.floor(i / w)) * 10) % 256;
      data[i * 4 + 2] = 128;
      data[i * 4 + 3] = 255;
    }
    return { data, width: w, height: h };
  },
  putImageData: (image: { data: Uint8ClampedArray; width: number; height: number }) => { loupeImages.push(image); },
};

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
    this.naturalWidth = 4;
    this.naturalHeight = 3;
    setTimeout(() => this.onload?.(), 0);
  }
}

const WIDTH = 4;
const HEIGHT = 3;
/** 显示矩形与原图 1:1, 便于直接按 clientX / clientY 推算像素坐标 */
const RECT = { left: 0, top: 0, width: WIDTH, height: HEIGHT, right: WIDTH, bottom: HEIGHT, x: 0, y: 0, toJSON: () => ({}) };

const btn = (name: string): HTMLButtonElement => {
  const target = name.replace(/\s+/g, '');
  const hit = screen
    .getAllByText((_, el) => (el?.textContent ?? '').replace(/\s+/g, '') === target)
    .find((el) => el.closest('button'));
  if (!hit) throw new Error(`未找到按钮: ${name}`);
  return hit.closest('button') as HTMLButtonElement;
};
const canvasOf = (container: HTMLElement): HTMLCanvasElement =>
  container.querySelector('canvas') as HTMLCanvasElement;
const dropImage = async (container: HTMLElement, name = 'photo.png') => {
  const zone = container.querySelector('div[style*="dashed"]') as HTMLElement;
  fireEvent.drop(zone, { dataTransfer: { files: [ new File([ 'x' ], name, { type: 'image/png' }) ] } });
  // 等画布按原图尺寸铺好, 并冲掉缓存像素的状态更新 (否则紧接着的点击可能读到旧值)
  await waitFor(() => expect(canvasOf(container)?.width).toBe(WIDTH));
  await act(async () => { await Promise.resolve(); });
};
/** 悬停到某个像素中心 */
const hover = (container: HTMLElement, x: number, y: number) => {
  fireEvent.mouseMove(canvasOf(container), { clientX: x + 0.5, clientY: y + 0.5 });
};
const clickAt = (container: HTMLElement, x: number, y: number) => {
  fireEvent.click(canvasOf(container), { clientX: x + 0.5, clientY: y + 0.5 });
};
/** 最近取色的色块 (title = 色值) */
const swatches = (container: HTMLElement): string[] =>
  Array.from(container.querySelectorAll('span[title]')).map((el) => el.getAttribute('title') as string);

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => stubCtx) as unknown as HTMLCanvasElement['getContext'];
  HTMLCanvasElement.prototype.getBoundingClientRect = jest.fn(() => RECT) as unknown as HTMLCanvasElement['getBoundingClientRect'];
  (global as unknown as { Image: unknown }).Image = MockImage;
});

beforeEach(() => {
  loupeImages.length = 0;
  message.destroy();
});

describe('ImageColorPicker 初始界面', () => {
  test('未选择图片时显示拖拽区, 取色面板不出现', () => {
    const { container } = render(<ImageColorPicker />);
    expect(within(container).getByText('拖拽图片到此处, 或点击「选择图片」')).toBeInTheDocument();
    expect(container.querySelector('canvas')).not.toBeInTheDocument();
    expect(btn('清空历史')).toBeDisabled();
    expect(btn('清空')).toBeDisabled();
    expect(screen.queryByText('当前颜色')).not.toBeInTheDocument();
  });
});

describe('ImageColorPicker 取色', () => {
  test('拖入图片后出现画布与取色面板, 画布为原图尺寸', async () => {
    const { container } = render(<ImageColorPicker />);
    await dropImage(container);
    const canvas = canvasOf(container);
    expect(canvas.width).toBe(WIDTH);
    expect(canvas.height).toBe(HEIGHT);
    expect(within(container).getByText('当前颜色')).toBeInTheDocument();
    expect(within(container).getByText('点击图片上的任意位置取色')).toBeInTheDocument();
    expect(within(container).getByText('无色块')).toBeInTheDocument();
    // 悬停前的坐标与色值为占位符
    expect(within(container).getByText('坐标').parentElement?.textContent).toContain('—');
  });

  test('悬停时显示像素坐标、色值与放大镜区域', async () => {
    const { container } = render(<ImageColorPicker />);
    await dropImage(container);
    hover(container, 1, 2);
    await waitFor(() => expect(within(container).getByText('x 1, y 2')).toBeInTheDocument());
    // 像素 (1, 2) = [10, 20, 128] -> #0a1480
    expect(within(container).getAllByText('#0a1480').length).toBeGreaterThan(0);
    // 放大镜取样区域: 图片只有 4x3, 小于 11 -> 取整图
    await waitFor(() => expect(loupeImages.length).toBeGreaterThan(0));
    expect(loupeImages[loupeImages.length - 1].width).toBe(WIDTH);
    expect(loupeImages[loupeImages.length - 1].height).toBe(HEIGHT);
    // 离开画布后回到占位
    fireEvent.mouseLeave(canvasOf(container));
    await waitFor(() => expect(screen.queryByText('x 1, y 2')).not.toBeInTheDocument());
  });

  test('点击取色: 当前颜色给出 HEX / RGB / HSL, 并进入最近取色', async () => {
    const { container } = render(<ImageColorPicker />);
    await dropImage(container);
    clickAt(container, 1, 2);
    await waitFor(() => expect(within(container).getByText('#0A1480')).toBeInTheDocument());
    expect(within(container).getByText('rgb(10, 20, 128)')).toBeInTheDocument();
    expect(within(container).getAllByText(/^hsl\(\d+, \d+%, \d+%\)$/).length).toBeGreaterThan(0);
    expect(swatches(container)).toEqual([ '#0a1480' ]);
    expect(btn('清空历史')).toBeEnabled();
  });

  test('重复取同一像素不会产生重复色块', async () => {
    const { container } = render(<ImageColorPicker />);
    await dropImage(container);
    clickAt(container, 1, 1);
    await waitFor(() => expect(swatches(container)).toHaveLength(1));
    clickAt(container, 1, 1);
    await waitFor(() => expect(swatches(container)).toHaveLength(1));
  });

  test('新取的颜色排在最前', async () => {
    const { container } = render(<ImageColorPicker />);
    await dropImage(container);
    clickAt(container, 0, 0);
    await waitFor(() => expect(swatches(container)).toHaveLength(1));
    clickAt(container, 2, 1);
    await waitFor(() => expect(swatches(container)).toHaveLength(2));
    expect(swatches(container)[0]).toBe('#140a80');
    // 点击历史色块可再次选回该颜色
    fireEvent.click(container.querySelector('span[title="#000080"]') as HTMLElement);
    await waitFor(() => expect(within(container).getByText('#000080')).toBeInTheDocument());
  });

  test('清空历史后不留色块', async () => {
    const { container } = render(<ImageColorPicker />);
    await dropImage(container);
    clickAt(container, 1, 1);
    await waitFor(() => expect(swatches(container)).toHaveLength(1));
    fireEvent.click(btn('清空历史'));
    await waitFor(() => expect(within(container).getByText('无色块')).toBeInTheDocument());
  });

  test('切换放大倍数会改变放大镜的显示尺寸', async () => {
    const { container } = render(<ImageColorPicker />);
    await dropImage(container);
    const loupe = () => Array.from(container.querySelectorAll('canvas'))[1] as HTMLCanvasElement;
    expect(loupe().style.width).toBe('88px'); // 11 * 8
    const label = screen.getAllByText('16×').map((el) => el.closest('label.ant-segmented-item')).find(Boolean) as HTMLElement;
    fireEvent.click(label.querySelector('input') as HTMLElement);
    await waitFor(() => expect(loupe().style.width).toBe('176px')); // 11 * 16
  });

  test('清空后回到拖拽区', async () => {
    const { container } = render(<ImageColorPicker />);
    await dropImage(container);
    fireEvent.click(btn('清空'));
    await waitFor(() => expect(container.querySelector('div[style*="dashed"]')).toBeInTheDocument());
    expect(container.querySelector('canvas')).not.toBeInTheDocument();
  });

  test('选择非图片文件时给出错误提示', async () => {
    const { container } = render(<ImageColorPicker />);
    const zone = container.querySelector('div[style*="dashed"]') as HTMLElement;
    fireEvent.drop(zone, { dataTransfer: { files: [ new File([ 'x' ], 'a.txt', { type: 'text/plain' }) ] } });
    await waitFor(() => expect(container.querySelector('.ant-alert')?.textContent).toContain('请选择图片文件'));
    expect(container.querySelector('canvas')).not.toBeInTheDocument();
  });
});
