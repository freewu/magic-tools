// VigenereCrypto 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "維吉尼亞加解密" },
  en: { appName: "Vigenère Cipher" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const cryptolangRows: Record<string, [string, string]> = {
  '内容已复制到粘贴板': ['內容已複製到剪貼簿', 'Content copied to clipboard'],
  '双击复制内容到粘贴板': ['雙擊複製內容到剪貼簿', 'Double-click to copy'],
  '加密': ['加密', 'Encrypt'],
  '解密': ['解密', 'Decrypt'],
  '清除': ['清除', 'Clear'],
  '明文区 (加密输入 / 解密输出)': ['明文區 (加密輸入 / 解密輸出)', 'Plaintext (encrypt input / decrypt output)'],
  '密文区 (解密输入 / 加密输出)': ['密文區 (解密輸入 / 加密輸出)', 'Ciphertext (decrypt input / encrypt output)'],
  '请输入需要加密的明文': ['請輸入需要加密的明文', 'Enter the plaintext to encrypt'],
  '请输入需要解密的密文': ['請輸入需要解密的密文', 'Enter the ciphertext to decrypt'],
  '加密失败: {m}': ['加密失敗: {m}', 'Encryption failed: {m}'],
  '解密失败: {m}': ['解密失敗: {m}', 'Decryption failed: {m}'],
  '加密结果自动显示在此; 也可粘贴外部密文后点「解密」  或 拖拽文件到框内打开': ['加密結果自動顯示在此; 也可貼上外部密文後點「解密」  或 拖曳檔案到框內開啟', 'The encrypted result appears here; you can also paste external ciphertext and click Decrypt, or drop a file into the box'],
  'Type 7 第 {pos} 位起含非十六进制字符': ['Type 7 第 {pos} 位起含非十六進位字元', 'Non-hex character starting at position {pos} of the Type 7 string'],
  '密钥:': ['金鑰:', 'Key:'],
  '英文字母, 例如 LEMON': ['英文字母, 例如 LEMON', 'English letters, e.g. LEMON'],
  '密钥仅支持英文字母': ['金鑰僅支援英文字母', 'The key accepts English letters only'],
  '请输入密钥': ['請輸入金鑰', 'Enter a key'],
  '密钥字母循环决定每个明文字母的位移量; 数字 / 符号 / 中文不参与, 原样保留': ['金鑰字母循環決定每個明文字母的位移量; 數字 / 符號 / 中文不參與, 原樣保留', 'Key letters are repeated to set the shift of each plaintext letter; digits / symbols / Chinese do not participate and stay unchanged'],
  '输入需要加密的明文, 例如 ATTACKATDAWN  或 拖拽文件到框内打开': ['輸入需要加密的明文, 例如 ATTACKATDAWN  或 拖曳檔案到框內開啟', 'Enter the plaintext to encrypt, e.g. ATTACKATDAWN, or drop a file into the box'],
  ' 维吉尼亚密码说明 ': [' 維吉尼亞密碼說明 ', ' Vigenère cipher notes '],
  '加密失败': ['加密失敗', 'Encryption failed'],
  '解密失败': ['解密失敗', 'Decryption failed'],
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

