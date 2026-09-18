// iptables 「简单配置」: 日常场景一键生成 (开放端口 / 封禁 IP / 封禁网段 / 端口转发)
import {
  buildIptablesCommand, buildRulePlan, emptyRuleConfig, isValidPort, type RuleConfig,
} from './lib';

/** 场景 */
export type SimpleScene = 'open' | 'block-ip' | 'block-net' | 'forward';

/** 场景定义 (hint 为界面上的说明文案) */
export const SIMPLE_SCENES: { value: SimpleScene; label: string; hint: string }[] = [
  { value: 'open', label: '开放端口', hint: '放行本机某个端口的入站访问 (Web / SSH / 数据库等)' },
  { value: 'block-ip', label: '封禁 IP', hint: '丢弃来自指定 IP 的入站流量, 常用于封锁攻击源' },
  { value: 'block-net', label: '封禁网段', hint: '丢弃来自指定网段 (CIDR) 的入站流量' },
  { value: 'forward', label: '端口转发', hint: '把本机端口的流量转发到内网另一台机器 (DNAT + 内核转发)' },
];

export interface SimpleConfig {
  scene: SimpleScene;
  protocol: string;     // tcp / udp (开放端口 / 端口转发)
  port: string;         // 开放端口 / 对外端口
  sourceIp: string;     // 封禁 IP
  sourceNet: string;    // 封禁网段
  targetIp: string;     // 转发目标 IP
  targetPort: string;   // 转发目标端口
  outIface: string;     // 转发出口网卡 (MASQUERADE)
  comment: string;      // 备注
}

export const emptySimpleConfig = (): SimpleConfig => ({
  scene: 'open', protocol: 'tcp', port: '80', sourceIp: '', sourceNet: '',
  targetIp: '', targetPort: '', outIface: 'eth0', comment: '',
});

export interface SimplePlan {
  errors: string[];      // 错误码
  warnings: string[];    // 提示码
  commands: string[];    // 生效指令 (按顺序)
  extra: string[];       // 附加系统指令 (内核转发等)
  restore: string[];     // iptables-save 规则行
  view: string[];        // 查看与验证
  remove: string[];      // 删除指令 (生成的反向命令)
  persist: string[];     // 保存与持久化
  fileName: string;      // 导出文件名
}

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

const isIpv4 = (v: string): boolean => {
  const m = IPV4.exec(v);
  return m !== null && m.slice(1, 5).every((o) => Number(o) <= 255);
};

const isIpv6 = (v: string): boolean => {
  if (!v.includes(':') || !/^[0-9a-fA-F:]+$/.test(v)) return false;
  if ((v.match(/::/g) ?? []).length > 1) return false;
  return v.split(':').length <= 8;
};

/** IP 字面量 (仅 IPv4 / IPv6, 不接受主机名) */
export const isIpLiteral = (v: string): boolean => isIpv4(v) || isIpv6(v);

/** 网段 (IPv4 / IPv6 + 掩码) */
export const isCidr = (v: string): boolean => {
  const i = v.lastIndexOf('/');
  if (i <= 0) return false;
  const addr = v.slice(0, i);
  const mask = v.slice(i + 1);
  if (!/^\d{1,3}$/.test(mask)) return false;
  const n = Number(mask);
  if (isIpv4(addr)) return n <= 32;
  if (isIpv6(addr)) return n <= 128;
  return false;
};

/** 单个端口 (不接受区间与列表) */
const isSinglePort = (v: string): boolean => /^\d{1,5}$/.test(v) && Number(v) >= 1 && Number(v) <= 65535;

const dedupe = (arr: string[]): string[] => Array.from(new Set(arr));

const mk = (patch: Partial<RuleConfig>): RuleConfig => ({ ...emptyRuleConfig(), ...patch });

const fileNameOf = (scene: SimpleScene): string => `iptables-${scene}.sh`;

