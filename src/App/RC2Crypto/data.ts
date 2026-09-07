// RC2 分组 8 字节 (64 位); RFC 2268 允许密钥 1-128 字节, 有效位数 T1 通常 = 密钥长度*8 (全强度)
// 本工具密钥档位同 AES 家族: 128/192/256 位 (16/24/32 字节), 有效位数默认取密钥全强度
export const BLOCK_BYTES = 8;
export const modeList = ['CBC', 'CFB', 'CTR', 'OFB', 'ECB'];
export const paddingList = ['Pkcs7', 'AnsiX923', 'Iso10126', 'Iso97971', 'ZeroPadding'];
export const codeList = ['HEX', 'Base64'];
export const capacityList = [128, 192, 256];
