// PBKDF2Calc 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "PBKDF2 值計算" },
  en: { appName: "PBKDF2" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '复制': ['複製', 'Copy'],
  '复制到粘贴板成功！！！': ['複製到剪貼簿成功！！！', 'Copied to clipboard!!!'],
  '写': ['寫', 'Write'],
  '密钥': ['金鑰', 'Secret'],
  '算法': ['演算法', 'Algorithm'],
  'px': ['px', 'px'],
  '长度:': ['長度:', 'Length:'],
  '双击复制结果到粘贴板': ['雙擊複製結果到剪貼簿', 'Double-click to copy the result'],
  '次': ['次', 'times'],
  '位': ['位', 'bits'],
  '算法:': ['演算法:', 'Algorithm:'],
  '盐': ['鹽', 'Salt'],
  '盐值:': ['鹽值:', 'Salt:'],
  'r:': ['r:', 'r:'],
  'p:': ['p:', 'p:'],
  '计算': ['計算', 'Compute'],
  '盐值(Salt)': ['鹽值(Salt)', 'Salt'],
  '迭代次数:': ['疊代次數:', 'Iterations:'],
  '推导密钥长度:': ['推導金鑰長度:', 'Derived key length:'],
  '大写字符显示': ['大寫字元顯示', 'Uppercase output'],
  '计算结果': ['計算結果', 'Result'],
  '字符': ['字元', 'Characters'],
  '清除': ['清除', 'Clear'],
  '个': ['個', ''],
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

