// JWT 编解码器 (RFC 7519)
// 解析: 仅做结构与 base64url 解码, 不校验签名
// 生成: HS256 / HS384 / HS512 (HMAC) 与 none, 签名用 crypto-js 的 HMAC 实现

import HmacSHA256 from 'crypto-js/hmac-sha256';
import HmacSHA384 from 'crypto-js/hmac-sha384';
import HmacSHA512 from 'crypto-js/hmac-sha512';
import Base64url from 'crypto-js/enc-base64url';

export type JwtPart = {
  raw: string;             // base64url 原文
  text: string;            // 解码后的 UTF-8 文本
  json: Record<string, unknown> | null; // JSON 解析结果 (失败为 null)
};

export type JwtDecodeResult = {
  ok: boolean;
  header?: JwtPart;
  payload?: JwtPart;
  signature?: string;      // base64url 签名 -> hex
  signatureRaw?: string;   // 原 base64url 签名
  error?: string;
};

const BASE64URL_RE = /^[A-Za-z0-9_-]*$/;

// base64 单字符 -> 6bit 值
const idx = (c :string) :number => {
  const code = c.charCodeAt(0);
  if (code >= 65 && code <= 90) return code - 65;        // A-Z
  if (code >= 97 && code <= 122) return code - 97 + 26;  // a-z
  if (code >= 48 && code <= 57) return code - 48 + 52;   // 0-9
  if (code === 43) return 62;                            // +
  if (code === 47) return 63;                            // /
  return 0;
};

// base64url -> 字节数组 (支持无填充的 JWT 段)
const base64UrlToBytes = (s :string) :number[] => {
  const out :number[] = [];
  const b = s.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b.length % 4 === 0 ? b : b + '='.repeat(4 - (b.length % 4));
  for (let i = 0; i < padded.length; i += 4) {
    const c0 = padded[i];
    const c1 = padded[i + 1];
    const c2 = padded[i + 2];
    const c3 = padded[i + 3];
    if (c0 === '=') break;
    let v = (idx(c0) << 18) | (idx(c1) << 12);
    out.push((v >> 16) & 0xff); // 字节 1 (c0 全部 + c1 高 2 位)
    if (c2 === undefined || c2 === '=') continue;
    v |= idx(c2) << 6;
    out.push((v >> 8) & 0xff); // 字节 2 (c1 低 4 位 + c2 高 4 位)
    if (c3 === undefined || c3 === '=') continue;
    v |= idx(c3);
    out.push(v & 0xff); // 字节 3 (c2 低 2 位 + c3 全部)
  }
  return out;
};

const bytesToHex = (bytes :number[]) :string =>
  bytes.map((b) => b.toString(16).padStart(2, '0')).join('');

// base64url 段解码: 成功返回 JwtPart, 失败抛 Error
const decodePart = (raw :string, label :string) :JwtPart => {
  if (!BASE64URL_RE.test(raw)) {
    throw new Error(`${label}不是合法的 base64url (仅允许 A-Z a-z 0-9 - _)`);
  }
  const bytes = base64UrlToBytes(raw);
  const text = new TextDecoder('utf-8', { fatal: false }).decode(Uint8Array.from(bytes));
  let json :Record<string, unknown> | null = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null; // 头部/负载可能不是 JSON
  }
  return { raw, text, json };
};

