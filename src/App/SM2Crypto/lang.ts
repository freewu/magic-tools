// SM2Crypto 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  en: { appName: "SM2 Encrypt / Decrypt" },
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
  '密钥:': ['金鑰:', 'Key:'],
  '编码:': ['編碼:', 'Encoding:'],
  '加密失败': ['加密失敗', 'Encryption failed'],
  '解密失败': ['解密失敗', 'Decryption failed'],
  '偏移量需为 {n} 个字符或 {bits} 位 HEX': ['偏移量需為 {n} 個字元或 {bits} 位 HEX', 'The IV must be {n} characters or {bits} HEX digits'],
  '密钥需为 {need} 个字符 (UTF-8 {need} 字节), 当前 {len} 字节': ['金鑰需為 {need} 個字元 (UTF-8 {need} 位元組), 目前 {len} 位元組', 'The key must be {need} characters (UTF-8: {need} bytes); got {len} bytes'],
  'HEX 内容不合法': ['HEX 內容不合法', 'Invalid HEX content'],
  '输入需要加密的明文 (UTF-8, 任意长度)  或 拖拽文件到框内打开': ['輸入需要加密的明文 (UTF-8, 任意長度)  或 拖曳檔案到框內開啟', 'Enter the plaintext to encrypt (UTF-8, any length), or drop a file into the box'],
  '密文 (HEX, C1C3C2) 加密后自动显示在此; 也可粘贴 sm-crypto 等工具的 C1C3C2 密文 (兼容带 04 前缀) 后点「解密」  或 拖拽文件到框内打开': ['密文 (HEX, C1C3C2) 加密後自動顯示在此; 也可貼上 sm-crypto 等工具的 C1C3C2 密文 (相容帶 04 前綴) 後點「解密」  或 拖曳檔案到框內開啟', 'Ciphertext (HEX, C1C3C2) appears here after encryption; you can also paste C1C3C2 ciphertext from tools like sm-crypto (04-prefixed accepted) and click Decrypt, or drop a file into the box'],
  '生成密钥对': ['產生金鑰對', 'Generate key pair'],
  '保存为默认密钥': ['儲存為預設金鑰', 'Save as default key'],
  '生成后自动保存为默认密钥; 已配置默认密钥时重新打开本页将自动进入「加解密」, 也可在 设置 → 加解密 中预先配置。': ['產生後自動儲存為預設金鑰; 已設定預設金鑰時重新開啟本頁將自動進入「加解密」, 也可在 設定 → 加解密 中預先設定。', 'After generation the keys are saved as the default; reopening this page with default keys configured jumps straight to Encrypt/Decrypt. You can also pre-configure them in Settings → Cryptography.'],
  '公钥 (04‖X‖Y, 130 位 HEX)': ['公鑰 (04‖X‖Y, 130 位 HEX)', 'Public key (04‖X‖Y, 130 HEX digits)'],
  '用于加密': ['用於加密', 'used for encryption'],
  '生成后自动填充 (04 开头, 130 位 HEX), 也可粘贴其他工具导出的公钥': ['產生後自動填入 (04 開頭, 130 位 HEX), 也可貼上其他工具匯出的公鑰', 'Filled in automatically after generation (starts with 04, 130 HEX digits); you can also paste a public key exported elsewhere'],
  '复制公钥': ['複製公鑰', 'Copy public key'],
  '导出公钥到文件': ['匯出公鑰到檔案', 'Export public key to file'],
  '私钥 (d, 64 位 HEX)': ['私鑰 (d, 64 位 HEX)', 'Private key (d, 64 HEX digits)'],
  '用于解密, 请保密': ['用於解密, 請保密', 'used for decryption — keep it secret'],
  '生成后自动填充 (64 位 HEX), 也可粘贴其他工具导出的私钥': ['產生後自動填入 (64 位 HEX), 也可貼上其他工具匯出的私鑰', 'Filled in automatically after generation (64 HEX digits); you can also paste a private key exported elsewhere'],
  '复制私钥': ['複製私鑰', 'Copy private key'],
  '导出私钥到文件': ['匯出私鑰到檔案', 'Export private key to file'],
  '从私钥推导公钥': ['從私鑰推導公鑰', 'Derive public key from private key'],
  '未配置': ['未設定', 'Not configured'],
  '(摘要)': ['(摘要)', '(summary)'],
  '当前公钥: ': ['目前公鑰: ', 'Current public key: '],
  '当前私钥: ': ['目前私鑰: ', 'Current private key: '],
  '私钥需为 64 位 HEX': ['私鑰需為 64 位 HEX', 'The private key must be 64 HEX digits'],
  '公钥需为 04||X||Y 未压缩格式 (130 位 HEX)': ['公鑰需為 04||X||Y 未壓縮格式 (130 位 HEX)', 'The public key must be uncompressed 04||X||Y (130 HEX digits)'],
  '请输入需要解密的密文 (HEX)': ['請輸入需要解密的密文 (HEX)', 'Enter the ciphertext to decrypt (HEX)'],
  '未配置公钥, 请先在「密钥管理」生成密钥对或在设置中配置默认公钥': ['未設定公鑰, 請先在「金鑰管理」產生金鑰對或在設定中設定預設公鑰', 'No public key configured: generate a key pair under Key Management first, or set a default public key in Settings'],
  '未配置私钥, 请先在「密钥管理」生成密钥对或在设置中配置默认私钥': ['未設定私鑰, 請先在「金鑰管理」產生金鑰對或在設定中設定預設私鑰', 'No private key configured: generate a key pair under Key Management first, or set a default private key in Settings'],
  '请先生成或粘贴密钥': ['請先產生或貼上金鑰', 'Generate or paste a key first'],
  '没有可导出的密钥, 请先生成': ['沒有可匯出的金鑰, 請先產生', 'No key to export yet — generate one first'],
  '密钥已保存': ['金鑰已儲存', 'Key saved'],
  '{tip} 已复制到粘贴板': ['{tip} 已複製到剪貼簿', '{tip} copied to clipboard'],
  '内容': ['內容', 'content'],
  '公钥': ['公鑰', 'public key'],
  '私钥': ['私鑰', 'private key'],
  'SM2 密钥对生成成功, 已保存为默认密钥': ['SM2 金鑰對產生成功, 已儲存為預設金鑰', 'SM2 key pair generated and saved as the default'],
  '已由私钥推导出公钥并保存为默认公钥': ['已由私鑰推導出公鑰並儲存為預設公鑰', 'Public key derived from the private key and saved as the default'],
  '已保存为默认密钥 (重新打开页面将自动进入「加解密」)': ['已儲存為預設金鑰 (重新開啟頁面將自動進入「加解密」)', 'Saved as the default key (reopening the page will go straight to Encrypt/Decrypt)'],
  '推导失败: {m}': ['推導失敗: {m}', 'Derivation failed: {m}'],
  '密钥管理': ['金鑰管理', 'Key Management'],
  '加解密': ['加解密', 'Encrypt / Decrypt'],
  ' SM2 说明 ': [' SM2 說明 ', ' SM2 notes '],
  '密文长度 ({len} 字节) 与私钥模长 ({mod} 字节) 不匹配': ['密文長度 ({len} 位元組) 與私鑰模長 ({mod} 位元組) 不匹配', 'Ciphertext length ({len} bytes) does not match the private-key modulus ({mod} bytes)'],
  '解密失败: 私钥与密文不匹配或密文已损坏 (块 {blk})': ['解密失敗: 私鑰與密文不匹配或密文已損壞 (區塊 {blk})', 'Decryption failed: private key does not match the ciphertext, or the ciphertext is corrupted (block {blk})'],
  '私钥超出合法范围 [1, n-1]': ['私鑰超出合法範圍 [1, n-1]', 'Private key out of range [1, n-1]'],
  '公钥不合法: 需要 04||X(64)||Y(64) 未压缩格式': ['公鑰不合法: 需要 04||X(64)||Y(64) 未壓縮格式', 'Invalid public key: needs uncompressed 04||X(64)||Y(64) format'],
  '公钥点不在 SM2 曲线上': ['公鑰點不在 SM2 曲線上', 'Public key point is not on the SM2 curve'],
  '密文格式不合法: 需要 C1(04||x||y 或 x||y) || C3(32) || C2': ['密文格式不合法: 需要 C1(04||x||y 或 x||y) || C3(32) || C2', 'Invalid ciphertext layout: expected C1(04||x||y or x||y) || C3(32) || C2'],
  '密文 C1 点不在曲线上': ['密文 C1 點不在曲線上', 'The C1 point of the ciphertext is not on the curve'],
  '校验失败: C3 不匹配 (密钥错误或密文被篡改)': ['校驗失敗: C3 不匹配 (金鑰錯誤或密文被竄改)', 'Verification failed: C3 mismatch (wrong key or tampered ciphertext)'],
  '生成失败': ['產生失敗', 'Generation failed'],
  '推导失败': ['推導失敗', 'Derivation failed'],
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

