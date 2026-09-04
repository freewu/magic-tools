// SHA3 Hash 值计算 - 数据结构

// 计算结果结构定义
type Sha3HashResult = {
  "sha3_224": string,
  "sha3_256": string,
  "sha3_384": string,
  "sha3_512": string,
  "shake128": string,
  "shake256": string,
}

// 默认的空结果
const emptyResult :Sha3HashResult = {
  "sha3_224": "",
  "sha3_256": "",
  "sha3_384": "",
  "sha3_512": "",
  "shake128": "",
  "shake256": "",
};

// 固定长度摘要的行定义 (SHAKE 输出行需动态拼接长度)
const FIXED_ITEMS :Array<{ key :keyof Sha3HashResult; label :string }> = [
  { key: "sha3_224", label: "SHA3-224" },
  { key: "sha3_256", label: "SHA3-256" },
  { key: "sha3_384", label: "SHA3-384" },
  { key: "sha3_512", label: "SHA3-512" },
];

export {
  emptyResult,
  Sha3HashResult,
  FIXED_ITEMS,
}
