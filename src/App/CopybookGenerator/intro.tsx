import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>生成可打印的 A4 <b>练字字帖</b>: 支持 <b>米字格</b> / <b>田字格</b> / <b>回宫格</b> / <b>作文格</b> 四种格型, 可选楷体 / 行楷 / 隶书 / 宋体 / 黑体 / 仿宋 / 微软雅黑, 也可以上传自己的字体文件; 字体大小、行列数、格线颜色、描红或空白都可在页面上即时调整, 点一下就能打印。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>选择「格子样式」: 米字格 / 田字格 / 回宫格 / 作文格 (切换格型时会自动套用该格型的默认行列数)</p></li>
<li><p>选择「字体」; 需要特殊字体时点「上传字体」选择本地 <code>ttf / otf / woff / woff2</code> 文件 (只在本地使用, 不会上传)</p></li>
<li><p>填入「文本」: 按字自动拆分, 空格与标点会被跳过; 字不够时默认<b>循环填充</b>整页</p></li>
<li><p>选择「内容模式」: <b>描红</b> (浅灰字, 供描写)、<b>黑字</b> (范字)、<b>首字示范</b> (每行首格为浅灰范字, 其余留空)、<b>空白格</b> (纯格线, 自行书写)</p></li>
<li><p>调整「每行格数 / 每页行数 / 页数 / 格间距 / 格线颜色」, 右侧 A4 预览实时刷新; 点「🖨️ 打印 A4」打开系统打印对话框即可打印</p></li>
</ul>

<h2>版式与说明</h2>
<ul>
<li><p>格子尺寸由「每行格数 × 每页行数」自动计算并均分 A4 可用区域 (约 186mm × 253mm), 保证整页不溢出、不裁切; 想移动「格间距」时, 格子会相应变小依然保持整页不溢出</p></li>
<li><p>米字格 = 方格 + 横竖中线 + 两条对角线; 田字格 = 方格 + 横竖中线; 回宫格 = 方格 + 虚线内框 + 中线到内框的连接线; 作文格 = 纯方格 (稿纸)</p></li>
<li><p>格线颜色可选红 / 灰 / 蓝 / 淡绿, 均为浅色, 打印后不干扰书写; 「格间距」为 0 时相邻格子共用一条线 (不会有双线或粗细不均), 大于 0 时每格各自成框并留出间距</p></li>
<li><p>设置里可配置默认格型 / 默认字体 / 默认格线颜色 / 默认内容模式 / 默认行列数 / 默认页数 / 默认格间距 / 默认文本 / 默认循环填充</p></li>
</ul>

<h2>说明</h2>
<ul>
<li><p>排版与打印全部在本地完成 (浏览器或桌面端 WebView), 不需要联网; 上传的字体也不会离开本机</p></li>
<li><p>打印用的是系统打印对话框: 桌面端直接调用打印机, Web 版会在浏览器里打开打印预览, 也可以选择「另存为 PDF」留档</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>產生可列印的 A4 <b>練字字帖</b>: 支援 <b>米字格</b> / <b>田字格</b> / <b>回宮格</b> / <b>作文格</b> 四種格型, 可選楷體 / 行楷 / 隸書 / 宋體 / 黑體 / 仿宋 / 微軟雅黑, 也可以上傳自己的字型檔案; 字體大小、行列數、格線顏色、描紅或空白都可在頁面上即時調整, 點一下就能列印。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>選擇「格子樣式」: 米字格 / 田字格 / 回宮格 / 作文格 (切換格型時會自動套用該格型的預設行列數)</p></li>
<li><p>選擇「字型」; 需要特殊字型時點「上傳字型」選擇本機 <code>ttf / otf / woff / woff2</code> 檔案 (只在本機使用, 不會上傳)</p></li>
<li><p>填入「文字」: 依字自動拆分, 空格與標點會被跳過; 字不夠時預設<b>循環填充</b>整頁</p></li>
<li><p>選擇「內容模式」: <b>描紅</b> (淺灰字, 供描寫)、<b>黑字</b> (範字)、<b>首字示範</b> (每行首格為淺灰範字, 其餘留空)、<b>空白格</b> (純格線, 自行書寫)</p></li>
<li><p>調整「每行格數 / 每頁行數 / 頁數 / 格間距 / 格線顏色」, 右側 A4 預覽即時更新; 點「🖨️ 列印 A4」開啟系統列印對話框即可列印</p></li>
</ul>

