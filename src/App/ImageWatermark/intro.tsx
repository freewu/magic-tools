import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>给一张图片叠加<b>文字水印</b>或<b>图片 / logo 水印</b>: 可以放在九宫格的任意一个角落或正中, 也可以<b>整图平铺</b>成斜向重复水印; 水印的字号 / 缩放 / 颜色 / 描边 / 旋转角度 / 透明度 / 边距都能实时调整, 右侧即时预览最终效果。适合给方案、合同、图纸、样张加水印后再外发, 避免被随意盗用。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>点击「选择图片」, 或把图片直接拖到虚线框内 (图片只在浏览器本地处理, 不会上传)</p></li>
<li><p>选择「水印类型」: <b>文字水印</b> 输入文字 (回车可换行, 支持多行), 或用「快捷预设」一键填入常见内容; <b>图片水印</b> 选择一张 logo (推荐透明背景 PNG)</p></li>
<li><p>调整「字号」或「缩放」(按图片宽度的百分比, 大图小图观感一致), 需要时改颜色、加粗、斜体、描边, 或让长文字自动缩小以适应宽度</p></li>
<li><p>选择「排布方式」: <b>单个</b> 时用九宫格按钮选位置 (↖ ↑ ↗ ← ● → ↙ ↓ ↘) 并拖边距; <b>平铺</b> 时用「平铺间距」控制疏密</p></li>
<li><p>用「旋转角度」与「透明度」微调观感 (斜向平铺常用 -30°, 透明度 30% 左右最不喧宾夺主)</p></li>
<li><p>选择输出格式与质量, 点「保存」导出结果, 文件名形如 <code>原名_watermark.png</code> (不会覆盖原图)</p></li>
</ul>

<h2>水印参数说明</h2>
<ul>
<li><p><b>字号 / 缩放</b> 按<b>图片宽度的百分比</b>计算 (例如 1000px 宽的图 + 5% = 50px), 因此同一套参数用在不同尺寸的图片上比例一致</p></li>
<li><p><b>自动缩小以适应宽度</b> 开启时, 文字过长会自动降低字号, 保证水印始终落在左右边距之内 (最小 8px), 不会溢出画面</p></li>
<li><p><b>描边</b> 的颜色会随文字颜色自动配对: 亮色文字配黑色描边、暗色文字配白色描边, 在明暗不一的照片上都能看清</p></li>
<li><p><b>旋转角度</b> 为顺时针方向; 水印的尺寸与边距都按<b>旋转后的外接矩形</b>计算, 所以即使旋转到 90° / 45°, 水印也不会超出边距或跑到画面外</p></li>
<li><p><b>平铺</b> 时以图片中心为对称中心向外多铺一圈, 保证四角与边缘都被覆盖 (旋转后也不留空白); 此时「位置」与「边距」不生效</p></li>
<li><p><b>透明度</b> 建议 20% ~ 40%: 既能看清是水印, 又不影响阅读原图内容</p></li>
</ul>

<h2>输出说明</h2>
<ul>
<li><p>结果尺寸与原图完全一致 (水印是叠加, 不会改变画幅); 输出 PNG 无损且保留透明, JPEG / WebP 体积更小、质量可调 (0.92, 透明区域自动铺白底)</p></li>
<li><p>浏览器不支持 WebP 导出时该项会自动禁用; 输出 JPEG 时若原图有透明区域, 会先铺白底避免透明处变黑</p></li>
<li><p>水印图片使用透明背景 PNG 效果最干净 (JPG 会带上白色方块, 在水印透明度较低时比较明显)</p></li>
</ul>

