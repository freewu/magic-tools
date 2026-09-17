import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>用 <b>USM 钝化蒙版 (Unsharp Mask)</b> 让图片看起来更清晰: 先对图片做一次轻微模糊, 把"原图 − 模糊图"当作<b>细节</b>, 再按<b>强度</b>把细节叠加回原图。边缘处的差值被放大后形成"过冲", 于是轮廓看起来更锐利。可以调<b>强度</b>、<b>半径</b>、<b>阈值</b>三个参数, 右侧即时预览。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>点击「选择图片」, 或把图片直接拖到虚线框内 (图片只在浏览器本地处理, 不会上传)</p></li>
<li><p>拖「<b>锐化强度</b>」: 0% 等于不锐化, 100% 是标准叠加量, 200%~300% 用于补救明显发虚的图片。强度过高会在高对比边缘出现一圈白边 / 黑边, 这就是"过冲", 也是锐化过度的信号</p></li>
<li><p>拖「<b>半径</b>」: 1 px 只作用于相邻像素, 适合挽救轻微失焦的文字; 3~5 px 影响的邻域更大, 会让较粗的轮廓变硬, 但更容易出现白边</p></li>
<li><p>拖「<b>阈值</b>」: 差值小于阈值的像素完全不动。把阈值调到 10~30 可以只锐化真正的边缘, 避免把平坦区域的噪点一起放大 (扫过胶片颗粒、手机夜景照片时很有用)</p></li>
<li><p>选择输出格式与质量, 点「保存」导出, 文件名形如 <code>原名_sharpen.png</code> (不会覆盖原图)</p></li>
<li><p>需要修复严重的模糊 (如拍虚的文档) 时, 建议先<b>缩小到目标尺寸再锐化</b>: 先放大再锐化只会把插值出来的模糊像素"描边", 效果反而不自然</p></li>
</ul>

<h2>原理: 为什么叫"钝化蒙版"</h2>
<ul>
<li><p>这个名字来自暗房工艺: 把底片的模糊副本当作蒙版叠上去, 就能做出边缘更清晰的效果, 所以其实是一种"反直觉"的锐化方式</p></li>
<li><p>公式是 <code>输出 = 原图 + 强度 × (原图 − 模糊图)</code>。模糊图代表"低频"信息, 相减之后剩下的就是高频的细节与边缘; 把细节按比例加回去, 边缘两端就会向"更亮"和"更暗"各走一步, 于是对比增强</p></li>
<li><p>锐化是"提升局部对比"而不是"凭空创造细节": 已经丢失的信息不会被恢复, 过度锐化只会产生光晕 (halo)。宁可用 60% 的强度分两次轻微锐化, 也不要一次 300%</p></li>
<li><p>本工具用<b>盒式模糊</b> (均值滤波) 来近似高斯模糊: 复杂度 O(像素数), 与半径无关, 所以即使半径 5 px 也是瞬间完成</p></li>
</ul>

<h2>三个参数的推荐组合</h2>
<ul>
<li><p><b>网页 / 界面截图</b>: 强度 60~100%, 半径 1 px, 阈值 0。让 1px 的描边更清晰, 又不会脏</p></li>
<li><p><b>人物 / 风景照片</b>: 强度 80~150%, 半径 1~2 px, 阈值 8~20。半径小、阈值略高, 可以只锐化轮廓而不放大皮肤噪点</p></li>
<li><p><b>被压缩过的图片 (JPEG 块噪)</b>: 强度 50~80%, 半径 2 px, 阈值 20~40。让块噪尽量不参与计算</p></li>
<li><p><b>严重发虚</b>: 强度 200~300%, 半径 3~5 px, 阈值 0。能救回一部分细节, 但白边会很显眼, 建议只在其他办法用尽后使用</p></li>
</ul>

