import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { message } from 'antd';
import ImageNegative from './index';
import { saveBytesFile, savePngFile } from '../../lib/tauri';

jest.mock('../../lib/tauri', () => ({
  isTauri: () => true,
  savePngFile: jest.fn().mockResolvedValue(true),
  saveBytesFile: jest.fn().mockResolvedValue(true),
}));

// ---- canvas 桩: 记录绘制/像素写入, 提供确定性的像素坡道 (第 i 字节 = i % 256) ----
interface Call { op: string; args: unknown[]; }
const ctxCalls: Call[] = [];
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
  fillRect: (...args: unknown[]) => ctxCalls.push({ op: 'fillRect', args }),
  drawImage: (...args: unknown[]) => ctxCalls.push({ op: 'drawImage', args }),
  getImageData: (_x: number, _y: number, w: number, h: number) => ({ data: ramp(w, h), width: w, height: h }),
  putImageData: (data: ImageData) => { putDatas.push(data); ctxCalls.push({ op: 'putImageData', args: [ data ] }); },
};

// ---- Image 桩: 赋值 src 后异步触发 onload ----
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
    this.naturalWidth = 1000;
    this.naturalHeight = 600;
    setTimeout(() => this.onload?.(), 0);
  }
}

/** 按按钮文案定位 (antd 会在两个汉字间插空格, 故比较去掉空白后的文本) */
const btn = (name: string): HTMLButtonElement => {
  const target = name.replace(/\s+/g, '');
  const hit = screen
    .getAllByText((_, el) => (el?.textContent ?? '').replace(/\s+/g, '') === target)
    .find((el) => el.closest('button'));
  if (!hit) throw new Error(`未找到按钮: ${name}`);
  return hit.closest('button') as HTMLButtonElement;
};
/** 参数行: 左侧固定 96px 宽的标签 -> 返回该行容器 (antd 图标也带 role=img, 故图片一律用 img 标签统计) */
const rowOf = (label: string): HTMLElement => {
  const lbl = screen.getAllByText(label).find((el) => (el as HTMLElement).style?.width === '96px');
  if (!lbl) throw new Error(`未找到参数行: ${label}`);
  return lbl.parentElement as HTMLElement;
};
/** 某个参数行里的数字输入框 */
const spinIn = (label: string): HTMLInputElement =>
  rowOf(label).querySelector('input.ant-input-number-input') as HTMLInputElement;
/** 页面里的图片 (预览) */
const images = (container: HTMLElement): HTMLImageElement[] =>
  Array.from(container.querySelectorAll('img[src]')) as HTMLImageElement[];
/** 拖入一张图片, 并等待处理完成 (出现结果预览) */
const dropImage = async (container: HTMLElement, name = 'photo.png') => {
  const zone = container.querySelector('div[style*="dashed"]') as HTMLElement;
  fireEvent.drop(zone, { dataTransfer: { files: [ new File([ 'x' ], name, { type: 'image/png' }) ] } });
  await waitFor(() => expect(images(container).length).toBeGreaterThan(1));
};
const toDataURL = HTMLCanvasElement.prototype.toDataURL;

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => stubCtx) as unknown as HTMLCanvasElement['getContext'];
  HTMLCanvasElement.prototype.toDataURL = jest.fn((type?: string) => `data:${type ?? 'image/png'};base64,AAAA`) as never;
  (global as unknown as { Image: unknown }).Image = MockImage;
});

beforeEach(() => {
  ctxCalls.length = 0;
  putDatas.length = 0;
  message.destroy();
  (savePngFile as jest.Mock).mockClear();
  (saveBytesFile as jest.Mock).mockClear();
});

describe('ImageNegative 初始界面', () => {
  test('未选择图片时显示拖拽区, 保存与清空不可用', () => {
    const { container } = render(<ImageNegative />);
    expect(within(container).getByText('拖拽图片到此处, 或点击「选择图片」')).toBeInTheDocument();
    expect(btn('选择图片')).toBeInTheDocument();
    expect(btn('保存')).toBeDisabled();
    expect(btn('清空')).toBeDisabled();
    expect(within(container).getByText('只有 RGBA 颜色通道会被反相, α (透明度) 通道保持不变')).toBeInTheDocument();
    // 默认 100% 强度
    expect(spinIn('负片强度').value).toBe('100');
  });
});

