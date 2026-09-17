import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>把鼠标移到图片上, 用<b>放大镜</b>看清单个像素, 点击即可读出该点的颜色, 并给出 <b>HEX / RGB / HSL</b> 三种写法 (点右侧图标即可复制)。取过的颜色会进入「最近取色」, 方便回头对比。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>点击「选择图片」, 或把图片直接拖到虚线框内 (图片只在浏览器本地处理, 不会上传)</p></li>
<li><p>把鼠标移到图片上: 右侧会出现<b>悬停预览</b>放大镜, 标红框的那一格就是要取的颜色; 同时显示像素坐标 (x, y) 与色值</p></li>
<li><p>需要更精细时可切换「放大倍数」(4× / 8× / 16×): 放大镜用最近邻方式放大, 不会做插值, 所以每个方格就是原来的一个像素</p></li>
<li><p>在图片上<b>点击</b>即可取色: 右下「当前颜色」显示 HEX / RGB / HSL 三种写法, 点每种写法右侧的复制图标就能复制走; 取过的颜色会以色块形式进入「最近取色」</p></li>
<li><p>「最近取色」里的色块可以再次点击选回该颜色 (最多保留 12 条, 重复的颜色只会占一个位置); 点「清空历史」可以清掉</p></li>
<li><p>图片过大时左侧区域会出现滚动条 (画布按原图 1:1 像素显示), 这样鼠标位置与像素坐标永远一一对应</p></li>
</ul>

