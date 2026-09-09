// OTPGenerator 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "OTP 密碼生成器" },
  en: { appName: "OTP Generator" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '已复制': ['已複製', 'Copied'],
  '复制': ['複製', 'Copy'],
  '写': ['寫', 'Write'],
  '数字': ['數字', 'Numeric'],
  '动态口令': ['動態口令', 'One-time password'],
  'TOTP (时间)': ['TOTP (時間)', 'TOTP (time-based)'],
  'HOTP (计数)': ['HOTP (計數)', 'HOTP (counter-based)'],
  '兼容 Google / Microsoft Authenticator': ['相容 Google / Microsoft Authenticator', 'Works with Google / Microsoft Authenticator'],
  '密钥': ['金鑰', 'Secret'],
  '算法': ['演算法', 'Algorithm'],
  '位数': ['位數', 'Digits'],
  '步长(秒)': ['步長(秒)', 'Step (sec)'],
  '计数': ['計數', 'Counter'],
  '+1': ['+1', '+1'],
  'Base32, 如 GEZDGNBV…': ['Base32, 如 GEZDGNBV…', 'Base32, e.g. GEZDGNBV…'],
  '随机生成密钥': ['隨機產生金鑰', 'Generate a random secret'],
  '6 位': ['6 位', '6 digits'],
  '7 位': ['7 位', '7 digits'],
  '8 位': ['8 位', '8 digits'],
  '名称': ['名稱', 'Issuer'],
  '账号': ['帳號', 'Account'],
  '如 GitHub (可选)': ['如 GitHub (可選)', 'e.g. GitHub (optional)'],
  '用于扫码导入的标签': ['用於掃碼匯入的標籤', 'Label used when importing via QR'],
  '当前验证码': ['目前驗證碼', 'Current code'],
  '当前验证码 (每次使用后计数 +1)': ['目前驗證碼 (每次使用後計數 +1)', 'Current code (counter +1 after each use)'],
  '验证码已复制': ['驗證碼已複製', 'Code copied'],
  'otpauth 链接已复制': ['otpauth 連結已複製', 'otpauth link copied'],
  '{r} 秒后刷新': ['{r} 秒後刷新', 'Refreshes in {r}s'],
  '扫码添加至 Authenticator (otpauth://)': ['掃碼加入 Authenticator (otpauth://)', 'Scan to add to Authenticator (otpauth://)'],
  '复制导入链接': ['複製匯入連結', 'Copy import link'],
  '请输入或生成密钥': ['請輸入或產生金鑰', 'Enter or generate a secret'],
  '密钥格式有误': ['金鑰格式有誤', 'Invalid secret format'],
  '生成': ['產生', 'Generate'],
  '刷新': ['重新整理', 'Refresh'],
  '密钥不能为空': ['金鑰不能為空', 'Key must not be empty'],
  '字节': ['位元組', 'bytes'],
  '次': ['次', 'times'],
  '位': ['位', 'bits'],
  '口令': ['口令', 'Password'],
  'r:': ['r:', 'r:'],
  'p:': ['p:', 'p:'],
  '计算': ['計算', 'Compute'],
  '密码': ['密碼', 'Password'],
  '字符': ['字元', 'Characters'],
  '随机': ['隨機', 'Random'],
  '时间': ['時間', 'Time'],
  '至': ['至', 'to'],
  '每': ['每', 'Every'],
  '秒': ['秒', 's'],
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

