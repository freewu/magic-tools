// RC5 分组大小 / 轮数 (RC5-32/12/16)
export const BLOCK_BYTES = 8;
export const ROUNDS = 12;

// 加密模式列表 (ECB 不需要 IV)
export const modeList = [
  "CBC",
  "CFB",
  "CTR",
  "OFB",
  "ECB", // 不需要 IV
];

// 填充模式列表 (仅 ECB/CBC 生效; CFB/OFB/CTR 为流式无需填充)
export const paddingList = [
  "Pkcs7",
  "AnsiX923",
  "Iso10126",
  "Iso97971",
  "ZeroPadding",
];

// 输出/输入数据编码列表
export const codeList = [
  "HEX",
  "Base64",
];

// 密钥位数 (RC5 官方支持 0-2040 位, 此处提供常用三档; 密钥字节数 = 位数 / 8)
export const capacityList = [
  128,
  192,
  256,
];
