// SM2 国密椭圆曲线公钥密码 (GB/T 32918.4-2016)
// 纯 JS 实现 (BigInt + SM3), 曲线参数与 sm-crypto / OpenSSL 一致:
//   p = FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFF
// 密钥: 私钥 d = 64 位 HEX (1..n-1); 公钥 = '04' + x(64) + y(64) 未压缩点
// 密文格式: C1(未压缩点 65B) || C3(SM3 32B) || C2(与明文等长)  HEX 输出 (C1C3C2, 对应 sm-crypto cipherMode=1)

import { sm3Bytes } from '../Hash/sm3';

// -------- 曲线参数 (SM2 素域) --------
const P = 0xFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFFn;
const A = 0xFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFCn;
const B = 0x28E9FA9E9D9F5E344D5A9E4BCF6509A7F39789F515AB8F92DDBCBD414D940E93n;
const N = 0xFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFF7203DF6B21C6052B53BBF40939D54123n;
const GX = 0x32C4AE2C1F1981195F9904466A39C9948FE30BBFF2660BE1715A4589334C74C7n;
const GY = 0xBC3736A2F4F6779C59BDCEE36B692153D0A9877CC62A474002DF32E52139F0A0n;

const mod = (x :bigint) :bigint => ((x % P) + P) % P;
const inv = (x :bigint) :bigint => {
  // 费马小定理求逆 (P 为素数)
  let a = mod(x);
  let e = P - 2n;
  let r = 1n;
  while (e > 0n) {
    if (e & 1n) r = (r * a) % P;
    a = (a * a) % P;
    e >>= 1n;
  }
  return r;
};

type Point = { x: bigint; y: bigint } | null;

const pointDouble = (pt :Point) :Point => {
  if (pt === null) return null;
  const { x, y } = pt;
  if (y === 0n) return null;
  const lam = mod((3n * x * x + A) * inv(2n * y));
  const x3 = mod(lam * lam - 2n * x);
  const y3 = mod(lam * (x - x3) - y);
  return { x: x3, y: y3 };
};

const pointAdd = (p1 :Point, p2 :Point) :Point => {
  if (p1 === null) return p2;
  if (p2 === null) return p1;
  if (p1.x === p2.x) {
    return (p1.y + p2.y) % P === 0n ? null : pointDouble(p1);
  }
  const lam = mod((p2.y - p1.y) * inv(p2.x - p1.x));
  const x3 = mod(lam * lam - p1.x - p2.x);
  const y3 = mod(lam * (p1.x - x3) - p1.y);
  return { x: x3, y: y3 };
};

const pointMul = (k :bigint, pt :Point) :Point => {
  let result :Point = null;
  let addend :Point = pt;
  let bits = k;
  while (bits > 0n) {
    if (bits & 1n) result = pointAdd(result, addend);
    addend = pointDouble(addend);
    bits >>= 1n;
  }
  return result;
};

const onCurve = (pt :Point) :boolean => {
  if (pt === null) return false;
  const { x, y } = pt;
  return mod(y * y - (x * x * x + A * x + B)) === 0n;
};

// -------- 字节/HEX 工具 --------
const toBigInt = (hex :string) :bigint => BigInt('0x' + hex.replace(/^0x/i, ''));
const padHex = (v :bigint, len :number) :string => v.toString(16).padStart(len, '0');

const hexToBytes = (hex :string) :Uint8Array => {
  const h = hex.trim().replace(/\s+/g, '').replace(/^0x/i, '');
  if (h.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(h)) throw new Error('HEX 内容不合法');
  const bytes = new Uint8Array(h.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return bytes;
};

const bytesToHex = (bytes :Uint8Array) :string =>
  Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');

const concat = (...parts :Uint8Array[]) :Uint8Array => {
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) { out.set(p, off); off += p.length; }
  return out;
};

const randomInRange = () :bigint => {
  // 均匀取 [1, n-1]
  while (true) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    let x = 0n;
    for (const b of bytes) x = (x << 8n) | BigInt(b);
    if (x >= 1n && x < N) return x;
  }
};

