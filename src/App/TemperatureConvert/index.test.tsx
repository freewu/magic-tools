import '@testing-library/jest-dom';
import { cleanup, fireEvent, render } from '@testing-library/react';
import TemperatureConvert from './index';
jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
}));
afterEach(() => cleanup());

const norm = (s: string) => s.replace(/\s+/g, '');
const buttons = (c: HTMLElement) => Array.from(c.querySelectorAll('button')).map((b) => norm(b.textContent ?? ''));
const inputValues = (c: HTMLElement) => Array.from(c.querySelectorAll('input')).map((i) => (i as HTMLInputElement).value);
const presetTags = (c: HTMLElement) => Array.from(c.querySelectorAll('.ant-tag')) as HTMLElement[];
const presetTag = (c: HTMLElement, text: string) => presetTags(c).find((el) => norm(el.textContent ?? '').includes(text));

describe('TemperatureConvert 页面', () => {
  test('渲染参数控件与操作区 (按钮 + 输入/选择)', () => {
    const { container } = render(<TemperatureConvert />);
    // 页面有实际内容
    expect(norm(container.textContent ?? '')).not.toBe('');
    // 至少一个操作按钮与一个可输入控件 (textarea/input/select)
    expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('textarea, input, .ant-select').length).toBeGreaterThan(0);
  });

  test('输入内容后点击操作按钮不抛异常', () => {
    const { container } = render(<TemperatureConvert />);
    const editable = (container.querySelector('textarea') ?? container.querySelector('input')) as HTMLInputElement | HTMLTextAreaElement | null;
    if (editable) fireEvent.change(editable, { target: { value: 'test' } });
    const btn = buttons(container).length ? Array.from(container.querySelectorAll('button'))[0] as HTMLButtonElement : null;
    if (btn) expect(() => fireEvent.click(btn)).not.toThrow();
  });
});

describe('TemperatureConvert 常用温度预设', () => {
  test('常用预设为彩色标签, 且位于输入框上方', () => {
    const { container } = render(<TemperatureConvert />);
    const tags = presetTags(container);
    expect(tags.length).toBeGreaterThan(0);
    // antd Tag 的彩色底纹走 inline style
    expect(tags[0].getAttribute('style') ?? '').toMatch(/background/);
    // 4 色循环: 前 4 个标签底色互不相同
    expect(new Set(tags.slice(0, 4).map((el) => el.getAttribute('style'))).size).toBe(4);
    // 位于输入框上方
    const area = container.querySelector('textarea') as HTMLElement;
    expect(area.compareDocumentPosition(tags[0]) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  test('点击「沸点」自动换算其余温标', () => {
    const { container } = render(<TemperatureConvert />);
    const btn = presetTag(container, '沸点');
    expect(btn).toBeTruthy();
    fireEvent.click(btn as HTMLElement);
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe('100');
    const values = inputValues(container);
    expect(values).toContain('100');    // 摄氏度
    expect(values).toContain('212');    // 华氏度
    expect(values).toContain('373.15'); // 开尔文
    expect(values).toContain('80');     // 列氏度
  });

  test('点击「华氏沸点」会切换到华氏并换算', () => {
    const { container } = render(<TemperatureConvert />);
    fireEvent.click(presetTag(container, '华氏沸点') as HTMLElement);
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe('212');
    expect(inputValues(container)).toContain('100'); // 摄氏度结果
  });
});
