// CSR 申请文件 (PKCS#10 证书签名请求) 生成
// - 私钥与 CSR 全部用 WebCrypto (crypto.subtle) 在本机生成, 不上传任何服务器
// - DER/ASN.1 编码为手写实现 (只覆盖 CSR 所需结构), 因此无需引入额外依赖,
//   并且与「RSA 加解密」一样直接复用浏览器原生 WebCrypto (密钥生成速度快, 大位长不卡界面)
// - 结构: CertificationRequest = SEQ{ CertificationRequestInfo, AlgorithmIdentifier, BIT STRING }
//         CertificationRequestInfo = SEQ{ version, subject, subjectPKInfo, attributes[0] }
//   扩展仅包含 SAN (subjectAltName, DNS / IP), 由 attributes 里的 extensionRequest 携带

// -------- 常量 --------

/** 支持的 RSA 位数 */
export type CsrKeyBits = 2048 | 3072 | 4096;
/** 私钥输出格式: PKCS#8 (-----BEGIN PRIVATE KEY-----) / PKCS#1 (-----BEGIN RSA PRIVATE KEY-----) */
export type PrivateKeyFormat = 'pkcs8' | 'pkcs1';

/** 签名算法 (SHA-256 + RSASSA-PKCS1-v1_5) */
export const SIGN_ALGORITHM = 'sha256WithRSAEncryption';

/** X.509 用到的 OID */
const OID = {
  commonName: '2.5.4.3',
  country: '2.5.4.6',
  locality: '2.5.4.7',
  state: '2.5.4.8',
  organization: '2.5.4.10',
  organizationalUnit: '2.5.4.11',
  emailAddress: '1.2.840.113549.1.9.1',
  extensionRequest: '1.2.840.113549.1.9.14',
  subjectAltName: '2.5.29.17',
  sha256WithRsa: '1.2.840.113549.1.1.11',
} as const;

// -------- 基础编解码 --------

const encoder = new TextEncoder();

/** 拼接多段字节 */
const cat = (...arrs: Uint8Array[]) :Uint8Array => {
  let total = 0;
  for (const a of arrs) total += a.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrs) { out.set(a, off); off += a.length; }
  return out;
};

/** ASCII 字符串 -> 字节 (非 ASCII 字符会被截断为低 8 位, 仅用于 IA5String / PrintableString) */
const asciiBytes = (s :string) :Uint8Array => {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
};

export const bytesToB64 = (bytes :Uint8Array) :string => {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};

