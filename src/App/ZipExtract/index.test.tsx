import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { buildZip } from '../../lib/zip';
import { saveBytesBatch, saveBytesFile } from '../../lib/tauri';
import ZipExtract from './index';
import { NAME_MODE_KEY } from './lib';

jest.mock('../../lib/tauri', () => ({
  ...jest.requireActual('../../lib/tauri'),
  saveBytesFile: jest.fn().mockResolvedValue(true),
  saveBytesBatch: jest.fn().mockImplementation((files: { name: string }[]) => Promise.resolve(files.length)),
}));

const mockSaveOne = saveBytesFile as jest.Mock;
const mockSaveBatch = saveBytesBatch as jest.Mock;

/** 造一个 zip 字节 (可指定文件名编码: UTF-8 带标志位 / GBK 不带) */
const zipBytes = async (files: Record<string, string>): Promise<Uint8Array> =>
  buildZip(Object.entries(files).map(([ path, text ]) => ({ path, bytes: new TextEncoder().encode(text) })), 6);

/** 造一个 File (内容为 zip 字节) */
const zipFileOf = (bytes: Uint8Array, name = 'demo.zip'): File =>
  new File([ bytes as Uint8Array<ArrayBuffer> ], name, { type: 'application/zip', lastModified: 1767222245000 });

/** 通过隐藏的 file input 载入压缩包 */
const load = (file: File) => {
  const input = document.querySelector('#zipLoadInput') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [ file ] } });
};

/** 列表行 (不含表头) */
const rows = (): HTMLElement[] => Array.from(document.querySelectorAll('.zx-row:not(.zx-head)'));

/** 列表里的文件行 (不含目录行) */
const fileRows = (): HTMLElement[] =>
  Array.from(document.querySelectorAll('.zx-row:not(.zx-head):not(.zx-row-dir)'));

/** 行内文本 */
const rowTexts = (): string[] => fileRows().map((r) => (r.textContent ?? ''));

/** 提示信息文本 */
const noticeText = (): string => document.querySelector('.ant-message')?.textContent ?? '';

/** 按钮 (antd 会在恰好的两汉字间插入空格) */
const btn = (name: string): HTMLElement =>
  screen.getByRole('button', { name: new RegExp(name.length === 2 ? name.split('').join('\\s*') : name) });

