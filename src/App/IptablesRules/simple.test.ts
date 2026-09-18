import {
  buildSimplePlan, buildSimpleScript, emptySimpleConfig, isCidr, isIpLiteral, SIMPLE_SCENES,
  type SimpleConfig,
} from './simple';

const cfg = (patch: Partial<SimpleConfig> = {}): SimpleConfig => ({ ...emptySimpleConfig(), ...patch });

describe('SimpleScenes 场景定义', () => {
  test('四个场景与默认配置', () => {
    expect(SIMPLE_SCENES.map((s) => s.value)).toEqual([ 'open', 'block-ip', 'block-net', 'forward' ]);
    expect(SIMPLE_SCENES.every((s) => s.label !== '' && s.hint !== '')).toBe(true);
    expect(emptySimpleConfig().scene).toBe('open');
    expect(emptySimpleConfig().port).toBe('80');
  });
});

describe('IP / 网段校验', () => {
  test('IP 字面量', () => {
    expect(isIpLiteral('203.0.113.10')).toBe(true);
    expect(isIpLiteral('2001:db8::1')).toBe(true);
    expect(isIpLiteral('1.2.3.999')).toBe(false);
    expect(isIpLiteral('example.com')).toBe(false);
    expect(isIpLiteral('1.2.3.4/24')).toBe(false);
    expect(isIpLiteral('')).toBe(false);
  });

  test('网段', () => {
    expect(isCidr('203.0.113.0/24')).toBe(true);
    expect(isCidr('10.0.0.0/8')).toBe(true);
    expect(isCidr('2001:db8::/32')).toBe(true);
    expect(isCidr('203.0.113.0/33')).toBe(false);
    expect(isCidr('203.0.113.0')).toBe(false);
    expect(isCidr('/24')).toBe(false);
    expect(isCidr('2001:db8::/129')).toBe(false);
  });
});

describe('开放端口', () => {
  test('默认开放 80 端口', () => {
    const plan = buildSimplePlan(cfg());
    expect(plan.errors).toEqual([]);
    expect(plan.commands).toEqual([ 'iptables -t filter -A INPUT -p tcp --dport 80 -j ACCEPT' ]);
    expect(plan.restore).toEqual([ '-A INPUT -p tcp --dport 80 -j ACCEPT' ]);
    expect(plan.extra).toEqual([]);
    expect(plan.fileName).toBe('iptables-open.sh');
    expect(plan.warnings).toContain('simple-open-established');
    expect(plan.warnings).toContain('append-last');
  });

  test('udp 与多端口 / 端口区间', () => {
    expect(buildSimplePlan(cfg({ protocol: 'udp', port: '53' })).commands[0])
      .toBe('iptables -t filter -A INPUT -p udp --dport 53 -j ACCEPT');
    expect(buildSimplePlan(cfg({ port: '80,443' })).commands[0])
      .toBe('iptables -t filter -A INPUT -p tcp -m multiport --dports 80,443 -j ACCEPT');
    expect(buildSimplePlan(cfg({ port: '8000:8010' })).commands[0])
      .toBe('iptables -t filter -A INPUT -p tcp --dport 8000:8010 -j ACCEPT');
  });

  test('带备注', () => {
    expect(buildSimplePlan(cfg({ comment: 'SSH' })).commands[0])
      .toBe('iptables -t filter -A INPUT -p tcp --dport 80 -m comment --comment SSH -j ACCEPT');
  });

  test('放行 22 端口给出额外提示', () => {
    const plan = buildSimplePlan(cfg({ port: '22' }));
    expect(plan.warnings).toContain('simple-open-ssh');
    expect(plan.warnings).toContain('simple-open-established');
  });

  test('端口为空 / 非法', () => {
    expect(buildSimplePlan(cfg({ port: '' })).errors).toEqual([ 'simple-port-required' ]);
    const bad = buildSimplePlan(cfg({ port: '70000' }));
    expect(bad.errors).toEqual([ 'simple-port-format' ]);
    expect(bad.commands).toEqual([]);
    expect(bad.view).toEqual([]);
    expect(bad.fileName).toBe('iptables-open.sh');
  });

  test('查看与删除指令', () => {
    const plan = buildSimplePlan(cfg());
    expect(plan.view).toEqual([
      'iptables -t filter -nL INPUT --line-numbers',
      'iptables -t filter -nL -v',
    ]);
    expect(plan.remove).toEqual([ 'iptables -t filter -D INPUT -p tcp --dport 80 -j ACCEPT' ]);
    expect(plan.persist).toContain('netfilter-persistent save');
  });
});

