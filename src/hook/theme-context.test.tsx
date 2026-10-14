import '@testing-library/jest-dom';
import { render, waitFor } from '@testing-library/react';
import { ThemeProvider } from './theme-context';

/** ThemeProvider 会把主题色写成 html 上的 CSS 变量 */
const cssVar = (name: string) => document.documentElement.style.getPropertyValue(name);

describe('ThemeProvider 主题变量', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('style');
  });

  test('浅色模式: 写入浅色变量, 分隔标题为柔和的灰蓝', async () => {
    localStorage.setItem('theme-mode', 'light');
    render(<ThemeProvider><div /></ThemeProvider>);
    await waitFor(() => expect(cssVar('--app-bg')).toBe('#f0f2f5'));
    expect(cssVar('--app-text')).toBe('rgba(0, 0, 0, 0.88)');
    expect(cssVar('--app-input-bg')).toBe('#ffffff');
    expect(cssVar('--app-divider-text')).toBe('#64748b');
  });

  test('深色模式: 写入深色变量, 分隔标题换成更亮的颜色', async () => {
    localStorage.setItem('theme-mode', 'dark');
    render(<ThemeProvider><div /></ThemeProvider>);
    await waitFor(() => expect(cssVar('--app-bg')).toBe('#000000'));
    expect(cssVar('--app-text')).toBe('rgba(255, 255, 255, 0.85)');
    expect(cssVar('--app-input-bg')).toBe('#1f1f1f');
    expect(cssVar('--app-divider-text')).toBe('#cbd5e1');
  });

  test('显示模式持久化到 localStorage', async () => {
    localStorage.setItem('theme-mode', 'light');
    const { container } = render(<ThemeProvider><div /></ThemeProvider>);
    await waitFor(() => expect(cssVar('--app-bg')).toBe('#f0f2f5'));
    expect(localStorage.getItem('theme-mode')).toBe('light');
    expect(container).toBeTruthy();
  });
});
