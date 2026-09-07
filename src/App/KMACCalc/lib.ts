// KMAC128 / KMAC256 (NIST SP 800-185) — 基于 Keccak 海绵引擎
// KMAC(K, X, L, S) = cSHAKE(bytepad(encode_string(K), rate) || X || right_encode(L), L, "KMAC", S)
import { keccakBytes } from "../Hash/keccak";

const encoder = new TextEncoder();

export const utf8Bytes = (s :string) :Uint8Array => encoder.encode(s);

export const bytesToHex = (bytes :Uint8Array) :string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

export const hexToBytes = (hex :string) :Uint8Array => {
  const clean = hex.replace(/\s+/g, '');
  if (!/^[0-9a-fA-F]*$/u.test(clean) || clean.length % 2 !== 0) {
    throw new Error('无效的 HEX 输入');
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
};

const concatBytes = (...arrs :Array<Uint8Array>) :Uint8Array => {
  const total = arrs.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrs) { out.set(a, off); off += a.length; }
  return out;
};

// SP 800-185 整数编码: 大端字节 + 前缀/后缀字节数
export const leftEncode = (x :number) :Uint8Array => {
  if (!Number.isSafeInteger(x) || x < 0) throw new Error('left_encode 输入必须为非负整数');
  let n = 1;
  let t = x;
  while (t >= 256) { t = Math.floor(t / 256); n++; }
  if (n > 255) throw new Error('整数过大, 无法单字节编码长度');
  const out = new Uint8Array(1 + n);
  out[0] = n;
  for (let i = 0; i < n; i++) out[1 + i] = Math.floor(x / Math.pow(256, n - 1 - i)) % 256;
  return out;
};

export const rightEncode = (x :number) :Uint8Array => {
  const le = leftEncode(x);
  const out = new Uint8Array(le.length);
  for (let i = 0; i < le.length - 1; i++) out[i] = le[1 + i];
  out[le.length - 1] = le[0];
  return out;
};

// encode_string(S) = left_encode(len(S) * 8) || S  (SP 800-185: 长度按比特计)
const encodeString = (s :Uint8Array) :Uint8Array => concatBytes(leftEncode(s.length * 8), s);

// bytepad(X, w) = left_encode(w) || X || 0x00 补齐到 w 的倍数
const bytepad = (x :Uint8Array, w :number) :Uint8Array => {
  const out = concatBytes(leftEncode(w), x);
  const pad = (w - (out.length % w)) % w;
  if (pad === 0) return out;
  const padded = new Uint8Array(out.length + pad);
  padded.set(out);
  return padded;
};

export type KmacOptions = {
  capacity :128 | 256;  // KMAC128 / KMAC256
  key :Uint8Array;      // 密钥 (任意字节)
  data :Uint8Array;     // 消息
  outLen :number;       // 输出字节数
  custom :string;       // 自定义字符串 S (可为空)
  xof? :boolean;        // true 时输出可按任意长度截断 (right_encode(0))
};

/** KMAC 计算, 返回 outLen 字节输出 */
export const kmac = (opts :KmacOptions) :Uint8Array => {
  const { capacity, key, data, outLen, custom, xof } = opts;
  if (outLen < 1 || outLen > 8192) throw new Error('输出长度需在 1 - 8192 字节之间');
  const rate = capacity === 128 ? 168 : 136;
  const n = utf8Bytes('KMAC');                       // N 固定为 "KMAC"
  const s = utf8Bytes(custom);
  // cSHAKE 前缀: bytepad(encode_string(N) || encode_string(S), rate)
  const prefix = bytepad(concatBytes(encodeString(n), encodeString(s)), rate);
  // KMAC 消息: bytepad(encode_string(K), rate) || X || right_encode(L)  (L 为比特长度, XOF 时为 0)
  const keyBlock = bytepad(encodeString(key), rate);
  const trailer = rightEncode(xof ? 0 : outLen * 8);
  const message = concatBytes(keyBlock, data, trailer);
  return keccakBytes(concatBytes(prefix, message), rate, 0x04, outLen);
};

/** KMAC hex 快捷入口 */
export const kmacHex = (opts :Omit<KmacOptions, 'key' | 'data'> & { key :string | Uint8Array; data :string | Uint8Array }) :string => {
  const key = typeof opts.key === 'string' ? utf8Bytes(opts.key) : opts.key;
  const data = typeof opts.data === 'string' ? utf8Bytes(opts.data) : opts.data;
  return bytesToHex(kmac({ ...opts, key, data }));
};

// ---- 默认值记忆 (localStorage) ----
const ALGO_KEY = 'kmac-calc:algo';
const LEN_KEY = 'kmac-calc:length';
const XOF_KEY = 'kmac-calc:xof';

export const getDefaultAlgo = () :string => localStorage.getItem(ALGO_KEY) ?? 'KMAC128';
export const setDefaultAlgo = (algo :string) :void => { localStorage.setItem(ALGO_KEY, algo); };

export const getDefaultLength = () :number => {
  const v = Number(localStorage.getItem(LEN_KEY));
  return Number.isInteger(v) && v >= 1 && v <= 8192 ? v : 32;
};
export const setDefaultLength = (len :number) :void => { localStorage.setItem(LEN_KEY, String(len)); };

export const getDefaultXof = () :boolean => localStorage.getItem(XOF_KEY) === '1';
export const setDefaultXof = (on :boolean) :void => {
  if (on) localStorage.setItem(XOF_KEY, '1'); else localStorage.removeItem(XOF_KEY);
};
