// CRC 校验算法参数表 (参考 ip33.com/crc.html 与公开标准目录 reveng/crccalc)
// check: 校验测试串 "123456789" (ASCII) 的标准结果, 用于引擎自检
// 多项式公式 (如 "x8 + x2 + x + 1") 由 poly 自动推导, 见 lib.polyFormula
export interface CRCParam {
  name: string;
  width: number;      // 位宽 (3~64)
  poly: string;       // 多项式 (hex, 不含 0x, 不含隐含的最高位)
  init: string;       // 初始值 (hex)
  refin: boolean;     // 输入反射
  refout: boolean;    // 输出反射
  xorout: string;     // 输出异或值 (hex)
  check: string;      // 校验值 check (hex, 大写, 位宽对齐)
}

export const CRC_ALGOS :CRCParam[] = [
  // ---- 3 bit ----
  { name: 'CRC-3/GSM', width: 3, poly: '3', init: '0', refin: false, refout: false, xorout: '7', check: '4' },
  { name: 'CRC-3/ROHC', width: 3, poly: '3', init: '7', refin: true, refout: true, xorout: '0', check: '6' },
  // ---- 4 bit ----
  { name: 'CRC-4/ITU', width: 4, poly: '3', init: '0', refin: true, refout: true, xorout: '0', check: '7' },
  { name: 'CRC-4/INTERLAKEN', width: 4, poly: '3', init: 'F', refin: false, refout: false, xorout: 'F', check: 'B' },
  // ---- 5 bit ----
  { name: 'CRC-5/EPC', width: 5, poly: '9', init: '9', refin: false, refout: false, xorout: '0', check: '00' },
  { name: 'CRC-5/ITU', width: 5, poly: '15', init: '0', refin: true, refout: true, xorout: '0', check: '07' },
  { name: 'CRC-5/USB', width: 5, poly: '5', init: '1F', refin: true, refout: true, xorout: '1F', check: '19' },
  // ---- 6 bit ----
  { name: 'CRC-6/ITU', width: 6, poly: '3', init: '0', refin: true, refout: true, xorout: '0', check: '06' },
  // ---- 7 bit ----
  { name: 'CRC-7/MMC', width: 7, poly: '9', init: '0', refin: false, refout: false, xorout: '0', check: '75' },
  // ---- 8 bit ----
  { name: 'CRC-8', width: 8, poly: '07', init: '00', refin: false, refout: false, xorout: '00', check: 'F4' },
  { name: 'CRC-8/ITU', width: 8, poly: '07', init: '00', refin: false, refout: false, xorout: '55', check: 'A1' },
  { name: 'CRC-8/ROHC', width: 8, poly: '07', init: 'FF', refin: true, refout: true, xorout: '00', check: 'D0' },
  { name: 'CRC-8/MAXIM', width: 8, poly: '31', init: '00', refin: true, refout: true, xorout: '00', check: 'A1' },
  { name: 'CRC-8/SAE-J1850', width: 8, poly: '1D', init: 'FF', refin: false, refout: false, xorout: 'FF', check: '4B' },
  { name: 'CRC-8/AUTOSAR', width: 8, poly: '2F', init: 'FF', refin: false, refout: false, xorout: 'FF', check: 'DF' },
  { name: 'CRC-8/EBU', width: 8, poly: '1D', init: 'FF', refin: true, refout: true, xorout: '00', check: '97' },
  { name: 'CRC-8/DARC', width: 8, poly: '39', init: '00', refin: true, refout: true, xorout: '00', check: '15' },
  // ---- 10 bit ----
  { name: 'CRC-10/ITU', width: 10, poly: '233', init: '000', refin: false, refout: false, xorout: '000', check: '199' },
  // ---- 11 bit ----
  { name: 'CRC-11/FlexRay', width: 11, poly: '385', init: '01A', refin: false, refout: false, xorout: '000', check: '5A3' },
  // ---- 12 bit ----
  { name: 'CRC-12', width: 12, poly: '80F', init: '000', refin: false, refout: false, xorout: '000', check: 'F5B' },
  // ---- 16 bit ----
  { name: 'CRC-16/IBM', width: 16, poly: '8005', init: '0000', refin: true, refout: true, xorout: '0000', check: 'BB3D' },
  { name: 'CRC-16/MAXIM', width: 16, poly: '8005', init: '0000', refin: true, refout: true, xorout: 'FFFF', check: '44C2' },
  { name: 'CRC-16/USB', width: 16, poly: '8005', init: 'FFFF', refin: true, refout: true, xorout: 'FFFF', check: 'B4C8' },
  { name: 'CRC-16/MODBUS', width: 16, poly: '8005', init: 'FFFF', refin: true, refout: true, xorout: '0000', check: '4B37' },
  { name: 'CRC-16/CCITT', width: 16, poly: '1021', init: '0000', refin: true, refout: true, xorout: '0000', check: '2189' },
  { name: 'CRC-16/CCITT-FALSE', width: 16, poly: '1021', init: 'FFFF', refin: false, refout: false, xorout: '0000', check: '29B1' },
  { name: 'CRC-16/XMODEM', width: 16, poly: '1021', init: '0000', refin: false, refout: false, xorout: '0000', check: '31C3' },
  { name: 'CRC-16/X25', width: 16, poly: '1021', init: 'FFFF', refin: true, refout: true, xorout: 'FFFF', check: '906E' },
  { name: 'CRC-16/MCRF4XX', width: 16, poly: '1021', init: 'FFFF', refin: true, refout: true, xorout: '0000', check: '6F91' },
  { name: 'CRC-16/DNP', width: 16, poly: '3D65', init: '0000', refin: true, refout: true, xorout: 'FFFF', check: 'EA82' },
  { name: 'CRC-16/T10-DIF', width: 16, poly: '8BB7', init: '0000', refin: false, refout: false, xorout: '0000', check: 'D0DB' },
  { name: 'CRC-16/AUG-CCITT', width: 16, poly: '1021', init: '1D0F', refin: false, refout: false, xorout: '0000', check: 'E5CC' },
  { name: 'CRC-16/BUYPASS', width: 16, poly: '8005', init: '0000', refin: false, refout: false, xorout: '0000', check: 'FEE8' },
  { name: 'CRC-16/GENIBUS', width: 16, poly: '1021', init: 'FFFF', refin: false, refout: false, xorout: 'FFFF', check: 'D64E' },
  { name: 'CRC-16/GSM', width: 16, poly: '1021', init: '0000', refin: false, refout: false, xorout: 'FFFF', check: 'CE3C' },
  { name: 'CRC-16/EN-13757', width: 16, poly: '3D65', init: '0000', refin: false, refout: false, xorout: 'FFFF', check: 'C2B7' },
  // ---- 17 / 21 bit (CAN-FD) ----
  { name: 'CRC-17/CAN-FD', width: 17, poly: '1685B', init: '00000', refin: false, refout: false, xorout: '00000', check: '04F03' },
  { name: 'CRC-21/CAN-FD', width: 21, poly: '102899', init: '000000', refin: false, refout: false, xorout: '000000', check: '0ED841' },
  // ---- 24 bit ----
  { name: 'CRC-24/OPENPGP', width: 24, poly: '864CFB', init: 'B704CE', refin: false, refout: false, xorout: '000000', check: '21CF02' },
  { name: 'CRC-24/BLE', width: 24, poly: '00065B', init: '555555', refin: true, refout: true, xorout: '000000', check: 'D39857' },
  { name: 'CRC-24/FlexRay-A', width: 24, poly: '5D6DCB', init: 'FEDCBA', refin: false, refout: false, xorout: '000000', check: '7979BD' },
  { name: 'CRC-24/FlexRay-B', width: 24, poly: '5D6DCB', init: 'ABCDEF', refin: false, refout: false, xorout: '000000', check: '1F23B8' },
  { name: 'CRC-24/LTE', width: 24, poly: '800063', init: '000000', refin: false, refout: false, xorout: '000000', check: '23EF52' },
  // ---- 31 bit ----
  { name: 'CRC-31/Philips', width: 31, poly: '04C11DB7', init: '7FFFFFFF', refin: false, refout: false, xorout: '7FFFFFFF', check: '0CE9E46C' },
  // ---- 32 bit ----
  { name: 'CRC-32', width: 32, poly: '04C11DB7', init: 'FFFFFFFF', refin: true, refout: true, xorout: 'FFFFFFFF', check: 'CBF43926' },
  { name: 'CRC-32/MPEG-2', width: 32, poly: '04C11DB7', init: 'FFFFFFFF', refin: false, refout: false, xorout: '00000000', check: '0376E6E7' },
  { name: 'CRC-32/BZIP2', width: 32, poly: '04C11DB7', init: 'FFFFFFFF', refin: false, refout: false, xorout: 'FFFFFFFF', check: 'FC891918' },
  { name: 'CRC-32/C', width: 32, poly: '1EDC6F41', init: 'FFFFFFFF', refin: true, refout: true, xorout: 'FFFFFFFF', check: 'E3069283' },
  { name: 'CRC-32/K', width: 32, poly: '741B8CD7', init: 'FFFFFFFF', refin: true, refout: true, xorout: 'FFFFFFFF', check: '2D3DD0AE' },
  { name: 'CRC-32/POSIX', width: 32, poly: '04C11DB7', init: '00000000', refin: false, refout: false, xorout: 'FFFFFFFF', check: '765E7680' },
  { name: 'CRC-32/JAMCRC', width: 32, poly: '04C11DB7', init: 'FFFFFFFF', refin: true, refout: true, xorout: '00000000', check: '340BC6D9' },
  // ---- 64 bit ----
  { name: 'CRC-64/ECMA-182', width: 64, poly: '42F0E1EBA9EA3693', init: '0000000000000000', refin: false, refout: false, xorout: '0000000000000000', check: '6C40DF5F0B497347' },
  { name: 'CRC-64/WE', width: 64, poly: '42F0E1EBA9EA3693', init: 'FFFFFFFFFFFFFFFF', refin: false, refout: false, xorout: 'FFFFFFFFFFFFFFFF', check: '62EC59E3F1A4F00A' },
  { name: 'CRC-64/XZ', width: 64, poly: '42F0E1EBA9EA3693', init: 'FFFFFFFFFFFFFFFF', refin: true, refout: true, xorout: 'FFFFFFFFFFFFFFFF', check: '995DC9BBDF1939FA' },
  { name: 'CRC-64/GO-ISO', width: 64, poly: '1B', init: 'FFFFFFFFFFFFFFFF', refin: true, refout: true, xorout: 'FFFFFFFFFFFFFFFF', check: 'B90956C775A41001' },
];

export const findAlgo = (name :string) :CRCParam => {
  const a = CRC_ALGOS.find((x) => x.name === name);
  if (!a) throw new Error('未知的 CRC 算法: ' + name);
  return a;
}
