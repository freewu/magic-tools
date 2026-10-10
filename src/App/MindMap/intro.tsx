import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>把 <b>Markdown 大纲</b>变成一张思维导图: 标题层级与列表缩进就是树的层级, 右侧实时渲染。渲染完全在本地完成 (不联网、不上传), 可导出为 <code>SVG</code> (矢量, 可再编辑、放大不糊) / <code>PNG</code> / <code>WebP</code> 位图, 用于文档、PPT、博客或知识库。渲染引擎是 <b>markmap</b> (基于 d3 的层级布局)。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>从「示例」下拉里选一个模板 (项目计划 / 学习路线 / 会议纪要 / 知识体系 / 需求拆解 / markmap 语法速查), 下拉框可直接输入关键字筛选</p></li>
<li><p>在左侧「Markdown 大纲」里编辑, 右侧会自动刷新 (输入停顿约 250ms 后重排, 避免频繁重绘)</p></li>
<li><p>用「<b>配色</b>」换一套颜色 (默认多色 / 单色蓝绿灰 / 暖色 / 冷色), 「<b>展开层级</b>」控制默认展开几层, 「<b>字号</b>」调节点文字大小</p></li>
<li><p>预览区可以<b>滚轮缩放、拖拽平移</b>; 点节点旁的圆点即可折叠或展开该分支; 点「适应窗口」把整棵树重新摆正; 点「<b>全屏</b>」让画布铺满整个屏幕 (按 <code>Esc</code> 或点「退出全屏」返回, 全屏后会自动重新适应窗口)</p></li>
<li><p>「背景」(白 / 深 / 透明) 与「缩放」(1x ~ 4x) 作用于<b>位图导出与预览</b>; 之后点「导出 SVG / PNG / WebP」保存, 或用「复制 SVG / 复制大纲」直接粘贴到别处</p></li>
<li><p>顶部的面板开关可单独收起左右两栏: 只看结果时收起大纲栏, 专注写大纲时收起预览栏</p></li>
</ul>