describe('ImageNegative 处理与预览', () => {
  test('拖入图片后自动反相: 结果预览出现, 统计标签给出尺寸与体积', async () => {
    const { container } = render(<ImageNegative />);
    await dropImage(container);
    // 原图 + 结果两张预览
    const imgs = images(container);
    expect(imgs[0].src.startsWith('data:image/png;base64,')).toBe(true);
    expect(imgs[1].src).toBe('data:image/png;base64,AAAA');
    expect(within(container).getByText('原图尺寸')).toBeInTheDocument();
    expect(within(container).getByText('结果尺寸')).toBeInTheDocument();
    // 反相不改变尺寸: 两个尺寸标签都是 1000 × 600 px
    expect(within(container).getAllByText('1000 × 600 px')).toHaveLength(2);
    expect(btn('保存')).toBeEnabled();
    expect(btn('清空')).toBeEnabled();
    expect(btn('重新选择')).toBeInTheDocument();
    // 100% 强度的像素结果: 0,1,2 反相为 255,254,253; α (3) 不变
    await waitFor(() => expect(putDatas.length).toBeGreaterThan(0));
    expect(Array.from(putDatas[putDatas.length - 1].data.slice(0, 8))).toEqual([ 255, 254, 253, 3, 251, 250, 249, 7 ]);
  });

  test('强度改为 0 时输出与原图一致 (仍是等长数据)', async () => {
    const { container } = render(<ImageNegative />);
    await dropImage(container);
    const spin = spinIn('负片强度');
    fireEvent.change(spin, { target: { value: '0' } });
    fireEvent.blur(spin);
    await waitFor(() => expect(Array.from(putDatas[putDatas.length - 1].data.slice(0, 4))).toEqual([ 0, 1, 2, 3 ]));
  });

  test('清空后回到拖拽区', async () => {
    const { container } = render(<ImageNegative />);
    await dropImage(container);
    fireEvent.click(btn('清空'));
    await waitFor(() => expect(container.querySelector('div[style*="dashed"]')).toBeInTheDocument());
    expect(btn('保存')).toBeDisabled();
    expect(images(container)).toHaveLength(0);
  });

  test('选择非图片文件时给出错误提示, 不进入编辑态', async () => {
    const { container } = render(<ImageNegative />);
    const zone = container.querySelector('div[style*="dashed"]') as HTMLElement;
    fireEvent.drop(zone, { dataTransfer: { files: [ new File([ 'x' ], 'a.txt', { type: 'text/plain' }) ] } });
    await waitFor(() => expect(container.querySelector('.ant-alert')?.textContent).toContain('请选择图片文件'));
    expect(images(container)).toHaveLength(0);
    expect(btn('保存')).toBeDisabled();
  });
});

describe('ImageNegative 输出与保存', () => {
  test('保存 PNG: 走 savePngFile, 文件名带 _negative 后缀', async () => {
    const { container } = render(<ImageNegative />);
    await dropImage(container, 'my photo.png');
    fireEvent.click(btn('保存'));
    await waitFor(() => expect(savePngFile).toHaveBeenCalledTimes(1));
    expect((savePngFile as jest.Mock).mock.calls[0][0]).toBe('my photo_negative.png');
    expect((savePngFile as jest.Mock).mock.calls[0][1]).toBe('data:image/png;base64,AAAA');
    await waitFor(() => expect(document.querySelector('.ant-message')?.textContent).toContain('my photo_negative.png'));
  });

  test('切到 JPEG: 走 saveBytesFile 并带质量参数', async () => {
    const { container } = render(<ImageNegative />);
    await dropImage(container);
    // Segmented 选项: 点击 label 内的 radio
    const jpeg = screen.getAllByText('JPEG').map((el) => el.closest('label.ant-segmented-item')).find(Boolean)!;
    fireEvent.click(jpeg.querySelector('input') ?? jpeg);
    await waitFor(() => expect((HTMLCanvasElement.prototype.toDataURL as jest.Mock).mock.calls.some(
      (c) => c[0] === 'image/jpeg',
    )).toBe(true));
    fireEvent.click(btn('保存'));
    await waitFor(() => expect(saveBytesFile).toHaveBeenCalledTimes(1));
    const [ name, bytes, opts ] = (saveBytesFile as jest.Mock).mock.calls[0];
    expect(name).toBe('photo_negative.jpg');
    expect((bytes as Uint8Array).length).toBeGreaterThan(0);
    expect((opts as { extensions: string[] }).extensions).toEqual([ 'jpg', 'jpeg' ]);
  });

  test('保存取消时给出提示, 且不报错', async () => {
    (savePngFile as jest.Mock).mockResolvedValueOnce(false);
    const { container } = render(<ImageNegative />);
    await dropImage(container);
    fireEvent.click(btn('保存'));
    await waitFor(() => expect(document.querySelector('.ant-message')?.textContent).toContain('已取消保存'));
  });

  test('保存抛错时提示失败', async () => {
    (savePngFile as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    const { container } = render(<ImageNegative />);
    await dropImage(container);
    fireEvent.click(btn('保存'));
    await waitFor(() => expect(document.querySelector('.ant-message')?.textContent).toContain('保存失败, 请重试'));
  });
});

afterAll(() => {
  HTMLCanvasElement.prototype.toDataURL = toDataURL;
});
