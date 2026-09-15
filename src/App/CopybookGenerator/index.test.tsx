import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import CopybookGenerator from './index';
import { TEXT_DEFAULT } from './data';

/** 预览区渲染出的字符格子数 (跳过 <style> 里的 .cb-ch 规则) */
const charCount = (el: HTMLElement): number => el.querySelectorAll('span.cb-ch').length;

describe('CopybookGenerator 交互', () => {
  beforeEach(() => localStorage.clear());

  test('关闭「循环填充」后只填文本长度个格子, 其余留空', () => {
    const { container } = render(<CopybookGenerator />);

    // 默认开启循环填充: 2 页 × 10 × 12 = 240 格全部有字
    expect(charCount(container)).toBe(240);

    // 第一个 switch 即「循环填充」(文本区块在最上方)
    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);
    expect(switches[0]).not.toBeChecked();

    expect(charCount(container)).toBe(Array.from(TEXT_DEFAULT).length); // 14
    expect(container.textContent).toContain('不循环: 14 格有字');

    // 前 14 格按顺序显示文本, 第 15 格起为空
    const spans = Array.from(container.querySelectorAll('span.cb-ch'));
    expect(spans.map((s) => s.textContent).join('')).toBe(TEXT_DEFAULT);
    const cells = Array.from(container.querySelectorAll('.cb-cell'));
    expect(cells).toHaveLength(240);
    expect(cells[14].querySelector('span.cb-ch')).toBeNull();
  });

  test('「每行格数 / 每页行数 / 页数 / 格间距」默认值与设置一致', () => {
    const { container } = render(<CopybookGenerator />);
    const nums = Array.from(container.querySelectorAll('input[role="spinbutton"]'))
      .map((el) => (el as HTMLInputElement).value);
    expect(nums.slice(0, 4)).toEqual([ '10', '12', '2', '0.0' ]); // 格间距 step=0.5, 显示带一位小数
    expect(container.querySelectorAll('.cb-cell')).toHaveLength(240);
    expect(container.querySelectorAll('.cb-row')).toHaveLength(24);
  });

  test('打开「按行填充」后每行重复同一个字, 第 N 行用第 N 个字', () => {
    const { container } = render(<CopybookGenerator />);

    // switch 顺序: 循环填充 / 按行填充
    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[1]);
    expect(switches[1]).toBeChecked();
    // 提示文案同步出现
    expect(container.textContent).toContain('按行填充: 每行重复同一个字');
    expect(container.textContent).toContain('每行一字');

    const rows = Array.from(container.querySelectorAll('.cb-row'));
    expect(rows).toHaveLength(24); // 2 页 × 12 行
    expect(charCount(container)).toBe(240); // 循环填充仍开启 → 每行都填满

    const chars = Array.from(TEXT_DEFAULT); // 14 个字, 循环使用
    rows.forEach((row, r) => {
      const inRow = Array.from(row.querySelectorAll('span.cb-ch')).map((s) => s.textContent);
      const expect1 = chars[r % chars.length];
      expect(inRow).toHaveLength(10);
      expect(new Set(inRow)).toEqual(new Set([ expect1 ]));
    });
  });

  test('按行填充 + 关闭循环填充: 超出行数留空, 已填行仍是一行一字', () => {
    const { container } = render(<CopybookGenerator />);
    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]); // 关闭循环填充
    fireEvent.click(switches[1]); // 打开按行填充

    const rows = Array.from(container.querySelectorAll('.cb-row'));
    // 14 个字 → 前 14 行有字 (每行 10 格), 其余 10 行留空
    expect(charCount(container)).toBe(14 * 10);
    expect(container.textContent).toContain('不循环: 140 格有字');
    rows.slice(0, 14).forEach((row) => {
      expect(row.querySelectorAll('span.cb-ch')).toHaveLength(10);
    });
    rows.slice(14).forEach((row) => {
      expect(row.querySelectorAll('span.cb-ch')).toHaveLength(0);
    });
  });
});
