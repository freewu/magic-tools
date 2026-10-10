import '@testing-library/jest-dom';
import { cleanup, fireEvent, render } from '@testing-library/react';
import Unicode from './index';
jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../lib/file', () => ({
  openFile: jest.fn(),
}));
afterEach(() => cleanup());

const norm = (s: string) => s.replace(/\s+/g, '');
const buttons = (c: HTMLElement) => Array.from(c.querySelectorAll('button')).map((b) => norm(b.textContent ?? ''));

describe('Unicode 页面', () => {
  test('操作按钮包裹在同一个 Space 容器内 (按钮之间有间隔)', () => {
    const { container } = render(<Unicode />);
    const btns = Array.from(container.querySelectorAll('button'));
    expect(btns.length).toBe(5);
    const space = btns[0].closest('.ant-space');
    expect(space).not.toBeNull();
    // 所有按钮必须是同一个 Space 的子项, 由 Space 统一提供间距
    btns.forEach((b) => expect(b.closest('.ant-space')).toBe(space));
  });

  test('渲染参数控件与操作区 (按钮 + 输入/选择)', () => {
    const { container } = render(<Unicode />);
    // 页面有实际内容
    expect(norm(container.textContent ?? '')).not.toBe('');
    // 至少一个操作按钮与一个可输入控件 (textarea/input/select)
    expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('textarea, input, .ant-select').length).toBeGreaterThan(0);
  });

  test('输入内容后点击操作按钮不抛异常', () => {
    const { container } = render(<Unicode />);
    const editable = (container.querySelector('textarea') ?? container.querySelector('input')) as HTMLInputElement | HTMLTextAreaElement | null;
    if (editable) fireEvent.change(editable, { target: { value: 'test' } });
    const btn = buttons(container).length ? Array.from(container.querySelectorAll('button'))[0] as HTMLButtonElement : null;
    if (btn) expect(() => fireEvent.click(btn)).not.toThrow();
  });
});
