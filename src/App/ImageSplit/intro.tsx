import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>把一张图片按 <b>2 / 3 / 4 / 6 / 9 份</b> 切成整齐的小图, 并按编号命名保存到指定目录。常用于把长图拆成多张发朋友圈 / 微博, 或把大图切成多块做九宫格拼图、切片上传。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>点击「选择图片」, 或把图片直接拖到虚线框内 (图片只在浏览器本地处理, 不会上传)</p></li>
<li><p>选择「分割份数」: 2 / 3 / 4 / 6 / 9 份; 再按需要选择「分割方向」——例如 2 份可选左右或上下, 6 份可选两行三列或三行两列</p></li>
<li><p>设置「输出格式」「每块输出宽度」(0 = 保持原尺寸)「文件名前缀」「编号方式」, 预览会立即重算</p></li>
<li><p>点击「保存全部到文件夹」: 桌面版弹出目录选择框, 一次写入全部小图 (预览图左上角的序号即文件名中的编号)</p></li>
</ul>

<h2>编号与命名</h2>
<ul>
<li><p><b>顺序编号</b>: <code>前缀_1.png</code>、<code>前缀_2.png</code> … (按行优先从左到右、从上到下; 份数超过 9 时自动补零为 <code>前缀_01.png</code>)</p></li>
<li><p><b>行列编号</b>: <code>前缀_r1c1.png</code>、<code>前缀_r1c2.png</code> …, 行列都从 1 开始, 便于按坐标回拼</p></li>
<li><p>前缀会自动去掉扩展名与文件系统非法字符 (如 <code>/ \\ : * ? " &lt; &gt; |</code>)</p></li>
</ul>

<h2>分割尺寸说明</h2>
<ul>
<li><p>宽 / 高不能整除时, 余数像素按四舍五入分配到前几块, <b>各块尺寸最多相差 1 像素, 且拼合后与原图完全一致</b> (不丢像素、不重叠)</p></li>
<li><p>预览区把各块按原图布局<b>紧密拼合</b>展示, 每块左上角叠一个半透明序号 (顺序编号显示 1/2/3 …, 行列编号显示 r1c1), 便于对照文件名</p></li>
<li><p>「每块输出宽度」填 0 时保持原始分辨率; 填正整数时会等比缩放每张小图, 便于控制切片体积</p></li>
<li><p>输出 PNG 为无损格式并保留透明通道; 输出 JPEG 体积更小, 适合照片 (质量可调, 默认 0.92)</p></li>
</ul>

<h2>说明</h2>
<ul>
<li><p>分割完全在本地浏览器 (或桌面端 WebView) 内完成, 图片不会上传到任何服务器</p></li>
<li><p>浏览器演示版受安全限制不能直接写目录, 会逐个触发下载 (浏览器可能提示「允许多个下载」); 桌面版可选择保存目录</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>把一張圖片依 <b>2 / 3 / 4 / 6 / 9 份</b> 切成整齊的小圖, 並依編號命名儲存到指定目錄。常用於把長圖拆成多張發布, 或把大圖切成多塊做九宮格拼圖、切片上傳。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>點擊「選擇圖片」, 或把圖片直接拖到虛線框內 (圖片只在本機瀏覽器處理, 不會上傳)</p></li>
<li><p>選擇「分割份數」: 2 / 3 / 4 / 6 / 9 份; 再依需要選擇「分割方向」——例如 2 份可選左右或上下, 6 份可選兩列三欄或三列兩欄</p></li>
<li><p>設定「輸出格式」「每塊輸出寬度」(0 = 保持原尺寸)「檔案名前綴」「編號方式」, 預覽會立即重算</p></li>
<li><p>點擊「儲存全部到資料夾」: 桌面版會彈出目錄選擇框, 一次寫入全部小圖 (預覽圖左上角的序號即檔案名中的編號)</p></li>
</ul>

<h2>編號與命名</h2>
<ul>
<li><p><b>順序編號</b>: <code>前綴_1.png</code>、<code>前綴_2.png</code> … (依列優先由左至右、由上至下; 份數超過 9 時自動補零為 <code>前綴_01.png</code>)</p></li>
<li><p><b>行列編號</b>: <code>前綴_r1c1.png</code>、<code>前綴_r1c2.png</code> …, 行列都從 1 開始, 便於依座標回拼</p></li>
<li><p>前綴會自動去掉副檔名與檔案系統非法字元 (如 <code>/ \\ : * ? " &lt; &gt; |</code>)</p></li>
</ul>

<h2>分割尺寸說明</h2>
<ul>
<li><p>寬 / 高無法整除時, 餘數像素依四捨五入分配到前幾塊, <b>各塊尺寸最多相差 1 像素, 且拼合後與原圖完全一致</b> (不丟像素、不重疊)</p></li>
<li><p>預覽區把各塊依原圖佈局<b>緊密拼合</b>顯示, 每塊左上角疊一個半透明序號 (順序編號顯示 1/2/3 …, 行列編號顯示 r1c1), 便於對照檔案名</p></li>
<li><p>「每塊輸出寬度」填 0 時保持原始解析度; 填正整數時會等比縮放每張小圖, 便於控制切片體積</p></li>
<li><p>輸出 PNG 為無損格式並保留透明通道; 輸出 JPEG 體積更小, 適合照片 (品質可調, 預設 0.92)</p></li>
</ul>

<h2>說明</h2>
<ul>
<li><p>分割完全在本機瀏覽器 (或桌面端 WebView) 內完成, 圖片不會上傳到任何伺服器</p></li>
<li><p>瀏覽器示範版受安全限制不能直接寫入目錄, 會逐個觸發下載 (瀏覽器可能提示「允許多個下載」); 桌面版可選擇儲存目錄</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Splits one image into <b>2 / 3 / 4 / 6 / 9</b> even tiles and saves them with numbered file names into a folder of your choice. Handy for cutting a long image into several posts, or slicing a big picture into a nine-grid collage or upload chunks.</p></blockquote>

<h2>Steps</h2>
<ul>
<li><p>Click "Choose image", or drop an image onto the dashed area (everything runs locally in your browser, nothing is uploaded)</p></li>
<li><p>Pick how many parts you want (2 / 3 / 4 / 6 / 9), then pick the layout — e.g. 2 parts can be left/right or top/bottom, 6 parts can be two rows of three or three rows of two</p></li>
<li><p>Set the output format, the tile output width (0 = keep the original size), the file name prefix and the numbering style; the preview updates instantly</p></li>
<li><p>Click "Save all to folder": the desktop build opens a folder picker and writes every tile at once (the number in each preview tile's corner is the number used in the file name)</p></li>
</ul>

<h2>Numbering and file names</h2>
<ul>
<li><p><b>Sequential</b>: <code>prefix_1.png</code>, <code>prefix_2.png</code> … (row by row, left to right, top to bottom; more than 9 parts are zero-padded, e.g. <code>prefix_01.png</code>)</p></li>
<li><p><b>Row / column</b>: <code>prefix_r1c1.png</code>, <code>prefix_r1c2.png</code> … with both indexes starting at 1, which makes reassembling by coordinate easy</p></li>
<li><p>The prefix automatically drops the original extension and characters that are illegal in file names (such as <code>/ \\ : * ? " &lt; &gt; |</code>)</p></li>
</ul>

<h2>About the split sizes</h2>
<ul>
<li><p>When the width or height is not evenly divisible, the remaining pixels are rounded into the first tiles, so <b>tiles differ by at most 1 pixel and reassemble into exactly the original image</b> (no pixel lost, no overlap)</p></li>
<li><p>The preview packs every tile <b>tightly together</b> in the original layout, with a translucent number in each tile's top-left corner (1/2/3 … for sequential numbering, r1c1 for row/column), so you can match it against the file name</p></li>
<li><p>A tile output width of 0 keeps the original resolution; a positive value scales every tile proportionally, which helps keep each slice small</p></li>
<li><p>PNG output is lossless and keeps transparency; JPEG is smaller and better suited to photos (quality adjustable, 0.92 by default)</p></li>
</ul>

<h2>Notes</h2>
<ul>
<li><p>Splitting happens entirely in the local browser (or desktop WebView); the image is never uploaded anywhere</p></li>
<li><p>For security reasons the browser demo cannot write to a folder directly and downloads each tile separately (your browser may ask to allow multiple downloads); the desktop build lets you choose a folder</p></li>
</ul>`;

const ImageSplitIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default ImageSplitIntro;
