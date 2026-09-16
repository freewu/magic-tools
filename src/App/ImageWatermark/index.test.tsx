import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ImageWatermark from './index';
import { saveBytesFile, savePngFile } from '../../lib/tauri';
import { buildPlan, type WatermarkPlan } from './lib';

jest.mock('../../lib/tauri', () => ({
  isTauri: () => true,
  savePngFile: jest.fn().mockResolvedValue(true),
  saveBytesFile: jest.fn().mockResolvedValue(true),
}));

// ---- canvas 桩: 记录绘制调用, measureText 用固定比例估算宽度 (与 lib 单测同款约定) ----
interface Call { op: string; args: unknown[]; }
const ctxCalls: Call[] = [];
const ctxState = { alpha: 1, font: '', fillStyle: '', strokeStyle: '', lineWidth: 0, lineJoin: '', textAlign: '', textBaseline: '' };
const fontSizeOf = (font: string) => Number(/(\d+)px/.exec(font)?.[1] ?? 0);
const stubCtx = {
  save: () => ctxCalls.push({ op: 'save', args: [] }),
  restore: () => ctxCalls.push({ op: 'restore', args: [] }),
  translate: (x: number, y: number) => ctxCalls.push({ op: 'translate', args: [ x, y ] }),
  rotate: (r: number) => ctxCalls.push({ op: 'rotate', args: [ r ] }),
  fillRect: (x: number, y: number, w: number, h: number) => ctxCalls.push({ op: 'fillRect', args: [ x, y, w, h ] }),
  fillText: (t: string, x: number, y: number) => ctxCalls.push({ op: 'fillText', args: [ t, x, y ] }),
  strokeText: (t: string, x: number, y: number) => ctxCalls.push({ op: 'strokeText', args: [ t, x, y ] }),
  drawImage: (...args: unknown[]) => ctxCalls.push({ op: 'drawImage', args }),
  measureText: (text: string) => ({ width: text.length * fontSizeOf(ctxState.font) * 0.5 }),
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high',
  get globalAlpha() { return ctxState.alpha; },
  set globalAlpha(v: number) { ctxState.alpha = v; },
  get font() { return ctxState.font; },
  set font(v: string) { ctxState.font = v; },
  get fillStyle() { return ctxState.fillStyle; },
  set fillStyle(v: string) { ctxState.fillStyle = v; },
  get strokeStyle() { return ctxState.strokeStyle; },
  set strokeStyle(v: string) { ctxState.strokeStyle = v; },
  get lineWidth() { return ctxState.lineWidth; },
  set lineWidth(v: number) { ctxState.lineWidth = v; },
  get lineJoin() { return ctxState.lineJoin; },
  set lineJoin(v: string) { ctxState.lineJoin = v; },
  get textAlign() { return ctxState.textAlign; },
  set textAlign(v: string) { ctxState.textAlign = v; },
  get textBaseline() { return ctxState.textBaseline; },
  set textBaseline(v: string) { ctxState.textBaseline = v; },
};

// ---- Image 桩: 每次 src 赋值都异步触发 onload, 按顺序给出图片尺寸 (第一次原图, 之后水印图) ----
const imageSizes: Array<{ width: number; height: number }> = [ { width: 1000, height: 600 } ];
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 0;
  naturalHeight = 0;
  private inner = '';
  get src() { return this.inner; }
  set src(v: string) {
    this.inner = v;
    const size = imageSizes.length > 1 ? imageSizes.shift()! : imageSizes[0];
    this.naturalWidth = size.width;
    this.naturalHeight = size.height;
    setTimeout(() => this.onload?.(), 0);
  }
}

/** 上方 textarea = 文字内容 */
const textarea = () => screen.getByRole('textbox') as HTMLTextAreaElement;
/** 参数行左侧标签 (固定 96px 宽), 用它判断某一参数行是否存在 (避免命中说明文字里的同名片段) */
const hasRow = (text: string) =>
  screen.queryAllByText(text).some((el) => (el as HTMLElement).style?.width === '96px');
