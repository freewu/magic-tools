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

// ---------- IPv4 -> IPv6 各种写法 ----------

/** IPv6 写法: compressed = RFC 5952 压缩; full = 8 组完整展开; mixed = 末尾 32 位写成点分 IPv4 */
export type Ipv6Style = 'compressed' | 'full' | 'mixed';

/** 一组 16 位的十六进制 (小写, 去前导零) */
const groupHex = (v :number) :string => (v & 0xffff).toString(16);

/** 找出最长的连续 0 段 (长度 >= 2; 并列时取最靠左的一段) */
const longestZeroRun = (groups :number[]) :{ start :number; len :number } => {
  let best :{ start :number; len :number } = { start: -1, len: 0 };
  let i = 0;
  while (i < groups.length) {
    if (groups[i] !== 0) { i += 1; continue; }
    let j = i;
    while (j < groups.length && groups[j] === 0) j += 1;
    const len = j - i;
    if (len > best.len) best = { start: i, len }; // 严格大于 -> 并列时保留靠左的一段
    i = j;
  }
  return best.len >= 2 ? best : { start: -1, len: 0 };
};

/**
 * 按 RFC 5952 压缩 8 组 16 位分组:
 * - 字母小写, 每组去掉前导零
 * - 最长的连续 0 段 (>= 2 组) 压缩成 `::`, 并列时压缩靠左的一段
 * - 全 0 地址压缩成 `::`
 */
export const compressIpv6 = (groups :number[]) :string => {
  const hex = groups.map(groupHex);
  const run = longestZeroRun(groups);
  if (run.start < 0) return hex.join(':');
  const head = hex.slice(0, run.start).join(':');
  const tail = hex.slice(run.start + run.len).join(':');
  return `${head}::${tail}`;
};

/** 8 组分组 -> 点分 IPv4 (取最后两组) */
const dottedOf = (groups :number[]) :string => {
  const hi = groups[6] & 0xffff;
  const lo = groups[7] & 0xffff;
  return `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
};

/** 8 组 16 位分组 -> 指定写法的 IPv6 文本 (不足 8 组按 0 补齐) */
export const formatIpv6 = (groups :number[], style :Ipv6Style = 'compressed') :string => {
  const g = [ ...groups ];
  while (g.length < 8) g.push(0);
  const padded = g.slice(0, 8).map((v) => v & 0xffff);
  if (style === 'full') return padded.map((v) => groupHex(v).padStart(4, '0')).join(':');
  if (style === 'mixed') {
    const head = compressIpv6(padded.slice(0, 6));
    // head 以 :: 结尾时不再补冒号, 否则会出现三连冒号
    return head.endsWith('::') ? `${head}${dottedOf(padded)}` : `${head}:${dottedOf(padded)}`;
  }
  return compressIpv6(padded);
};

/** 由 IPv4 整数拆出高/低两个 16 位分组 */
const ipv4Groups = (ip :string) :{ hi :number; lo :number } => {
  const v = ipv4ToInt(ip);
  return { hi: (v >>> 16) & 0xffff, lo: v & 0xffff };
};

/** 一条 IPv4 对应的 IPv6 写法 (key 为语言包词条键) */
export interface Ipv6Form { key :string; value :string }

/**
 * 把 IPv4 地址换算成几种常见的 IPv6 写法 (非法地址抛错):
 * - IPv4 映射地址 ::ffff:0:0/96 (最常见的 v4/v6 共存写法)
 * - IPv4 兼容地址 ::/96 (已废弃, 仅作对照)
 * - 6to4 2002::/16 (IPv4 嵌在地址前 32 位)
 * - NAT64 / DNS64 64:ff9b::/96 (IPv4 嵌在最后 32 位)
 * - 完整展开 (把压缩的 :: 写全, 便于逐段核对)
 */
export const ipv4ToIpv6Forms = (ip :string) :Ipv6Form[] => {
  const { hi, lo } = ipv4Groups(ip);
  const zero5 = [ 0, 0, 0, 0, 0 ];
  const mapped = [ ...zero5, 0xffff, hi, lo ];
  const compat = [ ...zero5, 0, hi, lo ];
  const sixToFour = [ 0x2002, hi, lo, 0, 0, 0, 0, 0 ];
  const nat64 = [ 0x64, 0xff9b, 0, 0, 0, 0, hi, lo ];
  return [
    { key: 'ipv6Mapped', value: formatIpv6(mapped, 'mixed') },
    { key: 'ipv6MappedHex', value: formatIpv6(mapped, 'compressed') },
    { key: 'ipv6Compat', value: formatIpv6(compat, 'mixed') },
    { key: 'ipv6SixToFour', value: formatIpv6(sixToFour, 'compressed') },
    { key: 'ipv6Nat64', value: formatIpv6(nat64, 'mixed') },
    { key: 'ipv6Full', value: formatIpv6(mapped, 'full') },
  ];
};

/** 安全版: 非法地址返回空数组, 便于界面直接渲染 */
export const ipv4ToIpv6FormsSafe = (ip :string) :Ipv6Form[] => {
  try { return ipv4ToIpv6Forms(ip); } catch { return []; }
};
