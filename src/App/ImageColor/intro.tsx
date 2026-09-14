import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>读取图片中的每一个像素, 统计每种颜色出现的次数, 把 <b>相近的颜色合并</b> 成色系, 再按 <b>占比从高到低</b> 列出图片使用到的颜色与占比。可用来提取配色方案、检查画面色调、为设计稿取色。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>点击「选择图片」, 或把图片直接拖到虚线框内 (图片只在浏览器本地解析, 不会上传)</p></li>
<li><p>用「相似度级别」调整合并力度, 用「输出颜色数」控制列表长度, 结果会立即重算</p></li>
<li><p>点击色块复制单个 HEX, 或「复制全部」拿到 HEX + rgb + 占比 + 像素数的清单</p></li>
<li><p>「下载 CSV」导出表格数据, 「下载色卡 PNG」导出色卡图 (带占比条与色值标注)</p></li>
</ul>

<h2>相似度级别</h2>
<ul>
<li><p>级别 1-10, 默认为 4; <b>级别越高, 允许被合并的颜色差异越大</b>, 得到的颜色数越少</p></li>
<li><p>合并使用切比雪夫距离 (RGB 三个通道差值中的最大值), 阈值随级别从 8 递增到 80</p></li>
<li><p>先按色阶桶把相近像素归组, 再对色组做一次「就近合并」: 差异在阈值内的颜色并成一个色系</p></li>
<li><p>合并后的代表色取该色系内像素的 <b>加权平均</b>, 因此比单纯取桶中心更接近肉眼观感</p></li>
<li><p>取消勾选「合并相似颜色」后不再合并, 只列出占比最高的 N 种 <b>精确颜色</b></p></li>
</ul>

<h2>占比与统计</h2>
<ul>
<li><p><b>占比</b> = 该颜色像素数 ÷ 参与统计的像素总数, 相加为 100% (取消合并时可能小于 100%)</p></li>
<li><p><b>原始颜色</b> 是合并前的颜色种数, <b>合并后颜色</b> 是当前列表的条数</p></li>
<li><p>默认忽略透明像素 (α ≤ 16), 阈值可调; 关闭后透明像素的颜色也会参与统计</p></li>
<li><p>超大图会等比缩小到最长边 1024 px 再分析, 占比结果与全尺寸基本一致, 但速度更快、内存更省</p></li>
</ul>

<h2>说明</h2>
<ul>
<li><p>支持浏览器可解码的格式: PNG / JPG / GIF / WebP / BMP 等; GIF 只取第一帧</p></li>
<li><p>图片不会离开本机: 解析、统计、导出全部在浏览器内完成</p></li>
<li><p>色卡 PNG 中色块上的文字会自动选黑或白, 保证可读</p></li>
<li><p>半透明像素按叠加在白底上的观感参与统计, 若需要严格结果请先在其它工具中做扁平化处理</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>讀取圖片中的每一個像素, 統計每種顏色出現的次數, 把 <b>相近的顏色合併</b> 成色系, 再依 <b>佔比由高到低</b> 列出圖片使用到的顏色與佔比。可用來提取配色方案、檢查畫面色調、為設計稿取色。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>點擊「選擇圖片」, 或把圖片直接拖到虛線框內 (圖片只在瀏覽器本地解析, 不會上傳)</p></li>
<li><p>用「相似度級別」調整合併力度, 用「輸出顏色數」控制列表長度, 結果會立即重算</p></li>
<li><p>點擊色塊複製單個 HEX, 或「複製全部」取得 HEX + rgb + 佔比 + 像素數的清單</p></li>
<li><p>「下載 CSV」匯出表格資料, 「下載色卡 PNG」匯出色卡圖 (含佔比條與色值標註)</p></li>
</ul>

<h2>相似度級別</h2>
<ul>
<li><p>級別 1-10, 預設為 4; <b>級別越高, 允許被合併的顏色差異越大</b>, 得到的顏色數越少</p></li>
<li><p>合併使用切比雪夫距離 (RGB 三個通道差值中的最大值), 閾值隨級別從 8 遞增到 80</p></li>
<li><p>先依色階桶把相近像素歸組, 再對色組做一次「就近合併」: 差異在閾值內的顏色併成一個色系</p></li>
<li><p>合併後的代表色取該色系內像素的 <b>加權平均</b>, 因此比單純取桶中心更接近肉眼觀感</p></li>
<li><p>取消勾選「合併相似顏色」後不再合併, 只列出佔比最高的 N 種 <b>精確顏色</b></p></li>
</ul>