describe('封禁 IP', () => {
  test('封禁单个 IP', () => {
    const plan = buildSimplePlan(cfg({ scene: 'block-ip', sourceIp: '203.0.113.10', comment: '攻击源' }));
    expect(plan.errors).toEqual([]);
    expect(plan.commands).toEqual([ 'iptables -t filter -A INPUT -s 203.0.113.10 -m comment --comment 攻击源 -j DROP' ]);
    expect(plan.restore).toEqual([ '-A INPUT -s 203.0.113.10 -m comment --comment 攻击源 -j DROP' ]);
    expect(plan.warnings).toContain('simple-block-existing');
    expect(plan.warnings).toContain('simple-block-inbound');
    expect(plan.fileName).toBe('iptables-block-ip.sh');
  });

  test('IPv6 地址', () => {
    expect(buildSimplePlan(cfg({ scene: 'block-ip', sourceIp: '2001:db8::1' })).commands[0])
      .toBe('iptables -t filter -A INPUT -s 2001:db8::1 -j DROP');
  });

  test('缺 IP / 非法 IP', () => {
    expect(buildSimplePlan(cfg({ scene: 'block-ip' })).errors).toEqual([ 'simple-ip-required' ]);
    expect(buildSimplePlan(cfg({ scene: 'block-ip', sourceIp: '1.2.3.999' })).errors).toEqual([ 'simple-ip-format' ]);
    expect(buildSimplePlan(cfg({ scene: 'block-ip', sourceIp: 'evil.com' })).errors).toEqual([ 'simple-ip-format' ]);
  });
});

describe('封禁网段', () => {
  test('封禁 CIDR 网段', () => {
    const plan = buildSimplePlan(cfg({ scene: 'block-net', sourceNet: '203.0.113.0/24' }));
    expect(plan.errors).toEqual([]);
    expect(plan.commands).toEqual([ 'iptables -t filter -A INPUT -s 203.0.113.0/24 -j DROP' ]);
    expect(plan.remove).toEqual([ 'iptables -t filter -D INPUT -s 203.0.113.0/24 -j DROP' ]);
    expect(plan.fileName).toBe('iptables-block-net.sh');
  });

  test('IPv6 网段', () => {
    expect(buildSimplePlan(cfg({ scene: 'block-net', sourceNet: '2001:db8::/32' })).commands[0])
      .toBe('iptables -t filter -A INPUT -s 2001:db8::/32 -j DROP');
  });

  test('缺网段 / 非法网段', () => {
    expect(buildSimplePlan(cfg({ scene: 'block-net' })).errors).toEqual([ 'simple-net-required' ]);
    expect(buildSimplePlan(cfg({ scene: 'block-net', sourceNet: '203.0.113.0' })).errors).toEqual([ 'simple-net-format' ]);
    expect(buildSimplePlan(cfg({ scene: 'block-net', sourceNet: '203.0.113.0/33' })).errors).toEqual([ 'simple-net-format' ]);
  });
});

