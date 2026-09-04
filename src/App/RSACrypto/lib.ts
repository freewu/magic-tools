// RSA 加解密 (WebCrypto RSA-OAEP)
// 密钥格式: 私钥 PKCS#8 PEM / 公钥 SPKI PEM (-----BEGIN PRIVATE KEY----- / -----BEGIN PUBLIC KEY-----)
// 填充: RSA-OAEP + SHA-256; 超出单块容量时自动分段 (每块密文长度 = 密钥模长), 密文输出 Base64

const subtle = () :SubtleCrypto => {
  const c = globalThis.crypto;
  if (!c || !c.subtle) throw new Error('当前环境不支持 WebCrypto (crypto.subtle)');
  return c.subtle;
};

export const rsaAvailable = () :boolean => {
  const c = globalThis.crypto;
  return !!c && !!c.subtle;
};

const enc = new TextEncoder();
const dec = new TextDecoder();

export const bytesToB64 = (bytes :Uint8Array) :string => {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};

export const b64ToBytes = (b64 :string) :Uint8Array => {
  const bin = atob(b64.trim().replace(/\s+/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

// base64url (JWK 字段, 无填充可能) -> 字节
const b64UrlToBytes = (b64u :string) :Uint8Array => {
  let s = b64u.replace(/-/g, '+').replace(/_/g, '/');
  if (s.length % 4 !== 0) s += '='.repeat(4 - (s.length % 4));
  return b64ToBytes(s);
};

export const bytesToHex = (bytes :Uint8Array) :string =>
  Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');

export const hexToBytes = (hex :string) :Uint8Array => {
  const h = hex.replace(/\s+/g, '');
  if (!/^[0-9a-fA-F]*$/.test(h) || h.length % 2 !== 0) throw new Error('HEX 内容不合法');
  const bytes = new Uint8Array(h.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return bytes;
};

// -------- PEM ----------

const pemToDer = (pem :string, label :string) :Uint8Array => {
  const text = pem.trim();
  const re = new RegExp(`-----BEGIN ${label}-----([\\s\\S]*?)-----END ${label}-----`);
  const m = text.match(re);
  if (!m) throw new Error(`未找到 PEM 段 (-----BEGIN ${label}-----)`);
  return b64ToBytes(m[1]);
};

const derToPem = (der :Uint8Array, label :string) :string => {
  const b64 = bytesToB64(der);
  const lines = b64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
};

// -------- 密钥 ----------

export type RsaKeyBits = 2048 | 3072 | 4096;

/** 生成 RSA-OAEP 密钥对, 返回 PEM (私钥 PKCS#8 / 公钥 SPKI) */
export const generateRsaKeyPair = async (modulusLength :RsaKeyBits = 2048) :Promise<{ privatePem: string; publicPem: string }> => {
  const keyPair = await subtle().generateKey(
    { name: 'RSA-OAEP', modulusLength, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['encrypt', 'decrypt'],
  );
  const privateDer = new Uint8Array(await subtle().exportKey('pkcs8', keyPair.privateKey));
  const publicDer = new Uint8Array(await subtle().exportKey('spki', keyPair.publicKey));
  return { privatePem: derToPem(privateDer, 'PRIVATE KEY'), publicPem: derToPem(publicDer, 'PUBLIC KEY') };
};

const importPublic = async (publicPem :string) :Promise<CryptoKey> => {
  const der = pemToDer(publicPem, 'PUBLIC KEY');
  return subtle().importKey('spki', der as BufferSource, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['encrypt']);
};

const importPrivate = async (privatePem :string) :Promise<CryptoKey> => {
  const der = pemToDer(privatePem, 'PRIVATE KEY');
  return subtle().importKey('pkcs8', der as BufferSource, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['decrypt']);
};

const modulusBytesOf = async (key :CryptoKey) :Promise<number> => {
  const jwk = await subtle().exportKey('jwk', key);
  return b64UrlToBytes(jwk.n as string).length;
};

// -------- 加解密 (字节级核心) ----------

const OAEP_OVERHEAD = 66; // SHA-256: 2*32 + 2

/** 公钥加密任意字节流 -> 原始密文字节 (每块 = 模长) */
const rsaEncryptRaw = async (publicPem :string, data :Uint8Array) :Promise<Uint8Array> => {
  const pub = await importPublic(publicPem);
  const modBytes = await modulusBytesOf(pub);
  const max = modBytes - OAEP_OVERHEAD;
  if (max <= 0) throw new Error('密钥模长过短');
  const blocks :Uint8Array[] = [];
  for (let i = 0; i < data.length; i += max) {
    const ct = new Uint8Array(await subtle().encrypt({ name: 'RSA-OAEP' }, pub, data.subarray(i, i + max) as BufferSource));
    blocks.push(ct);
  }
  const out = new Uint8Array(blocks.length * modBytes);
  blocks.forEach((b, i) => out.set(b, i * modBytes));
  return out;
};

/** 私钥解密原始密文字节流 -> 明文字节 */
const rsaDecryptRaw = async (privatePem :string, data :Uint8Array) :Promise<Uint8Array> => {
  const pri = await importPrivate(privatePem);
  const modBytes = await modulusBytesOf(pri);
  if (data.length === 0 || data.length % modBytes !== 0) {
    throw new Error(`密文长度 (${data.length} 字节) 与私钥模长 (${modBytes} 字节) 不匹配`);
  }
  const chunks :Uint8Array[] = [];
  for (let i = 0; i < data.length; i += modBytes) {
    try {
      chunks.push(new Uint8Array(await subtle().decrypt({ name: 'RSA-OAEP' }, pri, data.subarray(i, i + modBytes) as BufferSource)));
    } catch {
      throw new Error(`解密失败: 私钥与密文不匹配或密文已损坏 (块 ${i / modBytes + 1})`);
    }
  }
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
};

/** 公钥加密文本 -> Base64 密文 (超长自动分段) */
export const rsaEncryptText = async (publicPem :string, plainText :string) :Promise<string> =>
  bytesToB64(await rsaEncryptRaw(publicPem, enc.encode(plainText)));

/** 私钥解密 Base64 密文 -> 文本 */
export const rsaDecryptText = async (privatePem :string, cipherB64 :string) :Promise<string> =>
  dec.decode(await rsaDecryptRaw(privatePem, b64ToBytes(cipherB64)));

/** 公钥加密字节流 -> 原始密文字节 */
export const rsaEncryptBytes = (publicPem :string, data :Uint8Array) :Promise<Uint8Array> =>
  rsaEncryptRaw(publicPem, data);

/** 私钥解密原始密文字节 -> 明文字节 */
export const rsaDecryptBytes = (privatePem :string, cipher :Uint8Array) :Promise<Uint8Array> =>
  rsaDecryptRaw(privatePem, cipher);

// -------- 默认密钥 (设置页共用同一 localStorage 槽位) --------
const DEFAULT_PUBLIC_KEY_ITEM = 'rsa-crypto:default-public-key';

/** 获取默认公钥 (SPKI PEM) */
export function getDefaultPublicKey() :string {
  return localStorage.getItem(DEFAULT_PUBLIC_KEY_ITEM) ?? '';
}

/** 保存默认公钥 (SPKI PEM) */
export function setDefaultPublicKey(pem :string) :void {
  localStorage.setItem(DEFAULT_PUBLIC_KEY_ITEM, pem);
}

const DEFAULT_PRIVATE_KEY_ITEM = 'rsa-crypto:default-private-key';

/** 获取默认私钥 (PKCS#8 PEM) */
export function getDefaultPrivateKey() :string {
  return localStorage.getItem(DEFAULT_PRIVATE_KEY_ITEM) ?? '';
}

/** 保存默认私钥 (PKCS#8 PEM) */
export function setDefaultPrivateKey(pem :string) :void {
  localStorage.setItem(DEFAULT_PRIVATE_KEY_ITEM, pem);
}

/** 是否已配置完整的默认密钥对 (公钥 + 私钥) */
export function hasDefaultKeyPair() :boolean {
  return getDefaultPublicKey().trim() !== '' && getDefaultPrivateKey().trim() !== '';
}

/** 判断字符串是否为合法的 PEM (宽松: 含 BEGIN/END 行) */
export const isPublicPem = (text :string) :boolean =>
  /-----BEGIN PUBLIC KEY-----/.test(text) && /-----END PUBLIC KEY-----/.test(text);

export const isPrivatePem = (text :string) :boolean =>
  /-----BEGIN PRIVATE KEY-----/.test(text) && /-----END PRIVATE KEY-----/.test(text);
