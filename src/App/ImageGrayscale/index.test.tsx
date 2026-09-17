import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { message } from 'antd';
import ImageGrayscale from './index';
import { saveBytesFile, savePngFile } from '../../lib/tauri';

jest.mock('../../lib/tauri', () => ({
  isTauri: () => true,
  savePngFile: jest.fn().mockResolvedValue(true),
  saveBytesFile: jest.fn().mockResolvedValue(true),
}));

// ---- canvas 桩: 像素坡道 (第 i 字节 = i % 256), 记录 putImageData ----
const putDatas: ImageData[] = [];
const ramp = (w: number, h: number) => {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < data.length; i++) data[i] = i % 256;
  return data;
};
const stubCtx = {
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high',
  fillStyle: '',
  fillRect: () => undefined,
  drawImage: () => undefined,
  getImageData: (_x: number, _y: number, w: number, h: number) => ({ data: ramp(w, h), width: w, height: h }),
  putImageData: (data: ImageData) => { putDatas.push(data); },
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
    this.naturalHeight = 2;
    setTimeout(() => this.onload?.(), 0);
  }
}

const btn = (name: string): HTMLButtonElement => {
  const target = name.replace(/\s+/g, '');
  const hit = screen
    .getAllByText((_, el) => (el?.textContent ?? '').replace(/\s+/g, '') === target)
    .find((el) => el.closest('button'));
  if (!hit) throw new Error(`未找到按钮: ${name}`);
  return hit.closest('button') as HTMLButtonElement;
};
/** 点击 Segmented 选项 (需要点内部的 radio) */
const chooseSegmented = (text: string) => {
  const label = screen.getAllByText(text).map((el) => el.closest('label.ant-segmented-item')).find(Boolean);
  if (!label) throw new Error(`未找到分段选项: ${text}`);
  fireEvent.click(label.querySelector('input') ?? label);
};
/** 参数行: 左侧固定 96px 宽的标签 -> 该行容器 */
const rowOf = (label: string): HTMLElement => {
  const lbl = screen.getAllByText(label).find((el) => (el as HTMLElement).style?.width === '96px');
  if (!lbl) throw new Error(`未找到参数行: ${label}`);
  return lbl.parentElement as HTMLElement;
};
const images = (container: HTMLElement): HTMLImageElement[] =>
  Array.from(container.querySelectorAll('img[src]')) as HTMLImageElement[];
const dropImage = async (container: HTMLElement, name = 'photo.png') => {
  const zone = container.querySelector('div[style*="dashed"]') as HTMLElement;
  fireEvent.drop(zone, { dataTransfer: { files: [ new File([ 'x' ], name, { type: 'image/png' }) ] } });
  await waitFor(() => expect(images(container).length).toBeGreaterThan(1));
};
const lastPixels = () => Array.from(putDatas[putDatas.length - 1].data);

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => stubCtx) as unknown as HTMLCanvasElement['getContext'];
  HTMLCanvasElement.prototype.toDataURL = jest.fn((type?: string) => `data:${type ?? 'image/png'};base64,AAAA`) as never;
  (global as unknown as { Image: unknown }).Image = MockImage;
});

beforeEach(() => {
  putDatas.length = 0;
  message.destroy();
  (savePngFile as jest.Mock).mockClear();
  (saveBytesFile as jest.Mock).mockClear();
});

describe('ImageGrayscale 初始界面', () => {
  test('默认灰度模式, 未选图片时保存与清空不可用', () => {
    const { container } = render(<ImageGrayscale />);
    expect(within(container).getByText('拖拽图片到此处, 或点击「选择图片」')).toBeInTheDocument();
    expect(btn('保存')).toBeDisabled();
    expect(btn('清空')).toBeDisabled();
    // 灰度模式下不展示阈值相关参数
    expect(screen.queryByText('阈值方式')).not.toBeInTheDocument();
    expect(screen.queryByText('二值阈值')).not.toBeInTheDocument();
  });
});

