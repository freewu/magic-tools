// SHA3 Hash 值计算 - 计算逻辑与本地配置
import { sha3_224, sha3_256, sha3_384, sha3_512, shake128, shake256 } from "../Hash/keccak";
import type { Sha3HashResult } from "./data";

// SHAKE 输出长度配置 (bit)
const SHAKE_BITS_KEY = 'sha3-hash:shake-bits';
const SHAKE_BITS_MIN = 8;
const SHAKE_BITS_MAX = 8192;
const SHAKE_BITS_DEFAULT = 256;

// 结果大写展示配置
const UPPER_KEY = 'sha3-hash:result-upper';

/** 计算全部摘要 (输入按 UTF-8; 输出小写 hex; SHAKE 按指定 bit 输出) */
export const computeSha3Hash = (text :string, shakeBits :number) :Sha3HashResult => {
  if (!Number.isInteger(shakeBits) || shakeBits <= 0 || shakeBits % 8 !== 0) {
    throw new Error('SHAKE 输出长度必须为 8 的正整数倍 (bit)');
  }
  return {
    "sha3_224": sha3_224(text),
    "sha3_256": sha3_256(text),
    "sha3_384": sha3_384(text),
    "sha3_512": sha3_512(text),
    "shake128": shake128(text, shakeBits),
    "shake256": shake256(text, shakeBits),
  };
};

// ---- SHAKE 默认输出长度 ----
export const getDefaultShakeBits = () :number => {
  const v = parseInt(localStorage.getItem(SHAKE_BITS_KEY) ?? '', 10);
  if (!Number.isInteger(v) || v < SHAKE_BITS_MIN || v > SHAKE_BITS_MAX || v % 8 !== 0) {
    return SHAKE_BITS_DEFAULT;
  }
  return v;
};

export const setDefaultShakeBits = (bits :number) :void => {
  if (!Number.isInteger(bits) || bits < SHAKE_BITS_MIN || bits > SHAKE_BITS_MAX || bits % 8 !== 0) {
    localStorage.removeItem(SHAKE_BITS_KEY);
    return;
  }
  localStorage.setItem(SHAKE_BITS_KEY, String(bits));
};

// ---- 结果大写展示默认值 ----
export const getDefaultUpper = () :boolean => {
  return localStorage.getItem(UPPER_KEY) === '1';
};

export const setDefaultUpper = (upper :boolean) :void => {
  if (upper) {
    localStorage.setItem(UPPER_KEY, '1');
  } else {
    localStorage.removeItem(UPPER_KEY);
  }
};
