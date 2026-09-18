import {
  buildIptablesCommand, buildIptablesScript, buildRestoreLine, buildRulePlan, emptyRuleConfig,
  isValidAddress, isValidAddressPort, isValidPort, parseIptables, ruleToConfig,
  tokenizeArgs, validateRule, type RuleConfig,
} from './lib';
import { SAMPLE_IPTABLES } from './data';

/** 便捷构造配置 */
const cfg = (patch: Partial<RuleConfig> = {}): RuleConfig => ({ ...emptyRuleConfig(), ...patch });

describe('tokenizeArgs 参数拆分', () => {
  it('按空白拆分普通参数', () => {
    expect(tokenizeArgs('-p tcp --dport 22')).toEqual([ '-p', 'tcp', '--dport', '22' ]);
  });

  it('双引号内保留空格', () => {
    expect(tokenizeArgs('-m comment --comment "SSH 端口" -j ACCEPT'))
      .toEqual([ '-m', 'comment', '--comment', 'SSH 端口', '-j', 'ACCEPT' ]);
  });

  it('单引号内的行尾空格也保留', () => {
    expect(tokenizeArgs("--log-prefix 'IPT-DROP: '")).toEqual([ '--log-prefix', 'IPT-DROP: ' ]);
  });
});

describe('parseIptables 命令形式', () => {
  it('解析 -t / -A / -p / --dport / -j 与动作参数', () => {
    const r = parseIptables('iptables -t nat -A PREROUTING -p tcp --dport 8080 -j REDIRECT --to-ports 80');
    expect(r.errors).toEqual([]);
    expect(r.rules).toHaveLength(1);
    const rule = r.rules[0];
    expect(rule.table).toBe('nat');
    expect(rule.op).toBe('A');
    expect(rule.chain).toBe('PREROUTING');
    expect(rule.protocol).toBe('tcp');
    expect(rule.dport).toBe('8080');
    expect(rule.target).toBe('REDIRECT');
    expect(rule.args.toPorts).toBe('80');
  });

  it('忽略 sudo 前缀, 默认表为 filter', () => {
    const r = parseIptables('sudo iptables -A INPUT -s 10.0.0.1 -j DROP');
    expect(r.rules[0].table).toBe('filter');
    expect(r.rules[0].source).toBe('10.0.0.1');
    expect(r.rules[0].target).toBe('DROP');
  });

  it('-I 的插入序号被解析', () => {
    const r = parseIptables('iptables -I INPUT 1 -s 198.51.100.9 -j DROP');
    expect(r.rules[0].op).toBe('I');
    expect(r.rules[0].position).toBe(1);
    expect(r.rules[0].chain).toBe('INPUT');
  });

  it('-P 解析为默认策略', () => {
    const r = parseIptables('iptables -P FORWARD DROP');
    expect(r.rules[0].op).toBe('P');
    expect(r.rules[0].chain).toBe('FORWARD');
    expect(r.rules[0].policy).toBe('DROP');
    expect(r.rules[0].target).toBe('DROP');
  });

  it('-N 新建链 / -F 清空(无链名)', () => {
    const r = parseIptables('iptables -N MYCHAIN\niptables -F');
    expect(r.rules[0].op).toBe('N');
    expect(r.rules[0].chain).toBe('MYCHAIN');
    expect(r.rules[1].op).toBe('F');
    expect(r.rules[1].chain).toBe('');
  });

  it('由 -m tcp 推断协议, 解析 multiport / 状态 / 限速', () => {
    const r = parseIptables([
      'iptables -A INPUT -m tcp --dport 22 -j ACCEPT',
      'iptables -A INPUT -p tcp -m multiport --dports 80,443 -j ACCEPT',
      'iptables -A INPUT -m state --state NEW,ESTABLISHED -j ACCEPT',
      'iptables -A INPUT -p icmp --icmp-type echo-request -m limit --limit 10/min --limit-burst 20 -j ACCEPT',
    ].join('\n'));
    expect(r.rules[0].protocol).toBe('tcp');
    expect(r.rules[1].dport).toBe('80,443');
    expect(r.rules[2].states).toEqual([ 'NEW', 'ESTABLISHED' ]);
    expect(r.rules[3].icmpType).toBe('echo-request');
    expect(r.rules[3].limit).toBe('10/min');
    expect(r.rules[3].limitBurst).toBe('20');
  });

  it('解析 LOG 的日志前缀 (含行尾空格) 与备注', () => {
    const r = parseIptables('iptables -A INPUT -j LOG --log-prefix "IPT-DROP: " --log-level 4 -m comment --comment "记录"');
    expect(r.rules[0].args.logPrefix).toBe('IPT-DROP: ');
    expect(r.rules[0].args.logLevel).toBe('4');
    expect(r.rules[0].comment).toBe('记录');
  });

  it('未识别的参数记入 unknown', () => {
    const r = parseIptables('iptables -A INPUT --tcp-flags SYN,ACK SYN -j DROP');
    expect(r.rules[0].unknown).toContain('--tcp-flags');
    expect(r.rules[0].target).toBe('DROP');
  });

  it('识别长选项', () => {
    const r = parseIptables('iptables --table nat --append PREROUTING --protocol tcp --dport 80 --jump REDIRECT --to-ports 8080');
    expect(r.rules[0].table).toBe('nat');
    expect(r.rules[0].chain).toBe('PREROUTING');
    expect(r.rules[0].protocol).toBe('tcp');
    expect(r.rules[0].dport).toBe('80');
    expect(r.rules[0].target).toBe('REDIRECT');
  });

  it('无法识别的行进入 errors', () => {
    const r = parseIptables('iptables -A INPUT -j ACCEPT\n这不是一条规则\nhello world');
    expect(r.rules).toHaveLength(1);
    expect(r.errors).toEqual([ '这不是一条规则', 'hello world' ]);
  });
});

