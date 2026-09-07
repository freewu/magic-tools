import { cmac, cmacText, hexToBytes, utf8Bytes, getDefaultBits, KEY_LENS } from './lib';

const hex = (s :string) :Uint8Array => hexToBytes(s);

// RFC 4493 / SP 800-38B 测试块序列 (消息内容源自 RFC 4493 向量)
const B1 = '6bc1bee22e409f96e93d7e117393172a';
const B2 = 'ae2d8a571e03ac9c9eb76fac45af8e51';
const B3 = '30c81c46a35ce411e5fbc1191a0a52ef';
const B4 = 'f69f2445df4f9b17ad2b417be66c3710';

describe('RFC 4493 官方向量 (AES-128, key=2b7e1516...)', () => {
  const key = hex('2b7e151628aed2a6abf7158809cf4f3c');

  it('空消息', () => {
    expect(cmac(key, new Uint8Array(0))).toBe('bb1d6929e95937287fa37d129b756746');
  });

  it('16 字节单块', () => {
    expect(cmac(key, hex(B1))).toBe('070a16b46b4d4144f79bdd9dd04a287c');
  });

  it('40 字节 (2 整块 + 8 字节补丁)', () => {
    expect(cmac(key, hex(B1 + B2 + B3.slice(0, 16)))).toBe('dfa66747de9ae63030ca32611497c827');
  });

  it('64 字节 (4 整块, 全 K1 分支)', () => {
    expect(cmac(key, hex(B1 + B2 + B3 + B4))).toBe('51f0bebf7e3b9d92fc49741779363cfe');
  });

  it('32 字节 (2 整块)', () => {
    expect(cmac(key, hex(B1 + B2))).toBe('ce0cbf1738f4df6428b1d93bf12081c9');
  });
});

describe('OpenSSL 锚 (AES-192 / AES-256, RFC 4493 密钥)', () => {
  const key192 = hex('8e73b0f7da0e6452c810f32b809079e562f8ead2522c6b7b');
  const key256 = hex('603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4');

  it('AES-192 空消息 / 16B / 40B / 64B', () => {
    expect(cmac(key192, new Uint8Array(0))).toBe('d17ddf46adaacde531cac483de7a9367');
    expect(cmac(key192, hex(B1))).toBe('9e99a7bf31e710900662f65e617c5184');
    expect(cmac(key192, hex(B1 + B2 + B3.slice(0, 16)))).toBe('8a1de5be2eb31aad089a82e6ee908b0e');
    expect(cmac(key192, hex(B1 + B2 + B3 + B4))).toBe('a1d5df0eed790f794d77589659f39a11');
  });

  it('AES-256 空消息 / 16B / 40B / 64B', () => {
    expect(cmac(key256, new Uint8Array(0))).toBe('028962f61b7bf89efc6b551f4667d983');
    expect(cmac(key256, hex(B1))).toBe('28a7023f452e8f82bd4bf28d8c37c35c');
    expect(cmac(key256, hex(B1 + B2 + B3.slice(0, 16)))).toBe('aaf3d8f1de5640c232f5b169b9c911e6');
    expect(cmac(key256, hex(B1 + B2 + B3 + B4))).toBe('e1992190549f6ed5696a2c056c315410');
  });
});

describe('CMAC 通用行为', () => {
  it('字符串 UTF-8 入口', () => {
    expect(cmacText('abcdefghijklmnop', 'hello', 128)).toBe(cmac(utf8Bytes('abcdefghijklmnop'), utf8Bytes('hello')));
  });

  it('消息/密钥变化导致标签变化', () => {
    const key = hex('2b7e151628aed2a6abf7158809cf4f3c');
    const tag1 = cmac(key, hex(B1));
    expect(tag1).not.toBe(cmac(key, hex(B1 + B1)));
    expect(tag1).not.toBe(cmac(hex('2b7e151628aed2a6abf7158809cf4f31'), hex(B1)));
  });

  it('输出恒为 16 字节 hex', () => {
    const key = hex('2b7e151628aed2a6abf7158809cf4f3c');
    for (let len = 0; len <= 40; len++) {
      const msg = Uint8Array.from({ length: len }, (_, i) => i);
      expect(cmac(key, msg)).toHaveLength(32);
    }
  });

  it('非法密钥长度抛错', () => {
    expect(() => cmac(new Uint8Array(15), new Uint8Array(0))).toThrow();
    expect(() => cmac(new Uint8Array(33), new Uint8Array(0))).toThrow();
  });

  it('默认值记忆', () => {
    expect([128, 192, 256]).toContain(getDefaultBits());
    expect(KEY_LENS[128]).toBe(16);
  });
});