<h2>佔比與統計</h2>
<ul>
<li><p><b>佔比</b> = 該顏色像素數 ÷ 參與統計的像素總數, 相加為 100% (取消合併時可能小於 100%)</p></li>
<li><p><b>原始顏色</b> 是合併前的顏色種數, <b>合併後顏色</b> 是目前列表的筆數</p></li>
<li><p>預設忽略透明像素 (α ≤ 16), 閾值可調; 關閉後透明像素的顏色也會參與統計</p></li>
<li><p>超大圖會等比縮小到最長邊 1024 px 再分析, 佔比結果與全尺寸基本一致, 但速度更快、記憶體更省</p></li>
</ul>

<h2>說明</h2>
<ul>
<li><p>支援瀏覽器可解碼的格式: PNG / JPG / GIF / WebP / BMP 等; GIF 只取第一格</p></li>
<li><p>圖片不會離開本機: 解析、統計、匯出全部在瀏覽器內完成</p></li>
<li><p>色卡 PNG 中色塊上的文字會自動選黑或白, 保證可讀</p></li>
<li><p>半透明像素依疊在白底上的觀感參與統計, 若需要嚴格結果請先在其它工具中做扁平化處理</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>It reads every pixel of an image, counts how often each color occurs, <b>merges similar colors</b> into color families and lists the colors used by the image together with their share, from the largest to the smallest. Handy for extracting a palette, checking the overall tone of a picture or picking colors for a design.</p></blockquote>

<h2>How to use</h2>
<ul>
<li><p>Click "Choose image" or drop an image onto the dashed area (decoding happens locally in your browser, nothing is uploaded)</p></li>
<li><p>Tune the merging strength with Similarity level and the list length with Colors to show; results are recomputed immediately</p></li>
<li><p>Click a swatch to copy a single HEX value, or use "Copy all" for a list of HEX + rgb + share + pixels</p></li>
<li><p>"Download CSV" exports the raw table; "Download swatch PNG" exports a color card with a proportion bar and labels</p></li>
</ul>

<h2>Similarity level</h2>
<ul>
<li><p>Levels 1–10, default 4; <b>the higher the level, the more different colors may be merged</b>, so fewer colors remain</p></li>
<li><p>Merging uses the Chebyshev distance (the largest per-channel RGB difference); the threshold grows from 8 to 80 with the level</p></li>
<li><p>Pixels are first grouped into color buckets and then merged to the nearest family when they are within the threshold</p></li>
<li><p>The representative color of a family is the <b>count-weighted average</b> of its pixels, which matches the eye better than a bucket center</p></li>
<li><p>Uncheck "Merge similar colors" to skip merging and list the N most frequent <b>exact colors</b> only</p></li>
</ul>

<h2>Share and statistics</h2>
<ul>
<li><p><b>Share</b> = pixels of that color ÷ counted pixels; the values add up to 100% (less when merging is disabled)</p></li>
<li><p><b>Raw colors</b> is the number of colors before merging, <b>Merged colors</b> is the current list length</p></li>
<li><p>Transparent pixels (α ≤ 16) are ignored by default and the threshold is adjustable; turn it off to include them</p></li>
<li><p>Very large images are scaled down to a 1024 px longest edge before analysis — the shares stay close to the full-size result while using far less memory</p></li>
</ul>

<h2>Notes</h2>
<ul>
<li><p>Any format your browser can decode: PNG / JPG / GIF / WebP / BMP; for GIF only the first frame is used</p></li>
<li><p>The image never leaves your machine — decoding, counting and exporting all happen in the browser</p></li>
<li><p>Text drawn on the swatch PNG automatically switches between black and white to stay readable</p></li>
<li><p>Semi-transparent pixels are counted as they appear over a white background; flatten the image elsewhere first if you need strict results</p></li>
</ul>`;

const Intro = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
}

export default Intro;
