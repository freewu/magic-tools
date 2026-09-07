// Blowfish 分组 8 字节 (64 位); 标准密钥 4-56 字节 (变长), 本工具密钥档位同 AES 家族: 128/192/256 位 (16/24/32 字节)
export const BLOCK_BYTES = 8;
export const modeList = ['CBC', 'CFB', 'CTR', 'OFB', 'ECB'];
export const paddingList = ['Pkcs7', 'AnsiX923', 'Iso10126', 'Iso97971', 'ZeroPadding'];
export const codeList = ['HEX', 'Base64'];
export const capacityList = [128, 192, 256];
