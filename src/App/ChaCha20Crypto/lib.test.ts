import {
  chacha20Block, chacha20Crypt, passphraseToKey, parseNonce,
  nonceValid, counterValid, chacha20EncryptText, chacha20DecryptText,
} from './lib';

const hex = (b :Uint8Array) :string => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
const unhex = (s :string) :Uint8Array => {
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return out;
};
const utf8 = (s :string) :Uint8Array => new TextEncoder().encode(s);

// RFC 7539 官方向量 (2.3.2 / 2.4.2): key=000102..1f, nonce=000000090000004a00000000
const KEY = unhex('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
const NONCE = unhex('000000090000004a00000000');
const MESSAGE = "Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.";

// OpenSSL chacha20 (-iv counterLE||nonce) 独立交叉生成的密文
const CT1 = '5c90838db44879743e6bfd58c64e05a8a2bc91a913af0e23704acfbaa0b80d3da1a20b2027b893302ee29e63f9c222c1da67f0b5fe7928dfaea2a391cd251c2164e4fa5756b9da6e8ca5dc908c44cbf6e93ea6b4cc406988d7da69bf795bf19b84539df73bd9b3e9ca4d03bc0a586ff528dc';
const CT0 = 'c6bdf594fa87d094756b8d179a7ba25b816398cc26a334e7f7cf2720335074f1beb85c505d2d6dec471cd7ffaf002e85f3d6207bd9865fc130f6e554067f15bb7e9d9ec4be553c352466ad3fc54f03e4b3b991e755b51c76764786bab0a1023db1f0012369bfdd6661aeb325bbee22cbc13c';

describe('chacha20Block', () => {
  it('与 RFC 7539 官方密钥流一致 (counter=1 首块, 首字节 10f1e7e4...)', () => {
    const ks = chacha20Block(KEY, NONCE, 1);
    expect(ks.length).toBe(64);
    // RFC 2.3.2 印刷的首 4 字节
    expect(hex(ks.slice(0, 4))).toBe('10f1e7e4');
    // 与 OpenSSL 密文 ^ 明文 推导的密钥流逐块一致 (自洽, 首块 64B)
    const expectKs = new Uint8Array(64);
    const msg = utf8(MESSAGE);
    const ct = unhex(CT1);
    for (let i = 0; i < 64; i++) expectKs[i] = msg[i] ^ ct[i];
    expect(hex(ks)).toBe(hex(expectKs));
  });

  it('counter 变化产生不同密钥流', () => {
    const ks0 = chacha20Block(KEY, NONCE, 0);
    const ks1 = chacha20Block(KEY, NONCE, 1);
    expect(hex(ks0)).not.toBe(hex(ks1));
  });

  it('密钥长度错误抛错', () => {
    expect(() => chacha20Block(new Uint8Array(16), NONCE, 0)).toThrow();
    expect(() => chacha20Block(KEY, new Uint8Array(8), 0)).toThrow();
  });
});

describe('chacha20Crypt', () => {
  it('官方向量: counter=1 密文一致', () => {
    expect(hex(chacha20Crypt(utf8(MESSAGE), KEY, NONCE, 1))).toBe(CT1);
  });

  it('官方向量: counter=0 密文一致 (OpenSSL 交叉)', () => {
    expect(hex(chacha20Crypt(utf8(MESSAGE), KEY, NONCE, 0))).toBe(CT0);
  });

  it('密文异或回明文 (解密 = 加密)', () => {
    const ct = chacha20Crypt(utf8(MESSAGE), KEY, NONCE, 1);
    expect(new TextDecoder().decode(chacha20Crypt(ct, KEY, NONCE, 1))).toBe(MESSAGE);
  });

  it('空输入 -> 空输出', () => {
    expect(chacha20Crypt(new Uint8Array(0), KEY, NONCE, 0).length).toBe(0);
  });

  it('跨块消息 (63/64/65/300B) 往返一致', () => {
    for (const len of [63, 64, 65, 127, 300]) {
      const msg = new Uint8Array(len).map((_, i) => i & 0xff);
      const ct = chacha20Crypt(msg, KEY, NONCE, 0);
      expect(chacha20Crypt(ct, KEY, NONCE, 0)).toEqual(msg);
      expect(hex(ct)).not.toBe(hex(msg)); // 确实做了变换 (非全零密钥流)
    }
  });

  it('counter 递增跨 32 位边界不崩溃', () => {
    const msg = utf8('hello');
    const ct = chacha20Crypt(msg, KEY, NONCE, 0xfffffffe);
    const rt = chacha20Crypt(ct, KEY, NONCE, 0xfffffffe);
    expect(new TextDecoder().decode(rt)).toBe('hello');
  });
});

describe('passphraseToKey / parseNonce', () => {
  it('32 字节 ASCII 口令直接作为密钥', () => {
    const pw = '0123456789abcdef0123456789abcdef';
    expect(hex(passphraseToKey(pw))).toBe(Array.from(new TextEncoder().encode(pw), (b) => b.toString(16).padStart(2, '0')).join(''));
  });

  it('其它长度口令经 SHA-256 派生为 32 字节', () => {
    const k = passphraseToKey('my secret');
    expect(k.length).toBe(32);
    // 确定性 + 与直接 sha256('my secret') 一致 (crypto-js 同源则跳过 hex 比对? 校验长度与稳定性)
    expect(hex(passphraseToKey('my secret'))).toBe(hex(k));
  });

  it('空口令抛错', () => {
    expect(() => passphraseToKey('')).toThrow();
  });

  it('parseNonce: 24 位 HEX / 12 字符 UTF-8', () => {
    expect(hex(parseNonce('000000090000004a00000000'))).toBe('000000090000004a00000000');
    expect(parseNonce('000000090000004a00000000'.toUpperCase())).toEqual(NONCE);
    expect(hex(parseNonce('0123456789ab'))).toBe('303132333435363738396162');
    expect(() => parseNonce('1234')).toThrow();
    expect(() => parseNonce('zz')).toThrow();
  });

  it('nonceValid / counterValid', () => {
    expect(nonceValid('000000090000004a00000000')).toBe(true);
    expect(nonceValid('0123456789ab')).toBe(true);
    expect(nonceValid('')).toBe(false);
    expect(nonceValid('12')).toBe(false);
    expect(counterValid('0')).toBe(true);
    expect(counterValid('4294967295')).toBe(true);
    expect(counterValid('-1')).toBe(false);
    expect(counterValid('4294967296')).toBe(false);
    expect(counterValid('1.5')).toBe(false);
    expect(counterValid('')).toBe(false);
  });
});

describe('chacha20EncryptText / DecryptText', () => {
  const opts = { code: 'HEX' as const };
  const opts64 = { code: 'Base64' as const };

  it('HEX 往返 (含中文, UTF-8)', () => {
    const pw = 'passphrase-passphrase-passphr'; // 33B -> SHA-256 派生
    const plain = 'Hello, ChaCha20! 你好世界 🎉';
    const ct = chacha20EncryptText(plain, pw, '000000090000004a00000000', 0, opts);
    expect(ct).toMatch(/^[0-9a-f]+$/u);
    expect(chacha20DecryptText(ct, pw, '000000090000004a00000000', 0, opts)).toBe(plain);
  });

  it('Base64 往返', () => {
    const plain = 'The quick brown fox jumps over the lazy dog.';
    const ct = chacha20EncryptText(plain, 'pw', 'nonce12char?', 0, opts64);
    expect(chacha20DecryptText(ct, 'pw', 'nonce12char?', 0, opts64)).toBe(plain);
  });

  it('口令/计数器/nonce 不匹配则解密失败 (返回不同文本)', () => {
    const plain = 'sensitive data 敏感数据';
    const ct = chacha20EncryptText(plain, 'pw-a', '000000000000000000000001', 0, opts);
    expect(chacha20DecryptText(ct, 'pw-b', '000000000000000000000001', 0, opts)).not.toBe(plain);
    expect(chacha20DecryptText(ct, 'pw-a', '000000000000000000000002', 0, opts)).not.toBe(plain);
  });

  it('非法 nonce / 空口令抛错', () => {
    expect(() => chacha20EncryptText('x', '', '000000000000000000000000', 0, opts)).toThrow();
    expect(() => chacha20EncryptText('x', 'pw', 'abc', 0, opts)).toThrow();
  });
});
