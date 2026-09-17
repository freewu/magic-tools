// ImageGrayscale 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '圖片黑白化' },
  en: { appName: 'Image Black & White' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const rows: Record<string, [string, string]> = {
  // 操作
  '选择图片': ['選擇圖片', 'Choose image'],
  '重新选择': ['重新選擇', 'Choose another'],
  '保存': ['儲存', 'Save'],
  '清空': ['清空', 'Clear'],
  '正在处理…': ['正在處理…', 'Processing…'],
  '已保存 {n}': ['已儲存 {n}', 'Saved {n}'],
  '已取消保存': ['已取消儲存', 'Saving cancelled'],
  '保存失败, 请重试': ['儲存失敗, 請重試', 'Saving failed, please retry'],
  '请选择图片文件': ['請選擇圖片檔案', 'Please choose an image file'],
  '图片读取失败': ['圖片讀取失敗', 'Failed to read the image'],
  '图片解析失败': ['圖片解析失敗', 'Failed to decode the image'],
  '拖拽图片到此处, 或点击「选择图片」': ['拖曳圖片到此處, 或點擊「選擇圖片」', 'Drop an image here, or click "Choose image"'],
  '支持 PNG / JPG / GIF / WebP / BMP 等浏览器可解码的图片 (本地处理, 不会上传)': ['支援 PNG / JPG / GIF / WebP / BMP 等瀏覽器可解碼的圖片 (本機處理, 不會上傳)', 'Supports any image the browser can decode, such as PNG / JPG / GIF / WebP / BMP (processed locally, never uploaded)'],
  '当前环境不支持 Canvas, 无法处理图片': ['目前環境不支援 Canvas, 無法處理圖片', 'Canvas is unavailable in this environment, so the image cannot be processed'],
  '图片尺寸过大, 单边不能超过 {n} px': ['圖片尺寸過大, 單邊不能超過 {n} px', 'The image is too large — each side must stay under {n} px'],

  // 预览与统计
  '原图': ['原圖', 'Original'],
  '结果': ['結果', 'Result'],
  '原图尺寸': ['原圖尺寸', 'Original size'],
  '结果尺寸': ['結果尺寸', 'Result size'],
  '原图体积': ['原圖體積', 'Original size on disk'],
  '结果体积': ['結果體積', 'Result size on disk'],
  '{a} × {b} px': ['{a} × {b} px', '{a} × {b} px'],

  // 参数
  '调整参数': ['調整參數', 'Adjust settings'],
  '处理方式': ['處理方式', 'Mode'],
  '灰度': ['灰階', 'Grayscale'],
  '黑白二值': ['黑白二值', 'Black & white'],
  '灰度算法': ['灰階演算法', 'Grayscale method'],
  '亮度 (推荐)': ['亮度 (推薦)', 'Luminance (recommended)'],
  '平均': ['平均', 'Average'],
  '最大值': ['最大值', 'Maximum'],
  '最小值': ['最小值', 'Minimum'],
  '阈值方式': ['閾值方式', 'Threshold mode'],
  '自动 (Otsu)': ['自動 (Otsu)', 'Automatic (Otsu)'],
  '手动': ['手動', 'Manual'],
  '自动阈值 {n}': ['自動閾值 {n}', 'Automatic threshold {n}'],
  '二值阈值': ['二值閾值', 'Binarize threshold'],
  '灰度值大于阈值的像素变纯白, 其余变纯黑': ['灰階值大於閾值的像素變純白, 其餘變純黑', 'Pixels brighter than the threshold become pure white, the rest pure black'],
  '亮度算法与人眼观感最接近 (Rec.709, 与 CSS 的 grayscale 一致)': ['亮度演算法與人眼觀感最接近 (Rec.709, 與 CSS 的 grayscale 一致)', 'The luminance weights match human perception (Rec.709, same as CSS grayscale)'],
  '三个通道简单平均, 计算最快, 对纯色块比较平': ['三個通道簡單平均, 計算最快, 對純色塊比較平', 'Simple average of the three channels; the fastest option'],
  '取最亮的通道, 结果整体偏亮 (适合把浅色文字化开)': ['取最亮的通道, 結果整體偏亮 (適合把淺色文字化開)', 'Takes the brightest channel, so the result is lighter overall'],
  '取最暗的通道, 结果整体偏暗 (适合保留深色轮廓)': ['取最暗的通道, 結果整體偏暗 (適合保留深色輪廓)', 'Takes the darkest channel, so the result is darker overall'],
  'Otsu 会按图像直方图自动找出前景 / 背景的最佳分割点': ['Otsu 會依影像直方圖自動找出前景 / 背景的最佳分割點', 'Otsu finds the best foreground / background split from the image histogram'],
  '输出格式': ['輸出格式', 'Output format'],
  '输出质量': ['輸出品質', 'Output quality'],
  '仅 JPEG / WebP 输出时生效': ['僅 JPEG / WebP 輸出時生效', 'Applies to JPEG / WebP output only'],
  'PNG 无损且保留透明; JPEG / WebP 体积更小, 质量可调': ['PNG 無損且保留透明; JPEG / WebP 體積較小, 品質可調', 'PNG is lossless and keeps transparency; JPEG / WebP are smaller with adjustable quality'],
  '当前环境不支持 WebP 导出': ['目前環境不支援 WebP 匯出', 'WebP export is not supported in this environment'],
  'α (透明度) 通道保持不变; 输出 JPEG / WebP 时会先铺白底': ['α (透明度) 通道保持不變; 輸出 JPEG / WebP 時會先鋪白底', 'The alpha channel is kept as is; JPEG / WebP output is painted on a white background first'],

  // 说明
  '图片黑白化说明': ['圖片黑白化說明', 'About black & white conversion'],
};

// 取词: 无命中回退 zh 原文
export const bw = (locale: string, zh: string): string => {
  const e = rows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const bwT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = bw(locale, zh);
  if (v) for (const [ k, val ] of Object.entries(v)) s = s.split('{' + k + '}').join(String(val));
  return s;
};
