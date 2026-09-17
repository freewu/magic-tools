// ImageSharpen 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '圖片銳化' },
  en: { appName: 'Image Sharpener' },
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
  '锐化参数': ['銳化參數', 'Sharpen settings'],
  '{a} × {b} px': ['{a} × {b} px', '{a} × {b} px'],

  // 参数
  '调整参数': ['調整參數', 'Adjust settings'],
  '锐化强度': ['銳化強度', 'Amount'],
  '半径': ['半徑', 'Radius'],
  '阈值': ['閾值', 'Threshold'],
  '强度越高边缘越"硬", 但过冲也越明显 (100% 为标准叠加量)': ['強度越高邊緣越「硬」, 但過衝也越明顯 (100% 為標準疊加量)', 'Higher amounts make edges harder but also amplify the overshoot (100% is the standard blend)'],
  '参与模糊的邻域半径: 1 px 只锐化细小的纹理, 5 px 会强化更大的轮廓': ['參與模糊的鄰域半徑: 1 px 只銳化細小的紋理, 5 px 會強化更大的輪廓', 'The blur radius: 1 px only crisps up fine texture, 5 px boosts larger contours'],
  '细节差值小于阈值的像素不锐化, 用来避免放大平坦区域的噪点 (0 表示全部参与)': ['細節差值小於閾值的像素不銳化, 用來避免放大平坦區域的雜點 (0 表示全部參與)', 'Pixels whose detail difference is below the threshold are left alone, which avoids amplifying noise in flat areas (0 sharpens everything)'],
  '输出格式': ['輸出格式', 'Output format'],
  '输出质量': ['輸出品質', 'Output quality'],
  '仅 JPEG / WebP 输出时生效': ['僅 JPEG / WebP 輸出時生效', 'Applies to JPEG / WebP output only'],
  'PNG 无损且保留透明; JPEG / WebP 体积更小, 质量可调': ['PNG 無損且保留透明; JPEG / WebP 體積較小, 品質可調', 'PNG is lossless and keeps transparency; JPEG / WebP are smaller with adjustable quality'],
  '当前环境不支持 WebP 导出': ['目前環境不支援 WebP 匯出', 'WebP export is not supported in this environment'],
  'α (透明度) 通道始终保持不变; 输出 JPEG / WebP 时会先铺白底': ['α (透明度) 通道始終保持不變; 輸出 JPEG / WebP 時會先鋪白底', 'The alpha channel is never modified; JPEG / WebP output is painted on a white background first'],

  // 说明
  '图片锐化说明': ['圖片銳化說明', 'About image sharpening'],
};

// 取词: 无命中回退 zh 原文
export const sh = (locale: string, zh: string): string => {
  const e = rows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const shT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = sh(locale, zh);
  if (v) for (const [ k, val ] of Object.entries(v)) s = s.split('{' + k + '}').join(String(val));
  return s;
};
