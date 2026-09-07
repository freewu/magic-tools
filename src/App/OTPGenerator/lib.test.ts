import { base32ToBytes, bytesToBase32, hotp, totp, totpRemaining, randomBase32Secret, buildOtpUri } from './lib';

// RFC 4226 / RFC 6238 测试密钥 (RFC 6238 附录 B: SHA1 用 20 字节密钥, SHA256 用 32 字节, SHA512 用 64 字节)
// ASCII "12345678901234567890..." 对应 Base32
const SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';                                      // 20B
const SECRET_SHA256 = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZA';          // 32B
const SECRET_SHA512 = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNA'; // 64B

describe('base32', () => {
  it('解码 RFC 4648 向量 (含 padding)', () => {
    const utf8 = (s :string) => Array.from(new TextEncoder().encode(s));
    expect(Array.from(base32ToBytes('MZXW6YTBOI======'))).toEqual(utf8('foobar'));
    expect(Array.from(base32ToBytes('MY======'))).toEqual(utf8('f'));
  });

  it('解码 ASCII 12345678901234567890 的 Base32', () => {
    const expectBytes = Array.from(new TextEncoder().encode('12345678901234567890'));
    expect(Array.from(base32ToBytes(SECRET))).toEqual(expectBytes);
    // 容忍小写 / 空格 / 无 padding
    expect(Array.from(base32ToBytes('gezdgnbvgy3tqojqgezdgnbvgy3tqojq'))).toEqual(expectBytes);
    expect(Array.from(base32ToBytes('GEZD GNBV GY3T QOJQ GEZD GNBV GY3T QOJQ'))).toEqual(expectBytes);
    expect(Array.from(base32ToBytes('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ===='))).toEqual(expectBytes);
  });

  it('非法 Base32 抛错', () => {
    expect(() => base32ToBytes('')).toThrow();
    expect(() => base32ToBytes('ABC!')).toThrow();
    expect(() => base32ToBytes('0ABC')).toThrow(); // 0/1/8/9 非法
    expect(() => base32ToBytes('ABC=DEF')).toThrow(); // padding 不在末尾
  });

  it('bytesToBase32 roundtrip', () => {
    const round = (s :string) => {
      const b = new TextEncoder().encode(s);
      expect(Array.from(base32ToBytes(bytesToBase32(b)))).toEqual(Array.from(b));
    };
    round('foobar');
    round('12345678901234567890');
    round('你好，世界');
  });
});

describe('HOTP (RFC 4226 附录 D 向量, SHA1/6 位)', () => {
  const expected = [755224, 287082, 359152, 969429, 338314, 254676, 287922, 162583, 399871, 520489];
  it('counter 0..9', () => {
    expected.forEach((exp, counter) => {
      expect(hotp(SECRET, counter)).toBe(String(exp).padStart(6, '0'));
    });
  });
});

describe('TOTP (RFC 6238 附录 B 向量)', () => {
  const cases: Array<[number, number, string, string, string]> = [
    // time, digits, algorithm, expected, secret
    [59, 8, 'SHA1', '94287082', SECRET],
    [59, 8, 'SHA256', '46119246', SECRET_SHA256],
    [59, 8, 'SHA512', '90693936', SECRET_SHA512],
    [1111111109, 8, 'SHA1', '07081804', SECRET],
    [1111111109, 8, 'SHA256', '68084774', SECRET_SHA256],
    [1111111109, 8, 'SHA512', '25091201', SECRET_SHA512],
    [1111111111, 8, 'SHA1', '14050471', SECRET],
    [1111111111, 8, 'SHA256', '67062674', SECRET_SHA256],
    [1111111111, 8, 'SHA512', '99943326', SECRET_SHA512],
    [1234567890, 8, 'SHA1', '89005924', SECRET],
    [1234567890, 8, 'SHA256', '91819424', SECRET_SHA256],
    [1234567890, 8, 'SHA512', '93441116', SECRET_SHA512],
    [2000000000, 8, 'SHA1', '69279037', SECRET],
    [2000000000, 8, 'SHA256', '90698825', SECRET_SHA256],
    [2000000000, 8, 'SHA512', '38618901', SECRET_SHA512],
    [20000000000, 8, 'SHA1', '65353130', SECRET],
    [20000000000, 8, 'SHA256', '77737706', SECRET_SHA256],
    [20000000000, 8, 'SHA512', '47863826', SECRET_SHA512],
  ];
  it('SHA1/256/512 x 官方向量', () => {
    for (const [time, digits, algorithm, expected, secret] of cases) {
      expect(totp(secret, { time, digits: digits as 6 | 7 | 8, algorithm: algorithm as 'SHA1' | 'SHA256' | 'SHA512' })).toBe(expected);
    }
  });

  it('6 位 = 8 位截断后取模', () => {
    // 8 位 94287082 取后 6 位 = 287082
    expect(totp(SECRET, { time: 59, digits: 6 })).toBe('287082');
  });

  it('totpRemaining', () => {
    expect(totpRemaining(0, 30)).toBe(30);
    expect(totpRemaining(30, 30)).toBe(30);
    expect(totpRemaining(15, 30)).toBe(15);
    expect(totpRemaining(59, 30)).toBe(1);
    expect(totpRemaining(30.5, 30)).toBe(30);
  });
});

describe('hotp/totp 一致性', () => {
  it('totp = hotp(floor(t/period))', () => {
    const t = 123456789;
    expect(totp(SECRET, { time: t, period: 30 })).toBe(hotp(SECRET, Math.floor(t / 30)));
  });
});

describe('randomBase32Secret', () => {
  it('生成 32 字符 (20 字节) Base32', () => {
    const s = randomBase32Secret();
    expect(s).toMatch(/^[A-Z2-7]{32}$/u);
    expect(base32ToBytes(s).length).toBe(20);
    expect(randomBase32Secret()).not.toBe(randomBase32Secret());
  });
});

describe('buildOtpUri', () => {
  it('TOTP URI', () => {
    const uri = buildOtpUri({ type: 'totp', secret: 'gezd gnbv', account: 'user@example.com', issuer: 'Example', digits: 6, period: 30, algorithm: 'SHA1' });
    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain('Example:user%40example.com');
    expect(uri).toContain('secret=GEZDGNBV');
    expect(uri).toContain('issuer=Example');
    expect(uri).toContain('algorithm=SHA1&digits=6&period=30');
  });
  it('HOTP URI 带 counter', () => {
    const uri = buildOtpUri({ type: 'hotp', secret: 'GEZDGNBVGY3TQOJQ', account: 'a', counter: 7 });
    expect(uri).toMatch(/^otpauth:\/\/hotp\/a\?secret=GEZDGNBVGY3TQOJQ&algorithm=SHA1&digits=6&counter=7$/u);
  });
  it('空密钥/账号抛错', () => {
    expect(() => buildOtpUri({ type: 'totp', secret: '', account: 'a' })).toThrow();
    expect(() => buildOtpUri({ type: 'totp', secret: 'ABCD', account: '  ' })).toThrow();
  });
});
