import '@testing-library/jest-dom';
import { cleanup, fireEvent, render } from '@testing-library/react';
import AreaConvert from './index';
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

describe('AreaConvert 页面', () => {
  test('渲染参数控件与操作区 (按钮 + 输入/选择)', () => {
    const { container } = render(<AreaConvert />);
    // 页面有实际内容
    expect(norm(container.textContent ?? '')).not.toBe('');
    // 至少一个操作按钮与一个可输入控件 (textarea/input/select)
    expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('textarea, input, .ant-select').length).toBeGreaterThan(0);
  });

  test('输入内容后点击操作按钮不抛异常', () => {
    const { container } = render(<AreaConvert />);
    const editable = (container.querySelector('textarea') ?? container.querySelector('input')) as HTMLInputElement | HTMLTextAreaElement | null;
    if (editable) fireEvent.change(editable, { target: { value: 'test' } });
    const btn = buttons(container).length ? Array.from(container.querySelectorAll('button'))[0] as HTMLButtonElement : null;
    if (btn) expect(() => fireEvent.click(btn)).not.toThrow();
  });
});

describe('AreaConvert 常用面积预设', () => {
  test('常用预设为彩色标签, 且位于输入框上方', () => {
    const { container } = render(<AreaConvert />);
    const tags = presetTags(container);
    expect(tags.length).toBeGreaterThan(0);
    // antd Tag 的彩色底纹走 inline style
    expect(tags[0].getAttribute('style') ?? '').toMatch(/background/);
    // 4 色循环: 前 4 个标签底色互不相同
    expect(new Set(tags.slice(0, 4).map((el) => el.getAttribute('style'))).size).toBe(4);
    // 位于输入框上方
    const area = container.querySelector('textarea') as HTMLElement;
    expect(area.compareDocumentPosition(tags[0]) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    // 预设常量单独占一行: antd Space 默认 inline-flex, 会与下一行的单位/按钮挤在同一行
    const row = tags[0].closest('.ant-space') as HTMLElement;
    expect(row).toBeTruthy();
    expect(row.style.display).toBe('flex');
  });

  test('点击「1 公顷」自动换算各制式', () => {
    const { container } = render(<AreaConvert />);
    fireEvent.click(presetTag(container, '1公顷') as HTMLElement);
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe('1');
    const values = inputValues(container);
    expect(values).toContain('10000');    // 平方米
    expect(values).toContain('0.01');     // 平方公里
    expect(values).toContain('1');        // 公顷
  });

  test('点击「1 亩」切到市制并换算', () => {
    const { container } = render(<AreaConvert />);
    fireEvent.click(presetTag(container, '1亩') as HTMLElement);
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe('1');
    const values = inputValues(container);
    expect(values).toContain('666.66');     // 平方米
    expect(values).toContain('0.066666');   // 公顷
  });

  test('点击「1 坪」切到日式制式并换算', () => {
    const { container } = render(<AreaConvert />);
    fireEvent.click(presetTag(container, '1坪') as HTMLElement);
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe('1');
    const values = inputValues(container);
    expect(values).toContain('3.30578622');  // 平方米
    expect(values).toContain('0.0003305786'); // 公顷 (10 位小数内)
  });
});
