import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { saveTextFile } from '../../lib/tauri';
import XmlFormatter from './index';

jest.mock('../../lib/tauri', () => ({
  ...jest.requireActual('../../lib/tauri'),
  saveTextFile: jest.fn().mockResolvedValue(true),
}));

const mockSave = saveTextFile as jest.Mock;

afterEach(() => {
  cleanup();
  message.destroy();
});

const norm = (s: string) => s.replace(/\s+/g, '');
const buttons = (c: HTMLElement) => Array.from(c.querySelectorAll('button')).map((b) => norm(b.textContent ?? ''));
/** 按按钮文案定位 */
const btn = (name: string): HTMLButtonElement => {
  const pattern = new RegExp(name.split('').map((c) => (c === ' ' ? '\\s+' : c)).join('\\s*'));
  return screen.getAllByRole('button', { name: pattern })[0] as HTMLButtonElement;
};
const notice = (): string => document.querySelector('.ant-message')?.textContent ?? '';
const rawArea = (c: HTMLElement): HTMLTextAreaElement => c.querySelectorAll('textarea')[0] as HTMLTextAreaElement;
const fileInput = (c: HTMLElement): HTMLInputElement => c.querySelector('input[type="file"]') as HTMLInputElement;
const stage = (c: HTMLElement): HTMLElement => c.querySelector('.xml-stage') as HTMLElement;

const WAIT = { timeout: 10000 };

const XML = '<config><server host="127.0.0.1"/></config>';

/** 打开一个本地文件, 等提示出现再继续 (读取是异步的) */
const openFile = async (c: HTMLElement, name: string, text: string) => {
  fireEvent.change(fileInput(c), { target: { files: [ new File([ text ], name, { type: 'text/xml' }) ] } });
  await waitFor(() => expect(notice()).toContain(`已打开 ${name}`), WAIT);
};

describe('XmlFormatter 页面', () => {
  beforeEach(() => {
    message.destroy();
    mockSave.mockClear().mockResolvedValue(true);
  });

  test('渲染参数控件与操作区 (按钮 + 输入/选择)', () => {
    const { container } = render(<XmlFormatter />);
    // 页面有实际内容
    expect(norm(container.textContent ?? '')).not.toBe('');
    // 至少一个操作按钮与一个可输入控件 (textarea/input/select)
    expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('textarea, input, .ant-select').length).toBeGreaterThan(0);
  });

  test('输入内容后点击操作按钮不抛异常', () => {
    const { container } = render(<XmlFormatter />);
    const editable = (container.querySelector('textarea') ?? container.querySelector('input')) as HTMLInputElement | HTMLTextAreaElement | null;
    if (editable) fireEvent.change(editable, { target: { value: 'test' } });
    const btn = buttons(container).length ? Array.from(container.querySelectorAll('button'))[0] as HTMLButtonElement : null;
    if (btn) expect(() => fireEvent.click(btn)).not.toThrow();
  });
});