/** 按按钮文案定位 (antd 会在两个汉字间插空格, 故比较去掉空白后的文本) */
const btn = (name: string): HTMLButtonElement => {
  const target = name.replace(/\s+/g, '');
  const hit = screen
    .getAllByText((_, el) => (el?.textContent ?? '').replace(/\s+/g, '') === target)
    .find((el) => el.closest('button'));
  if (!hit) throw new Error(`未找到按钮: ${name}`);
  return hit.closest('button') as HTMLButtonElement;
};
/** 点击文案: Segmented 要点内部的 radio, Tag 要点标签本身 (说明文字里的 <b> 同名片段会被跳过) */
const clickText = (text: string) => {
  const els = screen.getAllByText(text);
  const segLabel = els.map((el) => el.closest('label.ant-segmented-item')).find(Boolean);
  if (segLabel) {
    fireEvent.click(segLabel.querySelector('input') ?? segLabel);
    return;
  }
  const tag = els.find((el) => el.closest('.ant-tag')) ?? els[els.length - 1];
  fireEvent.click(tag.closest('button') ?? tag.closest('.ant-tag') ?? tag);
};
/** 拖入一张图片, 并等待渲染完成 */
const dropImage = async (container: HTMLElement, name = 'photo.png') => {
  const zone = container.querySelector('div[style*="dashed"]') as HTMLElement;
  fireEvent.drop(zone, { dataTransfer: { files: [ new File([ 'x' ], name, { type: 'image/png' }) ] } });
  await waitFor(() => expect(container.querySelector('img[src^="data:"]')).toBeInTheDocument());
};
const lastCall = (op: string) => ctxCalls.filter((c) => c.op === op).pop();

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => stubCtx) as unknown as HTMLCanvasElement['getContext'];
  HTMLCanvasElement.prototype.toDataURL = jest.fn((type?: string) => `data:${type ?? 'image/png'};base64,AAAA`) as never;
  (global as unknown as { Image: unknown }).Image = MockImage;
});

beforeEach(() => {
  ctxCalls.length = 0;
  imageSizes.length = 0;
  imageSizes.push({ width: 1000, height: 600 });
  (savePngFile as jest.Mock).mockClear();
  (saveBytesFile as jest.Mock).mockClear();
});

describe('ImageWatermark 初始界面', () => {
  test('未选择图片时显示拖拽区, 保存与清空按钮不可用', () => {
    const { container } = render(<ImageWatermark />);
    expect(within(container).getByText('拖拽图片到此处, 或点击「选择图片」')).toBeInTheDocument();
    expect(btn('选择图片')).toBeInTheDocument();
    expect(btn('保存')).toBeDisabled();
    expect(btn('清空')).toBeDisabled();
    // 参数区默认按文字水印展示, 说明区正常渲染
    expect(hasRow('文字内容')).toBe(true);
    expect(within(container).getByText('图片水印说明')).toBeInTheDocument();
  });

  test('九宫格有 9 个方向按钮, 默认选中「右下」', () => {
    render(<ImageWatermark />);
    const names = [ '左上', '上', '右上', '左', '正中', '右', '左下', '下', '右下' ];
    for (const n of names) expect(screen.getByRole('button', { name: n })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '右下' })).toHaveClass('ant-btn-primary');
    fireEvent.click(screen.getByRole('button', { name: '左上' }));
    expect(screen.getByRole('button', { name: '左上' })).toHaveClass('ant-btn-primary');
    expect(screen.getByRole('button', { name: '右下' })).not.toHaveClass('ant-btn-primary');
    expect(hasRow('位置')).toBe(true);
  });

  test('切到平铺: 「位置」行换成「平铺间距」, 并自动给出 -30° 斜向默认角', () => {
    render(<ImageWatermark />);
    clickText('平铺');
    expect(hasRow('平铺间距')).toBe(true);
    expect(hasRow('位置')).toBe(false);
    expect(screen.getAllByText('-30°').length).toBeGreaterThan(0);
    clickText('单个');
    expect(hasRow('位置')).toBe(true);
    expect(hasRow('平铺间距')).toBe(false);
    expect(screen.getAllByText('0°').length).toBeGreaterThan(0);
  });

  test('切换水印类型: 文字参数与图片参数互斥显示', () => {
    const { container } = render(<ImageWatermark />);
    expect(hasRow('文字内容')).toBe(true);
    clickText('图片水印');
    expect(hasRow('文字内容')).toBe(false);
    expect(hasRow('水印图片')).toBe(true);
    expect(within(container).getByText('未选择水印图片, 结果将不会变化')).toBeInTheDocument();
    clickText('文字水印');
    expect(hasRow('文字内容')).toBe(true);
    expect(hasRow('水印图片')).toBe(false);
  });

  test('文字水印预设: 点标签填入内容, 也可载入示例文字', () => {
    render(<ImageWatermark />);
    clickText('机密');
    expect(textarea().value).toBe('机密');
    fireEvent.click(btn('载入示例文字'));
    expect(textarea().value).toBe('内部资料\n请勿外传');
  });
});

