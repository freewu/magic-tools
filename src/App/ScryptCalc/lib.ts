// Scrypt 值计算: 口令 + 盐 + 参数(N, r, p) -> 派生密钥 (RFC 7914)
// 零依赖纯 TS 实现: SHA-256 / HMAC-SHA256 / PBKDF2 / Salsa20-8 / BlockMix / ROMix
// 正确性由 RFC 7914 第 12 节测试向量与 RFC 4231 HMAC 向量保障

/* ---------------- SHA-256 ---------------- */

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

const rotr = (x: number, n: number): number => (x >>> n) | (x << (32 - n));

export const sha256 = (data: Uint8Array): Uint8Array => {
  const bitLen = data.length * 8;
  // 补 1 + 零填充至 448 mod 512 位 + 64 位长度, 即 ceil((bitLen+1+64)/512) 个 512 位块
  const padLen = Math.ceil((bitLen + 65) / 512) * 64; // 字节数
  const msg = new Uint8Array(padLen);
  msg.set(data);
  msg[data.length] = 0x80;
  // 大端 64 位长度
  let hi = Math.floor(bitLen / 0x100000000), lo = bitLen >>> 0;
  const dv = new DataView(msg.buffer);
  dv.setUint32(padLen - 8, hi >>> 0);
  dv.setUint32(padLen - 4, lo >>> 0);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a,
      h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  const w = new Int32Array(64);
  for (let off = 0; off < padLen; off += 64) {
    for (let t = 0; t < 16; t++) {
      w[t] = dv.getUint32(off + t * 4) | 0;
    }
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[t] + w[t]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0;
      d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }
  const out = new Uint8Array(32);
  const odv = new DataView(out.buffer);
  [ h0, h1, h2, h3, h4, h5, h6, h7 ].forEach((v, i) => odv.setUint32(i * 4, v >>> 0));
  return out;
};

/* ---------------- HMAC-SHA256 (RFC 2104) ---------------- */

export const hmacSha256 = (key: Uint8Array, msg: Uint8Array): Uint8Array => {
  let k = key;
  if (k.length > 64) k = sha256(k);
  const ipad = new Uint8Array(64);
  const opad = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    const kb = i < k.length ? k[i] : 0;
    ipad[i] = kb ^ 0x36;
    opad[i] = kb ^ 0x5c;
  }
  const inner = new Uint8Array(64 + msg.length);
  inner.set(ipad);
  inner.set(msg, 64);
  const outer = new Uint8Array(64 + 32);
  outer.set(opad);
  outer.set(sha256(inner), 64);
  return sha256(outer);
};

/* ---------------- PBKDF2-HMAC-SHA256 (RFC 2898) ---------------- */

export const pbkdf2Sha256 = (password: Uint8Array, salt: Uint8Array, iterations: number, dkLen: number): Uint8Array => {
  const prfKey = password; // HMAC key = password
  const out = new Uint8Array(dkLen);
  const block = new Uint8Array(salt.length + 4);
  block.set(salt);
  const dv = new DataView(block.buffer);
  let written = 0;
  for (let blockIndex = 1; written < dkLen; blockIndex++) {
    dv.setUint32(salt.length, blockIndex >>> 0); // 大端计数器
    let u = hmacSha256(prfKey, block);
    const t = u.slice();
    for (let i = 1; i < iterations; i++) {
      u = hmacSha256(prfKey, u);
      for (let j = 0; j < t.length; j++) t[j] ^= u[j];
    }
    out.set(t.subarray(0, Math.min(32, dkLen - written)), written);
    written += 32;
  }
  return out;
};

/* ---------------- Salsa20/8 core (RFC 7914 第 4 节, 小端字) ---------------- */

const rotl = (x: number, n: number): number => (x << n) | (x >>> (32 - n));

