// Markdown 编辑器: 预览区深浅色样式 (深色模式必须注入覆盖样式, 否则预览文字黑底黑字)
import { render } from '@testing-library/react';
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
