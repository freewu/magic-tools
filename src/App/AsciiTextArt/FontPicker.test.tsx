import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import FontPicker, { INITIAL_DIGIT, PREVIEW_TEXT } from './FontPicker';
import { FONT_NAMES, fontInitial, renderText } from './lib';

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

const trigger = (c: HTMLElement) => c.querySelector('.figlet-font-trigger') as HTMLButtonElement;
const item = (name: string) => document.querySelector(`.figlet-font-item[data-font="${name}"]`) as HTMLElement | null;
const previewOf = (name: string) => item(name)?.querySelector('.figlet-font-preview')?.textContent ?? null;
const searchBox = () => screen.getByPlaceholderText('搜索字体名称') as HTMLInputElement;
/** 有字体的首字母 (A-Z, 去掉无字体的 Q/X/Y/Z) */
const availableLetters = () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter((c) => FONT_NAMES.some((n) => fontInitial(n) === c));

/** 受控包装: 选用后按钮文案同步变化, 便于断言 */
const Harness = () => {
  const [ font, setFont ] = useState('Standard');
  return <FontPicker value={ font } onChange={ setFont } />;
};

describe('FontPicker', () => {
  test('按钮展示当前字体, 点击后打开弹窗 (搜索框 + 字体项)', async () => {
    const onChange = jest.fn();
    const { container } = render(<FontPicker value="Standard" onChange={ onChange } />);
    expect(trigger(container).textContent).toContain('Standard');
    expect(container.querySelector('.ant-modal')).toBeNull();

    fireEvent.click(trigger(container));
    await waitFor(() => expect(searchBox()).toBeInTheDocument());
    expect(screen.getByText(/选择字体 \(共 \d+ 款, 按 A-Z 预览\)/)).toBeInTheDocument();
    // 默认列出全部字体
    expect(document.querySelectorAll('.figlet-font-item').length).toBeGreaterThan(100);
  });

  test('每款字体按 26 个字母 A-Z 渲染预览, 未渲染完显示占位', async () => {
    // 取清单里第一款的字体 (首批渲染, 断言不必等整批 289 款渲染完)
    const first = FONT_NAMES[0];
    render(<FontPicker value={ first } onChange={ jest.fn() } />);
    fireEvent.click(trigger(document.body));
    // 刚打开的这一瞬间预览还没渲染, 显示占位文案
    expect(previewOf(first)).toBe('加载中…');

    // 首批渲染完成后被真实的 26 字母大字替换
    const art = await renderText(PREVIEW_TEXT, first);
    expect(art.trim()).not.toBe('');
    await waitFor(() => expect(previewOf(first)).toBe(art));
    expect(PREVIEW_TEXT).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    expect(PREVIEW_TEXT).toHaveLength(26);
  });

  test('搜索框按名称筛选字体', async () => {
    render(<FontPicker value="Standard" onChange={ jest.fn() } />);
    fireEvent.click(trigger(document.body));
    await waitFor(() => expect(searchBox()).toBeInTheDocument());

    fireEvent.change(searchBox(), { target: { value: 'gothic' } });
    const names = Array.from(document.querySelectorAll('.figlet-font-item')).map((el) => el.getAttribute('data-font'));
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((n) => (n ?? '').toLowerCase().includes('gothic'))).toBe(true);
    expect(screen.getByText(/匹配 \d+ 款/)).toBeInTheDocument();

    // 无匹配时的空状态
    fireEvent.change(searchBox(), { target: { value: 'zzzz-no-such-font' } });
    expect(document.querySelectorAll('.figlet-font-item').length).toBe(0);
    expect(screen.getByText('没有匹配的字体, 换个关键字试试')).toBeInTheDocument();
  });

  test('点击字体项即选用, 并清空搜索关键字', async () => {
    const { container } = render(<Harness />);
    fireEvent.click(trigger(container));
    await waitFor(() => expect(searchBox()).toBeInTheDocument());

    fireEvent.change(searchBox(), { target: { value: 'Ghost' } });
    const target = item('Ghost');
    expect(target).not.toBeNull();
    fireEvent.click(target as HTMLElement);

    // 选用后按钮文案更新为新字体
    await waitFor(() => expect(trigger(container).textContent).toContain('Ghost'));

    // 重新打开时搜索关键字已清空, 列表回到全部
    fireEvent.click(trigger(container));
    await waitFor(() => expect(searchBox()).toBeInTheDocument());
    expect(searchBox().value).toBe('');
    expect(document.querySelectorAll('.figlet-font-item').length).toBeGreaterThan(100);
  });

  test('搜索框与首字母快捷查询固定在弹窗上部, 只有字体列表滚动', async () => {
    render(<FontPicker value="Standard" onChange={ jest.fn() } />);
    fireEvent.click(trigger(document.body));
    await waitFor(() => expect(searchBox()).toBeInTheDocument());

    const list = document.querySelector('.figlet-font-list') as HTMLElement;
    expect(list).not.toBeNull();
    expect(list.style.overflowY).toBe('auto');      // 唯一滚动的容器
    expect(list.contains(searchBox())).toBe(false); // 搜索框不在滚动区内 -> 固定
    // 首字母按钮也不在滚动区内: 全部 + 数字 + 有字体的字母 (Q/X/Y/Z 无字体, 不显示)
    const chips = document.querySelectorAll('[data-initial]');
    expect(chips.length).toBe(2 + availableLetters().length);
    Array.from(chips).forEach((c) => expect(list.contains(c)).toBe(false));
    // antd 会在两个中文字之间插空格 ("全 部"), 断言前先去掉空白
    const textOf = (key: string) => (document.querySelector(`[data-initial="${key}"]`)?.textContent ?? '').replace(/\s+/g, '');
    expect(textOf('')).toBe('全部');
    expect(textOf(INITIAL_DIGIT)).toBe('数字');
  });

  test('数字 / A-Z 按首字母快捷筛选, 再点一次取消', async () => {
    render(<FontPicker value="Standard" onChange={ jest.fn() } />);
    fireEvent.click(trigger(document.body));
    await waitFor(() => expect(searchBox()).toBeInTheDocument());

    const chip = (key: string) => document.querySelector(`[data-initial="${key}"]`) as HTMLButtonElement;
    const names = () => Array.from(document.querySelectorAll('.figlet-font-item')).map((el) => el.getAttribute('data-font') ?? '');

    // 默认不筛选: 列出全部
    expect(names().length).toBe(FONT_NAMES.length);

    // A: 只留 A 开头的字体
    fireEvent.click(chip('A'));
    await waitFor(() => expect(names().length).toBe(FONT_NAMES.filter((n) => fontInitial(n) === 'A').length));
    expect(names().every((n) => fontInitial(n) === 'A')).toBe(true);
    expect(screen.getByText(`匹配 ${names().length} 款`)).toBeInTheDocument();

    // 再点一次 A: 取消筛选, 回到全部
    fireEvent.click(chip('A'));
    await waitFor(() => expect(names().length).toBe(FONT_NAMES.length));

    // 数字分组: 7 款数字开头的字体
    fireEvent.click(chip(INITIAL_DIGIT));
    await waitFor(() => expect(names().length).toBe(7));
    expect(names().every((n) => fontInitial(n) === '#')).toBe(true);
    expect(names()).toContain('1Row');
    expect(names()).not.toContain('Standard');
    expect(screen.getByText('匹配 7 款')).toBeInTheDocument();

    // 「全部」按钮复位 (排在「数字」前面)
    const chips = Array.from(document.querySelectorAll('[data-initial]')).map((el) => el.getAttribute('data-initial'));
    expect(chips[0]).toBe('');
    expect(chips[1]).toBe(INITIAL_DIGIT);
    fireEvent.click(document.querySelector('[data-initial=""]') as HTMLButtonElement);
    await waitFor(() => expect(names().length).toBe(FONT_NAMES.length));
  });

  test('没有字体的首字母干脆不显示 (Q / X / Y / Z)', async () => {
    render(<FontPicker value="Standard" onChange={ jest.fn() } />);
    fireEvent.click(trigger(document.body));
    await waitFor(() => expect(searchBox()).toBeInTheDocument());

    for (const key of [ 'Q', 'X', 'Y', 'Z' ]) {
      expect(FONT_NAMES.some((n) => fontInitial(n) === key)).toBe(false);
      expect(document.querySelector(`[data-initial="${key}"]`)).toBeNull();
    }
    // 有字体的字母都在
    for (const key of availableLetters()) {
      expect(document.querySelector(`[data-initial="${key}"]`)).not.toBeNull();
    }
  });

  test('首字母与关键字可叠加筛选', async () => {
    render(<FontPicker value="Standard" onChange={ jest.fn() } />);
    fireEvent.click(trigger(document.body));
    await waitFor(() => expect(searchBox()).toBeInTheDocument());

    const chip = (key: string) => document.querySelector(`[data-initial="${key}"]`) as HTMLButtonElement;
    const names = () => Array.from(document.querySelectorAll('.figlet-font-item')).map((el) => el.getAttribute('data-font') ?? '');

    fireEvent.click(chip('S'));
    fireEvent.change(searchBox(), { target: { value: 'shadow' } });
    await waitFor(() => expect(names().length).toBeGreaterThan(0));
    expect(names().every((n) => fontInitial(n) === 'S' && n.toLowerCase().includes('shadow'))).toBe(true);
    expect(names()).toContain('Shadow');
    expect(names()).not.toContain('ANSI Shadow');   // 首字母是 A, 被 S 分组过滤掉

    // 取消首字母筛选后, 名称含 shadow 的字体全部回来
    fireEvent.click(chip('S'));
    await waitFor(() => expect(names()).toContain('ANSI Shadow'));
    expect(names().length).toBeGreaterThan(names().filter((n) => fontInitial(n) === 'S').length);
  });

  test('当前字体项高亮并带「当前字体」标记', async () => {
    render(<FontPicker value="Ghost" onChange={ jest.fn() } />);
    fireEvent.click(trigger(document.body));
    await waitFor(() => expect(searchBox()).toBeInTheDocument());

    const cur = item('Ghost');
    expect(cur?.className).toContain('figlet-font-item-active');
    expect(cur?.textContent).toContain('当前字体');
    // 其他字体项不带高亮
    expect(item('Standard')?.className).not.toContain('figlet-font-item-active');
  });
});
