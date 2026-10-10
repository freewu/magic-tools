import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import IPConvert from './index';
import { copyTextToClipboard } from '../../lib';
jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  copyTextToClipboard: jest.fn().mockResolvedValue(undefined),
}));
afterEach(() => cleanup());

const norm = (s: string) => s.replace(/\s+/g, '');

/** 顶部 IPv4 输入框 (默认语言 zh-CN) */
const ipInput = (): HTMLInputElement =>
  screen.getByPlaceholderText('IPv4 地址, 如 192.168.1.1') as HTMLInputElement;
/** 右侧整数输入框 */
const intInput = (): HTMLInputElement =>
  screen.getByPlaceholderText('十进制整数, 支持 0x 前缀') as HTMLInputElement;

const typeIp = (v: string) => fireEvent.change(ipInput(), { target: { value: v } });
const typeInt = (v: string) => fireEvent.change(intInput(), { target: { value: v } });

/** 顶部示例标签 */
const sampleTags = (c: HTMLElement) => Array.from(c.querySelectorAll('.ant-tag')) as HTMLElement[];

/** 结果区 (Hash 风格) 里 label 对应的只读输入框 */
const resultInput = (c: HTMLElement, label: string): HTMLInputElement => {
  const rows = Array.from(c.querySelectorAll('.ant-form-item'));
  const row = rows.find((r) => (r.querySelector('label')?.textContent ?? '').trim() === label);
  if (!row) throw new Error(`未找到结果行: ${label}`);
  return row.querySelector('input') as HTMLInputElement;
};
const resultValue = (c: HTMLElement, label: string): string => resultInput(c, label).value;

/** 清除按钮 (antd 会在两个汉字之间插空格, 需归一化后再比对) */
const clearButton = () => screen.getByRole('button', { name: (n: string) => norm(n) === '清除' });

describe('IPConvert 基础互转', () => {
  test('初始即显示结果区 (HEX / BIN / IPv6 行), 只是值为空', () => {
    const { container } = render(<IPConvert />);
    expect(ipInput()).toHaveValue('');
    expect(intInput()).toHaveValue('');
    // 结果区常驻: 标签都在, 值为空串
    expect(within(container).getByText('HEX')).toBeInTheDocument();
    expect(within(container).getByText('对应的 IPv6 写法')).toBeInTheDocument();
    expect(resultValue(container, 'HEX')).toBe('');
    expect(resultValue(container, 'BIN')).toBe('');
    expect(container.querySelectorAll('.ant-form-item')).toHaveLength(8);
    // 6 条 IPv6 写法行也都占位显示, 值为空
    for (const label of [ 'IPv4 映射地址', 'IPv4 映射地址 (十六进制)', 'IPv4 兼容地址 (已废弃)', '6to4', 'NAT64 / DNS64', '完整展开' ]) {
      expect(resultValue(container, label)).toBe('');
    }
  });

  test('输入 IPv4 后自动填整数并给出 HEX / BIN', async () => {
    const { container } = render(<IPConvert />);
    typeIp('192.168.1.1');
    await waitFor(() => expect(intInput()).toHaveValue('3232235777'));
    expect(resultValue(container, 'HEX')).toBe('0xC0A80101');
    expect(resultValue(container, 'BIN')).toBe('11000000101010000000000100000001');
  });

  test('输入整数后自动填 IPv4', async () => {
    render(<IPConvert />);
    typeInt('3232235777');
    await waitFor(() => expect(ipInput()).toHaveValue('192.168.1.1'));
  });

  test('清除按钮清空输入, 结果区保留但值清空', async () => {
    const { container } = render(<IPConvert />);
    typeIp('1.2.3.4');
    await waitFor(() => expect(resultValue(container, 'HEX')).toBe('0x01020304'));

    fireEvent.click(clearButton());
    await waitFor(() => expect(ipInput()).toHaveValue(''));
    expect(intInput()).toHaveValue('');
    expect(within(container).getByText('HEX')).toBeInTheDocument();
    expect(resultValue(container, 'HEX')).toBe('');
    expect(resultValue(container, 'IPv4 映射地址')).toBe('');
  });
});

