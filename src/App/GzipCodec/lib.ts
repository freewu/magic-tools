// Gzip 编解码: 压缩(文本 -> gzip 字节) / 解压(字节 -> 文本), 字节可用 Base64 / Hex 两种格式展示
/// <reference path="../../types/vendor-shims.d.ts" />

export type GzipFormat = 'base64' | 'hex';

export const GZIP_FORMAT_KEY = 'gzip:format';
export const GZIP_FORMAT_CHANGED = 'gzip:format-changed';
export const GZIP_FORMATS: readonly GzipFormat[] = [ 'base64', 'hex' ] as const;
export const GZIP_FORMAT_OPTIONS: readonly { value: GzipFormat; label: string }[] = [
  { value: 'base64', label: 'Base64' },
  { value: 'hex', label: 'Hex' },
] as const;

/** 读取设置页配置的默认展示格式 (base64 / hex), 非法值回退 base64 */
export const getFormat = (): GzipFormat => {
  const v = localStorage.getItem(GZIP_FORMAT_KEY);
  return v === 'hex' ? 'hex' : 'base64';
};

/** 保存展示格式并向已打开的工具页广播 */
export const setFormat = (f: GzipFormat): void => {
  localStorage.setItem(GZIP_FORMAT_KEY, f);
  window.dispatchEvent(new Event(GZIP_FORMAT_CHANGED));
};

// ---------- 字节 <-> 文本 ----------

/** bytes -> 小写 hex */
export const bytesToHex = (bytes: Uint8Array): string => {
  let s = '';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return s;
};

/** hex -> bytes; 容忍空白与大小写; 非法字符 / 奇数长度抛错 */
export const hexToBytes = (hex: string): Uint8Array => {
  const clean = hex.replace(/\s+/g, '');
  if (clean.length % 2 !== 0) throw new Error('Hex 串长度必须为偶数');
  if (!/^[0-9a-fA-F]*$/.test(clean)) throw new Error('Hex 串包含非法字符');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    out[i / 2] = parseInt(clean.substr(i, 2), 16);
  }
  return out;
};

const B64_ALPH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** bytes -> base64 (自实现, 无 btoa 跨环境差异) */
export const bytesToBase64 = (bytes: Uint8Array): string => {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64_ALPH[b0 >> 2];
    out += B64_ALPH[((b0 & 0x03) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? B64_ALPH[((b1 & 0x0f) << 2) | (b2 >> 6)] : '=';
    out += i + 2 < bytes.length ? B64_ALPH[b2 & 0x3f] : '=';
  }
  return out;
};

/** base64 -> bytes; 兼容 URL 安全字符(-_)与缺失补位; 非法字符抛错 */
export const base64ToBytes = (b64: string): Uint8Array => {
  const s = b64.trim().replace(/-/g, '+').replace(/_/g, '/');
  const out: number[] = [];
  let acc = 0, bits = 0;
  for (const ch of s) {
    if (ch === '=') break; // 补位及其后忽略
    const idx = B64_ALPH.indexOf(ch);
    if (idx < 0) throw new Error('Base64 串解析失败');
    acc = (acc << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((acc >> bits) & 0xff);
    }
  }
  return Uint8Array.from(out);
};

// ---------- gzip 识别与解析 ----------

/** gzip 魔数: 1F 8B */
export const isGzip = (bytes: Uint8Array): boolean =>
  bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;

/**
 * 把用户输入的展示串解析为 gzip 字节:
 * 先按当前展示格式解析, 失败自动回退另一格式; 内容非 Gzip 数据抛错
 */
export const parseGzipBytes = (text: string, fmt: GzipFormat): Uint8Array => {
  const orders: GzipFormat[] = fmt === 'hex' ? [ 'hex', 'base64' ] : [ 'base64', 'hex' ];
  let lastErr = '内容不是有效的 Gzip 数据 (缺少 1F 8B 文件头)';
  for (const f of orders) {
    let bytes: Uint8Array;
    try {
      bytes = f === 'hex' ? hexToBytes(text) : base64ToBytes(text);
    } catch (e) {
      lastErr = String(e instanceof Error ? e.message : e);
      continue;
    }
    if (isGzip(bytes)) return bytes;
  }
  throw new Error(lastErr);
};

// ---------- 压缩 / 解压 (浏览器 CompressionStream, 无网络依赖) ----------

const streamCollect = async (stream: ReadableStream<Uint8Array>): Promise<Uint8Array> => {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
};

const ensureSupport = () => {
  if (typeof CompressionStream === 'undefined' || typeof DecompressionStream === 'undefined') {
    throw new Error('当前环境不支持 CompressionStream, 请使用较新版本的浏览器 / WebView2');
  }
};

/** gzip 压缩原始字节 */
export const gzipCompress = async (data: Uint8Array): Promise<Uint8Array> => {
  ensureSupport();
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(data);
  writer.close();
  return streamCollect(cs.readable);
};

/** gzip 解压为原始字节 (数据非 gzip 时抛错) */
export const gzipDecompress = async (data: Uint8Array): Promise<Uint8Array> => {
  ensureSupport();
  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  writer.write(data);
  writer.close();
  return streamCollect(ds.readable);
};

/** 文本(UTF-8) -> gzip 字节 */
export const compressText = async (text: string): Promise<Uint8Array> =>
  gzipCompress(new TextEncoder().encode(text));

/** gzip 字节 -> UTF-8 文本 (非文本内容将出现替换字符, 可容忍) */
export const decompressToText = async (bytes: Uint8Array): Promise<string> =>
  new TextDecoder('utf-8').decode(await gzipDecompress(bytes));

/** 按展示格式把 gzip 字节格式化为串 */
export const formatGzipBytes = (bytes: Uint8Array, fmt: GzipFormat): string =>
  fmt === 'hex' ? bytesToHex(bytes) : bytesToBase64(bytes);
