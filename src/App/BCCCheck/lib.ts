// BCC (Block Check Character) 校验: 对数据区逐字节做 XOR 异或累加, 常用于
// 串口/Modbus 等通信协议帧的简单校验 (起始值固定 0x00)
// 解析/格式化等通用能力统一来自 src/lib/byte.ts

import { byteToHex } from '../../lib/byte';

export {
  parseHexBytes,
  strToUtf8Bytes,
  parseInput,
  byteToHex,
  byteToDec,
  byteToOct,
  byteToBin,
  parseExpectedByte as parseExpected,
} from '../../lib/byte';

// 逐字节异或累加得到 BCC 值 (0-255)
export const bccXor = (bytes :number[]) :number => {
  let r = 0x00;
  for (const b of bytes) r ^= b;
  return r;
}

// 计算 BCC 并返回 2 位大写 HEX 字符串
export const bccHex = (bytes :number[]) :string => {
  return byteToHex(bccXor(bytes));
}
