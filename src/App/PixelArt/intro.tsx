import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>把任意图片转成<b>像素风格</b>: 先把画面切成一个个正方形色块 (像素化), 再用<b>调色板</b>把每个色块换成最接近的颜色, 于是照片就变成了红白机 / 掌机时代的像素画。顶部三个<b>快捷配置</b>分别面向人像照片、游戏素材、抽象创作, 点一下就能套用一套推荐参数, 也可以自己微调。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>点击「选择图片」, 或把图片直接拖到虚线框内 (图片只在浏览器本地处理, 不会上传)</p></li>
<li><p>先点一个<b>快捷配置</b>: 「人像照片」像素大小 6~8、不开灰度、颜色较丰富的调色板; 「游戏素材」像素大小 8~12、选适合目标主机的经典主机调色板; 「抽象创作」像素大小 15~25、开灰度、关闭调色板</p></li>
<li><p>需要更细的控制时, 拖「<b>像素大小</b>」改色块边长 (2~48 px), 或用「<b>调色板</b>」下拉框换一套颜色; 手动改动后快捷配置会显示为「自定义」</p></li>
<li><p>选择输出格式与质量, 点「保存」导出, 文件名形如 <code>原名_pixelart.png</code> (不会覆盖原图)</p></li>
</ul>

<h2>三种快捷配置怎么选</h2>
<table>
<tr><th>快捷配置</th><th>像素大小</th><th>灰度</th><th>调色板</th><th>适合</th></tr>
<tr><td>人像照片</td><td>6~8</td><td>关</td><td>自适应 64 色 (颜色较丰富) + 抖动</td><td>头像、人像、宠物照: 保住肤色与五官层次</td></tr>
<tr><td>游戏素材</td><td>8~12</td><td>关</td><td>经典主机色表 (PICO-8 / NES / Game Boy / C64…)</td><td>精灵图、场景素材: 颜色少而干净, 方便跟着目标主机走</td></tr>
<tr><td>抽象创作</td><td>15~25</td><td>开</td><td>关闭 (保留原色, 只做像素化 + 灰度)</td><td>封面图、背景、海报: 大色块 + 黑白灰的高级感</td></tr>
</table>
<ul>
<li><p>「像素大小」是色块的边长: 6~12 px 时轮廓仍可辨认, 适合做头像与素材; 15 px 以上基本只剩下明暗与构成关系, 适合抽象风格</p></li>
<li><p>人像照片建议保留颜色并<b>打开抖动</b>, 因为 64 色要表现渐变必须靠抖动花纹补层次; 游戏素材建议<b>关闭抖动</b>, 让每个色块都是干净的纯色, 用引擎放大时不会出现噪点</p></li>
<li><p>抽象创作关闭调色板后, 颜色完全来自原图, 只是被"块化"并转成灰阶, 适合当排版底图</p></li>
</ul>

<h2>调色板怎么选</h2>
<ul>
<li><p><b>自适应 (16 / 32 / 64 / 256 色)</b>: 用中位切分算法从当前图片里挑出最有代表性的颜色, 颜色最丰富也最"像"原图, 是照片类的首选</p></li>
<li><p><b>PICO-8 (16 色)</b>: 现代像素游戏最常用的幻想主机色表, 颜色饱和、对比强, 做素材上手最快</p></li>
<li><p><b>NES 红白机 (55 色)</b>: 2C02 芯片实际可用的全部颜色, 自带 80 年代的怀旧滤镜</p></li>
<li><p><b>Game Boy DMG (4 色)</b>: 经典绿屏, 4 级明暗, 灰度题材的首选, 也最容易做出"掌机感"</p></li>
<li><p><b>Commodore 64 (16 色) / CGA IBM PC (16 色) / ZX Spectrum (15 色)</b>: 三套 8 位家用机 / 早期 PC 色表, 各有自己的年代味道</p></li>
<li><p><b>Sega Master System (RGB222, 64 色) / Mega Drive·Genesis (RGB333, 512 色) / SNES·SFC (RGB555, 32768 色)</b>: 不列色表, 直接按硬件位深量化 (每通道 2 / 3 / 5 位), 想贴近 16 位主机的发色能力时选它们</p></li>
</ul>

