// BCC (Block Check Character) 校验: 对数据区逐字节做 XOR 异或累加, 常用于
// 串口/Modbus 等通信协议帧的简单校验 (起始值固定 0x00)

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

// 逐字节异或累加得到 BCC 值 (0-255)
export const bccXor = (bytes :number[]) :number => {
  let r = 0x00;
  for (const b of bytes) r ^= b;
  return r;
}

// 计算 BCC 并返回 2 位大写 HEX 字符串
export const bccHex = (bytes :number[]) :string => {
  return bccXor(bytes).toString(16).padStart(2, '0').toUpperCase();
}

// 期望值文本 -> 字节 (仅允许 1-2 位十六进制), 非法返回 -1
export const parseExpected = (input :string) :number => {
  const token = input.trim().replace(/^0x/i, '');
  if (token === '') return -2; // 空
  if (!/^[0-9a-f]{1,2}$/i.test(token)) return -1;
  return parseInt(token, 16);
}
