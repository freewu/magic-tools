// ImageColor 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '圖片主題色' },
  en: { appName: "Image Dominant Color" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '数组': ['陣列', 'Array'],
  '对象': ['物件', 'Object'],
  '拖拽要提取主体色的图片文件到框内': ['拖曳要提取主體色的圖片檔案到框內', 'Drop an image to extract its dominant colors'],
  '主题色提取中': ['主體色提取中', 'Extracting theme colors…'],
  '提取计算需要时间': ['提取計算需要時間', 'This may take a moment'],
  '宽': ['寬', 'Width'],
  '高': ['高', 'Height'],
  'px': ['px', 'px'],
  '次': ['次', 'times'],
  'r:': ['r:', 'r:'],
  '计算': ['計算', 'Compute'],
  '清除': ['清除', 'Clear'],
  '重置': ['重置', 'Reset'],
  '时间': ['時間', 'Time'],
  '个': ['個', ''],
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

