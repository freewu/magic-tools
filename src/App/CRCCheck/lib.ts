// CRC 校验 (Cyclic Redundancy Check) — 参考 ip33.com/crc.html 的参数化模型
// 基于 CRCParam (poly/init/refin/refout/xorout) 的通用逐位引擎, 使用 BigInt 支持 3~64 位宽
// 解析/格式化等通用能力统一来自 src/lib/byte.ts

import { parseInput } from '../../lib/byte';
import { CRC_ALGOS, findAlgo } from './data';
import type { CRCParam } from './data';

export { CRC_ALGOS, findAlgo };
export type { CRCParam };

// 位反转 (宽度内)
const reflectBig = (x :bigint, width :number) :bigint => {
  let r = 0n;
  let v = x;
  for (let i = 0; i < width; i++) {
    r = (r << 1n) | (v & 1n);
    v >>= 1n;
  }
  return r;
}

// 由 poly(不含隐含最高位) 推导多项式公式, 如 poly=0x07 w=8 -> "x8 + x2 + x + 1"
export const polyFormula = (p :CRCParam) :string => {
  const terms :string[] = [ 'x' + p.width ];
  const poly = BigInt('0x' + p.poly);
  for (let k = p.width - 1; k >= 1; k--) {
    if ((poly & (1n << BigInt(k))) !== 0n) terms.push(k === 1 ? 'x' : 'x' + k);
  }
  if ((poly & 1n) !== 0n) terms.push('1');
  return terms.join(' + ');
}

// 通用 CRC 引擎 (逐位法, 支持位宽 3~64; 与移位法在 >=8 位宽下结果一致)
export const computeCrc = (bytes :number[], p :CRCParam) :bigint => {
  const w = BigInt(p.width);
  const mask = (1n << w) - 1n;
  const poly = BigInt('0x' + p.poly);
  const xorout = BigInt('0x' + p.xorout);
  const init = BigInt('0x' + p.init);
  // reflected 模式使用位反转后的多项式 (查表法语义, 目录参数 refin/refout 恒成对出现)
  const polyUsed = p.refin ? reflectBig(poly, p.width) : poly;
  let crc = init;
  for (const b of bytes) {
    if (p.refin) {
      // LSB 优先: 逐位右移
      for (let i = 0; i < 8; i++) {
        const bit = (b >> i) & 1;
        const t = crc & 1n;
        crc >>= 1n;
        if ((t ^ BigInt(bit)) !== 0n) crc ^= polyUsed;
      }
    } else {
      // MSB 优先: 逐位左移
      for (let i = 7; i >= 0; i--) {
        const bit = (b >> i) & 1;
        const t = (crc >> (w - 1n)) & 1n;
        crc = (crc << 1n) & mask;
        if ((t ^ BigInt(bit)) !== 0n) crc ^= poly;
      }
    }
  }
  crc ^= xorout;
  return crc & mask;
}

export interface CRCResult {
  hex: string;
  dec: string;
  oct: string;
  bin: string;
  width: number;
}

// 校验值 -> 四种进制字符串 (位宽对齐)
export const formatCrc = (v :bigint, width :number) :CRCResult => {
  return {
    hex: v.toString(16).toUpperCase().padStart(Math.ceil(width / 4), '0'),
    dec: v.toString(10),
    oct: v.toString(8).padStart(Math.ceil(width / 3), '0'),
    bin: v.toString(2).padStart(width, '0'),
    width,
  };
}

// 便捷: 按算法名 + 输入文本 (HEX/ASCII) 一步计算
export const crcOf = (input :string, mode :'hex' | 'ascii', algoName :string) :CRCResult => {
  const p = findAlgo(algoName);
  const bytes = parseInput(input, mode);
  return formatCrc(computeCrc(bytes, p), p.width);
}

// 便捷: ASCII 文本直接计算 (供测试等使用)
export const crcOfAscii = (text :string, algoName :string) :CRCResult => {
  return crcOf(text, 'ascii', algoName);
}

// 参数摘要文案 (供 UI 展示): 多项式公式 + poly 十六进制 + 其余参数 + check
export const algoSummary = (p :CRCParam) :string => {
  const ref = p.refin ? '是' : '否';
  return `${polyFormula(p)} (poly 0x${p.poly.toUpperCase()}) · init 0x${p.init.toUpperCase()} · refin/refout ${ref} · xorout 0x${p.xorout.toUpperCase()} · check(123456789) = 0x${p.check}`;
}

// ---- 默认输入格式 / 默认校验算法 (localStorage, 供设置页/页面初始化使用) ----
const DEFAULT_MODE_KEY = 'crc-check:default-input-mode';
const DEFAULT_ALGO_KEY = 'crc-check:default-algo';

// 默认输入格式: 未设置时默认 ASCII
export const getDefaultInputMode = () :'hex' | 'ascii' => {
  return localStorage.getItem(DEFAULT_MODE_KEY) === 'hex' ? 'hex' : 'ascii';
}

export const setDefaultInputMode = (mode :'hex' | 'ascii') :void => {
  localStorage.setItem(DEFAULT_MODE_KEY, mode);
}

// 默认校验算法: 未设置时默认 CRC-16/MODBUS
export const getDefaultAlgo = () :string => {
  const v = localStorage.getItem(DEFAULT_ALGO_KEY);
  return CRC_ALGOS.some((a) => a.name === v) ? (v as string) : 'CRC-16/MODBUS';
}

export const setDefaultAlgo = (name :string) :void => {
  localStorage.setItem(DEFAULT_ALGO_KEY, CRC_ALGOS.some((a) => a.name === name) ? name : 'CRC-16/MODBUS');
}
