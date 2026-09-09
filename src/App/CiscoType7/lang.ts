// CiscoType7 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  en: { appName: "Cisco Type 7" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const cryptolangRows: Record<string, [string, string]> = {
  '复制到粘贴板成功！！！': ['複製到剪貼簿成功！！！', 'Copied to clipboard!!!'],
  '加密': ['加密', 'Encrypt'],
  '解密': ['解密', 'Decrypt'],
  '清除': ['清除', 'Clear'],
  'Cisco Type 7 使用固定公开密钥表做 XOR 弱加密, 可被任何工具还原, 不具备安全性; 仅用于与旧版 Cisco IOS 配置 (show running-config) 中的口令互通或查看': ['Cisco Type 7 使用固定公開金鑰表做 XOR 弱加密, 可被任何工具還原, 不具安全性; 僅用於與舊版 Cisco IOS 設定 (show running-config) 中的口令互通或檢視', 'Cisco Type 7 is a weak XOR obfuscation that uses a fixed, public key table — any tool can reverse it, so it provides no real security; it is only for interop with, or inspecting, passwords in legacy Cisco IOS configs (show running-config)'],
  '明文 → Type 7 (加密)': ['明文 → Type 7 (加密)', 'Plaintext → Type 7 (encrypt)'],
  'Type 7 → 明文 (解密)': ['Type 7 → 明文 (解密)', 'Type 7 → plaintext (decrypt)'],
  '盐偏移 (首 2 位, 0~15)': ['鹽偏移 (首 2 位, 0~15)', 'Salt offset (first 2 digits, 0~15)'],
  '随机 (推荐)': ['隨機 (推薦)', 'Random (recommended)'],
  '输入需要加密为 Type 7 的明文 (UTF-8, 支持中文与多行)': ['輸入需要加密為 Type 7 的明文 (UTF-8, 支援中文與多行)', 'Enter the plaintext to encrypt to Type 7 (UTF-8; Chinese and multiple lines are supported)'],
  '输入 Type 7 串 (例如 01050D480809, 支持大写/小写/空白分隔)': ['輸入 Type 7 串 (例如 01050D480809, 支援大寫/小寫/空白分隔)', 'Enter a Type 7 string (e.g. 01050D480809; uppercase, lowercase or whitespace-separated)'],
  '加密为 Type 7': ['加密為 Type 7', 'Encrypt to Type 7'],
  '解密为明文': ['解密為明文', 'Decrypt to plaintext'],
  'Type 7 结果 (点击可复制)': ['Type 7 結果 (點擊可複製)', 'Type 7 result (click to copy)'],
  '解密明文 (点击可复制)': ['解密明文 (點擊可複製)', 'Decrypted plaintext (click to copy)'],
  '加密结果: 2 位盐偏移 + 大写 hex': ['加密結果: 2 位鹽偏移 + 大寫 hex', 'Result: 2-digit salt offset + uppercase hex'],
  '解密结果': ['解密結果', 'Decrypted result'],
  'Type 7 串长度不合法 (至少 2 位且为偶数)': ['Type 7 串長度不合法 (至少 2 位且為偶數)', 'Invalid Type 7 string length (at least 2 digits and even)'],
  'Type 7 盐偏移不合法 (前 2 位应为 00~0F 的十六进制)': ['Type 7 鹽偏移不合法 (前 2 位應為 00~0F 的十六進位)', 'Invalid Type 7 salt offset (the first 2 digits should be hex 00~0F)'],
  'Type 7 第 {pos} 位起含非十六进制字符': ['Type 7 第 {pos} 位起含非十六進位字元', 'Non-hex character starting at position {pos} of the Type 7 string'],
  '解密失败': ['解密失敗', 'Decryption failed'],
  '偏移量需为 {n} 个字符或 {bits} 位 HEX': ['偏移量需為 {n} 個字元或 {bits} 位 HEX', 'The IV must be {n} characters or {bits} HEX digits'],
  '密钥需为 {need} 个字符 (UTF-8 {need} 字节), 当前 {len} 字节': ['金鑰需為 {need} 個字元 (UTF-8 {need} 位元組), 目前 {len} 位元組', 'The key must be {need} characters (UTF-8: {need} bytes); got {len} bytes'],
  '私钥': ['私鑰', 'private key'],
  '加解密': ['加解密', 'Encrypt / Decrypt'],
  '密文长度 ({len} 字节) 与私钥模长 ({mod} 字节) 不匹配': ['密文長度 ({len} 位元組) 與私鑰模長 ({mod} 位元組) 不匹配', 'Ciphertext length ({len} bytes) does not match the private-key modulus ({mod} bytes)'],
  '解密失败: 私钥与密文不匹配或密文已损坏 (块 {blk})': ['解密失敗: 私鑰與密文不匹配或密文已損壞 (區塊 {blk})', 'Decryption failed: private key does not match the ciphertext, or the ciphertext is corrupted (block {blk})'],
};

// 取词: 无命中回退 zh 原文 (与共享 crypto-lang 行为一致)
export const cr = (locale: string, zh: string): string => {
  const e = cryptolangRows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const crT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = cr(locale, zh);
  if (v) for (const [k, val] of Object.entries(v)) s = s.split('{'+k+'}').join(String(val));
  return s;
};
export const crErr = (locale: string, m: string): string => {
  let mm: RegExpExecArray | null;
  if ((mm = /^密钥需为 (\d+) 个字符 \(UTF-8 \d+ 字节\), 当前 (\d+) 字节$/.exec(m)))
    return crT(locale, '密钥需为 {need} 个字符 (UTF-8 {need} 字节), 当前 {len} 字节', { need: +mm[1], len: +mm[2] });
  if ((mm = /^偏移量需为 (\d+) 个字符或 (\d+) 位 HEX$/.exec(m)))
    return crT(locale, '偏移量需为 {n} 个字符或 {bits} 位 HEX', { n: +mm[1], bits: +mm[2] });
  if ((mm = /^Type 7 第 (\d+) 位起含非十六进制字符$/.exec(m)))
    return crT(locale, 'Type 7 第 {pos} 位起含非十六进制字符', { pos: +mm[1] });
  if ((mm = /^密文长度 \((\d+) 字节\) 与私钥模长 \((\d+) 字节\) 不匹配$/.exec(m)))
    return crT(locale, '密文长度 ({len} 字节) 与私钥模长 ({mod} 字节) 不匹配', { len: +mm[1], mod: +mm[2] });
  if ((mm = /^解密失败: 私钥与密文不匹配或密文已损坏 \(块 (\d+)\)$/.exec(m)))
    return crT(locale, '解密失败: 私钥与密文不匹配或密文已损坏 (块 {blk})', { blk: +mm[1] });
  return cr(locale, m);
};

