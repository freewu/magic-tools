import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import IPConvert from './index';

/** 顶部 IPv4 输入框 (默认语言 zh-CN) */
const ipInput = (): HTMLInputElement =>
  screen.getByPlaceholderText('IPv4 地址, 如 192.168.1.1') as HTMLInputElement;
/** 右侧整数输入框 */
const intInput = (): HTMLInputElement =>
  screen.getByPlaceholderText('十进制整数, 支持 0x 前缀') as HTMLInputElement;

const typeIp = (v: string) => fireEvent.change(ipInput(), { target: { value: v } });
const typeInt = (v: string) => fireEvent.change(intInput(), { target: { value: v } });

/** 读取 IPv6 卡片里的各行 (标签 -> 值) */
const ipv6Rows = (container: HTMLElement, label: string): string => {
  const rows = Array.from(container.querySelectorAll('.ant-form-item'));
  const row = rows.find((r) => r.querySelector('label')?.textContent === label);
  if (!row) throw new Error(`未找到 IPv6 行: ${label}`);
  return (row.querySelector('code')?.textContent ?? '').trim();
};

describe('IPConvert 基础互转', () => {
  test('初始只显示两个输入框, HEX / BIN 与 IPv6 卡片都不出现', () => {
    const { container } = render(<IPConvert />);
    expect(ipInput()).toHaveValue('');
    expect(intInput()).toHaveValue('');
    expect(within(container).queryByText('HEX')).not.toBeInTheDocument();
    expect(within(container).queryByText('对应的 IPv6 写法')).not.toBeInTheDocument();
  });

  test('输入 IPv4 后自动填整数并给出 HEX / BIN', async () => {
    const { container } = render(<IPConvert />);
    typeIp('192.168.1.1');
    await waitFor(() => expect(intInput()).toHaveValue('3232235777'));
    expect(within(container).getByText('0xC0A80101')).toBeInTheDocument();
    expect(within(container).getByText('11000000101010000000000100000001')).toBeInTheDocument();
  });

  test('输入整数后自动填 IPv4', async () => {
    render(<IPConvert />);
    typeInt('3232235777');
    await waitFor(() => expect(ipInput()).toHaveValue('192.168.1.1'));
  });
});

describe('IPConvert IPv6 写法', () => {
  test('合法 IPv4 时列出 6 种 IPv6 写法', async () => {
    const { container } = render(<IPConvert />);
    typeIp('192.168.1.1');
    await waitFor(() => expect(within(container).getByText('对应的 IPv6 写法')).toBeInTheDocument());
    expect(ipv6Rows(container, 'IPv4 映射地址')).toBe('::ffff:192.168.1.1');
    expect(ipv6Rows(container, 'IPv4 映射地址 (十六进制)')).toBe('::ffff:c0a8:101');
    expect(ipv6Rows(container, 'IPv4 兼容地址 (已废弃)')).toBe('::192.168.1.1');
    expect(ipv6Rows(container, '6to4')).toBe('2002:c0a8:101::');
    expect(ipv6Rows(container, 'NAT64 / DNS64')).toBe('64:ff9b::192.168.1.1');
    expect(ipv6Rows(container, '完整展开')).toBe('0000:0000:0000:0000:0000:ffff:c0a8:0101');
    // 6 条写法 + 提示文案
    expect(container.querySelectorAll('.ant-form-item')).toHaveLength(8); // HEX / BIN + 6 条 IPv6
  });

  test('由整数推导出的 IPv6 写法与直接输入 IPv4 一致', async () => {
    const { container } = render(<IPConvert />);
    typeInt('16909060'); // 1.2.3.4
    await waitFor(() => expect(ipInput()).toHaveValue('1.2.3.4'));
    expect(ipv6Rows(container, 'IPv4 映射地址')).toBe('::ffff:1.2.3.4');
    expect(ipv6Rows(container, '6to4')).toBe('2002:102:304::');
    expect(ipv6Rows(container, '完整展开')).toBe('0000:0000:0000:0000:0000:ffff:0102:0304');
  });

  test('非法地址时收起 IPv6 卡片', async () => {
    const { container } = render(<IPConvert />);
    typeIp('192.168.1.1');
    await waitFor(() => expect(within(container).getByText('对应的 IPv6 写法')).toBeInTheDocument());
    typeIp('256.1.1.1');
    await waitFor(() => expect(within(container).queryByText('对应的 IPv6 写法')).not.toBeInTheDocument());
    // 清空后同样收起
    typeIp('192.168.1.1');
    await waitFor(() => expect(within(container).getByText('对应的 IPv6 写法')).toBeInTheDocument());
    typeIp('');
    await waitFor(() => expect(within(container).queryByText('对应的 IPv6 写法')).not.toBeInTheDocument());
  });
});
