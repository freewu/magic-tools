// BcryptCalc 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  en: { appName: "BCrypt" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '复制': ['複製', 'Copy'],
  '复制到粘贴板成功！！！': ['複製到剪貼簿成功！！！', 'Copied to clipboard!!!'],
  '生成': ['產生', 'Generate'],
  '字节': ['位元組', 'bytes'],
  '次': ['次', 'times'],
  'BCrypt 内置随机盐, 相同口令每次生成结果不同; 使用前请确认与目标系统相同的 $2a/$2b/$2y 前缀与成本因子': ['BCrypt 內建隨機鹽, 相同口令每次生成結果不同; 使用前請確認與目標系統相同的 $2a/$2b/$2y 前綴與成本因子', 'BCrypt embeds a random salt, so the same password yields a different hash each time. Before use, confirm the $2a/$2b/$2y prefix and cost factor match the target system'],
  '生成哈希': ['產生雜湊', 'Generate hash'],
  '口令': ['口令', 'Password'],
  '输入需要计算 BCrypt 哈希的口令 (超过 72 字节的内容会被截断)': ['輸入需要計算 BCrypt 雜湊的口令 (超過 72 位元組的內容會被截斷)', 'Enter the password to hash with BCrypt (content over 72 bytes is truncated)'],
  '成本因子': ['成本因子', 'Cost factor'],
  '生成 BCrypt': ['產生 BCrypt', 'Generate BCrypt'],
  'BCrypt': ['BCrypt', 'BCrypt'],
  '生成结果, 点击可复制': ['產生結果, 點擊可複製', 'Result — click to copy'],
  '校验': ['校驗', 'Verify'],
  '候选口令': ['候選口令', 'Candidate password'],
  'BCrypt 哈希': ['BCrypt 雜湊', 'BCrypt hash'],
  '生成失败: {m}': ['產生失敗: {m}', 'Generation failed: {m}'],
  '校验失败: {m}': ['校驗失敗: {m}', 'Verification failed: {m}'],
  'BCrypt 哈希格式不正确': ['BCrypt 雜湊格式不正確', 'Not a valid BCrypt hash'],
  '校验通过: 口令与哈希匹配': ['校驗通過: 口令與雜湊匹配', 'Match: the password matches the hash'],
  '校验失败: 口令与哈希不匹配': ['校驗失敗: 口令與雜湊不匹配', 'No match: the password does not match the hash'],
  '提示: 目标哈希成本因子为 {a}, 与上方生成区当前成本 {b} 不同': ['提示: 目標雜湊成本因子為 {a}, 與上方生成區目前成本 {b} 不同', 'Note: the target hash uses cost factor {a}, which differs from the current cost {b} in the generator above'],
  '盐': ['鹽', 'Salt'],
  '随机盐': ['隨機鹽', 'Random salt'],
  'r:': ['r:', 'r:'],
  'p:': ['p:', 'p:'],
  '计算': ['計算', 'Compute'],
  '密码': ['密碼', 'Password'],
  '字符': ['字元', 'Characters'],
  '全部': ['全部', 'All'],
  '随机': ['隨機', 'Random'],
  '解析': ['解析', 'Parse'],
  '每': ['每', 'Every'],
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

