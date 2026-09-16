import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>把一张图片缩放到<b>指定尺寸</b>, 或把图片<b>顺时针旋转 90° / 180° / 270°</b>: 可以按原图比例缩放 (25% / 50% / 200% …), 也可以直接指定目标宽高像素, 并锁定宽高比避免变形。适合上传前压缩尺寸、生成缩略图、把大图缩到某个平台要求的尺寸、校正拍歪的照片方向。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>点击「选择图片」, 或把图片直接拖到虚线框内 (图片只在浏览器本地处理, 不会上传)</p></li>
<li><p>选择「尺寸模式」: <b>按比例</b> 拖动滑块或用 25% / 50% / 75% / 100% 快捷按钮; <b>按像素</b> 直接填宽度与高度</p></li>
<li><p>按像素模式下勾选「锁定宽高比」后, 改宽度会自动算高度 (反之亦然); 点「用原图尺寸」可一键回到原始像素</p></li>
<li><p>需要转向时在「旋转角度」选 <b>90° / 180° / 270°</b> (顺时针); 90° 与 270° 会交换宽高, 结果尺寸与预览会同步更新</p></li>
<li><p>按需开启「不放大图片」(仅缩小)、选择输出格式与质量, 右侧会实时给出结果预览与新尺寸</p></li>
<li><p>点击「保存」导出结果, 文件名形如 <code>原名_宽x高.png</code></p></li>
</ul>

<h2>尺寸与画质说明</h2>
<ul>
<li><p>结果宽高由原图尺寸乘以比例后<b>四舍五入</b>, 并保证至少 1 像素; 极小的比例 (如 1%) 也不会得到 0 尺寸的无效图片</p></li>
<li><p>缩小超过一半时会<b>分多步逐步绘制</b>, 避免一次性大比例缩放导致的锯齿与模糊 (浏览器内置高质量插值); 旋转只对最终尺寸的小画布做一次</p></li>
<li><p>「不放大图片」开启时, 结果不会超过原图尺寸: 超出时会等比缩回原图大小, 避免把截图放大后变糊</p></li>
<li><p>输出 PNG 无损且保留透明; 输出 JPEG / WebP 体积更小, 质量可调 (默认 0.92, 透明区域会自动铺白底); 浏览器不支持 WebP 导出时该项会自动禁用</p></li>
<li><p>设置里可配置默认缩放比例 / 默认输出格式 / 默认输出质量 / 默认锁定宽高比, 打开工具即生效</p></li>
</ul>

<h2>说明</h2>
<ul>
<li><p>缩放与旋转完全在本地浏览器 (或桌面端 WebView) 内完成, 图片不会上传到任何服务器</p></li>
<li><p>「结果体积」是按导出编码后的数据估算的, 用于对比压缩效果; 实际写入磁盘的字节数与之基本一致</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>把一張圖片縮放到<b>指定尺寸</b>, 或把圖片<b>順時針旋轉 90° / 180° / 270°</b>: 可以依原圖比例縮放 (25% / 50% / 200% …), 也可以直接指定目標寬高像素, 並鎖定長寬比避免變形。適合上傳前壓縮尺寸、產生縮圖、把大圖縮到某個平台要求的尺寸、校正拍歪的照片方向。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>點擊「選擇圖片」, 或把圖片直接拖到虛線框內 (圖片只在本機瀏覽器處理, 不會上傳)</p></li>
<li><p>選擇「尺寸模式」: <b>依比例</b> 拖動滑桿或用 25% / 50% / 75% / 100% 快捷按鈕; <b>依像素</b> 直接填寬度與高度</p></li>
<li><p>依像素模式下勾選「鎖定長寬比」後, 改寬度會自動算高度 (反之亦然); 點「用原圖尺寸」可一鍵回到原始像素</p></li>
<li><p>需要轉向時在「旋轉角度」選 <b>90° / 180° / 270°</b> (順時針); 90° 與 270° 會交換寬高, 結果尺寸與預覽會同步更新</p></li>
<li><p>視需要開啟「不放大圖片」(僅縮小)、選擇輸出格式與品質, 右側會即時給出結果預覽與新尺寸</p></li>
<li><p>點擊「儲存」匯出結果, 檔案名形如 <code>原名_寬x高.png</code></p></li>
</ul>

