// htpasswd 生成 - 核心算法 (纯 TS 实现)
// 输出格式: "用户名:密码哈希" 一行, 用于 Apache / Nginx 等 HTTP 基础认证
// 支持的加密方式与 htpasswd 命令对应关系:
//   bcrypt ($2y$)   -> htpasswd -B
//   Apache MD5      -> htpasswd -m ($apr1$, RFC 与 crypt(3) md5 同源算法)
//   SHA1 ({SHA})    -> htpasswd -s
//   明文            -> htpasswd -p
import * as CryptoJS from 'crypto-js';
import bcrypt from 'bcryptjs';

import { DEFAULT_BCRYPT_ROUNDS, FORBIDDEN_CHARS, type HtpasswdMethod } from './data';

// ---------------------------------------------------------------------------
// 默认值持久化 (localStorage)
// ---------------------------------------------------------------------------
const DEFAULT_METHOD_ITEM = 'htpasswd-generator:default-method';

// 获取默认加密方式
export function getDefaultMethod(): HtpasswdMethod {
  const v = localStorage.getItem(DEFAULT_METHOD_ITEM);
  if (v === 'bcrypt' || v === 'apr1' || v === 'sha1' || v === 'plain') return v;
  return 'bcrypt';
}

// 设置默认加密方式
export function setDefaultMethod(method: HtpasswdMethod): void {
  localStorage.setItem(DEFAULT_METHOD_ITEM, method);
}

const BCRYPT_ROUNDS_ITEM = 'htpasswd-generator:bcrypt-rounds';

// 获取 bcrypt 默认成本
export function getBcryptRounds(): number {
  const v = localStorage.getItem(BCRYPT_ROUNDS_ITEM);
  if (v === null) return DEFAULT_BCRYPT_ROUNDS;
  const r = parseInt(v, 10);
  if (Number.isNaN(r) || r < 4 || r > 15) return DEFAULT_BCRYPT_ROUNDS;
  return r;
}

// 设置 bcrypt 默认成本
export function setBcryptRounds(rounds: number): void {
  const r = Math.min(15, Math.max(4, Math.round(rounds)));
  localStorage.setItem(BCRYPT_ROUNDS_ITEM, r.toString());
}

// ---------------------------------------------------------------------------
// 工具: 随机盐
// ---------------------------------------------------------------------------
// crypt(3) 风格盐字符集 ($apr1$ / bcrypt 都使用)
export const ITOA64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// 取 [0, max) 的随机数 (优先 window.crypto, 兜底 Math.random)
function randomInt(max: number): number {
  const c = typeof crypto !== 'undefined' ? crypto : undefined;
  if (c && typeof c.getRandomValues === 'function') {
    const arr = new Uint32Array(1);
    c.getRandomValues(arr);
    return arr[0] % max;
  }
  return Math.floor(Math.random() * max);
}

// 生成随机盐 (默认 8 字符, 与 htpasswd 相同)
export function randomSalt(len = 8): string {
  let s = '';
  for (let i = 0; i < len; i++) s += ITOA64[randomInt(64)];
  return s;
}

// ---------------------------------------------------------------------------
// MD5 (RFC 1321, 字节级实现) - $apr1$ 内部使用
// ---------------------------------------------------------------------------
const MD5_S = new Uint8Array([
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]);

const MD5_K = new Uint32Array(64);
for (let i = 0; i < 64; i++) {
  MD5_K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;
}

function rotl32(x: number, n: number): number {
  return ((x << n) | (x >>> (32 - n))) >>> 0;
}

