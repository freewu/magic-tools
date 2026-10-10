import '@testing-library/jest-dom';
import { cleanup, fireEvent, render } from '@testing-library/react';
import Color from './index';
import { calcReadableTextColor } from './lib';
jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
}));
afterEach(() => cleanup());

const norm = (s: string) => s.replace(/\s+/g, '');
// 浏览器归一化后的颜色 (rgb(255, 0, 0) / rgba(255, 0, 0, 1) / #FF0000) 统一为 #RRGGBB
const toHex = (color: string) => {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return color.toUpperCase();
  return '#' + [1, 2, 3].map((i) => Number(match[i]).toString(16).padStart(2, '0')).join('').toUpperCase();
};
const buttons = (c: HTMLElement) => Array.from(c.querySelectorAll('button')).map((b) => norm(b.textContent ?? ''));

describe('Color 页面', () => {
  test('渲染参数控件与操作区 (按钮 + 输入/选择)', () => {
    const { container } = render(<Color />);
    // 页面有实际内容
    expect(norm(container.textContent ?? '')).not.toBe('');
    // 至少一个操作按钮与一个可输入控件 (textarea/input/select)
    expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('textarea, input, .ant-select').length).toBeGreaterThan(0);
  });

  test('颜色块文字颜色使用背景色的反色', () => {
    const { container } = render(<Color />);
    const cards = Array.from(container.querySelectorAll('.color-card')) as HTMLElement[];
    expect(cards.length).toBeGreaterThan(0);
    cards.slice(0, 50).forEach((card) => {
      const backgroundColor = toHex(card.style.backgroundColor);
      // 文字颜色 = 该背景色计算出的可读颜色 (反色 / 黑 / 白)
      expect(toHex(card.style.color)).toBe(calcReadableTextColor(backgroundColor));
    });
  });

  test('输入内容后点击操作按钮不抛异常', () => {
    const { container } = render(<Color />);
    const editable = (container.querySelector('textarea') ?? container.querySelector('input')) as HTMLInputElement | HTMLTextAreaElement | null;
    if (editable) fireEvent.change(editable, { target: { value: 'test' } });
    const btn = buttons(container).length ? Array.from(container.querySelectorAll('button'))[0] as HTMLButtonElement : null;
    if (btn) expect(() => fireEvent.click(btn)).not.toThrow();
  });
});
