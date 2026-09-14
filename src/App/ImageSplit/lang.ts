// ImageSplit 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '圖片分割' },
  en: { appName: 'Image Splitter' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const rows: Record<string, [string, string]> = {
  // 选择图片
  '选择图片': ['選擇圖片', 'Choose image'],
  '重新选择': ['重新選擇', 'Choose another'],
  '拖拽图片到此处, 或点击「选择图片」': ['拖曳圖片到此處, 或點擊「選擇圖片」', 'Drop an image here, or click "Choose image"'],
  '支持 PNG / JPG / GIF / WebP / BMP 等浏览器可解码的图片 (本地处理, 不会上传)': ['支援 PNG / JPG / GIF / WebP / BMP 等瀏覽器可解碼的圖片 (本機處理, 不會上傳)', 'PNG / JPG / GIF / WebP / BMP and other browser-decodable images (processed locally, never uploaded)'],
  '请选择图片文件': ['請選擇圖片檔案', 'Please choose an image file'],
  '图片读取失败': ['圖片讀取失敗', 'Failed to read the image'],
  '图片解析失败': ['圖片解析失敗', 'Failed to decode the image'],
  '当前环境不支持 Canvas, 无法分割图片': ['目前環境不支援 Canvas, 無法分割圖片', 'Canvas is unavailable here, so the image cannot be split'],
  '正在生成…': ['正在產生…', 'Generating…'],

  // 参数
  '分割参数': ['分割參數', 'Split settings'],
  '分割份数': ['分割份數', 'Split into'],
  '{n} 份': ['{n} 份', '{n} parts'],
  '分割方向': ['分割方向', 'Layout'],
  '输出格式': ['輸出格式', 'Output format'],
  'JPEG 质量': ['JPEG 品質', 'JPEG quality'],
  'JPEG 体积更小, 适合照片; PNG 无损且保留透明': ['JPEG 體積更小, 適合照片; PNG 無損並保留透明', 'JPEG is smaller and better for photos; PNG is lossless and keeps transparency'],
  '每块输出宽度': ['每塊輸出寬度', 'Tile output width'],
  '图块间隔': ['圖塊間隔', 'Tile gap'],
  '0 = 无分割线; 仅影响预览显示, 不影响导出的图片': ['0 = 無分割線; 僅影響預覽顯示, 不影響匯出的圖片', '0 = no separators; preview only — the exported images are unaffected'],
  '0 = 保持原尺寸': ['0 = 保持原尺寸', '0 = keep the original size'],
  '文件名前缀': ['檔案名前綴', 'File name prefix'],
  '编号方式': ['編號方式', 'Numbering'],
  '顺序编号 (1, 2, 3 …)': ['順序編號 (1, 2, 3 …)', 'Sequential (1, 2, 3 …)'],
  '行列编号 (r1c1, r1c2 …)': ['行列編號 (r1c1, r1c2 …)', 'Row/column (r1c1, r1c2 …)'],

  // 布局
  '左右两份 (1 × 2)': ['左右兩份 (1 × 2)', 'Left / right (1 × 2)'],
  '上下两份 (2 × 1)': ['上下兩份 (2 × 1)', 'Top / bottom (2 × 1)'],
  '三列 (1 × 3)': ['三欄 (1 × 3)', 'Three columns (1 × 3)'],
  '三行 (3 × 1)': ['三列 (3 × 1)', 'Three rows (3 × 1)'],
  '四宫格 (2 × 2)': ['四宮格 (2 × 2)', 'Four tiles (2 × 2)'],
  '两行三列 (2 × 3)': ['兩列三欄 (2 × 3)', 'Two rows, three columns (2 × 3)'],
  '三行两列 (3 × 2)': ['三列兩欄 (3 × 2)', 'Three rows, two columns (3 × 2)'],
  '九宫格 (3 × 3)': ['九宮格 (3 × 3)', 'Nine tiles (3 × 3)'],

  // 操作
  '保存全部到文件夹': ['儲存全部到資料夾', 'Save all to folder'],
  '已保存 {n} 个文件': ['已儲存 {n} 個檔案', 'Saved {n} files'],
  '已取消保存': ['已取消儲存', 'Saving cancelled'],
  '没有可保存的分块': ['沒有可儲存的分塊', 'Nothing to save'],
  '保存失败, 请重试': ['儲存失敗, 請重試', 'Saving failed, please retry'],
  '清空': ['清空', 'Clear'],
  '桌面版 (Tauri) 可选择保存目录, 一次写入全部文件; 浏览器演示版会逐个触发下载': ['桌面版 (Tauri) 可選擇儲存目錄, 一次寫入全部檔案; 瀏覽器示範版會逐個觸發下載', 'The desktop (Tauri) build lets you pick a folder and writes every file at once; the browser demo downloads them one by one'],

  // 预览与统计
  '分割预览': ['分割預覽', 'Split preview'],
  '原图尺寸': ['原圖尺寸', 'Original size'],
  '每块尺寸': ['每塊尺寸', 'Tile size'],
  '输出尺寸': ['輸出尺寸', 'Output size'],
  '输出份数': ['輸出份數', 'Output tiles'],
  '共 {n} 份': ['共 {n} 份', '{n} tiles'],
  '每张小图左上角为序号, 点「保存全部到文件夹」一次导出全部': ['每張小圖左上角為序號, 點「儲存全部到資料夾」一次匯出全部', 'Each tile shows its number in the top-left corner; use the "Save all to folder" button to export everything at once'],
  '尺寸过小, 无法按当前份数分割 (每块不足 1 像素)': ['尺寸過小, 無法依目前份數分割 (每塊不足 1 像素)', 'The image is too small to split this way (a tile would be under 1 pixel)'],

  '总体积': ['總體積', 'Total size'],
  '{a} × {b} px': ['{a} × {b} px', '{a} × {b} px'],

  // 说明
  '图片分割说明': ['圖片分割說明', 'About image splitting'],
};

// 取词: 无命中回退 zh 原文
export const is = (locale: string, zh: string): string => {
  const e = rows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const isT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = is(locale, zh);
  if (v) for (const [ k, val ] of Object.entries(v)) s = s.split('{' + k + '}').join(String(val));
  return s;
};
