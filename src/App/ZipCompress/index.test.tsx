import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { loadZip, listEntries, readEntryText } from '../../lib/zip';
import { saveBytesFile } from '../../lib/tauri';
import ZipCompress from './index';
import { LEVEL_KEY, KEEP_PATH_KEY } from './lib';

jest.mock('../../lib/tauri', () => ({
  ...jest.requireActual('../../lib/tauri'),
  saveBytesFile: jest.fn().mockResolvedValue(true),
}));

const mockSave = saveBytesFile as jest.Mock;

/** 造一个 File (可指定相对路径, 模拟拖入文件夹) */
const fileOf = (name: string, text: string, relative = ''): File => {
  const file = new File([ text ], name, { type: 'text/plain', lastModified: 1767222245000 });
  Object.defineProperty(file, 'webkitRelativePath', { value: relative, configurable: true });
  return file;
};

/** 通过隐藏的 file input 选择文件 */
const pick = (files: File[], id = 'zipFileInput') => {
  const input = document.querySelector(`#${id}`) as HTMLInputElement;
  fireEvent.change(input, { target: { files } });
};

/** 列表行 (不含表头) */
const rows = (): HTMLElement[] => Array.from(document.querySelectorAll('.zc-row'));

/** 行内文本 */
const rowTexts = (): string[] => rows().map((r) => r.textContent ?? '');

/** 提示信息文本 */
const noticeText = (): string => document.querySelector('.ant-message')?.textContent ?? '';

/** 按钮 (antd 会在恰好的两汉字间插入空格) */
const btn = (name: string): HTMLElement =>
  screen.getByRole('button', { name: new RegExp(name.length === 2 ? name.split('').join('\\s*') : name) });

/** 切换 antd Select 的选项 */
const chooseOption = (label: string) => {
  const selector = document.querySelector('.ant-select-selector') as HTMLElement;
  fireEvent.mouseDown(selector);
  const option = screen.getAllByText(label).find((el) => el.closest('.ant-select-item'));
  if (!option) throw new Error(`未找到下拉项: ${label}`);
  fireEvent.click(option);
};

/** 读取保存下来的 zip 内容: 路径 -> 文本 */
const savedZipEntries = async (call = 0): Promise<Record<string, string>> => {
  const bytes = mockSave.mock.calls[call][1] as Uint8Array;
  const zip = await loadZip(bytes, { nameMode: 'auto' });
  const out: Record<string, string> = {};
  for (const entry of listEntries(zip).filter((e) => !e.dir)) {
    out[entry.path] = await readEntryText(zip, entry);
  }
  return out;
};

