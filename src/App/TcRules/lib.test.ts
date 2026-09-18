import {
  applyPreset, buildTcPlan, formatKbit, toKbit, validateTc, type TcConfig,
} from './lib';
import { DEFAULT_TC_CONFIG, TC_PRESETS } from './data';

const cfg = (patch: Partial<TcConfig> = {}): TcConfig => ({ ...DEFAULT_TC_CONFIG, ...patch });

describe('速率单位换算', () => {
  it('toKbit 按单位换算', () => {
    expect(toKbit('1', 'kbit')).toBe(1);
    expect(toKbit('2.5', 'mbit')).toBe(2500);
    expect(toKbit('1', 'gbit')).toBe(1000000);
    expect(toKbit('', 'mbit')).toBe(0);
  });

  it('formatKbit 按单位还原并去掉多余小数', () => {
    expect(formatKbit(98000, 'mbit')).toBe('98mbit');
    expect(formatKbit(1500, 'mbit')).toBe('1.5mbit');
    expect(formatKbit(1500, 'kbit')).toBe('1500kbit');
  });
});

describe('validateTc 配置校验', () => {
  it('默认配置合法 (htb 整卡 10mbit)', () => {
    expect(validateTc(cfg())).toEqual([]);
  });

  it('网卡名必填且格式受限', () => {
    expect(validateTc(cfg({ dev: '' }))).toContain('dev');
    expect(validateTc(cfg({ dev: 'eth 0' }))).toContain('dev-format');
    expect(validateTc(cfg({ dev: 'eth0.100' }))).toEqual([]);
  });

  it('入口模式必须填写 ifb 设备', () => {
    expect(validateTc(cfg({ direction: 'ingress', ifbDev: '' }))).toContain('ifb');
  });

  it('限速值必须为正数, 且不超过总带宽', () => {
    expect(validateTc(cfg({ rate: '0' }))).toContain('rate');
    expect(validateTc(cfg({ rate: 'abc' }))).toContain('rate');
    expect(validateTc(cfg({ rate: '20', total: '10' }))).toContain('rate-total');
    expect(validateTc(cfg({ rate: '20000', rateUnit: 'kbit', total: '10', totalUnit: 'mbit' }))).toContain('rate-total');
  });

  it('htb 类编号与默认类', () => {
    expect(validateTc(cfg({ classId: '1' }))).toContain('class-id');
    expect(validateTc(cfg({ classId: 'x' }))).toContain('class-id');
    expect(validateTc(cfg({ filterKind: 'port', classId: '10', defaultClass: '10' }))).toContain('default-equals-class');
  });

  it('分流条件校验', () => {
    expect(validateTc(cfg({ filterKind: 'port', filterPort: '0' }))).toContain('filter-port');
    expect(validateTc(cfg({ filterKind: 'port', filterPort: '8080', filterProto: 'tcp' }))).toEqual([]);
    expect(validateTc(cfg({ filterKind: 'ip', filterIp: 'nope' }))).toContain('filter-ip');
    expect(validateTc(cfg({ filterKind: 'ip', filterIp: '10.0.0.0/8' }))).toEqual([]);
    expect(validateTc(cfg({ filterKind: 'proto', filterProto: 'icmp' }))).toEqual([]);
    expect(validateTc(cfg({ filterKind: 'proto', filterProto: 'ip' }))).toContain('filter-proto');
  });

  it('netem 参数校验', () => {
    expect(validateTc(cfg({ mode: 'netem' }))).toContain('netem-empty');
    expect(validateTc(cfg({ mode: 'netem', jitterMs: '10' }))).toContain('jitter-needs-delay');
    expect(validateTc(cfg({ mode: 'netem', delayMs: '100', lossPct: '120' }))).toContain('loss');
    expect(validateTc(cfg({ mode: 'netem', delayMs: '100', jitterMs: '20', lossPct: '5' }))).toEqual([]);
  });

  it('tbf 参数校验', () => {
    expect(validateTc(cfg({ mode: 'tbf', burstKb: '0' }))).toContain('burst');
    expect(validateTc(cfg({ mode: 'tbf', latencyMs: 'x' }))).toContain('latency');
  });

  it('校验失败时不生成任何指令', () => {
    const plan = buildTcPlan(cfg({ rate: '' }));
    expect(plan.errors).toContain('rate');
    expect(plan.add).toEqual([]);
    expect(plan.clear).toEqual([]);
    expect(plan.script).toBe('');
  });
});