describe('parseIptables iptables-save 形式', () => {
  it('解析 *filter / :CHAIN 策略 / -A / COMMIT, 跳过注释与空行', () => {
    const r = parseIptables([
      '# 注释',
      '*filter',
      ':INPUT DROP [0:0]',
      ':OUTPUT ACCEPT [0:0]',
      '',
      '-A INPUT -i lo -j ACCEPT',
      'COMMIT',
    ].join('\n'));
    expect(r.errors).toEqual([]);
    expect(r.rules).toHaveLength(3);
    expect(r.rules[0].op).toBe('P');
    expect(r.rules[0].policy).toBe('DROP');
    expect(r.rules[1].policy).toBe('ACCEPT');
    expect(r.rules[2].table).toBe('filter');
    expect(r.rules[2].chain).toBe('INPUT');
    expect(r.rules[2].inIface).toBe('lo');
  });

  it('表名随 *nat 切换', () => {
    const r = parseIptables('*nat\n-A POSTROUTING -o eth0 -j MASQUERADE\nCOMMIT');
    expect(r.rules[0].table).toBe('nat');
    expect(r.rules[0].outIface).toBe('eth0');
    expect(r.rules[0].target).toBe('MASQUERADE');
  });

  it('示例文本可全部解析, 无错误', () => {
    const r = parseIptables(SAMPLE_IPTABLES);
    expect(r.errors).toEqual([]);
    expect(r.rules).toHaveLength(13);
    expect(r.rules.map((x) => x.table)).toContain('nat');
  });
});

describe('地址与端口校验', () => {
  it('IPv4 / CIDR / IPv6 / 主机名', () => {
    expect(isValidAddress('10.0.0.0/8')).toBe(true);
    expect(isValidAddress('192.168.1.1')).toBe(true);
    expect(isValidAddress('2001:db8::1')).toBe(true);
    expect(isValidAddress('example.com')).toBe(true);
    expect(isValidAddress('300.1.1.1')).toBe(false);
    expect(isValidAddress('10.0.0.0/33')).toBe(false);
    expect(isValidAddress('a..b')).toBe(false);
  });

  it('带端口的地址', () => {
    expect(isValidAddressPort('10.0.0.5:8080')).toBe(true);
    expect(isValidAddressPort('[2001:db8::1]:80')).toBe(true);
    expect(isValidAddressPort('2001:db8::1')).toBe(true);
    expect(isValidAddressPort('999.1.1.1:80')).toBe(false);
  });

  it('端口 / 端口区间 / 列表', () => {
    expect(isValidPort('22')).toBe(true);
    expect(isValidPort('80:90')).toBe(true);
    expect(isValidPort(':1024')).toBe(true);
    expect(isValidPort('80,443')).toBe(true);
    expect(isValidPort('0')).toBe(false);
    expect(isValidPort('70000')).toBe(false);
    expect(isValidPort('90:80')).toBe(false);
  });
});

