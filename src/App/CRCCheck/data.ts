// CRC 校验算法参数表 (参数命名参考 ip33.com/crc.html / crccalc 目录)
// check: 校验测试串 "123456789" (ASCII) 的标准结果, 用于引擎自检
export interface CRCParam {
  name: string;
  width: number;      // 位宽 (8/10/12/16/24/32/64)
  poly: string;       // 多项式 (hex, 不含 0x)
  init: string;       // 初始值 (hex)
  refin: boolean;     // 输入反射
  refout: boolean;    // 输出反射
  xorout: string;     // 输出异或值 (hex)
  check: string;      // 校验值 check (hex, 大写, 位宽对齐)
}

export const CRC_ALGOS :CRCParam[] = [
  // ---- 8 bit ----
  { name: 'CRC-8', width: 8, poly: '07', init: '00', refin: false, refout: false, xorout: '00', check: 'F4' },
  { name: 'CRC-8/ITU', width: 8, poly: '07', init: '00', refin: false, refout: false, xorout: '55', check: 'A1' },
  { name: 'CRC-8/ROHC', width: 8, poly: '07', init: 'FF', refin: true, refout: true, xorout: '00', check: 'D0' },
  { name: 'CRC-8/MAXIM', width: 8, poly: '31', init: '00', refin: true, refout: true, xorout: '00', check: 'A1' },
  { name: 'CRC-8/SAE-J1850', width: 8, poly: '1D', init: 'FF', refin: false, refout: false, xorout: 'FF', check: '4B' },
  { name: 'CRC-8/AUTOSAR', width: 8, poly: '2F', init: 'FF', refin: false, refout: false, xorout: 'FF', check: 'DF' },
  { name: 'CRC-8/EBU', width: 8, poly: '1D', init: 'FF', refin: true, refout: true, xorout: '00', check: '97' },
  { name: 'CRC-8/DARC', width: 8, poly: '39', init: '00', refin: true, refout: true, xorout: '00', check: '15' },
  // ---- 10 / 12 bit ----
  { name: 'CRC-10', width: 10, poly: '233', init: '000', refin: false, refout: false, xorout: '000', check: '199' },
  { name: 'CRC-12', width: 12, poly: '80F', init: '000', refin: false, refout: false, xorout: '000', check: 'F5B' },
  // ---- 16 bit ----
  { name: 'CRC-16/ARC', width: 16, poly: '8005', init: '0000', refin: true, refout: true, xorout: '0000', check: 'BB3D' },
  { name: 'CRC-16/MAXIM', width: 16, poly: '8005', init: '0000', refin: true, refout: true, xorout: 'FFFF', check: '44C2' },
  { name: 'CRC-16/USB', width: 16, poly: '8005', init: 'FFFF', refin: true, refout: true, xorout: 'FFFF', check: 'B4C8' },
  { name: 'CRC-16/MODBUS', width: 16, poly: '8005', init: 'FFFF', refin: true, refout: true, xorout: '0000', check: '4B37' },
  { name: 'CRC-16/CCITT-FALSE', width: 16, poly: '1021', init: 'FFFF', refin: false, refout: false, xorout: '0000', check: '29B1' },
  { name: 'CRC-16/XMODEM', width: 16, poly: '1021', init: '0000', refin: false, refout: false, xorout: '0000', check: '31C3' },
  { name: 'CRC-16/ZMODEM', width: 16, poly: '1021', init: '0000', refin: false, refout: false, xorout: '0000', check: '31C3' },
  { name: 'CRC-16/KERMIT', width: 16, poly: '1021', init: '0000', refin: true, refout: true, xorout: '0000', check: '2189' },
  { name: 'CRC-16/X25', width: 16, poly: '1021', init: 'FFFF', refin: true, refout: true, xorout: 'FFFF', check: '906E' },
  { name: 'CRC-16/AUG-CCITT', width: 16, poly: '1021', init: '1D0F', refin: false, refout: false, xorout: '0000', check: 'E5CC' },
  { name: 'CRC-16/BUYPASS', width: 16, poly: '8005', init: '0000', refin: false, refout: false, xorout: '0000', check: 'FEE8' },
  { name: 'CRC-16/DNP', width: 16, poly: '3D65', init: '0000', refin: true, refout: true, xorout: 'FFFF', check: 'EA82' },
  { name: 'CRC-16/GENIBUS', width: 16, poly: '1021', init: 'FFFF', refin: false, refout: false, xorout: 'FFFF', check: 'D64E' },
  { name: 'CRC-16/GSM', width: 16, poly: '1021', init: '0000', refin: false, refout: false, xorout: 'FFFF', check: 'CE3C' },
  { name: 'CRC-16/EN-13757', width: 16, poly: '3D65', init: '0000', refin: false, refout: false, xorout: 'FFFF', check: 'C2B7' },
  // ---- 24 bit ----
  { name: 'CRC-24', width: 24, poly: '864CFB', init: 'B704CE', refin: false, refout: false, xorout: '000000', check: '21CF02' },
  // ---- 32 bit ----
  { name: 'CRC-32', width: 32, poly: '04C11DB7', init: 'FFFFFFFF', refin: true, refout: true, xorout: 'FFFFFFFF', check: 'CBF43926' },
  { name: 'CRC-32/MPEG-2', width: 32, poly: '04C11DB7', init: 'FFFFFFFF', refin: false, refout: false, xorout: '00000000', check: '0376E6E7' },
  { name: 'CRC-32/BZIP2', width: 32, poly: '04C11DB7', init: 'FFFFFFFF', refin: false, refout: false, xorout: 'FFFFFFFF', check: 'FC891918' },
  { name: 'CRC-32/C', width: 32, poly: '1EDC6F41', init: 'FFFFFFFF', refin: true, refout: true, xorout: 'FFFFFFFF', check: 'E3069283' },
  { name: 'CRC-32/K', width: 32, poly: '741B8CD7', init: 'FFFFFFFF', refin: true, refout: true, xorout: 'FFFFFFFF', check: '2D3DD0AE' },
  { name: 'CRC-32/POSIX', width: 32, poly: '04C11DB7', init: '00000000', refin: false, refout: false, xorout: 'FFFFFFFF', check: '765E7680' },
  { name: 'CRC-32/JAMCRC', width: 32, poly: '04C11DB7', init: 'FFFFFFFF', refin: true, refout: true, xorout: '00000000', check: '340BC6D9' },
  // ---- 64 bit ----
  { name: 'CRC-64/XZ', width: 64, poly: '42F0E1EBA9EA3693', init: 'FFFFFFFFFFFFFFFF', refin: true, refout: true, xorout: 'FFFFFFFFFFFFFFFF', check: '995DC9BBDF1939FA' },
  { name: 'CRC-64/GO-ISO', width: 64, poly: '1B', init: 'FFFFFFFFFFFFFFFF', refin: true, refout: true, xorout: 'FFFFFFFFFFFFFFFF', check: 'B90956C775A41001' },
];

export const findAlgo = (name :string) :CRCParam => {
  const a = CRC_ALGOS.find((x) => x.name === name);
  if (!a) throw new Error('未知的 CRC 算法: ' + name);
  return a;
}
