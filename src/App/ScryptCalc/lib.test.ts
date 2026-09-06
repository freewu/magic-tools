import { hmacSha256, pbkdf2Sha256, scrypt, sha256, toHex } from './lib';

const u8 = (hex: string): Uint8Array => {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
};

describe('Scrypt 值计算 (RFC 7914)', () => {

  it('sha256 基础向量', () => {
    expect(toHex(sha256(new Uint8Array(0)))).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(toHex(sha256(new TextEncoder().encode('abc')))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('hmac-sha256 RFC 4231 测试用例 1', () => {
    const key = new Uint8Array(20).fill(0x0b);
    const msg = new TextEncoder().encode('Hi There');
    expect(toHex(hmacSha256(key, msg))).toBe('b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7');
  });

  it('pbkdf2-hmac-sha256 参考向量', () => {
    const p = new TextEncoder().encode('password');
    const s = new TextEncoder().encode('salt');
    expect(toHex(pbkdf2Sha256(p, s, 1, 32)))
      .toBe('120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b');
    expect(toHex(pbkdf2Sha256(p, s, 2, 32)))
      .toBe('ae4d0c95af6b46d32d0adff928f06dd02a303f8ef3c251dfd6e2d85a95474c43');
  });

  it('RFC 7914 测试向量 1: scrypt("", "", N=16, r=1, p=1, 64)', () => {
    const dk = scrypt('', '', { n: 16, r: 1, p: 1 }, 64);
    expect(toHex(dk))
      .toBe('77d6576238657b203b19ca42c18a0497f16b4844e3074ae8dfdffa3fede21442fcd0069ded0948f8326a753a0fc81f17e8d3e0fb2e0d3628cf35e20c38d18906');
  });

  it('RFC 7914 测试向量 2: scrypt("password", "NaCl", N=1024, r=8, p=16, 64)', () => {
    const dk = scrypt('password', 'NaCl', { n: 1024, r: 8, p: 16 }, 64);
    expect(toHex(dk))
      .toBe('fdbabe1c9d3472007856e7190d01e9fe7c6ad7cbc8237830e77376634b3731622eaf30d92e22a3886ff109279d9830dac727afb94a83ee6d8360cbdfa2cc0640');
  });

  it('Uint8Array 输入与字节类型保持一致', () => {
    const dk1 = scrypt('password', 'salt', { n: 16, r: 1, p: 1 }, 32);
    const dk2 = scrypt(u8('70617373776f7264'), u8('73616c74'), { n: 16, r: 1, p: 1 }, 32);
    expect(toHex(dk1)).toBe(toHex(dk2));
    expect(dk1.length).toBe(32);
  });

  it('参数校验: N 非 2 幂 / r/p/长度非法均抛错', () => {
    expect(() => scrypt('x', 'y', { n: 17, r: 1, p: 1 }, 32)).toThrow();
    expect(() => scrypt('x', 'y', { n: 0, r: 1, p: 1 }, 32)).toThrow();
    expect(() => scrypt('x', 'y', { n: 16, r: 0, p: 1 }, 32)).toThrow();
    expect(() => scrypt('x', 'y', { n: 16, r: 1, p: 0 }, 32)).toThrow();
    expect(() => scrypt('x', 'y', { n: 16, r: 1, p: 1 }, 0)).toThrow();
  });
});
