import '@testing-library/jest-dom';
import { cleanup, fireEvent, render } from '@testing-library/react';
import GzipCodec from './index';
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

describe('GzipCodec 页面', () => {
  test('根容器宽度 100% (textarea 铺满可用宽度, 无 900px 限制)', () => {
    const { container } = render(<GzipCodec />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.width).toBe('100%');
    expect(root.style.maxWidth).toBe('');
    // 两个 textarea 都在该容器内, 不设固定宽度 (默认 width:100%)
    const tas = Array.from(container.querySelectorAll('textarea'));
    expect(tas.length).toBeGreaterThanOrEqual(2);
    tas.forEach((ta) => expect((ta as HTMLTextAreaElement).style.width).toBe(''));
  });

  test('渲染参数控件与操作区 (按钮 + 输入/选择)', () => {
    const { container } = render(<GzipCodec />);
    // 页面有实际内容
    expect(norm(container.textContent ?? '')).not.toBe('');
    // 至少一个操作按钮与一个可输入控件 (textarea/input/select)
    expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('textarea, input, .ant-select').length).toBeGreaterThan(0);
  });

  test('输入内容后点击操作按钮不抛异常', () => {
    const { container } = render(<GzipCodec />);
    const editable = (container.querySelector('textarea') ?? container.querySelector('input')) as HTMLInputElement | HTMLTextAreaElement | null;
    if (editable) fireEvent.change(editable, { target: { value: 'test' } });
    const btn = buttons(container).length ? Array.from(container.querySelectorAll('button'))[0] as HTMLButtonElement : null;
    if (btn) expect(() => fireEvent.click(btn)).not.toThrow();
  });
});
