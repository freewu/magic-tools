import { hexToBytes, bytesToHex } from '../../lib/symcipher';
import {
  makeRc2Codec,
  rc2Encrypt,
  rc2Decrypt,
  rc2KeyValid,
  rc2IvValid,
  genCapacity,
} from './lib';

// 官方向量: RFC 2268 附录 (Bouncy Castle RC2Test 同源), 含有效位数 T1 语义
const VECTORS :Array<[keyHex :string, bits :number, ptHex :string, ctHex :string]> = [
  ['0000000000000000', 63, '0000000000000000', 'ebb773f993278eff'],
  ['ffffffffffffffff', 64, 'ffffffffffffffff', '278b27e42e2f0d49'],
  ['3000000000000000', 64, '1000000000000001', '30649edf9be7d2c2'],
  ['88', 64, '0000000000000000', '61a8a244adacccf0'],
  ['88bca90e90875a', 64, '0000000000000000', '6ccf4308974c267f'],
  ['88bca90e90875a7f0f79c384627bafb2', 64, '0000000000000000', '1a807d272bbe5db1'],
  ['88bca90e90875a7f0f79c384627bafb2', 128, '0000000000000000', '2269552ab0f85ca6'],
  ['88bca90e90875a7f0f79c384627bafb216f80a6f85920584c42fceb0be255daf1e', 129, '0000000000000000', '5b78d3a43dfff1f1'],
];

describe('RC2 单块 (RFC 2268 官方向量)', () => {
  it.each(VECTORS)('key=%s t1=%d -> ct=%s', (keyHex, bits, ptHex, ctHex) => {
    const codec = makeRc2Codec(hexToBytes(keyHex), bits);
    const block = hexToBytes(ptHex);
    codec.encryptBlock(block);
    expect(bytesToHex(block)).toBe(ctHex);
    codec.decryptBlock(block);
    expect(bytesToHex(block)).toBe(ptHex);
  });
});

describe('RC2 校验函数', () => {
  it('密钥: UTF-8 字节数须等于位数/8', () => {
    expect(rc2KeyValid('1234567890123456', 128)).toBe(true);
    expect(rc2KeyValid('123456789012345678', 128)).toBe(false);
    expect(rc2KeyValid('123456789012345678901234', 192)).toBe(true);
    expect(rc2KeyValid('12345678901234567890123456789012', 256)).toBe(true);
    expect(rc2KeyValid('', 128)).toBe(false);
  });

  it('IV: 空 / 8 字符 / 16 位 HEX 合法', () => {
    expect(rc2IvValid('')).toBe(true);
    expect(rc2IvValid('12345678')).toBe(true);
    expect(rc2IvValid('aabbccddeeff0011')).toBe(true);
    expect(rc2IvValid('123')).toBe(false);
    expect(rc2IvValid('12345678901234567')).toBe(false);
  });

  it('genCapacity 依据密钥长度推断位档', () => {
    expect(genCapacity(10)).toBe(128);
    expect(genCapacity(16)).toBe(192);
    expect(genCapacity(24)).toBe(256);
  });
});

describe('RC2 加解密链路 (UTF-8 密钥/文本, 有效位数=全强度)', () => {
  const key = 'rc2-secret-12345'; // 16 字符 = 128 位
  const plain = 'Hello RC2! 你好世界 0123456789';
  const optsBase = { capacity: 128, code: 'HEX' as const };

  it('ECB + Pkcs7 往返一致', () => {
    const ct = rc2Encrypt(plain, key, { ...optsBase, mode: 'ECB', padding: 'Pkcs7' });
    expect(rc2Decrypt(ct, key, { ...optsBase, mode: 'ECB', padding: 'Pkcs7' })).toBe(plain);
  });

  it('CBC + 各填充 往返一致 (IV 字符/hex)', () => {
    for (const padding of ['Pkcs7', 'ZeroPadding', 'AnsiX923', 'Iso10126', 'Iso97971'] as const) {
      const opts = { ...optsBase, mode: 'CBC' as const, padding, iv: 'aabbccddeeff0011' };
      const ct = rc2Encrypt(plain, key, opts);
      expect(rc2Decrypt(ct, key, opts)).toBe(plain);
    }
    const optsChar = { ...optsBase, mode: 'CBC' as const, padding: 'Pkcs7' as const, iv: '12345678' };
    const ct = rc2Encrypt(plain, key, optsChar);
    expect(rc2Decrypt(ct, key, optsChar)).toBe(plain);
  });

  it('流模式 CFB/OFB/CTR 任意长度往返一致 (无需填充)', () => {
    for (const mode of ['CFB', 'OFB', 'CTR'] as const) {
      const opts = { ...optsBase, mode, padding: 'Pkcs7' as const, iv: '12345678' };
      const ct = rc2Encrypt(plain, key, opts);
      expect(rc2Decrypt(ct, key, opts)).toBe(plain);
      const odd = 'abc';
      const ct2 = rc2Encrypt(odd, key, opts);
      expect(rc2Decrypt(ct2, key, opts)).toBe(odd);
    }
  });

  it('Base64 编码往返一致', () => {
    const opts = { ...optsBase, code: 'Base64' as const, mode: 'CBC' as const, padding: 'Pkcs7' as const, iv: '12345678' };
    const ct = rc2Encrypt(plain, key, opts);
    expect(/^[A-Za-z0-9+/]+={0,2}$/.test(ct)).toBe(true);
    expect(rc2Decrypt(ct, key, opts)).toBe(plain);
  });

  it('不同密钥产出不同密文, 错误密钥解密抛异常', () => {
    const opts = { ...optsBase, mode: 'ECB' as const, padding: 'Pkcs7' as const };
    const a = rc2Encrypt('aaaaaaaaaaaa', key, opts);
    const b = rc2Encrypt('aaaaaaaaaaaa', '1234567890123457', opts);
    expect(a).not.toBe(b);
    expect(() => rc2Decrypt(a, '1234567890123457', opts)).toThrow();
  });
});