/** 生成简单配置方案 (校验失败时 commands 为空) */
export const buildSimplePlan = (c: SimpleConfig): SimplePlan => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const extra: string[] = [];
  const rules: RuleConfig[] = [];

  const proto = c.protocol.trim() === 'udp' ? 'udp' : 'tcp';
  const comment = c.comment.trim();
  const port = c.port.trim();

  if (c.scene === 'open' || c.scene === 'forward') {
    if (port === '') errors.push('simple-port-required');
    else if (!isValidPort(port)) errors.push('simple-port-format');
  }
  if (c.scene === 'block-ip') {
    const ip = c.sourceIp.trim();
    if (ip === '') errors.push('simple-ip-required');
    else if (!isIpLiteral(ip)) errors.push('simple-ip-format');
  }
  if (c.scene === 'block-net') {
    const net = c.sourceNet.trim();
    if (net === '') errors.push('simple-net-required');
    else if (!isCidr(net)) errors.push('simple-net-format');
  }

  const targetIp = c.targetIp.trim();
  const targetPort = c.targetPort.trim();
  if (c.scene === 'forward') {
    if (targetIp === '') errors.push('simple-target-ip-required');
    else if (!isIpLiteral(targetIp)) errors.push('simple-target-ip-format');
    if (targetPort === '') errors.push('simple-target-port-required');
    else if (!isSinglePort(targetPort)) errors.push('simple-target-port-format');
  }

  if (errors.length > 0) {
    return {
      errors: dedupe(errors), warnings: [], commands: [], extra: [], restore: [],
      view: [], remove: [], persist: [], fileName: fileNameOf(c.scene),
    };
  }

  if (c.scene === 'open') {
    rules.push(mk({ table: 'filter', chain: 'INPUT', protocol: proto, dport: port, target: 'ACCEPT', comment }));
    warnings.push('simple-open-established');
    if (port.split(/[:,]/).includes('22')) warnings.push('simple-open-ssh');
  } else if (c.scene === 'block-ip') {
    rules.push(mk({ table: 'filter', chain: 'INPUT', source: c.sourceIp.trim(), target: 'DROP', comment }));
    warnings.push('simple-block-existing', 'simple-block-inbound');
  } else if (c.scene === 'block-net') {
    rules.push(mk({ table: 'filter', chain: 'INPUT', source: c.sourceNet.trim(), target: 'DROP', comment }));
    warnings.push('simple-block-existing', 'simple-block-inbound');
  } else {
    const outIface = c.outIface.trim();
    // IPv6 目标地址需要方括号包裹
    const dest = isIpv6(targetIp) ? `[${targetIp}]:${targetPort}` : `${targetIp}:${targetPort}`;
    rules.push(mk({
      table: 'nat', chain: 'PREROUTING', protocol: proto, dport: port,
      target: 'DNAT', args: { toDestination: dest }, comment,
    }));
    rules.push(mk({
      table: 'filter', chain: 'FORWARD', protocol: proto, destination: targetIp,
      dport: targetPort, target: 'ACCEPT', comment,
    }));
    rules.push(mk({ table: 'nat', chain: 'POSTROUTING', outIface, target: 'MASQUERADE' }));
    if (outIface === '') warnings.push('simple-forward-iface');
    extra.push(
      'sysctl -w net.ipv4.ip_forward=1    # 开启内核转发',
      'echo "net.ipv4.ip_forward = 1" > /etc/sysctl.d/99-ip-forward.conf    # 开机自动生效',
      'sysctl -p /etc/sysctl.d/99-ip-forward.conf',
    );
  }

  const plans = rules.map((r) => buildRulePlan(r));
  return {
    errors: [],
    warnings: dedupe([ ...warnings, ...plans.flatMap((p) => p.warnings) ]),
    commands: plans.map((p) => p.command).filter((x) => x !== ''),
    extra,
    restore: plans.map((p) => p.restoreLine).filter((x) => x !== ''),
    view: dedupe([
      ...rules.map((r) => `iptables -t ${r.table} -nL ${r.chain} --line-numbers`),
      `iptables -t ${rules[0].table} -nL -v`,
    ]),
    remove: rules.map((r) => buildIptablesCommand({ ...r, op: 'D', position: '' })),
    persist: plans[0].persist,
    fileName: fileNameOf(c.scene),
  };
};

/** 生成可直接执行的 shell 脚本 (生效 + 附加 + 查看 + 删除 + 保存) */
export const buildSimpleScript = (plan: SimplePlan): string => {
  if (plan.commands.length === 0) return '';
  const lines: string[] = [
    '#!/bin/bash',
    '# iptables 简单配置脚本 (由 MagicTools「iptables 规则 - 简单配置」生成, 请用 root 执行)',
    'set -e',
    '',
    ...plan.commands,
  ];
  if (plan.extra.length > 0) lines.push('', '# ---- 附加系统指令 (内核转发) ----', ...plan.extra);
  lines.push(
    '', '# ---- 查看 ----', ...plan.view,
    '', '# ---- 删除 ----', ...plan.remove,
    '', '# ---- 保存 ----', ...plan.persist,
    '',
  );
  return lines.join('\n');
};
