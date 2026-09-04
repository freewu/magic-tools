// Keccak Hash 值计算 - 数据结构

// 计算结果结构定义
type KeccakHashResult = {
  "keccak_224": string,
  "keccak_256": string,
  "keccak_384": string,
  "keccak_512": string,
}

// 默认的空结果
const emptyResult :KeccakHashResult = {
  "keccak_224": "",
  "keccak_256": "",
  "keccak_384": "",
  "keccak_512": "",
};

// 行定义
const FIXED_ITEMS :Array<{ key :keyof KeccakHashResult; label :string }> = [
  { key: "keccak_224", label: "Keccak-224" },
  { key: "keccak_256", label: "Keccak-256" },
  { key: "keccak_384", label: "Keccak-384" },
  { key: "keccak_512", label: "Keccak-512" },
];

export {
  emptyResult,
  KeccakHashResult,
  FIXED_ITEMS,
}
