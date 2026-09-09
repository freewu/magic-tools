// Base64Image 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "Base64 圖片" },
  en: { appName: "Base64 Image" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const imagelangRows: Record<string, [string, string]> = {
  '复制到粘贴板成功！！！': ['複製到剪貼簿成功！！！', 'Copied to clipboard!!!'],
  'IMG 标签': ['IMG 標籤', 'IMG tag'],
  '拖拽要生成 Base64 编码的图片文件到框内': ['拖曳要產生 Base64 編碼的圖片檔案到框內', 'Drag an image file into the box to Base64-encode it'],
  '点击复制内容到粘贴板': ['點擊複製內容到剪貼簿', 'Click to copy to clipboard'],
  '清除': ['清除', 'Clear'],
  '宽度:': ['寬度:', 'Width:'],
  '高度:': ['高度:', 'Height:'],
  '说明:': ['說明:', 'Alt text:'],
  '预览': ['預覽', 'Preview'],
  '文字': ['文字', 'Label'],
  '宽': ['寬', 'W'],
  '高': ['高', 'H'],
  '显示': ['顯示', 'Show'],
};

// 取词: 无命中回退 zh 原文 (与共享 image-lang 行为一致)
export const im = (locale: string, zh: string): string => {
  const e = imagelangRows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const imT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = im(locale, zh);
  if (v) for (const [k, val] of Object.entries(v)) s = s.split('{'+k+'}').join(String(val));
  return s;
};

