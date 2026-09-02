// 加密模式列表
export const modeList = [
  "CBC",
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
  // "NoPadding",
];

// 输出/输入数据编码列表
export const codeList  = [
  "HEX",
  "Base64"
];
