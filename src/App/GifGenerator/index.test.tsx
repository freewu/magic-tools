import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { message } from 'antd';
import GifGenerator from './index';
import { saveBytesFile } from '../../lib/tauri';

jest.mock('../../lib/tauri', () => ({
  saveBytesFile: jest.fn(async () => true),
}));

const saveMock = saveBytesFile as jest.Mock;

/** 画布桩: 一律返回不透明像素 (GIF 编码要求有实体像素) */
const stubCtx = {
  fillStyle: '',
  fillRect: () => undefined,
  drawImage: () => undefined,
  createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
  putImageData: () => undefined,
  getImageData: (_x: number, _y: number, w: number, h: number) => {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 200; data[i + 1] = 60; data[i + 2] = 90; data[i + 3] = 255;
    }
    return { data, width: w, height: h };
  },
};

/** 4×4 的假图片 (naturalWidth / naturalHeight 由桩给出) */
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 4;
  naturalHeight = 4;
  width = 4;
  height = 4;
  private inner = '';
  get src() { return this.inner; }
  set src(v: string) {
    this.inner = v;
    setTimeout(() => this.onload?.(), 0);
  }
}

const input = (container: HTMLElement): HTMLInputElement =>
  container.querySelector('#gifGenInput') as HTMLInputElement;
const dropZone = (container: HTMLElement): HTMLElement =>
  container.querySelector('.gg-drop') as HTMLElement;
const rows = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>('.gg-row-frame'));
const names = (container: HTMLElement): string[] =>
  Array.from(container.querySelectorAll<HTMLElement>('.gg-row-name')).map((el) => el.textContent ?? '');
const noticeText = (): string => document.body.textContent ?? '';
const btnRegex = (name: string): RegExp =>
  new RegExp(name.split('').map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*'));
const btn = (name: string): HTMLElement => screen.getByRole('button', { name: btnRegex(name) });

const imageFile = (name: string, type = 'image/png'): File => new File([ 'x' ], name, { type });

/** 添加若干图片并等待帧列表渲染 */
const addImages = async (container: HTMLElement, fileNames = [ 'a.png', 'b.png' ]) => {
  fireEvent.change(input(container), { target: { files: fileNames.map((n) => imageFile(n)) } });
  await waitFor(() => expect(rows(container)).toHaveLength(fileNames.length));
};

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => stubCtx) as unknown as HTMLCanvasElement['getContext'];
  HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,QUJD') as never;
  (global as unknown as { Image: unknown }).Image = MockImage;
});

beforeEach(() => {
  localStorage.clear();
  message.destroy();
  saveMock.mockClear();
  saveMock.mockResolvedValue(true);
});

describe('GifGenerator 初始界面', () => {
  test('未选图片时只显示拖拽区, 清空不可用', () => {
    const { container } = render(<GifGenerator />);
    expect(within(container).getByText('点击选择图片, 或把多张图片拖到这里')).toBeInTheDocument();
    expect(btn('选择图片')).toBeInTheDocument();
    expect(btn('清空')).toBeDisabled();
    expect(within(container).getByText('还没有选择图片')).toBeInTheDocument();
    expect(rows(container)).toHaveLength(0);
  });
});

describe('GifGenerator 添加与排序', () => {
  test('选择多张图片后逐张列出并显示概览', async () => {
    const { container } = render(<GifGenerator />);
    await addImages(container, [ 'a.png', 'b.png', 'c.png' ]);

    expect(container.textContent).toContain('共 3 帧');
    expect(container.textContent).toContain('画布 320 × 320 px');
    expect(container.textContent).toContain('无限循环');
    expect(names(container)).toEqual([ 'a.png', 'b.png', 'c.png' ]);
    expect(rows(container)[0].textContent).toContain('#1');
    expect(rows(container)[0].textContent).toContain('4×4');
    expect(container.querySelectorAll('canvas.gg-thumb')).toHaveLength(3);
    expect(btn('清空')).toBeEnabled();
  });

  test('拖入图片同样可载入, 非图片文件给出提示', async () => {
    const { container } = render(<GifGenerator />);
    fireEvent.drop(dropZone(container), { dataTransfer: { files: [ imageFile('note.txt', 'text/plain') ] } });
    await waitFor(() => expect(noticeText()).toContain('读取图片失败: note.txt'));

    fireEvent.drop(dropZone(container), { dataTransfer: { files: [ imageFile('drop.jpg', 'image/jpeg') ] } });
    await waitFor(() => expect(rows(container)).toHaveLength(1));
    expect(names(container)).toEqual([ 'drop.jpg' ]);
  });

  test('上移 / 下移 / 删除 / 反转顺序都会更新帧序', async () => {
    const { container } = render(<GifGenerator />);
    await addImages(container, [ 'a.png', 'b.png', 'c.png' ]);

    fireEvent.click(screen.getByLabelText('下移 #1'));
    expect(names(container)).toEqual([ 'b.png', 'a.png', 'c.png' ]);
    fireEvent.click(screen.getByLabelText('上移 #2'));
    expect(names(container)).toEqual([ 'a.png', 'b.png', 'c.png' ]);
    fireEvent.click(screen.getByLabelText('删除 #1'));
    expect(names(container)).toEqual([ 'b.png', 'c.png' ]);
    fireEvent.click(btn('反转顺序'));
    expect(names(container)).toEqual([ 'c.png', 'b.png' ]);
  });

  test('首帧不能上移, 末帧不能下移', async () => {
    const { container } = render(<GifGenerator />);
    await addImages(container);
    expect(screen.getByLabelText('上移 #1')).toBeDisabled();
    expect(screen.getByLabelText('下移 #2')).toBeDisabled();
  });

  test('清空后回到初始状态', async () => {
    const { container } = render(<GifGenerator />);
    await addImages(container);
    fireEvent.click(btn('清空'));
    await waitFor(() => expect(rows(container)).toHaveLength(0));
    expect(within(container).getByText('还没有选择图片')).toBeInTheDocument();
  });
});

