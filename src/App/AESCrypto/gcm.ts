// AES-GCM 认证加密 (NIST SP 800-38D)
// - 底层 AES 块加密复用 crypto-js 的 ECB + NoPadding 一次性块处理, 密钥调度只需初始化一次
// - GHASH / GCTR / 标签计算为纯 TS (BigInt, GF(2^128) 多项式按 MSB 大端处理)
// - 输出约定: 密文 || 16 字节认证标签 (与 OpenSSL/node 常见互操作格式一致)
// - 支持任意长度 IV (96-bit 直接构造 J0, 其它长度走 GHASH 路径) 与任意长度明文
import * as CryptoJS from 'crypto-js';

const MASK128 = (1n << 128n) - 1n;
const TAG_BYTES = 16;

// ---------- 字节 <-> hex ----------
export const bytesToHex = (bytes :Uint8Array) :string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

export const hexToBytes = (hex :string) :Uint8Array => {
  const clean = hex.replace(/\s+/g, '');
  if (clean.length % 2 !== 0) throw new Error('HEX 长度必须为偶数');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    const code = parseInt(clean.substr(i * 2, 2), 16);
    if (Number.isNaN(code)) throw new Error('HEX 包含非法字符');
    out[i] = code;
  }
  return out;
};

export const bytesToBase64 = (bytes :Uint8Array) :string =>
  CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(bytesToHex(bytes)));

export const base64ToBytes = (b64 :string) :Uint8Array => {
  const s = b64.trim();
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s) || s.length % 4 === 1) {
    throw new Error('Base64 内容解析失败');
  }
  return hexToBytes(CryptoJS.enc.Hex.stringify(CryptoJS.enc.Base64.parse(s)));
};

// ---------- 128 位块运算 (大端: 字节0 为最高有效位) ----------
const blockToBig = (b :Uint8Array) :bigint => {
  let v = 0n;
  for (let i = 0; i < 16; i++) v = (v << 8n) | BigInt(b[i]);
  return v;
};

const bigToBlock = (v :bigint) :Uint8Array => {
  const out = new Uint8Array(16);
  for (let i = 15; i >= 0; i--) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
};

/** GF(2^128) 乘法 (GCM 规范标准算法: 自 y 高位向低位扫描, V 右移, 溢出时异或 R=0xE1||0^120) */
const R_GHASH = 0xe1n << 120n;
const gfMul = (x :bigint, y :bigint) :bigint => {
  let z = 0n;
  let v = x;
  for (let i = 0; i < 128; i++) {
    if ((y >> BigInt(127 - i)) & 1n) z ^= v;
    if (v & 1n) v = (v >> 1n) ^ R_GHASH;
    else v >>= 1n;
  }
  return z;
};

// ---------- AES-ECB 整块加密 (NoPadding, 输入须为 16 的整数倍) ----------
const ecbKeyCache = new Map<string, any>();

const aesEcbBlocks = (key :Uint8Array, data :Uint8Array) :Uint8Array => {
  if (key.length !== 16 && key.length !== 24 && key.length !== 32) {
    throw new Error('密钥字节长度必须为 16 / 24 / 32 (AES-128/192/256)');
  }
  if (data.length === 0 || data.length % 16 !== 0) {
    throw new Error('AES-ECB 输入长度必须为 16 的整数倍');
  }
  const keyHex = bytesToHex(key);
  let enc = ecbKeyCache.get(keyHex);
  if (enc === undefined) {
    const keyWA = CryptoJS.enc.Hex.parse(keyHex);
    enc = CryptoJS.algo.AES.createEncryptor(keyWA, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.NoPadding,
    });
    ecbKeyCache.set(keyHex, enc);
  }
  const out = enc.process(CryptoJS.enc.Hex.parse(bytesToHex(data)));
  return hexToBytes(CryptoJS.enc.Hex.stringify(out));
};

/** 单个 16 字节块的 AES 加密 (用于 H 与 J0 的 E(K, block)) */
const aesEcbBlock = (key :Uint8Array, block :Uint8Array) :Uint8Array => aesEcbBlocks(key, block);

// ---------- GHASH ----------
const ghash = (key :Uint8Array, data :Uint8Array) :Uint8Array => {
  // H = E(K, 0^128)
  const h = blockToBig(aesEcbBlock(key, new Uint8Array(16)));
  let y = 0n;
  for (let off = 0; off < data.length; off += 16) {
    const x = blockToBig(data.subarray(off, off + 16));
    y = gfMul(y ^ x, h);
  }
  return bigToBlock(y);
};

