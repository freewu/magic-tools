// HKDFCalc 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "HKDF 計算" },
  en: { appName: "HKDF" },
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
  '长度:': ['長度:', 'Length:'],
  '输入格式:': ['輸入格式:', 'Input format:'],
  'UTF-8 文本': ['UTF-8 文字', 'UTF-8 text'],
  'HEX (十六进制)': ['HEX (十六進位)', 'HEX (hexadecimal)'],
  '大写显示': ['大寫顯示', 'Uppercase output'],
  '双击复制结果到粘贴板': ['雙擊複製結果到剪貼簿', 'Double-click to copy the result'],
  '计算失败: {m}': ['計算失敗: {m}', 'Computation failed: {m}'],
  '字节': ['位元組', 'bytes'],
  '算法:': ['演算法:', 'Algorithm:'],
  '输出长度:': ['輸出長度:', 'Output length:'],
  '散列算法:': ['雜湊演算法:', 'Hash algorithm:'],
  'IKM (输入密钥材料):': ['IKM (輸入金鑰材料):', 'IKM (input keying material):'],
  'IKM 的十六进制, 如 0b0b0b0b...': ['IKM 的十六進位, 如 0b0b0b0b...', 'IKM hex, e.g. 0b0b0b0b...'],
  'IKM 密钥材料 (任意文本)': ['IKM 金鑰材料 (任意文字)', 'IKM keying material (any text)'],
  'Salt (盐值, 可空):': ['Salt (鹽值, 可空):', 'Salt (optional):'],
  '盐值, 为空时使用全零(长度=散列长度)': ['鹽值, 為空時使用全零(長度=雜湊長度)', 'Salt — empty uses all zeros (hash length)'],
  'Info (上下文信息, 可空):': ['Info (上下文資訊, 可空):', 'Info (context, optional):'],
  '可选的应用上下文信息': ['可選的應用上下文資訊', 'Optional application context'],
  '计算 HKDF': ['計算 HKDF', 'Compute HKDF'],
  'IKM 不能为空': ['IKM 不能為空', 'IKM must not be empty'],
  'HKDF 输出 ({b} 字节, {c} 个十六进制字符)': ['HKDF 輸出 ({b} 位元組, {c} 個十六進位字元)', 'HKDF output ({b} bytes, {c} hex chars)'],
  '盐': ['鹽', 'Salt'],
  'r:': ['r:', 'r:'],
  'p:': ['p:', 'p:'],
  '计算': ['計算', 'Compute'],
  '字符': ['字元', 'Characters'],
  '清除': ['清除', 'Clear'],
  '个': ['個', ''],
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

