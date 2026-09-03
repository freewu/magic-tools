// 字节工具 (供 BCC/LRC 等校验类工具共享)
// 十六进制解析 / UTF-8 编码 / 单字节各进制格式化 / 期望值解析

const SEP_RE = /[\s,;:|_-]+/;

// 解析十六进制文本 -> 字节数组
// 支持分隔: 空格 / 逗号 / 分号 / 冒号 / 竖线 / 下划线 / 短横线 / 换行
// 每段可带 0x 前缀 (如 0x01 0x02), 单个字节 1-2 位十六进制 (如 1 F 表示 0x01 0x0F)
export const parseHexBytes = (input :string) :number[] => {
  const text = input.trim();
  if (text === '') return [];
  const bytes :number[] = [];
  const tokens = text.split(SEP_RE);
  for (const raw of tokens) {
    const token = raw.trim().replace(/^0x/i, '');
    if (token === '') throw new Error(`非法输入: "${raw}"`);
    if (!/^[0-9a-f]{1,2}$/i.test(token)) throw new Error(`非法字节: "${raw}" (需 1-2 位十六进制)`);
    bytes.push(parseInt(token, 16));
  }
  return bytes;
}

// ASCII/文本 -> UTF-8 字节数组 (纯实现, 不依赖 TextEncoder)
export const strToUtf8Bytes = (text :string) :number[] => {
  const bytes :number[] = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0) as number;
    if (cp < 0x80) {
      bytes.push(cp);
    } else if (cp < 0x800) {
      bytes.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
    } else if (cp < 0x10000) {
      bytes.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    } else {
      bytes.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f),
      );
    }
  }
  return bytes;
}

// 按输入模式解析为字节数组: 'hex' 解析十六进制, 'ascii' 按 UTF-8 编码文本
export const parseInput = (input :string, mode :'hex' | 'ascii') :number[] => {
  return mode === 'hex' ? parseHexBytes(input) : strToUtf8Bytes(input);
}

// 单字节 -> 各进制字符串
export const byteToHex = (b :number) :string => b.toString(16).toUpperCase().padStart(2, '0');
export const byteToDec = (b :number) :string => String(b);
export const byteToOct = (b :number) :string => b.toString(8).padStart(3, '0');
export const byteToBin = (b :number) :string => b.toString(2).padStart(8, '0');

// 期望校验值解析: 仅允许 1-2 位十六进制 (可带 0x); 返回 -1 非法 / -2 空 / 否则字节值
export const parseExpectedByte = (input :string) :number => {
  const token = input.trim().replace(/^0x/i, '');
  if (token === '') return -2; // 空
  if (!/^[0-9a-f]{1,2}$/i.test(token)) return -1;
  return parseInt(token, 16);
}
