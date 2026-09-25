// SM9 (GM/T 0044-2016) 纯逻辑工具: HEX 编解码 / DER 结构解析 / SM9 数据类型识别 /
// 默认密钥存取。本文件 **不引用 wasm** (wasm 封装见 gmssl.ts), 便于单元测试。

const enc = new TextEncoder();

// ------------------------------------------------------------------ //
// HEX / 文本                                                          //
// ------------------------------------------------------------------ //

/** 去除空白与分隔符 (支持粘贴带空格/换行的 HEX) */
export const normalizeHex = (s :string) :string => s.replace(/[\s:]/g, '');

/** 是否为合法 HEX (长度必须为偶数) */
export const isHex = (s :string) :boolean => {
  const h = normalizeHex(s);
  return h.length % 2 === 0 && /^[0-9a-fA-F]*$/.test(h);
};

/** HEX -> 字节; 非法时抛出 */
export const hexToBytes = (s :string) :Uint8Array => {
  const h = normalizeHex(s);
  if (h.length % 2 !== 0) throw new Error('HEX 长度需为偶数');
  if (!/^[0-9a-fA-F]*$/.test(h)) throw new Error('内容不是合法的十六进制 (HEX)');
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
  return out;
};

/** 字节 -> 小写 HEX */
export const bytesToHex = (b :Uint8Array) :string =>
  Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

/** UTF-8 编码 */
export const textToBytes = (s :string) :Uint8Array => enc.encode(s);

/** UTF-8 字节长度 (SM9 明文的长度限制按字节计) */
export const utf8Length = (s :string) :number => enc.encode(s).length;

/**
 * 字节 -> 文本。可打印 UTF-8 时返回文本, 否则返回 HEX (解密结果可能是二进制)。
 */
export const bytesToText = (b :Uint8Array) :string => {
  const s = new TextDecoder('utf-8', { fatal: false }).decode(b);
  // 含替换字符 => 视为二进制, 回退 HEX 展示
  return s.includes('\uFFFD') ? bytesToHex(b) : s;
};

// ------------------------------------------------------------------ //
// DER 结构解析 (仅够识别 SM9 的几种结构, 不做完整 ASN.1)                 //
// ------------------------------------------------------------------ //

export type DerTagName = 'SEQUENCE' | 'INTEGER' | 'BIT STRING' | 'OCTET STRING' | 'OTHER';

export type DerNode = {
  tag :number;
  name :DerTagName;
  /** 内容长度 (BIT STRING 已扣掉 unused-bits 字节, 即实际字节数) */
  bytes :number;
  /** 整体占用的字节数 (含 tag + 长度域) */
  total :number;
};

const tagName = (tag :number) :DerTagName => {
  switch (tag) {
    case 0x30: return 'SEQUENCE';
    case 0x02: return 'INTEGER';
    case 0x03: return 'BIT STRING';
    case 0x04: return 'OCTET STRING';
    default: return 'OTHER';
  }
};

/** 解析 [start, end) 内连续的 TLV 元素; 结构非法时返回 null */
export const parseDerNodes = (b :Uint8Array, start = 0, end = b.length) :DerNode[] | null => {
  const nodes :DerNode[] = [];
  let i = start;
  while (i < end) {
    const tag = b[i];
    let len = b[i + 1];
    let pos = i + 2;
    if (len === undefined) return null;
    if (len & 0x80) { // 长长度形式
      const n = len & 0x7f;
      if (n === 0 || n > 3) return null;
      if (pos + n > end) return null;
      len = 0;
      for (let k = 0; k < n; k++) len = (len << 8) | b[pos + k];
      pos += n;
    }
    if (pos + len > end) return null;
    const isConstructed = (tag & 0x20) !== 0;
    if (isConstructed) return null; // SM9 用到的结构里没有嵌套的构造类型
    const name = tagName(tag);
    const bytes = name === 'BIT STRING' ? len - 1 : len;
    if (bytes < 0) return null;
    nodes.push({ tag, name, bytes, total: pos + len - i });
    i = pos + len;
  }
  return nodes.length > 0 ? nodes : null;
};

