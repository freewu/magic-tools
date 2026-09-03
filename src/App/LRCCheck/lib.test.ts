import { parseInput, computeLrc, lrcSum, lrcTwos } from './lib';

describe('LRC 校验 (纵向冗余校验)', () => {

  test('累加和: mod 256 取低 8 位', () => {
    expect(lrcSum([0x01, 0x02, 0x03])).toBe(0x06);
    expect(lrcSum([0xFF, 0x01])).toBe(0x00);      // 进位丢弃
    expect(lrcSum([0x80, 0x80])).toBe(0x00);      // 0x100 -> 0x00
    expect(lrcSum([0x41, 0x42, 0x43])).toBe(0xC6); // 'ABC'
    expect(lrcSum([])).toBe(0x00);
  });

  test('补码 LRC (Modbus): (-sum) mod 256', () => {
    expect(lrcTwos([0x01, 0x02, 0x03])).toBe(0xFA); // 0x06 -> 0xFA
    expect(lrcTwos([0xFF, 0x01])).toBe(0x00);       // sum 0x00 -> 0x00
    expect(lrcTwos([0x41, 0x42, 0x43])).toBe(0x3A); // 'ABC': 0xC6 -> 0x3A
    expect(lrcTwos([])).toBe(0x00);
  });

  test('Modbus 文档示例: 01 03 04 02 00 01 00 -> LRC F5', () => {
    expect(lrcSum([0x01, 0x03, 0x04, 0x02, 0x00, 0x01, 0x00])).toBe(0x0B);
    expect(lrcTwos([0x01, 0x03, 0x04, 0x02, 0x00, 0x01, 0x00])).toBe(0xF5);
  });

  test('computeLrc 按算法分发 + HEX 模式解析', () => {
    expect(computeLrc(parseInput('01 03 04 02 00 01 00', 'hex'), 'twos')).toBe(0xF5);
    expect(computeLrc(parseInput('01 02 03', 'hex'), 'sum')).toBe(0x06);
    expect(computeLrc(parseInput('ABC', 'ascii'), 'twos')).toBe(0x3A);
  });
});
