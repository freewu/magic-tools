import { encodeNumber, decodeNumber, signedRangeText, unsignedRangeText } from './lib';
import type { DecodeKind } from './lib';

describe('位宽范围', () => {
  it('8 位范围文本', () => {
    expect(signedRangeText(8)).toBe('-128 ~ 127');
    expect(unsignedRangeText(8)).toBe('0 ~ 255');
  });

  it('16/64 位有符号范围', () => {
    expect(signedRangeText(16)).toBe('-32768 ~ 32767');
    expect(signedRangeText(64)).toBe('-9223372036854775808 ~ 9223372036854775807');
  });
});

describe('encodeNumber: 十进制 → 原码/反码/补码', () => {
  it('正数三码相同', () => {
    const r = encodeNumber('5', 8);
    expect(r).toMatchObject({ sm: '00000101', oc: '00000101', tc: '00000101', tcHex: '05' });
  });

  it('负数 -5 (8位): 原码 10000101 / 反码 11111010 / 补码 11111011', () => {
    const r = encodeNumber('-5', 8);
    expect(r).toMatchObject({ sm: '10000101', oc: '11111010', tc: '11111011', tcHex: 'FB', smOcUnavailable: false });
  });

  it('127 / -128 边界 (8位)', () => {
    expect(encodeNumber('127', 8)).toMatchObject({ tc: '01111111', tcHex: '7F' });
    const r = encodeNumber('-128', 8);
    expect(r).toMatchObject({ tc: '10000000', tcHex: '80', smOcUnavailable: true });
    if (r.ok) {
      expect(r.sm).toBe('');
      expect(r.oc).toBe('');
    }
  });

  it('-1 (8位) 补码全 1', () => {
    expect(encodeNumber('-1', 8)).toMatchObject({ tc: '11111111', tcHex: 'FF' });
  });

  it('64 位极大值', () => {
    const r = encodeNumber('9223372036854775807', 64);
    expect(r).toMatchObject({ tcHex: '7FFFFFFFFFFFFFFF' });
    const rn = encodeNumber('-9223372036854775808', 64);
    if (rn.ok) {
      expect(rn.tcHex).toBe('8000000000000000');
      expect(rn.smOcUnavailable).toBe(true);
    }
  });

  it('非法/越界输入报错', () => {
    expect(encodeNumber('abc', 8).ok).toBe(false);
    expect(encodeNumber('1.5', 8).ok).toBe(false);
    expect(encodeNumber('128', 8).ok).toBe(false);
    expect(encodeNumber('-129', 8).ok).toBe(false);
    expect(encodeNumber('', 8).ok).toBe(false);
    expect(encodeNumber('1', 0).ok).toBe(false);
    expect(encodeNumber('1', 65).ok).toBe(false);
  });
});

describe('decodeNumber: 编码 → 十进制', () => {
  const dec = (t: string, b: number, k: DecodeKind) => {
    const r = decodeNumber(t, b, k);
    return r.ok ? r.decimal : r.error;
  };

  it('补码二进制解码', () => {
    expect(dec('11111011', 8, 'tc')).toBe('-5');
    expect(dec('00000101', 8, 'tc')).toBe('5');
    expect(dec('10000000', 8, 'tc')).toBe('-128');
    expect(dec('01111111', 8, 'tc')).toBe('127');
  });

  it('补码十六进制解码 (含 0x 前缀)', () => {
    expect(dec('FB', 8, 'hex')).toBe('-5');
    expect(dec('0xff', 8, 'hex')).toBe('-1');
    expect(dec('7F', 8, 'hex')).toBe('127');
    expect(dec('FFFFFFFFFFFFFFFF', 64, 'hex')).toBe('-1');
  });

  it('原码解码', () => {
    expect(dec('10000101', 8, 'sm')).toBe('-5');
    expect(dec('00000101', 8, 'sm')).toBe('5');
  });

  it('反码解码', () => {
    expect(dec('11111010', 8, 'oc')).toBe('-5');
    expect(dec('00000101', 8, 'oc')).toBe('5');
    expect(dec('10000000', 8, 'oc')).toBe('-127');
  });

  it('输入不足位宽自动左补 0; 超位宽报错', () => {
    expect(dec('101', 8, 'tc')).toBe('5'); // 00000101
    expect(dec('111110111', 8, 'tc')).toContain('超出');
    expect(dec('XYZ', 8, 'tc')).toContain('二进制');
    expect(dec('GG', 8, 'hex')).toContain('十六进制');
  });

  it('与 encode 往返一致', () => {
    for (const [v, b] of [['-99', 16], ['12345', 16], ['-1', 8], ['0', 8]] as Array<[string, number]>) {
      const e = encodeNumber(v, b);
      if (e.ok) {
        expect(dec(e.tc, b, 'tc')).toBe(v);
        expect(dec(e.tcHex, b, 'hex')).toBe(v);
      }
    }
  });
});
