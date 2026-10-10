import '@testing-library/jest-dom';
import { cleanup, fireEvent, render } from '@testing-library/react';
import SpeedConvert from './index';
jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
}));
afterEach(() => cleanup());

const norm = (s: string) => s.replace(/\s+/g, '');
const buttons = (c: HTMLElement) => Array.from(c.querySelectorAll('button')).map((b) => norm(b.textContent ?? ''));
const inputValues = (c: HTMLElement) => Array.from(c.querySelectorAll('input')).map((i) => (i as HTMLInputElement).value);
const presetBtn = (c: HTMLElement, text: string) => Array.from(c.querySelectorAll('button')).find((b) => norm(b.textContent ?? '').includes(text));

describe('SpeedConvert 页面', () => {
  test('渲染参数控件与操作区 (按钮 + 输入/选择)', () => {
    const { container } = render(<SpeedConvert />);
    // 页面有实际内容
    expect(norm(container.textContent ?? '')).not.toBe('');
    // 至少一个操作按钮与一个可输入控件 (textarea/input/select)
    expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('textarea, input, .ant-select').length).toBeGreaterThan(0);
  });

  test('输入内容后点击操作按钮不抛异常', () => {
    const { container } = render(<SpeedConvert />);
    const editable = (container.querySelector('textarea') ?? container.querySelector('input')) as HTMLInputElement | HTMLTextAreaElement | null;
    if (editable) fireEvent.change(editable, { target: { value: 'test' } });
    const btn = buttons(container).length ? Array.from(container.querySelectorAll('button'))[0] as HTMLButtonElement : null;
    if (btn) expect(() => fireEvent.click(btn)).not.toThrow();
  });
});

describe('SpeedConvert 常用速度预设', () => {
  test('点击「第一宇宙速度 7.9 km/s」自动换算', () => {
    const { container } = render(<SpeedConvert />);
    fireEvent.click(presetBtn(container, '第一宇宙速度7.9km/s') as HTMLButtonElement);
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe('7.9');
    const values = inputValues(container);
    expect(values).toContain('28440');  // 千米/时
    expect(values).toContain('7900');   // 米/秒
  });

  test('点击「重力加速度 9.80665 m/s」自动换算', () => {
    const { container } = render(<SpeedConvert />);
    fireEvent.click(presetBtn(container, '重力加速度9.80665m/s') as HTMLButtonElement);
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe('9.80665');
    const values = inputValues(container);
    expect(values).toContain('9.80665');   // 米/秒自身
    expect(values).toContain('35.30394');  // 千米/时
  });
});
