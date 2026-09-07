// HKDF 可选散列算法 (RFC 5869)
export const hashAlgoList = [
  'SHA-1',
  'SHA-256',
  'SHA-384',
  'SHA-512',
];

// 输出长度字节范围 (上限 = 255 * 散列长度)
export const OUT_MIN = 1;
export const OUT_MAX = 8160;
