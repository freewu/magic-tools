// ZucCrypto 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "祖沖之序列密碼" },
  en: { appName: "ZUC Encrypt / Decrypt" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const cryptolangRows: Record<string, [string, string]> = {
  '复制到粘贴板成功！！！': ['複製到剪貼簿成功！！！', 'Copied to clipboard!!!'],
  '双击复制内容到粘贴板': ['雙擊複製內容到剪貼簿', 'Double-click to copy'],
  '加密': ['加密', 'Encrypt'],
  '解密': ['解密', 'Decrypt'],
  '清除': ['清除', 'Clear'],
  '算法:': ['演算法:', 'Algorithm:'],
  '编码:': ['編碼:', 'Encoding:'],
  '密钥:': ['金鑰:', 'Key:'],
  '偏移量(IV):': ['偏移量(IV):', 'IV (offset):'],
  '随机': ['隨機', 'Random'],
  '随机生成密钥': ['隨機產生金鑰', 'Generate a random key'],
  '随机生成偏移量 IV': ['隨機產生偏移量 IV', 'Generate a random IV'],
  '当前环境不支持安全随机数 (需要 HTTPS 或 localhost), 无法生成密钥': ['目前環境不支援安全隨機數 (需要 HTTPS 或 localhost), 無法產生金鑰', 'Secure random numbers are unavailable here (HTTPS or localhost required), cannot generate a key'],
  '请输入密钥': ['請輸入金鑰', 'Please enter the key'],
  '请输入偏移量 IV': ['請輸入偏移量 IV', 'Please enter the IV'],
  '密钥只能包含十六进制字符 0-9 / a-f': ['金鑰只能包含十六進位字元 0-9 / a-f', 'The key may only contain HEX characters 0-9 / a-f'],
  '偏移量 IV 只能包含十六进制字符 0-9 / a-f': ['偏移量 IV 只能包含十六進位字元 0-9 / a-f', 'The IV may only contain HEX characters 0-9 / a-f'],
  '密钥需为 {bits} 位 HEX ({need} 字节), 当前 {got} 字节': ['金鑰需為 {bits} 位 HEX ({need} 位元組), 目前 {got} 位元組', 'The key must be {bits} HEX digits ({need} bytes); got {got} bytes'],
  '偏移量 IV 需为 {bits} 位 HEX ({need} 字节), 当前 {got} 字节': ['偏移量 IV 需為 {bits} 位 HEX ({need} 位元組), 目前 {got} 位元組', 'The IV must be {bits} HEX digits ({need} bytes); got {got} bytes'],
  '请输入需要加密的内容': ['請輸入需要加密的內容', 'Please enter the content to encrypt'],
  '请输入需要解密的内容': ['請輸入需要解密的內容', 'Please enter the content to decrypt'],
  '输入需要进行祖冲之序列密码加密的内容 或 拖拽文件到框内打开': ['輸入需要進行祖沖之序列密碼加密的內容 或 拖曳檔案到框內開啟', 'Enter the content to ZUC-encrypt, or drop a file into the box'],
  '输入需要进行祖冲之序列密码解密的内容 或 拖拽文件到框内打开': ['輸入需要進行祖沖之序列密碼解密的內容 或 拖曳檔案到框內開啟', 'Enter the content to ZUC-decrypt, or drop a file into the box'],
  '加解密失败': ['加解密失敗', 'Encrypt / decrypt failed'],
  '解密失败': ['解密失敗', 'Decryption failed'],
  '未知错误': ['未知錯誤', 'Unknown error'],
  'hex 内容不合法': ['HEX 內容不合法', 'Invalid HEX content'],
  'base64 内容不合法': ['Base64 內容不合法', 'Invalid Base64 content'],
  '密钥长度必须为 {need} 字节': ['金鑰長度必須為 {need} 位元組', 'The key must be exactly {need} bytes'],
  'IV 长度必须为 {need} 字节': ['IV 長度必須為 {need} 位元組', 'The IV must be exactly {need} bytes'],
  '引擎': ['引擎', 'Engine'],
  '引擎加载中...': ['引擎載入中...', 'Engine loading...'],
  '引擎就绪': ['引擎就緒', 'Engine ready'],
  '引擎加载失败': ['引擎載入失敗', 'Engine failed to load'],
  '密钥 / IV 使用 HEX 输入, 加密与解密为同一操作 (密钥流异或)': ['金鑰 / IV 使用 HEX 輸入, 加密與解密為同一操作 (密鑰流互斥或)', 'Key / IV are HEX input; encryption and decryption are the same operation (keystream XOR)'],
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
  if ((mm = /^密钥需为 (\d+) 位 HEX \((\d+) 字节\), 当前 (\d+) 字节$/.exec(m)))
    return crT(locale, '密钥需为 {bits} 位 HEX ({need} 字节), 当前 {got} 字节', { bits: +mm[1], need: +mm[2], got: +mm[3] });
  if ((mm = /^偏移量 IV 需为 (\d+) 位 HEX \((\d+) 字节\), 当前 (\d+) 字节$/.exec(m)))
    return crT(locale, '偏移量 IV 需为 {bits} 位 HEX ({need} 字节), 当前 {got} 字节', { bits: +mm[1], need: +mm[2], got: +mm[3] });
  // wasm 引擎自身的长度报错 (正常情况下页面已提前拦下, 这里只做兜底翻译)
  if ((mm = /^密钥长度必须为 (\d+) 字节$/.exec(m))) return crT(locale, '密钥长度必须为 {need} 字节', { need: +mm[1] });
  if ((mm = /^IV 长度必须为 (\d+) 字节$/.exec(m))) return crT(locale, 'IV 长度必须为 {need} 字节', { need: +mm[1] });
  return cr(locale, m);
};
