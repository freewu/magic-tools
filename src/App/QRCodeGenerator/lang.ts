// QRCodeGenerator 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "二維碼生成" },
  en: { appName: "QR Code Generator" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const imagelangRows: Record<string, [string, string]> = {
  '清除': ['清除', 'Clear'],
  '预览': ['預覽', 'Preview'],
  '生成失败': ['產生失敗', 'Generation failed'],
  '取消': ['取消', 'Cancel'],
  '请先输入内容生成二维码': ['請先輸入內容產生二維碼', 'Enter content to generate a QR code first'],
  '二维码图片已保存': ['二維碼圖片已儲存', 'QR code image saved'],
  '请先输入内容': ['請先輸入內容', 'Enter some content first'],
  '二维码生成失败, 请检查内容后重试': ['二維碼產生失敗, 請檢查內容後重試', 'QR generation failed — check the content and retry'],
  '已保存 {n} 个 ({f} 行内容过长未生成)': ['已儲存 {n} 個 ({f} 行內容過長未產生)', 'Saved {n} ({f} line(s) too long to generate)'],
  '已保存 {n} 个二维码': ['已儲存 {n} 個二維碼', 'Saved {n} QR code(s)'],
  '已取消保存': ['已取消儲存', 'Save cancelled'],
  '容错等级:': ['容錯等級:', 'Error correction:'],
  '颜色:': ['顏色:', 'Color:'],
  '背景色:': ['背景色:', 'Background:'],
  '尺寸:': ['尺寸:', 'Size:'],
  '单个': ['單個', 'Single'],
  '批量': ['批次', 'Batch'],
  '需要生成二维码的内容': ['需要產生二維碼的內容', 'Content to encode into the QR code'],
  '保存图片': ['儲存圖片', 'Save image'],
  '点击下载二维码': ['點擊下載二維碼', 'Click to download the QR code'],
  '每行一个二维码内容, 一次生成 {n} 行以内; 导出时桌面版选择文件夹一次保存全部图片, 网页版逐个下载。': ['每行一個二維碼內容, 一次產生 {n} 行以內; 匯出時桌面版選擇資料夾一次儲存全部圖片, 網頁版逐個下載。', 'One QR code per line, up to {n} lines at a time; on export the desktop build saves all images into a chosen folder at once, while the web demo downloads them one by one.'],
  '批量内容 (每行一个二维码)\n\n示例:\nhttps://example.com/page/1\nhttps://example.com/page/2\nhttps://example.com/page/3': ['批次內容 (每行一個二維碼)\n\n範例:\nhttps://example.com/page/1\nhttps://example.com/page/2\nhttps://example.com/page/3', 'Batch content (one QR per line)\n\nExample:\nhttps://example.com/page/1\nhttps://example.com/page/2\nhttps://example.com/page/3'],
  '{n} 行': ['{n} 行', '{n} line(s)'],
  ' (超过 {m} 行, 已截断)': [' (超過 {m} 行, 已截斷)', ' (over {m} lines, truncated)'],
  '文件名前缀:': ['檔名前綴:', 'Filename prefix:'],
  '导出全部 PNG': ['匯出全部 PNG', 'Export all PNG'],
  '清空': ['清空', 'Clear'],
  '尺寸': ['尺寸', 'Size'],
  '默认': ['預設', 'Default'],
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

