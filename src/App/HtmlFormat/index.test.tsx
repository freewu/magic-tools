import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { saveTextFile } from '../../lib/tauri';
import HtmlFormat from './index';

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
const stage = (c: HTMLElement): HTMLElement => c.querySelector('.html-stage') as HTMLElement;

// antd Tree 开了虚拟滚动, 会额外渲染一行 aria-hidden 的测量节点, 断言时排除
const treeNodes = (c: HTMLElement): HTMLElement[] =>
  Array.from(c.querySelectorAll('.ant-tree-treenode:not([aria-hidden="true"])'));
const switcherOf = (c: HTMLElement): HTMLElement =>
  treeNodes(c)[0].querySelector('.ant-tree-switcher') as HTMLElement;
const treeText = (c: HTMLElement): string[] =>
  treeNodes(c).map((n) => norm(n.querySelector('.ant-tree-title')?.textContent ?? ''));

const WAIT = { timeout: 10000 };

const HTML = '<div><p>你好</p></div>';

/** 打开一个本地文件, 等提示出现再继续 (读取是异步的) */
const openFile = async (c: HTMLElement, name: string, text: string) => {
  fireEvent.change(fileInput(c), { target: { files: [ new File([ text ], name, { type: 'text/html' }) ] } });
  await waitFor(() => expect(notice()).toContain(`已打开 ${name}`), WAIT);
};

describe('HtmlFormat 页面', () => {
  test('渲染参数控件与操作区 (按钮 + 输入/选择)', () => {
    const { container } = render(<HtmlFormat />);
    // 页面有实际内容
    expect(norm(container.textContent ?? '')).not.toBe('');
    // 至少一个操作按钮与一个可输入控件 (textarea/input/select)
    expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('textarea, input, .ant-select').length).toBeGreaterThan(0);
  });

  test('输入内容后点击操作按钮不抛异常', () => {
    const { container } = render(<HtmlFormat />);
    const editable = (container.querySelector('textarea') ?? container.querySelector('input')) as HTMLInputElement | HTMLTextAreaElement | null;
    if (editable) fireEvent.change(editable, { target: { value: 'test' } });
    const btn = buttons(container).length ? Array.from(container.querySelectorAll('button'))[0] as HTMLButtonElement : null;
    if (btn) expect(() => fireEvent.click(btn)).not.toThrow();
  });
});

describe('HtmlFormat 打开本地文件', () => {
  beforeEach(() => {
    message.destroy();
    mockSave.mockClear().mockResolvedValue(true);
  });

  test('选择 .html 文件后读入源码并自动格式化', async () => {
    const { container } = render(<HtmlFormat />);
    // .html / .htm 及其变体与纯文本都可以直接打开
    for (const ext of [ '.html', '.htm', '.xhtml', '.txt' ]) expect(fileInput(container).accept).toContain(ext);

    await openFile(container, 'page.html', HTML);
    expect(rawArea(container).value).toBe(HTML);
    expect(fileInput(container).value).toBe(''); // 同一个文件可以再打开一次
    await waitFor(() => expect(norm(container.textContent ?? '')).toContain('<p>你好</p>'));
  });

  test('把文件拖到页面上即可打开 (拖入时高亮)', async () => {
    const { container } = render(<HtmlFormat />);
    const box = stage(container);

    fireEvent.dragEnter(box);
    expect(box.className).toContain('html-dragging');
    fireEvent.dragLeave(box);
    expect(box.className).not.toContain('html-dragging');

    fireEvent.drop(box, { dataTransfer: { files: [ new File([ '<section><h1>标题</h1></section>' ], 'drag.htm', { type: 'text/html' }) ] } });
    await waitFor(() => expect(notice()).toContain('已打开 drag.htm'), WAIT);
    expect(rawArea(container).value).toBe('<section><h1>标题</h1></section>');
  });

  test('清空会解除与本地文件的关联', async () => {
    const { container } = render(<HtmlFormat />);
    await openFile(container, 'page.html', HTML);
    fireEvent.click(btn('清空'));
    expect(rawArea(container).value).toBe('');
    expect(btn('保存 .html')).toBeDisabled();
  });
});

