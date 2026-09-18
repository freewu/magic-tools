import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { message } from 'antd';
import { saveTextFile } from '../../lib/tauri';
import TcRules from './index';
import { TC_PRESETS } from './data';

jest.mock('../../lib/tauri', () => ({
  ...jest.requireActual('../../lib/tauri'),
  saveTextFile: jest.fn().mockResolvedValue(true),
}));

const mockSave = saveTextFile as jest.Mock;

let container: HTMLElement;
const setup = () => { container = render(<TcRules />).container; };
/** 页面文本 */
const view = (): string => container.textContent ?? '';
/** 按钮 */
const btn = (name: string): HTMLElement =>
  screen.getByRole('button', { name: new RegExp(name.split('').map((c) => (c === ' ' ? '\\s+' : c)).join('\\s*')) });
/** 字段容器 */
const field = (label: string): HTMLElement => {
  const hit = screen.getAllByText(label)
    .map((n) => n.parentElement)
    .find((p) => p !== null && p.querySelector('input, .ant-select, .ant-switch') !== null);
  if (!hit) throw new Error(`未找到字段: ${label}`);
  return hit;
};
const fieldInput = (label: string): HTMLInputElement => field(label).querySelector('input') as HTMLInputElement;
const openSelect = (label: string) => fireEvent.mouseDown(field(label).querySelector('.ant-select-selector') as HTMLElement);
const pickOption = (label: string | RegExp) => {
  const option = screen.getAllByText(label).find((el) => el.closest('.ant-select-item-option'));
  if (!option) throw new Error(`未找到下拉项: ${String(label)}`);
  fireEvent.click(option);
};
const selectOption = (fieldLabel: string, option: string | RegExp) => {
  openSelect(fieldLabel);
  pickOption(option);
};
const setField = (label: string, value: string) => fireEvent.change(fieldInput(label), { target: { value } });