// 计算一段字节的 MD5 摘要 (16 字节)
export function md5Bytes(input: Uint8Array): Uint8Array {
  const origLen = input.length;
  // 64 位比特长度 (仅需低 32 位; JS 数组长度 < 2^29 不会溢出)
  const bitLenLo = (origLen * 8) >>> 0;
  const bitLenHi = Math.floor((origLen * 8) / 4294967296) >>> 0;
  // 填充: 0x80 + 若干 0x00, 使长度 % 64 == 56, 再附 8 字节长度
  const padLen = (56 - (origLen % 64) + 64) % 64 || 64;
  const total = origLen + padLen + 8;
  const buf = new Uint8Array(total);
  buf.set(input);
  buf[origLen] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(origLen + padLen, bitLenLo, true);
  dv.setUint32(origLen + padLen + 4, bitLenHi, true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let off = 0; off < total; off += 64) {
    const M = new Uint32Array(16);
    for (let j = 0; j < 16; j++) M[j] = dv.getUint32(off + j * 4, true);

    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      const tmp = d;
      d = c;
      c = b;
      b = (b + rotl32((a + f + MD5_K[i] + M[g]) >>> 0, MD5_S[i])) >>> 0;
      a = tmp;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  const out = new Uint8Array(16);
  const odv = new DataView(out.buffer);
  odv.setUint32(0, a0, true);
  odv.setUint32(4, b0, true);
  odv.setUint32(8, c0, true);
  odv.setUint32(12, d0, true);
  return out;
}

// ---------------------------------------------------------------------------
// Apache MD5 crypt ($apr1$) - 与 htpasswd -m / openssl passwd -apr1 完全一致
// 算法要点:
//   1. 摘要 = MD5(密码 + "$apr1$" + 盐)
//   2. 交替摘要 = MD5(密码 + 盐 + 密码)
//   3. 按密码字节长度循环叠加交替摘要, 再按长度二进制位叠加 0x00 / 密码首字节
//   4. MD5 后循环 1000 次: 密码/摘要/盐按 i%2/i%3/i%7 规则混排
//   5. 用 crypt(3) 专用 base64 (字符集 "./0-9A-Za-z") 输出 22 字符
// ---------------------------------------------------------------------------
function to64(value: number, count: number): string {
  let result = '';
  let v = value >>> 0;
  while (count-- > 0) {
    result += ITOA64[v & 63];
    v = v >>> 6;
  }
  return result;
}

function concatBytes(...parts: Array<Uint8Array>): Uint8Array {
  let len = 0;
  for (const p of parts) len += p.length;
  const out = new Uint8Array(len);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

const APR1_MAGIC = new Uint8Array([0x24, 0x61, 0x70, 0x72, 0x31, 0x24]); // "$apr1$"

/**
 * 生成 Apache MD5 密码哈希
 * @param password 明文密码
 * @param salt 盐 (1-8 个字符, 只能来自 [./0-9A-Za-z]); 缺省时随机生成
 * @returns "$apr1$<salt>$<22 字符哈希>"
 */
export function apr1Hash(password: string, salt?: string): string {
  const pw = new TextEncoder().encode(password);
  const s = salt ?? randomSalt(8);
  if (!/^[./0-9A-Za-z]{1,8}$/.test(s)) {
    throw new Error('APR1 盐只能包含 1-8 个 [./0-9A-Za-z] 字符');
  }
  const saltBytes = new TextEncoder().encode(s);

  // 交替摘要: MD5(密码 + 盐 + 密码)
  const alt = md5Bytes(concatBytes(pw, saltBytes, pw));

  // 第一段流: 密码 + "$apr1$" + 盐 + 交替摘要(循环, 截取到密码长度)
  const stream: number[] = [];
  for (let i = 0; i < pw.length; i++) stream.push(pw[i]);
  for (let i = 0; i < APR1_MAGIC.length; i++) stream.push(APR1_MAGIC[i]);
  for (let i = 0; i < saltBytes.length; i++) stream.push(saltBytes[i]);
  let pl = pw.length;
  while (pl > 0) {
    const n = pl > 16 ? 16 : pl;
    for (let i = 0; i < n; i++) stream.push(alt[i]);
    pl -= 16;
  }
  // 按密码字节长度的二进制位: 奇位补 0x00, 偶位补密码首字节
  for (let i = pw.length; i > 0; i = i >> 1) {
    stream.push(i % 2 === 1 ? 0 : pw[0]);
  }
  let final = md5Bytes(Uint8Array.from(stream));

  // 1000 轮迭代
  for (let i = 0; i < 1000; i++) {
    const parts: number[] = [];
    // i 为偶数时接摘要, 奇数时接密码
    if (i % 2 === 0) {
      for (let j = 0; j < 16; j++) parts.push(final[j]);
    } else {
      for (let j = 0; j < pw.length; j++) parts.push(pw[j]);
    }
    if (i % 3 !== 0) {
      for (let j = 0; j < saltBytes.length; j++) parts.push(saltBytes[j]);
    }
    if (i % 7 !== 0) {
      for (let j = 0; j < pw.length; j++) parts.push(pw[j]);
    }
    if (i % 2 === 0) {
      for (let j = 0; j < pw.length; j++) parts.push(pw[j]);
    } else {
      for (let j = 0; j < 16; j++) parts.push(final[j]);
    }
    final = md5Bytes(Uint8Array.from(parts));
  }

  // 按固定顺序 (0,6,12 / 1,7,13 / ...) 输出 22 字符
  const enc =
    to64((final[0] << 16) | (final[6] << 8) | final[12], 4) +
    to64((final[1] << 16) | (final[7] << 8) | final[13], 4) +
    to64((final[2] << 16) | (final[8] << 8) | final[14], 4) +
    to64((final[3] << 16) | (final[9] << 8) | final[15], 4) +
    to64((final[4] << 16) | (final[10] << 8) | final[5], 4) +
    to64(final[11], 2);

  return '$apr1$' + s + '$' + enc;
}

// ---------------------------------------------------------------------------
// SHA1 ({SHA}Base64) - 与 htpasswd -s 一致
// ---------------------------------------------------------------------------
/**
 * SHA1 摘要的 Base64 (用于 {SHA} 前缀格式)
 */
export function sha1Base64(password: string): string {
  const digest = CryptoJS.SHA1(CryptoJS.enc.Utf8.parse(password));
  return CryptoJS.enc.Base64.stringify(digest);
}

// ---------------------------------------------------------------------------
// bcrypt ($2y$) - 与 htpasswd -B 一致
// ---------------------------------------------------------------------------
/**
 * bcrypt 哈希 (统一输出 $2y$ 前缀, 同 htpasswd -B)
 * @param password 明文密码 (最多 72 字节)
 * @param rounds 成本, 默认 10 (迭代 2^10 次)
 */
export function bcryptHash(password: string, rounds = DEFAULT_BCRYPT_ROUNDS): string {
  const r = Math.min(15, Math.max(4, Math.round(rounds)));
  const hash = bcrypt.hashSync(password, r);
  // bcryptjs 生成 $2b$ 前缀, htpasswd -B 习惯写 $2y$ (算法相同, 均可互验)
  return hash.replace(/^\$2[aby]\$/, '$2y$');
}

// ---------------------------------------------------------------------------
// 行 / 文件内容生成
// ---------------------------------------------------------------------------
export type HtpasswdOptions = {
  method: HtpasswdMethod;
  /** 仅 bcrypt 生效: 成本 (默认 10) */
  rounds?: number;
  /** 仅 apr1 生效: 盐 (默认随机) */
  salt?: string;
};

// 校验用户名 / 密码是否符合 htpasswd 文件语法
function validatePart(name: string, value: string): void {
  if (value === '') {
    throw new Error(`${name}不能为空`);
  }
  for (const ch of FORBIDDEN_CHARS) {
    if (value.includes(ch)) {
      const tip = ch === ':' ? '冒号 (:)' : '换行符';
      throw new Error(`${name}不能包含${tip}, htpasswd 文件以 ":" 分隔且按行存储`);
    }
  }
}

/**
 * 生成一行 htpasswd 记录: "用户名:密码哈希"
 */
export function buildHtpasswdLine(username: string, password: string, opts: HtpasswdOptions): string {
  validatePart('用户名', username);
  validatePart('密码', password);
  const { method, rounds, salt } = opts;
  let hash: string;
  switch (method) {
    case 'bcrypt':
      hash = bcryptHash(password, rounds);
      break;
    case 'apr1':
      hash = apr1Hash(password, salt);
      break;
    case 'sha1':
      hash = '{SHA}' + sha1Base64(password);
      break;
    case 'plain':
      hash = password;
      break;
    default:
      throw new Error(`不支持的加密方式: ${String(method)}`);
  }
  return `${username}:${hash}`;
}

/**
 * 组装 .htpasswd 文件内容 (自动补结尾换行)
 * @param lines 每行一条 "用户名:哈希" 记录
 */
export function buildHtpasswdFile(lines: Array<string>): string {
  if (lines.length === 0) return '';
  return lines.join('\n') + '\n';
}