describe('GifGenerator 参数与预览', () => {
  test('逐帧延时与「应用到全部帧」', async () => {
    const { container } = render(<GifGenerator />);
    await addImages(container);
    expect(container.textContent).toContain('总时长 200 ms');

    // 逐帧延时: 第 2 帧改为 400ms -> 总时长 500ms
    const delayInputs = container.querySelectorAll<HTMLInputElement>('.gg-row-frame .ant-input-number-input');
    fireEvent.change(delayInputs[1], { target: { value: '400' } });
    fireEvent.blur(delayInputs[1]);
    await waitFor(() => expect(container.textContent).toContain('总时长 500 ms'));

    // 全局帧延时改为 400ms 后「应用到全部帧」 -> 每帧 400ms, 总时长 800ms
    const globalDelay = container.querySelectorAll<HTMLInputElement>('.ant-input-number-input')[2];
    fireEvent.change(globalDelay, { target: { value: '400' } });
    fireEvent.blur(globalDelay);
    await waitFor(() => expect(container.textContent).toContain('总时长 800 ms'));
    fireEvent.click(btn('应用到全部帧'));
    await waitFor(() => expect(container.textContent).toContain('总时长 800 ms'));
    expect(Array.from(container.querySelectorAll<HTMLInputElement>('.gg-row-frame .ant-input-number-input')).map((i) => i.value))
      .toEqual([ '400', '400' ]);

    // 再改回 100ms 并应用 -> 总时长 200ms
    fireEvent.change(globalDelay, { target: { value: '100' } });
    fireEvent.blur(globalDelay);
    fireEvent.click(btn('应用到全部帧'));
    await waitFor(() => expect(container.textContent).toContain('总时长 200 ms'));
  });

  test('尺寸模式切到「跟随第一张图」后画布尺寸跟首图且不可编辑', async () => {
    const { container } = render(<GifGenerator />);
    await addImages(container);
    const spins = () => Array.from(container.querySelectorAll<HTMLInputElement>('.ant-input-number-input'));
    expect(spins()[0].value).toBe('320');

    // 打开下拉框选择「跟随第一张图」
    fireEvent.mouseDown(container.querySelector('.ant-select-selector') as HTMLElement);
    const option = screen.getAllByText((_, el) => (el?.textContent ?? '') === '跟随第一张图')[0];
    fireEvent.click(option);
    await waitFor(() => expect(spins()[0].value).toBe('4'));
    expect(spins()[0]).toBeDisabled();
  });

  test('背景透明开关切换背景色', async () => {
    const { container } = render(<GifGenerator />);
    await addImages(container);
    expect(container.textContent).toContain('背景透明');
    fireEvent.click(screen.getByRole('checkbox', { name: /透\s*明/ }));
    await waitFor(() => expect(container.textContent).toContain('背景色 #ffffff'));
  });

  test('播放 / 暂停切换', async () => {
    const { container } = render(<GifGenerator />);
    await addImages(container);
    expect(btn('暂停')).toBeInTheDocument();
    fireEvent.click(btn('暂停'));
    expect(btn('播放')).toBeInTheDocument();
    fireEvent.click(btn('播放'));
    expect(btn('暂停')).toBeInTheDocument();
  });

  test('设置页改动默认值时同步到工具页', async () => {
    const { container } = render(<GifGenerator />);
    await addImages(container);
    await act(async () => {
      localStorage.setItem('gif-generator:loop', '7');
      localStorage.setItem('gif-generator:colors', '32');
      window.dispatchEvent(new Event('gif-generator:default-changed'));
    });
    await waitFor(() => expect(container.textContent).toContain('循环 7 次'));
    const spins = Array.from(container.querySelectorAll<HTMLInputElement>('.ant-input-number-input'));
    expect(spins.some((s) => s.value === '32')).toBe(true);
  });
});

describe('GifGenerator 生成与保存', () => {
  test('生成 GIF 后显示结果, 保存时写入 GIF 字节', async () => {
    const { container } = render(<GifGenerator />);
    await addImages(container, [ 'a.png', 'b.png' ]);

    fireEvent.click(btn('生成 GIF'));
    await waitFor(() => expect(container.querySelector('.gg-result')).not.toBeNull(), { timeout: 8000 });
    expect(container.textContent).toContain('已生成 GIF');
    expect(saveMock).not.toHaveBeenCalled();

    fireEvent.click(btn('保存 GIF'));
    await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(1));
    const [ name, bytes, opts ] = saveMock.mock.calls[0] as [ string, Uint8Array, { extensions: string[] } ];
    expect(name).toBe('a.gif');
    expect(String.fromCharCode(bytes[0], bytes[1], bytes[2])).toBe('GIF');
    expect(opts.extensions).toEqual([ 'gif' ]);
    await waitFor(() => expect(noticeText()).toContain('已保存 a.gif'));
  }, 20000);

  test('改动帧序 / 参数后清掉上一次的生成结果', async () => {
    const { container } = render(<GifGenerator />);
    await addImages(container);
    fireEvent.click(btn('生成 GIF'));
    await waitFor(() => expect(container.querySelector('.gg-result')).not.toBeNull(), { timeout: 8000 });

    fireEvent.click(screen.getByLabelText('删除 #1'));
    expect(container.querySelector('.gg-result')).toBeNull();
  }, 20000);
});
