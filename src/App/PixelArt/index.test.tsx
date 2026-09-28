import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { message } from 'antd';
import PixelArt from './index';
import { saveBytesFile, savePngFile } from '../../lib/tauri';
import { PALETTE_DEFS } from './data';

jest.mock('../../lib/tauri', () => ({
  isTauri: () => true,
  savePngFile: jest.fn().mockResolvedValue(true),
  saveBytesFile: jest.fn().mockResolvedValue(true),
}));

// ---- canvas 桩: 记录 putImageData 的数据 ----
const putDatas: ImageData[] = [];
/** 左半 #ff0000 / 右半 #0000ff, 块大小 2 时正好分成左右两列色块 */
const ramp = (w: number, h: number) => {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const left = x < w / 2;
      data[i] = left ? 255 : 0;
      data[i + 1] = 0;
      data[i + 2] = left ? 0 : 255;
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
/** 某个参数行里的开关 */
const switchIn = (label: string): HTMLButtonElement =>
  rowOf(label).querySelector('button.ant-switch') as HTMLButtonElement;
/** 某个参数行里的下拉框当前选项 */
const selectIn = (label: string): string =>
  (rowOf(label).querySelector('.ant-select-selection-item') as HTMLElement)?.textContent ?? '';
/** 快捷配置单选项 */
const presetBtn = (name: string): HTMLElement => {
  const span = screen.getAllByText(name).find((el) => el.closest('label.ant-radio-button-wrapper'));
  if (!span) throw new Error(`未找到快捷配置: ${name}`);
  return span.closest('label') as HTMLElement;
};
/** 打开下拉框并点击匹配的选项 (下拉列表为虚拟列表, 只渲染可见部分) */
const openSelect = (label: string) => {
  const sel = rowOf(label).querySelector('.ant-select-selector') as HTMLElement;
  fireEvent.mouseDown(sel);
};
const clickOption = (re: RegExp) => {
  const hit = screen.getAllByText((_, el) => {
    if (!el || !el.classList.contains('ant-select-item-option-content')) return false;
    return re.test(el.textContent ?? '');
  })[0];
  if (!hit) throw new Error(`未找到下拉选项: ${re}`);
  fireEvent.click(hit);
};
/** 最后一次处理结果 */
const lastPixels = (): number[] => Array.from(putDatas[putDatas.length - 1].data);
/** (x, y) 处像素 */
const px = (x: number, y: number, w = 4): number[] => {
  const d = lastPixels();
  const i = (y * w + x) * 4;
  return [ d[i], d[i + 1], d[i + 2], d[i + 3] ];
};
/** 改动数字输入框 */
const setSpin = (label: string, value: string) => {
  const spin = spinIn(label);
  fireEvent.change(spin, { target: { value } });
  fireEvent.blur(spin);
};

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => stubCtx) as unknown as HTMLCanvasElement['getContext'];
  HTMLCanvasElement.prototype.toDataURL = jest.fn((type?: string) => `data:${type ?? 'image/png'};base64,AAAA`) as never;
  (global as unknown as { Image: unknown }).Image = MockImage;
});

beforeEach(() => {
  putDatas.length = 0;
  message.destroy();
  localStorage.clear();
  (savePngFile as jest.Mock).mockClear();
  (saveBytesFile as jest.Mock).mockClear();
});

describe('PixelArt 初始界面', () => {
  test('未选图片时展示拖拽区, 保存与清空不可用', () => {
    const { container } = render(<PixelArt />);
    expect(within(container).getByText('拖拽图片到此处, 或点击「选择图片」')).toBeInTheDocument();
    expect(btn('保存')).toBeDisabled();
    expect(btn('清空')).toBeDisabled();
    expect(images(container)).toHaveLength(0);
  });

  test('默认套用「人像照片」快捷配置 (像素大小 7 / 不开灰度 / 自适应 64 色 + 抖动)', () => {
    const { container } = render(<PixelArt />);
    expect(presetBtn('人像照片')).toBeInTheDocument();
    expect(spinIn('像素大小').value).toBe('7');
    expect(switchIn('灰度')).toHaveAttribute('aria-checked', 'false');
    expect(selectIn('调色板')).toBe('自适应 64 色');
    expect(switchIn('抖动')).toHaveAttribute('aria-checked', 'true');
    expect(within(container).getByText(/像素大小 6~8 · 不开灰度/)).toBeInTheDocument();
    expect(within(container).getByText(/已应用 像素大小 7 · 灰度 关 · 抖动 开 · 调色板 自适应 64 色/)).toBeInTheDocument();
  });

  test('设置中心的默认快捷配置会影响初始参数', () => {
    localStorage.setItem('pixelart:default-preset', 'abstract');
    render(<PixelArt />);
    expect(spinIn('像素大小').value).toBe('20');
    expect(switchIn('灰度')).toHaveAttribute('aria-checked', 'true');
    expect(selectIn('调色板')).toBe('关闭 (不量化)');
    expect(switchIn('抖动')).toBeDisabled(); // 调色板关闭时抖动不生效
  });

  test('调色板下拉: 分组标题与带色数的色表项', async () => {
    const { container } = render(<PixelArt />);
    await dropImage(container);
    openSelect('调色板');
    expect(screen.getAllByText('自适应取色').length).toBeGreaterThan(0);
    expect(screen.getAllByText('经典主机').length).toBeGreaterThan(0);
    expect(screen.getAllByText('PICO-8 (16 色)').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\(\d+ 色\)$/).length).toBeGreaterThan(3);
  });
});