describe('buildTcPlan HTB 分层限速', () => {
  it('整卡限速 (不分流) 只生成一个限速类, default 指向它', () => {
    const plan = buildTcPlan(cfg());
    expect(plan.errors).toEqual([]);
    expect(plan.add).toEqual([
      'tc qdisc add dev eth0 root handle 1: htb default 10',
      'tc class add dev eth0 parent 1: classid 1:1 htb rate 100mbit ceil 100mbit',
      'tc class add dev eth0 parent 1:1 classid 1:10 htb rate 10mbit ceil 10mbit prio 1',
      'tc qdisc add dev eth0 parent 1:10 handle 100: sfq perturb 10',
    ]);
    expect(plan.warnings).toContain('need-root');
    expect(plan.warnings).toContain('not-persist');
    expect(plan.warnings).not.toContain('htb-class-only');
  });

  it('按端口分流: 生成默认类与 u32 filter', () => {
    const plan = buildTcPlan(cfg({
      total: '100', totalUnit: 'mbit', rate: '2', rateUnit: 'mbit', ceil: '4', ceilUnit: 'mbit',
      filterKind: 'port', filterPort: '80', filterProto: 'tcp',
    }));
    expect(plan.add).toContain('tc class add dev eth0 parent 1:1 classid 1:30 htb rate 98mbit ceil 100mbit');
    expect(plan.add).toContain('tc filter add dev eth0 protocol ip parent 1:0 prio 1 u32 match ip protocol 6 0xff match ip dport 80 0xffff flowid 1:10');
    expect(plan.add[0]).toBe('tc qdisc add dev eth0 root handle 1: htb default 30');
    expect(plan.warnings).toContain('htb-class-only');
  });

  it('按目标 IP / 按协议分流', () => {
    const byIp = buildTcPlan(cfg({ filterKind: 'ip', filterIp: '10.0.0.5' }));
    expect(byIp.add.some((l) => l.includes('match ip dst 10.0.0.5 flowid 1:10'))).toBe(true);
    const byProto = buildTcPlan(cfg({ filterKind: 'proto', filterProto: 'udp' }));
    expect(byProto.add.some((l) => l.includes('match ip protocol 17 0xff flowid 1:10'))).toBe(true);
  });

  it('UDP 端口分流使用协议号 17', () => {
    const plan = buildTcPlan(cfg({ filterKind: 'port', filterPort: '53', filterProto: 'udp' }));
    expect(plan.add.some((l) => l.includes('match ip protocol 17 0xff match ip dport 53 0xffff'))).toBe(true);
  });

  it('可以关闭 sfq 子队列', () => {
    const plan = buildTcPlan(cfg({ sfq: false }));
    expect(plan.add.some((l) => l.includes('sfq'))).toBe(false);
  });

  it('清除指令包含 qdisc / filter / class 三类', () => {
    const plan = buildTcPlan(cfg({ filterKind: 'port', rate: '2' }));
    expect(plan.clear[0]).toBe('tc qdisc del dev eth0 root 2>/dev/null || true');
    expect(plan.clear.join('\n')).toContain('tc filter del dev eth0 parent 1:0');
    expect(plan.clear.join('\n')).toContain('tc class del dev eth0 parent 1:1 classid 1:10');
  });
});

describe('buildTcPlan netem 网络损伤模拟', () => {
  it('延迟 + 抖动 + 丢包', () => {
    const plan = buildTcPlan(cfg({ mode: 'netem', delayMs: '100', jitterMs: '20', lossPct: '1' }));
    expect(plan.add[0]).toBe('tc qdisc add dev eth0 root netem delay 100ms 20ms loss 1%');
    expect(plan.add[1]).toContain('tc qdisc change dev eth0 root netem');
    expect(plan.clear[0]).toBe('tc qdisc del dev eth0 root 2>/dev/null || true');
    expect(plan.warnings).toContain('whole-dev');
  });

  it('弱网: 丢包 / 重复 / 损坏 / 乱序 / 队列长度', () => {
    const plan = buildTcPlan(cfg({
      mode: 'netem', delayMs: '200', jitterMs: '50', lossPct: '5',
      duplicate: '1', corrupt: '0.1', reorder: '25', gap: '5', netemLimit: '1000',
    }));
    expect(plan.add[0]).toBe('tc qdisc add dev eth0 root netem delay 200ms 50ms loss 5% duplicate 1% corrupt 0.1% reorder 25% 5 limit 1000');
  });
});