<h2>输出与说明</h2>
<ul>
<li><p>结果尺寸与原图完全一致, 不会缩放也不会裁剪; α (透明度) 通道始终保持不变</p></li>
<li><p>锐化会改变像素值, 因此输出 JPEG / WebP 时压缩误差会被再放大一点, 建议优先用 PNG 保存结果</p></li>
<li><p>全部处理都在本地浏览器 (或桌面端 WebView) 内完成, 图片不会上传到任何服务器</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>用 <b>USM 鈍化蒙版 (Unsharp Mask)</b> 讓圖片看起來更清晰: 先對圖片做一次輕微模糊, 把「原圖 − 模糊圖」當作<b>細節</b>, 再依<b>強度</b>把細節疊加回原圖。邊緣處的差值被放大後形成「過衝」, 於是輪廓看起來更銳利。可以調<b>強度</b>、<b>半徑</b>、<b>閾值</b>三個參數, 右側即時預覽。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>點擊「選擇圖片」, 或把圖片直接拖到虛線框內 (圖片只在本機瀏覽器處理, 不會上傳)</p></li>
<li><p>拖「<b>銳化強度</b>」: 0% 等於不銳化, 100% 是標準疊加量, 200%~300% 用於補救明顯發虛的圖片。強度過高會在高對比邊緣出現一圈白邊 / 黑邊, 這就是「過衝」, 也是銳化過度的信號</p></li>
<li><p>拖「<b>半徑</b>」: 1 px 只作用於相鄰像素, 適合挽救輕微失焦的文字; 3~5 px 影響的鄰域更大, 會讓較粗的輪廓變硬, 但更容易出現白邊</p></li>
<li><p>拖「<b>閾值</b>」: 差值小於閾值的像素完全不動。把閾值調到 10~30 可以只銳化真正的邊緣, 避免把平坦區域的雜點一起放大 (掃過膠片顆粒、手機夜景照片時很有用)</p></li>
<li><p>選擇輸出格式與品質, 點「儲存」匯出, 檔案名形如 <code>原名_sharpen.png</code> (不會覆蓋原圖)</p></li>
<li><p>需要修復嚴重的模糊 (如拍虛的文件) 時, 建議先<b>縮小到目標尺寸再銳化</b>: 先放大再銳化只會把插值出來的模糊像素「描邊」, 效果反而不自然</p></li>
</ul>

<h2>原理: 為什麼叫「鈍化蒙版」</h2>
<ul>
<li><p>這個名字來自暗房工藝: 把底片的模糊副本當作蒙版疊上去, 就能做出邊緣更清晰的效果, 所以其實是一種「反直覺」的銳化方式</p></li>
<li><p>公式是 <code>輸出 = 原圖 + 強度 × (原圖 − 模糊圖)</code>。模糊圖代表「低頻」資訊, 相減之後剩下的就是高頻的細節與邊緣; 把細節按比例加回去, 邊緣兩端就會向「更亮」和「更暗」各走一步, 於是對比增強</p></li>
<li><p>銳化是「提升局部對比」而不是「憑空創造細節」: 已經遺失的資訊不會被恢復, 過度銳化只會產生光暈 (halo)。寧可用 60% 的強度分兩次輕微銳化, 也不要一次 300%</p></li>
<li><p>本工具用<b>盒式模糊</b> (均值濾波) 來近似高斯模糊: 複雜度 O(像素數), 與半徑無關, 所以即使半徑 5 px 也是瞬間完成</p></li>
</ul>

<h2>三個參數的推薦組合</h2>
<ul>
<li><p><b>網頁 / 介面截圖</b>: 強度 60~100%, 半徑 1 px, 閾值 0。讓 1px 的描邊更清晰, 又不會髒</p></li>
<li><p><b>人物 / 風景照片</b>: 強度 80~150%, 半徑 1~2 px, 閾值 8~20。半徑小、閾值略高, 可以只銳化輪廓而不放大皮膚雜點</p></li>
<li><p><b>被壓縮過的圖片 (JPEG 塊噪)</b>: 強度 50~80%, 半徑 2 px, 閾值 20~40。讓塊噪盡量不參與計算</p></li>
<li><p><b>嚴重發虛</b>: 強度 200~300%, 半徑 3~5 px, 閾值 0。能救回一部分細節, 但白邊會很顯眼, 建議只在其他辦法用盡後使用</p></li>
</ul>