describe('PixelArt 处理与预览', () => {
  test('拖入图片后自动生成像素图, 出现结果预览与统计标签', async () => {
    const { container } = render(<PixelArt />);
    await dropImage(container);
    await waitFor(() => expect(putDatas.length).toBeGreaterThan(0));
    expect(images(container)).toHaveLength(2);
    expect(within(container).getByText('原图尺寸')).toBeInTheDocument();
    expect(within(container).getByText('结果尺寸')).toBeInTheDocument();
    expect(within(container).getAllByText('4 × 4 px')).toHaveLength(2);
    expect(within(container).getByText('像素块')).toBeInTheDocument();
    expect(within(container).getByText('色块')).toBeInTheDocument();
    expect(btn('保存')).toBeEnabled();
  });

  test('像素块平均: 默认块 7 时 4×4 缩成 1 个色块 (整图为左红右蓝的平均)', async () => {
    const { container } = render(<PixelArt />);
    await dropImage(container);
    await waitFor(() => expect(putDatas.length).toBeGreaterThan(0));
    expect(px(0, 0)).toEqual([ 128, 0, 128, 255 ]);
    expect(px(3, 3)).toEqual([ 128, 0, 128, 255 ]);
    expect(within(container).getByText('1 × 1 块')).toBeInTheDocument();
  });

  test('像素块 2 时左右两列分别是纯红与纯蓝', async () => {
    const { container } = render(<PixelArt />);
    await dropImage(container);
    await waitFor(() => expect(putDatas.length).toBeGreaterThan(0));
    setSpin('像素大小', '2');
    await waitFor(() => expect(px(0, 0)).toEqual([ 255, 0, 0, 255 ]));
    expect(px(1, 1)).toEqual([ 255, 0, 0, 255 ]);
    expect(px(2, 0)).toEqual([ 0, 0, 255, 255 ]);
    expect(px(3, 3)).toEqual([ 0, 0, 255, 255 ]);
    expect(within(container).getByText('2 × 2 块')).toBeInTheDocument();
  });

  test('灰度开关: 输出 RGB 三通道相等', async () => {
    const { container } = render(<PixelArt />);
    await dropImage(container);
    await waitFor(() => expect(putDatas.length).toBeGreaterThan(0));
    setSpin('像素大小', '2');
    await waitFor(() => expect(px(0, 0)).toEqual([ 255, 0, 0, 255 ]));
    fireEvent.click(switchIn('灰度'));
    await waitFor(() => {
      const [ r, g, b ] = px(0, 0);
      expect(r).toBe(g);
      expect(g).toBe(b);
    });
  });

  test('调色板: 输出只使用所选色板的颜色', async () => {
    const { container } = render(<PixelArt />);
    await dropImage(container);
    await waitFor(() => expect(putDatas.length).toBeGreaterThan(0));
    setSpin('像素大小', '2');
    openSelect('调色板');
    clickOption(/Game Boy DMG 绿屏/);
    await waitFor(() => expect(selectIn('调色板')).toBe('Game Boy DMG 绿屏 (4 色)'));
    await waitFor(() => {
      const allowed = new Set(PALETTE_DEFS.gameboy.colors);
      const d = lastPixels();
      for (let i = 0; i + 3 < d.length; i += 4) {
        const hex = [ d[i], d[i + 1], d[i + 2] ]
          .map((v) => v.toString(16).toUpperCase().padStart(2, '0'))
          .join('');
        expect(allowed.has(hex)).toBe(true);
      }
    });
  });

  test('清空后回到拖拽区', async () => {
    const { container } = render(<PixelArt />);
    await dropImage(container);
    fireEvent.click(btn('清空'));
    await waitFor(() => expect(container.querySelector('div[style*="dashed"]')).toBeInTheDocument());
    expect(btn('保存')).toBeDisabled();
    expect(images(container)).toHaveLength(0);
  });
});

