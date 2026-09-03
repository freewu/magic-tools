/** @jest-environment node */

import {
  rsaAvailable, generateRsaKeyPair, rsaEncryptText, rsaDecryptText,
  rsaEncryptBytes, rsaDecryptBytes, bytesToHex,
} from './lib';

const hasSubtle = rsaAvailable();

const suite = hasSubtle ? describe : describe.skip;

suite('RSA 加解密 (RSA-OAEP/SHA-256)', () => {
  it('生成密钥对并导出 PEM (PKCS#8/SPKI)', async () => {
    const { privatePem, publicPem } = await generateRsaKeyPair(2048);
    expect(privatePem.startsWith('-----BEGIN PRIVATE KEY-----')).toBe(true);
    expect(privatePem.endsWith('-----END PRIVATE KEY-----')).toBe(true);
    expect(publicPem.startsWith('-----BEGIN PUBLIC KEY-----')).toBe(true);
    expect(publicPem.endsWith('-----END PUBLIC KEY-----')).toBe(true);
    expect(privatePem.length).toBeGreaterThan(publicPem.length);
  });

  it('加密/解密往返一致 (2048)', async () => {
    const { privatePem, publicPem } = await generateRsaKeyPair(2048);
    const msg = 'RSA 加解密测试 MagicTools 123!@#';
    const cipher = await rsaEncryptText(publicPem, msg);
    expect(await rsaDecryptText(privatePem, cipher)).toBe(msg);
  });

  it('超长明文自动分段往返一致 (> 单块 190 字节上限)', async () => {
    const { privatePem, publicPem } = await generateRsaKeyPair(2048);
    const msg = '分块测试块'.repeat(100); // 600 字节
    const cipher = await rsaEncryptText(publicPem, msg);
    const plain = await rsaDecryptText(privatePem, cipher);
    expect(plain).toBe(msg);
    expect(cipher.length).toBeGreaterThan(1024); // 多块拼接后长度明显变大
  });

  it('中文 + emoji 往返一致', async () => {
    const { privatePem, publicPem } = await generateRsaKeyPair(2048);
    const msg = '你好，世界！🚀 RSA-OAEP';
    const cipher = await rsaEncryptText(publicPem, msg);
    expect(await rsaDecryptText(privatePem, cipher)).toBe(msg);
  });

  it('字节级接口保留任意二进制', async () => {
    const { privatePem, publicPem } = await generateRsaKeyPair(2048);
    const data = new Uint8Array(256);
    for (let i = 0; i < data.length; i++) data[i] = (i * 7 + 3) & 0xff;
    const cipher = await rsaEncryptBytes(publicPem, data);
    expect(cipher.length % 256).toBe(0);
    const plain = await rsaDecryptBytes(privatePem, cipher);
    expect(bytesToHex(plain)).toBe(bytesToHex(data));
  });

  it('错误私钥解密报错', async () => {
    const a = await generateRsaKeyPair(2048);
    const b = await generateRsaKeyPair(2048);
    const cipher = await rsaEncryptText(a.publicPem, 'secret');
    await expect(rsaDecryptText(b.privatePem, cipher)).rejects.toThrow();
  });

  it('篡改密文解密报错', async () => {
    const { privatePem, publicPem } = await generateRsaKeyPair(2048);
    const cipher = b64toBin(await rsaEncryptText(publicPem, 'tamper me'));
    cipher[100] ^= 0xff;
    await expect(rsaDecryptText(privatePem, binToB64(cipher))).rejects.toThrow();
  });

  it('非法 PEM 报错', async () => {
    await expect(rsaEncryptText('not a pem', 'x')).rejects.toThrow();
    await expect(rsaDecryptText('-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----', 'eA==')).rejects.toThrow();
  });
});

const b64toBin = (b64 :string) :Uint8Array => {
  const bin = atob(b64);
  const b = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
  return b;
};
const binToB64 = (b :Uint8Array) :string => {
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s);
};
