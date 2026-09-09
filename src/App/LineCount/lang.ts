// LineCount 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "行數統計" },
  en: { appName: "Line Counter" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '已复制': ['已複製', 'Copied'],
  '复制': ['複製', 'Copy'],
  '选取内容已复制到粘贴板!!!': ['選取內容已複製到剪貼簿!!!', 'Selected content copied to clipboard!!!'],
  '去除空行': ['移除空行', 'Remove empty lines'],
  '提取内容': ['提取內容', 'Extract range'],
  '打开文件': ['開啟檔案', 'Open file'],
  '开始行数': ['開始行數', 'Start line'],
  '结束行数': ['結束行數', 'End line'],
  '行数:': ['行數:', 'Lines:'],
  '字符数:': ['字元數:', 'Characters:'],
  '输入需要统计的内容 或 拖拽文件到框内': ['輸入需要統計的內容 或 拖曳檔案到框內', 'Enter the content to count, or drop a file into the box'],
  'px': ['px', 'px'],
  'r:': ['r:', 'r:'],
  '计算': ['計算', 'Compute'],
  '字符': ['字元', 'Characters'],
  '清除': ['清除', 'Clear'],
  '全部': ['全部', 'All'],
  '个': ['個', ''],
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