describe('validateRule 生成校验', () => {
  it('合法配置无错误', () => {
    expect(validateRule(cfg({ protocol: 'tcp', dport: '22', target: 'ACCEPT' }))).toEqual([]);
  });

  it('链为空 / 端口非法 / 端口缺协议', () => {
    expect(validateRule(cfg({ chain: '' }))).toContain('chain');
    expect(validateRule(cfg({ dport: '70000' }))).toContain('dport');
    expect(validateRule(cfg({ protocol: 'icmp', dport: '22' }))).toContain('port-proto');
    expect(validateRule(cfg({ protocol: 'icmp', dport: '80,443' }))).not.toContain('port-proto');
  });

  it('默认策略动作只能是 ACCEPT / DROP', () => {
    expect(validateRule(cfg({ op: 'P', target: 'ACCEPT' }))).toEqual([]);
    expect(validateRule(cfg({ op: 'P', target: 'LOG' }))).toContain('policy');
  });

  it('动作参数校验', () => {
    expect(validateRule(cfg({ target: 'REJECT', args: { rejectWith: 'bad-value' } }))).toContain('reject-with');
    expect(validateRule(cfg({ target: 'REJECT', args: { rejectWith: 'tcp-reset' } }))).toEqual([]);
    expect(validateRule(cfg({ target: 'LOG', args: { logLevel: '9' } }))).toContain('log-level');
    expect(validateRule(cfg({ target: 'MARK', args: { setMark: 'abc' } }))).toContain('set-mark');
    expect(validateRule(cfg({ target: 'DNAT', args: { toDestination: '999.1.1.1:80' } }))).toContain('to-destination');
    expect(validateRule(cfg({ target: 'DNAT', args: { toDestination: '10.0.0.5:8080' } }))).toEqual([]);
    expect(validateRule(cfg({ target: 'REDIRECT', args: { toPorts: 'x' } }))).toContain('to-ports');
  });
});

describe('buildIptablesCommand 生成命令', () => {
  it('基础放行规则', () => {
    expect(buildIptablesCommand(cfg({ protocol: 'tcp', dport: '22' })))
      .toBe('iptables -t filter -A INPUT -p tcp --dport 22 -j ACCEPT');
  });

  it('端口列表自动改用 multiport', () => {
    expect(buildIptablesCommand(cfg({ protocol: 'tcp', dport: '80,443' })))
      .toBe('iptables -t filter -A INPUT -p tcp -m multiport --dports 80,443 -j ACCEPT');
  });

  it('备注与限速带引号 / 模块', () => {
    expect(buildIptablesCommand(cfg({
      protocol: 'icmp', icmpType: 'echo-request', target: 'ACCEPT',
      limit: '10/min', limitBurst: '20', comment: 'SSH 端口',
    }))).toBe('iptables -t filter -A INPUT -p icmp --icmp-type echo-request -m limit --limit 10/min --limit-burst 20 -m comment --comment "SSH 端口" -j ACCEPT');
  });

  it('日志前缀含空格时加引号', () => {
    const cmd = buildIptablesCommand(cfg({ protocol: 'tcp', dport: '22', target: 'LOG', args: { logPrefix: 'IPT-DROP: ', logLevel: '4' } }));
    expect(cmd).toContain('--log-prefix "IPT-DROP: "');
    expect(cmd.trim().endsWith('--log-level 4')).toBe(true);
  });

  it('NAT 端口转发 / 源地址转换', () => {
    expect(buildIptablesCommand(cfg({
      table: 'nat', chain: 'PREROUTING', protocol: 'tcp', dport: '8080',
      target: 'DNAT', args: { toDestination: '10.0.0.5:8080' },
    }))).toBe('iptables -t nat -A PREROUTING -p tcp --dport 8080 -j DNAT --to-destination 10.0.0.5:8080');

    expect(buildIptablesCommand(cfg({
      table: 'nat', chain: 'POSTROUTING', source: '10.0.0.0/8', outIface: 'eth0', target: 'MASQUERADE',
    }))).toBe('iptables -t nat -A POSTROUTING -o eth0 -s 10.0.0.0/8 -j MASQUERADE');
  });

  it('插入指定位置 / 按行号删除 / 默认策略', () => {
    expect(buildIptablesCommand(cfg({ op: 'I', position: '1', source: '1.2.3.4', target: 'DROP' })))
      .toBe('iptables -t filter -I INPUT 1 -s 1.2.3.4 -j DROP');
    expect(buildIptablesCommand(cfg({ op: 'D', position: '3', protocol: '', target: '', dport: '' })))
      .toBe('iptables -t filter -D INPUT 3');
    expect(buildIptablesCommand(cfg({ op: 'P', chain: 'FORWARD', target: 'DROP' })))
      .toBe('iptables -t filter -P FORWARD DROP');
  });

  it('连接状态与自定义链动作', () => {
    expect(buildIptablesCommand(cfg({ protocol: 'tcp', states: [ 'NEW', 'ESTABLISHED' ], target: 'MYCHAIN' })))
      .toBe('iptables -t filter -A INPUT -p tcp -m state --state NEW,ESTABLISHED -j MYCHAIN');
  });
});