export const salsa208 = (input: Uint8Array, output: Uint8Array): void => {
  const x = new Int32Array(16);
  const dv = new DataView(input.buffer, input.byteOffset, input.byteLength);
  for (let i = 0; i < 16; i++) x[i] = dv.getInt32(i * 4, true);
  const y = x.slice();
  for (let i = 0; i < 8; i += 2) {
    y[4] ^= rotl((y[0] + y[12]) | 0, 7);  y[8] ^= rotl((y[4] + y[0]) | 0, 9);
    y[12] ^= rotl((y[8] + y[4]) | 0, 13); y[0] ^= rotl((y[12] + y[8]) | 0, 18);
    y[9] ^= rotl((y[5] + y[1]) | 0, 7);   y[13] ^= rotl((y[9] + y[5]) | 0, 9);
    y[1] ^= rotl((y[13] + y[9]) | 0, 13); y[5] ^= rotl((y[1] + y[13]) | 0, 18);
    y[14] ^= rotl((y[10] + y[6]) | 0, 7); y[2] ^= rotl((y[14] + y[10]) | 0, 9);
    y[6] ^= rotl((y[2] + y[14]) | 0, 13); y[10] ^= rotl((y[6] + y[2]) | 0, 18);
    y[3] ^= rotl((y[15] + y[11]) | 0, 7); y[7] ^= rotl((y[3] + y[15]) | 0, 9);
    y[11] ^= rotl((y[7] + y[3]) | 0, 13); y[15] ^= rotl((y[11] + y[7]) | 0, 18);
    y[1] ^= rotl((y[0] + y[3]) | 0, 7);   y[2] ^= rotl((y[1] + y[0]) | 0, 9);
    y[3] ^= rotl((y[2] + y[1]) | 0, 13);  y[0] ^= rotl((y[3] + y[2]) | 0, 18);
    y[6] ^= rotl((y[5] + y[4]) | 0, 7);   y[7] ^= rotl((y[6] + y[5]) | 0, 9);
    y[4] ^= rotl((y[7] + y[6]) | 0, 13);  y[5] ^= rotl((y[4] + y[7]) | 0, 18);
    y[11] ^= rotl((y[10] + y[9]) | 0, 7); y[8] ^= rotl((y[11] + y[10]) | 0, 9);
    y[9] ^= rotl((y[8] + y[11]) | 0, 13); y[10] ^= rotl((y[9] + y[8]) | 0, 18);
    y[12] ^= rotl((y[15] + y[14]) | 0, 7); y[13] ^= rotl((y[12] + y[15]) | 0, 9);
    y[14] ^= rotl((y[13] + y[12]) | 0, 13); y[15] ^= rotl((y[14] + y[13]) | 0, 18);
  }
  const odv = new DataView(output.buffer, output.byteOffset, output.byteLength);
  for (let i = 0; i < 16; i++) odv.setInt32(i * 4, (y[i] + x[i]) | 0, true);
};

/* ---------------- BlockMix + ROMix (RFC 7914 第 5/6 节) ---------------- */

export const blockMix = (b: Uint8Array, r: number): Uint8Array => {
  const blockLen = 64;
  const bLen = 2 * r * blockLen;
  const x = b.slice(bLen - blockLen, bLen); // 最后一 64 字节块
  const y = new Uint8Array(bLen);
  const t = new Uint8Array(blockLen);
  for (let i = 0; i < 2 * r; i++) {
    for (let j = 0; j < blockLen; j++) t[j] = x[j] ^ b[i * blockLen + j];
    salsa208(t, x);
    y.set(x, (i % 2) * r * blockLen + Math.floor(i / 2) * blockLen);
  }
  return y;
};

export const romix = (b: Uint8Array, n: number, r: number): Uint8Array => {
  const blockLen = 64;
  const xLen = 128 * r;
  const v = new Uint8Array(n * xLen); // V[0..N-1] 每个 xLen 字节
  let x = b.slice(0, xLen);
  for (let i = 0; i < n; i++) {
    v.set(x, i * xLen);
    x = blockMix(x, r);
  }
  for (let i = 0; i < n; i++) {
    // integerify(X) = X 末 64 字节小端整数 mod N; N 为 2 的幂且 < 2^32, 故只需低 4 字节
    const tail = xLen - 64;
    let j = ((x[tail] | (x[tail + 1] << 8) | (x[tail + 2] << 16) | (x[tail + 3] << 24)) >>> 0) % n;
    for (let q = 0; q < xLen; q++) x[q] ^= v[j * xLen + q];
    x = blockMix(x, r);
  }
  return x;
};

/* ---------------- scrypt (RFC 7914 第 7 节) ---------------- */

export interface ScryptParams {
  n: number;    // CPU/内存成本, 必须为 2 的幂
  r: number;    // 块大小
  p: number;    // 并行度
}

export const scrypt = (password: string | Uint8Array, salt: string | Uint8Array, params: ScryptParams, dkLen: number): Uint8Array => {
  const { n, r, p } = params;
  if (n <= 1 || (n & (n - 1)) !== 0) throw new Error('参数 N 必须为大于 1 的 2 的幂');
  if (r <= 0 || p <= 0) throw new Error('参数 r/p 必须为正整数');
  if (dkLen <= 0) throw new Error('派生长度必须为正整数');
  const te = new TextEncoder();
  const P = typeof password === 'string' ? te.encode(password) : password;
  const S = typeof salt === 'string' ? te.encode(salt) : salt;

  // 1) B = PBKDF2(P, S, 1, p * 128 * r)
  const bLen = p * 128 * r;
  const b = pbkdf2Sha256(P, S, 1, bLen);
  // 2) 对每块 ROMix
  for (let i = 0; i < p; i++) {
    const out = romix(b.subarray(i * 128 * r, (i + 1) * 128 * r), n, r);
    b.set(out, i * 128 * r);
  }
  // 3) DK = PBKDF2(P, B, 1, dkLen)
  return pbkdf2Sha256(P, b, 1, dkLen);
};

export const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
