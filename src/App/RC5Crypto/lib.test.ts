import { hexToBytes, bytesToHex } from '../../lib/symcipher';
import {
  makeRc5Codec,
  rc5Encrypt,
  rc5Decrypt,
  rc5KeyValid,
  rc5IvValid,
  genCapacity,
} from './lib';

// 参考向量: 与 npm rc5@2.1.0 (RC5-32/12/16, 小端组字) 实测一致
const VECTORS :Array<[keyHex :string, ptHex :string, ctHex :string]> = [
  ['00000000000000000000000000000000', '0000000000000000', '21a5dbee154b8f6d'],
  ['000102030405060708090a0b0c0d0e0f', '0000000000000000', 'b05f67ed0913b5a2'],
  ['000102030405060708090a0b0c0d0e0f', '0102030405060708', '734795f82abff1ba'],
  ['0001020304050607', '0000000000000000', '1a82fabe15e3a1ac'],
  ['c0ffee', '0000000000000000', '83f8ca317c1397d9'],
];

describe('RC5-32/12/16 单块 (参考实现互证)', () => {
  it.each(VECTORS)('key=%s pt=%s -> ct=%s', (keyHex, ptHex, ctHex) => {
    const codec = makeRc5Codec(hexToBytes(keyHex));
    const block = hexToBytes(ptHex);
    codec.encryptBlock(block);
    expect(bytesToHex(block)).toBe(ctHex);
    codec.decryptBlock(block);
    expect(bytesToHex(block)).toBe(ptHex);
  });
});

describe('RC5 校验函数', () => {
  it('密钥: UTF-8 字节数须等于位数/8', () => {
    expect(rc5KeyValid('1234567890123456', 128)).toBe(true);
    expect(rc5KeyValid('123456789012345678', 128)).toBe(false);
    expect(rc5KeyValid('123456789012345678901234', 192)).toBe(true);
    expect(rc5KeyValid('12345678901234567890123456789012', 256)).toBe(true);
    expect(rc5KeyValid('', 128)).toBe(false);
    expect(rc5KeyValid('中文字符密钥十', 128)).toBe(false); // utf8 > 16 字节
  });

  it('IV: 空 / 8 字符 / 16 位 HEX 合法', () => {
    expect(rc5IvValid('')).toBe(true);
    expect(rc5IvValid('12345678')).toBe(true);
    expect(rc5IvValid('aabbccddeeff0011')).toBe(true);
    expect(rc5IvValid('123')).toBe(false);
    expect(rc5IvValid('aabbccddeeff00110')).toBe(false);
    expect(rc5IvValid('12345678901234567')).toBe(false);
  });

  it('genCapacity 依据密钥长度推断位档', () => {
    expect(genCapacity(10)).toBe(128);
    expect(genCapacity(16)).toBe(192);
    expect(genCapacity(20)).toBe(192);
    expect(genCapacity(24)).toBe(256);
    expect(genCapacity(30)).toBe(256);
  });
});

describe('RC5 加解密链路 (UTF-8 密钥/文本)', () => {
  const key = 'rc5-secret-12345'; // 16 字符 = 128 位
  const plain = 'Hello RC5! 你好世界 0123456789';
  const optsBase = { capacity: 128, code: 'HEX' as const };

  it('ECB + Pkcs7 往返一致', () => {
    const ct = rc5Encrypt(plain, key, { ...optsBase, mode: 'ECB', padding: 'Pkcs7' });
    expect(rc5Decrypt(ct, key, { ...optsBase, mode: 'ECB', padding: 'Pkcs7' })).toBe(plain);
  });

  it('CBC + Pkcs7 往返一致 (IV 字符)', () => {
    const opts = { ...optsBase, mode: 'CBC' as const, padding: 'Pkcs7' as const, iv: '12345678' };
    const ct = rc5Encrypt(plain, key, opts);
    expect(rc5Decrypt(ct, key, opts)).toBe(plain);
  });

  it('CBC + ZeroPadding/AnsiX923/Iso10126/Iso97971 往返一致 (IV hex)', () => {
    for (const padding of ['ZeroPadding', 'AnsiX923', 'Iso10126', 'Iso97971'] as const) {
      const opts = { ...optsBase, mode: 'CBC' as const, padding, iv: 'aabbccddeeff0011' };
      const ct = rc5Encrypt(plain, key, opts);
      expect(rc5Decrypt(ct, key, opts)).toBe(plain);
    }
  });

  it('流模式 CFB/OFB/CTR 任意长度往返一致 (无需填充)', () => {
    for (const mode of ['CFB', 'OFB', 'CTR'] as const) {
      const opts = { ...optsBase, mode, padding: 'Pkcs7' as const, iv: '12345678' };
      const ct = rc5Encrypt(plain, key, opts);
      expect(rc5Decrypt(ct, key, opts)).toBe(plain);
      // 非块长整数倍的文本
      const odd = 'abc';
      const ct2 = rc5Encrypt(odd, key, opts);
      expect(rc5Decrypt(ct2, key, opts)).toBe(odd);
    }
  });

  it('Base64 编码往返一致', () => {
    const opts = { ...optsBase, code: 'Base64' as const, mode: 'CBC' as const, padding: 'Pkcs7' as const, iv: '12345678' };
    const ct = rc5Encrypt(plain, key, opts);
    expect(/^[A-Za-z0-9+/]+={0,2}$/.test(ct)).toBe(true);
    expect(rc5Decrypt(ct, key, opts)).toBe(plain);
  });

  it('错误密钥解密抛填充异常, 不同密文互不相同', () => {
    const opts = { ...optsBase, mode: 'ECB' as const, padding: 'Pkcs7' as const };
    const a = rc5Encrypt('aaaaaaaaaaaa', key, opts);
    const b = rc5Encrypt('aaaaaaaaaaaa', '1234567890123457', opts);
    expect(a).not.toBe(b);
    expect(() => rc5Decrypt(a, '1234567890123457', opts)).toThrow();
  });
});
