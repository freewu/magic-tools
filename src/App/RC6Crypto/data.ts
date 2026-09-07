// RC6 分组 16 字节 (128 位, 4x32 位字), 官方参数 RC6-32/20/16 (20 轮, 见 Bouncy Castle RC6Engine)
// 密钥 1-255 字节 (本工具密钥档位同 AES 家族: 128/192/256 位即 16/24/32 字节)
export const BLOCK_BYTES = 16;
export const ROUNDS = 20;
export const modeList = ['CBC', 'CFB', 'CTR', 'OFB', 'ECB'];
export const paddingList = ['Pkcs7', 'AnsiX923', 'Iso10126', 'Iso97971', 'ZeroPadding'];
export const codeList = ['HEX', 'Base64'];
export const capacityList = [128, 192, 256];
