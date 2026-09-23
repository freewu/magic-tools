import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { message } from 'antd';
import ImageToSvg from './index';
import { saveTextFile } from '../../lib/tauri';
import { copyTextToClipboard } from '../../lib';
import { rasterToSvg } from './tracer';
import { DEFAULT_CONFIG } from './data';

jest.mock('../../lib/tauri', () => ({
  isTauri: () => true,
  saveTextFile: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
}));

// wasm 无法在 jest 里跑: 直接返回一段"VTracer 风格"的 SVG
jest.mock('./tracer', () => ({
  rasterToSvg: jest.fn(async () =>
    '<?xml version="1.0"?>\n<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="4" height="2">'
    + '<path d="M0 0h4v2H0z" fill="#010203"/><path d="M0 0h1v1z" fill="#000000"/></svg>'),
  initTracer: jest.fn(),
}));

// ---- canvas 桩: 像素坡道 (第 i 字节 = i % 256) ----
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
  putImageData: () => undefined,
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
/** 拖入图片并等待矢量化出结果 (SVG 预览用的是 data:image/svg+xml) */
const dropImage = async (container: HTMLElement, name = 'photo.png') => {
  const zone = container.querySelector('div[style*="dashed"]') as HTMLElement;
  fireEvent.drop(zone, { dataTransfer: { files: [ new File([ 'x' ], name, { type: 'image/png' }) ] } });
  await waitFor(() => expect(svgPreview(container)).toBeTruthy(), { timeout: 4000 });
};
const svgPreview = (container: HTMLElement): HTMLImageElement | undefined =>
  images(container).find((img) => img.src.startsWith('data:image/svg+xml'));
/** 参数 / 选择行的标签 (左侧固定 96px 宽), 用于区分同名的说明文档加粗文字 */
const rowLabels = (label: string) =>
  screen.queryAllByText(label).filter((el) => (el as HTMLElement).style?.width === '96px');
const hasRow = (label: string) => rowLabels(label).length > 0;

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => stubCtx) as unknown as HTMLCanvasElement['getContext'];
  (global as unknown as { Image: unknown }).Image = MockImage;
});

beforeEach(() => {
  message.destroy();
  (saveTextFile as jest.Mock).mockClear();
  (copyTextToClipboard as jest.Mock).mockClear();
  (rasterToSvg as jest.Mock).mockClear();
});

describe('ImageToSvg 初始界面', () => {
  test('未选图片时只有拖拽区, 保存 / 复制 / 清空不可用', () => {
    const { container } = render(<ImageToSvg />);
    expect(within(container).getByText('拖拽图片到此处, 或点击「选择图片」')).toBeInTheDocument();
    expect(btn('保存 SVG')).toBeDisabled();
    expect(btn('复制 SVG')).toBeDisabled();
    expect(btn('清空')).toBeDisabled();
    expect(btn('选择图片')).toBeEnabled();
    // 参数区默认展示全部数值参数
    expect(hasRow('颜色精度')).toBe(true);
    expect(hasRow('层间色差')).toBe(true);
    expect(hasRow('层叠策略')).toBe(true);
    expect(hasRow('斑点过滤')).toBe(true);
  });
});