const bigToBytes = (v :bigint, len :number) :Uint8Array => {
  const bytes = new Uint8Array(len);
  let x = v;
  for (let i = len - 1; i >= 0; i--) { bytes[i] = Number(x & 0xffn); x >>= 8n; }
  return bytes;
};

// -------- KDF (GM/T 0003.2-2012 5.4.3, SM3) --------
const kdf = (z :Uint8Array, outBytes :number) :Uint8Array => {
  const out = new Uint8Array(outBytes);
  let off = 0;
  let ct = 1;
  while (off < outBytes) {
    const block = concat(z, new Uint8Array([(ct >>> 24) & 0xff, (ct >>> 16) & 0xff, (ct >>> 8) & 0xff, ct & 0xff]));
    const digest = hexToBytes(sm3Bytes(block));
    const need = Math.min(digest.length, outBytes - off);
    out.set(digest.subarray(0, need), off);
    off += need;
    ct += 1;
  }
  return out;
};

const xorBytes = (a :Uint8Array, b :Uint8Array) :Uint8Array => {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] ^ b[i];
  return out;
};

// -------- 密钥对 --------

/** 生成密钥对: { privateKey: d 的 64 位 HEX, publicKey: '04'||x||y } */
export const generateSm2KeyPair = () :{ privateKey: string; publicKey: string } => {
  const d = randomInRange();
  const pub = pointMul(d, { x: GX, y: GY });
  if (pub === null) throw new Error('生成失败');
  return { privateKey: padHex(d, 64), publicKey: '04' + padHex(pub.x, 64) + padHex(pub.y, 64) };
};

/** 由私钥推导公钥 */
export const derivePublicKey = (privateHex :string) :string => {
  const d = toBigInt(privateHex);
  if (d < 1n || d >= N) throw new Error('私钥超出合法范围 [1, n-1]');
  const pub = pointMul(d, { x: GX, y: GY });
  if (pub === null) throw new Error('推导失败');
  return '04' + padHex(pub.x, 64) + padHex(pub.y, 64);
};

/** 解析公钥 '04'||x||y, 校验点在曲线上 */
const parsePublic = (publicHex :string) :Point => {
  const h = publicHex.trim().replace(/\s+/g, '').replace(/^0x/i, '');
  if (!/^04[0-9a-fA-F]{128}$/.test(h)) throw new Error('公钥不合法: 需要 04||X(64)||Y(64) 未压缩格式');
  const pt = { x: toBigInt(h.slice(2, 66)), y: toBigInt(h.slice(66)) };
  if (!onCurve(pt)) throw new Error('公钥点不在 SM2 曲线上');
  return pt;
};

// -------- 加密 (C1C3C2) --------

/**
 * SM2 公钥加密
 * @param data 明文字节
 * @param publicHex 公钥 04||x||y
 * @param k 可选指定随机数 k (测试用); 默认随机
 */
export const sm2EncryptBytes = (data :Uint8Array, publicHex :string, k? :bigint) :string => {
  const pub = parsePublic(publicHex);
  const rand = k !== undefined ? k : randomInRange();
  const c1 = pointMul(rand, { x: GX, y: GY });           // C1 = kG
  const s = pointMul(rand, pub);                          // (x2, y2) = kP
  if (c1 === null || s === null) throw new Error('加密失败');
  const z = concat(bigToBytes(s.x, 32), bigToBytes(s.y, 32));
  const t = kdf(z, data.length);
  const c2 = xorBytes(data, t);
  const c3 = hexToBytes(sm3Bytes(concat(bigToBytes(s.x, 32), data, bigToBytes(s.y, 32))));
  // 输出 C1(裸 x||y, 与 sm-crypto 互操作) || C3(32) || C2
  return bytesToHex(concat(
    bigToBytes(c1.x, 32),
    bigToBytes(c1.y, 32),
    c3,
    c2,
  ));
};

/**
 * SM2 私钥解密 (验证 C3 = SM3(x2||M||y2))
 * @param cipherHex C1C3C2 HEX 密文 (可带 04 前缀的 C1)
 * @param privateHex 私钥 d 64 位 HEX
 */
