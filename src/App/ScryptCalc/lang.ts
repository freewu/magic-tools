// ScryptCalc 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  en: { appName: "Scrypt" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '复制': ['複製', 'Copy'],
  '复制到粘贴板成功！！！': ['複製到剪貼簿成功！！！', 'Copied to clipboard!!!'],
  '写': ['寫', 'Write'],
  '执行': ['執行', 'Execute'],
  '十六进制': ['十六進位', 'Hexadecimal'],
  '密钥': ['金鑰', 'Secret'],
  '计数': ['計數', 'Counter'],
  '+1': ['+1', '+1'],
  'px': ['px', 'px'],
  '长度:': ['長度:', 'Length:'],
  '大写显示': ['大寫顯示', 'Uppercase output'],
  '双击复制结果到粘贴板': ['雙擊複製結果到剪貼簿', 'Double-click to copy the result'],
  '计算失败: {m}': ['計算失敗: {m}', 'Computation failed: {m}'],
  '字节': ['位元組', 'bytes'],
  '位': ['位', 'bits'],
  '口令': ['口令', 'Password'],
  '校验': ['校驗', 'Verify'],
  '盐': ['鹽', 'Salt'],
  '内存开销 = 128 · N · r 字节': ['記憶體開銷 = 128 · N · r 位元組', 'Memory usage = 128 · N · r bytes'],
  '口令:': ['口令:', 'Password:'],
  '盐值:': ['鹽值:', 'Salt:'],
  '口令 (Password)': ['口令 (Password)', 'Password'],
  '盐 (Salt, 十六进制字符串或任意文本)': ['鹽 (Salt, 十六進位字串或任意文字)', 'Salt (hex string or any text)'],
  '随机盐': ['隨機鹽', 'Random salt'],
  'N:': ['N:', 'N:'],
  'r:': ['r:', 'r:'],
  'p:': ['p:', 'p:'],
  '派生长度:': ['派生長度:', 'Derived length:'],
  '计算': ['計算', 'Compute'],
  '请输入口令': ['請輸入口令', 'Enter a password'],
  '请输入盐值': ['請輸入鹽值', 'Enter a salt'],
  '派生密钥 (十六进制)': ['派生金鑰 (十六進位)', 'Derived key (hex)'],
  '计算耗时: {ms} ms': ['計算耗時: {ms} ms', 'Took {ms} ms'],
  '字符': ['字元', 'Characters'],
  '清除': ['清除', 'Clear'],
  '随机': ['隨機', 'Random'],
  '个': ['個', ''],
  '至': ['至', 'to'],
  '每': ['每', 'Every'],
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

