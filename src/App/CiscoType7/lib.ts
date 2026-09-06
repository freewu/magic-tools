// Cisco IOS 密码 Type 7: 固定公开密钥表 XOR 弱加密 (仅供老设备互操作, 不提供任何安全性)
// 输出格式: 前 2 位十六进制 = 盐偏移 salt(0~15), 其后每字节为 明文 XOR 密钥表[(salt + i) % len] 的大写 hex
export const TYPE7_KEY = 'tfd;kfoA,.iyewrkldJKDHSUBsgvCa6983;tzqxR59ee$eoH';
export const TYPE7_SALT_MIN = 0;
export const TYPE7_SALT_MAX = 15;

const hexByte = (n: number): string => n.toString(16).padStart(2, '0').toUpperCase();

const randomSalt = (): number => {
  try {
    const buf = new Uint8Array(1);
    crypto.getRandomValues(buf);
    return buf[0] & TYPE7_SALT_MAX;
  } catch {
    return Math.floor(Math.random() * (TYPE7_SALT_MAX + 1));
  }
};

/** 明文(UTF-8) -> Type 7 串; salt 缺省随机 0~15; 传入非整数自动截取并钳制在 0~15 */
export const encryptType7 = (plain: string, salt?: number): string => {
  const bytes = new TextEncoder().encode(plain);
  const s = salt === undefined ? randomSalt() : Math.min(TYPE7_SALT_MAX, Math.max(TYPE7_SALT_MIN, Math.floor(salt)));
  let out = hexByte(s);
  for (let i = 0; i < bytes.length; i++) {
    out += hexByte(bytes[i] ^ TYPE7_KEY.charCodeAt((s + i) % TYPE7_KEY.length));
  }
  return out;
};

/** Type 7 串 -> 明文(UTF-8); 容忍空白分隔与大小写; 非法输入抛错 */
export const decryptType7 = (type7: string): string => {
  const s = type7.replace(/\s+/g, '').toUpperCase();
  if (s.length < 2 || s.length % 2 !== 0) {
    throw new Error('Type 7 串长度不合法 (至少 2 位且为偶数)');
  }
  const salt = parseInt(s.slice(0, 2), 16);
  if (Number.isNaN(salt) || salt < TYPE7_SALT_MIN || salt > TYPE7_SALT_MAX) {
    throw new Error('Type 7 盐偏移不合法 (前 2 位应为 00~0F 的十六进制)');
  }
  const out = new Uint8Array((s.length - 2) / 2);
  for (let i = 0; i < out.length; i++) {
    const hex = s.slice(2 + i * 2, 4 + i * 2);
    const byte = parseInt(hex, 16);
    if (Number.isNaN(byte)) throw new Error(`Type 7 第 ${2 + i * 2 + 1} 位起含非十六进制字符`);
    out[i] = byte ^ TYPE7_KEY.charCodeAt((salt + i) % TYPE7_KEY.length);
  }
  return new TextDecoder().decode(out);
};