describe('TcRules 页面交互', () => {
  beforeEach(() => {
    message.destroy();
    mockSave.mockClear();
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
  });

  test('默认 HTB 配置生成根类 / 限速类 / sfq 与提示', () => {
    setup();
    const all = view();
    expect(document.querySelector('.ant-alert-info')).toBeNull();
    expect(all).toContain('tc qdisc add dev eth0 root handle 1: htb default 10');
    expect(all).toContain('tc class add dev eth0 parent 1: classid 1:1 htb rate 100mbit ceil 100mbit');
    expect(all).toContain('tc class add dev eth0 parent 1:1 classid 1:10 htb rate 10mbit ceil 10mbit prio 1');
    expect(all).toContain('tc qdisc add dev eth0 parent 1:10 handle 100: sfq perturb 10');
    expect(all).toContain('需要 root 权限执行');
    expect(all).toContain('tc 规则重启后失效');
    expect(all).toContain('tc qdisc del dev eth0 root 2>/dev/null || true');
    expect(all).toContain('tc -s qdisc show dev eth0');
  });

  test('切换 netem 后填写延迟与丢包', () => {
    setup();
    selectOption('限速方式', /netem/);
    expect(view()).toContain('请至少填写一项 netem 参数');
    setField('延迟 (ms)', '100');
    setField('丢包 (%)', '1');
    const all = view();
    expect(all).toContain('tc qdisc add dev eth0 root netem delay 100ms loss 1%');
    expect(all).toContain('# 参数微调时用 change');
    expect(all).toContain('netem / tbf 作用于整张网卡');
    expect(all).not.toContain('please check');
  });

  test('切换 tbf 后自动计算 burst', () => {
    setup();
    selectOption('限速方式', /TBF/);
    expect(view()).toContain('tc qdisc add dev eth0 root tbf rate 10mbit burst 100kbit latency 400ms');
    setField('突发 (burst)', '32');
    setField('延迟 (latency)', '200');
    expect(view()).toContain('tc qdisc add dev eth0 root tbf rate 10mbit burst 32kbit latency 200ms');
  });

  test('入口方向先生成 ifb 准备与 mirred 重定向指令', () => {
    setup();
    selectOption('方向', /入口/);
    const all = view();
    expect(all).toContain('ifb 设备');
    expect(all).toContain('ip link show ifb0 >/dev/null 2>&1 || modprobe ifb numifbs=1');
    expect(all).toContain('tc qdisc add dev eth0 handle ffff: ingress');
    expect(all).toContain('tc filter add dev eth0 parent ffff: protocol ip u32 match u32 0 0 action mirred egress redirect dev ifb0');
    expect(all).toContain('tc qdisc add dev ifb0 root handle 1: htb default 10');
    expect(all).toContain('入口限速需要 ifb 内核模块');
    expect(all).toContain('tc qdisc del dev eth0 ingress 2>/dev/null || true');
  });

  test('网卡为空时校验失败并禁用复制与保存', () => {
    setup();
    setField('网卡', '');
    const all = view();
    expect(all).toContain('校验未通过, 请检查以下问题:');
    expect(all).toContain('请填写网卡名称');
    expect((screen.getByRole('button', { name: /复制全部/ }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /保存为/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  test('限速值大于总带宽时给出校验错误', () => {
    setup();
    setField('总带宽', '5');
    expect(view()).toContain('限速值不能大于总带宽');
  });

  test('按端口分流会生成 u32 filter 与默认类', () => {
    setup();
    selectOption('分流条件', /按端口/);
    setField('端口', '443');
    const all = view();
    expect(all).toContain('tc class add dev eth0 parent 1:1 classid 1:30 htb rate 90mbit ceil 100mbit');
    expect(all).toContain('tc filter add dev eth0 protocol ip parent 1:0 prio 1 u32 match ip protocol 6 0xff match ip dport 443 0xffff flowid 1:10');
    expect(all).toContain('只有 HTB 支持按条件分流');
  });

  test('默认类与限速类相同会报错', () => {
    setup();
    selectOption('分流条件', /按端口/);
    setField('默认类编号', '10');
    expect(view()).toContain('默认类不能与限速类相同');
  });

  test('按目标 IP 分流校验地址格式', () => {
    setup();
    selectOption('分流条件', /按目标 IP/);
    setField('目标 IP / 网段', '10.0.0.256');
    expect(view()).toContain('IP / 网段格式不正确');
    setField('目标 IP / 网段', '10.0.0.5');
    expect(view()).toContain('tc filter add dev eth0 protocol ip parent 1:0 prio 1 u32 match ip dst 10.0.0.5 flowid 1:10');
  });

  test('关闭 sfq 后不再生成队列指令', () => {
    setup();
    expect(view()).toContain('sfq perturb 10');
    fireEvent.click(screen.getByRole('switch'));
    expect(view()).not.toContain('sfq perturb 10');
  });

  test('场景示例会应用预设参数', () => {
    setup();
    selectOption('场景示例', /模拟 4G 网络/);
    const all = view();
    expect(all).toContain('模拟 4G 网络 (延迟 100ms)');
    expect(all).toContain('tc qdisc add dev eth0 root netem delay 100ms 20ms loss 1%');
    expect(document.querySelector('.ant-message')?.textContent).toContain('已应用示例: 模拟 4G 网络 (延迟 100ms)');
  });

  test('全部预设都能生成指令且无校验错误', () => {
    for (const p of TC_PRESETS) {
      setup();
      selectOption('场景示例', p.name);
      expect(view()).not.toContain('校验未通过, 请检查以下问题:');
      expect(view()).toContain('tc ');
    }
  });

  test('「重置」恢复默认配置', () => {
    setup();
    selectOption('限速方式', /netem/);
    fireEvent.click(btn('重置'));
    expect(view()).toContain('tc qdisc add dev eth0 root handle 1: htb default 10');
    expect(fieldInput('网卡')).toHaveValue('eth0');
  });

  test('「复制」按钮与点击指令行都能复制', () => {
    setup();
    const writeText = (navigator as unknown as { clipboard: { writeText: jest.Mock } }).clipboard.writeText;
    const copyButtons = screen.getAllByRole('button', { name: /copy\s*复\s*制$/ });
    fireEvent.click(copyButtons[0]);
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('tc qdisc add dev eth0 root handle 1: htb default 10'));
    expect(document.querySelector('.ant-message')?.textContent).toContain('复制到粘贴板成功!!!');
    writeText.mockClear();
    fireEvent.click(screen.getByText('tc -s class show dev eth0'));
    expect(writeText).toHaveBeenCalledWith('tc -s class show dev eth0');
  });

  test('「复制全部」汇总添加 / 查看 / 清除指令', () => {
    setup();
    const writeText = (navigator as unknown as { clipboard: { writeText: jest.Mock } }).clipboard.writeText;
    fireEvent.click(btn('复制全部'));
    const text = writeText.mock.calls[0][0] as string;
    expect(text).toContain('tc qdisc add dev eth0 root handle 1: htb default 10');
    expect(text).toContain('tc -s qdisc show dev eth0');
    expect(text).toContain('tc qdisc del dev eth0 root 2>/dev/null || true');
  });

  test('「保存为 .sh」导出 shell 脚本', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /save\s*保\s*存\s*为/ }));
    await screen.findByText('复制到粘贴板成功!!!');
    expect(mockSave).toHaveBeenCalledWith('tc-rules.sh', expect.stringContaining('#!/bin/bash'), '保存为 .sh', {
      filterName: 'Shell 脚本', extensions: [ 'sh' ],
    });
  });
});
