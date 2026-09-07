// RC6 分组密码 (Rivest 1998, RC6-32/20/16) 纯 TS 实现
// 分组 16 字节 (4x32 位), 20 轮, 大端组字 (与 Bouncy Castle RC6Engine 一致)
// 官方向量 (Bouncy Castle RC6Test) 见 lib.test.ts
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

const P32 = 0xb7e15163;
const Q32 = 0x9e3779b9;
const LGW = 5;

// 密钥文本 -> 字节 (UTF-8; 字节数须等于 位数/8)
export const rc6KeyBytes = (keyText :string, capacity :number) :Uint8Array => {
  const bytes = new TextEncoder().encode(keyText);
  const need = capacity / 8;
  if (bytes.length !== need) throw new Error(`密钥需为 ${need} 个字符 (UTF-8 ${need} 字节), 当前 ${bytes.length} 字节`);
  return bytes;
};

export const rc6KeyValid = (keyText :string, capacity :number) :boolean => {
  if (keyText.trim() === '') return false;
  try { rc6KeyBytes(keyText, capacity); return true; } catch { return false; }
};

// 偏移量文本 -> 字节: 空 (仅 ECB 可空) / blockSize 个字符 (UTF-8) / 2*blockSize 位 HEX
export const parseRc6Iv = (iv :string) :Uint8Array => {
  const text = iv.trim();
  if (text === '') throw new Error('非 ECB 模式需要填写偏移量 (IV)');
  if (/^[0-9a-fA-F]{32}$/.test(text)) return hexToBytes(text);
  const bytes = new TextEncoder().encode(text);
  if (bytes.length === BLOCK_BYTES) return bytes;
  throw new Error(`偏移量需为 ${BLOCK_BYTES} 个字符或 32 位 HEX`);
};

export const rc6IvValid = (iv :string) :boolean => {
  if (iv.trim() === '') return true; // ECB 不需要
  try { parseRc6Iv(iv); return true; } catch { return false; }
};

// ---------- RC6 密钥扩展 (与 BC setKey 三阶段一致) ----------
export const rc6Schedule = (key :Uint8Array) :number[] => {
  const b = key.length;
  const c = Math.max(1, Math.ceil(b / 4));
  const L :number[] = new Array(c).fill(0);
  // 组字: 与 BC 相同, 从密钥尾部起逐字节左移 (大端字, 尾部不足 4 字节补零)
  for (let i = b - 1; i >= 0; i--) {
    L[i >>> 2] = ((L[i >>> 2] << 8) + (key[i] & 0xff)) >>> 0;
  }
  const S :number[] = new Array(2 * ROUNDS + 4);
  S[0] = P32 >>> 0;
  for (let i = 1; i < S.length; i++) S[i] = (S[i - 1] + Q32) >>> 0;

  let A = 0;
  let B = 0;
  let i = 0;
  let j = 0;
  const iter = 3 * Math.max(L.length, S.length);
  for (let k = 0; k < iter; k++) {
    A = S[i] = rotl32((S[i] + A + B) >>> 0, 3);
    B = L[j] = rotl32((L[j] + A + B) >>> 0, (A + B) >>> 0);
    i = (i + 1) % S.length;
    j = (j + 1) % L.length;
  }
  return S;
};

// 依据密钥生成单块 (16 字节, 4 个 32 位大端字) 加解密 codec
export const makeRc6Codec = (key :Uint8Array) :BlockCodec => {
  const S = rc6Schedule(key);

  const fwd = (w :number) :number => {
    const t = rotl32(Math.imul(w >>> 0, ((2 * w + 1) | 0)) >>> 0, LGW);
    return t;
  };

  return {
    encryptBlock(block :Uint8Array) {
      const [A0, B0, C0, D0] = bytesToWordsLE(block);
      let A = A0;
      let B = (B0 + S[0]) >>> 0;
      let C = C0;
      let D = (D0 + S[1]) >>> 0;
      // 预白化仅 B/D (与 BC 一致); A/C 于轮内与轮末白化
      for (let r = 1; r <= ROUNDS; r++) {
        const t = fwd(B);
        const u = fwd(D);
        A = (rotl32((A ^ t) >>> 0, u) + S[2 * r]) >>> 0;
        C = (rotl32((C ^ u) >>> 0, t) + S[2 * r + 1]) >>> 0;
        const tmp = A; A = B; B = C; C = D; D = tmp;
      }
      const out = [
        (A + S[2 * ROUNDS + 2]) >>> 0,
        B,
        (C + S[2 * ROUNDS + 3]) >>> 0,
        D,
      ];
      block.set(wordsToBytesLE(out));
    },
    decryptBlock(block :Uint8Array) {
      let [A, B, C, D] = bytesToWordsLE(block);
      C = (C - S[2 * ROUNDS + 3]) >>> 0;
      A = (A - S[2 * ROUNDS + 2]) >>> 0;
      for (let r = ROUNDS; r >= 1; r--) {
        let tmp = D; D = C; C = B; B = A; A = tmp;
        const t = fwd(B);
        const u = fwd(D);
        C = (rotr32((C - S[2 * r + 1]) >>> 0, t) ^ u) >>> 0;
        A = (rotr32((A - S[2 * r]) >>> 0, u) ^ t) >>> 0;
      }
      const out = [
        A,
        (B - S[0]) >>> 0,
        C,
        (D - S[1]) >>> 0,
      ];
      block.set(wordsToBytesLE(out));
    },
  };
};

// ---------- 顶层 API ----------
export type Rc6Opts = {
  mode :SymMode;
  padding :SymPadding;
  code :'HEX' | 'Base64';
  capacity :number;
  iv? :string;
};

export type Rc6Code = Rc6Opts['code'];

export const rc6Encrypt = (plainText :string, keyText :string, opts :Rc6Opts) :string => {
  const key = rc6KeyBytes(keyText, opts.capacity);
  const iv = opts.mode === 'ECB' ? new Uint8Array(BLOCK_BYTES) : parseRc6Iv(opts.iv ?? '');
  const out = encryptBytes(new TextEncoder().encode(plainText), BLOCK_BYTES, makeRc6Codec(key), { mode: opts.mode, padding: opts.padding }, iv);
  return opts.code === 'HEX' ? bytesToHex(out) : bytesToBase64(out);
};

export const rc6Decrypt = (cipherText :string, keyText :string, opts :Rc6Opts) :string => {
  const key = rc6KeyBytes(keyText, opts.capacity);
  const iv = opts.mode === 'ECB' ? new Uint8Array(BLOCK_BYTES) : parseRc6Iv(opts.iv ?? '');
  const bytes = opts.code === 'HEX' ? hexToBytes(cipherText) : base64ToBytes(cipherText);
  const out = decryptBytes(bytes, BLOCK_BYTES, makeRc6Codec(key), { mode: opts.mode, padding: opts.padding }, iv);
  return new TextDecoder('utf-8').decode(out);
};

// ---------- 默认值持久化 (localStorage) ----------
const DEFAULT_MODE_ITEM = 'rc6-crypto:default-mode';
const DEFAULT_PADDING_ITEM = 'rc6-crypto:default-padding';
const DEFAULT_CODE_ITEM = 'rc6-crypto:default-code';
const DEFAULT_IV_ITEM = 'rc6-crypto:default-iv';
const DEFAULT_PASSPHRASE_ITEM = 'rc6-crypto:default-passphrase';

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