<h2>抖动 (Dither) 是做什么的</h2>
<ul>
<li><p>色板颜色少时, 单色色块之间会出现明显的"断层"。抖动用 <b>4×4 Bayer 有序抖动</b>把误差摊到相邻色块上, 用两种颜色的疏密混出中间色, 远看就像多了一层过渡</p></li>
<li><p>本工具的抖动在<b>色块网格上</b>进行, 每个色块内部仍然是纯色, 所以放大后看到的是规整的网格花纹, 而不是噪点</p></li>
<li><p>调色板选「关闭」时抖动不生效 (没有色板就不存在量化误差)</p></li>
</ul>

<h2>原理与说明</h2>
<ul>
<li><p>顺序是 <b>像素块平均 → 灰度 → 调色板量化 → 展开回原尺寸</b>。先平均再量化, 才能保证每个色块只用一个颜色; 反过来先量化再平均, 相邻色块的平均值会落在调色板之外, 出现脏色</p></li>
<li><p>色块颜色 = 块内像素按<b>透明度加权平均</b>, 所以带透明背景的 PNG (图标、贴纸) 边缘不会被透明像素染黑</p></li>
<li><p>结果<b>尺寸与原图完全一致</b>, 只是把画面切成了大色块; 需要更小的图片请再用「图片调整」工具缩放</p></li>
<li><p>α (透明度) 通道保持不变; 输出 JPEG / WebP 时会先铺白底</p></li>
<li><p>全部处理都在本地浏览器 (或桌面端 WebView) 内完成, 图片不会上传到任何服务器</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>把任意圖片轉成<b>像素風格</b>: 先把畫面切成一個個正方形色塊 (像素化), 再用<b>調色板</b>把每個色塊換成最接近的顏色, 於是照片就變成了紅白機 / 掌機時代的像素畫。頂部三個<b>快捷設定</b>分別對應人像照片、遊戲素材、抽象創作, 點一下就能套用一組建議參數, 也可以自己微調。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>點擊「選擇圖片」, 或把圖片直接拖到虛線框內 (圖片只在本機瀏覽器處理, 不會上傳)</p></li>
<li><p>先點一個<b>快捷設定</b>: 「人像照片」像素大小 6~8、不開灰階、顏色較豐富的調色板; 「遊戲素材」像素大小 8~12、選適合目標主機的經典主機調色板; 「抽象創作」像素大小 15~25、開灰階、關閉調色板</p></li>
<li><p>需要更細的控制時, 拖「<b>像素大小</b>」改色塊邊長 (2~48 px), 或用「<b>調色板</b>」下拉框換一組顏色; 手動改動後快捷設定會顯示為「自訂」</p></li>
<li><p>選擇輸出格式與品質, 點「儲存」匯出, 檔案名形如 <code>原名_pixelart.png</code> (不會覆蓋原圖)</p></li>
</ul>

<h2>三種快捷設定怎麼選</h2>
<table>
<tr><th>快捷設定</th><th>像素大小</th><th>灰階</th><th>調色板</th><th>適合</th></tr>
<tr><td>人像照片</td><td>6~8</td><td>關</td><td>自適應 64 色 (顏色較豐富) + 抖動</td><td>頭像、人像、寵物照: 保住膚色與五官層次</td></tr>
<tr><td>遊戲素材</td><td>8~12</td><td>關</td><td>經典主機色表 (PICO-8 / NES / Game Boy / C64…)</td><td>精靈圖、場景素材: 顏色少而乾淨, 方便跟著目標主機走</td></tr>
<tr><td>抽象創作</td><td>15~25</td><td>開</td><td>關閉 (保留原色, 只做像素化 + 灰階)</td><td>封面圖、背景、海報: 大色塊 + 黑白灰的高級感</td></tr>
</table>
<ul>
<li><p>「像素大小」是色塊的邊長: 6~12 px 時輪廓仍可辨認, 適合做頭像與素材; 15 px 以上基本只剩下明暗與構成關係, 適合抽象風格</p></li>
<li><p>人像照片建議保留顏色並<b>打開抖動</b>, 因為 64 色要表現漸層必須靠抖動花紋補層次; 遊戲素材建議<b>關閉抖動</b>, 讓每個色塊都是乾淨的純色, 用引擎放大時不會出現雜點</p></li>
<li><p>抽象創作關閉調色板後, 顏色完全來自原圖, 只是被「塊化」並轉成灰階, 適合當排版底圖</p></li>
</ul>