<h2>说明</h2>
<ul>
<li><p>全部处理都在本地浏览器 (或桌面端 WebView) 内完成, 图片不会上传到任何服务器</p></li>
<li><p>「结果体积」是按导出编码后的数据估算的, 用于对比不同格式的压缩效果; 实际写入磁盘的字节数与之基本一致</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>為一張圖片疊加<b>文字浮水印</b>或<b>圖片 / logo 浮水印</b>: 可以放在九宮格的任一角或正中, 也可以<b>整張平鋪</b>成斜向重複浮水印; 浮水印的字號 / 縮放 / 顏色 / 描邊 / 旋轉角度 / 透明度 / 邊距都能即時調整, 右側即時預覽最終效果。適合為方案、合約、圖紙、樣張加上浮水印後再外發, 避免被隨意盜用。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>點擊「選擇圖片」, 或把圖片直接拖到虛線框內 (圖片只在本機瀏覽器處理, 不會上傳)</p></li>
<li><p>選擇「浮水印類型」: <b>文字浮水印</b> 輸入文字 (Enter 可換行, 支援多行), 或用「快速預設」一鍵填入常見內容; <b>圖片浮水印</b> 選擇一張 logo (推薦透明背景 PNG)</p></li>
<li><p>調整「字號」或「縮放」(依圖片寬度的百分比, 大圖小圖觀感一致), 需要時改顏色、加粗、斜體、描邊, 或讓長文字自動縮小以適應寬度</p></li>
<li><p>選擇「排布方式」: <b>單個</b> 時用九宮格按鈕選位置 (↖ ↑ ↗ ← ● → ↙ ↓ ↘) 並拖邊距; <b>平鋪</b> 時用「平鋪間距」控制疏密</p></li>
<li><p>用「旋轉角度」與「透明度」微調觀感 (斜向平鋪常用 -30°, 透明度 30% 左右最不喧賓奪主)</p></li>
<li><p>選擇輸出格式與品質, 點「儲存」匯出結果, 檔案名形如 <code>原名_watermark.png</code> (不會覆蓋原圖)</p></li>
</ul>

<h2>浮水印參數說明</h2>
<ul>
<li><p><b>字號 / 縮放</b> 依<b>圖片寬度的百分比</b>計算 (例如 1000px 寬的圖 + 5% = 50px), 因此同一組參數用在不同尺寸的圖片上比例一致</p></li>
<li><p><b>自動縮小以適應寬度</b> 開啟時, 文字過長會自動降低字號, 保證浮水印始終落在左右邊距之內 (最小 8px), 不會溢出畫面</p></li>
<li><p><b>描邊</b> 的顏色會隨文字顏色自動配對: 亮色文字配黑色描邊、暗色文字配白色描邊, 在明暗不一的照片上都能看清</p></li>
<li><p><b>旋轉角度</b> 為順時針方向; 浮水印的尺寸與邊距都按<b>旋轉後的外接矩形</b>計算, 所以即使旋轉到 90° / 45°, 浮水印也不會超出邊距或跑到畫面外</p></li>
<li><p><b>平鋪</b> 時以圖片中心為對稱中心向外多鋪一圈, 保證四角與邊緣都被覆蓋 (旋轉後也不留空白); 此時「位置」與「邊距」不生效</p></li>
<li><p><b>透明度</b> 建議 20% ~ 40%: 既能看清是浮水印, 又不影響閱讀原圖內容</p></li>
</ul>

<h2>輸出說明</h2>
<ul>
<li><p>結果尺寸與原圖完全一致 (浮水印是疊加, 不會改變畫幅); 輸出 PNG 無損且保留透明, JPEG / WebP 體積較小、品質可調 (0.92, 透明區域自動鋪白底)</p></li>
<li><p>瀏覽器不支援 WebP 匯出時該項會自動停用; 輸出 JPEG 時若原圖有透明區域, 會先鋪白底避免透明處變黑</p></li>
<li><p>浮水印圖片使用透明背景 PNG 效果最乾淨 (JPG 會帶上白色方塊, 在浮水印透明度較低時比較明顯)</p></li>
</ul>

