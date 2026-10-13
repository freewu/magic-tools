import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import BeadPatternGenerator from './index';
import { loadImageFile, type ImageFile } from '../../lib/image';
import { copyTextToClipboard } from '../../lib';
import { saveBytesFile } from '../../lib/tauri';

jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../lib/tauri', () => ({
  isTauri: () => true,
  saveBytesFile: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../lib/image', () => ({
  ...jest.requireActual('../../lib/image'),
  loadImageFile: jest.fn(),
}));

const loadMock = loadImageFile as jest.Mock;

/** 四色竖条纹 (4x4 原图): 红/绿/蓝/黄, 各占边缘 25% -> 不会被误判成背景 */
const STRIPES = [ [ 255, 0, 0 ], [ 0, 160, 0 ], [ 0, 0, 255 ], [ 255, 200, 0 ] ];
const ramp = (w: number, h: number): Uint8ClampedArray => {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const [ r, g, b ] = STRIPES[x % STRIPES.length];
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  return data;
};

const stubCtx = {
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high',
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: 'left',
  textBaseline: 'middle',
  clearRect: () => undefined,
  fillRect: () => undefined,
  drawImage: () => undefined,
  beginPath: () => undefined,
  moveTo: () => undefined,
  lineTo: () => undefined,
  stroke: () => undefined,
  fillText: () => undefined,
  measureText: (t: string) => ({ width: t.length * 6 }),
  getImageData: (_x: number, _y: number, w: number, h: number) => ({ data: ramp(w, h), width: w, height: h }),
  putImageData: () => undefined,
};

const fakeImage = (): ImageFile => ({
  url: 'blob:fake',
  img: { naturalWidth: 4, naturalHeight: 4, width: 4, height: 4 } as unknown as HTMLImageElement,
  size: { width: 4, height: 4 },
  bytes: 4,
  base: 'fake',
});

const file = (name = 'photo.png', type = 'image/png') => new File([ 'x' ], name, { type });

/** 拖拽区 */
const zone = (container: HTMLElement) => container.querySelector('div[style*="dashed"]') as HTMLElement;
/**
 * 按取值范围取滑块 (与行内位置无关):
 * 图纸宽 8~200 / 图纸高 1~200 / 用色数 2~48 / 亮度・对比度・饱和度 -100~100
 */
const slider = (container: HTMLElement, min: number, max: number): HTMLElement => {
  const hit = [ ...container.querySelectorAll('[role="slider"]') ].find(
    (el) => el.getAttribute('aria-valuemin') === String(min) && el.getAttribute('aria-valuemax') === String(max)
  );
  if (!hit) throw new Error(`未找到滑块: ${min}~${max}`);
  return hit as HTMLElement;
};
const widthSlider = (container: HTMLElement) => slider(container, 8, 200);
const heightSlider = (container: HTMLElement) => slider(container, 1, 200);
/** 预览画布 (重采样用的画布不在文档里, 所以 DOM 中只有一个 canvas) */
const canvas = (container: HTMLElement) => container.querySelector('canvas') as HTMLCanvasElement;
const btn = (name: string): HTMLButtonElement => {
  const target = name.replace(/\s+/g, '');
  const hit = screen
    .getAllByText((_, el) => (el?.textContent ?? '').replace(/\s+/g, '') === target)
    .find((el) => el.closest('button'));
  if (!hit) throw new Error(`未找到按钮: ${name}`);
  return hit.closest('button') as HTMLButtonElement;
};

/** 上传图片并等待统计出现 */
const upload = async (container: HTMLElement) => {
  loadMock.mockResolvedValue(fakeImage());
  fireEvent.drop(zone(container), { dataTransfer: { files: [ file() ] } });
  await waitFor(() => expect(canvas(container)).toBeTruthy());
};

/** 点击预览画布上的格子 (按 1:1 像素换算) */
const clickCell = (container: HTMLElement, cx: number, cy: number) => {
  const el = canvas(container);
  el.getBoundingClientRect = () => ({
    left: 0, top: 0, width: el.width, height: el.height,
    right: el.width, bottom: el.height, x: 0, y: 0, toJSON: () => ({}),
  }) as DOMRect;
  fireEvent.click(el, { clientX: cx, clientY: cy });
};

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => stubCtx) as unknown as HTMLCanvasElement['getContext'];
  HTMLCanvasElement.prototype.toBlob = jest.fn((cb: BlobCallback) => {
    cb(new Blob([ new Uint8Array([ 1, 2, 3 ]) ], { type: 'image/png' }));
  }) as unknown as HTMLCanvasElement['toBlob'];
});

beforeEach(() => {
  message.destroy();
  loadMock.mockReset();
  (saveBytesFile as jest.Mock).mockClear();
  (copyTextToClipboard as jest.Mock).mockClear();
});

