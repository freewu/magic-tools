import { BigNumber } from "../../lib/bignumber";

// 字节单位 (1024 进制, 从 B 到 YB)
export const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

// 单位对应的 1024 的幂次; 未知单位返回 null (按原值处理)
const unitPower = (type :string) :number | null => {
  const i = BYTE_UNITS.indexOf((type ?? '').toUpperCase());
  return i < 0 ? null : i;
}

// 数值 → 字节   (1, KB) => 1024  (2, MB) => 2 * 1024 * 1024
export const toByte = (num :BigNumber, type :string) :BigNumber => {
  const p = unitPower(type);
  if (p === null) return num;
  return num.times(new BigNumber(1024).pow(p));
}

// 字节 → 数值  (1024, KB) => 1
export const fromByte = (bytes :BigNumber, type :string) :BigNumber => {
  const p = unitPower(type);
  if (p === null) return bytes;
  return bytes.div(new BigNumber(1024).pow(p));
}

// 转成可读字节  1024 => 1.00 KB  2 * 1024 * 1024 => 2.00 MB
export const bytesToSize = (bytes :number) :string => {
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return new BigNumber(bytes).div(new BigNumber(1024).pow(i)).toFixed(2) + ' ' + BYTE_UNITS[i];
}

// ---------- 兼容旧接口 (返回 number) ----------
export const convertToByte = (num :number, type :string) :number => toByte(new BigNumber(num), type).toNumber();
export const convertFromByte = (num :number, type :string) :number => fromByte(new BigNumber(num), type).toNumber();

const DEFAULT_TYPE = 'byte-convert:default-type';

// 获取默认类型
export function getDefaultType() :string  {
    const type = localStorage.getItem(DEFAULT_TYPE);
    return (type === null)? "GB" : type;
}

// 设置默认类型
export function setDefaultType(type: string) : void  {
    localStorage.setItem(DEFAULT_TYPE,type);
}
