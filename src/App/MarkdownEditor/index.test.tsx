// Markdown 编辑器: 预览区深浅色样式 (深色模式必须注入覆盖样式, 否则预览文字黑底黑字)
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { ThemeProvider } from '../../hook/theme-context';
import MarkdownEditor from './index';
import { MD_DARK_CSS } from './lib';

// 保存 / 导出走 Tauri 桥接 (桌面端弹系统对话框); 测试里只校验调用参数
// (主题 Provider 还需要该模块的 emit/listen, 故用 requireActual 展开, 只替换 saveTextFile)
jest.mock('../../lib/tauri', () => ({
  ...jest.requireActual('../../lib/tauri'),
  saveTextFile: jest.fn(async () => true),
}));

import { saveTextFile } from '../../lib/tauri';

const saveMock = saveTextFile as jest.Mock;

const styleTexts = (container: HTMLElement): string[] =>
  Array.from(container.querySelectorAll('style')).map((s) => s.textContent ?? '');

describe('Markdown 编辑器预览主题', () => {
  beforeEach(() => localStorage.clear());

  it('浅色模式: 只用导出用的浅色样式', () => {
    localStorage.setItem('theme-mode', 'light');
    const { container } = render(<ThemeProvider><MarkdownEditor /></ThemeProvider>);
    const styles = styleTexts(container);
    expect(styles.some((s) => s.includes(MD_DARK_CSS))).toBe(false);
    const box = container.querySelector('.md-preview') as HTMLElement;
    expect(getComputedStyle(box).color).toBe('rgb(36, 41, 47)');
  });

  it('深色模式: 追加深色覆盖样式, 正文与标题不再是深色', () => {
    localStorage.setItem('theme-mode', 'dark');
    const { container } = render(<ThemeProvider><MarkdownEditor /></ThemeProvider>);
    expect(styleTexts(container).some((s) => s.includes(MD_DARK_CSS))).toBe(true);
    const box = container.querySelector('.md-preview') as HTMLElement;
    const h1 = container.querySelector('.md-preview h1') as HTMLElement;
    // 深色底上的浅色文字 (回归: 曾固定 color:#24292f 导致 h1~h6 看不清)
    expect(getComputedStyle(box).color).toBe('rgb(230, 237, 243)');
    expect(getComputedStyle(h1).color).toBe('rgb(240, 246, 252)');
  });
});

describe('Markdown 编辑器 全屏', () => {
  const root = (): HTMLElement => document.querySelector('.md-editor') as HTMLElement;
  const btn = (label: string): HTMLButtonElement => {
    const hit = screen.getAllByRole('button').find((b) => (b.textContent ?? '').replace(/\s+/g, '') === label);
    if (!hit) throw new Error(`未找到「${label}」按钮`);
    return hit as HTMLButtonElement;
  };

  it('无原生全屏时用窗口内全屏兜底, 编辑区拉满高度, Esc 退出', () => {
    const { container } = render(<ThemeProvider><MarkdownEditor /></ThemeProvider>);
    const ta = container.querySelector('textarea') as HTMLTextAreaElement;
    const main = container.querySelector('.md-editor-main') as HTMLElement;

    expect(root().className).not.toContain('md-editor-full');
    expect(ta.style.minHeight).toBe('460px');
    expect(main.style.flexWrap).toBe('wrap');

    fireEvent.click(btn('全屏'));
    expect(root().className).toContain('md-editor-full');
    // 全屏时编辑区高度由容器接管 (不再固定 460px), 两栏不换行
    expect(ta.style.minHeight).toBe('0');
    expect(ta.style.height).toBe('100%');
    expect(main.style.flexWrap).toBe('nowrap');
    expect(btn('退出全屏')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(root().className).not.toContain('md-editor-full');
    expect(ta.style.height).toBe('');
    expect(btn('全屏')).toBeInTheDocument();
  });

  it('支持原生全屏时调用 Fullscreen API, 退出时同步', () => {
    const request = jest.fn().mockResolvedValue(undefined);
    const exit = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { configurable: true, value: request });
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => document.querySelector('.md-editor'),
    });
    Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exit });

    try {
      render(<ThemeProvider><MarkdownEditor /></ThemeProvider>);

      fireEvent.click(btn('全屏'));
      expect(request).toHaveBeenCalledTimes(1);
      expect(root().className).toContain('md-editor-full');

      fireEvent.click(btn('退出全屏'));
      expect(exit).toHaveBeenCalledTimes(1);
      expect(root().className).not.toContain('md-editor-full');
    } finally {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>).requestFullscreen;
      delete (document as unknown as Record<string, unknown>).fullscreenElement;
      delete (document as unknown as Record<string, unknown>).exitFullscreen;
    }
  });

  it('浏览器退出原生全屏时同步按钮状态', () => {
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => null });
    try {
      render(<ThemeProvider><MarkdownEditor /></ThemeProvider>);
      fireEvent.click(btn('全屏'));
      expect(root().className).toContain('md-editor-full');

      // 用户按 Esc / F11 退出原生全屏: 只发事件, 状态应回到「全屏」
      fireEvent(document, new Event('fullscreenchange'));
      expect(root().className).not.toContain('md-editor-full');
      expect(btn('全屏')).toBeInTheDocument();
    } finally {
      delete (document as unknown as Record<string, unknown>).fullscreenElement;
    }
  });
});

