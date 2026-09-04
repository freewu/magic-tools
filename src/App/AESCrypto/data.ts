// 加密模式列表
// GCM: 认证加密 (密文+16 字节认证标签, IV 建议 12 字节, 无填充)
export const modeList = [
  "CBC",
  "GCM",
  "CFB",
  "CTR",
  "OFB",
  "ECB", // 不需要 IV
];

// 填充模式列表
export const paddingList = [
  "Pkcs7",
  "AnsiX923",
  "Iso10126",
  "Iso97971",
  "ZeroPadding",
  //"NoPadding",
];

// 输出/输入数据编码列表
export const codeList  = [
  "HEX",
  "Base64"
];

// 位数
export const capacityList = [
  128,
  192,
  256,
];