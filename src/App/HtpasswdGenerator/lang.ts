// HtpasswdGenerator 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  en: { appName: "htpasswd Generator" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '复制': ['複製', 'Copy'],
  '数组': ['陣列', 'Array'],
  '写': ['寫', 'Write'],
  '算法': ['演算法', 'Algorithm'],
  '账号': ['帳號', 'Account'],
  'px': ['px', 'px'],
  '强': ['強', 'Strong'],
  '生成': ['產生', 'Generate'],
  '二进制': ['二進位', 'Binary'],
  'UTF-8 文本': ['UTF-8 文字', 'UTF-8 text'],
  '字节': ['位元組', 'bytes'],
  '次': ['次', 'times'],
  '位': ['位', 'bits'],
  '校验': ['校驗', 'Verify'],
  '生成失败: {m}': ['產生失敗: {m}', 'Generation failed: {m}'],
  '盐': ['鹽', 'Salt'],
  '随机盐': ['隨機鹽', 'Random salt'],
  'r:': ['r:', 'r:'],
  'p:': ['p:', 'p:'],
  '计算': ['計算', 'Compute'],
  '密码': ['密碼', 'Password'],
  '加密方式': ['加密方式', 'Encryption method'],
  '如 admin': ['如 admin', 'e.g. admin'],
  '输入密码': ['輸入密碼', 'Enter password'],
  '生成成功, 可双击下方结果复制': ['產生成功, 可雙擊下方結果複製', 'Generated — double-click the result below to copy it'],
  '复制到粘贴板成功!!!': ['複製到剪貼簿成功!!!', 'Copied to clipboard!!!'],
  '保存 .htpasswd 文件': ['儲存 .htpasswd 檔案', 'Save .htpasswd file'],
  '已保存 .htpasswd 文件': ['已儲存 .htpasswd 檔案', '.htpasswd file saved'],
  '生成结果: 用户名:密码哈希': ['產生結果: 使用者名稱:密碼雜湊', 'Result: username:password-hash'],
  '双击复制内容到粘贴板': ['雙擊複製內容到剪貼簿', 'Double-click to copy the content'],
  '保存为 .htpasswd 文件': ['儲存為 .htpasswd 檔案', 'Save as .htpasswd file'],
  'htpasswd 生成说明': ['htpasswd 產生說明', 'About htpasswd generation'],
  'bcrypt ($2y$)': ['bcrypt ($2y$)', 'bcrypt ($2y$)'],
  'Apache MD5 ($apr1$)': ['Apache MD5 ($apr1$)', 'Apache MD5 ($apr1$)'],
  'SHA1 ({SHA})': ['SHA1 ({SHA})', 'SHA1 ({SHA})'],
  '明文 (不推荐)': ['明文 (不推薦)', 'Plain (not recommended)'],
  '自带随机盐, 抗暴力破解能力最强, 新密码推荐使用 (部分旧系统需 Apache 2.4+)': ['內建隨機鹽, 抗暴力破解能力最強, 新密碼建議使用 (部分舊系統需 Apache 2.4+)', 'Built-in random salt; strongest brute-force resistance — recommended for new passwords (some legacy systems need Apache 2.4+)'],
  'Apache 默认算法, 兼容性最好, 除 Apache 外的多数 Web 服务均支持': ['Apache 預設演算法, 相容性最好, 除 Apache 外的多數 Web 服務皆支援', 'Apache default algorithm; best compatibility — supported by most web servers besides Apache'],
  '固定盐值 (无盐), 存在彩虹表风险, 不建议用于新密码': ['固定鹽值 (無鹽), 有彩虹表風險, 不建議用於新密碼', 'Fixed salt (no salt); rainbow-table risk — not recommended for new passwords'],
  '密码以明文存储, 部分服务端编译时已禁用该方式': ['密碼以明文儲存, 部分伺服器編譯時已停用該方式', 'Stores the password in plain text; some server builds disable this method'],
  '字符': ['字元', 'Characters'],
  '清除': ['清除', 'Clear'],
  '确定': ['確定', 'OK'],
  '随机': ['隨機', 'Random'],
  '文字': ['文字', 'Text'],
  '文本文件': ['文字檔', 'Text file'],
  '个': ['個', ''],
  '每': ['每', 'Every'],
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

