// iptables 规则 工具静态数据

/** 可用表 */
export const IPTABLES_TABLES = [ 'filter', 'nat', 'mangle', 'raw', 'security' ] as const;

/** 各表内置链 */
export const BUILTIN_CHAINS: Record<string, string[]> = {
  filter: [ 'INPUT', 'FORWARD', 'OUTPUT' ],
  nat: [ 'PREROUTING', 'INPUT', 'OUTPUT', 'POSTROUTING' ],
  mangle: [ 'PREROUTING', 'INPUT', 'FORWARD', 'OUTPUT', 'POSTROUTING' ],
  raw: [ 'PREROUTING', 'OUTPUT' ],
  security: [ 'INPUT', 'FORWARD', 'OUTPUT' ],
};

/** 规则操作 (-A 追加 / -I 插入 / -D 删除 / -P 默认策略 / -N 新建链 / -F 清空 / -X 删除链 / -Z 计数清零) */
export const RULE_OPS: { value: string; label: string; short: string }[] = [
  { value: 'A', label: '追加 (-A)', short: '-A' },
  { value: 'I', label: '插入 (-I)', short: '-I' },
  { value: 'D', label: '删除 (-D)', short: '-D' },
  { value: 'P', label: '默认策略 (-P)', short: '-P' },
  { value: 'N', label: '新建链 (-N)', short: '-N' },
  { value: 'F', label: '清空链 (-F)', short: '-F' },
  { value: 'X', label: '删除链 (-X)', short: '-X' },
  { value: 'Z', label: '计数清零 (-Z)', short: '-Z' },
];

/** 协议 */
export const PROTOCOLS = [ 'tcp', 'udp', 'icmp', 'icmpv6', 'sctp', 'esp', 'ah', 'gre', 'all' ];

/** 连接状态 */
export const CONN_STATES = [ 'NEW', 'ESTABLISHED', 'RELATED', 'INVALID', 'UNTRACKED', 'DNAT', 'SNAT' ];

/** 常用动作 */
export const TARGETS = [
  'ACCEPT', 'DROP', 'REJECT', 'RETURN', 'LOG', 'QUEUE', 'MASQUERADE',
  'SNAT', 'DNAT', 'REDIRECT', 'MARK', 'TTL', 'TOS', 'NFLOG',
];

/** 需要附加参数的动作 */
export const TARGET_ARGS: Record<string, { key: string; label: string; placeholder: string; need: boolean }[]> = {
  DNAT: [ { key: 'toDestination', label: '目标地址 (--to-destination)', placeholder: '10.0.0.5:8080', need: false } ],
  SNAT: [ { key: 'toSource', label: '源地址 (--to-source)', placeholder: '203.0.113.10', need: false } ],
  REDIRECT: [ { key: 'toPorts', label: '目标端口 (--to-ports)', placeholder: '8080', need: false } ],
  MASQUERADE: [ { key: 'toPorts', label: '端口范围 (--to-ports)', placeholder: '1024-65535', need: false } ],
  LOG: [
    { key: 'logPrefix', label: '日志前缀 (--log-prefix)', placeholder: 'IPT-DROP: ', need: false },
    { key: 'logLevel', label: '日志级别 (--log-level)', placeholder: '4', need: false },
  ],
  REJECT: [ { key: 'rejectWith', label: '拒绝方式 (--reject-with)', placeholder: 'icmp-port-unreachable', need: false } ],
  MARK: [ { key: 'setMark', label: '标记值 (--set-mark)', placeholder: '1', need: false } ],
};

/** REJECT 的 --reject-with 取值 */
export const REJECT_WITH = [
  'icmp-port-unreachable', 'icmp-net-unreachable', 'icmp-host-unreachable', 'icmp-proto-unreachable',
  'icmp-net-prohibited', 'icmp-host-prohibited', 'icmp-admin-prohibited', 'tcp-reset',
];

/** LOG 级别 */
export const LOG_LEVELS: { value: string; label: string }[] = [
  { value: '0', label: '0 emerg' }, { value: '1', label: '1 alert' }, { value: '2', label: '2 crit' },
  { value: '3', label: '3 error' }, { value: '4', label: '4 warning' }, { value: '5', label: '5 notice' },
  { value: '6', label: '6 info' }, { value: '7', label: '7 debug' },
];

/** 解析示例: 混用「命令形式」与「iptables-save 形式」 */
export const SAMPLE_IPTABLES = `# 常见 Web 服务器防火墙
*filter
:INPUT DROP [0:0]
:FORWARD DROP [0:0]
:OUTPUT ACCEPT [0:0]
-A INPUT -i lo -j ACCEPT
-A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
-A INPUT -p tcp --dport 22 -m comment --comment "SSH" -j ACCEPT
-A INPUT -p tcp -m multiport --dports 80,443 -j ACCEPT
-A INPUT -p icmp --icmp-type echo-request -m limit --limit 10/min --limit-burst 20 -j ACCEPT
-A INPUT -s 203.0.113.0/24 -j DROP
COMMIT

# 命令形式
sudo iptables -t nat -A PREROUTING -p tcp --dport 8080 -j REDIRECT --to-ports 80
iptables -t nat -A POSTROUTING -s 10.0.0.0/8 -o eth0 -j MASQUERADE
iptables -I INPUT 1 -s 198.51.100.9 -j DROP
iptables -P FORWARD DROP
`;

/** 结果区默认高度 */
export const RESULT_HEIGHT = 'calc(100vh - 420px)';
