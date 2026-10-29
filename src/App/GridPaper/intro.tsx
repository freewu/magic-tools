import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>生成可打印的 <b>格子纸</b> (方格纸 / 点阵纸 / 横线纸): 支持 <b>A3 / A4 / B5 / B6</b> 四种纸张 (默认 A4), 纵向或横向, 格子大小、页边距、线宽、线色、页数、加粗间隔都能即时调整, 右侧预览实时刷新, 点一下就能打印。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>选「纸张」: <b>A3 / A4 / B5 / B6</b> (ISO 216 标准尺寸, 默认 A4), 再选「纵向 / 横向」</p></li>
<li><p>选「格型」: <b>方格</b> (工程笔记 / 数学演算)、<b>点阵</b> (笔记排版更自由)、<b>横线</b> (纯书写)</p></li>
<li><p>调「格子大小」: 常用 3 / 5 / 8 / 10mm 一键切换, 也可以直接输入 (2–50mm, 步进 0.5mm)</p></li>
<li><p>需要分块书写时设「加粗间隔」: 例如设为 5, 每 5 格就有一条加粗线, 5mm 格子即得到 25mm 的分区</p></li>
<li><p>调「页边距 / 线宽 / 线色 / 页数」, 点「🖨️ 打印」打开系统打印对话框即可打印, 也可以选择「另存为 PDF」留档</p></li>
</ul>

<h2>尺寸与打印</h2>
<ul>
<li><p>每页行列数 = 「可用区域 ÷ 格子大小」向下取整, 网格整体居中 —— 所以实际边距可能比设定值略大一点 (不足一格的部分平分到两侧), 保证整页不溢出、不裁切</p></li>
<li><p>打印时会自动把 <code>@page</code> 设成所选纸张, 所以只要打印机里放的纸一致, 出来就是真实尺寸; <b>务必把打印缩放保持在 100% (实际大小)</b>, 选「适合页面 / 缩放」会把格子边长压小</p></li>
<li><p>横竖两个方向都支持: 横向 A4 即 297×210mm, 适合表格 / 甘特图式的速记格子</p></li>
<li><p>另一种玩法: 打印成 PDF 后导入平板笔记软件作模板 (手写更省眼), 或在设置里记住常用参数, 下次打开直接打印</p></li>
</ul>

<h2>说明</h2>
<ul>
<li><p>页面内容是 SVG 矢量线, 打印与导出 PDF 都是矢量, 不会出现锯齿或粗细不均</p></li>
<li><p>线色均为浅色 (灰 / 蓝 / 淡绿 / 淡红), 打印后不会盖过笔迹; 线宽默认 0.2mm, 打印机分辨率低时可加粗到 0.3–0.4mm</p></li>
<li><p>全部在本地生成 (浏览器或桌面端 WebView), 不需要联网, 也不会上传任何内容</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>產生可列印的 <b>格子紙</b> (方格紙 / 點陣紙 / 橫線紙): 支援 <b>A3 / A4 / B5 / B6</b> 四種紙張 (預設 A4), 縱向或橫向, 格子大小、頁邊距、線寬、線色、頁數、加粗間隔都能即時調整, 右側預覽即時更新, 點一下就能列印。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>選「紙張」: <b>A3 / A4 / B5 / B6</b> (ISO 216 標準尺寸, 預設 A4), 再選「縱向 / 橫向」</p></li>
<li><p>選「格型」: <b>方格</b> (工程筆記 / 數學演算)、<b>點陣</b> (筆記排版更自由)、<b>橫線</b> (純書寫)</p></li>
<li><p>調「格子大小」: 常用 3 / 5 / 8 / 10mm 一鍵切換, 也可以直接輸入 (2–50mm, 步進 0.5mm)</p></li>
<li><p>需要分塊書寫時設「加粗間隔」: 例如設為 5, 每 5 格就有一條加粗線, 5mm 格子即得到 25mm 的分區</p></li>
<li><p>調「頁邊距 / 線寬 / 線色 / 頁數」, 點「🖨️ 列印」開啟系統列印對話框即可列印, 也可以選擇「另存為 PDF」留檔</p></li>
</ul>

