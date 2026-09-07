// KMAC 算法选项 (SP 800-185)
export const kmacAlgoList = [
  'KMAC128',
  'KMAC256',
];

// KMAC128 吸收速率 (cSHAKE128)
export const RATE_128 = 168;
// KMAC256 吸收速率 (cSHAKE256)
export const RATE_256 = 136;

// 输出长度字节范围
export const OUT_MIN = 1;
export const OUT_MAX = 8192;
