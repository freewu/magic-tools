import CryptoJS from 'crypto-js';

// ---------------- Base32 (RFC 4648) ----------------

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** Base32 文本 -> 字节 (容忍空格/-/小写, 支持尾部 '=' padding; 非字母字符抛错) */
export const base32ToBytes = (secret :string) :Uint8Array => {
  let s = secret.toUpperCase().replace(/[\s-]/gu, '');
  // 去掉尾部 padding, 若中间还夹着 '=' 则非法
  const padStart = s.indexOf('=');
  if (padStart !== -1) {
    if (!/^=+$/u.test(s.slice(padStart))) throw new Error('Base32 的 "=" 只能出现在末尾');
    s = s.slice(0, padStart);
  }
  if (s === '') throw new Error('密钥不能为空');
  const out :number[] = [];
  let acc = 0;
  let bits = 0;
  for (const ch of s) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error(`非法 Base32 字符 "${ch}" (仅 A-Z 2-7)`);
    acc = (acc << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((acc >>> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
};

/** 字节 -> Base32 (无 padding, 大写) */
export const bytesToBase32 = (bytes :Uint8Array) :string => {
  let out = '';
  let acc = 0;
  let bits = 0;
  for (const byte of bytes) {
    acc = (acc << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += BASE32_ALPHABET[(acc >>> bits) & 31];
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(acc << (5 - bits)) & 31];
  return out;
};

// ---------------- 字节 <-> crypto-js WordArray ----------------

export const bytesToWordArray = (bytes :Uint8Array) => {
  const words :number[] = [];
  for (let i = 0; i < bytes.length; i += 4) {
    words.push(
      ((bytes[i] ?? 0) << 24) |
      ((bytes[i + 1] ?? 0) << 16) |
      ((bytes[i + 2] ?? 0) << 8) |
      (bytes[i + 3] ?? 0)
    );
  }
  return CryptoJS.lib.WordArray.create(words, bytes.length);
};

const wordArrayToBytes = (wa :CryptoJS.lib.WordArray) :Uint8Array => {
  const out = new Uint8Array(wa.sigBytes);
  for (let i = 0; i < wa.sigBytes; i++) {
    out[i] = (wa.words[i >>> 2] >>> (24 - ((i % 4) << 3))) & 0xff;
  }
  return out;
};

/** 8 字节大端计数器消息 */
const counterToBytes = (counter :number) :Uint8Array => {
  if (!Number.isInteger(counter) || counter < 0) throw new Error('计数器必须是非负整数');
  const b = new Uint8Array(8);
  const hi = Math.floor(counter / 0x100000000);
  const lo = counter >>> 0;
  b[0] = (hi >>> 24) & 0xff; b[1] = (hi >>> 16) & 0xff;
  b[2] = (hi >>> 8) & 0xff; b[3] = hi & 0xff;
  b[4] = (lo >>> 24) & 0xff; b[5] = (lo >>> 16) & 0xff;
  b[6] = (lo >>> 8) & 0xff; b[7] = lo & 0xff;
  return b;
};

// ---------------- HOTP / TOTP (RFC 4226 / RFC 6238) ----------------

export type OtpAlgorithm = 'SHA1' | 'SHA256' | 'SHA512';

export interface OtpOptions {
  digits?: number;        // 6~8
  period?: number;        // TOTP 时间步长 (秒), 默认 30
  algorithm?: OtpAlgorithm;
}

const hmacRaw = (algorithm :OtpAlgorithm, key :Uint8Array, msg :Uint8Array) :Uint8Array => {
  const waKey = bytesToWordArray(key);
  const waMsg = bytesToWordArray(msg);
  let mac :CryptoJS.lib.WordArray;
  if (algorithm === 'SHA256') mac = CryptoJS.HmacSHA256(waMsg, waKey);
  else if (algorithm === 'SHA512') mac = CryptoJS.HmacSHA512(waMsg, waKey);
  else mac = CryptoJS.HmacSHA1(waMsg, waKey);
  return wordArrayToBytes(mac);
};

/** HMAC + 动态截断 (RFC 4226 §5.3) -> 未补齐的数字 */
const dynamicTruncate = (hs :Uint8Array) :number => {
  const offset = hs[hs.length - 1] & 0x0f;
  const bin =
    ((hs[offset] & 0x7f) << 24) |
    ((hs[offset + 1] & 0xff) << 16) |
    ((hs[offset + 2] & 0xff) << 8) |
    (hs[offset + 3] & 0xff);
  return bin >>> 0;
};

const hotpFromCounter = (secretBytes :Uint8Array, counter :number, opt :OtpOptions) :string => {
  const digits = opt.digits ?? 6;
  if (!Number.isInteger(digits) || digits < 6 || digits > 8) throw new Error('位数需为 6~8');
  const hs = hmacRaw(opt.algorithm ?? 'SHA1', secretBytes, counterToBytes(counter));
  const code = dynamicTruncate(hs) % Math.pow(10, digits);
  return String(code).padStart(digits, '0');
};

/** HOTP: secret 为 Base32 文本 */
export const hotp = (secret :string, counter :number, opt :OtpOptions = {}) :string => {
  const secretBytes = base32ToBytes(secret);
  return hotpFromCounter(secretBytes, counter, opt);
};

/** TOTP: secret 为 Base32 文本; time 为 Unix 秒, 默认当前时间 */
export const totp = (secret :string, opt :OtpOptions & { time?: number } = {}) :string => {
  const period = opt.period ?? 30;
  if (!Number.isInteger(period) || period <= 0) throw new Error('时间步长需为正整数');
  const now = opt.time ?? Math.floor(Date.now() / 1000);
  return hotp(secret, Math.floor(now / period), opt);
};

/** TOTP 当前步的剩余秒数 */
export const totpRemaining = (time = Date.now() / 1000, period = 30) :number =>
  period - (Math.floor(time) % period);

/** 随机 Base32 密钥 (默认 20 字节 -> 32 字符, Google/Microsoft Authenticator 兼容) */
export const randomBase32Secret = (bytes = 20) :string => {
  const wa = CryptoJS.lib.WordArray.random(bytes);
  const raw = new Uint8Array(bytes);
  for (let i = 0; i < bytes; i++) raw[i] = (wa.words[i >>> 2] >>> (24 - ((i % 4) << 3))) & 0xff;
  return bytesToBase32(raw);
};

// ---------------- otpauth:// URI ----------------

export interface OtpUriParams {
  type :'totp' | 'hotp';
  secret :string;         // Base32 (大小写均可, 自动转大写去空白)
  account :string;        // 账号 (label 主体)
  issuer ?:string;        // 发行方
  digits ?:number;
  period ?:number;
  algorithm ?:OtpAlgorithm;
  counter ?:number;       // HOTP 初始计数器
}

/** 构造 otpauth:// URI (可被 Authenticator 扫码导入) */
export const buildOtpUri = (p :OtpUriParams) :string => {
  const secret = p.secret.toUpperCase().replace(/[\s-]/gu, '');
  if (secret === '') throw new Error('密钥不能为空');
  const label = p.issuer && p.issuer.trim() !== ''
    ? `${p.issuer.trim()}:${p.account.trim()}`
    : p.account.trim();
  if (label === '') throw new Error('账号不能为空');
  const enc = (s :string) => encodeURIComponent(s);
  // otpauth label 为 issuer:account, 中间的冒号保留字面值, 两侧分别编码
  const labelPart = p.issuer && p.issuer.trim() !== ''
    ? `${enc(p.issuer.trim())}:${enc(p.account.trim())}`
    : enc(p.account.trim());
  const params = [ `secret=${secret}` ];
  if (p.issuer && p.issuer.trim() !== '') params.push(`issuer=${enc(p.issuer.trim())}`);
  params.push(`algorithm=${p.algorithm ?? 'SHA1'}`);
  params.push(`digits=${p.digits ?? 6}`);
  if (p.type === 'totp') {
    params.push(`period=${p.period ?? 30}`);
  } else {
    params.push(`counter=${p.counter ?? 0}`);
  }
  return `otpauth://${p.type}/${labelPart}?${params.join('&')}`;
};