<h2>尺寸與列印</h2>
<ul>
<li><p>每頁行列數 = 「可用區域 ÷ 格子大小」向下取整, 網格整體置中 —— 所以實際邊距可能比設定值略大一點 (不足一格的部分平分到兩側), 保證整頁不溢出、不裁切</p></li>
<li><p>列印時會自動把 <code>@page</code> 設成所選紙張, 所以只要印表機放的紙一致, 出來就是真實尺寸; <b>務必把列印縮放保持在 100% (實際大小)</b>, 選「符合頁面 / 縮放」會把格子邊長壓小</p></li>
<li><p>橫豎兩個方向都支援: 橫向 A4 即 297×210mm, 適合表格 / 甘特圖式的速記格子</p></li>
<li><p>另一種玩法: 列印成 PDF 後匯入平板筆記軟體作模板, 或在設定裡記住常用參數, 下次打開直接列印</p></li>
</ul>

<h2>說明</h2>
<ul>
<li><p>頁面內容是 SVG 向量線, 列印與匯出 PDF 都是向量, 不會出現鋸齒或粗細不均</p></li>
<li><p>線色均為淺色 (灰 / 藍 / 淡綠 / 淡紅), 列印後不會蓋過筆跡; 線寬預設 0.2mm, 印表機解析度低時可加粗到 0.3–0.4mm</p></li>
<li><p>全部在本機產生 (瀏覽器或桌面端 WebView), 不需要連網, 也不會上傳任何內容</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Generates printable <b>grid paper</b> (square grid, dot grid or ruled lines) on <b>A3 / A4 / B5 / B6</b> (A4 by default), portrait or landscape. Cell size, margin, line width, line colour, page count and major-line interval can all be tuned live — the preview updates as you type and one click sends it to your printer.</p></blockquote>

<h2>How to use</h2>
<ul>
<li><p>Pick a <b>paper size</b> (A3 / A4 / B5 / B6, ISO 216; A4 by default) and an <b>orientation</b></p></li>
<li><p>Pick a <b>pattern</b>: <b>grid</b> (engineering notes, maths), <b>dots</b> (flexible layout for note-taking) or <b>lines</b> (plain writing)</p></li>
<li><p>Set the <b>cell size</b> — presets for 3 / 5 / 8 / 10mm, or type any value between 2 and 50mm in 0.5mm steps</p></li>
<li><p>Use <b>major line every</b> to block the page out: with 5, every 5th line is thicker, so 5mm cells give you 25mm blocks</p></li>
<li><p>Tune margin / line width / colour / pages, then click "🖨️ Print" to open the system print dialog — or choose "Save as PDF" to keep an archive copy</p></li>
</ul>

<h2>Sizes & printing</h2>
<ul>
<li><p>Columns and rows per page = printable area ÷ cell size, rounded down, and the grid is centred — so the real margin may be slightly larger than the value you set (the leftover fraction is split between both sides). A page never overflows or gets clipped</p></li>
<li><p>The print stylesheet sets <code>@page</code> to the selected paper size, so as long as the printer holds the same paper the result is true to size. <b>Keep the print scale at 100% (actual size)</b> — "fit to page" shrinks the cells</p></li>
<li><p>Both orientations work: landscape A4 is 297×210mm, handy for table-like or Gantt-style notes</p></li>
<li><p>Another workflow: print to PDF and import it into a tablet note app as a template, or just let the tool remember your favourite settings</p></li>
</ul>

<h2>Notes</h2>
<ul>
<li><p>The page is SVG vector geometry, so both printing and PDF export stay vector — no jaggies, no uneven line weights</p></li>
<li><p>All line colours are light (gray / blue / light green / light red) so they never overpower your writing; the default 0.2mm line can be raised to 0.3–0.4mm on lower-resolution printers</p></li>
<li><p>Everything is generated locally (browser or desktop WebView) — no network access, nothing is uploaded</p></li>
</ul>`;

const GridPaperIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default GridPaperIntro;
