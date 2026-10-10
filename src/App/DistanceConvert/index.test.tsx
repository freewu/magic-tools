import '@testing-library/jest-dom';
import { cleanup, fireEvent, render } from '@testing-library/react';
import DistanceConvert from './index';
jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
}));
afterEach(() => cleanup());

const norm = (s: string) => s.replace(/\s+/g, '');
const buttons = (c: HTMLElement) => Array.from(c.querySelectorAll('button')).map((b) => norm(b.textContent ?? ''));
const inputValues = (c: HTMLElement) => Array.from(c.querySelectorAll('input')).map((i) => (i as HTMLInputElement).value);
const presetBtn = (c: HTMLElement, text: string) => Array.from(c.querySelectorAll('button')).find((b) => norm(b.textContent ?? '').includes(text));

describe('DistanceConvert 页面', () => {
  test('渲染参数控件与操作区 (按钮 + 输入/选择)', () => {
    const { container } = render(<DistanceConvert />);
    // 页面有实际内容
    expect(norm(container.textContent ?? '')).not.toBe('');
    // 至少一个操作按钮与一个可输入控件 (textarea/input/select)
    expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('textarea, input, .ant-select').length).toBeGreaterThan(0);
  });

  test('输入内容后点击操作按钮不抛异常', () => {
    const { container } = render(<DistanceConvert />);
    const editable = (container.querySelector('textarea') ?? container.querySelector('input')) as HTMLInputElement | HTMLTextAreaElement | null;
    if (editable) fireEvent.change(editable, { target: { value: 'test' } });
    const btn = buttons(container).length ? Array.from(container.querySelectorAll('button'))[0] as HTMLButtonElement : null;
    if (btn) expect(() => fireEvent.click(btn)).not.toThrow();
  });
});

describe('DistanceConvert 常用距离预设', () => {
  test('点击「马拉松 42.195 千米」自动换算各制式', () => {
    const { container } = render(<DistanceConvert />);
    fireEvent.click(presetBtn(container, '马拉松42.195千米') as HTMLButtonElement);
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe('42.195');
    const values = inputValues(container);
    expect(values).toContain('42195');     // 米
    expect(values).toContain('4219500');   // 厘米
    expect(values).toContain('84.39');     // 市里 (1 里 = 500 米)
  });

  test('点击「1 英里」换算为 1609.344 米 (系数修正)', () => {
    const { container } = render(<DistanceConvert />);
    fireEvent.click(presetBtn(container, '1英里') as HTMLButtonElement);
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe('1');
    // 公制列: 米 / 千米
    const values = inputValues(container);
    expect(values).toContain('1609.344');
    expect(values).toContain('1.609344');
  });
});