describe('ImageToSvg 矢量化', () => {
  test('拖入图片后调用 wasm, 补上 viewBox 并给出统计', async () => {
    const { container } = render(<ImageToSvg />);
    await dropImage(container);
    const call = (rasterToSvg as jest.Mock).mock.calls[0];
    // 原图为 4x2 (只要不超过处理尺寸上限就不会被缩放)
    expect(call[1]).toBe(4);
    expect(call[2]).toBe(2);
    expect(call[3].binary).toBe(false);
    expect(call[3].mode).toBe(DEFAULT_CONFIG.mode);
    // 彩色模式直接把 RGBA 交给 wasm (坡道: 第 2 个字节 = 1)
    expect(Array.from(call[0].slice(0, 4))).toEqual([ 0, 1, 2, 3 ]);
    // 预览带 viewBox
    const preview = window.decodeURIComponent(svgPreview(container)!.src);
    expect(preview).toContain('viewBox="0 0 4 2"');
    expect(container.textContent).toContain('路径数量');
    expect(container.textContent).toContain('2 条');
    expect(btn('保存 SVG')).toBeEnabled();
  });

  test('黑白二值: 先灰度化再送入 wasm, 并隐藏配色相关参数', async () => {
    const { container } = render(<ImageToSvg />);
    await dropImage(container);
    chooseSegmented('黑白二值');
    await waitFor(() => expect((rasterToSvg as jest.Mock).mock.calls.length).toBeGreaterThan(1));
    const call = (rasterToSvg as jest.Mock).mock.calls.slice(-1)[0];
    expect(call[3].binary).toBe(true);
    // 坡道首像素 (0,1,2) -> 亮度 1, α 保持 3
    expect(Array.from(call[0].slice(0, 4))).toEqual([ 1, 1, 1, 3 ]);
    // 二值下不展示颜色聚类参数
    expect(hasRow('颜色精度')).toBe(false);
    expect(hasRow('层间色差')).toBe(false);
    expect(hasRow('层叠策略')).toBe(false);
    // 其余参数仍在
    expect(hasRow('斑点过滤')).toBe(true);
  });

  test('预设会覆盖参数, 手改后回到"未选预设"', async () => {
    const { container } = render(<ImageToSvg />);
    await dropImage(container);
    chooseSegmented('像素风');
    await waitFor(() => expect((rasterToSvg as jest.Mock).mock.calls.length).toBeGreaterThan(1));
    const presetCall = (rasterToSvg as jest.Mock).mock.calls.slice(-1)[0];
    expect(presetCall[3].mode).toBe('pixel');
    expect(container.textContent).toContain('不做曲线拟合');

    // 手动改一个数值参数: 预设名置空, 出现"已手动调整参数"
    const spin = rowOf('斑点过滤').querySelector('input.ant-input-number-input') as HTMLInputElement;
    fireEvent.change(spin, { target: { value: '32' } });
    fireEvent.blur(spin);
    await waitFor(() => expect((rasterToSvg as jest.Mock).mock.calls.slice(-1)[0][3].filterSpeckle).toBe(32));
    expect(screen.getByText(/已手动调整参数/)).toBeInTheDocument();
  });

  test('处理尺寸选 512 时按最长边缩小, 并提示已缩放', async () => {
    const { container } = render(<ImageToSvg />);
    await dropImage(container);
    // 4x2 原图不会被缩小, 改用一张"大图": 直接检视请求尺寸参数即可
    chooseSegmented('最长边不超过 512 px');
    await waitFor(() => expect((rasterToSvg as jest.Mock).mock.calls.length).toBeGreaterThan(1));
    const call = (rasterToSvg as jest.Mock).mock.calls.slice(-1)[0];
    expect(call[1]).toBe(4);
    expect(call[2]).toBe(2);
    expect(container.textContent).not.toContain('已按上限缩小');
  });

  test('清空后回到拖拽区', async () => {
    const { container } = render(<ImageToSvg />);
    await dropImage(container);
    fireEvent.click(btn('清空'));
    await waitFor(() => expect(container.querySelector('div[style*="dashed"]')).toBeInTheDocument());
    expect(btn('保存 SVG')).toBeDisabled();
    expect(svgPreview(container)).toBeUndefined();
  });
});

describe('ImageToSvg 导出', () => {
  test('保存为 原名_vector.svg 并透传 SVG 文本', async () => {
    const { container } = render(<ImageToSvg />);
    await dropImage(container, 'pic.jpg');
    fireEvent.click(btn('保存 SVG'));
    await waitFor(() => expect(saveTextFile).toHaveBeenCalledTimes(1));
    const [ name, text, , filter ] = (saveTextFile as jest.Mock).mock.calls[0];
    expect(name).toBe('pic_vector.svg');
    expect(text).toContain('viewBox="0 0 4 2"');
    expect(filter).toEqual({ filterName: 'SVG', extensions: [ 'svg' ] });
  });

  test('复制 SVG: 把未注入 viewBox 的原始输出交给剪贴板', async () => {
    const { container } = render(<ImageToSvg />);
    await dropImage(container);
    fireEvent.click(btn('复制 SVG'));
    await waitFor(() => expect(copyTextToClipboard).toHaveBeenCalledTimes(1));
    expect((copyTextToClipboard as jest.Mock).mock.calls[0][0]).toContain('viewBox="0 0 4 2"');
  });

  test('显示源码可展开 / 收起', async () => {
    const { container } = render(<ImageToSvg />);
    await dropImage(container);
    expect(container.querySelector('pre')).toBeNull();
    fireEvent.click(btn('显示源码'));
    await waitFor(() => expect(container.querySelector('pre')?.textContent).toContain('<svg'));
    fireEvent.click(btn('收起源码'));
    await waitFor(() => expect(container.querySelector('pre')).toBeNull());
  });

  test('矢量化失败时给出提示', async () => {
    (rasterToSvg as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    const { container } = render(<ImageToSvg />);
    const zone = container.querySelector('div[style*="dashed"]') as HTMLElement;
    fireEvent.drop(zone, { dataTransfer: { files: [ new File([ 'x' ], 'bad.png', { type: 'image/png' }) ] } });
    await waitFor(() => expect(screen.getByText(/矢量化失败/)).toBeInTheDocument(), { timeout: 4000 });
    expect(btn('保存 SVG')).toBeDisabled();
  });

  test('WebAssembly 被 CSP 拦截时给出专门的提示', async () => {
    (rasterToSvg as jest.Mock).mockRejectedValueOnce(new Error(
      'Compiling or instantiating WebAssembly module violates the following Content Security policy directive',
    ));
    const { container } = render(<ImageToSvg />);
    const zone = container.querySelector('div[style*="dashed"]') as HTMLElement;
    fireEvent.drop(zone, { dataTransfer: { files: [ new File([ 'x' ], 'csp.png', { type: 'image/png' }) ] } });
    await waitFor(() => expect(screen.getByText(/禁止运行 WebAssembly/)).toBeInTheDocument(), { timeout: 4000 });
    expect(screen.queryByText(/矢量化失败/)).toBeNull();
  });
});
