// ImageResize 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '圖片尺寸調整' },
  en: { appName: 'Image Resizer' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const irRows: Record<string, [string, string]> = {
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
  '当前环境不支持 Canvas, 无法调整尺寸': ['目前環境不支援 Canvas, 無法調整尺寸', 'Canvas is unavailable in this environment, so the size cannot be adjusted'],
  '目标尺寸无效': ['目標尺寸無效', 'Invalid target size'],
  '目标尺寸过大, 单边不能超过 {n} px': ['目標尺寸過大, 單邊不能超過 {n} px', 'Target size is too large — each side must stay under {n} px'],
  '拖拽图片到此处, 或点击「选择图片」': ['拖曳圖片到此處, 或點擊「選擇圖片」', 'Drop an image here, or click "Choose image"'],
  '支持 PNG / JPG / GIF / WebP / BMP 等浏览器可解码的图片 (本地处理, 不会上传)': ['支援 PNG / JPG / GIF / WebP / BMP 等瀏覽器可解碼的圖片 (本機處理, 不會上傳)', 'Supports any image the browser can decode, such as PNG / JPG / GIF / WebP / BMP (processed locally, never uploaded)'],

  // 预览与统计
  '原图': ['原圖', 'Original'],
  '结果': ['結果', 'Result'],
  '原图尺寸': ['原圖尺寸', 'Original size'],
  '结果尺寸': ['結果尺寸', 'Result size'],
  '缩放比例': ['縮放比例', 'Scale'],
  '原图体积': ['原圖體積', 'Original size on disk'],
  '结果体积': ['結果體積', 'Result size on disk'],
  '{a} × {b} px': ['{a} × {b} px', '{a} × {b} px'],

  // 尺寸参数
  '尺寸参数': ['尺寸參數', 'Size settings'],
  '尺寸模式': ['尺寸模式', 'Size mode'],
  '按比例': ['依比例', 'By percentage'],
  '按像素': ['依像素', 'By pixels'],
  '宽度': ['寬度', 'Width'],
  '高度': ['高度', 'Height'],
  '用原图尺寸': ['用原圖尺寸', 'Use original size'],
  '锁定宽高比': ['鎖定長寬比', 'Lock aspect ratio'],
  '按像素模式下生效: 修改宽度或高度时自动换算另一边': ['依像素模式下生效: 修改寬度或高度時自動換算另一邊', 'Applies in pixel mode: editing one side recalculates the other'],
  '不放大图片 (仅缩小)': ['不放大圖片 (僅縮小)', 'Never enlarge (shrink only)'],
  '输出格式': ['輸出格式', 'Output format'],
  'JPEG 质量': ['JPEG 品質', 'JPEG quality'],
  'JPEG 体积更小, 适合照片; PNG 无损且保留透明': ['JPEG 體積較小, 適合照片; PNG 無損且保留透明', 'JPEG is smaller and better for photos; PNG is lossless and keeps transparency'],
  '缩小超过一半时会分多步绘制, 避免出现锯齿': ['縮小超過一半時會分多步繪製, 避免出現鋸齒', 'Large reductions are drawn in several steps to avoid aliasing'],
  '「不放大」开启时结果不会超过原图尺寸': ['「不放大」開啟時結果不會超過原圖尺寸', 'With "Never enlarge" on, the result never exceeds the original size'],

  // 说明
  '图片尺寸调整说明': ['圖片尺寸調整說明', 'About resizing'],
};

// 取词: 无命中回退 zh 原文
export const ir = (locale: string, zh: string): string => {
  const e = irRows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const irT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = ir(locale, zh);
  if (v) for (const [ k, val ] of Object.entries(v)) s = s.split('{' + k + '}').join(String(val));
  return s;
};