describe('IPConvert 展示效果 (参考 Hash 值计算)', () => {
  test('顶部为彩色示例标签, 独占一行且在输入框上方', () => {
    const { container } = render(<IPConvert />);
    const tags = sampleTags(container);
    expect(tags.length).toBeGreaterThan(0);
    // antd Tag 的彩色底纹走 inline style
    expect(tags[0].getAttribute('style') ?? '').toMatch(/background/);
    // 4 色循环: 前 4 个标签底色互不相同
    expect(new Set(tags.slice(0, 4).map((el) => el.getAttribute('style'))).size).toBe(4);
    // 独占一行: antd Space 默认 inline-flex, 会与下一行的输入框挤在同一行
    const row = tags[0].closest('.ant-space') as HTMLElement;
    expect(row).toBeTruthy();
    expect(row.style.display).toBe('flex');
    // 位于输入框上方
    expect(ipInput().compareDocumentPosition(tags[0]) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  test('点击示例标签填入地址并完成换算', async () => {
    const { container } = render(<IPConvert />);
    const tag = sampleTags(container).find((el) => el.textContent === '192.168.1.1') as HTMLElement;
    expect(tag).toBeTruthy();
    fireEvent.click(tag);
    await waitFor(() => expect(ipInput()).toHaveValue('192.168.1.1'));
    expect(intInput()).toHaveValue('3232235777');
    await waitFor(() => expect(resultValue(container, 'HEX')).toBe('0xC0A80101'));
  });

  test('结果用只读输入框展示 (HEX / BIN / IPv6), 点击即复制并提示', async () => {
    const { container } = render(<IPConvert />);
    typeIp('192.168.1.1');
    await waitFor(() => expect(resultValue(container, 'HEX')).toBe('0xC0A80101'));

    const hex = resultInput(container, 'HEX');
    expect(hex.readOnly).toBe(true);
    // Hash 风格: 结果框带字符计数
    expect(container.querySelectorAll('.ant-input-show-count-suffix').length).toBeGreaterThan(0);

    fireEvent.click(hex);
    await waitFor(() => expect(copyTextToClipboard).toHaveBeenCalledWith('0xC0A80101'));
    expect(await screen.findByText('复制到粘贴板成功！！！')).toBeInTheDocument();
  });
});

describe('IPConvert IPv6 写法', () => {
  test('合法 IPv4 时列出 6 种 IPv6 写法', async () => {
    const { container } = render(<IPConvert />);
    typeIp('192.168.1.1');
    await waitFor(() => expect(within(container).getByText('对应的 IPv6 写法')).toBeInTheDocument());
    expect(resultValue(container, 'IPv4 映射地址')).toBe('::ffff:192.168.1.1');
    expect(resultValue(container, 'IPv4 映射地址 (十六进制)')).toBe('::ffff:c0a8:101');
    expect(resultValue(container, 'IPv4 兼容地址 (已废弃)')).toBe('::192.168.1.1');
    expect(resultValue(container, '6to4')).toBe('2002:c0a8:101::');
    expect(resultValue(container, 'NAT64 / DNS64')).toBe('64:ff9b::192.168.1.1');
    expect(resultValue(container, '完整展开')).toBe('0000:0000:0000:0000:0000:ffff:c0a8:0101');
    // 6 条写法 + HEX / BIN
    expect(container.querySelectorAll('.ant-form-item')).toHaveLength(8);
  });

  test('由整数推导出的 IPv6 写法与直接输入 IPv4 一致', async () => {
    const { container } = render(<IPConvert />);
    typeInt('16909060'); // 1.2.3.4
    await waitFor(() => expect(ipInput()).toHaveValue('1.2.3.4'));
    expect(resultValue(container, 'IPv4 映射地址')).toBe('::ffff:1.2.3.4');
    expect(resultValue(container, '6to4')).toBe('2002:102:304::');
    expect(resultValue(container, '完整展开')).toBe('0000:0000:0000:0000:0000:ffff:0102:0304');
  });

  test('非法地址时结果区仍显示, 值清空不残留上次结果', async () => {
    const { container } = render(<IPConvert />);
    typeIp('192.168.1.1');
    await waitFor(() => expect(resultValue(container, 'HEX')).toBe('0xC0A80101'));

    typeIp('256.1.1.1');
    await waitFor(() => expect(resultValue(container, 'HEX')).toBe(''));
    expect(resultValue(container, 'BIN')).toBe('');
    expect(within(container).getByText('对应的 IPv6 写法')).toBeInTheDocument();
    expect(resultValue(container, 'IPv4 映射地址')).toBe('');

    // 重新输入合法地址后恢复
    typeIp('1.2.3.4');
    await waitFor(() => expect(resultValue(container, 'IPv4 映射地址')).toBe('::ffff:1.2.3.4'));
  });

  test('清空输入后 IPv6 写法行依然占位 (值为空)', async () => {
    const { container } = render(<IPConvert />);
    typeIp('192.168.1.1');
    await waitFor(() => expect(resultValue(container, 'IPv4 映射地址')).toBe('::ffff:192.168.1.1'));

    typeIp('');
    await waitFor(() => expect(ipInput()).toHaveValue(''));
    expect(within(container).getByText('对应的 IPv6 写法')).toBeInTheDocument();
    expect(resultValue(container, '6to4')).toBe('');
    expect(resultValue(container, '完整展开')).toBe('');
  });
});