/** 数据补齐到 16 字节整数倍 (尾部补零, 不改变长度时返回原字节) */
const padTo16 = (bytes :Uint8Array) :Uint8Array => {
  const r = bytes.length % 16;
  if (r === 0) return bytes;
  const out = new Uint8Array(bytes.length + 16 - r);
  out.set(bytes);
  return out;
};

// ---------- GCTR (32 位计数器自增) ----------
const inc32 = (c :bigint) :bigint => {
  const low = (c & 0xffffffffn) + 1n;
  return (c & ~0xffffffffn) | (low & 0xffffffffn);
};

const gctr = (key :Uint8Array, icb :Uint8Array, data :Uint8Array) :Uint8Array => {
  if (data.length === 0) return new Uint8Array(0);
  const n = Math.ceil(data.length / 16);
  // 一次性生成全部计数器块
  const counters = new Uint8Array(n * 16);
  let c = blockToBig(icb);
  for (let i = 0; i < n; i++) {
    counters.set(bigToBlock(c), i * 16);
    c = inc32(c);
  }
  const ks = aesEcbBlocks(key, counters);
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) out[i] = data[i] ^ ks[i];
  return out;
};

/** 由 IV 构造 J0 (96-bit 直接拼接, 其它长度走 GHASH) */
const buildJ0 = (key :Uint8Array, iv :Uint8Array) :Uint8Array => {
  if (iv.length === 12) {
    const j0 = new Uint8Array(16);
    j0.set(iv, 0);
    j0[15] = 0x01;
    return j0;
  }
  if (iv.length === 0) throw new Error('GCM IV 不能为空');
  // J0 = GHASH(IV || pad || [0]_64 || [len(IV)*8]_64)
  const pad = padTo16(iv);
  const data = new Uint8Array(pad.length + 16);
  data.set(pad, 0);
  data.set(buildLenBlock(iv.length * 8), pad.length + 8); // 前 8 字节为 AAD 长度 0
  return ghash(key, data);
};

const buildLenBlock = (bitLen :number) :Uint8Array => {
  const out = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    out[i] = bitLen & 0xff;
    bitLen = Math.floor(bitLen / 256);
  }
  return out;
};

/** 认证标签: GHASH(ct 补齐 || [0]_64 || [len(ct)*8]_64) ^ E(K, J0) 的前 16 字节 */
const computeTag = (key :Uint8Array, j0 :Uint8Array, ct :Uint8Array) :Uint8Array => {
  const ctPad = padTo16(ct);
  const lenBlock = buildLenBlock(ct.length * 8);
  const data = new Uint8Array(ctPad.length + 16);
  data.set(ctPad, 0);
  data.set(new Uint8Array(8), ctPad.length); // AAD 长度为 0
  data.set(lenBlock, ctPad.length + 8);
  const s = ghash(key, data);
  const e = aesEcbBlock(key, j0);
  const tag = new Uint8Array(TAG_BYTES);
  for (let i = 0; i < TAG_BYTES; i++) tag[i] = s[i] ^ e[i];
  return tag;
};

/**
 * AES-GCM 加密
 * @returns 密文 || 16 字节认证标签
 */
export const aesGcmEncrypt = (key :Uint8Array, iv :Uint8Array, plain :Uint8Array) :Uint8Array => {
  const j0 = buildJ0(key, iv);
  const icb = bigToBlock(inc32(blockToBig(j0)));
  const ct = gctr(key, icb, plain);
  const tag = computeTag(key, j0, ct);
  const out = new Uint8Array(ct.length + TAG_BYTES);
  out.set(ct, 0);
  out.set(tag, ct.length);
  return out;
};

/**
 * AES-GCM 解密 (data = 密文 || 16 字节认证标签)
 * @throws 认证失败时抛出异常
 * @returns 明文
 */
export const aesGcmDecrypt = (key :Uint8Array, iv :Uint8Array, data :Uint8Array) :Uint8Array => {
  if (data.length < TAG_BYTES) throw new Error('GCM 密文长度过短 (缺少认证标签)');
  const j0 = buildJ0(key, iv);
  const ctLen = data.length - TAG_BYTES;
  const ct = data.subarray(0, ctLen);
  const tagIn = data.subarray(ctLen);
  const tagCalc = computeTag(key, j0, ct);
  let diff = 0;
  for (let i = 0; i < TAG_BYTES; i++) diff |= tagCalc[i] ^ tagIn[i];
  if (diff !== 0) throw new Error('GCM 认证失败: 密文可能被篡改或密钥 / IV 不正确');
  const icb = bigToBlock(inc32(blockToBig(j0)));
  return gctr(key, icb, ct);
};
