import { hexToBytes, bytesToHex } from '../../lib/symcipher';
import {
  makeRc6Codec,
  rc6Encrypt,
  rc6Decrypt,
  rc6KeyValid,
  rc6IvValid,
  genCapacity,
} from './lib';

// 官方向量: Bouncy Castle RC6Test (RC6-32/20/16, 大端组字)
const VECTORS :Array<[keyHex :string, ptHex :string, ctHex :string]> = [
  ['00000000000000000000000000000000', '80000000000000000000000000000000', 'f71f65e7b80c0c6966fee607984b5cdf'],
  ['000000000000000000000000000000008000000000000000', '00000000000000000000000000000000', 'dd04c176440bbc6686c90aee775bd368'],
  ['000000000000000000000000000000000000001000000000', '00000000000000000000000000000000', '937fe02d20fcb72f0f57201012b88ba4'],
  ['00000001000000000000000000000000', '00000000000000000000000000000000', '8a380594d7396453771a1dfbe2914c8e'],
  ['1000000000000000000000000000000000000000000000000000000000000000', '00000000000000000000000000000000', '11395d4bfe4c8258979ee2bf2d24dff4'],
  ['0000000000000000000000000000000000080000000000000000000000000000', '00000000000000000000000000000000', '3d6f7e99f6512553bb983e8f75672b97'],
];

describe('RC6 单块 (BC 官方向量)', () => {
  it.each(VECTORS)('key=%s pt=%s -> ct=%s', (keyHex, ptHex, ctHex) => {
    const codec = makeRc6Codec(hexToBytes(keyHex));
    const block = hexToBytes(ptHex);
    codec.encryptBlock(block);
    expect(bytesToHex(block)).toBe(ctHex);
    codec.decryptBlock(block);
    expect(bytesToHex(block)).toBe(ptHex);
  });
});

describe('RC6 校验函数', () => {
  it('密钥: UTF-8 字节数须等于位数/8', () => {
    expect(rc6KeyValid('1234567890123456', 128)).toBe(true);
    expect(rc6KeyValid('123456789012345678901234', 192)).toBe(true);
    expect(rc6KeyValid('12345678901234567890123456789012', 256)).toBe(true);
    expect(rc6KeyValid('123456789012345678', 128)).toBe(false);
    expect(rc6KeyValid('', 128)).toBe(false);
  });

  it('IV: 空 / 16 字符 / 32 位 HEX 合法', () => {
    expect(rc6IvValid('')).toBe(true);
    expect(rc6IvValid('1234567890123456')).toBe(true);
    expect(rc6IvValid('aabbccddeeff00112233445566778899')).toBe(true);
    expect(rc6IvValid('123')).toBe(false);
    expect(rc6IvValid('12345678901234567')).toBe(false);
  });

  it('genCapacity 依据密钥长度推断位档', () => {
    expect(genCapacity(10)).toBe(128);
    expect(genCapacity(16)).toBe(192);
    expect(genCapacity(24)).toBe(256);
  });
});

describe('RC6 加解密链路 (UTF-8 密钥/文本)', () => {
  const key = 'rc6-secret-12345'; // 16 字符 = 128 位
  const plain = 'Hello RC6! 你好世界 0123456789';
  const optsBase = { capacity: 128, code: 'HEX' as const };

  it('ECB + Pkcs7 往返一致', () => {
    const ct = rc6Encrypt(plain, key, { ...optsBase, mode: 'ECB', padding: 'Pkcs7' });
    expect(rc6Decrypt(ct, key, { ...optsBase, mode: 'ECB', padding: 'Pkcs7' })).toBe(plain);
  });

  it('CBC + 各填充 往返一致 (IV hex/字符)', () => {
    for (const padding of ['Pkcs7', 'ZeroPadding', 'AnsiX923', 'Iso10126', 'Iso97971'] as const) {
      const opts = { ...optsBase, mode: 'CBC' as const, padding, iv: 'aabbccddeeff00112233445566778899' };
      const ct = rc6Encrypt(plain, key, opts);
      expect(rc6Decrypt(ct, key, opts)).toBe(plain);
    }
    const optsChar = { ...optsBase, mode: 'CBC' as const, padding: 'Pkcs7' as const, iv: '1234567890123456' };
    const ct = rc6Encrypt(plain, key, optsChar);
    expect(rc6Decrypt(ct, key, optsChar)).toBe(plain);
  });

  it('流模式 CFB/OFB/CTR 任意长度往返一致 (无需填充)', () => {
    for (const mode of ['CFB', 'OFB', 'CTR'] as const) {
      const opts = { ...optsBase, mode, padding: 'Pkcs7' as const, iv: '1234567890123456' };
      const ct = rc6Encrypt(plain, key, opts);
      expect(rc6Decrypt(ct, key, opts)).toBe(plain);
      const odd = 'abc';
      const ct2 = rc6Encrypt(odd, key, opts);
      expect(rc6Decrypt(ct2, key, opts)).toBe(odd);
    }
  });

  it('Base64 编码往返一致', () => {
    const opts = { ...optsBase, code: 'Base64' as const, mode: 'CBC' as const, padding: 'Pkcs7' as const, iv: '1234567890123456' };
    const ct = rc6Encrypt(plain, key, opts);
    expect(/^[A-Za-z0-9+/]+={0,2}$/.test(ct)).toBe(true);
    expect(rc6Decrypt(ct, key, opts)).toBe(plain);
  });

  it('不同密钥产出不同密文, 错误密钥解密抛异常', () => {
    const opts = { ...optsBase, mode: 'ECB' as const, padding: 'Pkcs7' as const };
    const a = rc6Encrypt('aaaaaaaaaaaaaaaa', key, opts);
    const b = rc6Encrypt('aaaaaaaaaaaaaaaa', 'rc6-secret-1234X', opts);
    expect(a).not.toBe(b);
    expect(() => rc6Decrypt(a, 'rc6-secret-1234X', opts)).toThrow();
  });
});
