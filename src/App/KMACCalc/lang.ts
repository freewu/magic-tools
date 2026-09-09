// KMACCalc 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "KMAC 計算" },
  en: { appName: "KMAC Calculator" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '复制': ['複製', 'Copy'],
  '复制到粘贴板成功！！！': ['複製到剪貼簿成功！！！', 'Copied to clipboard!!!'],
  '写': ['寫', 'Write'],
  '十六进制': ['十六進位', 'Hexadecimal'],
  '密钥': ['金鑰', 'Secret'],
  '算法': ['演算法', 'Algorithm'],
  'px': ['px', 'px'],
  '强': ['強', 'Strong'],
  '长度:': ['長度:', 'Length:'],
  '输入格式:': ['輸入格式:', 'Input format:'],
  'UTF-8 文本': ['UTF-8 文字', 'UTF-8 text'],
  '大写显示': ['大寫顯示', 'Uppercase output'],
  '密钥不能为空': ['金鑰不能為空', 'Key must not be empty'],
  '双击复制结果到粘贴板': ['雙擊複製結果到剪貼簿', 'Double-click to copy the result'],
  '计算失败: {m}': ['計算失敗: {m}', 'Computation failed: {m}'],
  '字节': ['位元組', 'bytes'],
  '算法:': ['演算法:', 'Algorithm:'],
  '输出长度:': ['輸出長度:', 'Output length:'],
  'XOF 模式:': ['XOF 模式:', 'XOF mode:'],
  '可变长输出 (XOF)': ['可變長輸出 (XOF)', 'Variable-length output (XOF)'],
  '密钥 K (SP 800-185 建议 ≥ 目标安全强度字节数):': ['金鑰 K (SP 800-185 建議 ≥ 目標安全強度位元組數):', 'Key K (SP 800-185 recommends ≥ the target security strength in bytes):'],
  '密钥十六进制, 如 404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f': ['金鑰十六進位, 如 404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f', 'Key hex, e.g. 404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f'],
  '密钥 (任意文本)': ['金鑰 (任意文字)', 'Key (any text)'],
  '消息 X:': ['訊息 X:', 'Message X:'],
  '消息十六进制 (可空), 如 00010203': ['訊息十六進位 (可空), 如 00010203', 'Message hex (optional), e.g. 00010203'],
  '消息内容 (可空)': ['訊息內容 (可空)', 'Message (optional)'],
  '自定义字符串 S (Customization, 可空):': ['自訂字串 S (Customization, 可空):', 'Custom string S (optional):'],
  '如 My Tagged Application (UTF-8 文本)': ['如 My Tagged Application (UTF-8 文字)', 'e.g. My Tagged Application (UTF-8 text)'],
  '计算 KMAC': ['計算 KMAC', 'Compute KMAC'],
  'KMAC 输出 ({b} 字节, {c} 个十六进制字符)': ['KMAC 輸出 ({b} 位元組, {c} 個十六進位字元)', 'KMAC output ({b} bytes, {c} hex chars)'],
  'r:': ['r:', 'r:'],
  'p:': ['p:', 'p:'],
  '计算': ['計算', 'Compute'],
  '字符': ['字元', 'Characters'],
  '清除': ['清除', 'Clear'],
  '个': ['個', ''],
  '分': ['分', 'm'],
  '时': ['時', 'h'],
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

