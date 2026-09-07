// CMAC (RFC 4493 / NIST SP 800-38B) — AES-CBC-MAC 变体
// 纯 TS, 借助 crypto-js 的 AES 单块 ECB 原语 (与 AESCrypto/gcm.ts 同法)
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

const xorBytes = (a :Uint8Array, b :Uint8Array) :Uint8Array => {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] ^ b[i];
  return out;
};

// 128 位左移 1 位 (大端: 进位自下一字节 bit7 流入当前字节 bit0, 首字节 bit7 溢出则末字节异或 0x87)
const shl128 = (bytes :Uint8Array) :Uint8Array => {
  const out = new Uint8Array(16);
  const overflow = (bytes[0] & 0x80) !== 0;
  for (let i = 0; i < 16; i++) {
    out[i] = (bytes[i] << 1) & 0xff;
    if (i < 15 && (bytes[i + 1] & 0x80) !== 0) out[i] |= 1;
  }
  if (overflow) out[15] ^= 0x87;
  return out;
};

// ---------- AES-ECB 单块加密 (NoPadding), 同密钥缓存 (与 AESCrypto/gcm.ts 同法) ----------
const encCache = new Map<string, any>();

const aesEncBlock = (keyHex :string, blockHex :string) :string => {
  let enc = encCache.get(keyHex);
  if (enc === undefined) {
    enc = CryptoJS.algo.AES.createEncryptor(CryptoJS.enc.Hex.parse(keyHex), {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.NoPadding,
    });
    encCache.set(keyHex, enc);
  }
  return CryptoJS.enc.Hex.stringify(enc.process(CryptoJS.enc.Hex.parse(blockHex)));
};

const KEY_LENS :Record<128 | 192 | 256, number> = { 128: 16, 192: 24, 256: 32 };

/**
 * AES-CMAC 计算
 * @param key   密钥字节 (16/24/32 字节)
 * @param msg   消息字节 (任意长度)
 * @returns     16 字节标签的 HEX 字符串
 */
export const cmac = (key :Uint8Array, msg :Uint8Array) :string => {
  if (key.length !== 16 && key.length !== 24 && key.length !== 32) {
    throw new Error('CMAC 密钥必须为 16/24/32 字节 (AES-128/192/256)');
  }
  const keyHex = bytesToHex(key);
  const zero = '00'.repeat(16);

  // 子密钥: K1 = E(K, 0);  K2 = K1<<1
  const k1 = shl128(hexToBytes(aesEncBlock(keyHex, zero)));
  const k2 = shl128(k1);

  // 分块
  const blocks :Uint8Array[] = [];
  for (let i = 0; i < msg.length; i += 16) blocks.push(msg.slice(i, Math.min(i + 16, msg.length)));
  const full = blocks.length > 0 && msg.length % 16 === 0;

  let last :Uint8Array;
  let prev = new Uint8Array(16); // CBC 链 Y0 = 0
  if (blocks.length === 0) {
    // 空消息: 单补丁块 10*1 padding, 异或 K2
    const pad = new Uint8Array(16); pad[0] = 0x80;
    last = xorBytes(pad, k2);
  } else if (full) {
    // 完整块: 前 n-1 块普通 CBC, 最后块异或 K1
    for (let i = 0; i < blocks.length - 1; i++) {
      prev = hexToBytes(aesEncBlock(keyHex, bytesToHex(xorBytes(blocks[i], prev))));
    }
    last = xorBytes(blocks[blocks.length - 1], k1);
  } else {
    // 非整块: 完整块全 CBC, 末块补丁 10*1 后异或 K2
    for (let i = 0; i < blocks.length - 1; i++) {
      prev = hexToBytes(aesEncBlock(keyHex, bytesToHex(xorBytes(blocks[i], prev))));
    }
    const rem = blocks[blocks.length - 1];
    const pad = new Uint8Array(16);
    pad.set(rem);
    pad[rem.length] = 0x80;
    last = xorBytes(pad, k2);
  }
  return aesEncBlock(keyHex, bytesToHex(xorBytes(last, prev)));
};

/** 字符串快捷入口 (UTF-8) */
export const cmacText = (keyText :string, msgText :string, bitLen :128 | 192 | 256) :string =>
  cmac(utf8Bytes(keyText), utf8Bytes(msgText));

// ---- 默认值记忆 (localStorage) ----
const BITS_KEY = 'cmac-calc:bits';

export const getDefaultBits = () :128 | 192 | 256 => {
  const v = Number(localStorage.getItem(BITS_KEY));
  return v === 192 || v === 256 ? (v as 128 | 192 | 256) : 128;
};
export const setDefaultBits = (bits :128 | 192 | 256) :void => { localStorage.setItem(BITS_KEY, String(bits)); };

export { KEY_LENS };
