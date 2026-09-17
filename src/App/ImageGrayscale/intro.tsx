import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>把彩色图片变成<b>黑白</b>: 一种是<b>灰度</b> (保留全部明暗层次, 像老照片), 另一种是<b>黑白二值</b> (只剩纯黑与纯白, 像复印件 / 扫描件)。灰度提供 4 种算法 (亮度 / 平均 / 最大值 / 最小值), 二值化支持 <b>Otsu 自动阈值</b>与手动阈值, 右侧即时预览。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>点击「选择图片」, 或把图片直接拖到虚线框内 (图片只在浏览器本地处理, 不会上传)</p></li>
<li><p>先选「处理方式」: <b>灰度</b> 保留层次, 适合照片 / 图表 / 需要再看细节的场景; <b>黑白二值</b> 只有黑白两色, 适合做线稿、印章、扫描件、位图风格</p></li>
<li><p>需要时切换「灰度算法」: 默认<b>亮度</b>与人眼观感一致; <b>最大值 / 最小值</b> 会让结果整体偏亮 / 偏暗, 用来把浅色或深色内容拉开</p></li>
<li><p>选了「黑白二值」后选「阈值方式」: <b>自动 (Otsu)</b> 会按图像直方图自动取分割点并显示当前阈值; <b>手动</b> 可拖滑块 (0~255) 微调, 找到最合适的分割位置</p></li>
<li><p>选择输出格式与质量, 点「保存」导出, 文件名形如 <code>原名_grayscale.png</code> / <code>原名_blackwhite.png</code> (不会覆盖原图)</p></li>
</ul>

<h2>4 种灰度算法</h2>
<ul>
<li><p><b>亮度 (Rec.709)</b>: <code>0.2126R + 0.7152G + 0.0722B</code>。绿色权重最高、蓝色最低, 因为人眼对绿色最敏感。这也是 CSS <code>filter: grayscale(1)</code> 与多数图像库的做法, 通常是最自然的选择</p></li>
<li><p><b>平均</b>: <code>(R + G + B) / 3</code>。计算最简单, 但对绿色偏多的自然风景会显得比人眼看到的更暗</p></li>
<li><p><b>最大值</b>: 取三个通道中最亮的。整体偏亮, 适合把浅色文字 / 浅色线条"化开"后看清轮廓</p></li>
<li><p><b>最小值</b>: 取三个通道中最暗的。整体偏暗, 适合保留深色轮廓, 会让彩色噪点更明显</p></li>
</ul>

<h2>二值化与 Otsu 自动阈值</h2>
<ul>
<li><p>二值化的规则很简单: 灰度值<b>大于</b>阈值的像素写纯白 (255), 其余写纯黑 (0)。因此阈值 128 时, 128 属于黑</p></li>
<li><p><b>Otsu (最大类间方差法)</b> 会把 0~255 的每个灰度都当作候选阈值试一遍, 选出"前景 / 背景两类之间差别最大"的那个。它不需要人工干预, 对光照均匀的文档扫描件效果很好</p></li>
<li><p>如果自动结果不理想 (例如纸张有阴影、背景有渐变), 切到「手动」再微调: 调低阈值会留下更多黑色, 调高则留下更少黑色</p></li>
<li><p>二值化后建议用 PNG 输出: JPEG 的有损压缩会在黑白交界处生成灰色噪点 (蚊噪), 破坏"纯黑白"的效果</p></li>
</ul>

<h2>输出说明</h2>
<ul>
<li><p>结果尺寸与原图完全一致, 不会缩放也不会裁剪</p></li>
<li><p>透明度 (α 通道) 不会被改动: 透明的地方仍然透明; 但输出 JPEG / WebP 时会先铺白底 (这两种格式没有透明通道)</p></li>
<li><p>「结果体积」按导出后的编码数据估算, 便于对比不同格式的压缩效果</p></li>
</ul>

