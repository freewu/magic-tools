// CMACCalc 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "CMAC 計算" },
  en: { appName: "CMAC Calculator" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '复制': ['複製', 'Copy'],
  '复制到粘贴板成功！！！': ['複製到剪貼簿成功！！！', 'Copied to clipboard!!!'],
  '左': ['左', 'Left'],
  '写': ['寫', 'Write'],
  '十六进制': ['十六進位', 'Hexadecimal'],
  '密钥': ['金鑰', 'Secret'],
  '位数': ['位數', 'Digits'],
  '8 位': ['8 位', '8 digits'],
  'px': ['px', 'px'],
  '输入格式:': ['輸入格式:', 'Input format:'],
  '{n} 字节': ['{n} 位元組', '{n} bytes'],
  'UTF-8 文本': ['UTF-8 文字', 'UTF-8 text'],
  'HEX (十六进制)': ['HEX (十六進位)', 'HEX (hexadecimal)'],
  '消息的十六进制, 如 6bc1bee22e409f96e93d7e117393172a': ['訊息的十六進位, 如 6bc1bee22e409f96e93d7e117393172a', 'Message hex, e.g. 6bc1bee22e409f96e93d7e117393172a'],
  '需要计算 CMAC 的消息内容, 可为空(空消息也合法)': ['需要計算 CMAC 的訊息內容, 可為空(空訊息也合法)', 'Message to compute CMAC for — may be empty (an empty message is valid)'],
  '消息 (M):': ['訊息 (M):', 'Message (M):'],
  '密钥 (K):': ['金鑰 (K):', 'Key (K):'],
  '密钥位数:': ['金鑰位數:', 'Key size:'],
  '密钥的十六进制 ({c} 个字符), 如 2b7e151628aed2a6abf7158809cf4f3c': ['金鑰的十六進位 ({c} 個字元), 如 2b7e151628aed2a6abf7158809cf4f3c', 'Key hex ({c} chars), e.g. 2b7e151628aed2a6abf7158809cf4f3c'],
  '密钥 {b} 字节 (ASCII 即 {b} 个字符)': ['金鑰 {b} 位元組 (ASCII 即 {b} 個字元)', 'Key of {b} bytes ({b} ASCII chars)'],
  '计算 CMAC': ['計算 CMAC', 'Compute CMAC'],
  '大写显示': ['大寫顯示', 'Uppercase output'],
  '密钥不能为空': ['金鑰不能為空', 'Key must not be empty'],
  '消息内容不能为空': ['訊息內容不能為空', 'Message must not be empty'],
  '双击复制结果到粘贴板': ['雙擊複製結果到剪貼簿', 'Double-click to copy the result'],
  'CMAC 标签 (16 字节 / 32 个十六进制字符)': ['CMAC 標籤 (16 位元組 / 32 個十六進位字元)', 'CMAC tag (16 bytes / 32 hex chars)'],
  'HEX 密钥应为 {c} 个十六进制字符 ({b} 字节)': ['HEX 金鑰應為 {c} 個十六進位字元 ({b} 位元組)', 'HEX key must be {c} hex characters ({b} bytes)'],
  '密钥需为 {b} 个字符/字节 (当前 {n} 字节, 中文等多字节字符按 UTF-8 计算)': ['金鑰需為 {b} 個字元/位元組 (目前 {n} 位元組, 中文等多位元組字元按 UTF-8 計算)', 'Key must be {b} characters/bytes (currently {n} bytes; multi-byte chars such as CJK are counted as UTF-8)'],
  '计算失败: {m}': ['計算失敗: {m}', 'Computation failed: {m}'],
  '字节': ['位元組', 'bytes'],
  '位': ['位', 'bits'],
  'r:': ['r:', 'r:'],
  'p:': ['p:', 'p:'],
  '计算': ['計算', 'Compute'],
  '字符': ['字元', 'Characters'],
  '清除': ['清除', 'Clear'],
  '个': ['個', ''],
  '分': ['分', 'm'],
  '时': ['時', 'h'],
  '或': ['或', 'OR'],
};

// 取词: 无命中回退 zh 原文 (与共享 ui-lang 行为一致)
export const u = (locale: string, zh: string): string => {
  const hit = uilangRows[zh];
  if (!hit) return zh;
  return locale === 'zh-TW' ? hit[0] : locale === 'en' ? hit[1] : zh;
};
export const uT = (locale: string, zhTpl: string, vars?: Record<string, string | number>): string => {
  let out = u(locale, zhTpl);
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
  return out;
};