describe('buildRestoreLine 还原行', () => {
  it('追加规则输出 -A 行', () => {
    expect(buildRestoreLine(cfg({ protocol: 'tcp', dport: '22' }))).toBe('-A INPUT -p tcp --dport 22 -j ACCEPT');
  });

  it('插入规则在保存格式中仍是 -A (顺序即位置)', () => {
    expect(buildRestoreLine(cfg({ op: 'I', position: '2', source: '1.2.3.4', target: 'DROP' })))
      .toBe('-A INPUT -s 1.2.3.4 -j DROP');
  });

  it('按行号删除 / 默认策略不输出还原行', () => {
    expect(buildRestoreLine(cfg({ op: 'D', position: '3', protocol: '', dport: '' }))).toBe('-D INPUT 3');
    expect(buildRestoreLine(cfg({ op: 'P', chain: 'FORWARD', target: 'DROP' }))).toBe('');
  });
});

describe('ruleToConfig 解析结果回填生成配置', () => {
  it('解析 -> 回填 -> 重新生成得到同一条命令', () => {
    const src = 'iptables -t nat -A PREROUTING -p tcp --dport 8080 -j REDIRECT --to-ports 80';
    const rule = parseIptables(src).rules[0];
    expect(buildIptablesCommand(ruleToConfig(rule))).toBe(src);
  });

  it('对带状态与备注的规则同样可往返', () => {
    const src = 'iptables -t filter -I INPUT 2 -p tcp -m state --state NEW -m comment --comment "SSH" -j ACCEPT';
    const rule = parseIptables(src).rules[0];
    const out = buildIptablesCommand(ruleToConfig(rule));
    // 单值备注无需引号, 往返后会归一化为不带引号的形式
    expect(out).toBe('iptables -t filter -I INPUT 2 -p tcp -m state --state NEW -m comment --comment SSH -j ACCEPT');
    expect(rule.index).toBe(1);
  });
});

describe('buildRulePlan 生成计划 (含删除与保存)', () => {
  it('校验失败时不产生命令', () => {
    const plan = buildRulePlan(cfg({ chain: '' }));
    expect(plan.errors).toContain('chain');
    expect(plan.command).toBe('');
    expect(plan.view).toEqual([]);
    expect(plan.remove).toEqual([]);
  });

  it('给出查看 / 删除 / 保存指令, 删除首条为同规则 -D', () => {
    const plan = buildRulePlan(cfg({ protocol: 'tcp', dport: '22' }));
    expect(plan.errors).toEqual([]);
    expect(plan.command).toBe('iptables -t filter -A INPUT -p tcp --dport 22 -j ACCEPT');
    expect(plan.view[0]).toBe('iptables -t filter -nL INPUT --line-numbers');
    expect(plan.remove[0]).toBe('iptables -t filter -D INPUT -p tcp --dport 22 -j ACCEPT');
    expect(plan.remove[1]).toContain('iptables -t filter -D INPUT 1');
    expect(plan.persist.join('\n')).toContain('netfilter-persistent save');
    expect(plan.restoreLine).toBe('-A INPUT -p tcp --dport 22 -j ACCEPT');
  });

  it('脚本包含 shebang / 主命令 / 分段标题', () => {
    const script = buildIptablesScript(buildRulePlan(cfg({ protocol: 'tcp', dport: '22' })));
    expect(script.startsWith('#!/bin/bash')).toBe(true);
    expect(script).toContain('set -e');
    expect(script).toContain('iptables -t filter -A INPUT -p tcp --dport 22 -j ACCEPT');
    expect(script).toContain('# ---- 查看 ----');
    expect(script).toContain('# ---- 删除 ----');
    expect(script).toContain('# ---- 保存 ----');
    expect(script.endsWith('\n')).toBe(true);
    expect(buildIptablesScript(buildRulePlan(cfg({ chain: '' })))).toBe('');
  });

  it('追加/插入与 NAT 场景给出提示', () => {
    expect(buildRulePlan(cfg({})).warnings).toContain('append-last');
    expect(buildRulePlan(cfg({ op: 'I', position: '' })).warnings).toContain('insert-first');
    const nat = buildRulePlan(cfg({ table: 'nat', chain: 'PREROUTING', target: 'DNAT', args: { toDestination: '10.0.0.5' } }));
    expect(nat.warnings).toContain('forward');
  });
});
