// RC2 分组密码 (RFC 2268) 纯 TS 实现
// 分组 8 字节 (64 位), 密钥 1-128 字节 (本工具限定常用档位 16/24/32 字节), 有效位数 T1
// 与 Bouncy Castle RC2Engine / OpenSSL (PITABLE 同表) 交叉验证一致; 官方向量见 lib.test.ts
import {
  bytesToHex,
  hexToBytes,
  bytesToBase64,
  base64ToBytes,
  encryptBytes,
  decryptBytes,
  type SymMode,
  type SymPadding,
  type BlockCodec,
} from '../../lib/symcipher';
import { BLOCK_BYTES } from './data';
import { PITABLE } from './tables';

export const KEY_MIN_BYTES = 1;
export const KEY_MAX_BYTES = 128;

// 密钥文本 -> 字节 (UTF-8; 字节数须等于 位数/8)
export const rc2KeyBytes = (keyText :string, capacity :number) :Uint8Array => {
  const bytes = new TextEncoder().encode(keyText);
  const need = capacity / 8;
  if (bytes.length !== need) throw new Error(`密钥需为 ${need} 个字符 (UTF-8 ${need} 字节), 当前 ${bytes.length} 字节`);
  return bytes;
};

export const rc2KeyValid = (keyText :string, capacity :number) :boolean => {
  if (keyText.trim() === '') return false;
  try { rc2KeyBytes(keyText, capacity); return true; } catch { return false; }
};

// 偏移量文本 -> 字节: 空 (仅 ECB 可空) / blockSize 个字符 (UTF-8) / 2*blockSize 位 HEX
export const parseRc2Iv = (iv :string) :Uint8Array => {
  const text = iv.trim();
  if (text === '') throw new Error('非 ECB 模式需要填写偏移量 (IV)');
  if (/^[0-9a-fA-F]{16}$/.test(text)) return hexToBytes(text);
  const bytes = new TextEncoder().encode(text);
  if (bytes.length === BLOCK_BYTES) return bytes;
  throw new Error(`偏移量需为 ${BLOCK_BYTES} 个字符或 16 位 HEX`);
};

export const rc2IvValid = (iv :string) :boolean => {
  if (iv.trim() === '') return true; // ECB 不需要
  try { parseRc2Iv(iv); return true; } catch { return false; }
};

// ---------- RC2 密钥扩展 (RFC 2268 Phase 1/2/3) ----------
const rotl16 = (x :number, y :number) :number => {
  x &= 0xffff;
  return ((x << y) | (x >>> (16 - y))) & 0xffff;
};

// key: 1-128 字节; effBits: 有效密钥位数 T1 (默认取全强度 key.length*8)
export const rc2Schedule = (key :Uint8Array, effBits :number) :number[] => {
  const xKey :number[] = new Array(128).fill(0);
  for (let i = 0; i < key.length; i++) xKey[i] = key[i] & 0xff;

  // Phase 1: 扩展至 128 字节
  let len = key.length;
  if (len < 128) {
    let index = 0;
    let x = xKey[len - 1];
    do {
      x = PITABLE[(x + xKey[index++]) & 255] & 0xff;
      xKey[len++] = x;
    } while (len < 128);
  }

  // Phase 2: 缩减有效位数 (无条件执行, 与 Bouncy Castle 一致)
  len = (effBits + 7) >> 3;
  let x = PITABLE[xKey[128 - len] & (255 >> (7 & -effBits))] & 0xff;
  xKey[128 - len] = x;
  for (let i = 128 - len - 1; i >= 0; i--) {
    x = PITABLE[x ^ xKey[i + len]] & 0xff;
    xKey[i] = x;
  }

  // Phase 3: 按小端 16 位字拷贝
  const newKey :number[] = new Array(64);
  for (let i = 0; i < 64; i++) {
    newKey[i] = xKey[2 * i] + (xKey[2 * i + 1] << 8);
  }
  return newKey;
};

