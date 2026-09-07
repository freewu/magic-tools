import CryptoJS from 'crypto-js';
import { hexToBytes, bytesToHex, bytesToBase64, base64ToBytes } from '../../lib/codec';

// ---------- ChaCha20 (RFC 7539, IETF 变体: 256 位密钥 + 96 位 nonce + 32 位 counter) ----------

const ROTL = (x :number, n :number) :number => ((x << n) | (x >>> (32 - n))) >>> 0;

const load32le = (b :Uint8Array, o :number) :number =>
  (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;

const store32le = (w :number, b :Uint8Array, o :number) => {
  b[o] = w & 0xff; b[o + 1] = (w >>> 8) & 0xff; b[o + 2] = (w >>> 16) & 0xff; b[o + 3] = (w >>> 24) & 0xff;
};

const CONST0 = 0x61707865; // "expa"
const CONST1 = 0x3320646e; // "nd 3"
const CONST2 = 0x79622d32; // "2-by"
const CONST3 = 0x6b206574; // "te k"

const quarterRound = (s :number[], a :number, b :number, c :number, d :number) => {
  s[a] = (s[a] + s[b]) >>> 0; s[d] = ROTL(s[d] ^ s[a], 16);
  s[c] = (s[c] + s[d]) >>> 0; s[b] = ROTL(s[b] ^ s[c], 12);
  s[a] = (s[a] + s[b]) >>> 0; s[d] = ROTL(s[d] ^ s[a], 8);
  s[c] = (s[c] + s[d]) >>> 0; s[b] = ROTL(s[b] ^ s[c], 7);
};

/** 产生一个 64 字节密钥流块 (状态 = 常量 + 密钥 + counter + nonce) */
export const chacha20Block = (key :Uint8Array, nonce :Uint8Array, counter :number) :Uint8Array => {
  if (key.length !== 32) throw new Error('ChaCha20 密钥必须为 32 字节');
  if (nonce.length !== 12) throw new Error('ChaCha20 nonce 必须为 12 字节');
  const s :number[] = [
    CONST0, CONST1, CONST2, CONST3,
    load32le(key, 0), load32le(key, 4), load32le(key, 8), load32le(key, 12),
    load32le(key, 16), load32le(key, 20), load32le(key, 24), load32le(key, 28),
    counter >>> 0,
    load32le(nonce, 0), load32le(nonce, 4), load32le(nonce, 8),
  ];
  const w = s.slice();
  for (let i = 0; i < 10; i++) { // 10 个双轮 = 20 轮
    // 列轮
    quarterRound(w, 0, 4, 8, 12); quarterRound(w, 1, 5, 9, 13);
    quarterRound(w, 2, 6, 10, 14); quarterRound(w, 3, 7, 11, 15);
    // 对角轮
    quarterRound(w, 0, 5, 10, 15); quarterRound(w, 1, 6, 11, 12);
    quarterRound(w, 2, 7, 8, 13); quarterRound(w, 3, 4, 9, 14);
  }
  const out = new Uint8Array(64);
  for (let i = 0; i < 16; i++) store32le((w[i] + s[i]) >>> 0, out, i * 4);
  return out;
};

/** ChaCha20 流密码: data 与密钥流异或 (加密与解密相同操作) */
export const chacha20Crypt = (data :Uint8Array, key :Uint8Array, nonce :Uint8Array, counter :number) :Uint8Array => {
  const out = new Uint8Array(data.length);
  let c = counter >>> 0;
  for (let off = 0; off < data.length; off += 64) {
    const ks = chacha20Block(key, nonce, c);
    const n = Math.min(64, data.length - off);
    for (let i = 0; i < n; i++) out[off + i] = data[off + i] ^ ks[i];
    c = (c + 1) >>> 0;
  }
  return out;
};

/** 口令 -> 32 字节密钥 (SHA-256 派生) */
export const deriveKey32 = (passphrase :string) :Uint8Array => {
  const text = passphrase.trim();
  if (text === '') throw new Error('密钥口令不能为空');
  return hexToBytes(CryptoJS.SHA256(text).toString(CryptoJS.enc.Hex));
};

// 口令文本 -> 密钥字节: 若文本恰好 32 字节 (UTF-8) 则直接使用, 否则 SHA-256 派生
export const passphraseToKey = (passphrase :string) :Uint8Array => {
  const bytes = new TextEncoder().encode(passphrase);
  if (bytes.length === 32) return bytes;
  if (bytes.length === 0) throw new Error('密钥口令不能为空');
  return deriveKey32(passphrase);
};

/** nonce 文本 -> 12 字节: 24 位 HEX 或恰好 12 个字符 (UTF-8) */
export const parseNonce = (nonce :string) :Uint8Array => {
  const text = nonce.trim();
  if (/^[0-9a-fA-F]{24}$/.test(text)) return hexToBytes(text);
  const bytes = new TextEncoder().encode(text);
  if (bytes.length === 12) return bytes;
  throw new Error('nonce 需为 24 位 HEX 或 12 个字符 (UTF-8)');
};

export const nonceValid = (nonce :string) :boolean => {
  if (nonce.trim() === '') return false;
  try { parseNonce(nonce); return true; } catch { return false; }
};

/** counter 文本校验: 0 ~ 2^32-1 */
export const counterValid = (counter :string) :boolean => {
  if (counter.trim() === '') return false;
  const n = Number(counter.trim());
  return Number.isInteger(n) && n >= 0 && n <= 0xffffffff;
};

// ---------- 高层封装 (UI 用) ----------

export interface ChaCha20Options {
  code: 'HEX' | 'Base64';
}

// 加密: 明文文本 -> 密文 (HEX/Base64)
export const chacha20EncryptText = (plainText :string, passphrase :string, nonceText :string, counter :number, opts :ChaCha20Options) :string => {
  const key = passphraseToKey(passphrase);
  const nonce = parseNonce(nonceText);
  const out = chacha20Crypt(new TextEncoder().encode(plainText), key, nonce, counter >>> 0);
  return opts.code === 'HEX' ? bytesToHex(out) : bytesToBase64(out);
};

// 解密: 密文 (HEX/Base64) -> 明文文本
export const chacha20DecryptText = (cipherText :string, passphrase :string, nonceText :string, counter :number, opts :ChaCha20Options) :string => {
  const key = passphraseToKey(passphrase);
  const nonce = parseNonce(nonceText);
  const bytes = opts.code === 'HEX' ? hexToBytes(cipherText) : base64ToBytes(cipherText);
  const out = chacha20Crypt(bytes, key, nonce, counter >>> 0);
  return new TextDecoder().decode(out);
};

// ---------- 默认值持久化 (仿 RC5 风格, 存于本地) ----------
const DEFAULT_CODE_ITEM = 'chacha20-code';
const DEFAULT_PASSPHRASE_ITEM = 'chacha20-passphrase';
const DEFAULT_NONCE_ITEM = 'chacha20-nonce';
const DEFAULT_COUNTER_ITEM = 'chacha20-counter';

export const getDefaultCode = () :'HEX' | 'Base64' => (localStorage.getItem(DEFAULT_CODE_ITEM) as 'HEX' | 'Base64') ?? 'Base64';
export const setDefaultCode = (v :string) => localStorage.setItem(DEFAULT_CODE_ITEM, v);
export const getDefaultPassphrase = () :string => localStorage.getItem(DEFAULT_PASSPHRASE_ITEM) ?? '';
export const setDefaultPassphrase = (v :string) => localStorage.setItem(DEFAULT_PASSPHRASE_ITEM, v);
export const getDefaultNonce = () :string => localStorage.getItem(DEFAULT_NONCE_ITEM) ?? '000000000000000000000000';
export const setDefaultNonce = (v :string) => localStorage.setItem(DEFAULT_NONCE_ITEM, v);
export const getDefaultCounter = () :number => Number(localStorage.getItem(DEFAULT_COUNTER_ITEM) ?? '0');
export const setDefaultCounter = (v :number) => localStorage.setItem(DEFAULT_COUNTER_ITEM, String(v));
