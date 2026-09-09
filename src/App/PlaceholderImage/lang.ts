// PlaceholderImage 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "佔位圖片" },
  en: { appName: "Placeholder Image" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const imagelangRows: Record<string, [string, string]> = {
  '预览': ['預覽', 'Preview'],
  '保存 {name}': ['儲存 {name}', 'Save {name}'],
  '已保存 {name}': ['已儲存 {name}', 'Saved {name}'],
  '文字': ['文字', 'Label'],
  '文字颜色': ['文字顏色', 'Label color'],
  '生成失败': ['產生失敗', 'Generation failed'],
  '点击查看并保存': ['點擊檢視並儲存', 'Click to view and save'],
  '取消': ['取消', 'Cancel'],
  '无法创建画布': ['無法建立畫布', 'Could not create canvas'],
  '保存图片': ['儲存圖片', 'Save image'],
  'PNG 图片': ['PNG 圖片', 'PNG image'],
  'JPEG 图片': ['JPEG 圖片', 'JPEG image'],
  'WebP 图片': ['WebP 圖片', 'WebP image'],
  '图片生成失败': ['圖片產生失敗', 'Image generation failed'],
  '我的预设': ['我的預設', 'My presets'],
  '预设': ['預設', 'Preset'],
  '选常用尺寸填充': ['選常用尺寸填入', 'Pick a common size'],
  '尺寸': ['尺寸', 'Size'],
  '宽': ['寬', 'W'],
  '高': ['高', 'H'],
  '格式': ['格式', 'Format'],
  '显示文字': ['顯示文字', 'Text'],
  '留空则显示默认文字: {d}': ['留空則顯示預設文字: {d}', 'Leave blank to show the default text: {d}'],
  '默认': ['預設', 'Default'],
  '背景颜色': ['背景顏色', 'Background color'],
  '生成图片': ['產生圖片', 'Generate'],
  '宽高范围 {a}–{b}px; 文字过长会自动缩小字号或截断; 已生成后修改参数会自动刷新图片; 常用尺寸见预设下拉, 设置页可自定预设': ['寬高範圍 {a}–{b}px; 文字過長會自動縮小字級或截斷; 已產生後修改參數會自動重新整理圖片; 常用尺寸見預設下拉, 設定頁可自訂預設', 'Size range {a}–{b}px; text that is too long shrinks or is truncated; once generated, changing the parameters refreshes the image automatically. Common sizes are in the preset dropdown; the settings page lets you define your own'],
  '预览 (点击图片弹窗保存)': ['預覽 (點擊圖片彈窗儲存)', 'Preview (click the image to open the save dialog)'],
  '{w}×{h} · {f} · 点击图片查看并保存': ['{w}×{h} · {f} · 點擊圖片檢視並儲存', '{w}×{h} · {f} · click the image to view and save'],
  '设置参数后点击「生成图片」, 图片将显示在此处; 点击图片可弹窗下载保存': ['設定參數後點擊「產生圖片」, 圖片將顯示在此處; 點擊圖片可彈窗下載儲存', 'After setting the options click Generate — the image appears here; click it to open the save dialog'],
  '保存占位图 {name}': ['儲存佔位圖 {name}', 'Save placeholder {name}'],
  '保存占位图 · {s}': ['儲存佔位圖 · {s}', 'Save placeholder · {s}'],
  '常用': ['常用', 'Common'],
  '将保存为': ['將儲存為', 'Will be saved as'],
  ' ({kb} KB)': [' ({kb} KB)', ' ({kb} KB)'],
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

