// CRC 校验 (Cyclic Redundancy Check) — 参考 ip33.com/crc.html 的参数化模型
// 基于 CRCParam (poly/init/refin/refout/xorout) 的通用逐位引擎, 使用 BigInt 支持 64 位宽
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

// 通用 CRC 引擎 (按参数计算字节数组的校验值)
export const computeCrc = (bytes :number[], p :CRCParam) :bigint => {
  const w = BigInt(p.width);
  const mask = (1n << w) - 1n;
  const topBit = 1n << (w - 1n);
  const poly = BigInt('0x' + p.poly);
  const xorout = BigInt('0x' + p.xorout);
  const init = BigInt('0x' + p.init);
  // reflected 模式使用位反转后的多项式; init 不预反转、结果不二次反转 (查表法语义, 目录参数 refin/refout 恒成对出现)
  const polyUsed = p.refin ? reflectBig(poly, p.width) : poly;
  let crc = init;
  for (const b of bytes) {
    if (p.refin) {
      crc ^= BigInt(b);
      for (let i = 0; i < 8; i++) {
        crc = (crc & 1n) !== 0n ? ((crc >> 1n) ^ polyUsed) : (crc >> 1n);
      }
    } else {
      crc ^= BigInt(b) << (w - 8n);
      for (let i = 0; i < 8; i++) {
        crc = (crc & topBit) !== 0n ? ((crc << 1n) ^ polyUsed) : (crc << 1n);
      }
    }
  }
  // 目录参数 refin/refout 恒成对; 反转已通过 polyUsed 体现, 结果无需二次反转
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

// 参数摘要文案 (供 UI 展示)
export const algoSummary = (p :CRCParam) :string => {
  return `宽度 ${p.width} bit · poly 0x${p.poly.toUpperCase()} · init 0x${p.init.toUpperCase()} · refin/refout ${p.refin ? '是' : '否'} · xorout 0x${p.xorout.toUpperCase()} · check(123456789) = 0x${p.check}`;
}
