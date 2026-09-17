// ImageColorPicker 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '圖片取色' },
  en: { appName: 'Image Color Picker' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const rows: Record<string, [string, string]> = {
  // 操作
  '选择图片': ['選擇圖片', 'Choose image'],
  '重新选择': ['重新選擇', 'Choose another'],
  '清空': ['清空', 'Clear'],
  '清空历史': ['清空歷史', 'Clear history'],
  '请选择图片文件': ['請選擇圖片檔案', 'Please choose an image file'],
  '图片读取失败': ['圖片讀取失敗', 'Failed to read the image'],
  '图片解析失败': ['圖片解析失敗', 'Failed to decode the image'],
  '当前环境不支持 Canvas, 无法取色': ['目前環境不支援 Canvas, 無法取色', 'Canvas is unavailable in this environment, so colors cannot be picked'],
  '图片尺寸过大, 单边不能超过 {n} px': ['圖片尺寸過大, 單邊不能超過 {n} px', 'The image is too large — each side must stay under {n} px'],
  '拖拽图片到此处, 或点击「选择图片」': ['拖曳圖片到此處, 或點擊「選擇圖片」', 'Drop an image here, or click "Choose image"'],
  '支持 PNG / JPG / GIF / WebP / BMP 等浏览器可解码的图片 (本地处理, 不会上传)': ['支援 PNG / JPG / GIF / WebP / BMP 等瀏覽器可解碼的圖片 (本機處理, 不會上傳)', 'Supports any image the browser can decode, such as PNG / JPG / GIF / WebP / BMP (processed locally, never uploaded)'],

  // 取色面板
  '放大倍数': ['放大倍數', 'Zoom'],
  '悬停预览': ['懸停預覽', 'Hover preview'],
  '把鼠标移到图片上查看放大镜与像素坐标, 点击即可取色': ['把滑鼠移到圖片上查看放大鏡與像素座標, 點擊即可取色', 'Move the pointer over the image for the loupe and pixel coordinates; click to pick the color'],
  '坐标': ['座標', 'Position'],
  '图像尺寸': ['影像尺寸', 'Image size'],
  '图像体积': ['影像體積', 'Image size on disk'],
  '当前颜色': ['目前顏色', 'Current color'],
  '点击图片上的任意位置取色': ['點擊圖片上的任意位置取色', 'Click anywhere on the image to pick a color'],
  '最近取色': ['最近取色', 'Recent colors'],
  '点击色块可再次选色, 最多保留 {n} 条': ['點擊色塊可再次選色, 最多保留 {n} 條', 'Click a swatch to select it again; the most recent {n} are kept'],
  '已复制 {v}': ['已複製 {v}', 'Copied {v}'],
  '点击右侧图标可复制对应写法': ['點擊右側圖示可複製對應寫法', 'Click the icon on the right to copy that notation'],
  '无色块': ['無色塊', 'No colors yet'],
  '图片取色说明': ['圖片取色說明', 'About picking colors'],
};

// 取词: 无命中回退 zh 原文
export const cp = (locale: string, zh: string): string => {
  const e = rows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const cpT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = cp(locale, zh);
  if (v) for (const [ k, val ] of Object.entries(v)) s = s.split('{' + k + '}').join(String(val));
  return s;
};
