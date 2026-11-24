import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());
import RomanNumeral from './index';

jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
}));

const norm = (s: string) => s.replace(/\s+/g, '');
const textareas = () => screen.getAllByRole('textbox') as HTMLTextAreaElement[];
const btn = (name: string) => {
  const target = norm(name);
  const hit = screen.getAllByRole('button').find((b) => norm(b.textContent ?? '') === target || norm(b.textContent ?? '').includes(target));
  if (!hit) throw new Error(`未找到按钮: ${name}`);
  return hit as HTMLButtonElement;
};

describe('罗马数字 页面', () => {
  test('三个操作按钮包裹在同一个 Space 容器内 (按钮之间有间隔)', () => {
    const { container } = render(<RomanNumeral />);
    const btns = Array.from(container.querySelectorAll('button'));
    expect(btns.length).toBe(3);
    const space = btns[0].closest('.ant-space');
    expect(space).not.toBeNull();
    btns.forEach((b) => expect(b.closest('.ant-space')).toBe(space));
  });

  test('渲染阿拉伯数字 / 罗马数字 / 清除 按钮', () => {
    render(<RomanNumeral />);
    expect(btn('转为罗马数字')).toBeInTheDocument();
    expect(btn('转为阿拉伯数字')).toBeInTheDocument();
    expect(btn('清除')).toBeInTheDocument();
  });

  test('上方输入阿拉伯数字 → 下方输出罗马数字', () => {
    render(<RomanNumeral />);
    fireEvent.change(textareas()[0], { target: { value: '2024' } });
    fireEvent.click(btn('转为罗马数字'));
    expect(textareas()[1].value).toBe('MMXXIV');
  });

  test('下方输入罗马数字 → 上方输出阿拉伯数字', () => {
    render(<RomanNumeral />);
    fireEvent.change(textareas()[1], { target: { value: 'MCMXCIV' } });
    fireEvent.click(btn('转为阿拉伯数字'));
    expect(textareas()[0].value).toBe('1994');
  });

  test('超出范围 / 非标准写法不崩溃, 也不覆盖已有结果', () => {
    render(<RomanNumeral />);
    fireEvent.change(textareas()[0], { target: { value: '12' } });
    fireEvent.click(btn('转为罗马数字'));
    expect(textareas()[1].value).toBe('XII');

    fireEvent.change(textareas()[0], { target: { value: '4000' } });
    expect(() => fireEvent.click(btn('转为罗马数字'))).not.toThrow();
    expect(textareas()[1].value).toBe('XII');

    fireEvent.change(textareas()[1], { target: { value: 'IIII' } });
    expect(() => fireEvent.click(btn('转为阿拉伯数字'))).not.toThrow();
    expect(textareas()[0].value).toBe('4000');
  });

  test('空输入点转换不做任何事', () => {
    render(<RomanNumeral />);
    fireEvent.click(btn('转为罗马数字'));
    fireEvent.click(btn('转为阿拉伯数字'));
    expect(textareas()[0].value).toBe('');
    expect(textareas()[1].value).toBe('');
  });

  test('清除按钮清空两个输入框', () => {
    render(<RomanNumeral />);
    fireEvent.change(textareas()[0], { target: { value: '3999' } });
    fireEvent.change(textareas()[1], { target: { value: 'MMMCMXCIX' } });
    fireEvent.click(btn('清除'));
    expect(textareas()[0].value).toBe('');
    expect(textareas()[1].value).toBe('');
  });

  test('双击输入框复制内容不抛错', () => {
    render(<RomanNumeral />);
    fireEvent.change(textareas()[1], { target: { value: 'XL' } });
    expect(() => fireEvent.doubleClick(textareas()[1])).not.toThrow();
  });
});