<h2>大纲怎么写 (markmap 规则)</h2>
<ul>
<li><p><b>标题建层级</b>: <code># 根</code> → <code>## 一级分支</code> → <code>### 二级分支</code>, 想再深一层就继续加 <code>#</code></p></li>
<li><p><b>列表同样建层级</b>: <code>- 条目</code>, 缩进两格表示下一层; 有序列表 <code>1.</code> 也支持</p></li>
<li><p><b>不要在同一父节点下混用两种写法</b>: 例如先写一组 <code>- 条目</code>, 紧接着写一个更深的 <code>### 标题</code>, 前面的条目会被覆盖丢失 (markmap 解析器按层级收拢, 出现更深层级时会清空同级旧条目)。想混用时, 把标题写在条目前面, 或整段只用一种写法</p></li>
<li><p><b>折叠标记</b>要与内容写在<b>同一行</b>才生效: <code>## 默认收起的分支 &lt;!-- markmap: fold --&gt;</code>; 整棵树默认折叠用 <code>foldAll</code> (不建议: 打开就是收起的)</p></li>
<li><p><b>行内格式</b>: <code>**加粗**</code>、<code>*斜体*</code>、<code>\`行内代码\`</code>、<code>[链接](url)</code>、<code>~~删除线~~</code></p></li>
<li><p><b>代码块</b>会整块作为一个节点 (内置一套极简高亮配色); <b>复选框</b> <code>- [x] 已完成</code> / <code>- [ ] 待办</code> 会显示成勾选框图标</p></li>
<li><p><b>frontmatter</b> (文件开头的 <code>---</code> 块) 可写 <code>title</code> 与 <code>markmap</code> 参数, 如 <code>markmap.colorFreezeLevel: 2</code> (前两层用同一色系); 界面上的「配色 / 展开层级 / 字号」优先级更高, 会覆盖 frontmatter 里的同名项</p></li>
</ul>

<h2>展开层级与折叠</h2>
<ul>
<li><p>「<b>全部展开</b>」适合整体浏览结构; 大纲很大时选「仅展开 2 / 3 / 4 层」, 先看骨架, 需要时再点圆点展开分支</p></li>
<li><p>节点旁的 <b>圆点</b>: 实心表示该分支已收起, 空心表示已展开; 单击即可切换。折叠状态只在当前会话内有效, 修改大纲后会按「展开层级」重排</p></li>
</ul>

<h2>导出与注意事项</h2>
<ul>
<li><p><b>SVG</b> 是矢量格式: 导出时按内容自动计算 <code>viewBox</code> 并写入固定的 <code>width</code> / <code>height</code>, 背景透明, 可直接放进网页或用 Illustrator / Figma / Inkscape 再编辑</p></li>
<li><p><b>PNG / WebP</b> 按「缩放」倍率光栅化: 大图适合打印与高分屏; 「背景」为透明时, 位图保留透明通道, 预览区用棋盘格表示</p></li>
<li><p>深色模式下预览使用浅色文字, 位图导出的背景默认跟随主题 (深色模式→深色底), 也可以在预览区手动切换</p></li>
<li><p>预览区用 <b>foreignObject</b> 排版文字, 导出 SVG 在主流浏览器与设计工具里都能正常显示; 个别老旧工具 (如早期的 Office 版本) 可能不渲染 foreignObject, 这种情况请改用 PNG / WebP</p></li>
<li><p>为保证离线可用, 本工具<b>不加载任何 CDN 资源</b>: 数学公式插件 (KaTeX) 被移除, <code>$公式$</code> 会按纯文本原样显示; 代码高亮使用内置的极简配色, 与 VS Code 主题不必完全一致</p></li>
<li><p>导出的位图尺寸 = 内容包围盒 × 缩放倍率, 与预览窗口大小无关 (全屏只改预览视口, 不影响导出结果); 排版是纯本地计算, 同样的输入在任何环境下都得到同一张图</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>把 <b>Markdown 大綱</b>變成一張心智圖: 標題層級與列表縮排就是樹的層級, 右側即時渲染。渲染完全在本機完成 (不連網、不上傳), 可匯出為 <code>SVG</code> (向量, 可再編輯、放大不糊) / <code>PNG</code> / <code>WebP</code> 位圖, 用於文件、PPT、部落格或知識庫。渲染引擎是 <b>markmap</b> (以 d3 為基礎的階層佈局)。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>從「範例」下拉裡選一個模板 (專案計畫 / 學習路線 / 會議紀錄 / 知識體系 / 需求拆解 / markmap 語法速查), 下拉框可直接輸入關鍵字篩選</p></li>
<li><p>在左側「Markdown 大綱」裡編輯, 右側會自動更新 (輸入停頓約 250ms 後重排, 避免頻繁重繪)</p></li>
<li><p>用「<b>配色</b>」換一套顏色 (預設多色 / 單色藍綠灰 / 暖色 / 冷色), 「<b>展開層級</b>」控制預設展開幾層, 「<b>字號</b>」調整節點文字大小</p></li>
<li><p>預覽區可以<b>滾輪縮放、拖曳平移</b>; 點節點旁的圓點即可折疊或展開該分支; 點「適應視窗」把整棵樹重新擺正; 點「<b>全螢幕</b>」讓畫布鋪滿整個螢幕 (按 <code>Esc</code> 或點「退出全螢幕」返回, 全螢幕後會自動重新適應視窗)</p></li>
<li><p>「背景」(白 / 深 / 透明) 與「縮放」(1x ~ 4x) 作用於<b>點陣圖匯出與預覽</b>; 之後點「匯出 SVG / PNG / WebP」儲存, 或用「複製 SVG / 複製大綱」直接貼到別處</p></li>
<li><p>頂部的面板開關可單獨收起左右兩欄: 只看結果時收起大綱欄, 專心寫大綱時收起預覽欄</p></li>
</ul>

<h2>大綱怎麼寫 (markmap 規則)</h2>
<ul>
<li><p><b>標題建層級</b>: <code># 根</code> → <code>## 第一層分支</code> → <code>### 第二層分支</code>, 想再深一層就繼續加 <code>#</code></p></li>
<li><p><b>列表同樣建層級</b>: <code>- 條目</code>, 縮排兩格表示下一層; 有序列表 <code>1.</code> 也支援</p></li>
<li><p><b>不要在同一父節點下混用兩種寫法</b>: 例如先寫一組 <code>- 條目</code>, 緊接著寫一個更深的 <code>### 標題</code>, 前面的條目會被覆蓋遺失 (markmap 解析器按層級收攏, 出現更深層級時會清空同層舊條目)。想混用時, 把標題寫在條目前面, 或整段只用一種寫法</p></li>
<li><p><b>折疊標記</b>要與內容寫在<b>同一行</b>才生效: <code>## 預設收起的分支 &lt;!-- markmap: fold --&gt;</code>; 整棵樹預設折疊用 <code>foldAll</code> (不建議: 打開就是收起的)</p></li>
<li><p><b>行內格式</b>: <code>**粗體**</code>、<code>*斜體*</code>、<code>\`行內程式碼\`</code>、<code>[連結](url)</code>、<code>~~刪除線~~</code></p></li>
<li><p><b>程式碼區塊</b>會整塊作為一個節點 (內建一套極簡高亮配色); <b>核取方塊</b> <code>- [x] 已完成</code> / <code>- [ ] 待辦</code> 會顯示成勾選框圖示</p></li>
<li><p><b>frontmatter</b> (檔案開頭的 <code>---</code> 區塊) 可寫 <code>title</code> 與 <code>markmap</code> 參數, 如 <code>markmap.colorFreezeLevel: 2</code> (前兩層用同一色系); 介面上的「配色 / 展開層級 / 字號」優先權更高, 會覆蓋 frontmatter 裡同名項</p></li>
</ul>

<h2>展開層級與折疊</h2>
<ul>
<li><p>「<b>全部展開</b>」適合整體瀏覽結構; 大綱很大時選「僅展開 2 / 3 / 4 層」, 先看骨架, 需要時再點圓點展開分支</p></li>
<li><p>節點旁的 <b>圓點</b>: 實心表示該分支已收起, 空心表示已展開; 按一下即可切換。折疊狀態只在本次工作階段內有效, 修改大綱後會按「展開層級」重排</p></li>
</ul>

<h2>匯出與注意事項</h2>
<ul>
<li><p><b>SVG</b> 是向量格式: 匯出時依內容自動計算 <code>viewBox</code> 並寫入固定的 <code>width</code> / <code>height</code>, 背景透明, 可直接放進網頁或用 Illustrator / Figma / Inkscape 再編輯</p></li>
<li><p><b>PNG / WebP</b> 按「縮放」倍率點陣化: 大圖適合列印與高解析螢幕; 「背景」為透明時, 點陣圖保留透明通道, 預覽區用棋盤格表示</p></li>
<li><p>深色模式下預覽使用淺色文字, 點陣圖匯出的背景預設跟隨主題 (深色模式→深色底), 也可以在預覽區手動切換</p></li>
<li><p>預覽區用 <b>foreignObject</b> 排版文字, 匯出的 SVG 在主流瀏覽器與設計工具裡都能正常顯示; 少數老舊工具 (如早期 Office 版本) 可能不渲染 foreignObject, 這種情況請改用 PNG / WebP</p></li>
<li><p>為確保離線可用, 本工具<b>不載入任何 CDN 資源</b>: 數學公式外掛 (KaTeX) 已移除, <code>$公式$</code> 會以純文字原樣顯示; 程式碼高亮使用內建的極簡配色, 與 VS Code 主題不必完全一致</p></li>
<li><p>匯出的點陣圖尺寸 = 內容包圍盒 × 縮放倍率, 與預覽視窗大小無關 (全螢幕只改預覽視口, 不影響匯出結果); 排版是純本機計算, 同樣的輸入在任何環境都得到同一張圖</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Turns a <b>Markdown outline</b> into a mind map: heading levels and list indentation become the branches, rendered live on the right. Everything runs locally (no network, no upload) and can be exported as <code>SVG</code> (vector, re-editable, resolution independent) / <code>PNG</code> / <code>WebP</code> for docs, slides, blogs or knowledge bases. The rendering engine is <b>markmap</b> (a d3-based tree layout).</p></blockquote>

<h2>How to use</h2>
<ul>
<li><p>Pick a template from the “Sample” dropdown (project plan, learning path, meeting notes, knowledge map, requirement breakdown, markmap syntax reference) — you can type to filter</p></li>
<li><p>Edit the outline on the left; the preview refreshes automatically (re-layout waits ~250&nbsp;ms after you stop typing)</p></li>
<li><p>Use <b>Color</b> for the palette (default multicolour, mono blue/green/gray, warm, cool), <b>Expand level</b> for how many levels start expanded and <b>Font size</b> for the text size</p></li>
<li><p>The canvas supports <b>wheel zoom and drag panning</b>; click the circle next to a node to fold or unfold that branch; press “Fit” to re-centre the whole tree, or “<b>Fullscreen</b>” to blow the canvas up to the whole screen (leave it with <code>Esc</code> or “Exit fullscreen” — the map re-fits automatically)</p></li>
<li><p><b>Background</b> (white / dark / transparent) and <b>Scale</b> (1x – 4x) apply to the <b>preview and raster export</b>. Then use “Export SVG / PNG / WebP”, or “Copy SVG / Copy outline” to paste elsewhere</p></li>
<li><p>The two toggles on top collapse the outline or the preview pane so you can focus on either side</p></li>
</ul>

<h2>Writing the outline (markmap rules)</h2>
<ul>
<li><p><b>Headings build levels</b>: <code># root</code> → <code>## branch</code> → <code>### sub-branch</code>, keep adding <code>#</code> to go deeper</p></li>
<li><p><b>Lists build levels too</b>: <code>- item</code>, indented two spaces per level; ordered lists (<code>1.</code>) work as well</p></li>
<li><p><b>Do not mix both styles under one parent</b>: a group of <code>- item</code> lines followed by a deeper <code>### heading</code> makes the earlier items disappear (markmap’s parser collapses by level and clears older siblings when a deeper level appears). Put headings before the items, or use just one style per section</p></li>
<li><p>A <b>fold marker</b> only works on the <b>same line</b> as the content: <code>## collapsed by default &lt;!-- markmap: fold --&gt;</code>. <code>foldAll</code> folds the whole tree (not recommended — it opens collapsed)</p></li>
<li><p><b>Inline formatting</b>: <code>**bold**</code>, <code>*italic*</code>, <code>\`inline code\`</code>, <code>[link](url)</code>, <code>~~strikethrough~~</code></p></li>
<li><p>A <b>fenced code block</b> becomes a single node (with a minimal built-in highlight theme); <b>checkboxes</b> (<code>- [x] done</code> / <code>- [ ] todo</code>) render as tick boxes</p></li>
<li><p>The <b>frontmatter</b> block at the top may define <code>title</code> and <code>markmap</code> options, e.g. <code>markmap.colorFreezeLevel: 2</code> (one hue for the first two levels). The Color / Expand level / Font size controls win over frontmatter values</p></li>
</ul>

<h2>Expanding and folding</h2>
<ul>
<li><p>“<b>Expand all</b>” is best for a bird’s-eye view; for large outlines pick “Expand 2 / 3 / 4 levels” to see the skeleton first and unfold branches on demand</p></li>
<li><p>The <b>circle</b> beside a node is filled when the branch is collapsed and hollow when expanded — a click toggles it. Folding is session-only: editing the outline re-applies the expand level</p></li>
</ul>

<h2>Export &amp; caveats</h2>
<ul>
<li><p><b>SVG</b> is vector: the export computes a <code>viewBox</code> from the content, writes fixed <code>width</code> / <code>height</code> and keeps the background transparent, so the file drops straight into a page or Illustrator / Figma / Inkscape</p></li>
<li><p><b>PNG / WebP</b> are rasterised at the chosen scale (good for print and HiDPI); with the transparent background the alpha channel is preserved and the preview shows a checkerboard</p></li>
<li><p>In dark mode the preview uses light text and raster exports default to the matching dark background; the toggle still lets you override it</p></li>
<li><p>The preview lays text out with <b>foreignObject</b>, which the exported SVG renders in all mainstream browsers and design tools; a few legacy tools (older Office versions, for example) ignore it — export PNG / WebP there instead</p></li>
<li><p>To stay fully offline this tool loads <b>no CDN assets</b>: the maths plugin (KaTeX) is removed, so <code>$formula$</code> stays plain text, and code highlighting uses a minimal built-in palette rather than a full highlight.js theme</p></li>
<li><p>The raster size is content-bounds × scale, independent of the on-screen pane size (fullscreen only changes the preview viewport, never the export); layout is pure local computation, so identical input always yields the same image</p></li>
</ul>`;

const MindMapIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default MindMapIntro;