<h2>調色板怎麼選</h2>
<ul>
<li><p><b>自適應 (16 / 32 / 64 / 256 色)</b>: 用中位切分演算法從目前圖片裡挑出最有代表性的顏色, 顏色最豐富也最「像」原圖, 是照片類的首選</p></li>
<li><p><b>PICO-8 (16 色)</b>: 現代像素遊戲最常用的幻想主機色表, 顏色飽和、對比強, 做素材上手最快</p></li>
<li><p><b>NES 紅白機 (55 色)</b>: 2C02 晶片實際可用的全部顏色, 自帶 80 年代的懷舊濾鏡</p></li>
<li><p><b>Game Boy DMG (4 色)</b>: 經典綠屏, 4 級明暗, 灰階題材的首選, 也最容易做出「掌機感」</p></li>
<li><p><b>Commodore 64 (16 色) / CGA IBM PC (16 色) / ZX Spectrum (15 色)</b>: 三套 8 位家用機 / 早期 PC 色表, 各有自己的年代味道</p></li>
<li><p><b>Sega Master System (RGB222, 64 色) / Mega Drive·Genesis (RGB333, 512 色) / SNES·SFC (RGB555, 32768 色)</b>: 不列色表, 直接依硬體位深量化 (每通道 2 / 3 / 5 位), 想貼近 16 位主機的發色能力時選它們</p></li>
</ul>

<h2>抖動 (Dither) 是做什麼的</h2>
<ul>
<li><p>色板顏色少時, 單色色塊之間會出現明顯的「斷層」。抖動用 <b>4×4 Bayer 有序抖動</b>把誤差攤到相鄰色塊上, 用兩種顏色的疏密混出中間色, 遠看就像多了一層過渡</p></li>
<li><p>本工具的抖動在<b>色塊網格上</b>進行, 每個色塊內部仍然是純色, 所以放大後看到的是規整的網格花紋, 而不是雜點</p></li>
<li><p>調色板選「關閉」時抖動不生效 (沒有色板就不存在量化誤差)</p></li>
</ul>

<h2>原理與說明</h2>
<ul>
<li><p>順序是 <b>像素塊平均 → 灰階 → 調色板量化 → 展開回原尺寸</b>。先平均再量化, 才能保證每個色塊只用一個顏色; 反過來先量化再平均, 相鄰色塊的平均值會落在調色板之外, 出現髒色</p></li>
<li><p>色塊顏色 = 塊內像素依<b>透明度加權平均</b>, 所以帶透明背景的 PNG (圖示、貼紙) 邊緣不會被透明像素染黑</p></li>
<li><p>結果<b>尺寸與原圖完全一致</b>, 只是把畫面切成了大色塊; 需要更小的圖片請再用「圖片調整」工具縮放</p></li>
<li><p>α (透明度) 通道保持不變; 輸出 JPEG / WebP 時會先鋪白底</p></li>
<li><p>全部處理都在本機瀏覽器 (或桌面端 WebView) 內完成, 圖片不會上傳到任何伺服器</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Turns any image into <b>pixel art</b>: the picture is cut into square blocks (pixelation), then a <b>palette</b> replaces every block with the closest colour — the look of 8-bit and handheld consoles. Three <b>presets</b> at the top cover portrait photos, game assets and abstract art; one click applies a whole set of recommended settings, and every parameter can still be tweaked by hand.</p></blockquote>

<h2>Steps</h2>
<ul>
<li><p>Click "Choose image", or drop an image onto the dashed area (everything runs locally, nothing is uploaded)</p></li>
<li><p>Pick a <b>preset</b> first: "Portrait photo" uses pixel size 6–8 with grayscale off and a colour-rich palette; "Game asset" uses pixel size 8–12 with a classic console palette for your target hardware; "Abstract art" uses pixel size 15–25 with grayscale on and the palette off</p></li>
<li><p>For finer control drag <b>pixel size</b> (2–48 px) or choose another palette; the preset switches to "Custom" as soon as you change something manually</p></li>
<li><p>Choose the output format and quality, then click "Save"; files are named <code>name_pixelart.png</code> (the original is never overwritten)</p></li>
</ul>