describe('buildTcPlan TBF 令牌桶', () => {
  it('显式 burst 与 latency', () => {
    const plan = buildTcPlan(cfg({ mode: 'tbf', rate: '1', rateUnit: 'mbit', burstKb: '32', latencyMs: '400' }));
    expect(plan.add).toEqual([ 'tc qdisc add dev eth0 root tbf rate 1mbit burst 32kbit latency 400ms' ]);
  });

  it('未填 burst 时按速率的 1/10 自动计算', () => {
    const plan = buildTcPlan(cfg({ mode: 'tbf', rate: '10', rateUnit: 'mbit' }));
    expect(plan.add[0]).toBe('tc qdisc add dev eth0 root tbf rate 10mbit burst 100kbit latency 400ms');
  });
});

describe('buildTcPlan 入口 (ifb) 模式', () => {
  const plan = buildTcPlan(cfg({ direction: 'ingress', ifbDev: 'ifb0', total: '5', rate: '5', ceil: '5' }));

  it('先准备 ifb 并把入口流量重定向过去', () => {
    expect(plan.add[0]).toBe('ip link show ifb0 >/dev/null 2>&1 || modprobe ifb numifbs=1');
    expect(plan.add[1]).toBe('ip link set dev ifb0 up');
    expect(plan.add[2]).toBe('tc qdisc del dev eth0 ingress 2>/dev/null || true');
    expect(plan.add[3]).toBe('tc qdisc add dev eth0 handle ffff: ingress');
    expect(plan.add[4]).toBe('tc filter add dev eth0 parent ffff: protocol ip u32 match u32 0 0 action mirred egress redirect dev ifb0');
  });

  it('限速指令作用于 ifb 设备', () => {
    expect(plan.add.some((l) => l === 'tc qdisc add dev ifb0 root handle 1: htb default 10')).toBe(true);
    expect(plan.warnings).toContain('ifb-note');
  });

  it('清除指令覆盖入口 qdisc 与 ifb 设备', () => {
    expect(plan.clear[0]).toBe('tc qdisc del dev eth0 ingress 2>/dev/null || true');
    expect(plan.clear.join('\n')).toContain('tc qdisc del dev ifb0 root');
    expect(plan.clear.join('\n')).toContain('ip link set dev ifb0 down');
  });

  it('netem 入口模式也挂到 ifb 上', () => {
    const n = buildTcPlan(cfg({ direction: 'ingress', mode: 'netem', delayMs: '100', lossPct: '2' }));
    expect(n.add.some((l) => l === 'tc qdisc add dev ifb0 root netem delay 100ms loss 2%')).toBe(true);
  });
});

describe('查看指令与脚本', () => {
  const plan = buildTcPlan(cfg());

  it('给出 qdisc / class / filter 查看指令', () => {
    expect(plan.view).toEqual([
      'tc -s qdisc show dev eth0',
      'tc -s class show dev eth0',
      'tc filter show dev eth0',
    ]);
  });

  it('脚本包含 shebang, 添加指令与清除段', () => {
    expect(plan.script.startsWith('#!/bin/bash')).toBe(true);
    expect(plan.script).toContain('set -e');
    expect(plan.script).toContain(plan.add[0]);
    expect(plan.script).toContain('# ---- 清除 ----');
    expect(plan.script).toContain(plan.clear[0]);
    expect(plan.script.endsWith('\n')).toBe(true);
  });

  it('入口模式额外查看入口 qdisc', () => {
    const p = buildTcPlan(cfg({ direction: 'ingress' }));
    expect(p.view).toContain('tc -s qdisc show dev eth0');
    expect(p.view).toContain('tc -s qdisc show dev ifb0');
  });
});

describe('场景示例', () => {
  it('示例都能生成有效指令', () => {
    expect(TC_PRESETS.length).toBeGreaterThanOrEqual(5);
    for (const p of TC_PRESETS) {
      const plan = buildTcPlan(applyPreset(DEFAULT_TC_CONFIG, p.config));
      expect([ p.name, plan.errors ]).toEqual([ p.name, [] ]);
      expect(plan.add.length).toBeGreaterThan(0);
      expect(plan.clear.length).toBeGreaterThan(0);
    }
  });

  it('applyPreset 覆盖已知字段并忽略未知字段', () => {
    const next = applyPreset(DEFAULT_TC_CONFIG, { filterKind: 'port', rate: '2', unknownKey: 'x' as unknown as string });
    expect(next.filterKind).toBe('port');
    expect(next.rate).toBe('2');
    expect((next as unknown as Record<string, unknown>).unknownKey).toBeUndefined();
    expect(DEFAULT_TC_CONFIG.rate).toBe('10');
  });
});