describe('PixelArt 快捷配置', () => {
  test('游戏素材: 像素大小 10 / PICO-8 / 关闭抖动', async () => {
    const { container } = render(<PixelArt />);
    await dropImage(container);
    fireEvent.click(presetBtn('游戏素材'));
    await waitFor(() => expect(spinIn('像素大小').value).toBe('10'));
    expect(selectIn('调色板')).toBe('PICO-8 (16 色)');
    expect(switchIn('抖动')).toHaveAttribute('aria-checked', 'false');
    expect(within(container).getByText(/像素大小 8~12 · 适合目标主机的经典游戏调色板/)).toBeInTheDocument();
  });

  test('抽象创作: 像素大小 20 / 开灰度 / 关闭调色板 (抖动禁用)', async () => {
    const { container } = render(<PixelArt />);
    await dropImage(container);
    fireEvent.click(presetBtn('抽象创作'));
    await waitFor(() => expect(spinIn('像素大小').value).toBe('20'));
    expect(switchIn('灰度')).toHaveAttribute('aria-checked', 'true');
    expect(selectIn('调色板')).toBe('关闭 (不量化)');
    expect(switchIn('抖动')).toBeDisabled();
    expect(within(container).getByText(/像素大小 15~25 · 开灰度 · 关闭调色板/)).toBeInTheDocument();
    // 关掉调色板后颜色仍来自原图, 只做块化 + 灰度
    await waitFor(() => expect(lastPixels()[0]).toBe(lastPixels()[1]));
  });

  test('手动改参数后快捷配置切到「自定义」', async () => {
    const { container } = render(<PixelArt />);
    await dropImage(container);
    setSpin('像素大小', '30');
    await waitFor(() => expect(within(container).getByText(/当前为自定义参数/)).toBeInTheDocument());
    expect(spinIn('像素大小').value).toBe('30');
    // 再点一次快捷配置可一键套回推荐值
    fireEvent.click(presetBtn('人像照片'));
    await waitFor(() => expect(spinIn('像素大小').value).toBe('7'));
  });
});

describe('PixelArt 保存', () => {
  test('保存 PNG 使用 _pixelart 后缀', async () => {
    const { container } = render(<PixelArt />);
    await dropImage(container, 'my photo.png');
    await waitFor(() => expect(putDatas.length).toBeGreaterThan(0));
    fireEvent.click(btn('保存'));
    await waitFor(() => expect(savePngFile).toHaveBeenCalledTimes(1));
    expect((savePngFile as jest.Mock).mock.calls[0][0]).toBe('my photo_pixelart.png');
    expect(await screen.findByText(/已保存 my photo_pixelart.png/)).toBeInTheDocument();
  });

  test('切到 JPEG 后走字节保存 (.jpg)', async () => {
    const { container } = render(<PixelArt />);
    await dropImage(container);
    await waitFor(() => expect(putDatas.length).toBeGreaterThan(0));
    fireEvent.click(screen.getByText('JPEG'));
    fireEvent.click(btn('保存'));
    await waitFor(() => expect(saveBytesFile).toHaveBeenCalledTimes(1));
    expect((saveBytesFile as jest.Mock).mock.calls[0][0]).toBe('photo_pixelart.jpg');
    expect(savePngFile).not.toHaveBeenCalled();
  });

  test('保存取消时给出提示', async () => {
    (savePngFile as jest.Mock).mockResolvedValueOnce(false);
    const { container } = render(<PixelArt />);
    await dropImage(container);
    await waitFor(() => expect(putDatas.length).toBeGreaterThan(0));
    fireEvent.click(btn('保存'));
    await waitFor(() => expect(document.querySelector('.ant-message')?.textContent).toContain('已取消保存'));
  });

  test('保存抛错时提示失败', async () => {
    (savePngFile as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    const { container } = render(<PixelArt />);
    await dropImage(container);
    await waitFor(() => expect(putDatas.length).toBeGreaterThan(0));
    fireEvent.click(btn('保存'));
    await waitFor(() => expect(document.querySelector('.ant-message')?.textContent).toContain('保存失败'));
  });

  test('非图片文件给出提示', async () => {
    const { container } = render(<PixelArt />);
    const zone = container.querySelector('div[style*="dashed"]') as HTMLElement;
    fireEvent.drop(zone, { dataTransfer: { files: [ new File([ 'x' ], 'a.txt', { type: 'text/plain' }) ] } });
    await waitFor(() => expect(within(container).getByText('请选择图片文件')).toBeInTheDocument());
    expect(btn('保存')).toBeDisabled();
  });

  test('读取失败时给出错误提示', async () => {
    const { container } = render(<PixelArt />);
    const proto = FileReader.prototype as unknown as { readAsDataURL: (f: File) => void };
    const orig = proto.readAsDataURL;
    proto.readAsDataURL = function (this: FileReader) {
      setTimeout(() => (this.onerror as ((e: Event) => void) | null)?.(new ProgressEvent('error')), 0);
    };
    try {
      const zone = container.querySelector('div[style*="dashed"]') as HTMLElement;
      fireEvent.drop(zone, { dataTransfer: { files: [ new File([ 'x' ], 'bad.png', { type: 'image/png' }) ] } });
      await waitFor(() => expect(within(container).getByText('图片读取失败')).toBeInTheDocument());
    } finally {
      proto.readAsDataURL = orig;
    }
    expect(btn('保存')).toBeDisabled();
  });
});