<h2>说明</h2>
<ul>
<li><p>全部处理都在本地浏览器 (或桌面端 WebView) 内完成, 图片不会上传到任何服务器</p></li>
<li><p>灰度是<b>可逆</b>的明暗信息提取: 黑白化后无法恢复原色, 但灰度值本身保存了每个像素的明暗, 缩小、打印、传真都不会丢结构</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>把彩色圖片變成<b>黑白</b>: 一種是<b>灰階</b> (保留全部明暗層次, 像老照片), 另一種是<b>黑白二值</b> (只剩純黑與純白, 像影印件 / 掃描件)。灰階提供 4 種演算法 (亮度 / 平均 / 最大值 / 最小值), 二值化支援 <b>Otsu 自動閾值</b>與手動閾值, 右側即時預覽。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>點擊「選擇圖片」, 或把圖片直接拖到虛線框內 (圖片只在本機瀏覽器處理, 不會上傳)</p></li>
<li><p>先選「處理方式」: <b>灰階</b> 保留層次, 適合照片 / 圖表 / 需要再看細節的場景; <b>黑白二值</b> 只有黑白兩色, 適合做線稿、印章、掃描件、位圖風格</p></li>
<li><p>需要時切換「灰階演算法」: 預設<b>亮度</b>與人眼觀感一致; <b>最大值 / 最小值</b> 會讓結果整體偏亮 / 偏暗, 用來把淺色或深色內容拉開</p></li>
<li><p>選了「黑白二值」後選「閾值方式」: <b>自動 (Otsu)</b> 會依影像直方圖自動取分割點並顯示目前閾值; <b>手動</b> 可拖滑桿 (0~255) 微調, 找到最合適的分割位置</p></li>
<li><p>選擇輸出格式與品質, 點「儲存」匯出, 檔案名形如 <code>原名_grayscale.png</code> / <code>原名_blackwhite.png</code> (不會覆蓋原圖)</p></li>
</ul>

<h2>4 種灰階演算法</h2>
<ul>
<li><p><b>亮度 (Rec.709)</b>: <code>0.2126R + 0.7152G + 0.0722B</code>。綠色權重最高、藍色最低, 因為人眼對綠色最敏感。這也是 CSS <code>filter: grayscale(1)</code> 與多數影像庫的做法, 通常是最自然的選擇</p></li>
<li><p><b>平均</b>: <code>(R + G + B) / 3</code>。計算最簡單, 但對綠色偏多的自然風景會顯得比人眼看到的更暗</p></li>
<li><p><b>最大值</b>: 取三個通道中最亮的。整體偏亮, 適合把淺色文字 / 淺色線條「化開」後看清輪廓</p></li>
<li><p><b>最小值</b>: 取三個通道中最暗的。整體偏暗, 適合保留深色輪廓, 會讓彩色雜訊更明顯</p></li>
</ul>

<h2>二值化與 Otsu 自動閾值</h2>
<ul>
<li><p>二值化的規則很簡單: 灰階值<b>大於</b>閾值的像素寫純白 (255), 其餘寫純黑 (0)。因此閾值 128 時, 128 屬於黑</p></li>
<li><p><b>Otsu (最大類間變異法)</b> 會把 0~255 的每個灰階都當作候選閾值試一遍, 選出「前景 / 背景兩類之間差別最大」的那個。它不需要人工干預, 對光照均勻的文件掃描件效果很好</p></li>
<li><p>如果自動結果不理想 (例如紙張有陰影、背景有漸層), 切到「手動」再微調: 調低閾值會留下更多黑色, 調高則留下更少黑色</p></li>
<li><p>二值化後建議用 PNG 輸出: JPEG 的有損壓縮會在黑白交界處生成灰色雜訊 (蚊噪), 破壞「純黑白」的效果</p></li>
</ul>

<h2>輸出說明</h2>
<ul>
<li><p>結果尺寸與原圖完全一致, 不會縮放也不會裁剪</p></li>
<li><p>透明度 (α 通道) 不會被改動: 透明的地方仍然透明; 但輸出 JPEG / WebP 時會先鋪白底 (這兩種格式沒有透明通道)</p></li>
<li><p>「結果體積」按匯出後的編碼資料估算, 便於對比不同格式的壓縮效果</p></li>
</ul>

