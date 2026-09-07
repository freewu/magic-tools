// Blowfish 分组密码 (Schneier 1993) 纯 TS 实现
// 分组 8 字节 (64 位), Feistel 16 轮; P/S 初始常量与参考包 blowfish@1.0.1 逐项核对一致
// 单块加密输出与参考包实测互证 (见 lib.test.ts 锚点向量)
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
import { P as INIT_P, S0 as INIT_S0, S1 as INIT_S1, S2 as INIT_S2, S3 as INIT_S3 } from './tables';

export const KEY_MIN_BYTES = 4;
export const KEY_MAX_BYTES = 56;

// 密钥文本 -> 字节 (UTF-8; 字节数须等于 位数/8)
export const blowfishKeyBytes = (keyText :string, capacity :number) :Uint8Array => {
  const bytes = new TextEncoder().encode(keyText);
  const need = capacity / 8;
  if (bytes.length !== need) throw new Error(`密钥需为 ${need} 个字符 (UTF-8 ${need} 字节), 当前 ${bytes.length} 字节`);
  return bytes;
};

export const blowfishKeyValid = (keyText :string, capacity :number) :boolean => {
  if (keyText.trim() === '') return false;
  try { blowfishKeyBytes(keyText, capacity); return true; } catch { return false; }
};

// 偏移量文本 -> 字节: 空 (仅 ECB 可空) / blockSize 个字符 (UTF-8) / 2*blockSize 位 HEX
export const parseBlowfishIv = (iv :string) :Uint8Array => {
  const text = iv.trim();
  if (text === '') throw new Error('非 ECB 模式需要填写偏移量 (IV)');
  if (/^[0-9a-fA-F]{16}$/.test(text)) return hexToBytes(text);
  const bytes = new TextEncoder().encode(text);
  if (bytes.length === BLOCK_BYTES) return bytes;
  throw new Error(`偏移量需为 ${BLOCK_BYTES} 个字符或 16 位 HEX`);
};

export const blowfishIvValid = (iv :string) :boolean => {
  if (iv.trim() === '') return true; // ECB 不需要
  try { parseBlowfishIv(iv); return true; } catch { return false; }
};

// ---------- 32 位运算辅助 ----------
const xor32 = (a :number, b :number) :number => ((a ^ b) >>> 0);
const add32 = (a :number, b :number) :number => ((a + b) >>> 0);

// ---------- 密钥扩展 (标准 Blowfish: P/S 与密钥逐字异或后对零块连续加密) ----------
export const blowfishSchedule = (key :Uint8Array) :{ P :number[]; S :number[][] } => {
  const P = INIT_P.slice();
  const S = [INIT_S0.slice(), INIT_S1.slice(), INIT_S2.slice(), INIT_S3.slice()];

  const F = (x :number) :number => {
    const a = (x >>> 24) & 0xff;
    const b = (x >>> 16) & 0xff;
    const c = (x >>> 8) & 0xff;
    const d = x & 0xff;
    return add32(xor32(add32(S[0][a], S[1][b]), S[2][c]), S[3][d]);
  };
  const round = (a :number, b :number, n :number) :number => xor32(a, xor32(F(b), P[n]));

  const encipherWords = (L :number, R :number) :[number, number] => {
    L = xor32(L, P[0]);
    for (let n = 1; n <= 16; n++) {
      if (n % 2 === 1) R = round(R, L, n);
      else L = round(L, R, n);
    }
    R = xor32(R, P[17]);
    return [R, L]; // 与参考实现一致: 输出交换
  };

  // P[i] ^= key 循环 4 字节 (大端组字)
  const klen = key.length;
  for (let i = 0; i < 18; i++) {
    let d = 0;
    for (let j = 0; j < 4; j++) {
      d = ((d << 8) | (key[(4 * i + j) % klen] & 0xff)) >>> 0;
    }
    P[i] = xor32(P[i], d);
  }

  // 对 (0,0) 连续加密并替换 P 与 4 个 S 盒
  let state :[number, number] = [0, 0];
  for (let i = 0; i < 18; i += 2) {
    state = encipherWords(state[0], state[1]);
    P[i] = state[0];
    P[i + 1] = state[1];
  }
  for (let t = 0; t < 4; t++) {
    for (let j = 0; j < 256; j += 2) {
      state = encipherWords(state[0], state[1]);
      S[t][j] = state[0];
      S[t][j + 1] = state[1];
    }
  }
  return { P, S };
};

