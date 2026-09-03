import { computeCrc, formatCrc, crcOf, crcOfAscii, findAlgo, CRC_ALGOS, polyFormula } from './lib';

describe('CRC 校验 (参数化引擎)', () => {

  // 全部算法用标准测试串 "123456789" (ASCII) 校验, 结果须等于各算法 check 值
  test('整表自检: 全部算法 check(123456789) 一致', () => {
    const msg = '123456789';
    expect(CRC_ALGOS.length).toBeGreaterThanOrEqual(44);
    for (const algo of CRC_ALGOS) {
      const v = computeCrc(Array.from(msg).map((c) => c.charCodeAt(0)), algo);
      const hex = v.toString(16).toUpperCase().padStart(Math.ceil(algo.width / 4), '0');
      expect(hex).toBe(algo.check);
    }
  });

  test('常见算法 spot check (公开目录/官方标准一致)', () => {
    expect(crcOfAscii('123456789', 'CRC-16/MODBUS').hex).toBe('4B37');
    expect(crcOfAscii('123456789', 'CRC-16/IBM').hex).toBe('BB3D');
    expect(crcOfAscii('123456789', 'CRC-16/CCITT').hex).toBe('2189');
    expect(crcOfAscii('123456789', 'CRC-16/CCITT-FALSE').hex).toBe('29B1');
    expect(crcOfAscii('123456789', 'CRC-16/XMODEM').hex).toBe('31C3');
    expect(crcOfAscii('123456789', 'CRC-16/X25').hex).toBe('906E');
    expect(crcOfAscii('123456789', 'CRC-16/MCRF4XX').hex).toBe('6F91');
    expect(crcOfAscii('123456789', 'CRC-16/DNP').hex).toBe('EA82');
    expect(crcOfAscii('123456789', 'CRC-16/T10-DIF').hex).toBe('D0DB');
    expect(crcOfAscii('123456789', 'CRC-8').hex).toBe('F4');
    expect(crcOfAscii('123456789', 'CRC-8/ITU').hex).toBe('A1');
    expect(crcOfAscii('123456789', 'CRC-8/MAXIM').hex).toBe('A1');
    expect(crcOfAscii('123456789', 'CRC-24/OPENPGP').hex).toBe('21CF02');
    expect(crcOfAscii('123456789', 'CRC-24/BLE').hex).toBe('D39857');
    expect(crcOfAscii('123456789', 'CRC-24/FlexRay-A').hex).toBe('7979BD');
    expect(crcOfAscii('123456789', 'CRC-32').hex).toBe('CBF43926');
    expect(crcOfAscii('123456789', 'CRC-32/MPEG-2').hex).toBe('0376E6E7');
    expect(crcOfAscii('123456789', 'CRC-32/C').hex).toBe('E3069283');
    expect(crcOfAscii('123456789', 'CRC-64/ECMA-182').hex).toBe('6C40DF5F0B497347');
    expect(crcOfAscii('123456789', 'CRC-64/WE').hex).toBe('62EC59E3F1A4F00A');
    expect(crcOfAscii('123456789', 'CRC-64/XZ').hex).toBe('995DC9BBDF1939FA');
    expect(crcOfAscii('123456789', 'CRC-64/GO-ISO').hex).toBe('B90956C775A41001');
  });

  test('宽度 <8 的算法 (CRC-3/4/5/6/7) 结果正确', () => {
    expect(crcOfAscii('123456789', 'CRC-3/GSM').hex).toBe('4');
    expect(crcOfAscii('123456789', 'CRC-3/ROHC').hex).toBe('6');
    expect(crcOfAscii('123456789', 'CRC-4/ITU').hex).toBe('7');
    expect(crcOfAscii('123456789', 'CRC-4/INTERLAKEN').hex).toBe('B');
    expect(crcOfAscii('123456789', 'CRC-5/EPC').hex).toBe('00');
    expect(crcOfAscii('123456789', 'CRC-5/ITU').hex).toBe('07');
    expect(crcOfAscii('123456789', 'CRC-5/USB').hex).toBe('19');
    expect(crcOfAscii('123456789', 'CRC-6/ITU').hex).toBe('06');
    expect(crcOfAscii('123456789', 'CRC-7/MMC').hex).toBe('75');
    expect(crcOfAscii('123456789', 'CRC-11/FlexRay').hex).toBe('5A3');
    expect(crcOfAscii('123456789', 'CRC-17/CAN-FD').hex).toBe('04F03');
    expect(crcOfAscii('123456789', 'CRC-21/CAN-FD').hex).toBe('0ED841');
  });

  test('HEX 输入与 ASCII 输入等价', () => {
    const bytesHex = crcOf('31 32 33 34 35 36 37 38 39', 'hex', 'CRC-16/MODBUS');
    const bytesAscii = crcOfAscii('123456789', 'CRC-16/MODBUS');
    expect(bytesHex.hex).toBe(bytesAscii.hex);
    expect(bytesHex.hex).toBe('4B37');
  });

  test('多项式公式推导 (与 ip33 展示一致)', () => {
    expect(polyFormula(findAlgo('CRC-8'))).toBe('x8 + x2 + x + 1');
    expect(polyFormula(findAlgo('CRC-8/MAXIM'))).toBe('x8 + x5 + x4 + 1');
    expect(polyFormula(findAlgo('CRC-16/MODBUS'))).toBe('x16 + x15 + x2 + 1');
    expect(polyFormula(findAlgo('CRC-16/DNP'))).toBe('x16 + x13 + x12 + x11 + x10 + x8 + x6 + x5 + x2 + 1');
    expect(polyFormula(findAlgo('CRC-16/CCITT-FALSE'))).toBe('x16 + x12 + x5 + 1');
    expect(polyFormula(findAlgo('CRC-32'))).toBe('x32 + x26 + x23 + x22 + x16 + x12 + x11 + x10 + x8 + x7 + x5 + x4 + x2 + x + 1');
    expect(polyFormula(findAlgo('CRC-5/EPC'))).toBe('x5 + x3 + 1');
    expect(polyFormula(findAlgo('CRC-64/XZ'))).toBe('x64 + x62 + x57 + x55 + x54 + x53 + x52 + x47 + x46 + x45 + x40 + x39 + x38 + x37 + x35 + x33 + x32 + x31 + x29 + x27 + x24 + x23 + x22 + x21 + x19 + x17 + x13 + x12 + x10 + x9 + x7 + x4 + x + 1');
  });

  test('格式化: 输出位宽对齐', () => {
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
});