<h2>說明</h2>
<ul>
<li><p>全部處理都在本機瀏覽器 (或桌面端 WebView) 內完成, 圖片不會上傳到任何伺服器</p></li>
<li><p>灰階是<b>可逆</b>的明暗資訊提取: 黑白化後無法恢復原色, 但灰階值本身保存了每個像素的明暗, 縮小、列印、傳真都不會丟結構</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Turns a color image into <b>black &amp; white</b>: either <b>grayscale</b> (all tonal detail preserved, like an old photograph) or <b>binary black &amp; white</b> (pure black and pure white only, like a photocopy). Grayscale offers 4 methods (luminance / average / maximum / minimum), and binarizing supports an <b>automatic Otsu threshold</b> as well as a manual one, with a live preview.</p></blockquote>

<h2>Steps</h2>
<ul>
<li><p>Click "Choose image", or drop an image onto the dashed area (everything runs locally, nothing is uploaded)</p></li>
<li><p>Pick the "Mode": <b>Grayscale</b> keeps the tones and suits photos, charts and anything you still want to read; <b>Black &amp; white</b> keeps only two colors and suits line art, stamps, scans and bitmap-style output</p></li>
<li><p>If needed, switch the "Grayscale method": the default <b>Luminance</b> matches human perception, while <b>Maximum / Minimum</b> make the result lighter / darker to pull faint or dark content apart</p></li>
<li><p>In black &amp; white mode pick the "Threshold mode": <b>Automatic (Otsu)</b> derives the split from the image histogram and shows the value it used, while <b>Manual</b> lets you drag a 0–255 slider to fine-tune the cut-off</p></li>
<li><p>Choose the output format and quality, then click "Save"; files are named <code>name_grayscale.png</code> / <code>name_blackwhite.png</code> (the original is never overwritten)</p></li>
</ul>

<h2>The 4 grayscale methods</h2>
<ul>
<li><p><b>Luminance (Rec.709)</b>: <code>0.2126R + 0.7152G + 0.0722B</code>. Green weighs the most and blue the least because the eye is most sensitive to green. This is what CSS <code>filter: grayscale(1)</code> and most image libraries do, and it usually looks the most natural</p></li>
<li><p><b>Average</b>: <code>(R + G + B) / 3</code>. The simplest to compute, but green-heavy landscapes end up darker than the eye perceives them</p></li>
<li><p><b>Maximum</b>: takes the brightest channel, so the result is lighter overall — handy for pulling faint text or thin light lines apart</p></li>
<li><p><b>Minimum</b>: takes the darkest channel, so the result is darker overall — good for preserving dark outlines, though it amplifies color noise</p></li>
</ul>

<h2>Binarizing and the Otsu threshold</h2>
<ul>
<li><p>The rule is simple: pixels whose gray value is <b>greater than</b> the threshold become pure white (255), everything else pure black (0). With a threshold of 128, the value 128 is therefore black</p></li>
<li><p><b>Otsu's method</b> (maximizing between-class variance) tries every gray level from 0 to 255 and keeps the one that separates the two classes best. It needs no tuning and works very well on evenly lit document scans</p></li>
<li><p>If the automatic result is poor (shadows on the paper, a gradient background), switch to "Manual": lowering the threshold keeps more black, raising it keeps less</p></li>
<li><p>After binarizing, prefer PNG output: JPEG's lossy compression creates gray mosquito noise along black/white edges and ruins the pure two-tone look</p></li>
</ul>

<h2>Output</h2>
<ul>
<li><p>The result keeps the exact original dimensions; nothing is scaled or cropped</p></li>
<li><p>The alpha channel is left untouched (transparent areas stay transparent), but JPEG / WebP output is painted on white first since those formats have no alpha channel</p></li>
<li><p>"Result size on disk" is estimated from the encoded output so you can compare formats</p></li>
</ul>

<h2>Notes</h2>
<ul>
<li><p>Everything happens in the local browser (or desktop WebView); the image is never uploaded anywhere</p></li>
<li><p>Grayscale is a faithful extraction of brightness, but the original colors cannot be recovered from a black &amp; white image; the gray values still survive scaling, printing and faxing without losing structure</p></li>
</ul>`;

const ImageGrayscaleIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default ImageGrayscaleIntro;