// 解析完整 JWT; ok=false 时 error 说明原因
export const jwtDecode = (token :string) :JwtDecodeResult => {
  const t = token.trim();
  if (t === '') return { ok: false, error: '请输入 JWT' };
  const parts = t.split('.');
  if (parts.length !== 3) {
    return { ok: false, error: `JWT 应由 3 段 (header.payload.signature) 组成, 当前 ${parts.length} 段` };
  }
  const [h, p, s] = parts;
  if (h === '' || p === '') {
    return { ok: false, error: 'JWT 头部/负载为空' };
  }
  try {
    const header = decodePart(h, '头部 (header)');
    const payload = decodePart(p, '负载 (payload)');
    return {
      ok: true,
      header,
      payload,
      signatureRaw: s,
      signature: s === '' ? '' : bytesToHex(base64UrlToBytes(s)),
    };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};

// JSON 部分格式化显示 (非 JSON 则原样)
export const partText = (p :JwtPart) :string => {
  if (p.json) return JSON.stringify(p.json, null, 2);
  return p.text;
};

// ---------- 生成 (编码) ----------

/** 支持的签名算法 (HMAC 系列 + 不签名) */
export type JwtAlg = 'HS256' | 'HS384' | 'HS512' | 'none';

export type JwtEncodeResult = {
  ok: boolean;
  token?: string;          // 完整 JWT
  headerB64?: string;      // 头部 base64url
  payloadB64?: string;     // 负载 base64url
  signatureB64?: string;   // 签名 base64url (alg=none 时为空)
  signatureHex?: string;   // 签名 HEX (alg=none 时为空)
  error?: string;
};

// 字节数组 -> base64url (无填充), 与上方 base64UrlToBytes 互为逆向
const BASE64URL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
export const base64UrlEncodeBytes = (bytes :Uint8Array) :string => {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : undefined;
    out += BASE64URL_CHARS[b0 >> 2];
    out += BASE64URL_CHARS[((b0 & 0x03) << 4) | ((b1 ?? 0) >> 4)];
    if (b1 === undefined) break;
    out += BASE64URL_CHARS[((b1 & 0x0f) << 2) | ((b2 ?? 0) >> 6)];
    if (b2 === undefined) break;
    out += BASE64URL_CHARS[b2 & 0x3f];
  }
  return out;
};

// UTF-8 文本 -> base64url
export const base64UrlEncodeText = (text :string) :string =>
  base64UrlEncodeBytes(new TextEncoder().encode(text));

// 待解析的 JSON 对象文本 -> 对象 (非对象/非法 JSON 抛错)
const parseJsonObject = (text :string, label :string) :Record<string, unknown> => {
  const s = text.trim();
  if (s === '') throw new Error(`${label}不能为空`);
  let v :unknown;
  try {
    v = JSON.parse(s);
  } catch (err) {
    throw new Error(`${label}不是合法 JSON: ${(err as Error).message}`);
  }
  if (typeof v !== 'object' || v === null || Array.isArray(v)) {
    throw new Error(`${label}必须是 JSON 对象`);
  }
  return v as Record<string, unknown>;
};

// Base64 / base64url 密钥 -> WordArray (非法返回 null)
const parseBase64Key = (secret :string) :ReturnType<typeof Base64url.parse> | null => {
  const s = secret.trim().replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  if (s === '' || s.length % 4 === 1 || !/^[A-Za-z0-9_-]+$/.test(s)) return null;
  return Base64url.parse(s);
};

/**
 * 生成 JWT
 * @param headerText   头部 JSON 文本 (其 alg 会被 alg 参数覆盖)
 * @param payloadText  负载 JSON 文本
 * @param secret       签名密钥 (alg=none 时忽略)
 * @param alg          签名算法
 * @param secretIsBase64 密钥是否按 Base64 解码为字节
 */
export const jwtEncode = (
  headerText :string,
  payloadText :string,
  secret :string,
  alg :JwtAlg,
  secretIsBase64 = false,
) :JwtEncodeResult => {
  let header :Record<string, unknown>;
  let payload :Record<string, unknown>;
  try {
    header = parseJsonObject(headerText, '头部 (header)');
    payload = parseJsonObject(payloadText, '负载 (payload)');
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }

  if (alg !== 'none' && secret === '') {
    return { ok: false, error: '请输入密钥 (secret)' };
  }

  const headerB64 = base64UrlEncodeText(JSON.stringify({ ...header, alg }));
  const payloadB64 = base64UrlEncodeText(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  let signatureB64 = '';
  if (alg !== 'none') {
    let key :string | ReturnType<typeof Base64url.parse> = secret;
    if (secretIsBase64) {
      const wa = parseBase64Key(secret);
      if (wa === null) return { ok: false, error: '密钥不是合法的 Base64' };
      key = wa;
    }
    const hmac =
      alg === 'HS256' ? HmacSHA256(signingInput, key) :
      alg === 'HS384' ? HmacSHA384(signingInput, key) :
      HmacSHA512(signingInput, key);
    signatureB64 = Base64url.stringify(hmac);
  }

  return {
    ok: true,
    headerB64,
    payloadB64,
    signatureB64,
    signatureHex: signatureB64 === '' ? '' : bytesToHex(base64UrlToBytes(signatureB64)),
    token: `${signingInput}.${signatureB64}`,
  };
};
