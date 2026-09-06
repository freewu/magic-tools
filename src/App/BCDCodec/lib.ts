import { ENCODE_TABLES, typeName, type BCDType } from "./data";

const DEFAULT_TYPE = 'bcd:default-type';

// 获取默认码型 (未设置时默认 8421 码)
export function getDefaultType(): BCDType {
  const saved = localStorage.getItem(DEFAULT_TYPE);
  if (saved === '8421' || saved === '5421' || saved === '2421' || saved === 'xs3' || saved === 'xs3-gray' || saved === 'gray') {
    return saved;
  }
  return '8421';
}

// 设置默认码型
export function setDefaultType(type: BCDType): void {
  localStorage.setItem(DEFAULT_TYPE, type);
}

// 编码: 十进制数字串 -> BCD 码串 (每 4 位一组, 空格分隔)
// 输入允许 0-9 数字, 可用空白(空格/换行)分隔
export const BCDEncode = (str: string, type: BCDType): string => {
  const table = ENCODE_TABLES[type];
  const digits = str.replace(/\s/g, '');
  if (digits === '') throw new Error('请输入要编码的十进制数字');
  if (!/^[0-9]+$/.test(digits)) throw new Error('包含非数字字符（仅支持 0-9，可用空格分隔）');
  const parts = digits.split('').map((ch) => table[Number(ch)]);
  return parts.join(' ');
}

// 解码: BCD 码串 -> 十进制数字串
// 输入为 0/1 二进制码, 可用空白分组; 每 4 位映射一个数字
export const BCDDecode = (str: string, type: BCDType): string => {
  const table = ENCODE_TABLES[type];
  const bits = str.replace(/\s/g, '');
  if (bits === '') throw new Error('请输入要解码的 BCD 码串');
  if (!/^[01]+$/.test(bits)) throw new Error('包含非二进制字符（仅支持 0/1，可用空格分组）');
  if (bits.length % 4 !== 0) throw new Error('二进制位长度须为 4 的倍数');
  const reverse = new Map<string, number>(table.map((bits4, i) => [bits4, i]));
  let out = '';
  for (let i = 0; i < bits.length; i += 4) {
    const seg = bits.slice(i, i + 4);
    const d = reverse.get(seg);
    if (d === undefined) throw new Error(`存在无效的${typeName(type)}序列 ${seg}`);
    out += String(d);
  }
  return out;
}