<h2>Which preset to use</h2>
<table>
<tr><th>Preset</th><th>Pixel size</th><th>Grayscale</th><th>Palette</th><th>Best for</th></tr>
<tr><td>Portrait photo</td><td>6–8</td><td>off</td><td>Adaptive 64 colours (colour-rich) + dither</td><td>Avatars, portraits, pets — keeps skin tones and facial detail</td></tr>
<tr><td>Game asset</td><td>8–12</td><td>off</td><td>Classic console palette (PICO-8 / NES / Game Boy / C64…)</td><td>Sprites and tiles — few, clean colours that match the target console</td></tr>
<tr><td>Abstract art</td><td>15–25</td><td>on</td><td>Off (original colours, only pixelation + grayscale)</td><td>Covers, backgrounds, posters — big blocks with a monochrome mood</td></tr>
</table>
<ul>
<li><p>Pixel size is the block edge: at 6–12 px the shapes stay recognisable, which suits avatars and assets; above 15 px mostly light, dark and composition remain, which suits abstract work</p></li>
<li><p>For portraits keep the colours and <b>leave dithering on</b> — 64 colours need the dither pattern to fake smooth gradients. For game assets <b>turn dithering off</b> so every block is a clean solid colour when the engine scales it up</p></li>
<li><p>With the palette off, colours come straight from the original image — it is only blocked and turned grayscale, which works well as a layout backdrop</p></li>
</ul>

<h2>Choosing a palette</h2>
<ul>
<li><p><b>Adaptive (16 / 32 / 64 / 256)</b>: median cut picks the most representative colours of the current image — the richest and closest to the original, and the first choice for photos</p></li>
<li><p><b>PICO-8 (16)</b>: the fantasy-console palette behind most modern pixel games — saturated, high contrast, easy to start with</p></li>
<li><p><b>NES (55)</b>: every colour the 2C02 chip can actually output, with a built-in 1980s filter</p></li>
<li><p><b>Game Boy DMG (4)</b>: the classic green screen in four shades — ideal for monochrome subjects and instantly "handheld"</p></li>
<li><p><b>Commodore 64 (16) / CGA IBM PC (16) / ZX Spectrum (15)</b>: three 8-bit home-computer / early-PC palettes, each with its own era flavour</p></li>
<li><p><b>Sega Master System (RGB222, 64) / Mega Drive·Genesis (RGB333, 512) / SNES·SFC (RGB555, 32768)</b>: no colour table — quantization follows the console bit depth (2 / 3 / 5 bits per channel), which is what you want when matching 16-bit hardware</p></li>
</ul>

<h2>What dithering does</h2>
<ul>
<li><p>With few colours the transitions between blocks become hard steps. Dithering uses a <b>4×4 Bayer ordered pattern</b> to spread the error onto neighbouring blocks, mixing two colours to fake intermediate shades</p></li>
<li><p>Here dithering happens on the <b>block grid</b>, so the inside of every block stays a solid colour: zoomed in you see a regular pattern instead of noise</p></li>
<li><p>With the palette set to "Off" dithering has no effect (no palette means no quantization error)</p></li>
</ul>

<h2>How it works, and notes</h2>
<ul>
<li><p>The order is <b>block average → grayscale → palette quantization → expand back to the original size</b>. Averaging first guarantees one colour per block; quantizing first and averaging afterwards would push averages outside the palette and produce muddy colours</p></li>
<li><p>A block colour is the <b>alpha-weighted average</b> of its pixels, so the edges of transparent PNGs (icons, stickers) are not darkened by transparent pixels</p></li>
<li><p>The result keeps the <b>exact original dimensions</b> — the picture is only cut into large blocks. Use the image-resize tool when you need a smaller file</p></li>
<li><p>The alpha channel is preserved; JPEG / WebP output is painted on a white background first</p></li>
<li><p>Everything happens in the local browser (or desktop WebView); images are never uploaded</p></li>
</ul>`;

const PixelArtIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default PixelArtIntro;
