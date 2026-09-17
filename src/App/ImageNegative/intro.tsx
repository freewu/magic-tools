import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>把图片做成<b>负片</b> (颜色反相): 黑变白、白变黑, 红变青、绿变品红、蓝变黄。适合做暗色底图、检查图片暗部细节、制作艺术化效果, 或给儿童读物 / 幻灯片做一个"反色"版本。反相强度可调, 不想要全反相时可以只做一部分, 右侧即时预览结果。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>点击「选择图片」, 或把图片直接拖到虚线框内 (图片只在浏览器本地处理, 不会上传)</p></li>
<li><p>拖动「负片强度」滑块: 100% 为完全反相 (标准负片), 50% 会让颜色向中间灰靠拢, 0% 与原图一致</p></li>
<li><p>选择输出格式: 需要保留透明或无损时用 PNG, 想减小体积时用 JPEG 或 WebP 并调低质量</p></li>
<li><p>点「保存」导出结果, 文件名形如 <code>原名_negative.png</code> (不会覆盖原图)</p></li>
</ul>

<h2>反相是怎么算的</h2>
<ul>
<li><p>每个颜色通道单独计算: <code>新值 = 原值 + (255 - 2 × 原值) × 强度</code>。强度 100% 时即为 <code>255 - 原值</code>, 也就是常说的负片</p></li>
<li><p>反相是<b>逐像素、逐通道</b>的独立运算, 不参考周围像素, 所以图片的明暗结构与细节完全保留, 只是明暗关系被翻转</p></li>
<li><p>透明度 (α 通道) <b>不会被反相</b>: 透明的地方仍然透明, 半透明的地方仍然半透明, 只是颜色被翻转</p></li>
<li><p>反相两次会回到原图 (强度 100% 时), 因此这是一个可以无损来回的可逆变换 (仅限 PNG 无损输出)</p></li>
<li><p>强度是<b>线性叠加</b>: 新值 = 原值 + (255 - 2 × 原值) × 强度。因此 50% 附近会把所有灰度拉向中灰 (对比度降到最低), 想要"轻微反相"请用 20% 左右的小数值, 想要标准负片请用 100%</p></li>
</ul>

<h2>输出说明</h2>
<ul>
<li><p>结果尺寸与原图完全一致, 不会缩放也不会裁剪</p></li>
<li><p>输出 JPEG / WebP 时, 原图的透明区域会先铺上白底 (这两种格式没有透明通道), 再参与反相; 想要保留透明请选 PNG</p></li>
<li><p>「结果体积」按导出后的编码数据估算, 便于对比不同格式的压缩效果</p></li>
</ul>

<h2>说明</h2>
<ul>
<li><p>全部处理都在本地浏览器 (或桌面端 WebView) 内完成, 图片不会上传到任何服务器</p></li>
<li><p>反相常用于替代"夜间模式": 白底黑字的文档反相后更护眼; 但照片反相后颜色不自然, 属于艺术效果而非真实还原</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>把圖片做成<b>負片</b> (顏色反相): 黑變白、白變黑, 紅變青、綠變洋紅、藍變黃。適合做暗色底圖、檢查圖片暗部細節、製作藝術化效果, 或為兒童讀物 / 投影片做一個「反色」版本。反相強度可調, 不想要全反相時可以只做一部分, 右側即時預覽結果。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>點擊「選擇圖片」, 或把圖片直接拖到虛線框內 (圖片只在本機瀏覽器處理, 不會上傳)</p></li>
<li><p>拖動「負片強度」滑桿: 100% 為完全反相 (標準負片), 50% 會讓顏色向中間灰靠攏, 0% 與原圖一致</p></li>
<li><p>選擇輸出格式: 需要保留透明或無損時用 PNG, 想減小體積時用 JPEG 或 WebP 並調低品質</p></li>
<li><p>點「儲存」匯出結果, 檔案名形如 <code>原名_negative.png</code> (不會覆蓋原圖)</p></li>
</ul>

