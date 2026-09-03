import { computeCrc, formatCrc, crcOf, crcOfAscii, findAlgo, CRC_ALGOS } from './lib';

describe('CRC 校验 (参数化引擎)', () => {

  // 全部算法用标准测试串 "123456789" (ASCII) 校验, 结果须等于各算法 check 值
  test('整表自检: 35 种算法 check(123456789) 全部一致', () => {
    const msg = '123456789';
    for (const algo of CRC_ALGOS) {
      const v = computeCrc(Array.from(msg).map((c) => c.charCodeAt(0)), algo);
      const hex = v.toString(16).toUpperCase().padStart(Math.ceil(algo.width / 4), '0');
      expect(hex).toBe(algo.check);
    }
  });

  test('常见算法 spot check (与 crc npm 包/公开目录一致)', () => {
    expect(crcOfAscii('123456789', 'CRC-16/MODBUS').hex).toBe('4B37');
    expect(crcOfAscii('123456789', 'CRC-16/X25').hex).toBe('906E');
    expect(crcOfAscii('123456789', 'CRC-16/XMODEM').hex).toBe('31C3');
    expect(crcOfAscii('123456789', 'CRC-16/CCITT-FALSE').hex).toBe('29B1');
    expect(crcOfAscii('123456789', 'CRC-16/KERMIT').hex).toBe('2189');
    expect(crcOfAscii('123456789', 'CRC-16/USB').hex).toBe('B4C8');
    expect(crcOfAscii('123456789', 'CRC-16/MAXIM').hex).toBe('44C2');
    expect(crcOfAscii('123456789', 'CRC-16/ARC').hex).toBe('BB3D');
    expect(crcOfAscii('123456789', 'CRC-16/DNP').hex).toBe('EA82');
    expect(crcOfAscii('123456789', 'CRC-8').hex).toBe('F4');
    expect(crcOfAscii('123456789', 'CRC-8/MAXIM').hex).toBe('A1');
    expect(crcOfAscii('123456789', 'CRC-24').hex).toBe('21CF02');
    expect(crcOfAscii('123456789', 'CRC-32').hex).toBe('CBF43926');
    expect(crcOfAscii('123456789', 'CRC-32/MPEG-2').hex).toBe('0376E6E7');
    expect(crcOfAscii('123456789', 'CRC-64/XZ').hex).toBe('995DC9BBDF1939FA');
  });

  test('HEX 输入与 ASCII 输入等价', () => {
    // '01 02' 与 ASCII "0102" 不同; 这里验证同一字节序列两种输入方式结果一致
    const bytesHex = crcOf('31 32 33 34 35 36 37 38 39', 'hex', 'CRC-16/MODBUS');
    const bytesAscii = crcOfAscii('123456789', 'CRC-16/MODBUS');
    expect(bytesHex.hex).toBe(bytesAscii.hex);
    expect(bytesHex.hex).toBe('4B37');
  });

  test('格式化: 四位宽输出对齐', () => {
    const r = formatCrc(0x1ABFn, 16);
    expect(r.hex).toBe('1ABF');
    expect(r.bin).toBe('0001101010111111');
    expect(r.dec).toBe('6847');
    const r64 = formatCrc(0x995DC9BBDF1939FAn, 64);
    expect(r64.hex).toBe('995DC9BBDF1939FA');
    expect(r64.bin).toHaveLength(64);
    expect(r64.oct).toHaveLength(22);
  });

  test('未知算法抛错', () => {
    expect(() => findAlgo('CRC-99')).toThrow();
    expect(() => crcOf('', 'hex', 'CRC-99')).toThrow();
  });

  test('空输入 (ASCII 空串) 返回 init 处理结果', () => {
    // 空输入等价于对 init 处理: MODBUS init FFFF refin -> 结果与空帧校验一致
    const r = crcOfAscii('', 'CRC-16/MODBUS');
    expect(r.hex).toBe('FFFF'); // refin 后 init = 0xFFFF, 无字节 -> xorout 0
  });
});
