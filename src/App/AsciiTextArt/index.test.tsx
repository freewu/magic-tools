import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import AsciiTextArt from './index';
jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../lib/tauri', () => ({
  saveTextFile: jest.fn().mockResolvedValue(true),
  openUrl: jest.fn(),
}));
// 排版引擎桩: 避免测试里反复动态加载整包字体数据 (真实排版逻辑由 lib.test.ts 覆盖)
jest.mock('./lib', () => ({
  ...jest.requireActual('./lib'),
  renderText: jest.fn(async (text: string, font: string) => `[${font}] ${text}`),
}));
afterEach(() => cleanup());

const norm = (s: string) => s.replace(/\s+/g, '');
const buttons = (c: HTMLElement) => Array.from(c.querySelectorAll('button')).map((b) => norm(b.textContent ?? ''));

describe('AsciiTextArt 页面', () => {
  test('渲染参数控件与操作区 (按钮 + 输入/选择)', async () => {
    const { container } = render(<AsciiTextArt />);
    // 页面有实际内容
    expect(norm(container.textContent ?? '')).not.toBe('');
    // 至少一个操作按钮与一个可输入控件 (textarea/input/select)
    expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('textarea, input, .ant-select').length).toBeGreaterThan(0);
    // 首次排版完成 (引擎桩) 顺带冲掉挂起的异步 setState
    await waitFor(() => expect(container.querySelector('pre')?.textContent).toBe('[Standard] bluefrog'));
  });

  test('输入非 ASCII 字符时输入框变红并提示', async () => {
    const { container } = render(<AsciiTextArt />);
    const area = () => container.querySelector('textarea') as HTMLTextAreaElement;
    // 初始为 ASCII (bluefrog), 没有红框与提示
    expect(area().className).not.toContain('ant-input-status-error');
    expect(container.textContent).not.toContain('非 ASCII 字符');

    fireEvent.change(area(), { target: { value: '你好 MagicTools' } });
    await waitFor(() => expect(area().className).toContain('ant-input-status-error'));
    const hint = container.textContent ?? '';
    expect(hint).toContain('含 2 个非 ASCII 字符');
    expect(hint).toContain('「你」「好」');
    expect(hint).toContain('会按字体回退显示');

    // 非 ASCII 文本照旧参与排版 (仅回退显示), 不会中断
    await waitFor(() => expect(container.querySelector('pre')?.textContent).toBe('[Standard] 你好 MagicTools'));

    // 改回纯 ASCII 后红框与提示都消失
    fireEvent.change(area(), { target: { value: 'MagicTools' } });
    await waitFor(() => expect(area().className).not.toContain('ant-input-status-error'));
    expect(container.textContent).not.toContain('非 ASCII 字符');
  });

  test('换行与制表符不算非 ASCII 字符', async () => {
    const { container } = render(<AsciiTextArt />);
    const area = container.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(area, { target: { value: 'ab\ncd' } });
    await waitFor(() => expect(container.querySelector('pre')?.textContent).toBe('[Standard] ab\ncd'));
    expect(container.textContent).not.toContain('非 ASCII 字符');
    expect(area.className).not.toContain('ant-input-status-error');
  });

  test('输入内容后点击操作按钮不抛异常', async () => {
    const { container } = render(<AsciiTextArt />);
    const editable = (container.querySelector('textarea') ?? container.querySelector('input')) as HTMLInputElement | HTMLTextAreaElement | null;
    if (editable) fireEvent.change(editable, { target: { value: 'test' } });
    const btn = buttons(container).length ? Array.from(container.querySelectorAll('button'))[0] as HTMLButtonElement : null;
    if (btn) expect(() => fireEvent.click(btn)).not.toThrow();
    await waitFor(() => expect(container.querySelector('pre')?.textContent).toBe('[Standard] test'));
  });
});
