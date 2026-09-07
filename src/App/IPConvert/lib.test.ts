import { ipv4ToInt, ipv4Valid, intToIpv4, parseIntText, intTextValid, intToHex, intToBin, intToIpv4Number } from './lib';

describe('ipv4ToInt', () => {
  it('常见地址转整数', () => {
    expect(ipv4ToInt('0.0.0.0')).toBe(0);
    expect(ipv4ToInt('255.255.255.255')).toBe(4294967295);
    expect(ipv4ToInt('127.0.0.1')).toBe(2130706433);
    expect(ipv4ToInt('192.168.1.1')).toBe(3232235777);
    expect(ipv4ToInt('1.2.3.4')).toBe(0x01020304);
    expect(ipv4ToInt(' 10.0.0.1 ')).toBe(167772161); // 首尾空格容忍
  });

  it('非法 IPv4 抛错', () => {
    expect(() => ipv4ToInt('0xC0A80101')).toThrow(); // 不是点分格式
    expect(() => ipv4ToInt('300.1.1.1')).toThrow();
    expect(() => ipv4ToInt('1.2.3')).toThrow();
    expect(() => ipv4ToInt('1.2.3.4.5')).toThrow();
    expect(() => ipv4ToInt('a.b.c.d')).toThrow();
    expect(() => ipv4ToInt('')).toThrow();
    expect(() => ipv4ToInt('1.2.3.')).toThrow();
    expect(() => ipv4ToInt('1.2.3.4a')).toThrow();
    expect(() => ipv4ToInt('-1.2.3.4')).toThrow();
  });

  it('ipv4Valid', () => {
    expect(ipv4Valid('192.168.1.1')).toBe(true);
    expect(ipv4Valid('255.255.255.255')).toBe(true);
    expect(ipv4Valid('256.0.0.1')).toBe(false);
    expect(ipv4Valid('')).toBe(false);
  });
});

describe('intToIpv4 / parseIntText', () => {
  it('整数 -> IPv4', () => {
    expect(intToIpv4('0')).toBe('0.0.0.0');
    expect(intToIpv4('4294967295')).toBe('255.255.255.255');
    expect(intToIpv4('2130706433')).toBe('127.0.0.1');
    expect(intToIpv4('3232235777')).toBe('192.168.1.1');
    expect(intToIpv4Number(16909060)).toBe('1.2.3.4');
  });

  it('十六进制/二进制整数输入', () => {
    expect(intToIpv4('0xC0A80101')).toBe('192.168.1.1');
    expect(intToIpv4('0xc0a80101')).toBe('192.168.1.1');
    expect(intToIpv4('0x7f000001')).toBe('127.0.0.1');
    expect(intToIpv4('0b11000000101010000000000100000001')).toBe('192.168.1.1');
    expect(intToIpv4Number(parseIntText('0xffffffff'))).toBe('255.255.255.255');
  });

  it('roundtrip: ip -> int -> ip 一致', () => {
    const ips = ['0.0.0.0', '255.255.255.255', '1.2.3.4', '172.16.254.1', '203.0.113.9', '8.8.8.8', '223.255.254.1'];
    for (const ip of ips) {
      expect(intToIpv4(String(ipv4ToInt(ip)))).toBe(ip);
    }
  });

  it('整数范围/格式校验', () => {
    expect(intToIpv4Number(0)).toBe('0.0.0.0');
    expect(intToIpv4Number(4294967295)).toBe('255.255.255.255');
    expect(() => intToIpv4Number(-1)).toThrow();
    expect(() => intToIpv4Number(4294967296)).toThrow();
    expect(() => intToIpv4Number(1.5)).toThrow();
    expect(() => parseIntText('')).toThrow();
    expect(() => parseIntText('-1')).toThrow();
    expect(() => parseIntText('4294967296')).toThrow();
    expect(() => parseIntText('1.5')).toThrow();
    expect(() => parseIntText('zzz')).toThrow();
  });

  it('intTextValid', () => {
    expect(intTextValid('3232235777')).toBe(true);
    expect(intTextValid('0xC0A80101')).toBe(true);
    expect(intTextValid('4294967296')).toBe(false);
    expect(intTextValid('')).toBe(false);
  });
});

describe('intToHex / intToBin', () => {
  it('hex / bin 格式化', () => {
    expect(intToHex('3232235777')).toBe('C0A80101');
    expect(intToHex('0')).toBe('00000000');
    expect(intToHex('2130706433')).toBe('7F000001');
    expect(intToBin('0')).toBe('00000000000000000000000000000000');
    expect(intToBin('4294967295')).toBe('11111111111111111111111111111111');
    expect(intToBin('3232235777')).toBe('11000000101010000000000100000001');
  });
});
