// Markdown 编辑器: 预览区深浅色样式 (深色模式必须注入覆盖样式, 否则预览文字黑底黑字)
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '../../hook/theme-context';
import MarkdownEditor from './index';
import { MD_DARK_CSS } from './lib';

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
