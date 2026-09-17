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

// ---------- IPv4 -> IPv6 ----------
import { compressIpv6, formatIpv6, ipv4ToIpv6Forms, ipv4ToIpv6FormsSafe } from './lib';

describe('compressIpv6', () => {
  it('最长连续 0 段压缩成 ::', () => {
    expect(compressIpv6([ 1, 0, 0, 0, 0, 0, 0, 1 ])).toBe('1::1');
    expect(compressIpv6([ 0, 0, 0, 0, 0, 0, 0, 0 ])).toBe('::');
    expect(compressIpv6([ 0x2002, 0xc0a8, 0x101, 0, 0, 0, 0, 0 ])).toBe('2002:c0a8:101::');
    expect(compressIpv6([ 0, 0, 0, 0, 0, 0xffff, 0xc0a8, 0x101 ])).toBe('::ffff:c0a8:101');
  });

  it('只有一段 0 时不压缩, 字母小写并去前导零', () => {
    expect(compressIpv6([ 1, 0, 2, 3, 4, 5, 6, 7 ])).toBe('1:0:2:3:4:5:6:7');
    expect(compressIpv6([ 0xabcd, 1, 2, 3, 4, 5, 6, 7 ])).toBe('abcd:1:2:3:4:5:6:7');
    expect(compressIpv6([ 0x0001, 0x0002, 3, 4, 5, 6, 7, 8 ])).toBe('1:2:3:4:5:6:7:8');
  });

  it('并列的 0 段取靠左的一段, 行首 / 行尾的 :: 也不会多出冒号', () => {
    expect(compressIpv6([ 0, 0, 1, 0, 0 ])).toBe('::1:0:0');
    // 两段 0 长度不同 -> 压缩更长的那段 (此处是行尾)
    expect(compressIpv6([ 0, 0, 1, 2, 3, 0, 0, 0 ])).toBe('0:0:1:2:3::');
    expect(compressIpv6([ 1, 2, 3, 4, 5, 6, 0, 0 ])).toBe('1:2:3:4:5:6::');
  });
});

describe('formatIpv6', () => {
  it('full: 8 组补足 4 位', () => {
    expect(formatIpv6([ 0, 0, 0, 0, 0, 0xffff, 0xc0a8, 0x101 ], 'full'))
      .toBe('0000:0000:0000:0000:0000:ffff:c0a8:0101');
    expect(formatIpv6([ 0x2002, 0xc0a8, 0x101 ], 'full'))
      .toBe('2002:c0a8:0101:0000:0000:0000:0000:0000'); // 不足 8 组按 0 补齐
  });

  it('mixed: 末尾 32 位写成点分 IPv4', () => {
    expect(formatIpv6([ 0, 0, 0, 0, 0, 0xffff, 0xc0a8, 0x101 ], 'mixed')).toBe('::ffff:192.168.1.1');
    expect(formatIpv6([ 0, 0, 0, 0, 0, 0, 0xc0a8, 0x101 ], 'mixed')).toBe('::192.168.1.1');
    expect(formatIpv6([ 0x64, 0xff9b, 0, 0, 0, 0, 0xc0a8, 0x101 ], 'mixed')).toBe('64:ff9b::192.168.1.1');
    expect(formatIpv6([ 0, 0, 0, 0, 0, 0, 0, 0 ], 'mixed')).toBe('::0.0.0.0');
  });

  it('compressed: 不写点分, 直接压缩', () => {
    expect(formatIpv6([ 0, 0, 0, 0, 0, 0xc0a8, 0x101, 0xffff ], 'compressed'))
      .toBe('::c0a8:101:ffff');
    expect(formatIpv6([ 0, 0, 0, 0, 0, 0xffff, 0xc0a8, 0x101 ])).toBe('::ffff:c0a8:101');
  });
});

describe('ipv4ToIpv6Forms', () => {
  it('192.168.1.1 的各类写法', () => {
    const map = Object.fromEntries(ipv4ToIpv6Forms('192.168.1.1').map((f) => [ f.key, f.value ]));
    expect(map).toEqual({
      ipv6Mapped: '::ffff:192.168.1.1',
      ipv6MappedHex: '::ffff:c0a8:101',
      ipv6Compat: '::192.168.1.1',
      ipv6SixToFour: '2002:c0a8:101::',
      ipv6Nat64: '64:ff9b::192.168.1.1',
      ipv6Full: '0000:0000:0000:0000:0000:ffff:c0a8:0101',
    });
  });

  it('1.2.3.4 的各类写法', () => {
    const map = Object.fromEntries(ipv4ToIpv6Forms('1.2.3.4').map((f) => [ f.key, f.value ]));
    expect(map.ipv6Mapped).toBe('::ffff:1.2.3.4');
    expect(map.ipv6MappedHex).toBe('::ffff:102:304');
    expect(map.ipv6Compat).toBe('::1.2.3.4');
    expect(map.ipv6SixToFour).toBe('2002:102:304::');
    expect(map.ipv6Nat64).toBe('64:ff9b::1.2.3.4');
    expect(map.ipv6Full).toBe('0000:0000:0000:0000:0000:ffff:0102:0304');
  });

  it('0.0.0.0 与 255.255.255.255 也不产生多余冒号', () => {
    const zero = Object.fromEntries(ipv4ToIpv6Forms('0.0.0.0').map((f) => [ f.key, f.value ]));
    expect(zero.ipv6Mapped).toBe('::ffff:0.0.0.0');
    expect(zero.ipv6MappedHex).toBe('::ffff:0:0');
    expect(zero.ipv6Compat).toBe('::0.0.0.0');
    expect(zero.ipv6SixToFour).toBe('2002::');
    expect(zero.ipv6Nat64).toBe('64:ff9b::0.0.0.0');
    const all = Object.fromEntries(ipv4ToIpv6Forms('255.255.255.255').map((f) => [ f.key, f.value ]));
    expect(all.ipv6Mapped).toBe('::ffff:255.255.255.255');
    expect(all.ipv6SixToFour).toBe('2002:ffff:ffff::');
    expect(all.ipv6Full).toBe('0000:0000:0000:0000:0000:ffff:ffff:ffff');
  });

  it('每条写法都带 key, 非法地址抛错 / 安全版返回空数组', () => {
    expect(ipv4ToIpv6Forms('8.8.8.8')).toHaveLength(6);
    expect(ipv4ToIpv6Forms('8.8.8.8').every((f) => f.key !== '' && f.value !== '')).toBe(true);
    expect(() => ipv4ToIpv6Forms('256.1.1.1')).toThrow();
    expect(() => ipv4ToIpv6Forms('')).toThrow();
    expect(ipv4ToIpv6FormsSafe('256.1.1.1')).toEqual([]);
    expect(ipv4ToIpv6FormsSafe('8.8.8.8')).toHaveLength(6);
  });

  it('映射地址与兼容地址的十六进制写法互不相同', () => {
    const map = Object.fromEntries(ipv4ToIpv6Forms('10.0.0.1').map((f) => [ f.key, f.value ]));
    expect(map.ipv6MappedHex).toBe('::ffff:a00:1');
    expect(map.ipv6SixToFour).toBe('2002:a00:1::');
    expect(map.ipv6Nat64).toBe('64:ff9b::10.0.0.1');
  });
});