export const b64ToBytes = (b64 :string) :Uint8Array => {
  const bin = atob(b64.replace(/\s+/g, ''));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

export const bytesToHex = (bytes :Uint8Array) :string =>
  Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');

/** 字节 -> 冒号分隔大写十六进制 (证书指纹惯用写法) */
export const bytesToHexColon = (bytes :Uint8Array) :string =>
  Array.from(bytes).map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(':');

/** DER 字节 -> PEM 文本 (每行 64 字符, 末尾带换行) */
export const derToPem = (der :Uint8Array, label :string) :string => {
  const b64 = bytesToB64(der);
  const lines = b64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----\n`;
};

/** PEM 文本 -> DER 字节 */
export const pemToDer = (pem :string, label :string) :Uint8Array => {
  const re = new RegExp(`-----BEGIN ${label}-----([\\s\\S]*?)-----END ${label}-----`);
  const m = pem.match(re);
  if (!m) throw new Error(`未找到 PEM 段 (-----BEGIN ${label}-----)`);
  return b64ToBytes(m[1]);
};

// -------- ASN.1 DER 编码 --------

/** DER 长度字段 */
const derLen = (n :number) :Uint8Array => {
  if (n < 0x80) return Uint8Array.of(n);
  const bytes :number[] = [];
  let x = n;
  while (x > 0) { bytes.unshift(x & 0xff); x = Math.floor(x / 256); }
  return Uint8Array.of(0x80 | bytes.length, ...bytes);
};

/** 通用 TLV (tag + 长度 + 内容) */
const tlv = (tag :number, content :Uint8Array) :Uint8Array =>
  cat(Uint8Array.of(tag), derLen(content.length), content);

const derSeq = (...items :Uint8Array[]) :Uint8Array => tlv(0x30, cat(...items));
const derSet = (...items :Uint8Array[]) :Uint8Array => tlv(0x31, cat(...items));

/** INTEGER (非负) */
const derInt = (n :number) :Uint8Array => {
  const bytes :number[] = [];
  let x = n;
  while (x > 0) { bytes.unshift(x & 0xff); x = Math.floor(x / 256); }
  if (bytes.length === 0) bytes.push(0);
  if (bytes[0] & 0x80) bytes.unshift(0); // 最高位为 1 时补 0, 避免被当作负数
  return tlv(0x02, Uint8Array.from(bytes));
};

/** OBJECT IDENTIFIER (点分十进制 -> DER) */
const derOid = (dotted :string) :Uint8Array => {
  const parts = dotted.split('.').map((v) => Number(v));
  const body :number[] = [ parts[0] * 40 + parts[1] ];
  for (const v of parts.slice(2)) {
    const chunk :number[] = [ v & 0x7f ];
    let x = Math.floor(v / 128);
    while (x > 0) { chunk.unshift(0x80 | (x & 0x7f)); x = Math.floor(x / 128); }
    body.push(...chunk);
  }
  return tlv(0x06, Uint8Array.from(body));
};

const derUtf8 = (s :string) :Uint8Array => tlv(0x0c, encoder.encode(s));
const derPrintable = (s :string) :Uint8Array => tlv(0x13, asciiBytes(s));
const derIa5 = (s :string) :Uint8Array => tlv(0x16, asciiBytes(s));
const derOctet = (b :Uint8Array) :Uint8Array => tlv(0x04, b);
const derNull = () :Uint8Array => Uint8Array.of(0x05, 0x00);
/** BIT STRING (未用位数为 0) */
const derBitString = (b :Uint8Array) :Uint8Array => tlv(0x03, cat(Uint8Array.of(0x00), b));
/** context-specific 标签 (constructed = 构造类型, 即 0xa0 | n) */
const derCtx = (n :number, constructed :boolean, content :Uint8Array) :Uint8Array =>
  tlv((constructed ? 0xa0 : 0x80) | n, content);

/** TLV 头信息 (解析用) */
export interface TlvHeader {
  tag :number;
  /** 内容字节数 */
  length :number;
  /** 头长度 (tag + 长度字段) */
  headerLength :number;
  /** 内容起始下标 */
  contentOffset :number;
}

/** 读取一个 TLV 头 (@param offset 起始下标) */
export const readTlv = (buf :Uint8Array, offset :number) :TlvHeader => {
  if (offset + 2 > buf.length) throw new Error('DER 数据不完整');
  const tag = buf[offset];
  let length = buf[offset + 1];
  let headerLength = 2;
  if (length & 0x80) {
    const n = length & 0x7f;
    if (n === 0 || n > 4 || offset + 2 + n > buf.length) throw new Error('DER 长度字段不合法');
    length = 0;
    for (let i = 0; i < n; i++) length = length * 256 + buf[offset + 2 + i];
    headerLength = 2 + n;
  }
  const contentOffset = offset + headerLength;
  if (contentOffset + length > buf.length) throw new Error('DER 数据不完整');
  return { tag, length, headerLength, contentOffset };
};

/** 取出一个 TLV 的完整字节 */
export const readTlvBytes = (buf :Uint8Array, offset :number) :Uint8Array => {
  const h = readTlv(buf, offset);
  return buf.subarray(offset, h.contentOffset + h.length);
};

/**
 * PKCS#8 私钥 -> PKCS#1 私钥 (取出内层 RSAPrivateKey)
 * PKCS#8 = SEQ{ INTEGER 0, AlgorithmIdentifier, OCTET STRING (PKCS#1) }
 */
export const pkcs8ToPkcs1 = (pkcs8 :Uint8Array) :Uint8Array => {
  const outer = readTlv(pkcs8, 0);
  if (outer.tag !== 0x30) throw new Error('PKCS#8 结构异常 (缺少 SEQUENCE)');
  let off = outer.contentOffset;
  const version = readTlv(pkcs8, off);
  off = version.contentOffset + version.length;
  const alg = readTlv(pkcs8, off);
  off = alg.contentOffset + alg.length;
  const key = readTlv(pkcs8, off);
  if (key.tag !== 0x04) throw new Error('PKCS#8 结构异常 (缺少私钥 OCTET STRING)');
  return pkcs8.subarray(key.contentOffset, key.contentOffset + key.length);
};

// -------- SAN (subjectAltName) --------

/** 一条 SAN 记录 */
export interface SanEntry {
  type :'dns' | 'ip';
  value :string;
  /** IP 的原始字节 (4 或 16 字节); DNS 为空 */
  bytes? :Uint8Array;
}

const isIpv4 = (s :string) :boolean => {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s);
  if (!m) return false;
  return m.slice(1).every((p) => Number(p) <= 255 && String(Number(p)) === p);
};

const ipv4ToBytes = (s :string) :Uint8Array | null => {
  if (!isIpv4(s)) return null;
  return Uint8Array.from(s.split('.').map((v) => Number(v)));
};

/** IPv6 -> 16 字节 (支持 :: 压缩与 ::ffff:192.168.1.1 内嵌 IPv4) */
const ipv6ToBytes = (input :string) :Uint8Array | null => {
  let s = input.trim().replace(/^\[/, '').replace(/\]$/, '');
  const zone = s.indexOf('%'); // 去掉网卡后缀 fe80::1%eth0
  if (zone >= 0) s = s.slice(0, zone);
  if (!s.includes(':') || !/^[0-9a-fA-F:.]+$/.test(s)) return null;

  // 末尾内嵌 IPv4 -> 拆成两组十六进制
  const lastColon = s.lastIndexOf(':');
  const tail = s.slice(lastColon + 1);
  if (tail.includes('.')) {
    const v4 = ipv4ToBytes(tail);
    if (!v4) return null;
    const hi = ((v4[0] << 8) | v4[1]).toString(16);
    const lo = ((v4[2] << 8) | v4[3]).toString(16);
    s = s.slice(0, lastColon + 1) + hi + ':' + lo;
  }

  const halves = s.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] === '' ? [] : halves[0].split(':');
  const rest = halves.length === 2 ? (halves[1] === '' ? [] : halves[1].split(':')) : null;
  const groups = rest === null ? head : [ ...head, ...rest ];
  if (!groups.every((g) => /^[0-9a-fA-F]{1,4}$/.test(g))) return null;
  let full :string[];
  if (rest === null) {
    if (groups.length !== 8) return null;
    full = groups;
  } else {
    const fill = 8 - groups.length;
    if (fill < 1) return null;
    full = [ ...head, ...new Array(fill).fill('0'), ...rest ];
  }
  const out = new Uint8Array(16);
  full.forEach((g, i) => {
    const v = parseInt(g, 16);
    out[i * 2] = (v >> 8) & 0xff;
    out[i * 2 + 1] = v & 0xff;
  });
  return out;
};

/** 字符串 -> IP 字节 (IPv4 = 4 字节 / IPv6 = 16 字节), 非法返回 null */
export const ipToBytes = (s :string) :Uint8Array | null => ipv4ToBytes(s) ?? ipv6ToBytes(s);

/** 是否为合法 IPv4 / IPv6 (支持 fe80::1%eth0 这类网卡后缀) */
export const isIpAddress = (s :string) :boolean => ipToBytes(s) !== null;

/** 是否为合法域名 (允许最左侧通配符 *.example.com) */
export const isDomainName = (s :string) :boolean => {
  const name = s.trim().replace(/\.$/, ''); // 允许 FQDN 末尾点
  if (name === '' || name.length > 253) return false;
  const labels = name.split('.');
  return labels.every((label, i) => {
    if (i === 0 && label === '*') return true;
    return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(label);
  });
};

/**
 * 解析 SAN 输入 (按空白 / 逗号 / 分号分隔, 支持 DNS:xxx 与 IP:1.2.3.4 前缀)
 * @returns entries 合法记录 (已去重, 顺序保持输入顺序) / invalid 无法识别的原文
 */
export const parseSanText = (text :string) :{ entries: SanEntry[]; invalid: string[] } => {
  const entries :SanEntry[] = [];
  const invalid :string[] = [];
  const seen = new Set<string>();
  for (const token of text.split(/[\s,;、，；]+/)) {
    const raw = token.trim();
    if (raw === '') continue;
    const m = /^(dns|ip|ipaddress)\s*[:=]\s*(.+)$/i.exec(raw);
    const body = (m ? m[2] : raw).trim();
    const forced = m === null ? null : (/^ip/i.test(m[1]) ? 'ip' : 'dns');
    let entry :SanEntry | null = null;
    if (forced !== 'dns') {
      const bytes = ipToBytes(body);
      if (bytes) entry = { type: 'ip', value: body, bytes };
    }
    if (entry === null && forced !== 'ip' && isDomainName(body)) {
      entry = { type: 'dns', value: body.replace(/\.$/, '').toLowerCase() };
    }
    if (entry === null) { invalid.push(raw); continue; }
    const dedupe = entry.type + ':' + entry.value;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    entries.push(entry);
  }
  return { entries, invalid };
};

/** SAN 记录 -> 展示文本 (DNS:example.com / IP:192.168.1.10) */
export const sanLabel = (e :SanEntry) :string => (e.type === 'ip' ? 'IP:' : 'DNS:') + e.value;

/** 未填写 SAN 时, 用 CN 兜底 (现代浏览器忽略 CN, SAN 必须有值) */
export const defaultSanFor = (commonName :string) :SanEntry[] => {
  const cn = commonName.trim();
  if (cn === '') return [];
  const bytes = ipToBytes(cn);
  if (bytes) return [ { type: 'ip', value: cn, bytes } ];
  if (isDomainName(cn)) return [ { type: 'dns', value: cn.replace(/\.$/, '').toLowerCase() } ];
  return [];
};

// -------- CSR 结构 --------

export interface CsrSubjectInput {
  commonName :string;
  organization? :string;
  organizationalUnit? :string;
  locality? :string;
  state? :string;
  country? :string;
  email? :string;
}

export interface CsrInput {
  subject :CsrSubjectInput;
  /** SAN 输入原文 (每行 / 逗号分隔; 留空则自动使用 CN) */
  san? :string;
  keyBits? :CsrKeyBits;
  keyFormat? :PrivateKeyFormat;
}

export interface CsrResult {
  /** server.key 内容 */
  privateKeyPem :string;
  /** server.csr 内容 */
  csrPem :string;
  keyBits :number;
  keyFormat :PrivateKeyFormat;
  /** 主体单行展示 (C=CN, O=..., CN=example.com) */
  subjectLine :string;
  /** SAN 展示文本 (DNS:example.com / IP:1.2.3.4) */
  san :string[];
  /** CSR (DER) 的 SHA-256 指纹, 冒号分隔大写 */
  fingerprint :string;
  signatureAlgorithm :string;
}

/** 主体单行展示 (字段顺序与 openssl req -subject 一致) */
export const subjectLineOf = (subject :CsrSubjectInput) :string => {
  const parts :string[] = [];
  const push = (name :string, value? :string) => {
    if (value !== undefined && value.trim() !== '') parts.push(`${name}=${value.trim()}`);
  };
  push('C', subject.country?.toUpperCase());
  push('ST', subject.state);
  push('L', subject.locality);
  push('O', subject.organization);
  push('OU', subject.organizationalUnit);
  push('CN', subject.commonName);
  push('emailAddress', subject.email);
  return parts.join(', ');
};

const rdn = (oid :string, value :Uint8Array) :Uint8Array => derSet(derSeq(derOid(oid), value));

/** 主体 (Name ::= SEQUENCE OF RelativeDistinguishedName) */
export const buildSubjectDer = (subject :CsrSubjectInput) :Uint8Array => {
  const items :Uint8Array[] = [];
  const value = (v? :string) => (v ?? '').trim();
  if (value(subject.country) !== '') items.push(rdn(OID.country, derPrintable(value(subject.country).toUpperCase())));
  if (value(subject.state) !== '') items.push(rdn(OID.state, derUtf8(value(subject.state))));
  if (value(subject.locality) !== '') items.push(rdn(OID.locality, derUtf8(value(subject.locality))));
  if (value(subject.organization) !== '') items.push(rdn(OID.organization, derUtf8(value(subject.organization))));
  if (value(subject.organizationalUnit) !== '') items.push(rdn(OID.organizationalUnit, derUtf8(value(subject.organizationalUnit))));
  if (value(subject.commonName) !== '') items.push(rdn(OID.commonName, derUtf8(value(subject.commonName))));
  if (value(subject.email) !== '') items.push(rdn(OID.emailAddress, derIa5(value(subject.email))));
  return derSeq(...items);
};

/** Extensions (仅 SAN): SEQUENCE OF Extension */
export const buildExtensionsDer = (entries :SanEntry[]) :Uint8Array => {
  const names = entries.map((e) =>
    e.type === 'ip' ? derCtx(7, false, e.bytes ?? new Uint8Array()) : derCtx(2, false, asciiBytes(e.value)));
  return derSeq(derSeq(derOid(OID.subjectAltName), derOctet(derSeq(...names))));
};

/** CertificationRequestInfo */
export const buildCertificationRequestInfo = (
  subjectPublicKey :Uint8Array,
  subject :CsrSubjectInput,
  sanEntries :SanEntry[],
) :Uint8Array => {
  // attributes [0] IMPLICIT SET OF Attribute -> 内容直接是 Attribute 的拼接
  const attributes = sanEntries.length > 0
    ? derCtx(0, true, derSeq(derOid(OID.extensionRequest), derSet(buildExtensionsDer(sanEntries))))
    : derCtx(0, true, new Uint8Array(0));
  return derSeq(derInt(0), buildSubjectDer(subject), subjectPublicKey, attributes);
};

/** 组装完整 CSR: SEQ{ CRI, sha256WithRSAEncryption, BIT STRING 签名 } */
export const assembleCsrDer = (cri :Uint8Array, signature :Uint8Array) :Uint8Array =>
  derSeq(cri, derSeq(derOid(OID.sha256WithRsa), derNull()), derBitString(signature));

// -------- 校验 --------

export interface CsrIssue {
  /** 语言键 (中文原文, 交由 lang.ts 翻译) */
  key :string;
  vars? :Record<string, string | number>;
}

/** 表单校验: 返回全部问题 (为空表示可生成) */
export const validateCsrInput = (input :CsrInput) :CsrIssue[] => {
  const issues :CsrIssue[] = [];
  const cn = (input.subject.commonName ?? '').trim();
  if (cn === '') {
    issues.push({ key: '通用名称 (CN) 不能为空' });
  } else if (cn.length > 64) {
    issues.push({ key: '通用名称 (CN) 不能超过 {n} 个字符', vars: { n: 64 } });
  }
  const country = (input.subject.country ?? '').trim();
  if (country !== '' && !/^[A-Za-z]{2}$/.test(country)) {
    issues.push({ key: '国家代码 (C) 需为 2 位字母, 如 CN / US' });
  }
  const email = (input.subject.email ?? '').trim();
  if (email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    issues.push({ key: '邮箱格式不正确' });
  }
  const { invalid } = parseSanText(input.san ?? '');
  for (const v of invalid) {
    issues.push({ key: 'SAN 中的 {v} 不是合法的域名或 IP', vars: { v } });
  }
  return issues;
};

// -------- 生成 --------

const subtle = () :SubtleCrypto => {
  const c = globalThis.crypto;
  if (!c || !c.subtle) throw new Error('当前环境不支持 WebCrypto (crypto.subtle)');
  return c.subtle;
};

/** 当前环境是否支持 WebCrypto (不支持则无法生成密钥) */
export const csrAvailable = () :boolean => {
  const c = globalThis.crypto;
  return !!c && !!c.subtle;
};

/** 生成 RSA 私钥与 CSR (全程本机完成) */
export const generateCsr = async (input :CsrInput) :Promise<CsrResult> => {
  const issues = validateCsrInput(input);
  if (issues.length > 0) throw new Error(issues[0].key);

  const bits = input.keyBits ?? 2048;
  const format = input.keyFormat ?? 'pkcs8';
  const subject :CsrSubjectInput = {
    ...input.subject,
    country: (input.subject.country ?? '').trim().toUpperCase(),
    commonName: (input.subject.commonName ?? '').trim(),
    email: (input.subject.email ?? '').trim(),
  };

  const parsed = parseSanText(input.san ?? '');
  const entries = parsed.entries.length > 0 ? parsed.entries : defaultSanFor(subject.commonName);

  const pair = await subtle().generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: bits, publicExponent: Uint8Array.of(0x01, 0x00, 0x01), hash: 'SHA-256' },
    true,
    [ 'sign', 'verify' ],
  );
  const spki = new Uint8Array(await subtle().exportKey('spki', pair.publicKey));
  const pkcs8 = new Uint8Array(await subtle().exportKey('pkcs8', pair.privateKey));

  const cri = buildCertificationRequestInfo(spki, subject, entries);
  const signature = new Uint8Array(await subtle().sign({ name: 'RSASSA-PKCS1-v1_5' }, pair.privateKey, cri));
  const csrDer = assembleCsrDer(cri, signature);
  const digest = new Uint8Array(await subtle().digest('SHA-256', csrDer));

  return {
    csrPem: derToPem(csrDer, 'CERTIFICATE REQUEST'),
    privateKeyPem: format === 'pkcs1'
      ? derToPem(pkcs8ToPkcs1(pkcs8), 'RSA PRIVATE KEY')
      : derToPem(pkcs8, 'PRIVATE KEY'),
    keyBits: bits,
    keyFormat: format,
    subjectLine: subjectLineOf(subject),
    san: entries.map(sanLabel),
    fingerprint: bytesToHexColon(digest),
    signatureAlgorithm: SIGN_ALGORITHM,
  };
};