// 依据密钥生成单块 (8 字节) 加解密 codec
// 输出布局与参考包 blowfish@1.0.1 一致: 密文 = 大端(第 17 轮后 Xr) || 大端(Xl)
export const makeBlowfishCodec = (key :Uint8Array) :BlockCodec => {
  const { P, S } = blowfishSchedule(key);
  const F = (x :number) :number => {
    const a = (x >>> 24) & 0xff;
    const b = (x >>> 16) & 0xff;
    const c = (x >>> 8) & 0xff;
    const d = x & 0xff;
    return add32(xor32(add32(S[0][a], S[1][b]), S[2][c]), S[3][d]);
  };
  const round = (a :number, b :number, n :number) :number => xor32(a, xor32(F(b), P[n]));

  return {
    encryptBlock(block :Uint8Array) {
      // 明文前 4 字节为大端字 L, 后 4 字节为 R
      let L = ((block[0] << 24) | (block[1] << 16) | (block[2] << 8) | block[3]) >>> 0;
      let R = ((block[4] << 24) | (block[5] << 16) | (block[6] << 8) | block[7]) >>> 0;
      L = xor32(L, P[0]);
      for (let n = 1; n <= 16; n++) {
        if (n % 2 === 1) R = round(R, L, n);
        else L = round(L, R, n);
      }
      R = xor32(R, P[17]);
      const out = [R, L]; // 输出交换
      for (let i = 0; i < 2; i++) {
        block[4 * i] = (out[i] >>> 24) & 0xff;
        block[4 * i + 1] = (out[i] >>> 16) & 0xff;
        block[4 * i + 2] = (out[i] >>> 8) & 0xff;
        block[4 * i + 3] = out[i] & 0xff;
      }
    },
    decryptBlock(block :Uint8Array) {
      let L = ((block[0] << 24) | (block[1] << 16) | (block[2] << 8) | block[3]) >>> 0;
      let R = ((block[4] << 24) | (block[5] << 16) | (block[6] << 8) | block[7]) >>> 0;
      L = xor32(L, P[17]);
      for (let n = 16; n >= 1; n--) {
        if (n % 2 === 0) R = round(R, L, n); // 解密方向奇偶映射与加密相反
        else L = round(L, R, n);
      }
      R = xor32(R, P[0]);
      const out = [R, L];
      for (let i = 0; i < 2; i++) {
        block[4 * i] = (out[i] >>> 24) & 0xff;
        block[4 * i + 1] = (out[i] >>> 16) & 0xff;
        block[4 * i + 2] = (out[i] >>> 8) & 0xff;
        block[4 * i + 3] = out[i] & 0xff;
      }
    },
  };
};

// ---------- 顶层 API ----------
export type BlowfishOpts = {
  mode :SymMode;
  padding :SymPadding;
  code :'HEX' | 'Base64';
  capacity :number;
  iv? :string;
};

export type BlowfishCode = BlowfishOpts['code'];

export const blowfishEncrypt = (plainText :string, keyText :string, opts :BlowfishOpts) :string => {
  const key = blowfishKeyBytes(keyText, opts.capacity);
  const iv = opts.mode === 'ECB' ? new Uint8Array(BLOCK_BYTES) : parseBlowfishIv(opts.iv ?? '');
  const out = encryptBytes(new TextEncoder().encode(plainText), BLOCK_BYTES, makeBlowfishCodec(key), { mode: opts.mode, padding: opts.padding }, iv);
  return opts.code === 'HEX' ? bytesToHex(out) : bytesToBase64(out);
};

export const blowfishDecrypt = (cipherText :string, keyText :string, opts :BlowfishOpts) :string => {
  const key = blowfishKeyBytes(keyText, opts.capacity);
  const iv = opts.mode === 'ECB' ? new Uint8Array(BLOCK_BYTES) : parseBlowfishIv(opts.iv ?? '');
  const bytes = opts.code === 'HEX' ? hexToBytes(cipherText) : base64ToBytes(cipherText);
  const out = decryptBytes(bytes, BLOCK_BYTES, makeBlowfishCodec(key), { mode: opts.mode, padding: opts.padding }, iv);
  return new TextDecoder('utf-8').decode(out);
};

// ---------- 默认值持久化 (localStorage) ----------
const DEFAULT_MODE_ITEM = 'blowfish-crypto:default-mode';
const DEFAULT_PADDING_ITEM = 'blowfish-crypto:default-padding';
const DEFAULT_CODE_ITEM = 'blowfish-crypto:default-code';
const DEFAULT_IV_ITEM = 'blowfish-crypto:default-iv';
const DEFAULT_PASSPHRASE_ITEM = 'blowfish-crypto:default-passphrase';

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
