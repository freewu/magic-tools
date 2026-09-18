// tc 规则 工具静态数据
import type { TcConfig } from './lib';

/** 限速方式 */
export const TC_MODES: { value: string; label: string }[] = [
  { value: 'htb', label: 'HTB 分层限速 (可分流)' },
  { value: 'tbf', label: 'TBF 令牌桶限速 (整卡)' },
  { value: 'netem', label: 'netem 网络损伤模拟 (延迟/丢包)' },
];

/** 速率单位 */
export const RATE_UNITS = [ 'kbit', 'mbit', 'gbit' ];

/** 方向 */
export const DIRECTIONS: { value: string; label: string }[] = [
  { value: 'egress', label: '出口 (本机发出, 直接生效)' },
  { value: 'ingress', label: '入口 (本机接收, 需要 ifb)' },
];

/** 分流条件 */
export const FILTER_KINDS: { value: string; label: string; hint: string }[] = [
  { value: 'none', label: '不分流 (整卡)', hint: '对整张网卡生效, 不生成 filter' },
  { value: 'port', label: '按端口', hint: '只对指定目标端口的流量限速, 例如 80 / 443' },
  { value: 'ip', label: '按目标 IP', hint: '只对发往指定 IP / 网段的流量限速' },
  { value: 'proto', label: '按协议', hint: '只对指定协议 (tcp / udp / icmp) 限速' },
];

/** 按端口分流的协议 (ip = 不限协议, 只匹配端口) */
export const PORT_PROTOS: { value: string; label: string }[] = [
  { value: 'tcp', label: 'TCP' },
  { value: 'udp', label: 'UDP' },
  { value: 'ip', label: '不限协议 (仅匹配端口)' },
];

/** 按协议分流的协议 */
export const PROTO_PROTOS: { value: string; label: string }[] = [
  { value: 'tcp', label: 'TCP' },
  { value: 'udp', label: 'UDP' },
  { value: 'icmp', label: 'ICMP' },
];

/** 内置场景示例 */
export interface TcPreset {
  name: string;
  desc: string;
  config: Record<string, string | boolean>;
}

export const TC_PRESETS: TcPreset[] = [
  {
    name: '出口总带宽限制 10M',
    desc: 'tc qdisc add dev eth0 root handle 1: htb default 30 整卡出口限速',
    config: {
      dev: 'eth0', mode: 'htb', direction: 'egress',
      rate: '10', rateUnit: 'mbit', ceil: '10', ceilUnit: 'mbit',
      total: '10', totalUnit: 'mbit', filterKind: 'none', classId: '10', defaultClass: '30',
    },
  },
  {
    name: '对 80/443 端口限速 2M',
    desc: '用 u32 匹配目标端口, 其余流量走默认类 (HTB 分流)',
    config: {
      dev: 'eth0', mode: 'htb', direction: 'egress',
      total: '100', totalUnit: 'mbit', rate: '2', rateUnit: 'mbit', ceil: '4', ceilUnit: 'mbit',
      filterKind: 'port', filterPort: '80', filterProto: 'tcp', classId: '10', defaultClass: '30', prio: '1',
    },
  },
  {
    name: '入口下载限速 5M (ifb)',
    desc: '入口流量重定向到 ifb0 再限速',
    config: {
      dev: 'eth0', mode: 'htb', direction: 'ingress', ifbDev: 'ifb0',
      total: '5', totalUnit: 'mbit', rate: '5', rateUnit: 'mbit', ceil: '5', ceilUnit: 'mbit', filterKind: 'none',
    },
  },
  {
    name: '模拟 4G 网络 (延迟 100ms)',
    desc: 'netem 添加延迟与抖动, 适合测试移动网络表现',
    config: {
      dev: 'eth0', mode: 'netem', direction: 'egress',
      delayMs: '100', jitterMs: '20', lossPct: '1',
    },
  },
  {
    name: '模拟弱网 (延迟 + 丢包 5% + 乱序)',
    desc: 'netem delay / loss / reorder 组合',
    config: {
      dev: 'eth0', mode: 'netem', direction: 'egress',
      delayMs: '200', jitterMs: '50', lossPct: '5', duplicate: '1', reorder: '25',
    },
  },
  {
    name: '限制为 1M 且突发 32kbit (tbf)',
    desc: 'tbf 令牌桶, 简单整卡限速',
    config: {
      dev: 'eth0', mode: 'tbf', direction: 'egress',
      rate: '1', rateUnit: 'mbit', burstKb: '32', latencyMs: '400',
    },
  },
];

/** 默认配置 */
export const DEFAULT_TC_CONFIG: TcConfig = {
  dev: 'eth0',
  mode: 'htb',
  direction: 'egress',
  ifbDev: 'ifb0',
  rate: '10',
  rateUnit: 'mbit',
  total: '100',
  totalUnit: 'mbit',
  ceil: '10',
  ceilUnit: 'mbit',
  burstKb: '',
  latencyMs: '',
  delayMs: '',
  jitterMs: '',
  lossPct: '',
  duplicate: '',
  corrupt: '',
  reorder: '',
  gap: '',
  netemLimit: '',
  filterKind: 'none',
  filterPort: '80',
  filterIp: '',
  filterProto: 'tcp',
  classId: '10',
  defaultClass: '30',
  prio: '1',
  handle: '1',
  sfq: true,
};

/** 结果区默认高度 */
export const RESULT_HEIGHT = 'calc(100vh - 480px)';