describe('ImageWatermark 绘制与保存', () => {
  test('载入图片 + 输入文字后按方案绘制: 底图一次, 水印居中于九宫格锚点', async () => {
    const { container } = render(<ImageWatermark />);
    await dropImage(container);
    fireEvent.change(textarea(), { target: { value: '内部资料' } });

    // 期望值与 lib 同源: 用同样的「字数 × 字号 × 0.5」度量约定推算
    const plan: WatermarkPlan = buildPlan({ width: 1000, height: 600 }, {
      kind: 'text', text: '内部资料', font: 'sans', fontScale: 5, bold: false, italic: false,
      color: '#ffffff', stroke: true, fit: true, logoSize: { width: 0, height: 0 }, logoScale: 20,
      layout: 'single', position: 'br', margin: 24, gap: 120, rotate: 0, opacity: 0.35,
      measure: (line, font) => line.length * fontSizeOf(font) * 0.5,
    });

    await waitFor(() => expect(lastCall('fillText')?.args[0]).toBe('内部资料'));
    // 底图绘制 (drawImage(img, 0, 0))
    const base = ctxCalls.find((c) => c.op === 'drawImage');
    expect(base?.args[1]).toBe(0);
    expect(base?.args[2]).toBe(0);
    // 水印绘制: 平移到外接矩形中心后居中绘制
    expect(lastCall('translate')?.args).toEqual([
      plan.positions[0].x + plan.box.width / 2,
      plan.positions[0].y + plan.box.height / 2,
    ]);
    expect(lastCall('strokeText')?.args[0]).toBe('内部资料'); // 默认开描边
    expect(ctxState.alpha).toBe(0.35);
    expect(screen.getAllByText('内部资料').length).toBeGreaterThan(0); // 快捷预设标签
    expect(container.querySelectorAll('img[src^="data:"]').length).toBe(2); // 原图 + 结果
  });

  test('切换位置与旋转角度后重新绘制 (角度写入 ctx.rotate, 平铺绘制多个)', async () => {
    const { container } = render(<ImageWatermark />);
    await dropImage(container);
    fireEvent.change(textarea(), { target: { value: '隐' } });
    fireEvent.click(screen.getByRole('button', { name: '左上' }));
    await waitFor(() => expect(lastCall('fillText')).toBeTruthy());
    ctxCalls.length = 0;

    clickText('平铺');
    await waitFor(() => expect(lastCall('rotate')).toBeTruthy());
    expect(lastCall('rotate')?.args[0]).toBeCloseTo(-30 * Math.PI / 180, 6);
    expect(ctxCalls.filter((c) => c.op === 'fillText').length).toBeGreaterThan(1);
  });

  test('透明度与格式: 有损格式先铺白底, 透明度写入 globalAlpha', async () => {
    const { container } = render(<ImageWatermark />);
    await dropImage(container);
    fireEvent.change(textarea(), { target: { value: 'X' } });
    clickText('JPEG');
    await waitFor(() => expect(lastCall('fillRect')?.args[2]).toBe(1000)); // 铺白底 = 图片宽
    expect(screen.queryAllByText('输出质量').length).toBeGreaterThan(0);
    expect(ctxState.alpha).toBe(0.35);
  });

  test('保存: 文件名带 _watermark, PNG 走图片保存, JPEG 走字节保存', async () => {
    const { container } = render(<ImageWatermark />);
    await dropImage(container, 'my.photo.png');
    fireEvent.change(textarea(), { target: { value: 'X' } });
    await waitFor(() => expect(lastCall('fillText')).toBeTruthy());

    fireEvent.click(btn('保存'));
    await waitFor(() => expect(savePngFile).toHaveBeenCalledTimes(1));
    expect((savePngFile as jest.Mock).mock.calls[0][0]).toBe('my.photo_watermark.png');

    clickText('JPEG');
    fireEvent.click(btn('保存'));
    await waitFor(() => expect(saveBytesFile).toHaveBeenCalledTimes(1));
    const [ name, bytes, opts ] = (saveBytesFile as jest.Mock).mock.calls[0];
    expect(name).toBe('my.photo_watermark.jpg');
    expect(Array.from(bytes as Uint8Array)).toEqual([ 0, 0, 0 ]); // dataURL 里的 base64 被解码成字节
    expect(opts).toMatchObject({ filterName: 'JPEG', extensions: [ 'jpg', 'jpeg' ] });
  });

  test('清空: 回到拖拽区并禁用保存', async () => {
    const { container } = render(<ImageWatermark />);
    await dropImage(container);
    fireEvent.change(textarea(), { target: { value: 'X' } });
    await waitFor(() => expect(lastCall('fillText')).toBeTruthy());
    fireEvent.click(btn('清空'));
    await waitFor(() => expect(within(container).getByText('拖拽图片到此处, 或点击「选择图片」')).toBeInTheDocument());
    expect(btn('保存')).toBeDisabled();
  });
});
