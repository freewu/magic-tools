import {
  aesGcmEncrypt,
  aesGcmDecrypt,
  bytesToHex,
  hexToBytes,
  bytesToBase64,
  base64ToBytes,
} from './gcm';

// 记录自 NIST GCM 官方向量 (McGrew & Viega) 与 node:crypto 对拍结果, 均为确定性常量
const V = {
  nistTc1: { key: '00'.repeat(16), iv: '00'.repeat(12), pt: '', ct: '', tag: '58e2fccefa7e3061367f1d57a4e7455a' },
  nistTc2: {
    key: '00'.repeat(16),
    iv: '00'.repeat(12),
    pt: '00'.repeat(16),
    ct: '0388dace60b6a392f328c2b971b2fe78',
    tag: 'ab6e47d42cec13bdf53a67b21257bddf',
  },
  aes128Hello: {
    key: '000102030405060708090a0b0c0d0e0f',
    iv: '000102030405060708090a0b',
    pt: '68656c6c6f20776f726c6421', // hello world!
    ct: 'fb09cba2093b803b39be05ab',
    tag: 'e77b4c39dd7843b23489ef163be07df6',
  },
  aes192: {
    key: '00'.repeat(24),
    iv: '00'.repeat(12),
    pt: '01'.repeat(33), // 非 16 倍数
    ct: '99e6257d06f1ff401d277f4285b1f7012b3592e76334ef66dfedcc2e3a383ad9fc',
    tag: '1e23358b3121afe9b353af8d7671d35b',
  },
  aes256Utf8: {
    key: '11'.repeat(32),
    iv: '000102030405060708090a0b',
    pt: 'e4bda0e5a5bd', // 你好
    ct: 'f75e16f6de1e',
    tag: '77aba2f842117f4808f77c30445ae66f',
  },
  aes256Iv8: {
    key: '11'.repeat(32),
    iv: '0001020304050607', // 非 96-bit IV (GHASH 推导 J0)
    pt: '414243444546',
    ct: '34b66c2531b9',
    tag: '10d263f5279dfbecea8c5f95b7c17cf8',
  },
};

describe('AES-GCM 固定向量', () => {
  Object.entries(V).forEach(([name, v]) => {
    it(name, () => {
      const key = hexToBytes(v.key);
      const iv = hexToBytes(v.iv);
      const pt = hexToBytes(v.pt);
      const out = aesGcmEncrypt(key, iv, pt);
      expect(bytesToHex(out.subarray(0, out.length - 16))).toBe(v.ct);
      expect(bytesToHex(out.subarray(out.length - 16))).toBe(v.tag);
      // 解密回环
      const back = aesGcmDecrypt(key, iv, out);
      expect(bytesToHex(back)).toBe(v.pt);
    });
  });
});

describe('AES-GCM 回环与参数校验', () => {
  const seq = (len :number) :Uint8Array => {
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) out[i] = (i * 7 + 3) & 0xff;
    return out;
  };

  it('各密钥长度 × IV 长度 × 明文长度随机回环', () => {
    for (const ks of [16, 24, 32]) {
      const key = seq(ks);
      for (const ivLen of [1, 8, 12, 16, 33]) {
        const iv = seq(ivLen);
        for (const ptLen of [0, 1, 15, 16, 17, 64, 1024]) {
          const pt = seq(ptLen);
          const out = aesGcmEncrypt(key, iv, pt);
          expect(out.length).toBe(ptLen + 16);
          expect(bytesToHex(aesGcmDecrypt(key, iv, out))).toBe(bytesToHex(pt));
        }
      }
    }
  });

  it('篡改密文 / IV / 标签均抛认证失败', () => {
    const key = seq(16);
    const iv = seq(12);
    const out = aesGcmEncrypt(key, iv, seq(32));

    const flip = (arr :Uint8Array, i :number) => {
      const copy = new Uint8Array(arr);
      copy[i] ^= 0x80;
      return copy;
    };
    expect(() => aesGcmDecrypt(key, iv, flip(out, 0))).toThrow('认证失败');
    expect(() => aesGcmDecrypt(key, iv, flip(out, out.length - 1))).toThrow('认证失败');
    expect(() => aesGcmDecrypt(key, flip(iv, 0), out)).toThrow('认证失败');
    expect(() => aesGcmDecrypt(seq(16).map((b, i) => (i === 0 ? b ^ 1 : b)), iv, out)).toThrow('认证失败');
  });

  it('长度 / 参数异常抛错', () => {
    expect(() => aesGcmEncrypt(new Uint8Array(15), seq(12), seq(16))).toThrow('16 / 24 / 32');
    expect(() => aesGcmEncrypt(seq(16), new Uint8Array(0), seq(16))).toThrow('IV 不能为空');
    expect(() => aesGcmDecrypt(seq(16), seq(12), new Uint8Array(15))).toThrow('认证标签');
  });

  it('hex/base64 编解码往返', () => {
    const raw = seq(100);
    const hex = bytesToHex(raw);
    expect(hex.length).toBe(200);
    expect(bytesToHex(hexToBytes(hex))).toBe(hex);
    const b64 = bytesToBase64(raw);
    expect(bytesToHex(base64ToBytes(b64))).toBe(hex);
    expect(() => hexToBytes('xyz')).toThrow();
    expect(() => base64ToBytes('!!!')).toThrow();
  });
});
