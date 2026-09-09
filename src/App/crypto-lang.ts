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
  '编码:': ['編碼:', 'Encoding:'],
  '循环次数:': ['循環次數:', 'Rounds:'],
  '加密失败': ['加密失敗', 'Encryption failed'],
  '解密失败': ['解密失敗', 'Decryption failed'],
  '输入需要进行 RC4 加密的内容  或 拖拽文件到框内打开': ['輸入需要進行 RC4 加密的內容  或 拖曳檔案到框內開啟', 'Enter the content to RC4-encrypt, or drop a file into the box'],
  '输入需要进行 CR4 解密的内容  或 拖拽文件到框内打开': ['輸入需要進行 RC4 解密的內容  或 拖曳檔案到框內開啟', 'Enter the content to RC4-decrypt, or drop a file into the box'],
  '输入需要进行 XXTEA 加密的内容 或 拖拽文件到框内打开': ['輸入需要進行 XXTEA 加密的內容 或 拖曳檔案到框內開啟', 'Enter the content to XXTEA-encrypt, or drop a file into the box'],
  '输入需要进行 XXTEA 解密的内容 或 拖拽文件到框内打开': ['輸入需要進行 XXTEA 解密的內容 或 拖曳檔案到框內開啟', 'Enter the content to XXTEA-decrypt, or drop a file into the box'],
  '输入需要进行 TEA 加密的内容 或 拖拽文件到框内打开': ['輸入需要進行 TEA 加密的內容 或 拖曳檔案到框內開啟', 'Enter the content to TEA-encrypt, or drop a file into the box'],
  '输入需要进行 TEA 解密的内容 或 拖拽文件到框内打开': ['輸入需要進行 TEA 解密的內容 或 拖曳檔案到框內開啟', 'Enter the content to TEA-decrypt, or drop a file into the box'],
  '输入需要进行 XTEA 加密的内容 或 拖拽文件到框内打开': ['輸入需要進行 XTEA 加密的內容 或 拖曳檔案到框內開啟', 'Enter the content to XTEA-encrypt, or drop a file into the box'],
  '输入需要进行 XTEA 解密的内容 或 拖拽文件到框内打开': ['輸入需要進行 XTEA 解密的內容 或 拖曳檔案到框內開啟', 'Enter the content to XTEA-decrypt, or drop a file into the box'],
  '模式:': ['模式:', 'Mode:'],
  '填充:': ['填充:', 'Padding:'],
  '位数:': ['位數:', 'Key size:'],
  '偏移量(IV):': ['偏移量(IV):', 'IV (offset):'],
  'ECB 模式无需 IV': ['ECB 模式無需 IV', 'ECB mode needs no IV'],
  '非 ECB 模式需要填写偏移量 (IV)': ['非 ECB 模式需要填寫偏移量 (IV)', 'A non-ECB mode requires an IV'],
  '偏移量需为 {n} 个字符或 {bits} 位 HEX': ['偏移量需為 {n} 個字元或 {bits} 位 HEX', 'The IV must be {n} characters or {bits} HEX digits'],
  '密钥需为 {need} 个字符 (UTF-8 {need} 字节), 当前 {len} 字节': ['金鑰需為 {need} 個字元 (UTF-8 {need} 位元組), 目前 {len} 位元組', 'The key must be {need} characters (UTF-8: {need} bytes); got {len} bytes'],
  '密钥口令不能为空': ['金鑰口令不能為空', 'The passphrase must not be empty'],
  'nonce 格式不正确': ['nonce 格式不正確', 'Invalid nonce format'],
  '计数器需为 0~2^32-1 的整数': ['計數器需為 0~2^32-1 的整數', 'The counter must be an integer in 0~2^32-1'],
  '口令经 SHA-256 派生为 32 字节密钥 (恰 32 字符时直接使用)': ['口令經 SHA-256 派生為 32 位元組金鑰 (恰 32 字元時直接使用)', 'The passphrase is derived via SHA-256 into a 32-byte key (a 32-character passphrase is used as-is)'],
  ' 24 HEX 或 12 字符': [' 24 HEX 或 12 字元', ' 24 HEX or 12 characters'],
  '密钥口令:': ['金鑰口令:', 'Passphrase:'],
  '计数器(初始值):': ['計數器(初始值):', 'Counter (initial):'],
  '输入需要进行 ChaCha20 加密的内容  或 拖拽文件到框内打开': ['輸入需要進行 ChaCha20 加密的內容  或 拖曳檔案到框內開啟', 'Enter the content to ChaCha20-encrypt, or drop a file into the box'],
  '输入需要进行 ChaCha20 解密的内容  或 拖拽文件到框内打开': ['輸入需要進行 ChaCha20 解密的內容  或 拖曳檔案到框內開啟', 'Enter the content to ChaCha20-decrypt, or drop a file into the box'],
  '输入需要进行 Rabbit 加密的内容 或 拖拽文件到框内打开': ['輸入需要進行 Rabbit 加密的內容 或 拖曳檔案到框內開啟', 'Enter the content to Rabbit-encrypt, or drop a file into the box'],
  '输入需要进行 Rabbit 解密的内容 或 拖拽文件到框内打开': ['輸入需要進行 Rabbit 解密的內容 或 拖曳檔案到框內開啟', 'Enter the content to Rabbit-decrypt, or drop a file into the box'],
  '输入需要进行 Blowfish 加密的内容  或 拖拽文件到框内打开': ['輸入需要進行 Blowfish 加密的內容  或 拖曳檔案到框內開啟', 'Enter the content to Blowfish-encrypt, or drop a file into the box'],
  '输入需要进行 Blowfish 解密的内容  或 拖拽文件到框内打开': ['輸入需要進行 Blowfish 解密的內容  或 拖曳檔案到框內開啟', 'Enter the content to Blowfish-decrypt, or drop a file into the box'],
  '输入需要进行 RC2 加密的内容  或 拖拽文件到框内打开': ['輸入需要進行 RC2 加密的內容  或 拖曳檔案到框內開啟', 'Enter the content to RC2-encrypt, or drop a file into the box'],
  '输入需要进行 RC2 解密的内容  或 拖拽文件到框内打开': ['輸入需要進行 RC2 解密的內容  或 拖曳檔案到框內開啟', 'Enter the content to RC2-decrypt, or drop a file into the box'],
  '输入需要进行 RC5 加密的内容  或 拖拽文件到框内打开': ['輸入需要進行 RC5 加密的內容  或 拖曳檔案到框內開啟', 'Enter the content to RC5-encrypt, or drop a file into the box'],
  '输入需要进行 RC5 解密的内容  或 拖拽文件到框内打开': ['輸入需要進行 RC5 解密的內容  或 拖曳檔案到框內開啟', 'Enter the content to RC5-decrypt, or drop a file into the box'],
  '输入需要进行 RC6 加密的内容  或 拖拽文件到框内打开': ['輸入需要進行 RC6 加密的內容  或 拖曳檔案到框內開啟', 'Enter the content to RC6-encrypt, or drop a file into the box'],
  '输入需要进行 RC6 解密的内容  或 拖拽文件到框内打开': ['輸入需要進行 RC6 解密的內容  或 拖曳檔案到框內開啟', 'Enter the content to RC6-decrypt, or drop a file into the box'],
  '输入需要进行 AES 加密的内容  或 拖拽文件到框内打开': ['輸入需要進行 AES 加密的內容  或 拖曳檔案到框內開啟', 'Enter the content to AES-encrypt, or drop a file into the box'],
  '输入需要进行 AES 解密的内容  或 拖拽文件到框内打开': ['輸入需要進行 AES 解密的內容  或 拖曳檔案到框內開啟', 'Enter the content to AES-decrypt, or drop a file into the box'],
  '输入需要进行 DES 加密的内容 或 拖拽文件到框内打开': ['輸入需要進行 DES 加密的內容 或 拖曳檔案到框內開啟', 'Enter the content to DES-encrypt, or drop a file into the box'],
  '输入需要进行 DES 解密的内容 或 拖拽文件到框内打开': ['輸入需要進行 DES 解密的內容 或 拖曳檔案到框內開啟', 'Enter the content to DES-decrypt, or drop a file into the box'],
  '输入需要进行 3DES 加密的内容 或 拖拽文件到框内打开': ['輸入需要進行 3DES 加密的內容 或 拖曳檔案到框內開啟', 'Enter the content to 3DES-encrypt, or drop a file into the box'],
  '输入需要进行 3DES 解密的内容 或 拖拽文件到框内打开': ['輸入需要進行 3DES 解密的內容 或 拖曳檔案到框內開啟', 'Enter the content to 3DES-decrypt, or drop a file into the box'],
  'GCM 为认证加密模式, 无需填充; 输出 / 输入格式为 密文 + 16 字节认证标签': ['GCM 為認證加密模式, 無需填充; 輸出 / 輸入格式為 密文 + 16 位元組認證標籤', 'GCM is an authenticated-encryption mode and needs no padding; the output / input format is ciphertext + a 16-byte auth tag'],
  '输出为 密文+16字节认证标签, IV 建议 12 字节': ['輸出為 密文+16 位元組認證標籤, IV 建議 12 位元組', 'Output is ciphertext + a 16-byte auth tag; an IV of 12 bytes is recommended'],
  'ChaCha20 密钥必须为 32 字节': ['ChaCha20 金鑰必須為 32 位元組', 'A ChaCha20 key must be 32 bytes'],
  'ChaCha20 nonce 必须为 12 字节': ['ChaCha20 nonce 必須為 12 位元組', 'A ChaCha20 nonce must be 12 bytes'],
  'nonce 需为 24 位 HEX 或 12 个字符 (UTF-8)': ['nonce 需為 24 位 HEX 或 12 個字元 (UTF-8)', 'The nonce must be 24 HEX digits or 12 characters (UTF-8)'],
  'HEX 长度必须为偶数': ['HEX 長度必須為偶數', 'HEX length must be even'],
  'HEX 包含非法字符': ['HEX 包含非法字元', 'HEX contains invalid characters'],
  'Base64 内容解析失败': ['Base64 內容解析失敗', 'Failed to parse Base64 content'],
  '密钥字节长度必须为 16 / 24 / 32 (AES-128/192/256)': ['金鑰位元組長度必須為 16 / 24 / 32 (AES-128/192/256)', 'The key length in bytes must be 16 / 24 / 32 (AES-128/192/256)'],
  'GCM IV 不能为空': ['GCM IV 不能為空', 'The GCM IV must not be empty'],
  'GCM 密文长度过短 (缺少认证标签)': ['GCM 密文長度過短 (缺少認證標籤)', 'GCM ciphertext too short (missing auth tag)'],
  'GCM 认证失败: 密文可能被篡改或密钥 / IV 不正确': ['GCM 認證失敗: 密文可能被竄改或金鑰 / IV 不正確', 'GCM authentication failed: the ciphertext may be tampered with, or the key / IV is wrong'],
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


// lib 抛出的动态中文错误统一翻译: 固定消息走字典, 数值模板走正则解析
export const crErr = (locale: string, m: string): string => {
  let mm: RegExpExecArray | null;
  if ((mm = /^密钥需为 (\d+) 个字符 \(UTF-8 \d+ 字节\), 当前 (\d+) 字节$/.exec(m)))
    return crT(locale, '密钥需为 {need} 个字符 (UTF-8 {need} 字节), 当前 {len} 字节', { need: +mm[1], len: +mm[2] });
  if ((mm = /^偏移量需为 (\d+) 个字符或 (\d+) 位 HEX$/.exec(m)))
    return crT(locale, '偏移量需为 {n} 个字符或 {bits} 位 HEX', { n: +mm[1], bits: +mm[2] });
  if ((mm = /^Type 7 第 (\d+) 位起含非十六进制字符$/.exec(m)))
    return crT(locale, 'Type 7 第 {pos} 位起含非十六进制字符', { pos: +mm[1] });
  return cr(locale, m);
};
