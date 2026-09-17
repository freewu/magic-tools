import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { message } from 'antd';
import ImageSharpen from './index';
import { saveBytesFile, savePngFile } from '../../lib/tauri';

jest.mock('../../lib/tauri', () => ({
  isTauri: () => true,
  savePngFile: jest.fn().mockResolvedValue(true),
  saveBytesFile: jest.fn().mockResolvedValue(true),
}));

// ---- canvas 桩: 记录 putImageData 的数据 ----
const putDatas: ImageData[] = [];
/** 竖向渐变: 上半 #808080, 下半 #ffffff, 便于观察锐化在边界处的过冲 */
const ramp = (w: number, h: number) => {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const v = y < h / 2 ? 128 : 255;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
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
    this.naturalHeight = 4;
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
const images = (container: HTMLElement): HTMLImageElement[] =>
  Array.from(container.querySelectorAll('img[src]')) as HTMLImageElement[];
const dropImage = async (container: HTMLElement, name = 'photo.png') => {
  const zone = container.querySelector('div[style*="dashed"]') as HTMLElement;
  fireEvent.drop(zone, { dataTransfer: { files: [ new File([ 'x' ], name, { type: 'image/png' }) ] } });
  await waitFor(() => expect(images(container).length).toBeGreaterThan(1));
};
/** 参数行: 左侧固定 96px 宽的标签 -> 该行容器 */
const rowOf = (label: string): HTMLElement => {
  const lbl = screen.getAllByText(label).find((el) => (el as HTMLElement).style?.width === '96px');
  if (!lbl) throw new Error(`未找到参数行: ${label}`);
  return lbl.parentElement as HTMLElement;
};
/** 某个参数行里的数字输入框 */
const spinIn = (label: string): HTMLInputElement =>
  rowOf(label).querySelector('input.ant-input-number-input') as HTMLInputElement;

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

describe('ImageSharpen 初始界面', () => {
  test('未选图片时展示拖拽区, 保存与清空不可用', () => {
    const { container } = render(<ImageSharpen />);
    expect(within(container).getByText('拖拽图片到此处, 或点击「选择图片」')).toBeInTheDocument();
    expect(btn('保存')).toBeDisabled();
    expect(btn('清空')).toBeDisabled();
    // 三个参数的默认值
    expect(spinIn('锐化强度').value).toBe('100');
    expect(spinIn('半径').value).toBe('1');
    expect(spinIn('阈值').value).toBe('0');
  });
});

describe('ImageSharpen 处理与预览', () => {
  test('拖入图片后自动锐化, 出现结果预览与统计标签', async () => {
    const { container } = render(<ImageSharpen />);
    await dropImage(container);
    await waitFor(() => expect(putDatas.length).toBeGreaterThan(0));
    expect(images(container)).toHaveLength(2);
    expect(within(container).getByText('原图尺寸')).toBeInTheDocument();
    expect(within(container).getByText('结果尺寸')).toBeInTheDocument();
    expect(within(container).getAllByText('4 × 4 px')).toHaveLength(2);
    // 锐化参数标签回显默认值
    expect(within(container).getByText('100% · r1 · t0')).toBeInTheDocument();
    expect(btn('保存')).toBeEnabled();
  });

  test('边界处出现过冲: 下半部分更白, 上半部分更暗', async () => {
    const { container } = render(<ImageSharpen />);
    await dropImage(container);
    await waitFor(() => expect(putDatas.length).toBeGreaterThan(0));
    const px = Array.from(putDatas[putDatas.length - 1].data);
    // 4x4 竖向渐变: y=1 处模糊值介于 128 与 255 之间 -> 被压暗; y=2 处被提亮
    const y1 = px[(1 * 4 + 0) * 4];
    const y2 = px[(2 * 4 + 0) * 4];
    expect(y1).toBeLessThan(128);
    expect(y2).toBeGreaterThan(255 - 1); // 已接近 / 达到 255
  });

  test('强度改为 0 后结果与原图一致 (保持原样)', async () => {
    const { container } = render(<ImageSharpen />);
    await dropImage(container);
    await waitFor(() => expect(putDatas.length).toBeGreaterThan(0));
    const spin = spinIn('锐化强度');
    fireEvent.change(spin, { target: { value: '0' } });
    fireEvent.blur(spin);
    await waitFor(() => {
      const px = Array.from(putDatas[putDatas.length - 1].data);
      expect(px[(1 * 4 + 0) * 4]).toBe(128); // 未被压暗
    });
  });

  test('半径改为 5 后参数标签同步更新', async () => {
    const { container } = render(<ImageSharpen />);
    await dropImage(container);
    const spin = spinIn('半径');
    fireEvent.change(spin, { target: { value: '5' } });
    fireEvent.blur(spin);
    await waitFor(() => expect(within(container).getByText('100% · r5 · t0')).toBeInTheDocument());
  });

  test('清空后回到拖拽区', async () => {
    const { container } = render(<ImageSharpen />);
    await dropImage(container);
    fireEvent.click(btn('清空'));
    await waitFor(() => expect(container.querySelector('div[style*="dashed"]')).toBeInTheDocument());
    expect(btn('保存')).toBeDisabled();
    expect(images(container)).toHaveLength(0);
  });
});

describe('ImageSharpen 保存', () => {
  test('保存 PNG 使用 _sharpen 后缀', async () => {
    const { container } = render(<ImageSharpen />);
    await dropImage(container, 'my photo.png');
    fireEvent.click(btn('保存'));
    await waitFor(() => expect(savePngFile).toHaveBeenCalledTimes(1));
    expect((savePngFile as jest.Mock).mock.calls[0][0]).toBe('my photo_sharpen.png');
  });

  test('保存取消时给出提示', async () => {
    (savePngFile as jest.Mock).mockResolvedValueOnce(false);
    const { container } = render(<ImageSharpen />);
    await dropImage(container);
    fireEvent.click(btn('保存'));
    await waitFor(() => expect(document.querySelector('.ant-message')?.textContent).toContain('已取消保存'));
  });

  test('保存抛错时提示失败', async () => {
    (savePngFile as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    const { container } = render(<ImageSharpen />);
    await dropImage(container);
    fireEvent.click(btn('保存'));
    await waitFor(() => expect(document.querySelector('.ant-message')?.textContent).toContain('保存失败'));
  });
});
