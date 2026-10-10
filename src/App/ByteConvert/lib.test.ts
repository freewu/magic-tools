import { bytesToSize, convertToByte, convertFromByte, toByte, fromByte, getDefaultType, setDefaultType } from './lib';
import { BigNumber } from '../../lib/bignumber';

describe('ByteConvert lib', () => {
  beforeEach(() => localStorage.clear());

  test('bytesToSize 换算成可读大小 (1024 进制)', () => {
    expect(bytesToSize(0)).toBe('0 B');
    expect(bytesToSize(1024)).toBe('1.00 KB');
    expect(bytesToSize(2 * 1024 * 1024)).toBe('2.00 MB');
    expect(bytesToSize(3.5 * 1024)).toBe('3.50 KB');
    expect(bytesToSize(1)).toBe('1.00 B');
  });

  test('convertToByte 各单位转字节', () => {
    expect(convertToByte(1, 'B')).toBe(1);
    expect(convertToByte(1, 'KB')).toBe(1024);
    expect(convertToByte(2, 'MB')).toBe(2 * 1024 * 1024);
    expect(convertToByte(1, 'gB')).toBe(1024 * 1024 * 1024); // 小写也接受
    expect(convertToByte(1, 'TB')).toBe(1024 ** 4);
    expect(convertToByte(5, 'unknown')).toBe(5); // 未知单位原样返回
  });

  test('convertFromByte 字节转各单位 (与 convertToByte 互逆)', () => {
    expect(convertFromByte(1024, 'KB')).toBe(1);
    expect(convertFromByte(2 * 1024 * 1024, 'MB')).toBe(2);
    expect(convertFromByte(1024 ** 4, 'TB')).toBe(1);
    expect(convertFromByte(1024 ** 8, 'YB')).toBe(1);
    expect(convertFromByte(7, 'xx')).toBe(7);
  });

  test('默认单位可持久化, 无存储回退 GB', () => {
    expect(getDefaultType()).toBe('GB');
    setDefaultType('MB');
    expect(getDefaultType()).toBe('MB');
  });

  test('toByte / fromByte 使用 BigNumber 精确换算 (不丢小数)', () => {
    // 旧实现用 parseInt, 小数会被截断
    expect(toByte(new BigNumber('0.1'), 'KB').toFixed()).toBe('102.4');
    expect(toByte(new BigNumber(2), 'MB').toFixed()).toBe('2097152');
    expect(toByte(new BigNumber(1), 'kB').toFixed()).toBe('1024'); // 大小写无关
    expect(toByte(new BigNumber(5), 'unknown').toFixed()).toBe('5'); // 未知单位原样返回
    expect(fromByte(new BigNumber(1024), 'KB').toFixed()).toBe('1');
    expect(fromByte(new BigNumber(1), 'KB').toFixed()).toBe('0.0009765625'); // 有限小数, 完全精确
  });

  test('toByte 与 fromByte 互逆 (含小数, 无浮点误差)', () => {
    const bytes = toByte(new BigNumber('123.456'), 'GB');
    expect(fromByte(bytes, 'GB').toFixed()).toBe('123.456');
    const kb = toByte(new BigNumber('1.5'), 'KB');
    expect(fromByte(kb, 'KB').toFixed()).toBe('1.5');
  });
});
