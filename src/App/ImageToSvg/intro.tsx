import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>把<b>位图</b> (PNG / JPG / GIF / WebP / BMP) 描线成<b>矢量 SVG</b>: 每一块相近的颜色被合并成一个色块, 色块的轮廓被拟合成平滑曲线或多边形。放大不会糊、印刷不虚、体积往往比原图小, 适合把 Logo、图标、线稿、扫描件、像素画变成可继续编辑的矢量图。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>点击「选择图片」或把图片拖进虚线框 (全程本地处理, 图片不会上传)</p></li>
<li><p>先选「预设」: 照片 / 扁平插画 / 海报色块 / 线稿手绘 / 印章文字 / 像素风。预设只是把下面几项参数换了推荐值, 之后仍可逐项微调</p></li>
<li><p>「处理尺寸」一般保持 <b>1024 px</b> 即可: 矢量图放大不会糊, 先缩小再描线能快好几倍。原图很小 (图标、像素画) 时选「原尺寸」, 需要极致细节时选 2048 px</p></li>
<li><p>看结果预览与统计 (路径数量 / SVG 体积 / 体积对比 / 耗时), 不满意就接着调参数, 预览会自动刷新</p></li>
<li><p>点「保存 SVG」导出为 <code>原名_vector.svg</code>; 想直接拿去用可以点「复制 SVG」, 或展开源码手动复制</p></li>
</ul>

<h2>颜色模式与曲线拟合</h2>
<ul>
<li><p><b>彩色</b>: VTracer 会把颜色相近的像素聚成一层层色块, 按"叠加"或"镂空"输出。照片、插画、复杂图标用这个模式</p></li>
<li><p><b>黑白二值</b>: 只判定"亮还是暗", 输出纯黑的色块。适合线稿、印章、扫描件、只有单色的文字 logo。为了让判定符合直觉, 二值模式会先把像素转成灰度再比较</p></li>
<li><p><b>平滑曲线 (spline)</b>: 用贝塞尔曲线贴合边缘, 最像原图</p></li>
<li><p><b>直线多边形 (polygon)</b>: 只用直线段, 形状规整、文件更小, 适合建筑图、图表、印章</p></li>
<li><p><b>像素方块 (pixel)</b>: 不做曲线拟合, 每个像素块一个方块, 用来把像素画 / 复古游戏素材转成 SVG</p></li>
<li><p><b>叠加 / 镂空</b>: 叠加是上层覆盖下层 (文件小, 是 VTracer 的默认策略); 镂空让每块互不重叠 (便于在 Illustrator / Figma 里逐块改色)</p></li>
</ul>

<h2>参数怎么调</h2>
<ul>
<li><p><b>斑点过滤</b>: 最常见的"去噪"开关。扫描件的小黑点、JPEG 的杂色都会变成碎块, 调大 (8~16) 就能把它们并掉</p></li>
<li><p><b>颜色精度</b>: 越大保留的相近色越多、色块越细; 调小会让相近色合并成整块 (做成扁平风格)</p></li>
<li><p><b>层间色差</b>: 相邻两层的色差阈值, 调大并层更狠 (层数更少、色带更明显), 调小则保留更多渐变层次</p></li>
<li><p><b>棱角阈值 / 拼接阈值</b>: 前者决定多尖的角才被当成角保留, 后者决定转折处圆不圆。想要"硬朗"就调大棱角阈值、调小拼接阈值</p></li>
<li><p><b>曲线细分长度 / 平滑迭代</b>: 两个"顺滑度"参数, 调大更圆润但细节更少、耗时更长</p></li>
<li><p><b>坐标精度</b>: 路径坐标保留几位小数。2 位足够网页使用, 8 位最精确 (文件也最大)</p></li>
</ul>

<h2>输出说明</h2>
<ul>
<li><p>导出的 SVG 带 <code>viewBox</code>, 可以任意缩放、直接用 CSS 设定宽高, 不会像位图那样放大发虚</p></li>
<li><p>矢量化的代价是<b>文件可能变大</b>: 照片类素材转换后体积通常是原图的百分之几十到数倍 (统计里的"体积对比"就是给你看这个)。这时可以调小颜色精度 / 调大斑点过滤, 或改用多边形拟合</p></li>
<li><p>像素图的透明区域会被当作"无内容"处理, 不会输出多余色块</p></li>
<li><p>引擎是 <b>VTracer</b> (Rust 编写, 编译成 WebAssembly), 与 VTracer 官网在线版同一套算法与参数</p></li>
</ul>

