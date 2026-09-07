// ---------- IPv4 <-> 整数互转 ----------

export const IP_INT_MAX = 0xffffffff;

/** 校验 IPv4 文本并返回数字 (大端/网络序组装, 0.0.0.0 -> 0) */
export const ipv4ToInt = (ip :string) :number => {
  const text = ip.trim();
  const parts = text.split('.');
  if (parts.length !== 4) throw new Error('IPv4 需为 4 段, 如 192.168.1.1');
  let v = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/u.test(p)) throw new Error(`非法网段 "${p}": 需为 0~255 的整数`);
    const n = parseInt(p, 10);
    if (n > 255) throw new Error(`非法网段 "${p}": 超出 255`);
    v = v * 256 + n;
  }
  return v;
};

export const ipv4Valid = (ip :string) :boolean => {
  try { ipv4ToInt(ip); return true; } catch { return false; }
};

/** 整数 -> IPv4 点分文本 (支持十进制 / 0x 十六进制 / 0b 二进制字符串) */
export const intToIpv4 = (intText :string) :string => {
  const v = parseIntText(intText);
  const a = v >>> 24, b = (v >>> 16) & 0xff, c = (v >>> 8) & 0xff, d = v & 0xff;
  return `${a}.${b}.${c}.${d}`;
};

export const intToIpv4Number = (v :number) :string => {
  if (!Number.isInteger(v) || v < 0 || v > IP_INT_MAX) throw new Error('整数需为 0 ~ 4294967295 (2^32-1)');
  const a = v >>> 24, b = (v >>> 16) & 0xff, c = (v >>> 8) & 0xff, d = v & 0xff;
  return `${a}.${b}.${c}.${d}`;
};

/** 解析整数文本: 支持十进制, 0x 前缀十六进制 (亦可 0b 二进制); 忽略首尾空格 */
export const parseIntText = (intText :string) :number => {
  const text = intText.trim();
  if (text === '') throw new Error('整数不能为空');
  let v :number;
  if (/^0[xX][0-9a-fA-F]+$/u.test(text)) {
    v = parseInt(text.slice(2), 16);
  } else if (/^0[bB][01]+$/u.test(text)) {
    v = parseInt(text.slice(2), 2);
  } else if (/^\d+$/u.test(text)) {
    v = parseInt(text, 10);
  } else {
    throw new Error('整数需为十进制或 0x 十六进制');
  }
  if (!Number.isInteger(v) || v < 0 || v > IP_INT_MAX) throw new Error(`整数需在 0 ~ ${IP_INT_MAX} (2^32-1) 范围内`);
  return v;
};

export const intTextValid = (intText :string) :boolean => {
  try { parseIntText(intText); return true; } catch { return false; }
};

/** 整数 -> 8 位十六进制 (无 0x 前缀, 大写) */
export const intToHex = (intText :string) :string =>
  parseIntText(intText).toString(16).toUpperCase().padStart(8, '0');

/** 整数 -> 32 位二进制字符串 */
export const intToBin = (intText :string) :string =>
  parseIntText(intText).toString(2).padStart(32, '0');
