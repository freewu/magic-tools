// 加解密 (crypto) 分类页面共享词条: zh 原文即 key, 值为 [zh-TW, en]
// 用法: const t = (zh:string) => cr(locale, zh); 动态模板: crT(locale, zhTpl, {x:...}) (占位符 {x})
// 各工具 lib.ts 抛出的错误文案不修改源码, 在渲染/catch 处用 t() 包装翻译
type CrRec = Record<string, [string, string]>;
const D: CrRec = {
  '复制到粘贴板成功！！！': ['複製到剪貼簿成功！！！', 'Copied to clipboard!!!'],
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
  // 凯撒 CaesarCrypto
  '位移量 (右移, 负数向左):': ['位移量 (右移, 負數向左):', 'Shift (right; negative = left):'],
  '仅对英文字母循环位移, 中文 / 数字 / 符号原样保留': ['僅對英文字母循環位移, 中文 / 數字 / 符號原樣保留', 'Only English letters are shifted cyclically; Chinese characters, digits and symbols stay unchanged'],
  '输入需要加密的明文, 例如 Hello, World!  或 拖拽文件到框内打开': ['輸入需要加密的明文, 例如 Hello, World!  或 拖曳檔案到框內開啟', 'Enter the plaintext to encrypt, e.g. Hello, World!, or drop a file into the box'],
  '加密结果自动显示在此; 也可粘贴外部密文后点「解密」  或 拖拽文件到框内打开': ['加密結果自動顯示在此; 也可貼上外部密文後點「解密」  或 拖曳檔案到框內開啟', 'The encrypted result appears here; you can also paste external ciphertext and click Decrypt, or drop a file into the box'],
  '请输入位移量 (整数)': ['請輸入位移量 (整數)', 'Enter a shift (integer)'],
  '输入中未包含英文字母, 加密结果将与原文相同': ['輸入中未包含英文字母, 加密結果將與原文相同', 'No English letters found in the input — the result equals the original'],
  ' 凯撒密码说明 ': [' 凱撒密碼說明 ', ' Caesar cipher notes '],
  '位移量必须为整数': ['位移量必須為整數', 'Shift must be an integer'],
  // 栅栏 RailFenceCrypto
  '请输入栏数 (不小于 2 的整数)': ['請輸入欄數 (不小於 2 的整數)', 'Enter the number of rails (an integer ≥ 2)'],
  '栏数:': ['欄數:', 'Rails:'],
  '按锯齿形写入 N 栏后逐栏读出, 支持中文等任意字符 (2 栏时即奇偶位分离)': ['按鋸齒形寫入 N 欄後逐欄讀出, 支援中文等任意字元 (2 欄時即奇偶位分離)', 'Text is written in a zigzag across N rails, then read rail by rail; any characters incl. Chinese are supported (2 rails equals an odd/even split)'],
  '输入需要加密的明文, 例如 WEAREDISCOVEREDFLEEATONCE  或 拖拽文件到框内打开': ['輸入需要加密的明文, 例如 WEAREDISCOVEREDFLEEATONCE  或 拖曳檔案到框內開啟', 'Enter the plaintext to encrypt, e.g. WEAREDISCOVEREDFLEEATONCE, or drop a file into the box'],
  ' 栅栏密码说明 ': [' 柵欄密碼說明 ', ' Rail fence cipher notes '],
  '栏数必须为不小于 1 的整数': ['欄數必須為不小於 1 的整數', 'Rails must be an integer ≥ 1'],
  // Cisco Type 7
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
  '密钥:': ['金鑰:', 'Key:'],
  '英文字母, 例如 LEMON': ['英文字母, 例如 LEMON', 'English letters, e.g. LEMON'],
  '密钥仅支持英文字母': ['金鑰僅支援英文字母', 'The key accepts English letters only'],
  '请输入密钥': ['請輸入金鑰', 'Enter a key'],
  '密钥字母循环决定每个明文字母的位移量; 数字 / 符号 / 中文不参与, 原样保留': ['金鑰字母循環決定每個明文字母的位移量; 數字 / 符號 / 中文不參與, 原樣保留', 'Key letters are repeated to set the shift of each plaintext letter; digits / symbols / Chinese do not participate and stay unchanged'],
  '输入需要加密的明文, 例如 ATTACKATDAWN  或 拖拽文件到框内打开': ['輸入需要加密的明文, 例如 ATTACKATDAWN  或 拖曳檔案到框內開啟', 'Enter the plaintext to encrypt, e.g. ATTACKATDAWN, or drop a file into the box'],
  ' 维吉尼亚密码说明 ': [' 維吉尼亞密碼說明 ', ' Vigenère cipher notes '],
  '密钥 (矩阵):': ['金鑰 (矩陣):', 'Key (matrix):'],
  '4 个字母 = 2×2 (如 HILL), 9 个字母 = 3×3 (如 GYBNQKURP)': ['4 個字母 = 2×2 (如 HILL), 9 個字母 = 3×3 (如 GYBNQKURP)', '4 letters = 2×2 (e.g. HILL), 9 letters = 3×3 (e.g. GYBNQKURP)'],
  '当前为 {n}×{n} 矩阵': ['目前為 {n}×{n} 矩陣', 'Currently a {n}×{n} matrix'],
  '仅处理 A-Z 字母 (其它字符自动移除), 末尾自动补 X 凑整块': ['僅處理 A-Z 字母 (其它字元自動移除), 末尾自動補 X 湊整塊', 'Only A-Z letters are processed (other characters are removed); the end is padded with X to complete the last block'],
  '密钥长度需为 4 个字母 (2×2) 或 9 个字母 (3×3)': ['金鑰長度需為 4 個字母 (2×2) 或 9 個字母 (3×3)', 'The key must be 4 letters (2×2) or 9 letters (3×3)'],
  '输入需要加密的明文 (只保留字母), 例如 ACT / SHORT  或 拖拽文件到框内打开': ['輸入需要加密的明文 (只保留字母), 例如 ACT / SHORT  或 拖曳檔案到框內開啟', 'Enter the plaintext to encrypt (letters only), e.g. ACT / SHORT, or drop a file into the box'],
  '加密结果自动显示在此 (大写字母); 也可粘贴外部密文后点「解密」  或 拖拽文件到框内打开': ['加密結果自動顯示在此 (大寫字母); 也可貼上外部密文後點「解密」  或 拖曳檔案到框內開啟', 'The result (uppercase letters) appears here; you can also paste external ciphertext and click Decrypt, or drop a file into the box'],
  ' 希尔密码说明 ': [' 希爾密碼說明 ', ' Hill cipher notes '],
};
export const cr = (locale: string, zh: string): string => {
  const e = D[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const crT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = cr(locale, zh);
  if (v) for (const [k, val] of Object.entries(v)) s = s.split('{'+k+'}').join(String(val));
  return s;
};
