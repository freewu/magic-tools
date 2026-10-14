import '@testing-library/jest-dom';
import Color from './index';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { calcReadableTextColor, getLevitationPos } from './lib';
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
/** 颜色类型是 antd Radio.Group (optionType="button") => label 元素而非 button */
const clickColorType = (container: HTMLElement, label: string) => {
  const el = Array.from(container.querySelectorAll('.ant-radio-button-wrapper')).find((b) => norm(b.textContent ?? '') === label);
  expect(el).toBeTruthy();
  fireEvent.click(el as Element);
};

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

  test('新增拼豆配色板标签已注册 (MARD/COCO/Artkal/Artkal Mini/Perler/Hama/DMC)', () => {
    const { container } = render(<Color />);
    const tabs = Array.from(container.querySelectorAll('.ant-tabs-tab')).map((el) => norm(el.textContent ?? ''));
    expect(tabs.length).toBeGreaterThan(0);
    for (const name of ['MARD221拼豆', 'COCO291拼豆', 'Artkal拼豆', 'ArtkalMini拼豆', 'Perler拼豆', 'Hama拼豆', 'DMC绣线']) {
      expect(tabs.some((tab) => tab.includes(name))).toBe(true);
    }
  });

  test('切换到 MARD 配色板后按系列分组展示', async () => {
    const { container } = render(<Color />);
    const tab = Array.from(container.querySelectorAll('.ant-tabs-tab')).find((el) => norm(el.textContent ?? '').includes('MARD'));
    expect(tab).toBeTruthy();
    fireEvent.click(tab as Element);
    await waitFor(() => {
      const pane = container.querySelector('.ant-tabs-tabpane-active');
      const dividers = Array.from(pane?.querySelectorAll('.color-pad .ant-divider') ?? []).map((el) => norm(el.textContent ?? ''));
      // 9 个系列分割标题: A B C D E F G H M
      expect(dividers).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'M']);
      const cards = Array.from(pane?.querySelectorAll('.color-card') ?? []);
      expect(cards.length).toBe(221);
      expect(cards.some((card) => norm(card.textContent ?? '').includes('A1'))).toBe(true);
    });
  });

  test('切换到 Perler 配色板展示色号色卡', async () => {
    const { container } = render(<Color />);
    const tab = Array.from(container.querySelectorAll('.ant-tabs-tab')).find((el) => norm(el.textContent ?? '').includes('Perler'));
    expect(tab).toBeTruthy();
    fireEvent.click(tab as Element);
    await waitFor(() => {
      const cards = Array.from(container.querySelectorAll('.color-card'));
      expect(cards.some((card) => norm(card.textContent ?? '').includes('P01White'))).toBe(true);
    });
  });

  test('色块编码跟随颜色类型切换, 选「颜色名称」时隐藏编码', async () => {
    const { container } = render(<Color />);
    const codeEl = () => container.querySelector('.color-card .color-card-code');
    const code = () => codeEl()?.textContent ?? '';
    const clickType = (label: string) => clickColorType(container, label);
    // 默认 #HEX: 编码带 #
    expect(code().startsWith('#')).toBe(true);

    // HEX: 不带 #
    clickType('HEX');
    await waitFor(() => expect(code().startsWith('#')).toBe(false));
    expect(code().length).toBeGreaterThan(0);

    // RGBA: 展示 rgba(...) 且透明度 (默认 0.9) 进入编码
    clickType('RGBA');
    await waitFor(() => expect(code().startsWith('rgba(')).toBe(true));
    expect(code()).toMatch(/rgba\(\d+, \d+, \d+, [\d.]+\)$/);

    // 颜色名称: 不展示编码
    clickType('颜色名称');
    await waitFor(() => expect(codeEl()).toBeNull());
  });

  test('批量取色浮层只展示当前颜色类型的值 (名称/编码)', async () => {
    const { container } = render(<Color />);
    // 开启批量取色
    const checkbox = container.querySelector('.levitation-box input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox).toBeTruthy();
    fireEvent.click(checkbox);
    await waitFor(() => expect((container.querySelector('.levitation-box input[type="checkbox"]') as HTMLInputElement).checked).toBe(true));

    // 取一个色 => 浮层里出现一条记录 (背景色为色块颜色, 文字为可读色)
    fireEvent.click(container.querySelector('.color-card') as Element);
    await waitFor(() => expect(container.querySelectorAll('.levitation-box li').length).toBe(1));
    const name = container.querySelector('.color-card .color-card-name')?.textContent ?? '';
    const textEl = () => container.querySelector('.levitation-box li .levitation-li-text');
    const text = () => textEl()?.textContent ?? '';
    expect(name).toBeTruthy();

    // 默认 #HEX: 只展示编码 (带 #), 不展示名称
    expect(text().startsWith('#')).toBe(true);
    expect(text()).not.toContain(name);

    // 切到 RGB: 浮层值同步变成 rgb(...)
    clickColorType(container, 'RGB');
    await waitFor(() => expect(text().startsWith('rgb(')).toBe(true));
    expect(text()).not.toContain(name);

    // 切到 RGBA: 带上透明度
    clickColorType(container, 'RGBA');
    await waitFor(() => expect(text()).toMatch(/rgba\(\d+, \d+, \d+, [\d.]+\)$/));

    // 颜色名称: 只展示名称 (与粘贴板一致)
    clickColorType(container, '颜色名称');
    await waitFor(() => expect(text()).toBe(name));
  });

  test('批量取色浮层可拖动调整位置并记住位置', async () => {
    const { container } = render(<Color />);
    const box = container.querySelector('.levitation-box') as HTMLElement;
    expect(box).toBeTruthy();
    // 默认位置由 CSS 控制 (right/top), 没有内联 left
    expect(box.style.left).toBe('');

    // 在浮层空白处按下 (100,100) 拖到 (200,150) => 偏移 (100,50)
    fireEvent.mouseDown(box, { button: 0, clientX: 100, clientY: 100 });
    expect(box.className).toContain('levitation-box-dragging');
    fireEvent.mouseMove(window, { clientX: 200, clientY: 150 });
    await waitFor(() => expect(box.style.left).toBe('100px'));
    expect(box.style.top).toBe('50px');
    // 拖动后用 left/top 定位 (覆盖默认的 right: 20px)
    expect(box.className).toContain('levitation-box-moved');

    // 松开鼠标: 退出拖动状态并写入 localStorage
    fireEvent.mouseUp(window);
    await waitFor(() => expect(box.className).not.toContain('levitation-box-dragging'));
    expect(getLevitationPos()).toEqual({ x: 100, y: 50 });

    // 重新渲染后位置依旧生效 (从 localStorage 恢复)
    cleanup();
    const second = render(<Color />);
    const box2 = second.container.querySelector('.levitation-box') as HTMLElement;
    await waitFor(() => expect(box2.style.left).toBe('100px'));
    expect(box2.style.top).toBe('50px');
  });

  test('批量取色复选框区域不参与拖动 (仍可开关)', async () => {
    const { container } = render(<Color />);
    const box = container.querySelector('.levitation-box') as HTMLElement;
    const checkbox = box.querySelector('.ant-checkbox-wrapper') as HTMLElement;
    fireEvent.mouseDown(checkbox, { button: 0, clientX: 100, clientY: 100 });
    expect(box.className).not.toContain('levitation-box-dragging');
  });

  test('输入内容后点击操作按钮不抛异常', () => {
    const { container } = render(<Color />);
    const editable = (container.querySelector('textarea') ?? container.querySelector('input')) as HTMLInputElement | HTMLTextAreaElement | null;
    if (editable) fireEvent.change(editable, { target: { value: 'test' } });
    const btn = buttons(container).length ? Array.from(container.querySelectorAll('button'))[0] as HTMLButtonElement : null;
    if (btn) expect(() => fireEvent.click(btn)).not.toThrow();
  });
});
