import { kmac, kmacHex, leftEncode, rightEncode, utf8Bytes } from './lib';

// Bouncy Castle KMACTest 官方向量 (源自 NIST SP 800-185 KMAC_samples)
const key32 = Uint8Array.from({ length: 32 }, (_, i) => 0x40 + i); // 0x40..0x5f
const msg4 = Uint8Array.from([0x00, 0x01, 0x02, 0x03]);
const msg200 = Uint8Array.from({ length: 200 }, (_, i) => i); // 00..c7
const TAGGED = 'My Tagged Application';

describe('SP 800-185 编码原语', () => {
  it('leftEncode', () => {
    expect(Array.from(leftEncode(0))).toEqual([1, 0]);
    expect(Array.from(leftEncode(255))).toEqual([1, 255]);
    expect(Array.from(leftEncode(256))).toEqual([2, 1, 0]);
    expect(Array.from(leftEncode(168))).toEqual([1, 168]);
  });
  it('rightEncode', () => {
    expect(Array.from(rightEncode(0))).toEqual([0, 1]);
    expect(Array.from(rightEncode(168))).toEqual([168, 1]);
    expect(Array.from(rightEncode(65535))).toEqual([255, 255, 2]);
  });
});

describe('KMAC128 官方向量', () => {
  it('S 为空: key32 + 00010203 -> 32B', () => {
    const out = kmac({ capacity: 128, key: key32, data: msg4, outLen: 32, custom: '' });
    expect(kmacHex({ capacity: 128, key: key32, data: msg4, outLen: 32, custom: '' }))
      .toBe('e5780b0d3ea6f7d3a429c5706aa43a00fadbd7d49628839e3187243f456ee14e');
    expect(out.length).toBe(32);
  });

  it('S="My Tagged Application"', () => {
    expect(kmacHex({ capacity: 128, key: key32, data: msg4, outLen: 32, custom: TAGGED }))
      .toBe('3b1fba963cd8b0b59e8c1a6d71888b7143651af8ba0a7070c0979e2811324aa5');
  });

  it('长消息 200 字节', () => {
    expect(kmacHex({ capacity: 128, key: key32, data: msg200, outLen: 32, custom: TAGGED }))
      .toBe('1f5b4e6cca02209e0dcb5ca635b89a15e271ecc760071dfd805faa38f9729230');
  });

  it('XOF 输出 = right_encode(0) 分支', () => {
    // BC KMAC.doOutput (XOF) 首 32B
    expect(kmacHex({ capacity: 128, key: key32, data: msg4, outLen: 32, custom: TAGGED, xof: true }))
      .toBe('31a44527b4ed9f5c6101d11de6d26f0620aa5c341def41299657fe9df1a3b16c');
  });
});

describe('KMAC256 官方向量', () => {
  it('S="My Tagged Application" 4 字节消息 -> 64B', () => {
    expect(kmacHex({ capacity: 256, key: key32, data: msg4, outLen: 64, custom: TAGGED }))
      .toBe('20c570c31346f703c9ac36c61c03cb64c3970d0cfc787e9b79599d273a68d2f7'
          + 'f69d4cc3de9d104a351689f27cf6f5951f0103f33f4f24871024d9c27773a8dd');
  });

  it('S 为空 200 字节消息 -> 64B', () => {
    expect(kmacHex({ capacity: 256, key: key32, data: msg200, outLen: 64, custom: '' }))
      .toBe('75358cf39e41494e949707927cee0af20a3ff553904c86b08f21cc414bcfd6915'
          + '89d27cf5e15369cbbff8b9a4c2eb17800855d0235ff635da82533ec6b759b69');
  });

  it('S="My Tagged Application" 200 字节消息 -> 64B', () => {
    expect(kmacHex({ capacity: 256, key: key32, data: msg200, outLen: 64, custom: TAGGED }))
      .toBe('b58618f71f92e1d56c1b8c55ddd7cd188b97b4ca4d99831eb2699a837da2e4d9'
          + '70fbacfde50033aea585f1a2708510c32d07880801bd182898fe476876fc8965');
  });
});

describe('KMAC 通用行为', () => {
  it('key/data 字符串按 UTF-8, 输出与手工字节一致', () => {
    const a = kmacHex({ capacity: 128, key: 'abc', data: '你好', outLen: 16, custom: '' });
    const b = kmacHex({ capacity: 128, key: utf8Bytes('abc'), data: utf8Bytes('你好'), outLen: 16, custom: '' });
    expect(a).toBe(b);
    expect(a).toHaveLength(32);
  });

  it('同一输入重复计算一致 / 不同 custom 输出不同', () => {
    const base = { capacity: 128 as const, key: 'k', data: 'hello', outLen: 16, custom: '' };
    expect(kmacHex(base)).toBe(kmacHex(base));
    expect(kmacHex(base)).not.toBe(kmacHex({ ...base, custom: 'x' }));
  });

  it('KMAC128 与 KMAC256 输出不同', () => {
    expect(kmacHex({ capacity: 128, key: 'k', data: 'hello', outLen: 32, custom: '' }))
      .not.toBe(kmacHex({ capacity: 256, key: 'k', data: 'hello', outLen: 32, custom: '' }));
  });

  it('非法长度抛错', () => {
    const k = utf8Bytes('k');
    expect(() => kmac({ capacity: 128, key: k, data: utf8Bytes(''), outLen: 0, custom: '' })).toThrow();
    expect(() => kmac({ capacity: 128, key: k, data: utf8Bytes(''), outLen: 9000, custom: '' })).toThrow();
  });
});
