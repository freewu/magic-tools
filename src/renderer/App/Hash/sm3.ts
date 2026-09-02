// GB/T 32905-2016 SM3 密码杂凑算法 (输出 256 位摘要)
// 参考 GM/T 0004-2012 / SM3 标准实现 (与 OpenSSL dgst -sm3 结果一致)
// 输入: 字符串(按 UTF-8 编码) 或 字节数组; 输出: 小写十六进制字符串

// 初始向量 IV
const IV :Uint32Array = new Uint32Array([
  0x7380166f, 0x4914b2b9, 0x172442d7, 0xda8a0600,
  0xa96f30bc, 0x163138aa, 0xe38dee4d, 0xb0fb0e4e,
]);

// 32 位循环左移
const rotl = (x :number, k :number) :number => (((x << k) | (x >>> (32 - k))) >>> 0);

// 布尔函数 FF
const FF = (x :number, y :number, z :number, j :number) :number => {
  if(j < 16) return (x ^ y ^ z) >>> 0;
  return ((x & y) | (x & z) | (y & z)) >>> 0;
};

// 布尔函数 GG
const GG = (x :number, y :number, z :number, j :number) :number => {
  if(j < 16) return (x ^ y ^ z) >>> 0;
  return ((x & y) | (~x & z)) >>> 0;
};

// 置换函数 P0
const P0 = (x :number) :number => (x ^ rotl(x, 9) ^ rotl(x, 17)) >>> 0;

// 置换函数 P1
const P1 = (x :number) :number => (x ^ rotl(x, 15) ^ rotl(x, 23)) >>> 0;

// 消息填充: 末尾补 0x80 + 0 字节 + 8 字节大端比特长度, 使总长是 64 的整数倍
const padding = (bytes :Uint8Array) :Uint8Array => {
  const bitLen = bytes.length * 8;
  const rem = bytes.length % 64;
  const extra = (rem < 56)? (56 - rem) : (120 - rem); // 补齐到 56 mod 64, 预留 8 字节长度
  const ret = new Uint8Array(bytes.length + extra + 8);
  ret.set(bytes);
  ret[bytes.length] = 0x80;
  // 64 位消息比特长度 (大端)
  for(let i = 0; i < 8; i++) {
    ret[ret.length - 1 - i] = Math.floor(bitLen / Math.pow(2, 8 * i)) & 0xff;
  }
  return ret;
};

// 压缩一个 64 字节的消息分组到摘要寄存器
const compress = (h :Uint32Array, block :Uint8Array) :void => {
  const W  = new Int32Array(68);
  const W1 = new Int32Array(64);

  // 将 16 个字 (大端) 载入 W[0..15]
  for(let i = 0; i < 16; i++) {
    W[i] = (block[i * 4] << 24) | (block[i * 4 + 1] << 16) | (block[i * 4 + 2] << 8) | block[i * 4 + 3];
  }
  // 扩展生成 W[16..67]
  for(let j = 16; j < 68; j++) {
    W[j] = (P1((W[j - 16] ^ W[j - 9] ^ rotl(W[j - 3], 15)) >>> 0) ^ rotl(W[j - 13], 7) ^ W[j - 6]) >>> 0;
  }
  // 扩展生成 W'[0..63]
  for(let j = 0; j < 64; j++) {
    W1[j] = (W[j] ^ W[j + 4]) >>> 0;
  }

  let A = h[0], B = h[1], C = h[2], D = h[3];
  let E = h[4], F = h[5], G = h[6], H = h[7];

  for(let j = 0; j < 64; j++) {
    const T = (j < 16)? 0x79cc4519 : 0x7a879d8a;
    const SS1 = rotl((rotl(A, 12) + E + rotl(T, j % 32)) >>> 0, 7);
    const SS2 = (SS1 ^ rotl(A, 12)) >>> 0;
    const TT1 = (FF(A, B, C, j) + D + SS2 + W1[j]) >>> 0;
    const TT2 = (GG(E, F, G, j) + H + SS1 + W[j]) >>> 0;
    D = C; C = rotl(B, 9); B = A; A = TT1;
    H = G; G = rotl(F, 19); F = E; E = P0(TT2);
  }

  h[0] = (h[0] ^ A) >>> 0;
  h[1] = (h[1] ^ B) >>> 0;
  h[2] = (h[2] ^ C) >>> 0;
  h[3] = (h[3] ^ D) >>> 0;
  h[4] = (h[4] ^ E) >>> 0;
  h[5] = (h[5] ^ F) >>> 0;
  h[6] = (h[6] ^ G) >>> 0;
  h[7] = (h[7] ^ H) >>> 0;
};

// 计算字节数组的 SM3 摘要 (返回小写十六进制)
export function sm3Bytes(bytes :Uint8Array) :string {
  const data = padding(bytes);
  const h = new Uint32Array(IV);
  for(let i = 0; i < data.length; i += 64) {
    compress(h, data.subarray(i, i + 64));
  }
  let hex = '';
  for(let i = 0; i < 8; i++) {
    hex += (h[i] >>> 0).toString(16).padStart(8, '0');
  }
  return hex;
}

// 计算字符串的 SM3 摘要 (按 UTF-8 编码, 返回小写十六进制)
export function sm3(text :string) :string {
  return sm3Bytes(new TextEncoder().encode(text));
}