afterEach(() => cleanup());

describe('拼豆图纸 初始界面', () => {
  test('未载入图片时展示拖拽区与说明, 预览为空状态', () => {
    const { container } = render(<BeadPatternGenerator />);
    expect(screen.getByText('点击或拖拽图片到此处')).toBeInTheDocument();
    expect(screen.getByText('载入图片后显示图纸预览')).toBeInTheDocument();
    expect(container.querySelector('canvas')).toBeNull();
    expect(container.textContent).not.toContain('总豆数');
  });

  test('默认参数: 宽 58 颗粒 / 16 色 / 去背景开启 / 自动格子', () => {
    const { container } = render(<BeadPatternGenerator />);
    // 图纸宽/高改为滑块 (颗粒数), 单独一行
    expect(screen.getByText('图纸宽 (颗粒数):')).toBeInTheDocument();
    expect(screen.getByText('图纸高 (颗粒数):')).toBeInTheDocument();
    expect(widthSlider(container).getAttribute('aria-valuenow')).toBe('58');
    expect(heightSlider(container).getAttribute('aria-valuenow')).toBe('58');
    expect(container.querySelector('input.ant-input-number-input')).toBeNull();
    expect(screen.getByText('16')).toBeInTheDocument();
    expect(screen.getByText(/小豆/)).toBeInTheDocument();
    // 未载入图片前不出现导出入口 (没有可导出的内容)
    expect(screen.queryByText('导出图纸 PNG')).toBeNull();
  });

  test('可以隐藏 / 显示已载入的原图 (隐藏时上传区与说明一并收起)', async () => {
    const { container } = render(<BeadPatternGenerator />);
    await upload(container);
    await waitFor(() => expect(container.textContent).toContain('3364'));
    expect(zone(container)).not.toBeNull();
    expect(container.querySelector('img')).not.toBeNull();
    // 隐藏: 品牌色卡上方的区域 (上传区 + 两行说明) 全部收起, 只留一个小按钮
    const pickSpy = jest.spyOn(HTMLInputElement.prototype, 'click');
    fireEvent.click(screen.getByText('隐藏图片'));
    expect(zone(container)).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(screen.queryByText(/支持 png \/ jpg/)).toBeNull();
    expect(screen.queryByText(/载入图片后自动生成拼豆图纸/)).toBeNull();
    // 点按钮不应冒泡到拖拽区 (不会再次弹出文件选择)
    expect(pickSpy).not.toHaveBeenCalled();
    pickSpy.mockRestore();
    // 图纸与统计不受影响
    expect(container.textContent).toContain('3364');
    expect(canvas(container)).toBeInTheDocument();
    // 显示: 上传区恢复
    fireEvent.click(screen.getByText('显示图片'));
    expect(zone(container)).not.toBeNull();
    expect(container.querySelector('img')).not.toBeNull();
    expect(screen.getByText(/支持 png \/ jpg/)).toBeInTheDocument();
    expect(screen.getByText('隐藏图片')).toBeInTheDocument();
  });

  test('非图片文件给出提示且不读取', async () => {
    const { container } = render(<BeadPatternGenerator />);
    fireEvent.drop(zone(container), { dataTransfer: { files: [ file('a.txt', 'text/plain') ] } });
    await waitFor(() => expect(document.body.textContent).toContain('请选择图片文件'));
    expect(loadMock).not.toHaveBeenCalled();
  });
});

