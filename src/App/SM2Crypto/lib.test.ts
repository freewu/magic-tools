/** @jest-environment node */

import {
  generateSm2KeyPair, derivePublicKey, sm2EncryptText, sm2DecryptText,
  sm2EncryptBytes, sm2DecryptBytes, bytesToHex,
} from './lib';

describe('SM2 加解密 (GB/T 32918.4 C1C3C2)', () => {
  it('密钥对生成: 私钥 64 位 HEX, 公钥 04||x||y', () => {
    const { privateKey, publicKey } = generateSm2KeyPair();
    expect(/^[0-9a-f]{64}$/.test(privateKey)).toBe(true);
    expect(/^04[0-9a-f]{128}$/.test(publicKey)).toBe(true);
    expect(derivePublicKey(privateKey)).toBe(publicKey);
  });

  it('加密/解密往返一致 (含中文与 emoji)', () => {
    const { privateKey, publicKey } = generateSm2KeyPair();
    const msg = 'SM2 国密算法测试 🚀 你好，世界！';
    const cipher = sm2EncryptText(msg, publicKey);
    expect(/^[0-9a-f]+$/.test(cipher)).toBe(true);
    expect(cipher.length % 2).toBe(0);
    expect(sm2DecryptText(cipher, privateKey)).toBe(msg);
  });

  it('长文本往返一致 (多组 KDF 块)', () => {
    const { privateKey, publicKey } = generateSm2KeyPair();
    const msg = 'kdf-分块验证'.repeat(300); // 2400 字节, KDF 需要多轮 SM3
    expect(sm2DecryptText(sm2EncryptText(msg, publicKey), privateKey)).toBe(msg);
  });

  it('同一明文两次加密结果不同 (随机 k)', () => {
    const { publicKey } = generateSm2KeyPair();
    const c1 = sm2EncryptText('random-k-test', publicKey);
    const c2 = sm2EncryptText('random-k-test', publicKey);
    expect(c1).not.toBe(c2);
  });

  it('字节级任意二进制往返', () => {
    const { privateKey, publicKey } = generateSm2KeyPair();
    const data = new Uint8Array(300);
    for (let i = 0; i < data.length; i++) data[i] = (i * 13 + 7) & 0xff;
    const cipher = sm2EncryptBytes(data, publicKey);
    const plain = sm2DecryptBytes(cipher, privateKey);
    expect(bytesToHex(plain)).toBe(bytesToHex(data));
  });

  it('错误私钥解密报错', () => {
    const a = generateSm2KeyPair();
    const b = generateSm2KeyPair();
    const cipher = sm2EncryptText('wrong-key', a.publicKey);
    expect(() => sm2DecryptText(cipher, b.privateKey)).toThrow();
  });

  it('篡改密文 C2 校验失败报错', () => {
    const { privateKey, publicKey } = generateSm2KeyPair();
    const cipher = sm2EncryptText('tamper-now', publicKey);
    const bytes = Array.from(cipher.match(/../g) as string[]);
    const last = bytes.length - 1;
    bytes[last] = (parseInt(bytes[last], 16) ^ 0xff).toString(16).padStart(2, '0');
    expect(() => sm2DecryptText(bytes.join(''), privateKey)).toThrow();
  });

  it('非法输入报错', () => {
    expect(() => derivePublicKey('0000000000000000000000000000000000000000000000000000000000000000')).toThrow(); // d = 0
    expect(() => sm2DecryptText('aabb', generateSm2KeyPair().privateKey)).toThrow(); // 密文太短
    expect(() => sm2EncryptText('x', '03abcd')).toThrow(); // 公钥格式错误
  });
});
