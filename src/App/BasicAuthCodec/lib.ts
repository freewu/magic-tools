import { Base64 as B64 } from 'js-base64';

// ---------- 编码 ----------
// 用户名:密码 -> Base64 token (RFC 7617, UTF-8 文本)
export const basicAuthToken = (username :string, password :string) :string =>
  B64.encode(`${username}:${password}`);

// 用户名:密码 -> 完整请求头行 "Authorization: Basic xxx"
export const basicAuthHeader = (username :string, password :string) :string =>
  `Authorization: Basic ${basicAuthToken(username, password)}`;

// ---------- 解码 ----------
export type BasicAuthCredential = {
  username :string;
  password :string; // 密码段可含冒号 (首个冒号分隔)
  token :string;    // 还原出的 Base64 token
};

const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

// 解析输入: 支持完整请求头 "Authorization: Basic xxx" / "Basic xxx" / 裸 token
// 解析失败抛 Error
export const parseBasicAuth = (input :string) :BasicAuthCredential => {
  let s = input.trim();
  if (s === '') throw new Error('输入为空');
  // 容忍携带 HTTP 请求头片段: "authorization: basic xxx" (含换行后残余忽略)
  s = s.replace(/^\s*[Aa]uthorization\s*:\s*/u, '');
  s = s.replace(/^[Bb]asic\s+/, '');
  s = s.trim();
  // 容忍粘贴多行文本时头部行后带换行 (取首行)
  s = s.split(/\r?\n/)[0].trim();
  if (s === '') throw new Error('未找到 Base64 凭据');
  if (!BASE64_RE.test(s) || s.length % 4 === 1) throw new Error('无效的 Base64 凭据');
  let decoded = '';
  try {
    decoded = B64.decode(s);
  } catch {
    throw new Error('Base64 解码失败');
  }
  const idx = decoded.indexOf(':');
  if (idx < 0) throw new Error('解码内容缺少 "用户名:密码" 分隔冒号');
  return {
    username: decoded.slice(0, idx),
    password: decoded.slice(idx + 1),
    token: s,
  };
};

export const isValidBasicAuth = (input :string) :boolean => {
  try { parseBasicAuth(input); return true; } catch { return false; }
};
