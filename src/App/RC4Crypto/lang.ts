// RC4Crypto 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  en: { appName: "RC4 Encrypt / Decrypt" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const cryptolangRows: Record<string, [string, string]> = {
  '复制到粘贴板成功！！！': ['複製到剪貼簿成功！！！', 'Copied to clipboard!!!'],
  '双击复制内容到粘贴板': ['雙擊複製內容到剪貼簿', 'Double-click to copy'],
  '加密': ['加密', 'Encrypt'],
  '解密': ['解密', 'Decrypt'],
  '清除': ['清除', 'Clear'],
  'Type 7 第 {pos} 位起含非十六进制字符': ['Type 7 第 {pos} 位起含非十六進位字元', 'Non-hex character starting at position {pos} of the Type 7 string'],
  '密钥:': ['金鑰:', 'Key:'],
  '编码:': ['編碼:', 'Encoding:'],
  '解密失败': ['解密失敗', 'Decryption failed'],
  '输入需要进行 RC4 加密的内容  或 拖拽文件到框内打开': ['輸入需要進行 RC4 加密的內容  或 拖曳檔案到框內開啟', 'Enter the content to RC4-encrypt, or drop a file into the box'],
  '输入需要进行 CR4 解密的内容  或 拖拽文件到框内打开': ['輸入需要進行 RC4 解密的內容  或 拖曳檔案到框內開啟', 'Enter the content to RC4-decrypt, or drop a file into the box'],
  '偏移量需为 {n} 个字符或 {bits} 位 HEX': ['偏移量需為 {n} 個字元或 {bits} 位 HEX', 'The IV must be {n} characters or {bits} HEX digits'],
  '密钥需为 {need} 个字符 (UTF-8 {need} 字节), 当前 {len} 字节': ['金鑰需為 {need} 個字元 (UTF-8 {need} 位元組), 目前 {len} 位元組', 'The key must be {need} characters (UTF-8: {need} bytes); got {len} bytes'],
  '内容': ['內容', 'content'],
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