describe('Zip 解压 页面交互', () => {
  beforeEach(() => {
    message.destroy();
    mockSaveOne.mockClear();
    mockSaveBatch.mockClear();
    localStorage.clear();
  });

  test('初始状态: 只有拖拽提示与按钮', () => {
    render(<ZipExtract />);
    expect(screen.getByText(/点击选择压缩包, 或把 .zip 文件拖到这里/)).toBeInTheDocument();
    expect(screen.getByText('还没有载入压缩包')).toBeInTheDocument();
    expect(fileRows()).toHaveLength(0);
  });

  test('拖拽载入压缩包后列出条目并默认全选', async () => {
    const bytes = await zipBytes({ 'docs/a.txt': 'hello', 'docs/sub/b.txt': 'world' });
    render(<ZipExtract />);
    fireEvent.drop(screen.getByText(/点击选择压缩包/), { dataTransfer: { files: [ zipFileOf(bytes) ] } });

    await waitFor(() => expect(fileRows()).toHaveLength(2));
    expect(rowTexts().join('\n')).toContain('docs/a.txt');
    expect(rowTexts().join('\n')).toContain('docs/sub/b.txt');
    // 汇总行 + 默认全选
    expect(screen.getByText(/共 2 个文件/).textContent).toContain('共 2 个文件, 2 个目录');
    expect(screen.getByText(/已选 2 个文件/)).toBeInTheDocument();
    // 文件条目可勾选
    const boxes = Array.from(
      document.querySelectorAll('.zx-list .zx-row:not(.zx-row-dir) .ant-checkbox-input'),
    ) as HTMLInputElement[];
    expect(boxes.every((b) => b.checked)).toBe(true);
  });

  test('无效压缩包给出解析失败提示', async () => {
    render(<ZipExtract />);
    load(zipFileOf(new Uint8Array([ 1, 2, 3, 4 ])));
    await waitFor(() => expect(noticeText()).toContain('压缩包解析失败'));
    expect(fileRows()).toHaveLength(0);
  });

  test('全选 / 反选 / 取消选择 与汇总联动', async () => {
    const bytes = await zipBytes({ 'a.txt': 'A', 'b.txt': 'B', 'c.txt': 'C' });
    render(<ZipExtract />);
    load(zipFileOf(bytes));
    await waitFor(() => expect(fileRows()).toHaveLength(3));

    fireEvent.click(btn('取消选择'));
    await waitFor(() => expect(screen.getByText(/已选 0 个文件/)).toBeInTheDocument());
    expect(document.querySelector('.zx-result')).toBeNull();

    fireEvent.click(btn('全选'));
    await waitFor(() => expect(screen.getByText(/已选 3 个文件/)).toBeInTheDocument());

    fireEvent.click(btn('反选'));
    await waitFor(() => expect(screen.getByText(/已选 0 个文件/)).toBeInTheDocument());
  });

  test('未选择任何文件时「解压选中」按钮禁用', async () => {
    const bytes = await zipBytes({ 'a.txt': 'A' });
    render(<ZipExtract />);
    load(zipFileOf(bytes));
    await waitFor(() => expect(fileRows()).toHaveLength(1));

    fireEvent.click(btn('取消选择'));
    await waitFor(() => expect(screen.getByText(/已选 0 个文件/)).toBeInTheDocument());
    expect(btn('解压选中')).toBeDisabled();
    expect(mockSaveBatch).not.toHaveBeenCalled();
  });

  test('解压选中: 按包内层级写入并展示结果', async () => {
    const bytes = await zipBytes({ 'docs/a.txt': 'hello', 'docs/sub/b.txt': 'world' });
    render(<ZipExtract />);
    load(zipFileOf(bytes));
    await waitFor(() => expect(fileRows()).toHaveLength(2));

    fireEvent.click(btn('解压选中'));
    await waitFor(() => expect(mockSaveBatch).toHaveBeenCalledTimes(1));

    const [ files, opts ] = mockSaveBatch.mock.calls[0] as [ { name: string; bytes: Uint8Array }[], { dirName?: string } ];
    expect(files.map((f) => f.name)).toEqual([ 'docs/a.txt', 'docs/sub/b.txt' ]);
    expect(new TextDecoder().decode(files[0].bytes)).toBe('hello');
    // 以压缩包名 (去掉扩展名) 作为顶层目录名
    expect(opts?.dirName).toBe('demo');
    await waitFor(() => expect(document.querySelector('.zx-result')?.textContent).toContain('解压完成: 已写入 2 个文件'));
  });

  test('只解压选中的条目', async () => {
    const bytes = await zipBytes({ 'a.txt': 'A', 'b.txt': 'B' });
    render(<ZipExtract />);
    load(zipFileOf(bytes));
    await waitFor(() => expect(fileRows()).toHaveLength(2));

    // 取消第一个条目
    fireEvent.click(document.querySelectorAll('.zx-list .ant-checkbox-input')[0]);
    await waitFor(() => expect(screen.getByText(/已选 1 个文件/)).toBeInTheDocument());

    fireEvent.click(btn('解压选中'));
    await waitFor(() => expect(mockSaveBatch).toHaveBeenCalledTimes(1));
    const files = mockSaveBatch.mock.calls[0][0] as { name: string }[];
    expect(files.map((f) => f.name)).toEqual([ 'b.txt' ]);
  });

  test('取消选择目标文件夹时不展示结果', async () => {
    mockSaveBatch.mockResolvedValueOnce(0);
    const bytes = await zipBytes({ 'a.txt': 'A' });
    render(<ZipExtract />);
    load(zipFileOf(bytes));
    await waitFor(() => expect(fileRows()).toHaveLength(1));

    fireEvent.click(btn('解压选中'));
    await waitFor(() => expect(mockSaveBatch).toHaveBeenCalled());
    expect(document.querySelector('.zx-result')).toBeNull();
  });

  test('单个条目下载', async () => {
    const bytes = await zipBytes({ 'docs/a.txt': 'hello' });
    render(<ZipExtract />);
    load(zipFileOf(bytes));
    await waitFor(() => expect(fileRows()).toHaveLength(1));

    fireEvent.click(screen.getByRole('button', { name: '下载 docs/a.txt' }));
    await waitFor(() => expect(mockSaveOne).toHaveBeenCalledTimes(1));
    expect(mockSaveOne.mock.calls[0][0]).toBe('a.txt');
    expect(new TextDecoder().decode(mockSaveOne.mock.calls[0][1] as Uint8Array)).toBe('hello');
  });

  test('文本条目可在线预览', async () => {
    const bytes = await zipBytes({ 'note.md': '# 标题' });
    render(<ZipExtract />);
    load(zipFileOf(bytes));
    await waitFor(() => expect(fileRows()).toHaveLength(1));

    fireEvent.click(screen.getByRole('button', { name: '预览 note.md' }));
    await waitFor(() => expect(document.querySelector('.ant-modal')).toBeTruthy());
    expect(document.querySelector('.zx-preview')?.textContent).toContain('# 标题');
  });

  test('图片条目以 data URL 预览', async () => {
    const png = new Uint8Array([ 0x89, 0x50, 0x4e, 0x47 ]);
    const bytes = await buildZip([ { path: 'pics/logo.png', bytes: png } ], 6);
    render(<ZipExtract />);
    load(zipFileOf(bytes));
    await waitFor(() => expect(fileRows()).toHaveLength(1));

    fireEvent.click(screen.getByRole('button', { name: '预览 pics/logo.png' }));
    await waitFor(() => {
      const img = document.querySelector('.ant-modal img') as HTMLImageElement | null;
      expect(img?.getAttribute('src')).toContain('data:image/png;base64,');
    });
  });

  test('二进制条目预览给出提示', async () => {
    const bytes = await buildZip([ { path: 'a.bin', bytes: new Uint8Array([ 0, 1, 2, 3 ]) } ], 6);
    render(<ZipExtract />);
    load(zipFileOf(bytes));
    await waitFor(() => expect(fileRows()).toHaveLength(1));

    fireEvent.click(screen.getByRole('button', { name: '预览 a.bin' }));
    await waitFor(() => expect(noticeText()).toContain('无法预览二进制文件'));
    expect(document.querySelector('.ant-modal')).toBeNull();
  });

  test('目录条目不可勾选也没有下载按钮', async () => {
    const bytes = await buildZip([
      { path: 'docs/', bytes: new Uint8Array(0) },
      { path: 'docs/a.txt', bytes: new TextEncoder().encode('A') },
    ], 6);
    render(<ZipExtract />);
    load(zipFileOf(bytes));
    await waitFor(() => expect(document.querySelectorAll('.zx-row-dir').length).toBe(1));

    const dirRow = document.querySelector('.zx-row-dir') as HTMLElement | null;
    expect(dirRow).toBeTruthy();
    if (dirRow) {
      expect((dirRow.querySelector('.ant-checkbox-input') as HTMLInputElement).disabled).toBe(true);
      expect(dirRow.querySelectorAll('button')).toHaveLength(0);
    }
  });

  test('清空后回到初始状态', async () => {
    const bytes = await zipBytes({ 'a.txt': 'A' });
    render(<ZipExtract />);
    load(zipFileOf(bytes));
    await waitFor(() => expect(fileRows()).toHaveLength(1));

    fireEvent.click(btn('清空'));
    await waitFor(() => expect(fileRows()).toHaveLength(0));
    expect(screen.getByText('还没有载入压缩包')).toBeInTheDocument();
  });

  test('切换文件名编码会持久化为默认值', async () => {
    const bytes = await zipBytes({ 'a.txt': 'A' });
    render(<ZipExtract />);
    load(zipFileOf(bytes));
    await waitFor(() => expect(fileRows()).toHaveLength(1));
    expect(document.querySelector('.ant-select-selection-item')?.textContent).toBe('自动识别 (推荐)');

    const selector = document.querySelector('.ant-select-selector') as HTMLElement;
    fireEvent.mouseDown(selector);
    const option = screen.getAllByText('简体中文 (GBK)').find((el) => el.closest('.ant-select-item'));
    if (!option) throw new Error('未找到下拉项');
    fireEvent.click(option);
    await waitFor(() => expect(localStorage.getItem(NAME_MODE_KEY)).toBe('gbk'));
    // 重新解析后条目仍在
    await waitFor(() => expect(fileRows()).toHaveLength(1));
  });

  test('设置页默认编码变化时页面跟随 (事件同步)', async () => {
    const bytes = await zipBytes({ 'a.txt': 'A' });
    render(<ZipExtract />);
    load(zipFileOf(bytes));
    await waitFor(() => expect(fileRows()).toHaveLength(1));

    localStorage.setItem(NAME_MODE_KEY, 'big5');
    fireEvent(window, new Event('zip-extract:default-changed'));
    await waitFor(() => expect(document.querySelector('.ant-select-selection-item')?.textContent).toBe('繁体中文 (Big5)'));
  });
});
