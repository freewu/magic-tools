import { hkdf, hkdfExtract, hkdfExpand, hexToBytes, utf8Bytes, getHashLen } from './lib';

const hex = (s :string) :Uint8Array => hexToBytes(s);

// RFC 5869 官方向量 (A.1 - A.7)
describe('RFC 5869 官方向量', () => {
  it('A.1 Test Case 1 (SHA-256 基础)', () => {
    const ikm = hex('0b'.repeat(22));
    const salt = hex('000102030405060708090a0b0c');
    const info = hex('f0f1f2f3f4f5f6f7f8f9');
    expect(bytesHex(hkdfExtract('SHA-256', ikm, salt)))
      .toBe('077709362c2e32df0ddc3f0dc47bba6390b6c73bb50f9c3122ec844ad7c2b3e5');
    expect(bytesHex(hkdf('SHA-256', ikm, salt, info, 42)))
      .toBe('3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865');
  });

  it('A.2 Test Case 2 (SHA-256 长输入/输出 82B)', () => {
    const ikm = hex('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'
      + '202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f'
      + '404142434445464748494a4b4c4d4e4f');
    const salt = hex('606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f'
      + '808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9f'
      + 'a0a1a2a3a4a5a6a7a8a9aaabacadaeaf');
    const info = hex('b0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecf'
      + 'd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeef'
      + 'f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff');
    const okm = hkdf('SHA-256', ikm, salt, info, 82);
    expect(bytesHex(okm)).toBe(
      'b11e398dc80327a1c8e7f78c596a49344f012eda2d4efad8a050cc4c19afa97c'
      + '59045a99cac7827271cb41c65e590e09da3275600c2f09b8367793a9aca3db71'
      + 'cc30c58179ec3e87c14c01d5c1f3434f1d87');
    expect(okm).toHaveLength(82);
  });

  it('A.3 Test Case 3 (SHA-256 空盐/空 info -> 默认全零盐)', () => {
    const ikm = hex('0b'.repeat(22));
    expect(bytesHex(hkdfExtract('SHA-256', ikm, new Uint8Array(0))))
      .toBe('19ef24a32c717b167f33a91d6f648bdf96596776afdb6377ac434c1c293ccb04');
    expect(bytesHex(hkdf('SHA-256', ikm, new Uint8Array(0), new Uint8Array(0), 42)))
      .toBe('8da4e775a563c18f715f802a063c5a31b8a11f5c5ee1879ec3454e5f3c738d2d9d201395faa4b61a96c8');
  });

  it('A.4 Test Case 4 (SHA-1 基础)', () => {
    const ikm = hex('0b'.repeat(11));
    const salt = hex('000102030405060708090a0b0c');
    const info = hex('f0f1f2f3f4f5f6f7f8f9');
    expect(bytesHex(hkdfExtract('SHA-1', ikm, salt)))
      .toBe('9b6c18c432a7bf8f0e71c8eb88f4b30baa2ba243');
    expect(bytesHex(hkdf('SHA-1', ikm, salt, info, 42)))
      .toBe('085a01ea1b10f36933068b56efa5ad81a4f14b822f5b091568a9cdd4f155fda2c22e422478d305f3f896');
  });

  it('A.5 Test Case 5 (SHA-1 长输入 82B)', () => {
    const ikm = hex('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'
      + '202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f'
      + '404142434445464748494a4b4c4d4e4f');
    const salt = hex('606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f'
      + '808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9f'
      + 'a0a1a2a3a4a5a6a7a8a9aaabacadaeaf');
    const info = hex('b0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecf'
      + 'd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeef'
      + 'f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff');
    expect(bytesHex(hkdfExtract('SHA-1', ikm, salt)))
      .toBe('8adae09a2a307059478d309b26c4115a224cfaf6');
    expect(bytesHex(hkdf('SHA-1', ikm, salt, info, 82)))
      .toBe('0bd770a74d1160f7c9f12cd5912a06ebff6adcae899d92191fe4305673ba2ffe'
        + '8fa3f1a4e5ad79f3f334b3b202b2173c486ea37ce3d397ed034c7f9dfeb15c5e'
        + '927336d0441f4c4300e2cff0d0900b52d3b4');
  });

  it('A.6 Test Case 6 (SHA-1 空盐空 info)', () => {
    const ikm = hex('0b'.repeat(22));
    expect(bytesHex(hkdf('SHA-1', ikm, new Uint8Array(0), new Uint8Array(0), 42)))
      .toBe('0ac1af7002b3d761d1e55298da9d0506b9ae52057220a306e07b6b87e8df21d0ea00033de03984d34918');
  });

  it('A.7 Test Case 7 (SHA-1 salt 未提供)', () => {
    const ikm = hex('0c'.repeat(22));
    expect(bytesHex(hkdfExtract('SHA-1', ikm, new Uint8Array(0))))
      .toBe('2adccada18779e7c2077ad2eb19d3f3e731385dd');
    expect(bytesHex(hkdf('SHA-1', ikm, new Uint8Array(0), new Uint8Array(0), 42)))
      .toBe('2c91117204d745f3500d636a62f64f0ab3bae548aa53d423b0d1f27ebba6f5e5673a081d70cce7acfc48');
  });
});

