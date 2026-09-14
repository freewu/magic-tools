// ImageColor 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '圖片主題色' },
  en: { appName: "Image Dominant Color" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const rows: Record<string, [string, string]> = {
  // 选择图片
  '选择图片': ['選擇圖片', 'Choose image'],
  '重新选择': ['重新選擇', 'Choose another'],
  '拖拽图片到此处, 或点击「选择图片」': ['拖曳圖片到此處, 或點擊「選擇圖片」', 'Drop an image here, or click "Choose image"'],
  '支持 PNG / JPG / GIF / WebP / BMP 等浏览器可解码的图片': ['支援 PNG / JPG / GIF / WebP / BMP 等瀏覽器可解碼的圖片', 'PNG / JPG / GIF / WebP / BMP and other browser-decodable images'],
  '请选择图片文件': ['請選擇圖片檔案', 'Please choose an image file'],
  '图片读取失败': ['圖片讀取失敗', 'Failed to read the image'],
  '图片解析失败': ['圖片解析失敗', 'Failed to decode the image'],
  '当前环境不支持 Canvas, 无法分析图片': ['目前環境不支援 Canvas, 無法分析圖片', 'Canvas is unavailable, the image cannot be analyzed'],
  '正在分析…': ['正在分析…', 'Analyzing…'],

  // 参数
  '相似度级别': ['相似度級別', 'Similarity level'],
  '级别越高, 越相近的颜色会被合并': ['級別越高, 越相近的顏色會被合併', 'Higher levels merge colors that are more alike'],
  '合并相似颜色': ['合併相似顏色', 'Merge similar colors'],
  '输出颜色数': ['輸出顏色數', 'Colors to show'],
  '忽略透明像素': ['忽略透明像素', 'Ignore transparent pixels'],
  '透明阈值 α ≤': ['透明閾值 α ≤', 'Alpha threshold α ≤'],
  '分析参数': ['分析參數', 'Analysis'],

  // 统计
  '图片尺寸': ['圖片尺寸', 'Image size'],
  '分析尺寸': ['分析尺寸', 'Analyzed size'],
  '分析像素': ['分析像素', 'Pixels counted'],
  '原始颜色': ['原始顏色', 'Raw colors'],
  '合并后颜色': ['合併後顏色', 'Merged colors'],
  '覆盖占比': ['覆蓋佔比', 'Coverage'],
  '{a} × {b} px': ['{a} × {b} px', '{a} × {b} px'],
  '{a} → {b} 种': ['{a} → {b} 種', '{a} → {b}'],
  '原图 {w} × {h} px, 已等比缩小到 {aw} × {ah} px 分析 (最长边 {max} px)': ['原圖 {w} × {h} px, 已等比縮小到 {aw} × {ah} px 分析 (最長邊 {max} px)', 'Original {w} × {h} px, downscaled to {aw} × {ah} px for analysis (max edge {max} px)'],

  // 结果
  '调色板': ['調色板', 'Palette'],
  '颜色': ['顏色', 'Color'],
  '占比': ['佔比', 'Share'],
  '像素数': ['像素數', 'Pixels'],
  '共 {n} 种颜色': ['共 {n} 種顏色', '{n} colors'],
  '未合并相似颜色, 仅列出占比最高的颜色': ['未合併相似顏色, 僅列出佔比最高的顏色', 'Similar colors are not merged — only the most frequent colors are listed'],
  '图片中没有可统计的像素 (全透明或被透明阈值过滤)': ['圖片中沒有可統計的像素 (全透明或被透明閾值過濾)', 'No countable pixels — the image is fully transparent or filtered by the alpha threshold'],
  '点击色块可复制对应 HEX 色值': ['點擊色塊可複製對應 HEX 色值', 'Click a swatch to copy its HEX value'],
  '复制': ['複製', 'Copy'],
  '复制全部': ['複製全部', 'Copy all'],
  '下载 CSV': ['下載 CSV', 'Download CSV'],
  '下载色卡 PNG': ['下載色卡 PNG', 'Download swatch PNG'],
  '清空': ['清空', 'Clear'],
  '已复制到剪贴板': ['已複製到剪貼簿', 'Copied to clipboard'],
  '已复制 {hex}': ['已複製 {hex}', 'Copied {hex}'],
  '保存 {n}': ['儲存 {n}', 'Save {n}'],
  '已保存 {n}': ['已儲存 {n}', 'Saved {n}'],
  '保存失败, 请重试': ['儲存失敗, 請重試', 'Saving failed, please retry'],

  // 说明
  '图片主题色说明': ['圖片主題色說明', 'About dominant colors'],
};

// 取词: 无命中回退 zh 原文
export const im = (locale: string, zh: string): string => {
  const e = rows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const imT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = im(locale, zh);
  if (v) for (const [ k, val ] of Object.entries(v)) s = s.split('{' + k + '}').join(String(val));
  return s;
};