/** 读 DER 长度域 (pos 指向长度字节), 返回 [内容长度, 长度域字节数]; 非法返回 null */
const readDerLength = (b :Uint8Array, pos :number) :[number, number] | null => {
  const first = b[pos];
  if (first === undefined) return null;
  if (!(first & 0x80)) return [ first, 1 ];
  const n = first & 0x7f;
  if (n === 0 || n > 3 || pos + 1 + n > b.length) return null;
  let len = 0;
  for (let k = 0; k < n; k++) len = (len << 8) | b[pos + 1 + k];
  return [ len, 1 + n ];
};

/** 描述 DER 结构, 例如 'SEQUENCE { INTEGER(32), BIT STRING(65) }' */
export const describeDer = (b :Uint8Array) :string => {
  if (b.length < 2 || b[0] !== 0x30) return '非 DER SEQUENCE';
  const l = readDerLength(b, 1);
  if (!l || 1 + l[1] + l[0] > b.length) return 'DER 结构无法解析';
  const inner = parseDerNodes(b, 1 + l[1], 1 + l[1] + l[0]);
  if (!inner) return 'DER 结构无法解析';
  const innerText = inner.map((n) => `${n.name}(${n.bytes})`).join(', ');
  return `SEQUENCE { ${innerText} }`;
};

// ------------------------------------------------------------------ //
// SM9 数据类型识别                                                     //
// ------------------------------------------------------------------ //

export type Sm9DataKind =
  | 'enc-master'      // 加密主私钥 DER (104 B)
  | 'sign-master'     // 签名主私钥 DER (170/171 B)
  | 'enc-user'        // 加密用户私钥 DER (204 B)
  | 'sign-user'       // 签名用户私钥 DER (204 B)
  | 'enc-public'      // 加密主公钥 (65 B 未压缩点)
  | 'sign-public'     // 签名主公钥 (129 B 未压缩点)
  | 'ciphertext'      // SM9 密文 DER
  | 'signature'       // SM9 签名值 DER (104 B)
  | 'unknown';

/**
 * 按 DER 结构识别 SM9 数据类型 (结构取自 GmSSL v3.2.0 的 src/sm9_key.c / src/sm9_lib.c):
 *
 *   加密主私钥  SEQUENCE { INTEGER(32),  BIT STRING(65) }   104 B
 *   签名主私钥  SEQUENCE { INTEGER(32),  BIT STRING(129) }  170/171 B
 *   加密用户私钥 SEQUENCE { BIT STRING(129), BIT STRING(65) } 204 B
 *   签名用户私钥 SEQUENCE { BIT STRING(65),  BIT STRING(129) } 204 B
 *   密文        SEQUENCE { INTEGER(0), BIT STRING(65 C1), OCTET STRING(32 C3), OCTET STRING(C2) }
 *   签名值      SEQUENCE { OCTET STRING(32 h), BIT STRING(65 S) }  104 B
 */
export const identifySm9Data = (b :Uint8Array) :Sm9DataKind => {
  // 未压缩点裸数据
  if (b.length === 65 && b[0] === 0x04) return 'enc-public';
  if (b.length === 129 && b[0] === 0x04) return 'sign-public';
  if (b.length < 4 || b[0] !== 0x30) return 'unknown';
  const l = readDerLength(b, 1);
  if (!l || 1 + l[1] + l[0] > b.length) return 'unknown';
  const n = parseDerNodes(b, 1 + l[1], 1 + l[1] + l[0]);
  if (!n) return 'unknown';
  const [a, c, d, e] = n;
  // 密文: INTEGER(0) + BIT STRING(C1 65) + OCTET STRING(C3 32) + OCTET STRING(C2)
  if (n.length === 4 && a.name === 'INTEGER' && a.bytes <= 4
    && c?.name === 'BIT STRING' && c.bytes === 65
    && d?.name === 'OCTET STRING' && d.bytes === 32
    && e?.name === 'OCTET STRING') return 'ciphertext';
  if (n.length !== 2) return 'unknown';
  // 签名值 (h 为 OCTET STRING, 与加密主私钥的 INTEGER 可区分)
  if (a.name === 'OCTET STRING' && a.bytes === 32 && c?.name === 'BIT STRING' && c.bytes === 65) return 'signature';
  if (a.name === 'INTEGER' && c?.name === 'BIT STRING') {
    if (c.bytes === 65) return 'enc-master';
    if (c.bytes === 129) return 'sign-master';
    return 'unknown';
  }
  if (a.name === 'BIT STRING' && c?.name === 'BIT STRING') {
    if (a.bytes === 129 && c.bytes === 65) return 'enc-user';
    if (a.bytes === 65 && c.bytes === 129) return 'sign-user';
    return 'unknown';
  }
  return 'unknown';
};

