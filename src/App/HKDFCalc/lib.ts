// HKDF (RFC 5869) HMAC-based Extract-and-Expand 密钥派生
// HKDF-Extract(salt, IKM) -> PRK;  HKDF-Expand(PRK, info, L) -> OKM
import * as CryptoJS from 'crypto-js';

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

const bytesToWA = (b :Uint8Array) :CryptoJS.lib.WordArray =>
  CryptoJS.enc.Hex.parse(bytesToHex(b));

const waToBytes = (w :CryptoJS.lib.WordArray) :Uint8Array =>
  hexToBytes(CryptoJS.enc.Hex.stringify(w));

// 各算法的散列长度与 HMAC 函数
const ALGO_TABLE :Record<string, { hashLen :number; hmac :(msg :CryptoJS.lib.WordArray, key :CryptoJS.lib.WordArray) => CryptoJS.lib.WordArray }> = {
  'SHA-1':   { hashLen: 20, hmac: CryptoJS.HmacSHA1 },
  'SHA-256': { hashLen: 32, hmac: CryptoJS.HmacSHA256 },
  'SHA-384': { hashLen: 48, hmac: CryptoJS.HmacSHA384 },
  'SHA-512': { hashLen: 64, hmac: CryptoJS.HmacSHA512 },
};

export const isHashAlgo = (algo :string) :algo is keyof typeof ALGO_TABLE => algo in ALGO_TABLE;

export const getHashLen = (algo :string) :number => {
  if (!isHashAlgo(algo)) throw new Error(`不支持的散列算法: ${algo}`);
  return ALGO_TABLE[algo].hashLen;
};

// ---------- HKDF-Extract ----------
export const hkdfExtract = (algo :string, ikm :Uint8Array, salt :Uint8Array) :Uint8Array => {
  const { hashLen, hmac } = ALGO_TABLE[algo];
  // salt 为空时使用 hashLen 个 0x00
  const saltBytes = salt.length > 0 ? salt : new Uint8Array(hashLen);
  return waToBytes(hmac(bytesToWA(ikm), bytesToWA(saltBytes)));
};

// ---------- HKDF-Expand ----------
export const hkdfExpand = (algo :string, prk :Uint8Array, info :Uint8Array, outLen :number) :Uint8Array => {
  const { hashLen, hmac } = ALGO_TABLE[algo];
  if (outLen < 1) throw new Error('输出长度必须为正整数 (字节)');
  if (outLen > 255 * hashLen) {
    throw new Error(`输出长度不能超过 255 × ${hashLen} = ${255 * hashLen} 字节`);
  }
  const n = Math.ceil(outLen / hashLen);
  const out = new Uint8Array(outLen);
  const prkWA = bytesToWA(prk);
  const emptyWA = CryptoJS.lib.WordArray.create();
  const infoWA = bytesToWA(info);
  let t = emptyWA;
  let done = 0;
  for (let i = 1; i <= n; i++) {
    // T(i) = HMAC(PRK, T(i-1) || info || [单字节 i])
    const block = t.clone();
    block.concat(infoWA);
    block.concat(bytesToWA(Uint8Array.of(i)));
    t = hmac(block, prkWA);
    const tb = waToBytes(t);
    const take = Math.min(hashLen, outLen - done);
    out.set(tb.subarray(0, take), done);
    done += take;
  }
  return out;
};

// ---------- HKDF 完整 ----------
export const hkdf = (algo :string, ikm :Uint8Array, salt :Uint8Array, info :Uint8Array, outLen :number) :Uint8Array => {
  const prk = hkdfExtract(algo, ikm, salt);
  return hkdfExpand(algo, prk, info, outLen);
};

// ---- 默认值记忆 (localStorage) ----
const ALGO_KEY = 'hkdf-calc:algo';
const LEN_KEY = 'hkdf-calc:length';

export const getDefaultAlgo = () :string => localStorage.getItem(ALGO_KEY) ?? 'SHA-256';
export const setDefaultAlgo = (algo :string) :void => { localStorage.setItem(ALGO_KEY, algo); };

export const getDefaultLength = () :number => {
  const v = Number(localStorage.getItem(LEN_KEY));
  return Number.isInteger(v) && v >= 1 && v <= 8160 ? v : 32;
};
export const setDefaultLength = (len :number) :void => { localStorage.setItem(LEN_KEY, String(len)); };
