import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { message } from 'antd';
import GifSplit from './index';
import { encodeGif } from '../../lib/gif';
import { saveBytesBatch, saveBytesFile } from '../../lib/tauri';

jest.mock('../../lib/tauri', () => ({
  saveBytesBatch: jest.fn(async () => 2),
  saveBytesFile: jest.fn(async () => true),
}));

const batchMock = saveBytesBatch as jest.Mock;
const singleMock = saveBytesFile as jest.Mock;

/** 造一张三帧 GIF (2×2, 红 / 绿 / 蓝), 延时 5s 以免测试期间自动播放 */
const gifBytes = async (): Promise<Uint8Array> => {
  const solid = (rgb: [number, number, number]) => {
    const data = new Uint8ClampedArray(16);
    for (let i = 0; i < 4; i += 1) {
      data[i * 4] = rgb[0];
      data[i * 4 + 1] = rgb[1];
      data[i * 4 + 2] = rgb[2];
      data[i * 4 + 3] = 255;
    }
    return data;
  };
  return await encodeGif([
    { data: solid([ 255, 0, 0 ]), delay: 5000 },
    { data: solid([ 0, 255, 0 ]), delay: 5000 },
    { data: solid([ 0, 0, 255 ]), delay: 5000 },
  ], { width: 2, height: 2, maxColors: 8 });
};

const gifFile = async (name = 'demo.gif'): Promise<File> =>
  new File([ await gifBytes() as unknown as BlobPart ], name, { type: 'image/gif' });

const input = (container: HTMLElement): HTMLInputElement =>
  container.querySelector('#gifSplitInput') as HTMLInputElement;
const dropZone = (container: HTMLElement): HTMLElement =>
  container.querySelector('.gs-drop') as HTMLElement;
const rows = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>('.gs-row-frame'));
/** antd 会在两个汉字间插空格, 图标按钮的 aria-label 也会并入可访问名称, 因此做宽容匹配 */
const btnRegex = (name: string): RegExp =>
  new RegExp(name.split('').map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*'));
const btn = (name: string): HTMLElement => screen.getByRole('button', { name: btnRegex(name) });
const noticeText = (): string => document.body.textContent ?? '';

/** 载入 GIF 并等待帧列表渲染 */
const loadGif = async (container: HTMLElement, name = 'demo.gif') => {
  fireEvent.change(input(container), { target: { files: [ await gifFile(name) ] } });
  await waitFor(() => expect(rows(container)).toHaveLength(3));
};

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    putImageData: () => undefined,
  })) as unknown as HTMLCanvasElement['getContext'];
  HTMLCanvasElement.prototype.toDataURL = (() => 'data:image/png;base64,QUJD') as never;
});

beforeEach(() => {
  localStorage.clear();
  message.destroy();
  batchMock.mockClear();
  singleMock.mockClear();
  batchMock.mockResolvedValue(2);
  singleMock.mockResolvedValue(true);
});

describe('GifSplit 初始界面', () => {
  test('未载入 GIF 时只显示拖拽区, 清空不可用', () => {
    const { container } = render(<GifSplit />);
    expect(within(container).getByText('点击选择 GIF 图片, 或把 .gif 文件拖到这里')).toBeInTheDocument();
    expect(btn('选择 GIF')).toBeInTheDocument();
    expect(btn('清空')).toBeDisabled();
    expect(within(container).getByText('还没有载入 GIF')).toBeInTheDocument();
    expect(rows(container)).toHaveLength(0);
  });
});

