import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import Color from './index';
import { calcReadableTextColor } from './lib';
jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
}));
afterEach(() => { cleanup(); localStorage.clear(); });

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

  test('开启拼音后中文名称在汉字上方显示拼音 (ruby 注音)', async () => {
    const { container } = render(<Color />);
    const activePane = () => container.querySelector('.ant-tabs-tabpane-active');
    const sw = container.querySelector('.color-pinyin-switch') as HTMLElement;
    expect(sw).toBeTruthy();
    // 默认关闭: 不渲染注音
    expect(activePane()?.querySelector('.color-card ruby')).toBeNull();

    fireEvent.click(sw);
    await waitFor(() => {
      expect(activePane()?.querySelectorAll('.color-card ruby').length ?? 0).toBeGreaterThan(0);
    }, { timeout: 10000 });

    // 粉红 => 每个汉字上方分别是 fěn / hóng
    // 注: ruby 的 textContent 会把注音串在汉字后面, 故用「基字」定位该卡片
    const baseText = (el: Element) => Array.from(el.querySelectorAll('ruby')).map((r) => norm(r.childNodes[0]?.textContent ?? '')).join('');
    const card = Array.from(activePane()?.querySelectorAll('.color-card') ?? [])
      .find((el) => baseText(el) === '粉红') as HTMLElement;
    expect(card).toBeTruthy();
    expect(card.className).toContain('color-card-pinyin');
    const rubies = Array.from(card.querySelectorAll('ruby'));
    expect(rubies.map((r) => norm(r.querySelector('rt')?.textContent ?? ''))).toEqual(['fěn', 'hóng']);
    expect(rubies.map((r) => norm(r.childNodes[0]?.textContent ?? ''))).toEqual(['粉', '红']);
    // 汉字上方的拼音是注音 rt, 基字仍是汉字, 色值仍在卡片上
    expect(norm(card.textContent ?? '')).toContain('fěn');
    expect(norm(card.textContent ?? '')).toContain('hóng');
    expect(norm(card.textContent ?? '')).toContain('#ffb3a7');
  });

  test('纯英文名称的配色板开启拼音后不渲染注音', async () => {
    const { container } = render(<Color />);
    fireEvent.click(container.querySelector('.color-pinyin-switch') as HTMLElement);
    const tab = Array.from(container.querySelectorAll('.ant-tabs-tab')).find((el) => norm(el.textContent ?? '').includes('Perler'));
    fireEvent.click(tab as Element);
    await waitFor(() => {
      const pane = container.querySelector('.ant-tabs-tabpane-active');
      expect(pane?.querySelectorAll('.color-card').length ?? 0).toBeGreaterThan(0);
    });
    expect(container.querySelector('.ant-tabs-tabpane-active .color-card ruby')).toBeNull();
    expect(container.querySelector('.ant-tabs-tabpane-active .color-card-pinyin')).toBeNull();
  });

  test('输入内容后点击操作按钮不抛异常', () => {
    const { container } = render(<Color />);
    const editable = (container.querySelector('textarea') ?? container.querySelector('input')) as HTMLInputElement | HTMLTextAreaElement | null;
    if (editable) fireEvent.change(editable, { target: { value: 'test' } });
    const btn = buttons(container).length ? Array.from(container.querySelectorAll('button'))[0] as HTMLButtonElement : null;
    if (btn) expect(() => fireEvent.click(btn)).not.toThrow();
  });
});
