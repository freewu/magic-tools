import {
  parseIpv4, ipToU32, u32ToIp, parseCidr, calcCidr, classifyNetwork, CIDR_PRESETS,
} from './lib';

describe('IPv4 解析', () => {
  test('合法地址', () => {
    expect(parseIpv4('10.1.2.3')).toEqual([10, 1, 2, 3]);
    expect(parseIpv4('255.255.255.255')).toEqual([255, 255, 255, 255]);
    expect(parseIpv4(' 0.0.0.0 ')).toEqual([0, 0, 0, 0]);
  });
  test('非法地址返回 null', () => {
    expect(parseIpv4('')).toBeNull();
    expect(parseIpv4('256.1.1.1')).toBeNull();
    expect(parseIpv4('1.2.3')).toBeNull();
    expect(parseIpv4('1.2.3.4.5')).toBeNull();
    expect(parseIpv4('a.b.c.d')).toBeNull();
    expect(parseIpv4('1.2.3.999')).toBeNull();
  });
});

describe('CIDR 解析', () => {
  test('带前缀', () => {
    expect(parseCidr('192.168.1.0/24')).toEqual({ ip: [192, 168, 1, 0], prefix: 24 });
  });
  test('纯 IP 视为 /32', () => {
    expect(parseCidr('203.0.113.25')).toEqual({ ip: [203, 0, 113, 25], prefix: 32 });
  });
  test('非法返回 null', () => {
    expect(parseCidr('')).toBeNull();
    expect(parseCidr('1.2.3.4/33')).toBeNull();
    expect(parseCidr('1.2.3.4/-1')).toBeNull();
    expect(parseCidr('1.2.3.4/xx')).toBeNull();
    expect(parseCidr('256.1.1.0/24')).toBeNull();
    expect(parseCidr('1.2.3.4/24.5')).toBeNull();
  });
});

describe('u32 与字符串互转', () => {
  test('往返一致', () => {
    expect(u32ToIp(ipToU32([192, 168, 1, 10]))).toBe('192.168.1.10');
    expect(u32ToIp(0)).toBe('0.0.0.0');
    expect(u32ToIp(0xffffffff)).toBe('255.255.255.255');
  });
});

describe('calcCidr 计算', () => {
  test('C 类 192.168.1.0/24', () => {
    const r = calcCidr('192.168.1.0/24')!;
    expect(r.mask).toBe('255.255.255.0');
    expect(r.wildcard).toBe('0.0.0.255');
    expect(r.network).toBe('192.168.1.0');
    expect(r.broadcast).toBe('192.168.1.255');
    expect(r.firstHost).toBe('192.168.1.1');
    expect(r.lastHost).toBe('192.168.1.254');
    expect(r.totalHosts).toBe(256);
    expect(r.usableHosts).toBe(254);
    expect(r.nature).toContain('私有地址 (RFC 1918, 192.168.0.0/16)');
  });

  test('A 类 10.0.0.0/8', () => {
    const r = calcCidr('10.10.3.5/8')!;
    expect(r.network).toBe('10.0.0.0');
    expect(r.broadcast).toBe('10.255.255.255');
    expect(r.mask).toBe('255.0.0.0');
    expect(r.totalHosts).toBe(16777216);
    expect(r.usableHosts).toBe(16777214);
    expect(r.nature).toContain('私有地址 (RFC 1918, 10.0.0.0/8)');
  });

  test('B 类 172.16.0.0/16', () => {
    const r = calcCidr('172.16.5.1/16')!;
    expect(r.network).toBe('172.16.0.0');
    expect(r.broadcast).toBe('172.16.255.255');
    expect(r.firstHost).toBe('172.16.0.1');
  });

  test('点对点 /30', () => {
    const r = calcCidr('198.51.100.4/30')!;
    expect(r.network).toBe('198.51.100.4');
    expect(r.broadcast).toBe('198.51.100.7');
    expect(r.firstHost).toBe('198.51.100.5');
    expect(r.lastHost).toBe('198.51.100.6');
    expect(r.totalHosts).toBe(4);
    expect(r.usableHosts).toBe(2);
  });

  test('单主机 /32', () => {
    const r = calcCidr('203.0.113.25')!;
    expect(r.network).toBe('203.0.113.25');
    expect(r.broadcast).toBe('203.0.113.25');
    expect(r.firstHost).toBeNull();
    expect(r.lastHost).toBeNull();
    expect(r.totalHosts).toBe(1);
    expect(r.usableHosts).toBe(1);
  });

  test('点对点 /31 (RFC 3021)', () => {
    const r = calcCidr('203.0.113.0/31')!;
    expect(r.network).toBe('203.0.113.0');
    expect(r.broadcast).toBe('203.0.113.1');
    expect(r.firstHost).toBe('203.0.113.0');
    expect(r.lastHost).toBe('203.0.113.1');
    expect(r.totalHosts).toBe(2);
    expect(r.usableHosts).toBe(2);
  });

  test('/0 全地址段', () => {
    const r = calcCidr('0.0.0.0/0')!;
    expect(r.mask).toBe('0.0.0.0');
    expect(r.network).toBe('0.0.0.0');
    expect(r.broadcast).toBe('255.255.255.255');
    expect(r.totalHosts).toBe(4294967296);
    expect(r.usableHosts).toBe(4294967294);
  });

  test('主机位清零: 输入非网络地址也归到网段起始', () => {
    const r = calcCidr('192.168.1.200/24')!;
    expect(r.network).toBe('192.168.1.0');
    expect(r.ip).toBe('192.168.1.200');
  });

  test('非法输入返回 null', () => {
    expect(calcCidr('hello')).toBeNull();
    expect(calcCidr('1.2.3.4/64')).toBeNull();
    expect(calcCidr('')).toBeNull();
  });
});

describe('网段分类', () => {
  test('各类地址性质', () => {
    expect(classifyNetwork(0x7f000001)).toContain('环回地址 (Loopback 127.0.0.0/8)');
    expect(classifyNetwork(0x64400000)).toContain('运营商级 NAT 共享地址 (CGNAT 100.64.0.0/10)');
    expect(classifyNetwork(0xc0000200)).toContain('文档示例 TEST-NET-1 (192.0.2.0/24, RFC 5737)');
    expect(classifyNetwork(0xcb007100)).toContain('文档示例 TEST-NET-3 (203.0.113.0/24, RFC 5737)');
    expect(classifyNetwork(0xe0000000)).toContain('组播地址 (Multicast 224.0.0.0/4)');
    expect(classifyNetwork(0x8e000000)).toContain('公网地址 (Global Unicast)');
    expect(classifyNetwork(0xffffffff)).toContain('受限广播地址 (255.255.255.255)');
  });
});

describe('快速示例预设', () => {
  test('五个预设均能正常计算', () => {
    expect(CIDR_PRESETS.map((p) => p.label)).toEqual(['A 类', 'B 类', 'C 类', '单主机', '点对点']);
    for (const p of CIDR_PRESETS) {
      expect(calcCidr(p.cidr)).not.toBeNull();
    }
  });
});