describe('拼豆图纸 生成与编辑', () => {
  test('载入图片后生成图纸: 统计总豆数 / 用量清单 / 色号', async () => {
    const { container } = render(<BeadPatternGenerator />);
    await upload(container);
    await waitFor(() => expect(container.textContent).toContain('总豆数'));
    // 4x4 原图按比例缩到 58x58, 背景色杂乱不会留空 -> 全部 3364 格
    expect(container.textContent).toContain('3364');
    expect(container.textContent).toContain('成品 15.1 × 15.1 cm');
    expect(container.textContent).toMatch(/29×29 拼豆板 2×2 \(4 块\)/);
    expect(container.textContent).toContain('用量清单');
    // 四色竖条纹 -> 4 种豆 (没有背景色被留空)
    expect(container.textContent).toContain('4 种');
    expect(container.textContent).toContain('未识别到纯色背景');
  });

  test('画笔 / 橡皮 / 撤销 / 重做 / 重置', async () => {
    const { container } = render(<BeadPatternGenerator />);
    await upload(container);
    await waitFor(() => expect(container.textContent).toContain('3364'));

    // 橡皮: 擦掉左上角一个豆
    fireEvent.click(screen.getByText('橡皮'));
    clickCell(container, 30, 25);
    await waitFor(() => expect(container.textContent).toContain('3363'));

    // 撤销 -> 3364, 重做 -> 3363
    fireEvent.click(btn('撤销'));
    await waitFor(() => expect(container.textContent).toContain('3364'));
    fireEvent.click(btn('重做'));
    await waitFor(() => expect(container.textContent).toContain('3363'));

    // 重置 -> 回到自动生成的结果
    fireEvent.click(btn('重置'));
    await waitFor(() => expect(container.textContent).toContain('3364'));
  });

  test('换色: 擦掉一个豆后, 选中用量清单里的另一个色号重新涂上', async () => {
    const { container } = render(<BeadPatternGenerator />);
    await upload(container);
    await waitFor(() => expect(container.textContent).toContain('3364'));

    // 先擦掉左上角一个豆
    fireEvent.click(screen.getByText('橡皮'));
    clickCell(container, 30, 25);
    await waitFor(() => expect(container.textContent).toContain('3363'));

    // 用量清单第二行 = 第二种豆; 用画笔补回
    const rows = Array.from(container.querySelectorAll('div[style*="cursor: pointer"]')) as HTMLElement[];
    expect(rows.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(rows[1]);
    fireEvent.click(screen.getByText('画笔'));
    clickCell(container, 30, 25);
    await waitFor(() => expect(container.textContent).toContain('3364'));
  });

  test('宽/高微调按钮每次 ±1, 到边界禁用且高度随宽度联动', async () => {
    const { container } = render(<BeadPatternGenerator />);
    await upload(container);
    await waitFor(() => expect(container.textContent).toContain('3364'));
    const w = widthSlider(container);
    const h = heightSlider(container);
    // 默认 58/58, 勾选按原图比例 -> 高度按钮禁用
    expect(screen.getByLabelText('增大图纸宽')).toBeEnabled();
    expect(screen.getByLabelText('增大图纸高')).toBeDisabled();
    fireEvent.click(screen.getByLabelText('增大图纸宽'));
    expect(w.getAttribute('aria-valuenow')).toBe('59');
    // 宽度 +1 后高度按原图比例 (4x4) 同步为 59, 但 59 不是整数倍? heightForWidth 走四舍五入
    expect(h.getAttribute('aria-valuenow')).toBe('59');
    expect(container.textContent).toContain('3481'); // 59x59
    fireEvent.click(screen.getByLabelText('减小图纸宽'));
    expect(w.getAttribute('aria-valuenow')).toBe('58');
    // 取消按原图比例后可单独微调高度
    fireEvent.click(screen.getByText('按原图比例'));
    expect(screen.getByLabelText('增大图纸高')).toBeEnabled();
    fireEvent.click(screen.getByLabelText('减小图纸高'));
    expect(h.getAttribute('aria-valuenow')).toBe('57');
    expect(container.textContent).toContain('3306'); // 58x57
    // 下限: 高度最小 1, 宽度最小 8
    fireEvent.keyDown(h, { keyCode: 36 });
    expect(h.getAttribute('aria-valuenow')).toBe('1');
    expect(screen.getByLabelText('减小图纸高')).toBeDisabled();
    fireEvent.keyDown(w, { keyCode: 36 });
    expect(screen.getByLabelText('减小图纸宽')).toBeDisabled();
    // 上限: 用 END 键把宽度拉满 200
    fireEvent.keyDown(w, { keyCode: 35 });
    expect(w.getAttribute('aria-valuenow')).toBe('200');
    expect(screen.getByLabelText('增大图纸宽')).toBeDisabled();
  });

  test('预览可放大/缩小, 归位回到 100% 且滚动回原点', async () => {
    const { container } = render(<BeadPatternGenerator />);
    await upload(container);
    await waitFor(() => expect(container.textContent).toContain('3364'));
    const cv = canvas(container);
    const view = cv.parentElement as HTMLElement;
    const base = cv.style.width;
    expect(screen.getByText('100%')).toBeInTheDocument();

    // 放大一档 25%: 画布显示尺寸随之变大 (位图尺寸不变)
    fireEvent.click(screen.getByLabelText('放大'));
    expect(screen.getByText('125%')).toBeInTheDocument();
    expect(cv.style.width).toBe(`${Math.round(parseFloat(base) * 1.25)}px`);
    expect(cv.width).toBe(Math.round(parseFloat(base)));

    // 缩小回 100%
    fireEvent.click(screen.getByLabelText('缩小'));
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(cv.style.width).toBe(base);

    // 连续放大到上限 400% (按钮禁用) 与下限 25%
    for (let i = 0; i < 20; i++) fireEvent.click(screen.getByLabelText('放大'));
    expect(screen.getByText('400%')).toBeInTheDocument();
    expect(screen.getByLabelText('放大')).toBeDisabled();
    for (let i = 0; i < 40; i++) fireEvent.click(screen.getByLabelText('缩小'));
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByLabelText('缩小')).toBeDisabled();

    // 归位: 缩放回 100%, 滚动位置回原点
    fireEvent.click(screen.getByLabelText('放大'));
    view.scrollLeft = 120;
    view.scrollTop = 80;
    fireEvent.click(btn('归位'));
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(cv.style.width).toBe(base);
    expect(view.scrollLeft).toBe(0);
    expect(view.scrollTop).toBe(0);
  });

  test('镜像开关不改变豆数, 但会重绘预览', async () => {
    const { container } = render(<BeadPatternGenerator />);
    await upload(container);
    await waitFor(() => expect(container.textContent).toContain('3364'));
    const before = canvas(container).width;
    fireEvent.click(screen.getByText('镜像'));
    expect(container.textContent).toContain('3364');
    expect(canvas(container).width).toBe(before);
  });

  test('滑块调整图纸宽后, 按原图比例联动高度', async () => {
    const { container } = render(<BeadPatternGenerator />);
    await upload(container);
    await waitFor(() => expect(container.textContent).toContain('3364'));
    const w = widthSlider(container);
    // HOME 键把宽度拉到最小 (8 颗粒), 4x4 原图 -> 高度同步为 8
    fireEvent.keyDown(w, { keyCode: 36 });
    await waitFor(() => expect(w.getAttribute('aria-valuenow')).toBe('8'));
    await waitFor(() => expect(heightSlider(container).getAttribute('aria-valuenow')).toBe('8'));
    // 8x8 = 64 颗粒
    await waitFor(() => expect(container.textContent).toContain('64'));
    expect(container.textContent).not.toContain('3364');
  });

  test('切换品牌色卡后色号随之改变', async () => {
    const { container } = render(<BeadPatternGenerator />);
    await upload(container);
    await waitFor(() => expect(container.textContent).toContain('3364'));
    const selector = container.querySelector('.ant-select-selector') as HTMLElement;
    fireEvent.mouseDown(selector);
    const option = await screen.findByText(/Hama/);
    fireEvent.click(option);
    await waitFor(() => expect(container.textContent).toMatch(/H\d{2}/));
  });
});