export const sm2DecryptBytes = (cipherHex :string, privateHex :string) :Uint8Array => {
  const d = toBigInt(privateHex);
  if (d < 1n || d >= N) throw new Error('私钥超出合法范围 [1, n-1]');
  const c = hexToBytes(cipherHex);
  // C1 支持两种编码: 带 04 前缀 (04||x||y) 与裸 x||y (sm-crypto 风格)
  const prefix = c.length > 0 && c[0] === 0x04;
  const xOff = prefix ? 1 : 0;
  const c1Len = prefix ? 65 : 64;
  if (c.length < c1Len + 32 + 1) throw new Error('密文格式不合法: 需要 C1(04||x||y 或 x||y) || C3(32) || C2');
  const c1 = { x: bigFromBytes(c, xOff), y: bigFromBytes(c, xOff + 32) };
  if (!onCurve(c1)) {
    // 首字节恰好是 04 的裸点情形
    if (prefix && c.length >= 64 + 32 + 1) {
      const alt = { x: bigFromBytes(c, 0), y: bigFromBytes(c, 32) };
      if (onCurve(alt)) {
        const m2 = finishDecrypt(d, alt, c.subarray(64 + 32), c.subarray(64, 64 + 32));
        return m2;
      }
    }
    throw new Error('密文 C1 点不在曲线上');
  }
  return finishDecrypt(d, c1, c.subarray(c1Len + 32), c.subarray(c1Len, c1Len + 32));
};

const finishDecrypt = (d :bigint, c1 :{ x: bigint; y: bigint }, c2 :Uint8Array, c3Part :Uint8Array) :Uint8Array => {
  const s = pointMul(d, c1); // (x2, y2) = d*C1 = kP
  if (s === null) throw new Error('解密失败');
  const z = concat(bigToBytes(s.x, 32), bigToBytes(s.y, 32));
  const t = kdf(z, c2.length);
  const m = xorBytes(c2, t);
  const c3Got = sm3Bytes(concat(bigToBytes(s.x, 32), m, bigToBytes(s.y, 32)));
  const c3Want = bytesToHex(c3Part);
  if (c3Got !== c3Want) throw new Error('校验失败: C3 不匹配 (密钥错误或密文被篡改)');
  return m;
};

const bigFromBytes = (bytes :Uint8Array, off :number) :bigint => {
  let x = 0n;
  for (let i = off; i < off + 32; i++) x = (x << 8n) | BigInt(bytes[i]);
  return x;
};

const enc = new TextEncoder();
const dec = new TextDecoder();

/** SM2 加密文本 -> HEX 密文 */
export const sm2EncryptText = (plain :string, publicHex :string) :string =>
  sm2EncryptBytes(enc.encode(plain), publicHex);

/** SM2 解密 HEX 密文 -> 文本 */
export const sm2DecryptText = (cipherHex :string, privateHex :string) :string =>
  dec.decode(sm2DecryptBytes(cipherHex, privateHex));

export { hexToBytes, bytesToHex };

// -------- 默认密钥 (设置页共用同一 localStorage 槽位) --------
const DEFAULT_PUBLIC_KEY_ITEM = 'sm2-crypto:default-public-key';

/** 获取默认公钥 (04||X||Y HEX) */
export function getDefaultPublicKey() :string {
  return localStorage.getItem(DEFAULT_PUBLIC_KEY_ITEM) ?? '';
}

/** 保存默认公钥 */
export function setDefaultPublicKey(pub :string) :void {
  localStorage.setItem(DEFAULT_PUBLIC_KEY_ITEM, pub);
}

const DEFAULT_PRIVATE_KEY_ITEM = 'sm2-crypto:default-private-key';

/** 获取默认私钥 (64 位 HEX) */
export function getDefaultPrivateKey() :string {
  return localStorage.getItem(DEFAULT_PRIVATE_KEY_ITEM) ?? '';
}

/** 保存默认私钥 */
export function setDefaultPrivateKey(pri :string) :void {
  localStorage.setItem(DEFAULT_PRIVATE_KEY_ITEM, pri);
}

/** 是否已配置完整的默认密钥对 */
export function hasDefaultKeyPair() :boolean {
  return getDefaultPublicKey().trim() !== '' && getDefaultPrivateKey().trim() !== '';
}