<h2>说明</h2>
<ul>
<li><p>所有计算都在本机浏览器 (或桌面端 WebView) 里完成, 图片不会上传到任何服务器</p></li>
<li><p>矢量化是<b>有损重绘</b>: 结果由一块块色块拼成, 不可能与像素级完全一致; 但换来的是无损缩放与可编辑的路径</p></li>
<li><p>想要"黑白但仍保留明暗层次", 先用「图片黑白化」处理灰度, 再拿结果来矢量化; 想要"只有黑块"直接用这里的黑白二值模式</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>把<b>點陣圖</b> (PNG / JPG / GIF / WebP / BMP) 描線成<b>向量 SVG</b>: 每一塊相近的顏色被合併成一個色塊, 色塊的輪廓被擬合成平滑曲線或多邊形。放大不會糊、列印不虛、體積往往比原圖小, 適合把 Logo、圖示、線稿、掃描件、像素畫變成可繼續編輯的向量圖。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>點擊「選擇圖片」或把圖片拖進虛線框 (全程本機處理, 圖片不會上傳)</p></li>
<li><p>先選「預設」: 照片 / 扁平插畫 / 海報色塊 / 線稿手繪 / 印章文字 / 像素風。預設只是把下面幾項參數換成推薦值, 之後仍可逐項微調</p></li>
<li><p>「處理尺寸」一般保持 <b>1024 px</b> 即可: 向量圖放大不會糊, 先縮小再描線能快好幾倍。原圖很小 (圖示、像素畫) 時選「原尺寸」, 需要極致細節時選 2048 px</p></li>
<li><p>看結果預覽與統計 (路徑數量 / SVG 體積 / 體積對比 / 耗時), 不滿意就接著調參數, 預覽會自動更新</p></li>
<li><p>點「儲存 SVG」匯出為 <code>原名_vector.svg</code>; 想直接拿去用可以點「複製 SVG」, 或展開原始碼手動複製</p></li>
</ul>

<h2>顏色模式與曲線擬合</h2>
<ul>
<li><p><b>彩色</b>: VTracer 會把顏色相近的像素聚成一層層色塊, 依「疊加」或「鏤空」輸出。照片、插畫、複雜圖示用這個模式</p></li>
<li><p><b>黑白二值</b>: 只判定「亮還是暗」, 輸出純黑的色塊。適合線稿、印章、掃描件、只有單色的文字 logo。為了讓判定符合直覺, 二值模式會先把像素轉成灰階再比較</p></li>
<li><p><b>平滑曲線 (spline)</b>: 用貝茲曲線貼合邊緣, 最像原圖</p></li>
<li><p><b>直線多邊形 (polygon)</b>: 只用直線段, 形狀規整、檔案更小, 適合建築圖、圖表、印章</p></li>
<li><p><b>像素方塊 (pixel)</b>: 不做曲線擬合, 每個像素塊一個方塊, 用來把像素畫 / 復古遊戲素材轉成 SVG</p></li>
<li><p><b>疊加 / 鏤空</b>: 疊加是上層覆蓋下層 (檔案小, 是 VTracer 的預設策略); 鏤空讓每塊互不重疊 (便於在 Illustrator / Figma 裡逐塊改色)</p></li>
</ul>

<h2>參數怎麼調</h2>
<ul>
<li><p><b>斑點過濾</b>: 最常見的「去噪」開關。掃描件的小黑點、JPEG 的雜色都會變成碎塊, 調大 (8~16) 就能把它們併掉</p></li>
<li><p><b>顏色精度</b>: 越大保留的相近色越多、色塊越細; 調小會讓相近色合併成整塊 (做成扁平風格)</p></li>
<li><p><b>層間色差</b>: 相鄰兩層的色差閾值, 調大併層更狠 (層數更少、色帶更明顯), 調小則保留更多漸層層次</p></li>
<li><p><b>稜角閾值 / 拼接閾值</b>: 前者決定多尖的角才被當成角保留, 後者決定轉折處圓不圓。想要「硬朗」就調大稜角閾值、調小拼接閾值</p></li>
<li><p><b>曲線細分長度 / 平滑迭代</b>: 兩個「順滑度」參數, 調大更圓潤但細節更少、耗時更長</p></li>
<li><p><b>座標精度</b>: 路徑座標保留幾位小數。2 位足夠網頁使用, 8 位最精確 (檔案也最大)</p></li>
</ul>

<h2>輸出說明</h2>
<ul>
<li><p>匯出的 SVG 帶 <code>viewBox</code>, 可以任意縮放、直接用 CSS 設定寬高, 不會像點陣圖那樣放大發虛</p></li>
<li><p>向量化的代價是<b>檔案可能變大</b>: 照片類素材轉換後體積通常是原圖的百分之幾十到數倍 (統計裡的「體積對比」就是給你看這個)。這時可以調小顏色精度 / 調大斑點過濾, 或改用多邊形擬合</p></li>
<li><p>像素圖的透明區域會被當作「無內容」處理, 不會輸出多餘色塊</p></li>
<li><p>引擎是 <b>VTracer</b> (Rust 撰寫, 編譯成 WebAssembly), 與 VTracer 官網線上版同一套演算法與參數</p></li>
</ul>

