// JWT 解码器 (RFC 7519)
// 仅做结构与 base64url 解码, 不校验签名

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
