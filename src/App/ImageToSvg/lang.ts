// ImageToSvg 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '圖片轉 SVG' },
  en: { appName: 'Image to SVG' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const rows: Record<string, [string, string]> = {
  // 操作
  '选择图片': ['選擇圖片', 'Choose image'],
  '重新选择': ['重新選擇', 'Choose another'],
  '保存 SVG': ['儲存 SVG', 'Save SVG'],
  '复制 SVG': ['複製 SVG', 'Copy SVG'],
  '清空': ['清空', 'Clear'],
  '正在处理…': ['正在處理…', 'Processing…'],
  '已保存 {n}': ['已儲存 {n}', 'Saved {n}'],
  '已取消保存': ['已取消儲存', 'Saving cancelled'],
  '保存失败, 请重试': ['儲存失敗, 請重試', 'Saving failed, please retry'],
  '已复制 SVG 源码': ['已複製 SVG 原始碼', 'SVG source copied'],
  '复制失败, 请展开源码手动复制': ['複製失敗, 請展開原始碼手動複製', 'Copy failed — expand the source and copy manually'],
  '请选择图片文件': ['請選擇圖片檔案', 'Please choose an image file'],
  '图片读取失败': ['圖片讀取失敗', 'Failed to read the image'],
  '图片解析失败': ['圖片解析失敗', 'Failed to decode the image'],
  '当前环境不支持 Canvas, 无法处理图片': ['目前環境不支援 Canvas, 無法處理圖片', 'Canvas is unavailable in this environment, so the image cannot be processed'],
  '矢量化失败, 请重试或把「处理尺寸」调小': ['向量化失敗, 請重試或把「處理尺寸」調小', 'Vectorization failed; retry or lower the trace size'],
  '当前环境禁止运行 WebAssembly (CSP 限制), 无法矢量化; 请更新应用或改用浏览器版': ['目前環境禁止執行 WebAssembly (CSP 限制), 無法向量化; 請更新應用程式或改用瀏覽器版', 'WebAssembly is blocked in this environment (CSP restriction), so vectorization is unavailable; please update the app or use the browser version'],

  // 选择 / 预览
  '拖拽图片到此处, 或点击「选择图片」': ['拖曳圖片到此處, 或點擊「選擇圖片」', 'Drop an image here, or click "Choose image"'],
  '支持 PNG / JPG / GIF / WebP / BMP 等浏览器可解码的图片 (本地处理, 不会上传)': ['支援 PNG / JPG / GIF / WebP / BMP 等瀏覽器可解碼的圖片 (本機處理, 不會上傳)', 'Supports any image the browser can decode, such as PNG / JPG / GIF / WebP / BMP (processed locally, never uploaded)'],
  '原图': ['原圖', 'Original'],
  '结果': ['結果', 'Result'],
  '正在矢量化…': ['正在向量化…', 'Vectorizing…'],

  // 统计
  '原图尺寸': ['原圖尺寸', 'Original size'],
  '处理尺寸': ['處理尺寸', 'Traced size'],
  '原图体积': ['原圖體積', 'Original size on disk'],
  'SVG 体积': ['SVG 體積', 'SVG size on disk'],
  '路径数量': ['路徑數量', 'Paths'],
  '体积对比': ['體積對比', 'Size vs. original'],
  '处理耗时': ['處理耗時', 'Time taken'],
  '{a} × {b} px': ['{a} × {b} px', '{a} × {b} px'],
  '{n} 条': ['{n} 條', '{n} paths'],
  '{n} ms': ['{n} ms', '{n} ms'],
  '{n}%': ['{n}%', '{n}%'],
  '已按上限缩小后再描线 (矢量图与分辨率无关)': ['已依上限縮小後再描線 (向量圖與解析度無關)', 'Scaled down before tracing (vector output is resolution independent)'],

  // 参数
  '调整参数': ['調整參數', 'Adjust settings'],
  '预设': ['預設', 'Preset'],
  '默认': ['預設', 'Default'],
  '照片': ['照片', 'Photo'],
  '扁平插画': ['扁平插畫', 'Flat illustration'],
  '海报色块': ['海報色塊', 'Poster'],
  '线稿手绘': ['線稿手繪', 'Line art'],
  '印章文字': ['印章文字', 'Stamp / text'],
  '像素风': ['像素風', 'Pixel art'],
  'VTracer 官方默认值, 通用的起点': ['VTracer 官方預設值, 通用的起點', 'VTracer defaults — a sensible starting point'],
  '保留更多相近色与细节, 适合照片 / 风景': ['保留更多相近色與細節, 適合照片 / 風景', 'Keeps more similar colors and detail — good for photos and landscapes'],
  '合并相近色成整块, 适合扁平插画 / 图标': ['合併相近色成整塊, 適合扁平插畫 / 圖示', 'Merges similar colors into solid areas — good for flat illustration and icons'],
  '色差阈值更大, 得到大块纯色的海报效果': ['色差閾值更大, 得到大塊純色的海報效果', 'A larger color threshold gives big flat poster-like areas'],
  '黑白二值 + 保留棱角, 适合铅笔线稿 / 手绘': ['黑白二值 + 保留稜角, 適合鉛筆線稿 / 手繪', 'Black & white with corners kept — good for pencil sketches and drawings'],
  '黑白二值 + 直线多边形, 边缘更硬 (印章 / 文字)': ['黑白二值 + 直線多邊形, 邊緣更硬 (印章 / 文字)', 'Black & white with polygons for crisp edges (stamps, lettering)'],
  '不做曲线拟合, 直接输出像素方块 (像素画 / 复古游戏)': ['不做曲線擬合, 直接輸出像素方塊 (像素畫 / 復古遊戲)', 'No curve fitting — outputs pixel blocks (pixel art, retro games)'],
  '已手动调整参数, 选一个预设可回到推荐组合': ['已手動調整參數, 選一個預設可回到推薦組合', 'Manually adjusted — pick a preset to restore a recommended combination'],
  '原尺寸': ['原尺寸', 'Original'],
  '最长边不超过 {n} px': ['最長邊不超過 {n} px', 'Longest side ≤ {n} px'],
  '先缩小再描线, 速度更快; 矢量图放大不糊, 一般 1024 px 足够': ['先縮小再描線, 速度更快; 向量圖放大不糊, 一般 1024 px 足夠', 'Tracing a smaller copy is much faster; vector art scales cleanly, so 1024 px is usually plenty'],
  '颜色模式': ['顏色模式', 'Color mode'],
  '彩色': ['彩色', 'Color'],
  '黑白二值': ['黑白二值', 'Black & white'],
  '彩色会按相近色分层输出; 黑白二值只输出纯黑块 (线稿 / 印章 / 扫描件)': ['彩色會依相近色分層輸出; 黑白二值只輸出純黑塊 (線稿 / 印章 / 掃描件)', 'Color layers similar colors; black & white outputs pure black shapes only (line art, stamps, scans)'],
  '曲线拟合': ['曲線擬合', 'Curve fitting'],
  '平滑曲线': ['平滑曲線', 'Smooth curves'],
  '直线多边形': ['直線多邊形', 'Polygons'],
  '像素方块': ['像素方塊', 'Pixels'],
  '样条曲线最贴合原图; 多边形 / 像素方块输出更规整、体积更小': ['樣條曲線最貼合原圖; 多邊形 / 像素方塊輸出更規整、體積更小', 'Splines follow the image most closely; polygons and pixel blocks are cleaner and smaller'],
  '层叠策略': ['層疊策略', 'Layering'],
  '叠加': ['疊加', 'Stacked'],
  '镂空': ['鏤空', 'Cutout'],
  '叠加层层覆盖、文件更小; 镂空每块互不重叠, 便于逐块编辑': ['疊加層層覆蓋、檔案更小; 鏤空每塊互不重疊, 便於逐塊編輯', 'Stacked layers overlap and are smaller; cutout shapes never overlap, which is easier to edit'],
  '斑点过滤': ['斑點過濾', 'Speckle filter'],
  '忽略面积小于该值的碎块 (噪点), 调大可去掉扫描噪点与 JPEG 杂色': ['忽略面積小於該值的碎塊 (雜點), 調大可去掉掃描雜點與 JPEG 雜色', 'Ignores blobs smaller than this (noise); raise it to clean up scanner noise and JPEG artifacts'],
  '颜色精度': ['顏色精度', 'Color precision'],
  '越大保留的相近色越多、色块越细; 调小会让相近色合并成整块': ['越大保留的相近色越多、色塊越細; 調小會讓相近色合併成整塊', 'Higher keeps more similar colors and finer shapes; lower merges them into bigger areas'],
  '层间色差': ['層間色差', 'Layer difference'],
  '相邻两层的色差阈值, 越大越容易并层 (层数少、色带明显)': ['相鄰兩層的色差閾值, 越大越容易併層 (層數少、色帶明顯)', 'Color-difference threshold between gradient layers; higher merges more layers (fewer bands)'],
  '棱角阈值': ['稜角閾值', 'Corner threshold'],
  '夹角大于该值才当作角保留, 调小更圆润、调大更硬朗': ['夾角大於該值才當作角保留, 調小更圓潤、調大更硬朗', 'Angles wider than this stay sharp; lower is rounder, higher is crisper'],
  '曲线细分长度': ['曲線細分長度', 'Segment length'],
  '线段被细分到不长于该长度, 越大曲线越平滑 (细节更少)': ['線段被細分到不長於該長度, 越大曲線越平滑 (細節更少)', 'Segments are subdivided until shorter than this; larger means smoother (less detail)'],
  '平滑迭代': ['平滑迭代', 'Smoothing iterations'],
  '样条逼近的迭代次数, 越大越圆滑、越慢也越大': ['樣條逼近的迭代次數, 越大越圓滑、越慢也越大', 'Spline approximation iterations; more is smoother but slower and bigger'],
  '拼接阈值': ['拼接閾值', 'Splice threshold'],
  '角度位移大于该值才拼接两段曲线, 越大转折越圆': ['角度位移大於該值才拼接兩段曲線, 越大轉折越圓', 'Splices two segments when the angle exceeds this; larger makes corners rounder'],
  '坐标精度': ['座標精度', 'Coordinate precision'],
  '坐标保留的小数位数, 8 最精确、0 文件最小': ['座標保留的小數位數, 8 最精確、0 檔案最小', 'Decimal places kept in path coordinates; 8 is the most precise, 0 the smallest file'],

  // 源码
  'SVG 源码': ['SVG 原始碼', 'SVG source'],
  '显示源码': ['顯示原始碼', 'Show source'],
  '收起源码': ['收起原始碼', 'Hide source'],
  '已截断, 仅显示前 {n} 字符': ['已截斷, 僅顯示前 {n} 字元', 'Truncated to the first {n} characters'],

  // 说明
  '图片转 SVG 说明': ['圖片轉 SVG 說明', 'About raster to SVG conversion'],
};

// 取词: 无命中回退 zh 原文
export const vs = (locale: string, zh: string): string => {
  const e = rows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const vsT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = vs(locale, zh);
  if (v) for (const [ k, val ] of Object.entries(v)) s = s.split('{' + k + '}').join(String(val));
  return s;
};
