// SM4 加密模式列表 (国密 SM4 分组密码, 分组/密钥均为 128 位)
export const modeList = [
  "CBC",
  "ECB", // 不需要 IV
];

// 填充模式列表
export const paddingList = [
  "Pkcs7",
  "ZeroPadding",
];

// 输出/输入数据编码列表
export const codeList = [
  "HEX",
  "Base64",
];

// SM4 密钥长度固定为 128 位
export const KEY_BYTES = 16;
