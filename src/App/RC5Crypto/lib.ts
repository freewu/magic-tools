// RC5-32/12/16 分组密码 (Rivest 1994, RFC 2040) 纯 TS 实现
// 字宽 w=32 / 轮数 r=12 / 分组 8 字节 / 密钥 0-255 字节 (本工具限定常用档位 16/24/32 字节)
// 组字按小端 (与 RFC 2040 / 各参考实现一致); 模式/填充复用 src/lib/symcipher 共享层
// 引擎与参考实现 rc5@2.1.0 (npm) 交叉验证一致
import {
  rotl32,
  rotr32,
  bytesToWordsLE,
  wordsToBytesLE,
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
import { BLOCK_BYTES, ROUNDS } from './data';

export const KEY_MIN_BYTES = 1;
export const KEY_MAX_BYTES = 255;

// 密钥文本 -> 字节 (UTF-8; 字节数须等于 位数/8)
export const rc5KeyBytes = (keyText :string, capacity :number) :Uint8Array => {
  const bytes = new TextEncoder().encode(keyText);
  const need = capacity / 8;
  if (bytes.length !== need) throw new Error(`密钥需为 ${need} 个字符 (UTF-8 ${need} 字节), 当前 ${bytes.length} 字节`);
  return bytes;
};

export const rc5KeyValid = (keyText :string, capacity :number) :boolean => {
  if (keyText.trim() === '') return false;
  try { rc5KeyBytes(keyText, capacity); return true; } catch { return false; }
};

// 偏移量文本 -> 字节: 空 (仅 ECB 可空) / blockSize 个字符 (UTF-8) / 2*blockSize 位 HEX
export const parseRc5Iv = (iv :string) :Uint8Array => {
  const text = iv.trim();
  if (text === '') throw new Error('非 ECB 模式需要填写偏移量 (IV)');
  if (/^[0-9a-fA-F]{16}$/.test(text)) return hexToBytes(text);
  const bytes = new TextEncoder().encode(text);
  if (bytes.length === BLOCK_BYTES) return bytes;
  throw new Error(`偏移量需为 ${BLOCK_BYTES} 个字符或 16 位 HEX`);
};

export const rc5IvValid = (iv :string) :boolean => {
  if (iv.trim() === '') return true; // ECB 不需要
  try { parseRc5Iv(iv); return true; } catch { return false; }
};

// ---------- 密钥扩展 (RC5 key schedule) ----------
const P32 = 0xb7e15163;
const Q32 = 0x9e3779b9;

export const rc5Schedule = (key :Uint8Array) :number[] => {
  const u = 4; // bytes per word
  const c = Math.max(1, Math.ceil(key.length / u));
  const t = 2 * (ROUNDS + 1);
  const L :number[] = new Array(c).fill(0);
  for (let i = 0; i < key.length; i++) {
    L[i >>> 2] = (L[i >>> 2] + ((key[i] & 0xff) << (8 * (i & 3)))) >>> 0; // 小端组字
  }
  const S :number[] = new Array(t);
  S[0] = P32 >>> 0;
  for (let i = 1; i < t; i++) S[i] = (S[i - 1] + Q32) >>> 0;

  let A = 0;
  let B = 0;
  let i = 0;
  let j = 0;
  for (let k = 0; k < 3 * Math.max(t, c); k++) {
    A = rotl32((S[i] + A + B) >>> 0, 3);
    S[i] = A;
    B = rotl32((L[j] + A + B) >>> 0, (A + B) >>> 0);
    L[j] = B;
    i = (i + 1) % t;
    j = (j + 1) % c;
  }
  return S;
};

// 依据密钥生成单块 (8 字节, 小端两字) 加解密 codec
export const makeRc5Codec = (key :Uint8Array) :BlockCodec => {
  const S = rc5Schedule(key);
  return {
    encryptBlock(block :Uint8Array) {
      let [a, b] = bytesToWordsLE(block);
      a = (a + S[0]) >>> 0;
      b = (b + S[1]) >>> 0;
      for (let r = 1; r <= ROUNDS; r++) {
        a = (rotl32((a ^ b) >>> 0, b) + S[2 * r]) >>> 0;
        b = (rotl32((b ^ a) >>> 0, a) + S[2 * r + 1]) >>> 0;
      }
      block.set(wordsToBytesLE([a, b]));
    },
    decryptBlock(block :Uint8Array) {
      let [a, b] = bytesToWordsLE(block);
      for (let r = ROUNDS; r >= 1; r--) {
        b = (rotr32((b - S[2 * r + 1]) >>> 0, a) ^ a) >>> 0;
        a = (rotr32((a - S[2 * r]) >>> 0, b) ^ b) >>> 0;
      }
      b = (b - S[1]) >>> 0;
      a = (a - S[0]) >>> 0;
      block.set(wordsToBytesLE([a, b]));
    },
  };
};

// ---------- 顶层 API ----------
export type Rc5Opts = {
  mode :SymMode;
  padding :SymPadding;
  code :'HEX' | 'Base64';
  capacity :number;
  iv? :string;
};

export type Rc5Code = Rc5Opts['code'];

export const rc5Encrypt = (plainText :string, keyText :string, opts :Rc5Opts) :string => {
  const key = rc5KeyBytes(keyText, opts.capacity);
  const iv = opts.mode === 'ECB' ? new Uint8Array(BLOCK_BYTES) : parseRc5Iv(opts.iv ?? '');
  const out = encryptBytes(new TextEncoder().encode(plainText), BLOCK_BYTES, makeRc5Codec(key), { mode: opts.mode, padding: opts.padding }, iv);
  return opts.code === 'HEX' ? bytesToHex(out) : bytesToBase64(out);
};

export const rc5Decrypt = (cipherText :string, keyText :string, opts :Rc5Opts) :string => {
  const key = rc5KeyBytes(keyText, opts.capacity);
  const iv = opts.mode === 'ECB' ? new Uint8Array(BLOCK_BYTES) : parseRc5Iv(opts.iv ?? '');
  const bytes = opts.code === 'HEX' ? hexToBytes(cipherText) : base64ToBytes(cipherText);
  const out = decryptBytes(bytes, BLOCK_BYTES, makeRc5Codec(key), { mode: opts.mode, padding: opts.padding }, iv);
  return new TextDecoder('utf-8').decode(out);
};

// ---------- 默认值持久化 (localStorage) ----------
const DEFAULT_MODE_ITEM = 'rc5-crypto:default-mode';
const DEFAULT_PADDING_ITEM = 'rc5-crypto:default-padding';
const DEFAULT_CODE_ITEM = 'rc5-crypto:default-code';
const DEFAULT_IV_ITEM = 'rc5-crypto:default-iv';
const DEFAULT_PASSPHRASE_ITEM = 'rc5-crypto:default-passphrase';

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