describe('GifSplit 载入与概览', () => {
  test('载入 GIF 后显示尺寸 / 帧数 / 循环信息与全部帧行', async () => {
    const { container } = render(<GifSplit />);
    await loadGif(container);

    expect(container.textContent).toContain('2 × 2 px, 共 3 帧');
    expect(container.textContent).toContain('无限循环');
    expect(container.textContent).toContain('文件');
    expect(container.textContent).toContain('已选 3 帧');
    expect(rows(container)).toHaveLength(3);
    // 每行给出帧号 / 延时 / 区域
    expect(rows(container)[0].textContent).toContain('#1');
    expect(rows(container)[0].textContent).toContain('5000 ms');
    expect(rows(container)[0].textContent).toContain('2×2 @ 0,0');
    // 默认全选
    const boxes = container.querySelectorAll<HTMLInputElement>('.gs-row-frame .ant-checkbox-input');
    expect([ ...boxes ].every((b) => b.checked)).toBe(true);
    expect(btn('清空')).toBeEnabled();
  });

  test('拖入 GIF 也能载入, 非 gif 文件给出提示', async () => {
    const { container } = render(<GifSplit />);
    fireEvent.drop(dropZone(container), { dataTransfer: { files: [ new File([ 'x' ], 'note.txt', { type: 'text/plain' }) ] } });
    await waitFor(() => expect(noticeText()).toContain('请选择 .gif 文件'));

    fireEvent.drop(dropZone(container), { dataTransfer: { files: [ await gifFile('drop.gif') ] } });
    await waitFor(() => expect(rows(container)).toHaveLength(3));
    expect(container.textContent).toContain('drop.gif');
  });

  test('坏数据给出解析失败提示', async () => {
    const { container } = render(<GifSplit />);
    fireEvent.change(input(container), { target: { files: [ new File([ 'not a gif' ], 'bad.gif', { type: 'image/gif' }) ] } });
    await waitFor(() => expect(noticeText()).toContain('不是有效的 GIF 图片'));
    expect(rows(container)).toHaveLength(0);
  });

  test('清空后回到初始状态', async () => {
    const { container } = render(<GifSplit />);
    await loadGif(container);
    fireEvent.click(btn('清空'));
    await waitFor(() => expect(rows(container)).toHaveLength(0));
    expect(within(container).getByText('还没有载入 GIF')).toBeInTheDocument();
    expect(btn('清空')).toBeDisabled();
  });
});