// SHA-384 / SHA-512 无 RFC 官方样例, 用 @noble/hashes 与 OpenSSL 交叉锚
describe('SHA-384/512 扩展锚 (noble/openssl)', () => {
  const ikm = hex('0b'.repeat(22));

  it('SHA-512 空盐 PRK (与 OpenSSL HMAC 一致)', () => {
    expect(bytesHex(hkdfExtract('SHA-512', ikm, new Uint8Array(0))))
      .toBe('fd200c4987ac491313bd4a2a13287121247239e11c9ef82802044b66ef357e5b194498d0682611382348572a7b1611de54764094286320578a863f36562b0df6');
  });

  it('SHA-512 空盐空 info L=64 (noble hkdf 锚)', () => {
    expect(bytesHex(hkdf('SHA-512', ikm, new Uint8Array(0), new Uint8Array(0), 64)))
      .toBe('f5fa02b18298a72a8c23898a8703472c6eb179dc204c03425c970e3b164bf90fff22d04836d0e2343bacc4e7cb6045faaa698e0e3b3eb91331306def1db8319e');
  });

  it('SHA-512 salt13 info10 L=64 (noble 锚)', () => {
    const salt = Uint8Array.from({ length: 13 }, (_, i) => i);
    const info = Uint8Array.from([0xf0, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9]);
    expect(bytesHex(hkdfExtract('SHA-512', ikm, salt)))
      .toBe('665799823737ded04a88e47e54a5890bb2c3d247c7a4254a8e61350723590a26c36238127d8661b88cf80ef802d57e2f7cebcf1e00e083848be19929c61b4237');
    expect(bytesHex(hkdf('SHA-512', ikm, salt, info, 64)))
      .toBe('832390086cda71fb47625bb5ceb168e4c8e26a1a16ed34d9fc7fe92c1481579338da362cb8d9f925d7cbcce0dff7098769cf15959867d571c1715450cb530137');
  });

  it('SHA-384 空盐 L=48 (noble 锚)', () => {
    expect(bytesHex(hkdf('SHA-384', ikm, new Uint8Array(0), new Uint8Array(0), 48)))
      .toBe('c8c96e710f89b0d7990bca68bcdec8cf854062e54c73a7abc743fade9b242daacc1cea5670415b52849c97c4e787c1f2');
  });

  it('SHA-512 expand 前缀截断正确 (L 非 hashLen 整数倍)', () => {
    const out = hkdfExpand('SHA-512', hkdfExtract('SHA-512', ikm, new Uint8Array(0)), new Uint8Array(0), 65);
    expect(out).toHaveLength(65);
    // 前 64 字节应与 L=64 结果一致
    const base = hkdf('SHA-512', ikm, new Uint8Array(0), new Uint8Array(0), 64);
    expect(bytesHex(out.subarray(0, 64))).toBe(bytesHex(base));
  });
});

describe('HKDF 通用行为', () => {
  it('字符串按 UTF-8 处理', () => {
    const a = hkdf('SHA-256', utf8Bytes('密钥'), utf8Bytes('盐'), utf8Bytes('上下文'), 16);
    expect(a).toHaveLength(16);
  });

  it('不同 info / salt / L 输出不同', () => {
    const base = () => hkdf('SHA-256', utf8Bytes('ikm'), utf8Bytes('salt'), utf8Bytes(''), 16);
    expect(bytesHex(base())).toBe(bytesHex(base()));
    expect(bytesHex(base())).not.toBe(bytesHex(hkdf('SHA-256', utf8Bytes('ikm'), utf8Bytes('salt2'), utf8Bytes(''), 16)));
    expect(bytesHex(hkdf('SHA-256', utf8Bytes('ikm'), utf8Bytes('salt'), utf8Bytes(''), 16)))
      .not.toBe(bytesHex(hkdf('SHA-256', utf8Bytes('ikm'), utf8Bytes('salt'), utf8Bytes('info'), 16)));
  });

  it('getHashLen / 非法输入', () => {
    expect(getHashLen('SHA-256')).toBe(32);
    expect(getHashLen('SHA-1')).toBe(20);
    expect(() => getHashLen('MD5')).toThrow();
    expect(() => hkdfExpand('SHA-256', new Uint8Array(32), new Uint8Array(0), 0)).toThrow();
    // 255 * 32 = 8160 上限
    expect(() => hkdfExpand('SHA-256', new Uint8Array(32), new Uint8Array(0), 8161)).toThrow();
    expect(hkdfExpand('SHA-256', new Uint8Array(32), new Uint8Array(0), 8160)).toHaveLength(8160);
  });
});

const bytesHex = (b :Uint8Array) :string => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