describe('拼豆图纸 导出', () => {
  test('导出 PNG / 两个 CSV / 复制清单', async () => {
    const { container } = render(<BeadPatternGenerator />);
    await upload(container);
    await waitFor(() => expect(container.textContent).toContain('3364'));

    fireEvent.click(btn('导出图纸 PNG'));
    await waitFor(() => expect(saveBytesFile).toHaveBeenCalledTimes(1));
    expect((saveBytesFile as jest.Mock).mock.calls[0][0]).toBe('fake-mard-58x58.png');

    fireEvent.click(btn('导出色号 CSV'));
    await waitFor(() => expect(saveBytesFile).toHaveBeenCalledTimes(2));
    expect((saveBytesFile as jest.Mock).mock.calls[1][0]).toBe('fake-mard-58x58.csv');
    const csvBytes = (saveBytesFile as jest.Mock).mock.calls[1][1] as Uint8Array;
    // Excel 友好: 带 UTF-8 BOM
    expect(Array.from(csvBytes.slice(0, 3))).toEqual([ 0xEF, 0xBB, 0xBF ]);
    const codeCsv = new TextDecoder().decode(csvBytes);
    expect(codeCsv.startsWith(',1,2')).toBe(true);
    expect(codeCsv.split('\r\n').length).toBe(60);

    fireEvent.click(btn('导出用量 CSV'));
    await waitFor(() => expect(saveBytesFile).toHaveBeenCalledTimes(3));
    expect((saveBytesFile as jest.Mock).mock.calls[2][0]).toBe('fake-mard-usage.csv');

    fireEvent.click(btn('复制清单'));
    await waitFor(() => expect(copyTextToClipboard).toHaveBeenCalledTimes(1));
    const text = (copyTextToClipboard as jest.Mock).mock.calls[0][0] as string;
    expect(text).toContain('色号');
    expect(text).toContain('颗');
    expect(text).toContain('合计');
  });

  test('粘贴图片也能载入', async () => {
    const { container } = render(<BeadPatternGenerator />);
    loadMock.mockResolvedValue(fakeImage());
    const ev = new Event('paste') as Event & { clipboardData?: unknown };
    ev.clipboardData = { files: [ file() ] };
    window.dispatchEvent(ev);
    await waitFor(() => expect(canvas(container)).toBeTruthy());
    expect(container.textContent).toContain('3364');
  });
});
