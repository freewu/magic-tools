// ImageWatermark 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '圖片浮水印' },
  en: { appName: 'Image Watermark' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const iwRows: Record<string, [string, string]> = {
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
  '水印图片解析失败': ['浮水印圖片解析失敗', 'Failed to decode the watermark image'],
  '图片过大, 单边不能超过 {n} px': ['圖片過大, 單邊不能超過 {n} px', 'Image is too large — each side must stay under {n} px'],
  '当前环境不支持 Canvas, 无法添加水印': ['目前環境不支援 Canvas, 無法加入浮水印', 'Canvas is unavailable in this environment, so the watermark cannot be added'],
  '拖拽图片到此处, 或点击「选择图片」': ['拖曳圖片到此處, 或點擊「選擇圖片」', 'Drop an image here, or click "Choose image"'],
  '支持 PNG / JPG / GIF / WebP / BMP 等浏览器可解码的图片 (本地处理, 不会上传)': ['支援 PNG / JPG / GIF / WebP / BMP 等瀏覽器可解碼的圖片 (本機處理, 不會上傳)', 'Supports any image the browser can decode, such as PNG / JPG / GIF / WebP / BMP (processed locally, never uploaded)'],

  // 预览与统计
  '原图': ['原圖', 'Original'],
  '结果': ['結果', 'Result'],
  '原图尺寸': ['原圖尺寸', 'Original size'],
  '结果尺寸': ['結果尺寸', 'Result size'],
  '原图体积': ['原圖體積', 'Original size on disk'],
  '结果体积': ['結果體積', 'Result size on disk'],
  '{a} × {b} px': ['{a} × {b} px', '{a} × {b} px'],

  // 水印参数
  '水印参数': ['浮水印參數', 'Watermark settings'],
  '水印类型': ['浮水印類型', 'Watermark type'],
  '文字水印': ['文字浮水印', 'Text'],
  '图片水印': ['圖片浮水印', 'Image / logo'],
  '文字内容': ['文字內容', 'Text content'],
  '输入水印文字, 支持多行 (回车换行)': ['輸入浮水印文字, 支援多行 (Enter 換行)', 'Type the watermark text; multiple lines are supported (press Enter to wrap)'],
  '载入示例文字': ['載入範例文字', 'Load sample text'],
  '快捷预设': ['快速預設', 'Quick presets'],
  '字体': ['字體', 'Font'],
  '默认': ['預設', 'Default'],
  '衬线': ['襯線', 'Serif'],
  '等宽': ['等寬', 'Monospace'],
  '楷体': ['楷體', 'Kai'],
  '字号': ['字號', 'Font size'],
  '占图片宽度的百分比': ['佔圖片寬度的百分比', 'Percentage of the image width'],
  '颜色': ['顏色', 'Color'],
  '加粗': ['加粗', 'Bold'],
  '斜体': ['斜體', 'Italic'],
  '描边': ['描邊', 'Outline'],
  '描边颜色随文字颜色自动配对 (亮字黑边 / 暗字白边), 提升复杂背景上的可读性': ['描邊顏色隨文字顏色自動配對 (亮字黑邊 / 暗字白邊), 提升複雜背景上的可讀性', 'The outline color is paired automatically (dark outline for light text, light outline for dark text) to stay readable on busy backgrounds'],
  '自动缩小以适应宽度': ['自動縮小以適應寬度', 'Auto-shrink to fit the width'],
  '文字过长时自动缩小字号, 保证不超出左右边距': ['文字過長時自動縮小字號, 保證不超出左右邊距', 'Long text is shrunk automatically so that it never crosses the left/right margins'],
  '水印图片': ['浮水印圖片', 'Watermark image'],
  '选择水印图片': ['選擇浮水印圖片', 'Choose watermark image'],
  '建议使用透明背景的 PNG, 叠加效果最干净 (JPG 会带上白底)': ['建議使用透明背景的 PNG, 疊加效果最乾淨 (JPG 會帶上白底)', 'A PNG with a transparent background gives the cleanest result (JPG brings a white box)'],
  '未选择水印图片, 结果将不会变化': ['未選擇浮水印圖片, 結果將不會變化', 'No watermark image selected — the result will not change'],
  '缩放': ['縮放', 'Scale'],

  // 排布
  '排布方式': ['排布方式', 'Layout'],
  '单个': ['單個', 'Single'],
  '平铺': ['平鋪', 'Tiled'],
  '位置': ['位置', 'Position'],
  '边距': ['邊距', 'Margin'],
  '平铺间距': ['平鋪間距', 'Tile spacing'],
  '旋转角度': ['旋轉角度', 'Rotation'],
  '透明度': ['透明度', 'Opacity'],
  '左上': ['左上', 'Top left'],
  '上': ['上', 'Top'],
  '右上': ['右上', 'Top right'],
  '左': ['左', 'Left'],
  '正中': ['正中', 'Center'],
  '右': ['右', 'Right'],
  '左下': ['左下', 'Bottom left'],
  '下': ['下', 'Bottom'],
  '右下': ['右下', 'Bottom right'],

  // 输出
  '输出格式': ['輸出格式', 'Output format'],
  '输出质量': ['輸出品質', 'Output quality'],
  '当前环境不支持 WebP 导出, 该项已禁用': ['目前環境不支援 WebP 匯出, 該項已停用', 'This environment cannot export WebP, so the option is disabled'],
  'PNG 无损且保留透明; JPEG / WebP 体积更小, 质量可调': ['PNG 無損且保留透明; JPEG / WebP 體積更小, 品質可調', 'PNG is lossless and keeps transparency; JPEG / WebP are smaller with adjustable quality'],

  // 提示
  '参数改动会实时重绘, 预览即最终效果': ['參數改動會即時重繪, 預覽即最終效果', 'Changes are re-rendered instantly — the preview is exactly what you get'],
  '平铺模式下「位置」与「边距」不生效, 整体观感由间距与旋转角度决定': ['平鋪模式下「位置」與「邊距」不生效, 整體觀感由間距與旋轉角度決定', 'In tiled mode "Position" and "Margin" do not apply — spacing and rotation shape the result'],
  '「旋转角度」为顺时针; 斜向平铺常用 -30°': ['「旋轉角度」為順時針; 斜向平鋪常用 -30°', 'Rotation is clockwise; -30° is a common angle for diagonal tiling'],
  '水印尺寸与边距都按旋转后的外接矩形计算, 因此旋转后依然不会越界': ['浮水印尺寸與邊距都按旋轉後的外接矩形計算, 因此旋轉後依然不會越界', 'Both the watermark size and the margins use the rotated bounding box, so nothing spills over the edge after rotating'],

  // 说明
  '图片水印说明': ['圖片浮水印說明', 'About image watermarking'],
};

// 取词: 无命中回退 zh 原文
export const iw = (locale: string, zh: string): string => {
  const e = iwRows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const iwT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = iw(locale, zh);
  if (v) for (const [ k, val ] of Object.entries(v)) s = s.split('{' + k + '}').join(String(val));
  return s;
};