// 依据密钥生成单块 (8 字节, 4 个 16 位字, 半字小端) 加解密 codec
export const makeRc2Codec = (key :Uint8Array, effBits = key.length * 8) :BlockCodec => {
  const K = rc2Schedule(key, effBits);

  const mix = (x10 :number, x32 :number, x54 :number, x76 :number, from :number, to :number) :[number, number, number, number] => {
    for (let i = from; i <= to; i += 4) {
      x10 = rotl16(x10 + (x32 & ~x76) + (x54 & x76) + K[i], 1);
      x32 = rotl16(x32 + (x54 & ~x10) + (x76 & x10) + K[i + 1], 2);
      x54 = rotl16(x54 + (x76 & ~x32) + (x10 & x32) + K[i + 2], 3);
      x76 = rotl16(x76 + (x10 & ~x54) + (x32 & x54) + K[i + 3], 5);
    }
    return [x10, x32, x54, x76];
  };
  const unmix = (x10 :number, x32 :number, x54 :number, x76 :number, from :number, to :number) :[number, number, number, number] => {
    for (let i = from; i >= to; i -= 4) {
      x76 = rotl16(x76, 11) - ((x10 & ~x54) + (x32 & x54) + K[i + 3]);
      x54 = rotl16(x54, 13) - ((x76 & ~x32) + (x10 & x32) + K[i + 2]);
      x32 = rotl16(x32, 14) - ((x54 & ~x10) + (x76 & x10) + K[i + 1]);
      x10 = rotl16(x10, 15) - ((x32 & ~x76) + (x54 & x76) + K[i]);
    }
    return [x10, x32, x54, x76];
  };

  return {
    encryptBlock(block :Uint8Array) {
      // 小端半字组块: x10 = 最低半字 (字节 0-1)
      let x10 = (block[1] << 8) | block[0];
      let x32 = (block[3] << 8) | block[2];
      let x54 = (block[5] << 8) | block[4];
      let x76 = (block[7] << 8) | block[6];
      let r :[number, number, number, number];
      r = mix(x10, x32, x54, x76, 0, 16);
      [x10, x32, x54, x76] = r;
      x10 = (x10 + K[x76 & 63]) & 0xffff;
      x32 = (x32 + K[x10 & 63]) & 0xffff;
      x54 = (x54 + K[x32 & 63]) & 0xffff;
      x76 = (x76 + K[x54 & 63]) & 0xffff;
      r = mix(x10, x32, x54, x76, 20, 40);
      [x10, x32, x54, x76] = r;
      x10 = (x10 + K[x76 & 63]) & 0xffff;
      x32 = (x32 + K[x10 & 63]) & 0xffff;
      x54 = (x54 + K[x32 & 63]) & 0xffff;
      x76 = (x76 + K[x54 & 63]) & 0xffff;
      r = mix(x10, x32, x54, x76, 44, 60);
      [x10, x32, x54, x76] = r;
      block[0] = x10 & 0xff; block[1] = x10 >> 8;
      block[2] = x32 & 0xff; block[3] = x32 >> 8;
      block[4] = x54 & 0xff; block[5] = x54 >> 8;
      block[6] = x76 & 0xff; block[7] = x76 >> 8;
    },
    decryptBlock(block :Uint8Array) {
      let x10 = (block[1] << 8) | block[0];
      let x32 = (block[3] << 8) | block[2];
      let x54 = (block[5] << 8) | block[4];
      let x76 = (block[7] << 8) | block[6];
      let r :[number, number, number, number];
      r = unmix(x10, x32, x54, x76, 60, 44);
      [x10, x32, x54, x76] = r;
      x76 = (x76 - K[x54 & 63]) & 0xffff;
      x54 = (x54 - K[x32 & 63]) & 0xffff;
      x32 = (x32 - K[x10 & 63]) & 0xffff;
      x10 = (x10 - K[x76 & 63]) & 0xffff;
      r = unmix(x10, x32, x54, x76, 40, 20);
      [x10, x32, x54, x76] = r;
      x76 = (x76 - K[x54 & 63]) & 0xffff;
      x54 = (x54 - K[x32 & 63]) & 0xffff;
      x32 = (x32 - K[x10 & 63]) & 0xffff;
      x10 = (x10 - K[x76 & 63]) & 0xffff;
      r = unmix(x10, x32, x54, x76, 16, 0);
      [x10, x32, x54, x76] = r;
      block[0] = x10 & 0xff; block[1] = x10 >> 8;
      block[2] = x32 & 0xff; block[3] = x32 >> 8;
      block[4] = x54 & 0xff; block[5] = x54 >> 8;
      block[6] = x76 & 0xff; block[7] = x76 >> 8;
    },
  };
};

