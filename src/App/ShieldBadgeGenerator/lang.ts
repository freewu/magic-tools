// ShieldBadgeGenerator 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  en: { appName: "Shield Badge Generator" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const imagelangRows: Record<string, [string, string]> = {
  '宽度:': ['寬度:', 'Width:'],
  '高度:': ['高度:', 'Height:'],
  '预览': ['預覽', 'Preview'],
  'SVG 内容已复制到剪贴板': ['SVG 內容已複製到剪貼簿', 'SVG copied to clipboard'],
  '复制失败, 请手动选中下方代码复制': ['複製失敗, 請手動選取下方程式碼複製', 'Copy failed — please select the code below and copy it manually'],
  '保存 {name}': ['儲存 {name}', 'Save {name}'],
  'SVG 图片': ['SVG 圖片', 'SVG image'],
  '已保存 {name}': ['已儲存 {name}', 'Saved {name}'],
  '保存失败': ['儲存失敗', 'Save failed'],
  '图片加载失败': ['圖片載入失敗', 'Failed to load the image'],
  '当前环境不支持绘制 PNG': ['目前環境不支援繪製 PNG', 'PNG rendering is not supported in this environment'],
  '已保存 {name} ({w}×{h}px)': ['已儲存 {name} ({w}×{h}px)', 'Saved {name} ({w}×{h}px)'],
  'PNG 保存失败': ['PNG 儲存失敗', 'Failed to save PNG'],
  '文字': ['文字', 'Label'],
  '左侧文字 (如 php)': ['左側文字 (如 php)', 'Left text (e.g. php)'],
  '状态': ['狀態', 'Value'],
  '右侧状态文字 (如 8.0)': ['右側狀態文字 (如 8.0)', 'Right status text (e.g. 8.0)'],
  '文字颜色': ['文字顏色', 'Label color'],
  '状态颜色': ['狀態顏色', 'Value color'],
  '左侧底色固定 #555 (shields 风格)': ['左側底色固定為 #555 (shields 風格)', 'Left background is fixed at #555 (shields style)'],
  '图片尺寸': ['圖片尺寸', 'Image scale'],
  '倍率': ['倍率', 'Export size'],
  '导出 PNG 为 {w}×{h}px (badge 高 20, 随文字变宽)': ['匯出 PNG 為 {w}×{h}px (badge 高 20, 隨文字變寬)', 'PNG export is {w}×{h}px (badge height 20, width grows with text)'],
  '实时生成 shields.io 风格 SVG; 文字与状态留空时相应段落自动隐藏; SVG 为矢量格式, 放大不模糊': ['即時產生 shields.io 風格 SVG; 文字與狀態留空時對應區塊會自動隱藏; SVG 為向量格式, 放大不模糊', 'Generates a shields.io-style SVG live; when label or value is empty that segment hides automatically. SVG is vector — it stays sharp when scaled up'],
  '预览 (点击复制 SVG):': ['預覽 (點擊複製 SVG):', 'Preview (click to copy SVG):'],
  '请填写文字或状态后生成预览': ['請填寫文字或狀態後產生預覽', 'Fill in the label or value to see the preview'],
  '点击复制 SVG 内容': ['點擊複製 SVG 內容', 'Click to copy the SVG'],
  '{n} 字符 · {a} | {b}': ['{n} 字元 · {a} | {b}', '{n} chars · {a} | {b}'],
  '复制 SVG 内容': ['複製 SVG 內容', 'Copy SVG'],
  '保存为 .svg': ['儲存為 .svg', 'Save as .svg'],
  '导出 PNG ({s}×)': ['匯出 PNG ({s}×)', 'Export PNG ({s}×)'],
  'SVG 源码:': ['SVG 原始碼:', 'SVG source:'],
  '字符': ['字元', 'chars'],
  '颜色:': ['顏色:', 'Color:'],
  '尺寸': ['尺寸', 'Size'],
  '宽': ['寬', 'W'],
  '高': ['高', 'H'],
  '格式': ['格式', 'Format'],
  '默认': ['預設', 'Default'],
  '导出 PNG': ['匯出 PNG', 'Export PNG'],
  '显示': ['顯示', 'Show'],
  '隐藏': ['隱藏', 'Hide'],
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

