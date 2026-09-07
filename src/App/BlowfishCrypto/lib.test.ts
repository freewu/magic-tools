import { hexToBytes, bytesToHex } from '../../lib/symcipher';
import {
  makeBlowfishCodec,
  blowfishEncrypt,
  blowfishDecrypt,
  blowfishKeyValid,
  blowfishIvValid,
  genCapacity,
} from './lib';

// 锚点向量: 与参考包 blowfish@1.0.1 (node) 实测一致 (明文/密钥为 ASCII 字节)
const VECTORS :Array<[keyHex :string, ptHex :string, ctHex :string]> = [
  ['30313233343536373839616263646566', '0000000000000000', 'f71350b9d36cbd75'], // key='0123456789abcdef'
  ['30313233343536373839616263646566', '48656c6c6f313233', '69b2cd5bb3450275'], // pt='Hello123'
  ['626c6f77666973682d6b65792d30313233343536373839616263646566', '0000000000000000', 'ee5a500a2de1287f'], // key='blowfish-key-0123456789abcdef'
  ['626c6f77666973682d6b65792d30313233343536373839616263646566', '3132333435363738', '2db82219d1cef40f'], // pt='12345678'
  ['6b', '0000000000000000', 'ed22444331321c1b'], // key='k'
  ['30313233343536373839616263646566303132333435363738396162636465663031323334353637', '0000000000000000', 'f1abfe56d4af0746'], // key 40 字节
];

describe('Blowfish 单块 (参考包实测锚点)', () => {
  it.each(VECTORS)('key=%s pt=%s -> ct=%s', (keyHex, ptHex, ctHex) => {
    const codec = makeBlowfishCodec(hexToBytes(keyHex));
    const block = hexToBytes(ptHex);
    codec.encryptBlock(block);
    expect(bytesToHex(block)).toBe(ctHex);
    codec.decryptBlock(block);
    expect(bytesToHex(block)).toBe(ptHex);
  });
});

describe('Blowfish 校验函数', () => {
  it('密钥: UTF-8 字节数须等于位数/8', () => {
    expect(blowfishKeyValid('1234567890123456', 128)).toBe(true);
    expect(blowfishKeyValid('123456789012345678', 128)).toBe(false);
    expect(blowfishKeyValid('123456789012345678901234', 192)).toBe(true);
    expect(blowfishKeyValid('12345678901234567890123456789012', 256)).toBe(true);
    expect(blowfishKeyValid('', 128)).toBe(false);
  });

  it('IV: 空 / 8 字符 / 16 位 HEX 合法', () => {
    expect(blowfishIvValid('')).toBe(true);
    expect(blowfishIvValid('12345678')).toBe(true);
    expect(blowfishIvValid('aabbccddeeff0011')).toBe(true);
    expect(blowfishIvValid('123')).toBe(false);
    expect(blowfishIvValid('12345678901234567')).toBe(false);
  });

  it('genCapacity 依据密钥长度推断位档', () => {
    expect(genCapacity(10)).toBe(128);
    expect(genCapacity(16)).toBe(192);
    expect(genCapacity(24)).toBe(256);
  });
});

describe('Blowfish 加解密链路 (UTF-8 密钥/文本)', () => {
  const key = 'blowfish-1234567'; // 16 字符 = 128 位
  const plain = 'Hello Blowfish! 你好世界 0123456789';
  const optsBase = { capacity: 128, code: 'HEX' as const };

  it('ECB + Pkcs7 往返一致', () => {
    const ct = blowfishEncrypt(plain, key, { ...optsBase, mode: 'ECB', padding: 'Pkcs7' });
    expect(blowfishDecrypt(ct, key, { ...optsBase, mode: 'ECB', padding: 'Pkcs7' })).toBe(plain);
  });

  it('CBC + 各填充 往返一致 (IV 字符/hex)', () => {
    for (const padding of ['Pkcs7', 'ZeroPadding', 'AnsiX923', 'Iso10126', 'Iso97971'] as const) {
      const opts = { ...optsBase, mode: 'CBC' as const, padding, iv: 'aabbccddeeff0011' };
      const ct = blowfishEncrypt(plain, key, opts);
      expect(blowfishDecrypt(ct, key, opts)).toBe(plain);
    }
    const optsChar = { ...optsBase, mode: 'CBC' as const, padding: 'Pkcs7' as const, iv: '12345678' };
    const ct = blowfishEncrypt(plain, key, optsChar);
    expect(blowfishDecrypt(ct, key, optsChar)).toBe(plain);
  });

  it('流模式 CFB/OFB/CTR 任意长度往返一致 (无需填充)', () => {
    for (const mode of ['CFB', 'OFB', 'CTR'] as const) {
      const opts = { ...optsBase, mode, padding: 'Pkcs7' as const, iv: '12345678' };
      const ct = blowfishEncrypt(plain, key, opts);
      expect(blowfishDecrypt(ct, key, opts)).toBe(plain);
      const odd = 'abc';
      const ct2 = blowfishEncrypt(odd, key, opts);
      expect(blowfishDecrypt(ct2, key, opts)).toBe(odd);
    }
  });

  it('Base64 编码往返一致', () => {
    const opts = { ...optsBase, code: 'Base64' as const, mode: 'CBC' as const, padding: 'Pkcs7' as const, iv: '12345678' };
    const ct = blowfishEncrypt(plain, key, opts);
    expect(/^[A-Za-z0-9+/]+={0,2}$/.test(ct)).toBe(true);
    expect(blowfishDecrypt(ct, key, opts)).toBe(plain);
  });

  it('不同密钥产出不同密文, 错误密钥解密抛异常', () => {
    const opts = { ...optsBase, mode: 'ECB' as const, padding: 'Pkcs7' as const };
    const a = blowfishEncrypt('aaaaaaaaaaaa', key, opts);
    const b = blowfishEncrypt('aaaaaaaaaaaa', '1234567890123457', opts);
    expect(a).not.toBe(b);
    expect(() => blowfishDecrypt(a, '1234567890123457', opts)).toThrow();
  });
});