/** 类型说明 (zh 原文, 界面侧用 lang 词条翻译) */
export const KIND_LABELS :Record<Sm9DataKind, string> = {
  'enc-master': 'SM9-Enc 主私钥',
  'sign-master': 'SM9-Sign 主私钥',
  'enc-user': 'SM9-Enc 用户私钥',
  'sign-user': 'SM9-Sign 用户私钥',
  'enc-public': 'SM9-Enc 主公钥',
  'sign-public': 'SM9-Sign 主公钥',
  'ciphertext': 'SM9 密文 (DER)',
  'signature': 'SM9 签名值 (DER)',
  'unknown': '未识别',
};

/** 识别结果是否属于给定用途的允许集合 */
export const isKindOf = (b :Uint8Array, allowed :Sm9DataKind[]) :boolean =>
  allowed.includes(identifySm9Data(b));

/** 解析界面输入的 HEX 密钥/密文; 空串返回 null (表示未填写) */
export const parseHexField = (s :string) :{ bytes :Uint8Array } | { error :string } | null => {
  const h = normalizeHex(s);
  if (h === '') return null;
  if (h.length % 2 !== 0) return { error: 'HEX 长度需为偶数' };
  if (!/^[0-9a-fA-F]+$/.test(h)) return { error: '内容含非十六进制字符' };
  return { bytes: hexToBytes(h) };
};

/** 描述字节数: '104 字节' */
export const describeBytes = (n :number) :string => `${n} 字节`;

// ------------------------------------------------------------------ //
// 默认密钥 (与 设置 → 加解密 共用同一 localStorage 槽位)                //
// ------------------------------------------------------------------ //

export type Sm9Defaults = {
  encMaster :string;  // 加密主私钥 (DER HEX)
  encUser :string;    // 加密用户私钥 (DER HEX)
  signMaster :string; // 签名主私钥 (DER HEX)
  signUser :string;   // 签名用户私钥 (DER HEX)
  id :string;         // 默认 ID
};

const ITEMS :Record<keyof Sm9Defaults, string> = {
  encMaster: 'sm9-crypto:default-enc-master-key',
  encUser: 'sm9-crypto:default-enc-user-key',
  signMaster: 'sm9-crypto:default-sign-master-key',
  signUser: 'sm9-crypto:default-sign-user-key',
  id: 'sm9-crypto:default-id',
};

const readItem = (k :string) :string => {
  try { return localStorage.getItem(k) ?? ''; } catch { return ''; }
};

const writeItem = (k :string, v :string) :void => {
  try {
    if (v === '') localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch { /* localStorage 不可用时忽略 (隐私模式等) */ }
};

/** 读取默认密钥/ID */
export const getSm9Defaults = () :Sm9Defaults => ({
  encMaster: readItem(ITEMS.encMaster),
  encUser: readItem(ITEMS.encUser),
  signMaster: readItem(ITEMS.signMaster),
  signUser: readItem(ITEMS.signUser),
  id: readItem(ITEMS.id),
});

/** 保存单项默认值 (空串表示清除) */
export const setSm9Default = (k :keyof Sm9Defaults, v :string) :void => writeItem(ITEMS[k], v.trim());

/** 清空全部默认值 */
export const clearSm9Defaults = () :void => {
  (Object.keys(ITEMS) as Array<keyof Sm9Defaults>).forEach((k) => writeItem(ITEMS[k], ''));
};

/** 导出的 localStorage 键名 (供设置页/测试复用) */
export const SM9_DEFAULT_ITEMS = ITEMS;