describe('HtmlFormat 保存格式化结果 (弹保存对话框)', () => {
  beforeEach(() => {
    message.destroy();
    mockSave.mockClear().mockResolvedValue(true);
  });

  test('默认保存为 formatted.html, 带上对话框标题与文件类型', async () => {
    const { container } = render(<HtmlFormat />);
    fireEvent.change(rawArea(container), { target: { value: HTML } });

    fireEvent.click(btn('保存 .html'));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1), WAIT);
    const [ name, content, title, opts ] = mockSave.mock.calls[0];
    expect(name).toBe('formatted.html');
    expect(content).toContain('<p>你好</p>');
    expect(title).toBe('保存 HTML 文件');
    expect(opts).toEqual({ filterName: 'HTML 文件', extensions: [ 'html', 'htm', 'xhtml', 'txt' ] });
    await waitFor(() => expect(notice()).toContain('已保存 formatted.html'));
  });

  test('打开过文件时沿用原文件名与后缀 (.html / .htm)', async () => {
    const { container } = render(<HtmlFormat />);
    await openFile(container, 'page.html', HTML);
    fireEvent.click(btn('保存 .html'));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    expect(mockSave.mock.calls[0][0]).toBe('page.html');

    await openFile(container, 'index.htm', HTML);
    fireEvent.click(btn('保存 .html'));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(2));
    expect(mockSave.mock.calls[1][0]).toBe('index.htm');
  });

  test('.txt 等其它后缀换成 .html; 保存的是格式化后的内容', async () => {
    const { container } = render(<HtmlFormat />);
    await openFile(container, 'data.txt', '<div><span>a</span><span>b</span></div>');
    fireEvent.click(btn('保存 .html'));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    expect(mockSave.mock.calls[0][0]).toBe('data.html');
    expect(mockSave.mock.calls[0][1]).toContain('\n');
  });

  test('用户在保存对话框取消时不提示成功; 保存失败时提示保存失败', async () => {
    mockSave.mockResolvedValue(false);
    const { container } = render(<HtmlFormat />);
    fireEvent.change(rawArea(container), { target: { value: HTML } });
    fireEvent.click(btn('保存 .html'));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(notice()).not.toContain('已保存'));

    mockSave.mockRejectedValue(new Error('disk full'));
    fireEvent.click(btn('保存 .html'));
    await waitFor(() => expect(notice()).toContain('保存失败'));
  });
});

describe('HtmlFormat 结构树 (树状折叠)', () => {
  const A = '<div><p>你好</p><img src="a.png"></div>';

  test('输入 HTML 后自动建树, 行内文本挂到最近元素下', async () => {
    const { container } = render(<HtmlFormat />);
    fireEvent.change(rawArea(container), { target: { value: A } });
    await waitFor(() => expect(container.querySelector('.ant-tree')).not.toBeNull(), WAIT);
    expect(treeText(container)).toEqual([ '<div>', '<p>', '你好', norm('<img src="a.png">') ]);
    expect(norm(container.textContent ?? '')).toContain('4个节点');
  });

  test('「折叠全部」「展开全部」批量折叠; 点击箭头可折叠单个节点', async () => {
    const { container } = render(<HtmlFormat />);
    fireEvent.change(rawArea(container), { target: { value: A } });
    await waitFor(() => expect(treeText(container)).toContain('你好'), WAIT);

    fireEvent.click(btn('折叠全部'));
    expect(treeText(container)).toEqual([ '<div>' ]);

    fireEvent.click(btn('展开全部'));
    expect(treeText(container)).toEqual([ '<div>', '<p>', '你好', norm('<img src="a.png">') ]);

    // 点击箭头折叠单个节点.
    // 注: jsdom 里 rc-tree 的折叠动画不会结束 (listChanging 一直为 true, 后续箭头点击被忽略),
    // 因此折叠后再用「展开全部」按钮恢复
    fireEvent.click(switcherOf(container));
    await waitFor(() => expect(treeText(container)).toEqual([ '<div>' ]), WAIT);
    fireEvent.click(btn('展开全部'));
    await waitFor(() => expect(treeText(container)).toEqual([ '<div>', '<p>', '你好', norm('<img src="a.png">') ]), WAIT);
  });

  test('清空后结构树为空并给出提示', async () => {
    const { container } = render(<HtmlFormat />);
    fireEvent.change(rawArea(container), { target: { value: A } });
    await waitFor(() => expect(treeText(container)).toContain('<div>'), WAIT);

    fireEvent.click(btn('清空'));
    expect(container.querySelector('.ant-tree')).toBeNull();
    expect(norm(container.textContent ?? '')).toContain('0个节点');
    expect(norm(container.textContent ?? '')).toContain('暂无结构');
  });
});