<h2>說明</h2>
<ul>
<li><p>所有計算都在本機瀏覽器 (或桌面端 WebView) 裡完成, 圖片不會上傳到任何伺服器</p></li>
<li><p>向量化是<b>有損重繪</b>: 結果由一塊塊色塊拼成, 不可能與像素級完全一致; 但換來的是無損縮放與可編輯的路徑</p></li>
<li><p>想要「黑白但仍保留明暗層次」, 先用「圖片黑白化」處理灰階, 再拿結果來向量化; 想要「只有黑塊」直接用這裡的黑白二值模式</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Turns a <b>raster image</b> (PNG / JPG / GIF / WebP / BMP) into a <b>vector SVG</b>: similar colors are merged into shapes and each outline is fitted with smooth curves or polygons. The result scales and prints without blurring and is often smaller than the original — ideal for logos, icons, line art, scans and pixel art you want to keep editing.</p></blockquote>

<h2>Steps</h2>
<ul>
<li><p>Click "Choose image", or drop an image onto the dashed area (everything runs locally, nothing is uploaded)</p></li>
<li><p>Start with a "Preset": Photo / Flat illustration / Poster / Line art / Stamp &amp; text / Pixel art. A preset only swaps the parameters below for recommended values — you can still fine-tune every one of them</p></li>
<li><p>Leave "Trace size" at <b>1024 px</b>: vector output is resolution independent, and tracing a smaller copy is several times faster. Pick "Original" for tiny sources (icons, pixel art) or 2048 px when you need maximum detail</p></li>
<li><p>Check the preview and the stats (paths, SVG size, size vs. original, time taken). Keep tweaking — the preview refreshes automatically</p></li>
<li><p>Click "Save SVG" to export <code>name_vector.svg</code>, or "Copy SVG" to put the markup straight on the clipboard; you can also expand the source and copy it manually</p></li>
</ul>

<h2>Color mode and curve fitting</h2>
<ul>
<li><p><b>Color</b>: VTracer clusters similar colors into stacked layers and emits them either "stacked" or "cutout". Use it for photos, illustrations and detailed icons</p></li>
<li><p><b>Black &amp; white</b>: only decides light vs. dark and outputs pure black shapes — good for line art, stamps, scans and single-color lettering. The pixels are converted to grayscale first so the decision matches what you see</p></li>
<li><p><b>Smooth curves (spline)</b>: fits Bézier curves to the edges, closest to the original</p></li>
<li><p><b>Polygons</b>: straight segments only — tidy shapes and smaller files, good for plans, charts and stamps</p></li>
<li><p><b>Pixels</b>: no curve fitting at all, one square per pixel block, for turning pixel art / retro game sprites into SVG</p></li>
<li><p><b>Stacked / Cutout</b>: stacked layers cover the ones below (smaller files, VTracer's default); cutout shapes never overlap, which makes them easy to recolor one by one in Illustrator or Figma</p></li>
</ul>

<h2>Tuning the parameters</h2>
<ul>
<li><p><b>Speckle filter</b>: the everyday de-noise knob. Scanner dust and JPEG artifacts turn into tiny blobs — raise it (8–16) and they get merged away</p></li>
<li><p><b>Color precision</b>: higher keeps more similar colors and finer shapes; lower merges them into larger flat areas</p></li>
<li><p><b>Layer difference</b>: the color-difference threshold between neighboring layers; larger merges more (fewer bands), smaller keeps more gradient steps</p></li>
<li><p><b>Corner / splice threshold</b>: the first decides how sharp an angle must be to stay a corner, the second how round the turns become. For crisper output raise the corner threshold and lower the splice threshold</p></li>
<li><p><b>Segment length / smoothing iterations</b>: the two smoothness knobs — larger is rounder but loses detail and takes longer</p></li>
<li><p><b>Coordinate precision</b>: decimal places kept in path coordinates. 2 is plenty for the web, 8 is the most precise (and the largest file)</p></li>
</ul>

<h2>Output</h2>
<ul>
<li><p>The exported SVG carries a <code>viewBox</code>, so it scales to any size and can be sized from CSS without blurring</p></li>
<li><p>The trade-off is that <b>the file can get larger</b>: photos often come out at tens of percent to a few times the original ("Size vs. original" in the stats shows exactly that). If so, lower the color precision, raise the speckle filter or switch to polygon fitting</p></li>
<li><p>Transparent areas are treated as "no content" and produce no extra shapes</p></li>
<li><p>The engine is <b>VTracer</b> (written in Rust, compiled to WebAssembly) — the same algorithm and parameters as the official VTracer web app</p></li>
</ul>

<h2>Notes</h2>
<ul>
<li><p>Everything happens in the local browser (or desktop WebView); the image is never uploaded anywhere</p></li>
<li><p>Vectorizing is a <b>lossy redraw</b>: the result is built from shapes and will never match pixel for pixel, but you gain lossless scaling and editable paths</p></li>
<li><p>If you want black &amp; white while keeping the tonal detail, run the image through "Image Black &amp; White" first and vectorize the grayscale result; for pure black shapes use the black &amp; white mode here</p></li>
</ul>`;

const ImageToSvgIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default ImageToSvgIntro;