describe('Zip 压缩 页面交互', () => {
  beforeEach(() => {
    message.destroy();
    mockSave.mockClear();
    localStorage.clear();
  });

  test('初始状态: 只有拖拽提示与按钮, 打包按钮禁用', () => {
    render(<ZipCompress />);
    expect(screen.getByText(/点击选择文件, 或把文件 \/ 文件夹拖到这里/)).toBeInTheDocument();
    expect(screen.getByText('还没有添加文件')).toBeInTheDocument();
    expect(rows()).toHaveLength(0);
    expect(btn('打包并下载')).toBeDisabled();
  });

  test('选择文件后展示列表 / 汇总 / 自动推导包名', async () => {
    render(<ZipCompress />);
    pick([ fileOf('a.txt', 'hello', 'docs/a.txt'), fileOf('b.txt', 'hi', 'docs/b.txt') ]);

    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(rowTexts()[0]).toContain('docs/a.txt');
    expect(screen.getByText(/待打包文件/).textContent).toContain('共 2 个文件');
    // 公共顶层目录名作为默认包名
    expect((document.querySelector('.zc-list') && screen.getByPlaceholderText('archive.zip')) as HTMLInputElement)
      .toHaveValue('docs.zip');
    await waitFor(() => expect(noticeText()).toContain('已添加 2 个文件'));
    expect(btn('打包并下载')).toBeEnabled();
  });

  test('拖拽文件同样可以添加', async () => {
    render(<ZipCompress />);
    fireEvent.drop(screen.getByText(/点击选择文件/), {
      dataTransfer: { items: [], files: [ fileOf('note.txt', 'x') ] },
    });
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(rowTexts()[0]).toContain('note.txt');
  });

  test('同一路径重复添加只保留一行', async () => {
    render(<ZipCompress />);
    pick([ fileOf('a.txt', 'hello') ]);
    await waitFor(() => expect(rows()).toHaveLength(1));
    pick([ fileOf('a.txt', 'hello2') ]);
    await waitFor(() => expect(rows()).toHaveLength(1));
  });

  test('删除单行与清空', async () => {
    render(<ZipCompress />);
    pick([ fileOf('a.txt', 'a'), fileOf('b.txt', 'b') ]);
    await waitFor(() => expect(rows()).toHaveLength(2));

    fireEvent.click(screen.getAllByRole('button', { name: '删除' })[0]);
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(rowTexts()[0]).toContain('b.txt');

    fireEvent.click(btn('清空'));
    await waitFor(() => expect(rows()).toHaveLength(0));
    expect(screen.getByText('还没有添加文件')).toBeInTheDocument();
    expect(btn('打包并下载')).toBeDisabled();
  });

  test('压缩级别默认 6, 修改后持久化为默认值', async () => {
    render(<ZipCompress />);
    expect(document.querySelector('.ant-select-selection-item')?.textContent).toBe('6 · 默认');

    chooseOption('0 · 仅存储 (不压缩)');
    await waitFor(() => expect(localStorage.getItem(LEVEL_KEY)).toBe('0'));
    expect(document.querySelector('.ant-select-selection-item')?.textContent).toBe('0 · 仅存储 (不压缩)');
  });

  test('取消「保留文件夹结构」后包内只留文件名', async () => {
    render(<ZipCompress />);
    pick([ fileOf('a.txt', 'A', 'docs/a.txt'), fileOf('b.txt', 'B', 'sub/b.txt') ]);
    await waitFor(() => expect(rows()).toHaveLength(2));

    const checkbox = document.querySelector('.ant-checkbox-input') as HTMLInputElement;
    fireEvent.click(checkbox);
    await waitFor(() => expect(localStorage.getItem(KEEP_PATH_KEY)).toBe('0'));

    fireEvent.click(btn('打包并下载'));
    await waitFor(() => expect(mockSave).toHaveBeenCalled());
    expect(await savedZipEntries()).toEqual({ 'a.txt': 'A', 'b.txt': 'B' });
  });

  test('打包保留目录层级, 并展示体积统计', async () => {
    render(<ZipCompress />);
    pick([ fileOf('a.txt', 'hello', 'docs/a.txt'), fileOf('b.txt', 'world', 'docs/sub/b.txt') ]);
    await waitFor(() => expect(rows()).toHaveLength(2));

    fireEvent.click(btn('打包并下载'));
    await waitFor(() => expect(mockSave).toHaveBeenCalled());

    // 输出文件名与内容
    expect(mockSave.mock.calls[0][0]).toBe('docs.zip');
    expect(await savedZipEntries()).toEqual({ 'docs/a.txt': 'hello', 'docs/sub/b.txt': 'world' });
    await waitFor(() => expect(document.querySelector('.zc-result')?.textContent).toContain('压缩包已生成'));
    expect(document.querySelector('.zc-result')?.textContent).toContain('docs.zip');
  });

  test('同名文件打包时自动加序号, 不互相覆盖', async () => {
    render(<ZipCompress />);
    pick([ fileOf('a.txt', '第一个', 'x/a.txt'), fileOf('a.txt', '第二个', 'y/a.txt') ]);
    await waitFor(() => expect(rows()).toHaveLength(2));

    // 取消保留文件夹结构 → 两个 a.txt 落到同一层
    fireEvent.click(document.querySelector('.ant-checkbox-input') as HTMLInputElement);
    fireEvent.click(btn('打包并下载'));
    await waitFor(() => expect(mockSave).toHaveBeenCalled());

    expect(await savedZipEntries()).toEqual({ 'a.txt': '第一个', 'a (2).txt': '第二个' });
  });

  test('用户改过的输出文件名不会被自动推导覆盖', async () => {
    render(<ZipCompress />);
    pick([ fileOf('a.txt', 'A', 'docs/a.txt') ]);
    await waitFor(() => expect(rows()).toHaveLength(1));

    const input = screen.getByPlaceholderText('archive.zip');
    fireEvent.change(input, { target: { value: 'my-pack' } });
    // 再添加文件也不覆盖手填的名字
    pick([ fileOf('b.txt', 'B', 'docs/b.txt') ]);
    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(input).toHaveValue('my-pack');

    fireEvent.click(btn('打包并下载'));
    await waitFor(() => expect(mockSave).toHaveBeenCalled());
    expect(mockSave.mock.calls[0][0]).toBe('my-pack.zip');
  });

  test('保存被取消时不展示结果', async () => {
    mockSave.mockResolvedValueOnce(false);
    render(<ZipCompress />);
    pick([ fileOf('a.txt', 'A') ]);
    await waitFor(() => expect(rows()).toHaveLength(1));

    fireEvent.click(btn('打包并下载'));
    await waitFor(() => expect(mockSave).toHaveBeenCalled());
    expect(document.querySelector('.zc-result')).toBeNull();
  });

  test('打包异常时提示失败', async () => {
    mockSave.mockRejectedValueOnce(new Error('boom'));
    render(<ZipCompress />);
    pick([ fileOf('a.txt', 'A') ]);
    await waitFor(() => expect(rows()).toHaveLength(1));

    fireEvent.click(btn('打包并下载'));
    await waitFor(() => expect(noticeText()).toContain('打包失败: boom'));
  });

  test('读取文件失败时提示失败', async () => {
    const bad = fileOf('bad.txt', 'x');
    Object.defineProperty(bad, 'arrayBuffer', { value: () => Promise.reject(new Error('read-boom')) });
    render(<ZipCompress />);
    pick([ bad ]);
    await waitFor(() => expect(noticeText()).toContain('读取文件失败: read-boom'));
    expect(rows()).toHaveLength(0);
  });

  test('设置页默认值变化时页面跟随 (事件同步)', async () => {
    render(<ZipCompress />);
    localStorage.setItem(LEVEL_KEY, '1');
    localStorage.setItem(KEEP_PATH_KEY, '0');
    fireEvent(window, new Event('zip-compress:default-changed'));
    await waitFor(() => expect(document.querySelector('.ant-select-selection-item')?.textContent).toBe('1 · 最快'));
    expect((document.querySelector('.ant-checkbox-input') as HTMLInputElement).checked).toBe(false);
  });
});
