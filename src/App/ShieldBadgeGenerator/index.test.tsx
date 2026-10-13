import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import ShieldBadgeGenerator from './index';
import { buildBadgeSvg } from './lib';
jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../lib/tauri', () => ({
  saveTextFile: jest.fn().mockResolvedValue(true),
  openUrl: jest.fn(),
}));
afterEach(() => cleanup());

const norm = (s: string) => s.replace(/\s+/g, '');
const buttons = (c: HTMLElement) => Array.from(c.querySelectorAll('button')).map((b) => norm(b.textContent ?? ''));

describe('ShieldBadgeGenerator 页面', () => {
  test('渲染参数控件与操作区 (按钮 + 输入/选择)', () => {
    const { container } = render(<ShieldBadgeGenerator />);
    // 页面有实际内容
    expect(norm(container.textContent ?? '')).not.toBe('');
    // 至少一个操作按钮与一个可输入控件 (textarea/input/select)
    expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('textarea, input, .ant-select').length).toBeGreaterThan(0);
  });

  test('输入内容后点击操作按钮不抛异常', () => {
    const { container } = render(<ShieldBadgeGenerator />);
    const editable = (container.querySelector('textarea') ?? container.querySelector('input')) as HTMLInputElement | HTMLTextAreaElement | null;
    if (editable) fireEvent.change(editable, { target: { value: 'test' } });
    const btn = buttons(container).length ? Array.from(container.querySelectorAll('button'))[0] as HTMLButtonElement : null;
    if (btn) expect(() => fireEvent.click(btn)).not.toThrow();
  });

  const pre = (c: HTMLElement) => c.querySelector('pre') as HTMLPreElement;

  test('SVG 源码默认格式化查看 (缩进多行), 可切回单行原始', () => {
    const { container } = render(<ShieldBadgeGenerator />);
    const raw = buildBadgeSvg({ label: 'php', value: '8.0', fg: '#fff', status: '#007ec6' });

    // 默认: 格式化多行, 首行为根元素, 叶子文本单行
    const pretty = pre(container).textContent ?? '';
    expect(pretty).toContain('\n');
    expect(pretty.split('\n')[0]).toMatch(/^<svg xmlns=/);
    expect(pretty).toContain('\n  <linearGradient');
    expect(pretty).toContain('\n    <stop');
    expect(pretty).toContain('>php</text>');
    expect(pretty).toContain('\n</svg>');
    // 源码区头部: 格式化 / 单行原始 切换 + 行数
    expect(screen.getByText('格式化')).toBeTruthy();
    expect(screen.getByText('单行原始')).toBeTruthy();
    expect(screen.getByText(/^共 \d+ 行 · \d+ 字符$/)).toBeTruthy();

    // 切到原始: 与 buildBadgeSvg 原文完全一致 (单行)
    fireEvent.click(screen.getByText('单行原始'));
    expect(pre(container).textContent).toBe(raw);
    expect(pre(container).textContent).not.toContain('\n');
    expect(screen.getByText(`共 1 行 · ${raw.length} 字符`)).toBeTruthy();

    // 切回格式化
    fireEvent.click(screen.getByText('格式化'));
    expect((pre(container).textContent ?? '').split('\n').length).toBeGreaterThan(10);
  });

  test('参数变化后格式化源码同步更新', () => {
    const { container } = render(<ShieldBadgeGenerator />);
    const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];
    fireEvent.change(inputs[0], { target: { value: 'build' } });
    const pretty = pre(container).textContent ?? '';
    expect(pretty).toContain('>build</text>');
    expect(pretty).toContain('>8.0</text>');
  });

  test('文字与状态均为空时源码区为空, 无行数提示', () => {
    const { container } = render(<ShieldBadgeGenerator />);
    const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];
    fireEvent.change(inputs[0], { target: { value: '' } });
    fireEvent.change(inputs[1], { target: { value: '' } });
    expect(pre(container).textContent).toBe('');
    expect(screen.queryByText(/共 \d+ 行/)).toBeNull();
  });
});
