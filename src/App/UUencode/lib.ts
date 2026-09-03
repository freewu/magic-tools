// UUencode 编解码 (IEEE Std 1003.1-2008)
// 编码: 每行最多 45 字节, 行首字符 = 空格(32) + 本行字节数; 每 3 字节 -> 4 字符 (6bit 一组, 每组 +32)
// 不足 3 字节时末尾补 0 值 (空格字符); 兼容经典文件头 'begin' / 结尾 'end' / '`' 空行标记
// 参考向量 (与 Python binascii.b2a_uu 一致):
//   'a' -> '!80  '   'ab' -> '"86( '   'cat' -> '#8V%T'   '123456789' -> '),3(S-#4V-S@Y'

const LINE = 45; // 每行最大编码字节数 (标准值)

// number[] -> UUencode 字符串 (多行用 \n 连接, 无尾部换行)
export const uuEncodeBytes = (bytes :number[]) :string => {
  if (bytes.length === 0) return '';
  const lines :string[] = [];
  for (let i = 0; i < bytes.length; i += LINE) {
    const n = Math.min(LINE, bytes.length - i);
    let line = String.fromCharCode(32 + n); // 行长度前缀字符
    for (let j = i; j < i + n; j += 3) {
      const b0 = bytes[j] ?? 0;
      const b1 = bytes[j + 1] ?? 0;
      const b2 = bytes[j + 2] ?? 0;
      const g = (b0 << 16) | (b1 << 8) | b2;
      line += String.fromCharCode(
        32 + ((g >> 18) & 63),
        32 + ((g >> 12) & 63),
        32 + ((g >> 6) & 63),
        32 + (g & 63),
      );
    }
    lines.push(line);
  }
  return lines.join('\n');
};

// UUencode 字符串 -> number[]; 非法字符/结构抛 Error
export const uuDecodeToBytes = (text :string) :number[] => {
  const out :number[] = [];
  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    if (rawLine.length === 0) continue;
    const line = rawLine;
    const first = line.charCodeAt(0);
    // 跳过 begin/end 等头尾行 (首字符不在 32..95 范围) 与 '`' 结束标记
    if (first < 32 || first > 95) continue;
    if (first === 32 && line.length === 1) continue; // 空结束行(单空格)
    const count = first - 32; // 本行编码的字节数
    const seg = line.slice(1);
    const chars :number[] = [];
    for (let i = 0; i < seg.length; i++) {
      const c = seg.charCodeAt(i);
      if (c < 32 || c > 96) {
        throw new Error(`UUencode 数据含有非法字符: ${JSON.stringify(seg[i])}`);
      }
      chars.push(c === 96 ? 0 : c - 32); // '`'(96) 视作补位 0, 其余值 = 字符码 - 32
    }
    let produced = 0;
    for (let i = 0; i + 3 < chars.length && produced < count; i += 4) {
      const v0 = chars[i];
      const v1 = chars[i + 1];
      const v2 = chars[i + 2];
      const v3 = chars[i + 3];
      const b1 = ((v0 << 2) | (v1 >> 4)) & 0xff;
      const b2 = ((v1 << 4) | (v2 >> 2)) & 0xff;
      const b3 = ((v2 << 6) | v3) & 0xff;
      if (produced < count) { out.push(b1); produced++; }
      if (produced < count) { out.push(b2); produced++; }
      if (produced < count) { out.push(b3); produced++; }
    }
  }
  return out;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// 文本(UTF-8) -> UUencode
export const uuEncodeText = (text :string) :string => {
  return uuEncodeBytes(Array.from(encoder.encode(text)));
};

// UUencode -> 文本(UTF-8); 二进制数据会以替换符显示
export const uuDecodeText = (text :string) :string => {
  return decoder.decode(Uint8Array.from(uuDecodeToBytes(text)));
};