<h2>版式與說明</h2>
<ul>
<li><p>格子尺寸由「每行格數 × 每頁行數」自動計算並均分 A4 可用區域 (約 186mm × 253mm), 保證整頁不溢出、不裁切; 調大「格間距」時格子會相應變小, 依然保持整頁不溢出</p></li>
<li><p>米字格 = 方格 + 橫豎中線 + 兩條對角線; 田字格 = 方格 + 橫豎中線; 回宮格 = 方格 + 虛線內框 + 中線到內框的連接線; 作文格 = 純方格 (稿紙)</p></li>
<li><p>格線顏色可選紅 / 灰 / 藍 / 淡綠, 均為淺色, 列印後不干擾書寫; 「格間距」為 0 時相鄰格子共用一條線 (不會出現雙線或粗細不均), 大於 0 時每格各自成框並留出間距</p></li>
<li><p>設定裡可配置預設格型 / 預設字型 / 預設格線顏色 / 預設內容模式 / 預設行列數 / 預設頁數 / 預設格間距 / 預設文字 / 預設循環填充</p></li>
</ul>

<h2>說明</h2>
<ul>
<li><p>排版與列印全部在本機完成 (瀏覽器或桌面端 WebView), 不需要連網; 上傳的字型也不會離開本機</p></li>
<li><p>列印用的是系統列印對話框: 桌面端直接呼叫印表機, Web 版會在瀏覽器裡開啟列印預覽, 也可以選擇「另存為 PDF」留存</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Generate printable A4 <b>handwriting practice sheets</b>: choose a <b>mi-grid</b>, <b>tian-grid</b>, <b>hui-grid</b> or plain <b>essay grid</b>, pick a Chinese font (KaiTi / Xingkai / LiSu / SimSun / SimHei / FangSong / Microsoft YaHei) or upload your own font file, then tune the cell count, line colour and tracing style — and print with one click.</p></blockquote>

<h2>Steps</h2>
<ul>
<li><p>Pick a grid style: mi / tian / hui / essay (switching a style applies that style's default row and column counts)</p></li>
<li><p>Pick a font, or click "Upload font" to use a local <code>ttf / otf / woff / woff2</code> file (used locally only, never uploaded)</p></li>
<li><p>Type the text: it is split per character (spaces and punctuation are skipped); when it runs out, the sheet repeats it unless "Repeat to fill" is turned off</p></li>
<li><p>Choose a content mode: <b>trace</b> (light gray characters to trace), <b>ink</b> (solid models), <b>first char only</b> (a light gray model in the first cell of each row) or <b>blank</b> (grid lines only)</p></li>
<li><p>Adjust columns / rows per page / page count / cell gap / line colour — the A4 preview updates live; click "🖨️ Print A4" to open the system print dialog</p></li>
</ul>

<h2>Layout and notes</h2>
<ul>
<li><p>Cell size is derived from the column and row counts and evenly fills the printable A4 area (about 186mm × 253mm), so a page never overflows or gets clipped; increasing the cell gap shrinks the cells to keep everything on one page</p></li>
<li><p>Mi-grid = square + centre cross + both diagonals; tian-grid = square + centre cross; hui-grid = square + dashed inner box + connectors from the midpoints; essay grid = plain squares</p></li>
<li><p>Line colours are red / gray / blue / light green, all light enough not to fight the writing; with a cell gap of 0 neighbouring cells share a single line (never double or uneven), while a gap above 0 gives every cell its own box</p></li>
<li><p>Settings let you configure the default grid style, font, line colour, content mode, row/column counts, page count, cell gap, text and repeat behaviour</p></li>
</ul>

<h2>Notes</h2>
<ul>
<li><p>Layout and printing happen entirely offline in the local browser (or desktop WebView); uploaded fonts never leave your machine</p></li>
<li><p>Printing goes through the system print dialog: the desktop build talks to your printer directly, while the web build opens the browser print preview where you can also "Save as PDF"</p></li>
</ul>`;

const CopybookGeneratorIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default CopybookGeneratorIntro;