<h2>輸出與說明</h2>
<ul>
<li><p>結果尺寸與原圖完全一致, 不會縮放也不會裁剪; α (透明度) 通道始終保持不變</p></li>
<li><p>銳化會改變像素值, 因此輸出 JPEG / WebP 時壓縮誤差會被再放大一點, 建議優先以 PNG 儲存結果</p></li>
<li><p>全部處理都在本機瀏覽器 (或桌面端 WebView) 內完成, 圖片不會上傳到任何伺服器</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Sharpens an image with <b>USM (Unsharp Mask)</b>: blur the image slightly, treat "original − blurred" as the <b>detail</b>, then blend that detail back onto the original according to the <b>amount</b>. Along edges the amplified difference creates "overshoot", which is what makes contours look crisper. Three parameters are adjustable — <b>amount</b>, <b>radius</b> and <b>threshold</b> — with a live preview.</p></blockquote>

<h2>Steps</h2>
<ul>
<li><p>Click "Choose image", or drop an image onto the dashed area (everything runs locally, nothing is uploaded)</p></li>
<li><p>Drag the <b>amount</b>: 0% means no sharpening, 100% is the standard blend, and 200–300% rescues visibly soft photos. Too much amount produces a light/dark halo along high-contrast edges — that overshoot is the classic sign of over-sharpening</p></li>
<li><p>Drag the <b>radius</b>: 1 px only touches neighbouring pixels and works well for slightly out-of-focus text, while 3–5 px affects a wider neighbourhood and hardens coarser contours at the cost of more halos</p></li>
<li><p>Drag the <b>threshold</b>: pixels whose detail difference is below it are left completely alone. Setting it to 10–30 sharpens only genuine edges and avoids amplifying noise in flat areas — very handy for film grain or night shots</p></li>
<li><p>Choose the output format and quality, then click "Save"; files are named <code>name_sharpen.png</code> (the original is never overwritten)</p></li>
<li><p>When repairing heavy blur (a shaky photo of a document), <b>downscale to the final size first and sharpen afterwards</b>: upscaling first and then sharpening merely outlines interpolated mush and looks unnatural</p></li>
</ul>

<h2>Why is it called "unsharp" mask?</h2>
<ul>
<li><p>The name comes from darkroom work: a blurred copy of the negative was used as a mask, and the result had crisper edges — a counter-intuitive way of sharpening</p></li>
<li><p>The formula is <code>output = original + amount × (original − blurred)</code>. The blurred copy holds the low frequencies; subtracting it leaves the high-frequency detail and edges. Adding that back at a chosen ratio pushes both sides of an edge one step brighter and darker, which increases local contrast</p></li>
<li><p>Sharpening raises local contrast; it cannot invent detail. Lost information stays lost, and over-sharpening only adds halos. Two gentle 60% passes beat one 300% pass</p></li>
<li><p>This tool approximates a Gaussian blur with a <b>box blur</b> (mean filter): the cost is O(pixels) regardless of radius, so even radius 5 px is instant</p></li>
</ul>

<h2>Suggested combinations</h2>
<ul>
<li><p><b>Web / UI screenshots</b>: amount 60–100%, radius 1 px, threshold 0 — crisper 1px strokes without dirtying the image</p></li>
<li><p><b>Portraits / landscapes</b>: amount 80–150%, radius 1–2 px, threshold 8–20 — small radius plus a higher threshold sharpens contours without amplifying skin noise</p></li>
<li><p><b>Previously compressed photos (JPEG blocking)</b>: amount 50–80%, radius 2 px, threshold 20–40 to keep the blocking out of the calculation</p></li>
<li><p><b>Very soft images</b>: amount 200–300%, radius 3–5 px, threshold 0 — recovers some detail, but halos become obvious, so use it only as a last resort</p></li>
</ul>

<h2>Output and notes</h2>
<ul>
<li><p>The result keeps the exact original dimensions; nothing is scaled or cropped, and the alpha channel is never modified</p></li>
<li><p>Sharpening alters pixel values, so JPEG / WebP compression artifacts get amplified a little more; prefer saving the result as PNG</p></li>
<li><p>Everything happens in the local browser (or desktop WebView); the image is never uploaded anywhere</p></li>
</ul>`;

const ImageSharpenIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default ImageSharpenIntro;
