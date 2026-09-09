// IcoGenerator 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  en: { appName: "ICO Generator" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const imagelangRows: Record<string, [string, string]> = {
  '预览': ['預覽', 'Preview'],
  '图片加载失败': ['圖片載入失敗', 'Failed to load the image'],
  '请选择图片文件 (PNG/JPG/WebP 等)': ['請選擇圖片檔案 (PNG/JPG/WebP 等)', 'Choose an image file (PNG/JPG/WebP etc.)'],
  '点击或拖拽图片到此处': ['點擊或拖曳圖片到此處', 'Click or drag an image here'],
  ' · 当前: {name}': [' · 目前: {name}', ' · current: {name}'],
  '正在生成…': ['正在產生…', 'Generating…'],
  '{s}×{s} · ICO 文件 {n} 字节': ['{s}×{s} · ICO 檔案 {n} 位元組', '{s}×{s} · ICO file {n} bytes'],
  '保存 ICO 图标': ['儲存 ICO 圖示', 'Save ICO icon'],
  'ICO 图标': ['ICO 圖示', 'ICO icon'],
  '已保存 icon-{s}x{s}.ico': ['已儲存 icon-{s}x{s}.ico', 'Saved icon-{s}x{s}.ico'],
  '支持 PNG / JPG / WebP / GIF, 建议使用方形图标素材': ['支援 PNG / JPG / WebP / GIF, 建議使用方形圖示素材', 'PNG / JPG / WebP / GIF supported; a square source is recommended'],
  '生成尺寸': ['產生尺寸', 'Size'],
  '生成预览 ({s}×{s} 放大展示)': ['產生預覽 ({s}×{s} 放大顯示)', 'Preview ({s}×{s}, scaled up)'],
  '点击查看并保存': ['點擊檢視並儲存', 'Click to view and save'],
  '点击图标查看并保存 .ico': ['點擊圖示檢視並儲存 .ico', 'Click the icon to view and save .ico'],
  '暂无图标': ['暫無圖示', 'No icon yet'],
  '保存 ICO 图标 · {s}×{s}': ['儲存 ICO 圖示 · {s}×{s}', 'Save ICO icon · {s}×{s}'],
  '取消': ['取消', 'Cancel'],
  '保存为 {name}': ['儲存為 {name}', 'Save as {name}'],
  '将导出单尺寸 {s}×{s} ICO (32 位带透明通道), 可直接用作网站 favicon 或程序图标': ['將匯出單一尺寸 {s}×{s} ICO (32 位元含透明通道), 可直接用作網站 favicon 或程式圖示', 'Exports a single-size {s}×{s} ICO (32-bit with alpha) — ready to use as a website favicon or app icon'],
  '请选择图片文件': ['請選擇圖片檔案', 'Choose an image file'],
  '尺寸:': ['尺寸:', 'Size:'],
  '尺寸': ['尺寸', 'Size'],
  '格式': ['格式', 'Format'],
  '默认': ['預設', 'Default'],
  '格式:': ['格式:', 'Format:'],
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