<h2>尺寸與畫質說明</h2>
<ul>
<li><p>結果寬高由原圖尺寸乘以比例後<b>四捨五入</b>, 並保證至少 1 像素; 極小的比例 (如 1%) 也不會得到 0 尺寸的無效圖片</p></li>
<li><p>縮小超過一半時會<b>分多步逐步繪製</b>, 避免一次性大比例縮放導致的鋸齒與模糊 (瀏覽器內建高品質插值); 旋轉只對最終尺寸的小畫布做一次</p></li>
<li><p>「不放大圖片」開啟時, 結果不會超過原圖尺寸: 超出時會等比縮回原圖大小, 避免把截圖放大後變糊</p></li>
<li><p>輸出 PNG 無損且保留透明; 輸出 JPEG / WebP 體積較小, 品質可調 (預設 0.92, 透明區域會自動鋪白底); 瀏覽器不支援 WebP 匯出時該項會自動停用</p></li>
<li><p>設定裡可配置預設縮放比例 / 預設輸出格式 / 預設輸出品質 / 預設鎖定長寬比, 開啟工具即生效</p></li>
</ul>

<h2>說明</h2>
<ul>
<li><p>縮放與旋轉完全在本機瀏覽器 (或桌面端 WebView) 內完成, 圖片不會上傳到任何伺服器</p></li>
<li><p>「結果體積」是依匯出編碼後的資料估算的, 用於對比壓縮效果; 實際寫入磁碟的位元組數與之基本一致</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Resize an image to <b>a specific size</b>, or <b>rotate it clockwise by 90° / 180° / 270°</b>: scale it by a percentage of the original (25% / 50% / 200% …), or enter the exact target width and height while locking the aspect ratio so nothing gets stretched. Useful for shrinking images before upload, generating thumbnails, hitting a platform's required dimensions, or fixing the orientation of a tilted photo.</p></blockquote>

<h2>Steps</h2>
<ul>
<li><p>Click "Choose image", or drop an image into the dashed box (the image is processed locally in your browser and never uploaded)</p></li>
<li><p>Pick a size mode: with <b>By percentage</b> drag the slider or use the 25% / 50% / 75% / 100% presets; with <b>By pixels</b> type the width and height directly</p></li>
<li><p>In pixel mode, "Lock aspect ratio" makes the height follow the width (and vice versa); "Use original size" resets both to the original pixels</p></li>
<li><p>Use <b>Rotation</b> to turn the image clockwise by 90° / 180° / 270°; 90° and 270° swap the width and height, and the result size and preview update instantly</p></li>
<li><p>Optionally enable "Never enlarge" (shrink only) and choose the output format and quality — the result preview and the new dimensions update instantly</p></li>
<li><p>Click "Save" to export the result; the file name looks like <code>name_800x600.png</code></p></li>
</ul>

<h2>Sizes and quality</h2>
<ul>
<li><p>The result dimensions are the original size times the percentage, <b>rounded</b> and clamped to at least 1 pixel, so even a 1% scale never yields a degenerate 0-pixel image</p></li>
<li><p>When reducing by more than half, the image is <b>drawn in several steps</b> to avoid the aliasing and blur of a single large downscale (using the browser's high-quality interpolation); rotation is applied once to the small final canvas</p></li>
<li><p>With "Never enlarge" enabled the result never exceeds the original size: anything larger is scaled back down proportionally, so upscaled screenshots don't turn blurry</p></li>
<li><p>PNG output is lossless and keeps transparency; JPEG / WebP are smaller with adjustable quality (0.92 by default, transparent areas are filled with white); the WebP option is disabled automatically when the browser cannot export it</p></li>
<li><p>Settings let you configure the default percentage, output format, output quality and aspect-ratio lock, applied as soon as the tool opens</p></li>
</ul>

<h2>Notes</h2>
<ul>
<li><p>Resizing and rotating happen entirely in the local browser (or desktop WebView); the image is never uploaded anywhere</p></li>
<li><p>"Result size on disk" is estimated from the encoded output so you can compare compression; the bytes actually written are essentially the same</p></li>
</ul>`;

const ImageResizeIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default ImageResizeIntro;
