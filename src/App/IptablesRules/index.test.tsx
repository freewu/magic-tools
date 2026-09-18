import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { message } from 'antd';
import { saveTextFile } from '../../lib/tauri';
import IptablesRules from './index';
import { SAMPLE_IPTABLES } from './data';

jest.mock('../../lib/tauri', () => ({
  ...jest.requireActual('../../lib/tauri'),
  saveTextFile: jest.fn().mockResolvedValue(true),
}));

const mockSave = saveTextFile as jest.Mock;

/** 规则文本框 */
const codeBox = (): HTMLTextAreaElement =>
  screen.getByPlaceholderText(/粘贴 iptables 命令/) as HTMLTextAreaElement;
/** 当前激活的页签面板 (取文本最长的一个, 规避动画期双面板) */
const pane = (): HTMLElement => {
  const list = Array.from(document.querySelectorAll('.ant-tabs-tabpane-active')) as HTMLElement[];
  return list.sort((a, b) => (b.textContent ?? '').length - (a.textContent ?? '').length)[0];
};
/** 页签 */
const tab = (name: RegExp | string) => screen.getByRole('tab', { name });
/** 按钮 (antd 会在恰好两个汉字间插空格, 图标会加在可访问名前面) */
const btn = (name: string): HTMLElement =>
  screen.getByRole('button', { name: new RegExp(name.split('').map((c) => (c === ' ' ? '\\s+' : c)).join('\\s*')) });
/** 表格行 */
const rows = (): HTMLElement[] => Array.from(document.querySelectorAll('.ant-table-tbody tr.ant-table-row')) as HTMLElement[];
/** 生成页签里的字段容器 */
const field = (label: string): HTMLElement => {
  const hit = screen.getAllByText(label)
    .map((n) => n.parentElement)
    .find((p) => p !== null && p.querySelector('input, .ant-select') !== null);
  if (!hit) throw new Error(`未找到字段: ${label}`);
  return hit;
};
const fieldInput = (label: string): HTMLInputElement => field(label).querySelector('input') as HTMLInputElement;
const openSelect = (label: string) => fireEvent.mouseDown(field(label).querySelector('.ant-select-selector') as HTMLElement);
/** 下拉选项 */
const pickOption = (label: string) => {
  const option = screen.getAllByText(label).find((el) => el.closest('.ant-select-item-option'));
  if (!option) throw new Error(`未找到下拉项: ${label}`);
  fireEvent.click(option);
};
/** 结果面板文本 */
const resultText = (): string => pane().textContent ?? '';

const parseSample = () => {
  fireEvent.change(codeBox(), { target: { value: SAMPLE_IPTABLES } });
  fireEvent.click(btn('解析'));
};

