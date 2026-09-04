// Keccak Hash 值计算 - 计算逻辑与本地配置
import { keccak224, keccak256, keccak384, keccak512 } from "../Hash/keccak";
import type { KeccakHashResult } from "./data";

// 结果大写展示配置
const UPPER_KEY = 'keccak-hash:result-upper';

/** 计算全部摘要 (输入按 UTF-8; 输出小写 hex) */
export const computeKeccakHash = (text :string) :KeccakHashResult => {
  return {
    "keccak_224": keccak224(text),
    "keccak_256": keccak256(text),
    "keccak_384": keccak384(text),
    "keccak_512": keccak512(text),
  };
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