<h2>反相是怎麼算的</h2>
<ul>
<li><p>每個顏色通道單獨計算: <code>新值 = 原值 + (255 - 2 × 原值) × 強度</code>。強度 100% 時即為 <code>255 - 原值</code>, 也就是常說的負片</p></li>
<li><p>反相是<b>逐像素、逐通道</b>的獨立運算, 不參考周圍像素, 所以圖片的明暗結構與細節完全保留, 只是明暗關係被翻轉</p></li>
<li><p>透明度 (α 通道) <b>不會被反相</b>: 透明的地方仍然透明, 半透明的地方仍然半透明, 只是顏色被翻轉</p></li>
<li><p>反相兩次會回到原圖 (強度 100% 時), 因此這是一個可以無損來回的可逆轉換 (僅限 PNG 無損輸出)</p></li>
<li><p>強度是<b>線性疊加</b>: 新值 = 原值 + (255 - 2 × 原值) × 強度。因此 50% 附近會把所有灰度拉向中灰 (對比度降到最低), 想要「輕微反相」請用 20% 左右的小數值, 想要標準負片請用 100%</p></li>
</ul>

<h2>輸出說明</h2>
<ul>
<li><p>結果尺寸與原圖完全一致, 不會縮放也不會裁剪</p></li>
<li><p>輸出 JPEG / WebP 時, 原圖的透明區域會先鋪上白底 (這兩種格式沒有透明通道), 再參與反相; 想要保留透明請選 PNG</p></li>
<li><p>「結果體積」按匯出後的編碼資料估算, 便於對比不同格式的壓縮效果</p></li>
</ul>

<h2>說明</h2>
<ul>
<li><p>全部處理都在本機瀏覽器 (或桌面端 WebView) 內完成, 圖片不會上傳到任何伺服器</p></li>
<li><p>反相常用於替代「夜間模式」: 白底黑字的文件反相後更護眼; 但照片反相後顏色不自然, 屬於藝術效果而非真實還原</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Turns an image into a <b>negative</b> (inverts its colors): black becomes white and white becomes black, red becomes cyan, green becomes magenta, blue becomes yellow. Useful for dark backdrops, inspecting shadow detail, artistic effects, or making an "inverted" version for slides and handouts. The strength is adjustable, so you can invert only partially, with a live preview on the right.</p></blockquote>

<h2>Steps</h2>
<ul>
<li><p>Click "Choose image", or drop an image onto the dashed area (everything runs locally in the browser, nothing is uploaded)</p></li>
<li><p>Drag the "Invert strength" slider: 100% is a full negative, 50% pulls colors toward mid grey, 0% keeps the original</p></li>
<li><p>Pick an output format: PNG to keep transparency and lossless quality, JPEG or WebP with a lower quality for a smaller file</p></li>
<li><p>Click "Save" to export the result as <code>name_negative.png</code> (the original file is never overwritten)</p></li>
</ul>

<h2>How the inversion is computed</h2>
<ul>
<li><p>Each color channel is handled on its own: <code>next = value + (255 - 2 × value) × strength</code>. At 100% this is simply <code>255 - value</code>, the classic negative</p></li>
<li><p>Inversion is <b>per-pixel and per-channel</b>, with no neighbour lookup, so all structure and detail is preserved — only the light/dark relationship is flipped</p></li>
<li><p>The alpha channel is <b>never inverted</b>: transparent stays transparent and semi-transparent stays semi-transparent, only the color flips</p></li>
<li><p>Inverting twice restores the original (at 100% strength), so the transform is reversible — though only losslessly for PNG output</p></li>
<li><p>The strength is a <b>linear blend</b>: next = value + (255 - 2 × value) × strength. Around 50% every tone is pulled toward mid grey (minimum contrast), so use small values such as 20% for a subtle inversion and 100% for a true negative</p></li>
</ul>

<h2>Output</h2>
<ul>
<li><p>The result keeps the exact original dimensions; nothing is scaled or cropped</p></li>
<li><p>For JPEG / WebP output the transparent areas are filled with white first (those formats have no alpha channel) and then inverted; choose PNG if you need transparency</p></li>
<li><p>"Result size on disk" is estimated from the encoded output so you can compare formats</p></li>
</ul>

<h2>Notes</h2>
<ul>
<li><p>Everything happens in the local browser (or desktop WebView); the image is never uploaded anywhere</p></li>
<li><p>Inverting a text document (black on white) is a common stand-in for a night mode; inverting a photo produces an artistic look rather than a realistic one</p></li>
</ul>`;

const ImageNegativeIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default ImageNegativeIntro;