describe('Markdown 编辑器 打开 / 保存 .md (弹系统保存对话框)', () => {
  const view = (container: HTMLElement) => container.querySelector('.md-editor') as HTMLElement;
  const editor = (container: HTMLElement) => container.querySelector('textarea') as HTMLTextAreaElement;
  const fileInput = (container: HTMLElement) => container.querySelector('input[type="file"]') as HTMLInputElement;
  const btn = (label: string): HTMLButtonElement => {
    const hit = screen.getAllByRole('button').find((b) => (b.textContent ?? '').replace(/\s+/g, '') === label);
    if (!hit) throw new Error(`未找到「${label}」按钮`);
    return hit as HTMLButtonElement;
  };
  const openFile = async (container: HTMLElement, file: File) => {
    fireEvent.change(fileInput(container), { target: { files: [ file ] } });
    await waitFor(() => expect(editor(container).value).toBe('# 打开的文件\n'));
  };
  // message 静态调用会打 antd context 警告, 换成 spy 兼做提示文案断言
  let successMock: jest.SpyInstance;
  let errorMock: jest.SpyInstance;

  beforeEach(() => {
    saveMock.mockClear();
    saveMock.mockResolvedValue(true);
    successMock = jest.spyOn(message, 'success').mockImplementation(() => undefined as never);
    errorMock = jest.spyOn(message, 'error').mockImplementation(() => undefined as never);
  });
  afterEach(() => {
    successMock.mockRestore();
    errorMock.mockRestore();
  });

  it('打开本地 .md 文件: 内容进编辑区, 文件名作为后续保存的默认名', async () => {
    const { container } = render(<ThemeProvider><MarkdownEditor /></ThemeProvider>);
    expect((fileInput(container) as HTMLInputElement).accept).toContain('.md');

    await openFile(container, new File([ '# 打开的文件\n' ], 'my-note.md', { type: 'text/markdown' }));
    // 选择框已清空, 可重复打开同一文件
    expect(fileInput(container).value).toBe('');

    fireEvent.click(btn('保存'));
    await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(1));
    expect(saveMock.mock.calls[0][0]).toBe('my-note.md');
    expect(saveMock.mock.calls[0][1]).toBe('# 打开的文件\n');
    expect(successMock).toHaveBeenCalledWith(expect.stringContaining('my-note.md'));
  });

  it('保存 .md: 走 saveTextFile (桌面端弹保存对话框), 带 .md 过滤器; 取消不提示成功', async () => {
    render(<ThemeProvider><MarkdownEditor /></ThemeProvider>);

    fireEvent.click(btn('保存'));
    await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(1));
    const [ name, content, title, opts ] = saveMock.mock.calls[0];
    expect(name).toBe('markdown.md'); // 默认名
    expect(content).toContain('# Markdown 编辑器示例');
    expect(title).toBe('保存 Markdown');
    expect(opts).toEqual({ filterName: 'Markdown 文件', extensions: [ 'md', 'markdown', 'txt' ] });
    expect(successMock).toHaveBeenCalledWith('已保存 markdown.md');

    // 用户在保存对话框中取消 (返回 false): 不再重复提示成功
    saveMock.mockResolvedValue(false);
    successMock.mockClear();
    fireEvent.click(btn('保存'));
    await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(2));
    expect(successMock).not.toHaveBeenCalled();
  });

  it('导出 HTML: 同样弹保存对话框, 文件名跟随当前 .md, 过滤器为 html', async () => {
    const { container } = render(<ThemeProvider><MarkdownEditor /></ThemeProvider>);
    await openFile(container, new File([ '# 打开的文件\n' ], 'my-note.md', { type: 'text/markdown' }));

    fireEvent.click(btn('导出HTML'));
    await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(1));
    const [ name, content, title, opts ] = saveMock.mock.calls[0];
    expect(name).toBe('my-note.html');
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('<h1'); // 正文已渲染
    expect(title).toBe('导出 HTML');
    expect(opts).toEqual({ filterName: 'HTML 文件', extensions: [ 'html', 'htm' ] });
  });

  it('拖拽 .md 文件到编辑区即可打开, 拖拽中给出高亮', async () => {
    const { container } = render(<ThemeProvider><MarkdownEditor /></ThemeProvider>);
    const root = view(container);

    fireEvent.dragEnter(root);
    expect(root.className).toContain('md-editor-dragging');
    fireEvent.dragLeave(root);
    expect(root.className).not.toContain('md-editor-dragging');

    fireEvent.drop(root, { dataTransfer: { files: [ new File([ '# 打开的文件\n' ], 'drop.md', { type: 'text/markdown' }) ] } });
    await waitFor(() => expect(editor(container).value).toBe('# 打开的文件\n'));
    expect(root.className).not.toContain('md-editor-dragging');
  });
});
