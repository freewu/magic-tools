import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import CiscoType7 from './index';
import { copyTextToClipboard } from '../../lib';
jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
}));
afterEach(() => cleanup());

const norm = (s: string) => s.replace(/\s+/g, '');
const buttons = (c: HTMLElement) => Array.from(c.querySelectorAll('button')).map((b) => norm(b.textContent ?? ''));
const areas = (c: HTMLElement) => Array.from(c.querySelectorAll('textarea')) as HTMLTextAreaElement[];
const btn = (text: string) => screen.getByRole('button', { name: (n: string) => norm(n).includes(norm(text)) });

describe('CiscoType7 页面', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('渲染参数控件与操作区 (按钮 + 输入/选择)', () => {
    const { container } = render(<CiscoType7 />);
    // 页面有实际内容
    expect(norm(container.textContent ?? '')).not.toBe('');
    // 至少一个操作按钮与一个可输入控件 (textarea/input/select)
    expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('textarea, input, .ant-select').length).toBeGreaterThan(0);
  });

  test('输入内容后点击操作按钮不抛异常', () => {
    const { container } = render(<CiscoType7 />);
    const editable = (container.querySelector('textarea') ?? container.querySelector('input')) as HTMLInputElement | HTMLTextAreaElement | null;
    if (editable) fireEvent.change(editable, { target: { value: 'test' } });
    const btn0 = buttons(container).length ? Array.from(container.querySelectorAll('button'))[0] as HTMLButtonElement : null;
    if (btn0) expect(() => fireEvent.click(btn0)).not.toThrow();
  });

  test('加密 -> 解密 往返一致 (Rabbit 样式: 上框明文 / 下框 Type 7)', async () => {
    const { container } = render(<CiscoType7 />);
    const [ plain, type7 ] = areas(container);

    fireEvent.change(plain, { target: { value: 'cisco' } });
    fireEvent.click(btn('加密为 Type 7'));
    await waitFor(() => expect(type7.value).not.toBe(''));
    // 2 位盐偏移 + 大写 hex
    expect(type7.value).toMatch(/^[0-9A-F]{2}([0-9A-F]{2})+$/);

    // 改掉上框, 再点解密: 应从上框下方那个框 (Type 7) 还原出原文
    fireEvent.change(plain, { target: { value: '覆盖内容' } });
    fireEvent.click(btn('解密为明文'));
    await waitFor(() => expect(plain.value).toBe('cisco'));
  });

  test('清除按钮同时清空上下两框', async () => {
    const { container } = render(<CiscoType7 />);
    const [ plain, type7 ] = areas(container);

    fireEvent.change(plain, { target: { value: 'cisco' } });
    fireEvent.click(btn('加密为 Type 7'));
    await waitFor(() => expect(type7.value).not.toBe(''));

    fireEvent.click(btn('清除'));
    await waitFor(() => expect(plain.value).toBe(''));
    expect(type7.value).toBe('');
  });

  test('非法 Type 7 串给出盐偏移错误提示', async () => {
    const { container } = render(<CiscoType7 />);
    const type7 = areas(container)[1];

    fireEvent.change(type7, { target: { value: 'GG11' } });
    fireEvent.click(btn('解密为明文'));
    expect(await screen.findByText(/Type 7 盐偏移不合法/)).toBeInTheDocument();
  });

  test('双击文本框复制内容到粘贴板', async () => {
    const { container } = render(<CiscoType7 />);
    const [ plain, type7 ] = areas(container);

    fireEvent.change(plain, { target: { value: 'cisco' } });
    fireEvent.doubleClick(plain);
    await waitFor(() => expect(copyTextToClipboard).toHaveBeenCalledWith('cisco'));

    fireEvent.doubleClick(type7);
    // 下框为空时不复制 (trim 后为空)
    expect(copyTextToClipboard).toHaveBeenCalledTimes(1);
  });
});
