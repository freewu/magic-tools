// RSACrypto 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  en: { appName: "RSA Encrypt / Decrypt" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const cryptolangRows: Record<string, [string, string]> = {
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
  'Type 7 第 {pos} 位起含非十六进制字符': ['Type 7 第 {pos} 位起含非十六進位字元', 'Non-hex character starting at position {pos} of the Type 7 string'],
  '加密失败': ['加密失敗', 'Encryption failed'],
  '解密失败': ['解密失敗', 'Decryption failed'],
  '填充:': ['填充:', 'Padding:'],
  '偏移量需为 {n} 个字符或 {bits} 位 HEX': ['偏移量需為 {n} 個字元或 {bits} 位 HEX', 'The IV must be {n} characters or {bits} HEX digits'],
  '密钥需为 {need} 个字符 (UTF-8 {need} 字节), 当前 {len} 字节': ['金鑰需為 {need} 個字元 (UTF-8 {need} 位元組), 目前 {len} 位元組', 'The key must be {need} characters (UTF-8: {need} bytes); got {len} bytes'],
  'HEX 内容不合法': ['HEX 內容不合法', 'Invalid HEX content'],
  '输入需要加密的明文 (UTF-8, 超过 190 字节会自动分段)  或 拖拽文件到框内打开': ['輸入需要加密的明文 (UTF-8, 超過 190 位元組會自動分段)  或 拖曳檔案到框內開啟', 'Enter the plaintext to encrypt (UTF-8; segments automatically when over 190 bytes), or drop a file into the box'],
  '密文 (Base64, 每段 = 密钥模长) 加密后自动显示在此; 也可粘贴外部工具的密文后点「解密」  或 拖拽文件到框内打开': ['密文 (Base64, 每段 = 金鑰模長) 加密後自動顯示在此; 也可貼上外部工具的密文後點「解密」  或 拖曳檔案到框內開啟', 'Ciphertext (Base64; each segment = the key modulus length) appears here after encryption; you can also paste ciphertext from other tools and click Decrypt, or drop a file into the box'],
  '生成密钥对': ['產生金鑰對', 'Generate key pair'],
  '保存为默认密钥': ['儲存為預設金鑰', 'Save as default key'],
  '生成后自动保存为默认密钥; 已配置默认密钥时重新打开本页将自动进入「加解密」, 也可在 设置 → 加解密 中预先配置。': ['產生後自動儲存為預設金鑰; 已設定預設金鑰時重新開啟本頁將自動進入「加解密」, 也可在 設定 → 加解密 中預先設定。', 'After generation the keys are saved as the default; reopening this page with default keys configured jumps straight to Encrypt/Decrypt. You can also pre-configure them in Settings → Cryptography.'],
  '用于加密': ['用於加密', 'used for encryption'],
  '复制公钥': ['複製公鑰', 'Copy public key'],
  '导出公钥到文件': ['匯出公鑰到檔案', 'Export public key to file'],
  '用于解密, 请保密': ['用於解密, 請保密', 'used for decryption — keep it secret'],
  '复制私钥': ['複製私鑰', 'Copy private key'],
  '导出私钥到文件': ['匯出私鑰到檔案', 'Export private key to file'],
  '未配置': ['未設定', 'Not configured'],
  '(摘要)': ['(摘要)', '(summary)'],
  '当前公钥: ': ['目前公鑰: ', 'Current public key: '],
  '当前私钥: ': ['目前私鑰: ', 'Current private key: '],
  '请输入需要解密的密文 (Base64)': ['請輸入需要解密的密文 (Base64)', 'Enter the ciphertext to decrypt (Base64)'],
  '未配置公钥, 请先在「密钥管理」生成密钥对或在设置中配置默认公钥': ['未設定公鑰, 請先在「金鑰管理」產生金鑰對或在設定中設定預設公鑰', 'No public key configured: generate a key pair under Key Management first, or set a default public key in Settings'],
  '未配置私钥, 请先在「密钥管理」生成密钥对或在设置中配置默认私钥': ['未設定私鑰, 請先在「金鑰管理」產生金鑰對或在設定中設定預設私鑰', 'No private key configured: generate a key pair under Key Management first, or set a default private key in Settings'],
  '请先生成或粘贴密钥': ['請先產生或貼上金鑰', 'Generate or paste a key first'],
  '没有可导出的密钥, 请先生成': ['沒有可匯出的金鑰, 請先產生', 'No key to export yet — generate one first'],
  '密钥已保存': ['金鑰已儲存', 'Key saved'],
  '{tip} 已复制到粘贴板': ['{tip} 已複製到剪貼簿', '{tip} copied to clipboard'],
  '内容': ['內容', 'content'],
  '公钥': ['公鑰', 'public key'],
  '私钥': ['私鑰', 'private key'],
  '{bits} 密钥对生成成功, 已保存为默认密钥': ['{bits} 金鑰對產生成功, 已儲存為預設金鑰', '{bits} key pair generated and saved as the default'],
  '已保存为默认密钥 (重新打开页面将自动进入「加解密」)': ['已儲存為預設金鑰 (重新開啟頁面將自動進入「加解密」)', 'Saved as the default key (reopening the page will go straight to Encrypt/Decrypt)'],
  '当前环境不支持 WebCrypto, 无法生成密钥': ['目前環境不支援 WebCrypto, 無法產生金鑰', 'WebCrypto is unavailable in this environment; cannot generate a key'],
  '当前环境不支持 WebCrypto': ['目前環境不支援 WebCrypto', 'WebCrypto is unavailable in this environment'],
  'RSA-{bits} 密钥对生成成功, 已保存为默认密钥': ['RSA-{bits} 金鑰對產生成功, 已儲存為預設金鑰', 'RSA-{bits} key pair generated and saved as the default'],
  '密钥管理': ['金鑰管理', 'Key Management'],
  '加解密': ['加解密', 'Encrypt / Decrypt'],
  ' RSA 说明 ': [' RSA 說明 ', ' RSA notes '],
  '公钥 (SPKI PEM)': ['公鑰 (SPKI PEM)', 'Public key (SPKI PEM)'],
  '私钥 (PKCS#8 PEM)': ['私鑰 (PKCS#8 PEM)', 'Private key (PKCS#8 PEM)'],
  '-----BEGIN PUBLIC KEY----- ... (生成后自动填充, 也可粘贴其他工具导出的公钥)': ['-----BEGIN PUBLIC KEY----- ... (產生後自動填入, 也可貼上其他工具匯出的公鑰)', '-----BEGIN PUBLIC KEY----- ... (filled in automatically after generation; you can also paste a public key exported elsewhere)'],
  '-----BEGIN PRIVATE KEY----- ... (生成后自动填充, 也可粘贴其他工具导出的私钥)': ['-----BEGIN PRIVATE KEY----- ... (產生後自動填入, 也可貼上其他工具匯出的私鑰)', '-----BEGIN PRIVATE KEY----- ... (filled in automatically after generation; you can also paste a private key exported elsewhere)'],
  '当前环境不支持 WebCrypto (crypto.subtle)': ['目前環境不支援 WebCrypto (crypto.subtle)', 'WebCrypto (crypto.subtle) is unavailable in this environment'],
  '密钥模长过短': ['金鑰模長過短', 'Key modulus too short'],
  '密文长度 ({len} 字节) 与私钥模长 ({mod} 字节) 不匹配': ['密文長度 ({len} 位元組) 與私鑰模長 ({mod} 位元組) 不匹配', 'Ciphertext length ({len} bytes) does not match the private-key modulus ({mod} bytes)'],
  '解密失败: 私钥与密文不匹配或密文已损坏 (块 {blk})': ['解密失敗: 私鑰與密文不匹配或密文已損壞 (區塊 {blk})', 'Decryption failed: private key does not match the ciphertext, or the ciphertext is corrupted (block {blk})'],
  '生成失败': ['產生失敗', 'Generation failed'],
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