<h2>說明</h2>
<ul>
<li><p>全部處理都在本機瀏覽器 (或桌面端 WebView) 內完成, 圖片不會上傳到任何伺服器</p></li>
<li><p>「結果體積」是依匯出編碼後的資料估算的, 用於對比不同格式的壓縮效果; 實際寫入磁碟的位元組數與之基本一致</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Overlay a <b>text watermark</b> or an <b>image / logo watermark</b> onto a picture: place it in any of the nine grid positions or dead center, or <b>tile it across the whole image</b> as a diagonal repeating mark. Size, scale, color, outline, rotation, opacity and margin all update instantly, with a live preview of the final result. Handy for stamping proposals, contracts, drawings or samples before sending them out.</p></blockquote>

<h2>Steps</h2>
<ul>
<li><p>Click "Choose image", or drop an image into the dashed box (the image is processed locally in your browser and never uploaded)</p></li>
<li><p>Pick a watermark type: for <b>Text</b> type the content (Enter adds a new line, multiple lines are supported) or use a quick preset; for <b>Image / logo</b> choose an image (a transparent PNG works best)</p></li>
<li><p>Adjust "Font size" or "Scale" (a percentage of the image width, so the look is consistent across image sizes), then optionally change the color, enable bold / italic / outline, or let long text shrink to fit</p></li>
<li><p>Pick a layout: with <b>Single</b> use the nine-grid buttons (↖ ↑ ↗ ← ● → ↙ ↓ ↘) to choose the position and drag the margin; with <b>Tiled</b> use "Tile spacing" to control the density</p></li>
<li><p>Fine-tune with "Rotation" and "Opacity" (-30° is a common diagonal angle, and around 30% opacity stays unobtrusive)</p></li>
<li><p>Choose the output format and quality, then click "Save"; the file is named like <code>name_watermark.png</code> and never overwrites the original</p></li>
</ul>

<h2>How the parameters work</h2>
<ul>
<li><p><b>Font size / Scale</b> are a <b>percentage of the image width</b> (e.g. 5% of a 1000px-wide image = 50px), so the same settings keep the same proportions on images of any size</p></li>
<li><p><b>Auto-shrink to fit the width</b> lowers the font size automatically when the text is too long, keeping the watermark inside the left/right margins (down to 8px) instead of overflowing</p></li>
<li><p>The <b>outline</b> color is paired with the text color automatically — a dark outline for light text and a light outline for dark text — so it stays readable on both bright and dark photos</p></li>
<li><p><b>Rotation</b> is clockwise; both the watermark size and the margins use the <b>rotated bounding box</b>, so even at 90° or 45° the watermark never spills past the margin or off the canvas</p></li>
<li><p>In <b>Tiled</b> mode the pattern is laid out symmetrically around the image center with one extra ring, so the corners and edges stay covered even after rotation; "Position" and "Margin" do not apply there</p></li>
<li><p>An <b>opacity</b> of 20%–40% is a good default: clearly visible as a watermark without hurting the readability of the photo</p></li>
</ul>

<h2>Output</h2>
<ul>
<li><p>The result keeps the exact original dimensions (the watermark is an overlay, the canvas never changes); PNG output is lossless and keeps transparency, while JPEG / WebP are smaller with adjustable quality (0.92, transparent areas are filled with white)</p></li>
<li><p>The WebP option is disabled automatically when the browser cannot export it; when writing JPEG, transparent areas are filled with white first so they don't turn black</p></li>
<li><p>A transparent-background PNG gives the cleanest logo watermark (a JPG brings a white box that shows up clearly at low opacity)</p></li>
</ul>

<h2>Notes</h2>
<ul>
<li><p>Everything happens in the local browser (or desktop WebView); the image is never uploaded anywhere</p></li>
<li><p>"Result size on disk" is estimated from the encoded output so you can compare formats; the bytes actually written are essentially the same</p></li>
</ul>`;

const ImageWatermarkIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default ImageWatermarkIntro;