describe('IptablesRules 页面交互', () => {
  beforeEach(() => {
    message.destroy();
    mockSave.mockClear();
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
  });

  test('默认展示「解析」页签, 共两个页签', () => {
    render(<IptablesRules />);
    expect(tab('解析')).toHaveAttribute('aria-selected', 'true');
    expect(tab('生成')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(2);
  });

  test('未输入内容点解析给出提示', () => {
    render(<IptablesRules />);
    fireEvent.click(btn('解析'));
    expect(document.querySelector('.ant-message')?.textContent).toContain('请先输入 iptables 规则文本');
    expect(rows()).toHaveLength(0);
  });

  test('解析示例文本: 13 条规则, 无错误行', () => {
    render(<IptablesRules />);
    parseSample();
    expect(rows()).toHaveLength(13);
    expect(resultText()).toContain('共 13 条规则');
    expect(document.querySelector('.ant-alert-warning')).toBeNull();
  });

  test('解析结果展示表 / 链 / 匹配条件 / 动作 / 备注', () => {
    render(<IptablesRules />);
    parseSample();
    const all = resultText();
    expect(all).toContain('nat / PREROUTING');
    expect(all).toContain('-p tcp');
    expect(all).toContain('--dport 8080');
    expect(all).toContain('-j REDIRECT --to-ports 80');
    expect(all).toContain('--state ESTABLISHED,RELATED');
    expect(all).toContain('SSH');
    // iptables-save 的链策略行解析为 -P (操作列) 与策略 (动作列)
    expect(all).toContain('-P');
    expect(all).toContain('filter / FORWARD');
    expect(all).toContain(':FORWARD DROP');
  });

  test('无法识别的行给出警告并列出原文', () => {
    render(<IptablesRules />);
    fireEvent.change(codeBox(), { target: { value: 'iptables -A INPUT -j ACCEPT\n这不是规则' } });
    fireEvent.click(btn('解析'));
    expect(rows()).toHaveLength(1);
    const alert = document.querySelector('.ant-alert-warning') as HTMLElement;
    expect(alert.textContent).toContain('以下 1 行无法识别为 iptables 规则:');
    expect(alert.textContent).toContain('这不是规则');
  });

  test('未建模的参数给出橙色标记', () => {
    render(<IptablesRules />);
    fireEvent.change(codeBox(), { target: { value: 'iptables -A INPUT --tcp-flags SYN,ACK SYN -j DROP' } });
    fireEvent.click(btn('解析'));
    expect(resultText()).toContain('1 个未识别参数');
  });

  test('「载入到生成」把解析结果带入生成表单', () => {
    render(<IptablesRules />);
    fireEvent.change(codeBox(), { target: { value: 'iptables -t nat -A PREROUTING -p tcp --dport 8080 -j REDIRECT --to-ports 80' } });
    fireEvent.click(btn('解析'));
    fireEvent.click(btn('载入到生成'));
    expect(tab('生成')).toHaveAttribute('aria-selected', 'true');
    expect(resultText()).toContain('iptables -t nat -A PREROUTING -p tcp --dport 8080 -j REDIRECT --to-ports 80');
    expect(fieldInput('链名')).toHaveValue('PREROUTING');
  });

  test('示例 / 清空 按钮', () => {
    render(<IptablesRules />);
    fireEvent.click(btn('示例'));
    expect(codeBox()).toHaveValue(SAMPLE_IPTABLES);
    fireEvent.click(btn('清空'));
    expect(codeBox()).toHaveValue('');
    expect(rows()).toHaveLength(0);
  });

  test('生成页签默认生成放行规则并提示追加顺序风险', () => {
    render(<IptablesRules />);
    fireEvent.click(tab('生成'));
    const all = resultText();
    expect(all).toContain('iptables -t filter -A INPUT -j ACCEPT');
    expect(all).toContain('-A INPUT -j ACCEPT');
    expect(all).toContain('追加规则会放在链末尾');
    expect(all).toContain('iptables -t filter -nL INPUT --line-numbers');
    expect(all).toContain('iptables -t filter -D INPUT -j ACCEPT');
    expect(all).toContain('netfilter-persistent save');
  });

  test('修改目的端口后命令实时更新', () => {
    render(<IptablesRules />);
    fireEvent.click(tab('生成'));
    fireEvent.change(fieldInput('目的端口'), { target: { value: '22' } });
    // 协议是下拉框, 直接改输入值不会生效, 需要点选项
    expect(resultText()).toContain('iptables -t filter -A INPUT --dport 22 -j ACCEPT');
    openSelect('协议');
    pickOption('tcp');
    expect(resultText()).toContain('iptables -t filter -A INPUT -p tcp --dport 22 -j ACCEPT');
  });

  test('非法端口给出校验错误且不生成命令', () => {
    render(<IptablesRules />);
    fireEvent.click(tab('生成'));
    fireEvent.change(fieldInput('目的端口'), { target: { value: '70000' } });
    const all = resultText();
    expect(all).toContain('校验未通过, 请检查以下问题:');
    expect(all).toContain('目的端口格式不正确');
    expect(all).not.toContain('iptables -t filter -A INPUT -j ACCEPT');
    expect((screen.getByRole('button', { name: /保存为/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  test('链名为空时提示且禁用复制与保存', () => {
    render(<IptablesRules />);
    fireEvent.click(tab('生成'));
    fireEvent.change(fieldInput('链名'), { target: { value: '' } });
    expect(resultText()).toContain('链不能为空');
    expect((screen.getByRole('button', { name: /复制全部/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  test('-P 默认策略只允许 ACCEPT / DROP 并生成对应命令', () => {
    render(<IptablesRules />);
    fireEvent.click(tab('生成'));
    openSelect('操作');
    pickOption('默认策略 (-P)');
    fireEvent.change(fieldInput('链名'), { target: { value: 'FORWARD' } });
    openSelect('默认策略');
    pickOption('DROP');
    expect(resultText()).toContain('iptables -t filter -P FORWARD DROP');
  });

  test('多选连接状态会生成 --state 匹配', () => {
    render(<IptablesRules />);
    fireEvent.click(tab('生成'));
    openSelect('连接状态');
    pickOption('ESTABLISHED');
    expect(resultText()).toContain('-m state --state ESTABLISHED');
  });

  test('生成页签「示例」载入端口转发配置', () => {
    render(<IptablesRules />);
    fireEvent.click(tab('生成'));
    fireEvent.click(btn('示例'));
    const all = resultText();
    expect(all).toContain('iptables -t nat -A PREROUTING -p tcp --dport 8080 -m comment --comment 端口转发 -j DNAT --to-destination 10.0.0.5:8080');
    expect(all).toContain('-A PREROUTING -p tcp --dport 8080 -m comment --comment 端口转发 -j DNAT --to-destination 10.0.0.5:8080');
    expect(all).toContain('NAT 转发需要开启内核转发');
  });

  test('「重置」恢复默认配置', () => {
    render(<IptablesRules />);
    fireEvent.click(tab('生成'));
    fireEvent.click(btn('示例'));
    fireEvent.click(btn('重置'));
    expect(fieldInput('链名')).toHaveValue('INPUT');
    expect(resultText()).toContain('iptables -t filter -A INPUT -j ACCEPT');
  });

  test('「复制」按钮复制该段指令, 点击代码行也可复制', () => {
    render(<IptablesRules />);
    fireEvent.click(tab('生成'));
    const writeText = (navigator as unknown as { clipboard: { writeText: jest.Mock } }).clipboard.writeText;
    const copyButtons = screen.getAllByRole('button', { name: /copy\s*复\s*制$/ });
    fireEvent.click(copyButtons[0]);
    expect(writeText).toHaveBeenCalledWith('iptables -t filter -A INPUT -j ACCEPT');
    expect(document.querySelector('.ant-message')?.textContent).toContain('复制到粘贴板成功!!!');
    writeText.mockClear();
    fireEvent.click(screen.getByText('iptables -t filter -nL INPUT --line-numbers'));
    expect(writeText).toHaveBeenCalledWith('iptables -t filter -nL INPUT --line-numbers');
  });

  test('「复制全部」汇总所有指令', () => {
    render(<IptablesRules />);
    fireEvent.click(tab('生成'));
    const writeText = (navigator as unknown as { clipboard: { writeText: jest.Mock } }).clipboard.writeText;
    fireEvent.click(btn('复制全部'));
    const text = writeText.mock.calls[0][0] as string;
    expect(text).toContain('iptables -t filter -A INPUT -j ACCEPT');
    expect(text).toContain('iptables -t filter -D INPUT 1');
    expect(text).toContain('netfilter-persistent save');
  });

  test('「保存为 .sh」导出 shell 脚本', async () => {
    render(<IptablesRules />);
    fireEvent.click(tab('生成'));
    fireEvent.click(screen.getByRole('button', { name: /save\s*保\s*存\s*为/ }));
    await screen.findByText('保存成功');
    expect(mockSave).toHaveBeenCalledWith('iptables-rules.sh', expect.stringContaining('#!/bin/bash'), '保存为 .sh', {
      filterName: 'Shell 脚本', extensions: [ 'sh' ],
    });
  });
});