// ---------- 顶层 API ----------
export type Rc2Opts = {
  mode :SymMode;
  padding :SymPadding;
  code :'HEX' | 'Base64';
  capacity :number;
  iv? :string;
};

export type Rc2Code = Rc2Opts['code'];

export const rc2Encrypt = (plainText :string, keyText :string, opts :Rc2Opts) :string => {
  const key = rc2KeyBytes(keyText, opts.capacity);
  const iv = opts.mode === 'ECB' ? new Uint8Array(BLOCK_BYTES) : parseRc2Iv(opts.iv ?? '');
  const codec = makeRc2Codec(key, key.length * 8); // 有效位数 = 密钥全强度
  const out = encryptBytes(new TextEncoder().encode(plainText), BLOCK_BYTES, codec, { mode: opts.mode, padding: opts.padding }, iv);
  return opts.code === 'HEX' ? bytesToHex(out) : bytesToBase64(out);
};

export const rc2Decrypt = (cipherText :string, keyText :string, opts :Rc2Opts) :string => {
  const key = rc2KeyBytes(keyText, opts.capacity);
  const iv = opts.mode === 'ECB' ? new Uint8Array(BLOCK_BYTES) : parseRc2Iv(opts.iv ?? '');
  const codec = makeRc2Codec(key, key.length * 8);
  const bytes = opts.code === 'HEX' ? hexToBytes(cipherText) : base64ToBytes(cipherText);
  const out = decryptBytes(bytes, BLOCK_BYTES, codec, { mode: opts.mode, padding: opts.padding }, iv);
  return new TextDecoder('utf-8').decode(out);
};

// ---------- 默认值持久化 (localStorage) ----------
const DEFAULT_MODE_ITEM = 'rc2-crypto:default-mode';
const DEFAULT_PADDING_ITEM = 'rc2-crypto:default-padding';
const DEFAULT_CODE_ITEM = 'rc2-crypto:default-code';
const DEFAULT_IV_ITEM = 'rc2-crypto:default-iv';
const DEFAULT_PASSPHRASE_ITEM = 'rc2-crypto:default-passphrase';

export const getDefaultMode = () :string => localStorage.getItem(DEFAULT_MODE_ITEM) ?? 'CBC';
export const setDefaultMode = (mode :string) :void => { localStorage.setItem(DEFAULT_MODE_ITEM, mode); };
export const getDefaultPadding = () :string => localStorage.getItem(DEFAULT_PADDING_ITEM) ?? 'Pkcs7';
export const setDefaultPadding = (padding :string) :void => { localStorage.setItem(DEFAULT_PADDING_ITEM, padding); };
export const getDefaultCode = () :string => localStorage.getItem(DEFAULT_CODE_ITEM) ?? 'Base64';
export const setDefaultCode = (code :string) :void => { localStorage.setItem(DEFAULT_CODE_ITEM, code); };
export const getDefaultIV = () :string => localStorage.getItem(DEFAULT_IV_ITEM) ?? '';
export const setDefaultIV = (iv :string) :void => { localStorage.setItem(DEFAULT_IV_ITEM, iv); };
export const getDefaultPassphrase = () :string => localStorage.getItem(DEFAULT_PASSPHRASE_ITEM) ?? '';
export const setDefaultPassphrase = (passphrase :string) :void => { localStorage.setItem(DEFAULT_PASSPHRASE_ITEM, passphrase); };

// 依据密钥字节数给出密钥长度提示 (位档 128/192/256)
export const genCapacity = (length :number) :number => {
  if (length >= 24) return 256;
  if (length >= 16) return 192;
  return 128;
};