<h2>HEX / RGB / HSL 三种写法怎么用</h2>
<ul>
<li><p><b>HEX</b> (如 <code>#3A7BD5</code>): 网页 CSS、设计稿与大多数取色工具通用的写法, 每两位分别代表红、绿、蓝</p></li>
<li><p><b>RGB</b> (如 <code>rgb(58, 123, 213)</code>): 每个通道 0~255, 适合在代码里做计算或拼字符串</p></li>
<li><p><b>HSL</b> (如 <code>hsl(214, 65%, 53%)</code>): 色相 0~360 / 饱和度 0~100% / 亮度 0~100%。做主题色时最好用: 固定色相与饱和度、只改亮度就能得到同色系的深浅色阶</p></li>
<li><p>三种写法都<b>不包含透明度</b>: 取色以屏幕观感为准, 半透明像素会显示它下面已经混合好的颜色。如果需要透明信息, 请用支持 α 通道的取色工具</p></li>
</ul>

<h2>取色的准确度</h2>
<ul>
<li><p>取到的就是<b>图片像素本身的值</b> (canvas 读出的原始数据), 不经过任何压缩或四舍五入, 因此与设计稿里的色值可以精确对上</p></li>
<li><p>但屏幕上看颜色还会受<b>色彩管理</b>影响: 若图片带 ICC / Display P3 等色彩空间信息, 浏览器可能把它转换到 sRGB 再显示, 这时"看起来的颜色"与"取到的数值"会有差异。需要严格一致的场景请以原始文件里的数值为准</p></li>
<li><p>缩放过的图片要特别小心<b>抗锯齿</b>: 边缘像素是插值出来的过渡色, 取到的可能既不是前景色也不是背景色。想取纯色请对准色块的中心区域</p></li>
<li><p>JPEG 的压缩噪点也会让同一片"纯色"出现细微差别, 取色时建议多点几个位置对比</p></li>
</ul>

<h2>说明</h2>
<ul>
<li><p>全部处理都在本地浏览器 (或桌面端 WebView) 内完成, 图片不会上传到任何服务器</p></li>
<li><p>取色结果只用于复制与对比, 本工具不会生成新的图片文件</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>把滑鼠移到圖片上, 用<b>放大鏡</b>看清單個像素, 點擊即可讀出該點的顏色, 並給出 <b>HEX / RGB / HSL</b> 三種寫法 (點右側圖示即可複製)。取過的顏色會進入「最近取色」, 方便回頭對比。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>點擊「選擇圖片」, 或把圖片直接拖到虛線框內 (圖片只在本機瀏覽器處理, 不會上傳)</p></li>
<li><p>把滑鼠移到圖片上: 右側會出現<b>懸停預覽</b>放大鏡, 標紅框的那一格就是要取的顏色; 同時顯示像素座標 (x, y) 與色值</p></li>
<li><p>需要更精細時可切換「放大倍數」(4× / 8× / 16×): 放大鏡用最近鄰方式放大, 不會做插值, 所以每個方格就是原來的一個像素</p></li>
<li><p>在圖片上<b>點擊</b>即可取色: 右下「目前顏色」顯示 HEX / RGB / HSL 三種寫法, 點每種寫法右側的複製圖示就能複製走; 取過的顏色會以色塊形式進入「最近取色」</p></li>
<li><p>「最近取色」裡的色塊可以再次點擊選回該顏色 (最多保留 12 條, 重複的顏色只會佔一個位置); 點「清空歷史」可以清掉</p></li>
<li><p>圖片過大時左側區域會出現捲軸 (畫布按原圖 1:1 像素顯示), 這樣滑鼠位置與像素座標永遠一一對應</p></li>
</ul>

<h2>HEX / RGB / HSL 三種寫法怎麼用</h2>
<ul>
<li><p><b>HEX</b> (如 <code>#3A7BD5</code>): 網頁 CSS、設計稿與大多數取色工具通用的寫法, 每兩位分別代表紅、綠、藍</p></li>
<li><p><b>RGB</b> (如 <code>rgb(58, 123, 213)</code>): 每個通道 0~255, 適合在程式碼裡做計算或拼字串</p></li>
<li><p><b>HSL</b> (如 <code>hsl(214, 65%, 53%)</code>): 色相 0~360 / 飽和度 0~100% / 亮度 0~100%。做主題色時最好用: 固定色相與飽和度、只改亮度就能得到同色系的深淺色階</p></li>
<li><p>三種寫法都<b>不包含透明度</b>: 取色以螢幕觀感為準, 半透明像素會顯示它下面已經混合好的顏色。如果需要透明資訊, 請用支援 α 通道的取色工具</p></li>
</ul>

<h2>取色的準確度</h2>
<ul>
<li><p>取到的就是<b>圖片像素本身的值</b> (canvas 讀出的原始資料), 不經過任何壓縮或四捨五入, 因此與設計稿裡的色值可以精確對上</p></li>
<li><p>但螢幕上看顏色還會受<b>色彩管理</b>影響: 若圖片帶 ICC / Display P3 等色彩空間資訊, 瀏覽器可能把它轉換到 sRGB 再顯示, 這時「看起來的顏色」與「取到的數值」會有差異。需要嚴格一致的場景請以原始檔案裡的數值為準</p></li>
<li><p>縮放過的圖片要特別小心<b>抗鋸齒</b>: 邊緣像素是插值出來的過渡色, 取到的可能既不是前景色也不是背景色。想取純色請對準色塊的中心區域</p></li>
<li><p>JPEG 的壓縮雜點也會讓同一片「純色」出現細微差別, 取色時建議多點幾個位置對比</p></li>
</ul>

<h2>說明</h2>
<ul>
<li><p>全部處理都在本機瀏覽器 (或桌面端 WebView) 內完成, 圖片不會上傳到任何伺服器</p></li>
<li><p>取色結果只用於複製與對比, 本工具不會生成新的圖片檔案</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Hover over an image to inspect single pixels through a <b>loupe</b>, then click to read that pixel's color as <b>HEX / RGB / HSL</b> (click the icon next to a value to copy it). Picked colors collect in "Recent colors" so you can compare them afterwards.</p></blockquote>

<h2>Steps</h2>
<ul>
<li><p>Click "Choose image", or drop an image onto the dashed area (everything runs locally, nothing is uploaded)</p></li>
<li><p>Move the pointer over the image: the <b>hover preview</b> loupe appears on the right with a red box around the pixel under the cursor, next to its coordinates (x, y) and color value</p></li>
<li><p>Switch the <b>zoom</b> (4× / 8× / 16×) for finer work: the loupe magnifies with nearest-neighbour scaling, so every square is exactly one original pixel</p></li>
<li><p><b>Click</b> the image to pick a color: "Current color" then shows HEX / RGB / HSL, each with a copy icon, and the color is added as a swatch under "Recent colors"</p></li>
<li><p>Clicking a swatch in "Recent colors" selects that color again (the most recent 12 are kept and duplicates only occupy one slot); "Clear history" empties the list</p></li>
<li><p>Very large images get a scrollbar on the left (the canvas is shown at a 1:1 pixel scale), which keeps the cursor position and pixel coordinates perfectly aligned</p></li>
</ul>

<h2>Which notation to use</h2>
<ul>
<li><p><b>HEX</b> (e.g. <code>#3A7BD5</code>): the notation shared by CSS, design files and most color tools — two digits each for red, green and blue</p></li>
<li><p><b>RGB</b> (e.g. <code>rgb(58, 123, 213)</code>): 0–255 per channel, handy for computing or concatenating strings in code</p></li>
<li><p><b>HSL</b> (e.g. <code>hsl(214, 65%, 53%)</code>): hue 0–360, saturation 0–100%, lightness 0–100%. Ideal for themes: keep hue and saturation fixed and vary lightness to get a whole tonal ramp</p></li>
<li><p>None of the three includes transparency: picking reflects what you see on screen, so a translucent pixel reports the color already blended with what is beneath it. Use an α-aware tool if you need opacity</p></li>
</ul>

<h2>Accuracy</h2>
<ul>
<li><p>You get the <b>pixel value itself</b> straight from the canvas without compression or rounding, so it matches design values exactly</p></li>
<li><p>What the screen shows is still subject to <b>color management</b>: if an image carries ICC / Display P3 metadata the browser may convert it to sRGB for display, so the perceived color can differ from the numeric value. When that matters, trust the numbers in the original file</p></li>
<li><p>Watch out for <b>anti-aliasing</b> in resized images: edge pixels are interpolated, so the picked color may be neither the foreground nor the background. Aim at the middle of a flat area to read a pure color</p></li>
<li><p>JPEG noise also makes a supposedly flat color vary slightly, so it helps to sample a few spots and compare</p></li>
</ul>

<h2>Notes</h2>
<ul>
<li><p>Everything happens in the local browser (or desktop WebView); the image is never uploaded anywhere</p></li>
<li><p>Picked colors are only for copying and comparing — this tool never produces a new image file</p></li>
</ul>`;

const ImageColorPickerIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default ImageColorPickerIntro;