describe('ImageGrayscale 灰度处理', () => {
  test('拖入图片后灰度化: 三个通道相等且等于亮度值', async () => {
    const { container } = render(<ImageGrayscale />);
    await dropImage(container);
    await waitFor(() => expect(putDatas.length).toBeGreaterThan(0));
    const px = lastPixels();
    // 第 0 个像素原值 (0,1,2) -> luma = round(0*0.2126 + 1*0.7152 + 2*0.0722) = 1
    expect(px[0]).toBe(px[1]);
    expect(px[1]).toBe(px[2]);
    expect(px[0]).toBe(1);
    expect(px[3]).toBe(3); // α 不变
  });

  test('切换灰度算法会改变结果 (最大值算法更亮)', async () => {
    const { container } = render(<ImageGrayscale />);
    await dropImage(container);
    await waitFor(() => expect(putDatas.length).toBeGreaterThan(0));
    const lumaFirst = lastPixels()[0];
    chooseSegmented('最大值');
    await waitFor(() => expect(lastPixels()[0]).toBe(2)); // max(0,1,2) = 2
    expect(lumaFirst).toBe(1);
  });

  test('切换处理方式到黑白二值后出现阈值参数, 自动阈值回显', async () => {
    const { container } = render(<ImageGrayscale />);
    await dropImage(container);
    chooseSegmented('黑白二值');
    await waitFor(() => expect(screen.getByText('阈值方式')).toBeInTheDocument());
    // 自动阈值 (Otsu) 会显示在标签里
    await waitFor(() => expect(container.textContent).toMatch(/自动阈值\s*\d+/));
    expect(btn('保存')).toBeEnabled();
    // 结果只剩纯黑与纯白
    const px = lastPixels();
    expect([ 0, 255 ]).toContain(px[0]);
    expect([ 0, 255 ]).toContain(px[1]);
  });

  test('手动阈值: 阈值调到 0 时除纯黑外全部变白', async () => {
    const { container } = render(<ImageGrayscale />);
    await dropImage(container);
    chooseSegmented('黑白二值');
    await waitFor(() => expect(screen.getByText('阈值方式')).toBeInTheDocument());
    chooseSegmented('手动');
    await waitFor(() => expect(screen.getByText('二值阈值')).toBeInTheDocument());
    // 默认阈值 128: 第 1 个像素 (4,5,6) 灰度 5 <= 128 -> 纯黑
    await waitFor(() => expect(lastPixels()[4]).toBe(0));
    // 阈值改成 0: 只有纯黑的像素保持黑, 灰度 5 的像素变纯白
    const spin = rowOf('二值阈值').querySelector('input.ant-input-number-input') as HTMLInputElement;
    fireEvent.change(spin, { target: { value: '0' } });
    fireEvent.blur(spin);
    await waitFor(() => expect(lastPixels()[4]).toBe(255));
  });

  test('清空后回到拖拽区', async () => {
    const { container } = render(<ImageGrayscale />);
    await dropImage(container);
    fireEvent.click(btn('清空'));
    await waitFor(() => expect(container.querySelector('div[style*="dashed"]')).toBeInTheDocument());
    expect(btn('保存')).toBeDisabled();
  });
});

describe('ImageGrayscale 保存', () => {
  test('灰度模式: 文件名后缀 grayscale', async () => {
    const { container } = render(<ImageGrayscale />);
    await dropImage(container, 'pic.jpg');
    fireEvent.click(btn('保存'));
    await waitFor(() => expect(savePngFile).toHaveBeenCalledTimes(1));
    expect((savePngFile as jest.Mock).mock.calls[0][0]).toBe('pic_grayscale.png');
  });

  test('二值模式: 文件名后缀 blackwhite', async () => {
    const { container } = render(<ImageGrayscale />);
    await dropImage(container, 'pic.jpg');
    chooseSegmented('黑白二值');
    await waitFor(() => expect(screen.getByText('阈值方式')).toBeInTheDocument());
    fireEvent.click(btn('保存'));
    await waitFor(() => expect(savePngFile).toHaveBeenCalledTimes(1));
    expect((savePngFile as jest.Mock).mock.calls[0][0]).toBe('pic_blackwhite.png');
  });
});