describe('XmlFormatter 打开本地文件', () => {
  beforeEach(() => {
    message.destroy();
    mockSave.mockClear().mockResolvedValue(true);
  });

  test('选择 .xml 文件后读入源码并自动格式化', async () => {
    const { container } = render(<XmlFormatter />);
    // XML 及其常见方言 (.svg/.plist 等) 与纯文本都可以直接打开
    for (const ext of [ '.xml', '.xaml', '.svg', '.plist', '.txt' ]) expect(fileInput(container).accept).toContain(ext);

    await openFile(container, 'config.xml', XML);
    expect(rawArea(container).value).toBe(XML);
    expect(fileInput(container).value).toBe(''); // 同一个文件可以再打开一次
    // 结果区已自动格式化
    await waitFor(() => expect(norm(container.textContent ?? '')).toContain('host="127.0.0.1"'));
  });

  test('打开的文件名可以带路径, 只取文件名部分', async () => {
    const { container } = render(<XmlFormatter />);
    await openFile(container, 'C:\\docs/配置.xml', XML);
    fireEvent.click(btn('下载 .xml'));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    expect(mockSave.mock.calls[0][0]).toBe('配置.xml');
  });

  test('把文件拖到页面上即可打开 (拖入时高亮)', async () => {
    const { container } = render(<XmlFormatter />);
    const box = stage(container);

    fireEvent.dragEnter(box);
    expect(box.className).toContain('xml-dragging');
    fireEvent.dragLeave(box);
    expect(box.className).not.toContain('xml-dragging');

    fireEvent.drop(box, { dataTransfer: { files: [ new File([ '<a><b/></a>' ], 'drag.xml', { type: 'text/xml' }) ] } });
    await waitFor(() => expect(notice()).toContain('已打开 drag.xml'), WAIT);
    expect(rawArea(container).value).toBe('<a><b/></a>');
  });

  test('载入示例 / 清空会解除与本地文件的关联', async () => {
    const { container } = render(<XmlFormatter />);
    await openFile(container, 'config.xml', XML);
    fireEvent.click(btn('清空'));
    expect(rawArea(container).value).toBe('');
    expect(btn('下载 .xml')).toBeDisabled();
  });
});

describe('XmlFormatter 下载 (弹保存对话框)', () => {
  beforeEach(() => {
    message.destroy();
    mockSave.mockClear().mockResolvedValue(true);
  });

  test('默认保存为 formatted.xml, 带上对话框标题与文件类型', async () => {
    const { container } = render(<XmlFormatter />);
    fireEvent.change(rawArea(container), { target: { value: XML } });

    fireEvent.click(btn('下载 .xml'));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1), WAIT);
    const [ name, content, title, opts ] = mockSave.mock.calls[0];
    expect(name).toBe('formatted.xml');
    expect(content).toContain('<server host="127.0.0.1"/>');
    expect(title).toBe('保存 XML 文件');
    expect(opts).toEqual({ filterName: 'XML 文件', extensions: [ 'xml', 'xaml', 'svg', 'plist', 'txt' ] });
    await waitFor(() => expect(notice()).toContain('已保存 formatted.xml'));
  });

  test('打开过文件时沿用原文件名与后缀 (.xml / .svg)', async () => {
    const { container } = render(<XmlFormatter />);
    await openFile(container, 'config.xml', XML);
    fireEvent.click(btn('下载 .xml'));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    expect(mockSave.mock.calls[0][0]).toBe('config.xml');

    fireEvent.change(fileInput(container), { target: { files: [ new File([ '<svg><rect/></svg>' ], 'logo.svg', { type: 'image/svg+xml' }) ] } });
    await waitFor(() => expect(notice()).toContain('已打开 logo.svg'), WAIT);
    fireEvent.click(btn('下载 .xml'));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(2));
    expect(mockSave.mock.calls[1][0]).toBe('logo.svg'); // SVG 是 XML, 保留原后缀
  });

  test('.txt 等其它后缀换成 .xml', async () => {
    const { container } = render(<XmlFormatter />);
    await openFile(container, 'data.txt', XML);
    fireEvent.click(btn('下载 .xml'));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    expect(mockSave.mock.calls[0][0]).toBe('data.xml');
  });

  test('用户在保存对话框取消时不提示成功', async () => {
    mockSave.mockResolvedValue(false);
    const { container } = render(<XmlFormatter />);
    fireEvent.change(rawArea(container), { target: { value: XML } });
    fireEvent.click(btn('下载 .xml'));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(notice()).not.toContain('已保存'));
  });

  test('保存失败时提示保存失败', async () => {
    mockSave.mockRejectedValue(new Error('disk full'));
    const { container } = render(<XmlFormatter />);
    fireEvent.change(rawArea(container), { target: { value: XML } });
    fireEvent.click(btn('下载 .xml'));
    await waitFor(() => expect(notice()).toContain('保存失败'));
  });
});
