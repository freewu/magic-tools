// LRC (Longitudinal Redundancy Check, 纵向冗余校验)
// 对数据区逐字节做算术累加 (忽略进位, 即 mod 256), 常见两种结果形式:
//   - SUM   : 累加和取低 8 位 (和校验)
//   - 补码   : 累加和取低 8 位后求二进制补码 (Modbus RTU LRC = -sum, 标准做法)
// 解析/格式化等通用能力统一来自 src/lib/byte.ts

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

// 累加和取低 8 位 (0-255)
export const lrcSum = (bytes :number[]) :number => {
  let s = 0;
  for (const b of bytes) s = (s + b) & 0xff;
  return s;
}

// 补码 LRC (Modbus): (-累加和) mod 256, 即对累加和低 8 位求二进制补码
export const lrcTwos = (bytes :number[]) :number => {
  const s = lrcSum(bytes);
  return s === 0 ? 0 : 256 - s;
}

// 按算法计算 LRC 值 (0-255)
export const computeLrc = (bytes :number[], algo :'twos' | 'sum') :number => {
  return algo === 'twos' ? lrcTwos(bytes) : lrcSum(bytes);
}

// ---- 默认输入格式 (localStorage, 供设置页/页面初始化使用) ----
const DEFAULT_MODE_KEY = 'lrc-check:default-input-mode';

// 默认输入格式: 未设置时默认 ASCII
export const getDefaultInputMode = () :'hex' | 'ascii' => {
  return localStorage.getItem(DEFAULT_MODE_KEY) === 'hex' ? 'hex' : 'ascii';
}

export const setDefaultInputMode = (mode :'hex' | 'ascii') :void => {
  localStorage.setItem(DEFAULT_MODE_KEY, mode);
}