describe('GifSplit 选择与导出', () => {
  test('取消选择后导出按钮不可用, 全选 / 反选可恢复', async () => {
    const { container } = render(<GifSplit />);
    await loadGif(container);

    fireEvent.click(btn('取消选择'));
    expect(container.textContent).toContain('已选 0 帧');
    expect(btn('导出选中帧 (PNG)')).toBeDisabled();
    expect(btn('导出精灵图')).toBeDisabled();

    fireEvent.click(btn('反选'));
    expect(container.textContent).toContain('已选 3 帧');

    fireEvent.click(rows(container)[1].querySelector('.ant-checkbox-input') as HTMLElement);
    expect(container.textContent).toContain('已选 2 帧');

    fireEvent.click(btn('全选'));
    expect(container.textContent).toContain('已选 3 帧');
  });

  test('导出选中帧: 逐个 PNG 写入所选目录并给出成功提示', async () => {
    const { container } = render(<GifSplit />);
    await loadGif(container);
    fireEvent.click(rows(container)[2].querySelector('.ant-checkbox-input') as HTMLElement); // 去掉第 3 帧

    fireEvent.click(btn('导出选中帧 (PNG)'));

    await waitFor(() => expect(batchMock).toHaveBeenCalledTimes(1));
    const [ files, opts ] = batchMock.mock.calls[0] as [ { name: string; bytes: Uint8Array }[], { dirName: string } ];
    expect(files.map((f) => f.name)).toEqual([ 'demo_1.png', 'demo_2.png' ]);
    expect(Array.from(files[0].bytes)).toEqual([ 65, 66, 67 ]);
    expect(opts.dirName).toBe('demo');
    await waitFor(() => expect(noticeText()).toContain('已导出 2 个文件'));
    expect(container.querySelector('.gs-result')).not.toBeNull();
  });

  test('取消选择文件夹时不显示结果', async () => {
    batchMock.mockResolvedValue(0);
    const { container } = render(<GifSplit />);
    await loadGif(container);
    fireEvent.click(btn('导出选中帧 (PNG)'));
    await waitFor(() => expect(batchMock).toHaveBeenCalled());
    expect(container.querySelector('.gs-result')).toBeNull();
    expect(noticeText()).not.toContain('已导出');
  });

  test('导出精灵图: 单文件写入并提示已保存', async () => {
    const { container } = render(<GifSplit />);
    await loadGif(container);
    fireEvent.click(btn('导出精灵图'));

    await waitFor(() => expect(singleMock).toHaveBeenCalledTimes(1));
    const [ name, bytes, opts ] = singleMock.mock.calls[0] as [ string, Uint8Array, { extensions: string[] } ];
    expect(name).toBe('demo_sprite.png');
    expect(Array.from(bytes)).toEqual([ 65, 66, 67 ]);
    expect(opts.extensions).toEqual([ 'png' ]);
    await waitFor(() => expect(noticeText()).toContain('精灵图已保存'));
  });

  test('导出单帧: 文件名按帧号补零', async () => {
    const { container } = render(<GifSplit />);
    await loadGif(container);
    fireEvent.click(screen.getAllByRole('button', { name: /导出此帧\s*#2/ })[0]);

    await waitFor(() => expect(singleMock).toHaveBeenCalledTimes(1));
    expect(singleMock.mock.calls[0][0]).toBe('demo_2.png');
  });

  test('导出失败给出提示', async () => {
    batchMock.mockRejectedValue(new Error('disk-full'));
    const { container } = render(<GifSplit />);
    await loadGif(container);
    fireEvent.click(btn('导出选中帧 (PNG)'));
    await waitFor(() => expect(noticeText()).toContain('导出失败: disk-full'));
  });
});

describe('GifSplit 回放与设置', () => {
  test('步进按钮与播放开关更新当前帧', async () => {
    const { container } = render(<GifSplit />);
    await loadGif(container);

    // 载入后自动播放 (多帧), 点「暂停」切回「播放」
    expect(btn('暂停')).toBeInTheDocument();
    fireEvent.click(btn('暂停'));
    expect(btn('播放')).toBeInTheDocument();

    expect(container.textContent).toContain('第 1 / 3 帧');
    fireEvent.click(screen.getByRole('button', { name: '下一帧' }));
    expect(container.textContent).toContain('第 2 / 3 帧');
    fireEvent.click(screen.getByRole('button', { name: '下一帧' }));
    fireEvent.click(screen.getByRole('button', { name: '下一帧' }));
    expect(container.textContent).toContain('第 1 / 3 帧'); // 循环
    fireEvent.click(screen.getByRole('button', { name: '上一帧' }));
    expect(container.textContent).toContain('第 3 / 3 帧');

    // 暂停状态下步进不会再自动播放
    expect(btn('播放')).toBeInTheDocument();
  });

  test('自动播放按帧延时推进', async () => {
    jest.useFakeTimers();
    try {
      const { container } = render(<GifSplit />);
      // 用长延时 GIF 之外再点一次「播放」确保处于播放态
      fireEvent.change(input(container), { target: { files: [ await gifFile() ] } });
      await waitFor(() => expect(rows(container)).toHaveLength(3));
      const before = container.textContent;
      jest.advanceTimersByTime(5000);
      await waitFor(() => expect(container.textContent).not.toBe(before));
      expect(container.textContent).toContain('第 2 / 3 帧');
    } finally {
      jest.useRealTimers();
    }
  });

  test('精灵图列数 / 间隔写入 localStorage 并在设置变化时同步', async () => {
    const { container } = render(<GifSplit />);
    await loadGif(container);

    const numbers = container.querySelectorAll<HTMLInputElement>('.ant-input-number-input');
    fireEvent.change(numbers[0], { target: { value: '3' } });
    fireEvent.blur(numbers[0]);
    fireEvent.change(numbers[1], { target: { value: '4' } });
    fireEvent.blur(numbers[1]);
    await waitFor(() => expect(localStorage.getItem('gif-split:sprite-cols')).toBe('3'));
    expect(localStorage.getItem('gif-split:sprite-gap')).toBe('4');

    // 设置页改默认值 -> 工具页跟随
    localStorage.setItem('gif-split:sprite-cols', '9');
    window.dispatchEvent(new Event('gif-split:default-changed'));
    await waitFor(() => expect(numbers[0].value).toBe('9'));
  });
});
