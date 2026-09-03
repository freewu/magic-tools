// XXencode 编解码
// 编码表: '+-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
// 每行最多 45 字节, 行首字符 = 编码表[本行字节数]; 每 3 字节 -> 4 字符 (6bit 一组), 不足 3 字节末尾补 0 值 ('+')
// 解码按行首字符计数, 多余补位自动丢弃
// 参考向量 (与 npm xxencode 一致):
//   'a' -> '-ME++'   'ab' -> '0MK6+'   'cat' -> '1Mq3o'
//   '123456789' -> '7AH6nB1IqBnUt'

const ALPHABET = '+-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const LINE = 45;

const indexOf = (c :string) :number => ALPHABET.indexOf(c);

// number[] -> XXencode 字符串 (多行用 \n 连接, 无尾部换行)
export const xxEncodeBytes = (bytes :number[]) :string => {
  if (bytes.length === 0) return '';
  const lines :string[] = [];
  for (let i = 0; i < bytes.length; i += LINE) {
    const n = Math.min(LINE, bytes.length - i);
    let line = ALPHABET[n]; // 行长度前缀字符
    for (let j = i; j < i + n; j += 3) {
      const b0 = bytes[j] ?? 0;
      const b1 = bytes[j + 1] ?? 0;
      const b2 = bytes[j + 2] ?? 0;
      line += ALPHABET[b0 >> 2];
      line += ALPHABET[((b0 << 4) | (b1 >> 4)) & 63];
      line += ALPHABET[((b1 << 2) | (b2 >> 6)) & 63];
      line += ALPHABET[b2 & 63];
    }
    lines.push(line);
  }
  return lines.join('\n');
};

// XXencode 字符串 -> number[]; 非法字符/结构抛 Error
export const xxDecodeToBytes = (text :string) :number[] => {
  const out :number[] = [];
  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length === 0) continue;
    // 经典 xxencode 文件可能带 begin/end 头尾行或 '`' 结束行, 跳过
    if (indexOf(line[0]) === -1) continue;
    if (line.startsWith('begin ') || line.startsWith('end') || line.startsWith('`')) continue;
    let chars :number[];
    let expect = Infinity; // 期望产出字节数
    if (line.length % 4 === 1) {
      // 带长度前缀: 前缀字符 + 4k 个数据字符
      expect = indexOf(line[0]);
      chars = Array.from(line.slice(1), (c) => {
        const v = indexOf(c);
        if (v === -1) throw new Error(`XXencode 数据含有非法字符: ${JSON.stringify(c)}`);
        return v;
      });
    } else if (line.length % 4 === 0) {
      // 无前缀纯数据
      chars = Array.from(line, (c) => {
        const v = indexOf(c);
        if (v === -1) throw new Error(`XXencode 数据含有非法字符: ${JSON.stringify(c)}`);
        return v;
      });
    } else {
      throw new Error(`XXencode 行长度不合法 (长度 ${line.length})`);
    }
    let produced = 0;
    for (let i = 0; i + 3 < chars.length && produced < expect; i += 4) {
      const v0 = chars[i];
      const v1 = chars[i + 1];
      const v2 = chars[i + 2];
      const v3 = chars[i + 3];
      const b1 = ((v0 << 2) | (v1 >> 4)) & 0xff;
      const b2 = ((v1 << 4) | (v2 >> 2)) & 0xff;
      const b3 = ((v2 << 6) | v3) & 0xff;
      if (produced < expect) { out.push(b1); produced++; }
      if (produced < expect) { out.push(b2); produced++; }
      if (produced < expect) { out.push(b3); produced++; }
    }
  }
  return out;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// 文本(UTF-8) -> XXencode
export const xxEncodeText = (text :string) :string => {
  return xxEncodeBytes(Array.from(encoder.encode(text)));
};

// XXencode -> 文本(UTF-8); 二进制数据会以替换符显示
export const xxDecodeText = (text :string) :string => {
  return decoder.decode(Uint8Array.from(xxDecodeToBytes(text)));
};
