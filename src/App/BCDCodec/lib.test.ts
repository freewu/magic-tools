import { BCDEncode, BCDDecode, getDefaultType, setDefaultType } from './lib';
import { ENCODE_TABLES, type BCDType } from './data';

// 标准码表 (数字电子技术) 对照
const GOLDEN: Record<BCDType, string[]> = {
  '8421': ['0000', '0001', '0010', '0011', '0100', '0101', '0110', '0111', '1000', '1001'],
  '5421': ['0000', '0001', '0010', '0011', '0100', '1000', '1001', '1010', '1011', '1100'],
  '2421': ['0000', '0001', '0010', '0011', '0100', '1011', '1100', '1101', '1110', '1111'],
  'xs3': ['0011', '0100', '0101', '0110', '0111', '1000', '1001', '1010', '1011', '1100'],
  'xs3-gray': ['0010', '0110', '0111', '0101', '0100', '1100', '1101', '1111', '1110', '1010'],
  'gray': ['0000', '0001', '0011', '0010', '0110', '0111', '0101', '0100', '1100', '1101'],
};

const TYPES: BCDType[] = ['8421', '5421', '2421', 'xs3', 'xs3-gray', 'gray'];

describe('BCD 码表对照', () => {
  TYPES.forEach((t) => {
    it(`${t} 码表与标准一致`, () => {
      // 逐位编码 0-9 应等于标准码表
      const enc = BCDEncode('0123456789', t).replace(/\s/g, '');
      expect(enc).toBe(GOLDEN[t].join(''));
      // 表本身与期望一致 (防误改)
      expect(ENCODE_TABLES[t].join(' ')).toBe(GOLDEN[t].join(' '));
    });
  });
});

describe('BCD 编解码', () => {
  it('8421 编码 123 -> 0001 0010 0011', () => {
    expect(BCDEncode('123', '8421')).toBe('0001 0010 0011');
  });

  it('解码按每 4 位还原数字', () => {
    expect(BCDDecode('0001 0010 0011', '8421')).toBe('123');
    expect(BCDDecode('10011000', '8421')).toBe('98');
  });

  it('输入空白(空格/换行)不影响编码', () => {
    expect(BCDEncode('12 3\n45', '8421')).toBe(BCDEncode('12345', '8421'));
  });

  it('各码型 0-9 往返一致', () => {
    const src = '0123456789';
    TYPES.forEach((t) => {
      expect(BCDDecode(BCDEncode(src, t), t)).toBe(src);
    });
  });

  it('多位数往返一致', () => {
    const src = '201609052024';
    TYPES.forEach((t) => {
      expect(BCDDecode(BCDEncode(src, t), t)).toBe(src);
    });
  });

  it('5421: 5 编码为 1000, 0101 为无效码组', () => {
    expect(BCDEncode('5', '5421')).toBe('1000');
    expect(() => BCDDecode('0101', '5421')).toThrow(/无效/);
  });

  it('2421: 5 编码为 1011 (自补码), 9 为 1111', () => {
    expect(BCDEncode('5', '2421')).toBe('1011');
    expect(BCDEncode('9', '2421')).toBe('1111');
  });

  it('余3码: 0 编码为 0011', () => {
    expect(BCDEncode('0', 'xs3')).toBe('0011');
  });

  it('余3循环码: 0 -> 0010, 9 -> 1010', () => {
    expect(BCDEncode('0', 'xs3-gray')).toBe('0010');
    expect(BCDEncode('9', 'xs3-gray')).toBe('1010');
  });

  it('Gray 码: 相邻数字仅一位变化', () => {
    const codes = ENCODE_TABLES.gray;
    for (let i = 1; i <= 9; i++) {
      const a = codes[i - 1]; const b = codes[i];
      let diff = 0;
      for (let k = 0; k < 4; k++) if (a[k] !== b[k]) diff++;
      expect(diff).toBe(1);
    }
  });

  it('8421: 1010-1111 为无效码组', () => {
    expect(() => BCDDecode('1010', '8421')).toThrow(/无效/);
    expect(() => BCDDecode('1111', '8421')).toThrow(/无效/);
  });

  it('非法输入报错', () => {
    expect(() => BCDEncode('12a', '8421')).toThrow(/非数字/);
    expect(() => BCDEncode('', '8421')).toThrow(/输入/);
    expect(() => BCDDecode('001', '8421')).toThrow(/4 的倍数/);
    expect(() => BCDDecode('', '8421')).toThrow(/输入/);
    expect(() => BCDDecode('001x', '8421')).toThrow(/非二进制/);
  });
});

describe('默认码型', () => {
  it('默认 8421 码', () => {
    localStorage.clear();
    expect(getDefaultType()).toBe('8421');
  });

  it('可设置并持久化', () => {
    setDefaultType('gray');
    expect(getDefaultType()).toBe('gray');
    setDefaultType('8421');
    localStorage.clear();
  });
});
