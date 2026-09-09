// RegexTester 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "正則表達式" },
  en: { appName: "Regex Tester" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '清空': ['清空', 'Clear'],
  '复制': ['複製', 'Copy'],
  '复制到粘贴板成功！！！': ['複製到剪貼簿成功！！！', 'Copied to clipboard!!!'],
  '右': ['右', 'Right'],
  '读': ['讀', 'Read'],
  '写': ['寫', 'Write'],
  '数字': ['數字', 'Numeric'],
  '位数': ['位數', 'Digits'],
  '6 位': ['6 位', '6 digits'],
  '名称': ['名稱', 'Issuer'],
  'px': ['px', 'px'],
  '常用正则 (在 设置 → 其它 中管理)': ['常用正則 (在 設定 → 其它 中管理)', 'Common regexes (managed under Settings → Misc)'],
  '一键复制规则: {p}': ['一鍵複製規則: {p}', 'Copy this rule: {p}'],
  '一键复制当前正则规则': ['一鍵複製目前正則規則', 'Copy the current regex'],
  '复制规则': ['複製規則', 'Copy rule'],
  '重新读取设置中的常用正则': ['重新讀取設定中的常用正則', 'Reload common regexes from settings'],
  '刷新': ['重新整理', 'Refresh'],
  '正则': ['正則', 'Regex'],
  'i 忽略大小写': ['i 忽略大小寫', 'i case-insensitive'],
  'g 全局': ['g 全域', 'g global'],
  'm 多行': ['m 多行', 'm multi-line'],
  's 点匹配换行': ['s 點匹配換行', 's dot matches newlines'],
  '正则表达式无效:': ['正則表達式無效:', 'Invalid regex:'],
  '在此输入多行内容, 逐行与正则匹配: 匹配行显示为绿色, 不匹配行显示为红色': ['在此輸入多行內容, 逐行與正則比對: 符合行顯示為綠色, 不符合行顯示為紅色', 'Enter multi-line content here — each line is matched: green = matched, red = not matched'],
  '复制匹配行': ['複製符合行', 'Copy matched lines'],
  '填入示例': ['填入範例', 'Load sample'],
  '清空正则': ['清空正則', 'Clear regex'],
  '匹配 {a} / {b} 行': ['符合 {a} / {b} 行', '{a} / {b} lines matched'],
  ', 共 {n} 处': [', 共 {n} 處', ', {n} matches in total'],
  '请先输入正则表达式': ['請先輸入正則表達式', 'Enter a regex first'],
  '没有匹配的行': ['沒有符合的行', 'No matching lines'],
  ' 正则表达式说明 ': [' 正則表達式說明 ', ' Regex notes '],
  '字节': ['位元組', 'bytes'],
  '次': ['次', 'times'],
  '位': ['位', 'bits'],
  'r:': ['r:', 'r:'],
  'p:': ['p:', 'p:'],
  '字符': ['字元', 'Characters'],
  '全部': ['全部', 'All'],
  '重置': ['重置', 'Reset'],
  '时间': ['時間', 'Time'],
  '文字': ['文字', 'Text'],
  '每': ['每', 'Every'],
  '分': ['分', 'm'],
  '时': ['時', 'h'],
  '日': ['日', 'd'],
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

