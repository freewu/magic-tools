// Keccak-f[1600] 引擎 + SHA-3 家族 / SHAKE / 原始 Keccak 包装
// - NIST SHA3-224/256/384/512: FIPS 202, rate=200-2*len, padding 域字节 0x06, 固定输出 len
// - SHAKE128/256: FIPS 202 可扩展输出, padding 域字节 0x1F, 输出长度由调用方指定
// - Keccak-224/256/384/512: 原始 Keccak (如以太坊), padding 域字节 0x01
// 纯 BigInt 实现, 便于与 js-sha3 等参考实现逐字节对拍

const MASK64 = (1n << 64n) - 1n;

const rotl = (x :bigint, n :number) :bigint => {
  if (n === 0) return x;
  return ((x << BigInt(n)) | (x >> BigInt(64 - n))) & MASK64;
};

// 轮常数 RC[0..23]
const RC :bigint[] = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
  0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];

// 每个 lane 的循环位移量 r[y][x] (x 列, y 行)
const R :number[][] = [
  [ 0,  1, 62, 28, 27],
  [36, 44,  6, 55, 20],
  [ 3, 10, 43, 25, 39],
  [41, 45, 15, 21,  8],
  [18,  2, 61, 56, 14],
];

/** Keccak-f[1600] 置换 (就地), state[y][x] 每个元素为一个 64 位 lane */
const keccakF = (s :bigint[][]) :void => {
  for (let round = 0; round < 24; round++) {
    // θ
    const c :bigint[] = new Array(5);
    const d :bigint[] = new Array(5);
    for (let x = 0; x < 5; x++) {
      c[x] = s[0][x] ^ s[1][x] ^ s[2][x] ^ s[3][x] ^ s[4][x];
    }
    for (let x = 0; x < 5; x++) {
      d[x] = c[(x + 4) % 5] ^ rotl(c[(x + 1) % 5], 1);
    }
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        s[y][x] ^= d[x];
      }
    }
    // ρ + π: 目标 B[y'=(2x+3y)%5][x'=y] = rotl(A[y][x], r[y][x])
    const b :bigint[][] = Array.from({ length: 5 }, () => new Array<bigint>(5).fill(0n));
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        b[(2 * x + 3 * y) % 5][y] = rotl(s[y][x], R[y][x]);
      }
    }
    // χ
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        s[y][x] = b[y][x] ^ ((~b[y][(x + 1) % 5]) & b[y][(x + 2) % 5]);
      }
    }
    // ι
    s[0][0] ^= RC[round];
  }
};

/** 在 state 的块内字节位置 p 处 XOR 一个字节 (块按 lane 线性序小端排布) */
const xorByte = (s :bigint[][], p :number, b :number) :void => {
  const lane = Math.floor(p / 8);
  const x = lane % 5;
  const y = Math.floor(lane / 5);
  s[y][x] ^= BigInt(b) << BigInt(8 * (p % 8));
};

/** 读取 state 块内字节位置 p 的字节 */
const readByte = (s :bigint[][], p :number) :number => {
  const lane = Math.floor(p / 8);
  const x = lane % 5;
  const y = Math.floor(lane / 5);
  return Number((s[y][x] >> BigInt(8 * (p % 8))) & 0xffn);
};

/** 通用海绵: message 为任意字节, rate 为吸收速率(字节), suffix 为填充域字节, 输出 outBytes 字节 */
const sponge = (message :Uint8Array, rate :number, suffix :number, outBytes :number) :Uint8Array => {
  const s :bigint[][] = Array.from({ length: 5 }, () => new Array<bigint>(5).fill(0n));

  // 吸收 (逐块 XOR 后置换; 长度恰为 rate 整数倍时最后一整块同样先置换)
  let pos = 0;
  let rem = message.length;
  while (rem >= rate) {
    for (let p = 0; p < rate; p++) xorByte(s, p, message[pos + p]);
    keccakF(s);
    pos += rate;
    rem -= rate;
  }
  // 剩余不足一块的部分 (0 <= rem < rate)
  for (let p = 0; p < rem; p++) xorByte(s, p, message[pos + p]);
  // pad10*1: 域字节放在剩余消息后, 块末尾置 0x80
  xorByte(s, rem, suffix);
  xorByte(s, rate - 1, 0x80);
  keccakF(s);

  // 挤压
  const out = new Uint8Array(outBytes);
  let done = 0;
  while (done < outBytes) {
    const n = Math.min(rate, outBytes - done);
    for (let p = 0; p < n; p++) out[done + p] = readByte(s, p);
    done += n;
    if (done < outBytes) keccakF(s);
  }
  return out;
};

type Input = string | Uint8Array;

/** 输入归一化为字节 (字符串按 UTF-8) */
const toBytes = (input :Input) :Uint8Array => {
  if (typeof input === 'string') return new TextEncoder().encode(input);
  return input;
};

const hex = (bytes :Uint8Array) :string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

const makeDigest = (rate :number, suffix :number, outBytes :number) =>
  (input :Input) :string => hex(sponge(toBytes(input), rate, suffix, outBytes));

const makeShake = (rate :number, suffix :number) =>
  (input :Input, outBits :number) :string => {
    if (!Number.isInteger(outBits) || outBits <= 0 || outBits % 8 !== 0) {
      throw new Error('输出长度必须为 8 的正整数倍 (bit)');
    }
    return hex(sponge(toBytes(input), rate, suffix, outBits / 8));
  };

// -------- NIST SHA-3 (FIPS 202) --------
export const sha3_224 = makeDigest(144, 0x06, 28);
export const sha3_256 = makeDigest(136, 0x06, 32);
export const sha3_384 = makeDigest(104, 0x06, 48);
export const sha3_512 = makeDigest(72, 0x06, 64);

// -------- SHAKE (FIPS 202 可扩展输出) --------
export const shake128 = makeShake(168, 0x1f);
export const shake256 = makeShake(136, 0x1f);

// -------- 原始 Keccak (域字节 0x01, 如以太坊) --------
export const keccak224 = makeDigest(144, 0x01, 28);
export const keccak256 = makeDigest(136, 0x01, 32);
export const keccak384 = makeDigest(104, 0x01, 48);
export const keccak512 = makeDigest(72, 0x01, 64);