describe('端口转发', () => {
  const forward = (patch: Partial<SimpleConfig> = {}) =>
    buildSimplePlan(cfg({ scene: 'forward', port: '8080', targetIp: '10.0.0.5', targetPort: '8080', ...patch }));

  test('三条指令: DNAT / FORWARD 放行 / MASQUERADE', () => {
    const plan = forward();
    expect(plan.errors).toEqual([]);
    expect(plan.commands).toEqual([
      'iptables -t nat -A PREROUTING -p tcp --dport 8080 -j DNAT --to-destination 10.0.0.5:8080',
      'iptables -t filter -A FORWARD -p tcp -d 10.0.0.5 --dport 8080 -j ACCEPT',
      'iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE',
    ]);
    expect(plan.restore).toEqual([
      '-A PREROUTING -p tcp --dport 8080 -j DNAT --to-destination 10.0.0.5:8080',
      '-A FORWARD -p tcp -d 10.0.0.5 --dport 8080 -j ACCEPT',
      '-A POSTROUTING -o eth0 -j MASQUERADE',
    ]);
    expect(plan.fileName).toBe('iptables-forward.sh');
  });

  test('内核转发附加指令与提示', () => {
    const plan = forward();
    expect(plan.extra[0]).toContain('sysctl -w net.ipv4.ip_forward=1');
    expect(plan.extra[1]).toContain('/etc/sysctl.d/99-ip-forward.conf');
    expect(plan.warnings).toContain('forward');
    expect(plan.warnings).not.toContain('simple-forward-iface');
  });

  test('查看 / 删除指令按链去重', () => {
    const plan = forward();
    expect(plan.view).toEqual([
      'iptables -t nat -nL PREROUTING --line-numbers',
      'iptables -t filter -nL FORWARD --line-numbers',
      'iptables -t nat -nL POSTROUTING --line-numbers',
      'iptables -t nat -nL -v',
    ]);
    expect(plan.remove).toEqual([
      'iptables -t nat -D PREROUTING -p tcp --dport 8080 -j DNAT --to-destination 10.0.0.5:8080',
      'iptables -t filter -D FORWARD -p tcp -d 10.0.0.5 --dport 8080 -j ACCEPT',
      'iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE',
    ]);
  });

  test('不同对外与目标端口', () => {
    const plan = forward({ port: '80', protocol: 'udp', targetPort: '9090' });
    expect(plan.commands[0]).toBe('iptables -t nat -A PREROUTING -p udp --dport 80 -j DNAT --to-destination 10.0.0.5:9090');
    expect(plan.commands[1]).toBe('iptables -t filter -A FORWARD -p udp -d 10.0.0.5 --dport 9090 -j ACCEPT');
  });

  test('IPv6 目标地址加方括号', () => {
    expect(forward({ targetIp: '2001:db8::5' }).commands[0])
      .toBe('iptables -t nat -A PREROUTING -p tcp --dport 8080 -j DNAT --to-destination [2001:db8::5]:8080');
  });

  test('未填出口网卡: MASQUERADE 不带 -o 并给出提示', () => {
    const plan = forward({ outIface: '  ' });
    expect(plan.commands[2]).toBe('iptables -t nat -A POSTROUTING -j MASQUERADE');
    expect(plan.warnings).toContain('simple-forward-iface');
  });

  test('缺目标 IP / 端口', () => {
    expect(forward({ targetIp: '' }).errors).toEqual([ 'simple-target-ip-required' ]);
    expect(forward({ targetIp: '10.0.0.999' }).errors).toEqual([ 'simple-target-ip-format' ]);
    expect(forward({ targetPort: '' }).errors).toEqual([ 'simple-target-port-required' ]);
    expect(forward({ targetPort: '80,443' }).errors).toEqual([ 'simple-target-port-format' ]);
    expect(forward({ port: '8080', targetPort: '70000' }).errors).toEqual([ 'simple-target-port-format' ]);
  });
});

describe('buildSimpleScript', () => {
  test('校验失败时返回空字符串', () => {
    expect(buildSimpleScript(buildSimplePlan(cfg({ port: '' })))).toBe('');
  });

  test('脚本包含各段', () => {
    const script = buildSimpleScript(buildSimplePlan(cfg({ scene: 'forward', port: '8080', targetIp: '10.0.0.5', targetPort: '8080' })));
    expect(script.startsWith('#!/bin/bash')).toBe(true);
    expect(script).toContain('iptables -t nat -A PREROUTING -p tcp --dport 8080 -j DNAT --to-destination 10.0.0.5:8080');
    expect(script).toContain('# ---- 附加系统指令 (内核转发) ----');
    expect(script).toContain('# ---- 查看 ----');
    expect(script).toContain('# ---- 删除 ----');
    expect(script).toContain('# ---- 保存 ----');
    expect(script).toContain('iptables -t nat -D PREROUTING');
  });

  test('开放端口脚本不含附加系统指令段', () => {
    const script = buildSimpleScript(buildSimplePlan(cfg()));
    expect(script).toContain('iptables -t filter -A INPUT -p tcp --dport 80 -j ACCEPT');
    expect(script).not.toContain('附加系统指令');
  });
});
