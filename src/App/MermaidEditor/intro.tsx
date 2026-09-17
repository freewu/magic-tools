import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>用 <b>Mermaid</b> 语法写图表并实时预览: 左侧输入代码, 右侧立即渲染。渲染完全在本地浏览器完成 (不联网、不上传), 可把结果导出为 <code>SVG</code> (矢量, 可再编辑、放大不糊) / <code>PNG</code> / <code>WebP</code> 位图, 便于贴到文档、PPT、博客或 IM 里。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>从「示例」下拉里选一个内置模板 (按 <b>基础图 / 数据图表 / 流程与排期 / 语法图</b> 分组, 覆盖 mermaid 内置的全部可预览图形: 流程图、时序图、类图、状态图、ER 图、思维导图、用户旅程图、C4 图、架构图、块图、需求图、饼图、象限图、XY 图、桑基图、雷达图、矩形树图、韦恩图、数据包图、甘特图、Git 分支图、时间线、看板、鱼骨图、Cynefin 框架、Wardley 地图、事件建模、目录树、铁路语法图), 下拉框里可直接输入关键字筛选, 选完在此基础上改</p></li>
<li><p>在「Mermaid 源码」里编辑, 右侧预览会自动刷新 (输入停顿约 200ms 后渲染, 避免频繁重绘)</p></li>
<li><p>语法有误时预览区上方会显示具体错误行与提示, 修正后自动恢复</p></li>
<li><p>「缩放」(1x ~ 4x) 与「背景」同时作用于预览与位图导出: <code>1x</code> 自适应卡片宽度, <code>2x</code> ~ <code>4x</code> 按原图倍率放大 (超出时可滚动查看), 缩放大 = 高清大图 (适合打印 / 高分屏), 背景选「透明」时预览区显示棋盘格, 便于叠到深色文档上</p></li>
<li><p>顶部的面板开关可单独收起左右两栏: 只看渲染结果时收起源码栏, 专注改代码时收起预览栏, 再次点击即可恢复</p></li>
<li><p>点「导出 SVG / PNG / WebP」保存文件; 也可用「复制源码 / 复制 SVG」直接粘贴到别处</p></li>
</ul>

<h2>常用语法速查</h2>
<ul>
<li><p><b>流程图</b>: <code>flowchart TD</code> + <code>A[开始] --&gt; B{判断}</code>, 方向可用 <code>TD</code> (上到下) / <code>LR</code> (左到右); 圆角 <code>A(文本)</code>、菱形 <code>{文本}</code>、圆形 <code>((文本))</code></p></li>
<li><p><b>时序图</b>: <code>sequenceDiagram</code> + <code>participant A as 甲</code> + <code>A-&gt;&gt;B: 消息</code> (实线请求) / <code>B--&gt;&gt;A: 回复</code> (虚线响应), <code>autonumber</code> 自动编号</p></li>
<li><p><b>类图</b>: <code>classDiagram</code> + <code>class 类名 { +String 字段; +方法() }</code>, 关系 <code>&lt;|--</code> 继承 / <code>*--</code> 组合 / <code>o--</code> 聚合 / <code>--&gt;</code> 关联</p></li>
<li><p><b>状态图</b>: <code>stateDiagram-v2</code> + <code>[*] --&gt; 状态</code>, 转换标注写在同一行冒号后 (<code>A --&gt; B : 事件</code>)</p></li>
<li><p><b>甘特图</b>: <code>gantt</code> + <code>dateFormat YYYY-MM-DD</code>; 任务行格式 <code>任务名 :id, 开始日期, 持续天数</code>, 可用 <code>after id</code> 表示紧接某任务, <code>:milestone</code> 标里程碑</p></li>
<li><p><b>饼图</b>: <code>pie showData</code> + <code>title 标题</code> + <code>"分项" : 数值</code> (自动换算百分比)</p></li>
<li><p><b>ER 图</b>: <code>erDiagram</code> + <code>实体A ||--o{ 实体B : 关系</code>; 基数符号 <code>||</code> 恰一个 / <code>o|</code> 零或一个 / <code>}o</code> 零或多个 / <code>}|</code> 一个或多个</p></li>
<li><p><b>Git 图</b>: <code>gitGraph</code> + <code>commit id: "说明"</code>、<code>branch 分支名</code>、<code>checkout 分支名</code>、<code>merge 分支名 tag: "v1.0"</code></p></li>
<li><p><b>思维导图</b>: <code>mindmap</code> + 缩进层级, 根节点可写 <code>root((标题))</code>; <b>时间线</b> <code>timeline</code>、<b>看板</b> <code>kanban</code>、<b>鱼骨图</b> <code>ishikawa-beta</code> 同样用缩进表达层级/分类</p></li>
<li><p><b>数据图表</b>: <code>quadrantChart</code> (象限, 坐标用 <code>[x, y]</code> 0~1)、<code>xychart</code> (<code>x-axis</code> / <code>bar</code> / <code>line</code>)、<code>sankey</code> (<code>来源,目标,数值</code>)、<code>radar-beta</code> (<code>axis</code> + <code>curve</code>)、<code>treemap-beta</code>、<code>venn-beta</code> (<code>set</code> / <code>union</code>)、<code>packet</code> (<code>0-15: "字段"</code> 位区间)</p></li>
<li><p><b>结构图</b>: <code>architecture-beta</code> (<code>group</code> / <code>service</code>, 默认可直接用 <code>cloud</code> / <code>database</code> / <code>disk</code> / <code>internet</code> / <code>server</code> 图标)、<code>block-beta</code> (<code>columns N</code> + 方块)、<code>requirementDiagram</code> (需求与元素用 <code>- satisfies -&gt;</code> 等关联)</p></li>
<li><p><b>语法图</b>: <code>railroad-beta</code> (IR) 与 <code>railroad-ebnf-beta</code> / <code>railroad-abnf-beta</code> / <code>railroad-peg-beta</code>, 写法和对应文法一致, 适合给协议/DSL 配图</p></li>
</ul>

<h2>导出与注意事项</h2>
<ul>
<li><p><b>SVG</b> 是矢量格式: 导出时会写入固定的 <code>width</code> / <code>height</code> 与 <code>viewBox</code>, 可直接放进网页或用 Illustrator / Figma / Inkscape 再编辑, 背景保持透明</p></li>
<li><p><b>PNG</b> 适合文档与 IM, <b>WebP</b> 体积更小; 两者都按「缩放」倍率放大后另存, 曲线与文字边缘更清晰</p></li>
<li><p>深色模式下预览会用 mermaid 的 dark 主题, 导出前建议切回浅色模式, 否则深色文字在浅色文档里不易阅读; 「背景」只改变图面底色 (预览与位图一致), 深色主题图配「深色」背景更协调</p></li>
<li><p>出于安全考虑, 图表中的 HTML 标签 (<code>htmlLabels</code>) 已被关闭: 文本会按纯文本渲染, 避免粘贴来源不明的代码在预览时执行脚本</p></li>
<li><p>少数图形受 mermaid 词法限制: <code>sankey</code> 的节点标签只能是 ASCII (可用 front-matter 的 <code>title</code> 写中文标题), <code>wardley-beta</code> 的中文节点名与关系两端需要加引号</p></li>
<li><p>mermaid 的 <code>Use Case</code> 与 <code>ZenUML</code> 图需要额外外挂插件 (<code>@mermaid-js/mermaid-zenuml</code> 等), <code>flowchart-elk</code> 需要 ELK 布局插件, 本工具未内置, 因此示例列表中不提供</p></li>
<li><p>渲染版本为 mermaid v11, 与 GitHub / GitLab / Typora / Obsidian 内置版本可能存在细节差异, 最终以渲染结果为准</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>用 <b>Mermaid</b> 語法寫圖表並即時預覽: 左側輸入程式碼, 右側立即渲染。渲染完全在本機瀏覽器完成 (不連網、不上傳), 可把結果匯出為 <code>SVG</code> (向量, 可再編輯、放大不糊) / <code>PNG</code> / <code>WebP</code> 位圖, 便於貼到文件、PPT、部落格或 IM 裡。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>從「範例」下拉裡選一個內建模板 (按 <b>基礎圖 / 資料圖表 / 流程與排期 / 語法圖</b> 分組, 涵蓋 mermaid 內建的全部可預覽圖形: 流程圖、時序圖、類別圖、狀態圖、ER 圖、思維導圖、使用者旅程圖、C4 圖、架構圖、區塊圖、需求圖、圓餅圖、象限圖、XY 圖、桑基圖、雷達圖、矩形樹狀圖、韋恩圖、封包圖、甘特圖、Git 分支圖、時間軸、看板、魚骨圖、Cynefin 框架、Wardley 地圖、事件建模、目錄樹、鐵路語法圖), 下拉框裡可直接輸入關鍵字篩選, 選完在此基礎上改</p></li>
<li><p>在「Mermaid 原始碼」裡編輯, 右側預覽會自動更新 (輸入停頓約 200ms 後渲染, 避免頻繁重繪)</p></li>
<li><p>語法有誤時預覽區上方會顯示具體錯誤行與提示, 修正後自動恢復</p></li>
<li><p>「縮放」(1x ~ 4x) 與「背景」同時作用於預覽與點陣匯出: <code>1x</code> 自動適應卡片寬度, <code>2x</code> ~ <code>4x</code> 按原圖倍率放大 (超出時可捲動檢視), 縮放大 = 高解析大圖 (適合列印 / 高解析螢幕), 背景選「透明」時預覽區顯示棋盤格, 便於疊到深色文件上</p></li>
<li><p>頂部的面板開關可單獨收合左右兩欄: 只看渲染結果時收起源碼欄, 專心改程式碼時收起預覽欄, 再次點擊即可還原</p></li>
<li><p>點「匯出 SVG / PNG / WebP」儲存檔案; 也可用「複製原始碼 / 複製 SVG」直接貼到別處</p></li>
</ul>

<h2>常用語法速查</h2>
<ul>
<li><p><b>流程圖</b>: <code>flowchart TD</code> + <code>A[開始] --&gt; B{判斷}</code>, 方向可用 <code>TD</code> (上到下) / <code>LR</code> (左到右); 圓角 <code>A(文字)</code>、菱形 <code>{文字}</code>、圓形 <code>((文字))</code></p></li>
<li><p><b>時序圖</b>: <code>sequenceDiagram</code> + <code>participant A as 甲</code> + <code>A-&gt;&gt;B: 訊息</code> (實線請求) / <code>B--&gt;&gt;A: 回覆</code> (虛線回應), <code>autonumber</code> 自動編號</p></li>
<li><p><b>類別圖</b>: <code>classDiagram</code> + <code>class 類名 { +String 欄位; +方法() }</code>, 關係 <code>&lt;|--</code> 繼承 / <code>*--</code> 組合 / <code>o--</code> 聚合 / <code>--&gt;</code> 關聯</p></li>
<li><p><b>狀態圖</b>: <code>stateDiagram-v2</code> + <code>[*] --&gt; 狀態</code>, 轉換標註寫在同一行冒號後 (<code>A --&gt; B : 事件</code>)</p></li>
<li><p><b>甘特圖</b>: <code>gantt</code> + <code>dateFormat YYYY-MM-DD</code>; 任務列格式 <code>任務名 :id, 開始日期, 持續天數</code>, 可用 <code>after id</code> 表示緊接某任務, <code>:milestone</code> 標里程碑</p></li>
<li><p><b>圓餅圖</b>: <code>pie showData</code> + <code>title 標題</code> + <code>"分項" : 數值</code> (自動換算百分比)</p></li>
<li><p><b>ER 圖</b>: <code>erDiagram</code> + <code>實體A ||--o{ 實體B : 關係</code>; 基數符號 <code>||</code> 恰一個 / <code>o|</code> 零或一個 / <code>}o</code> 零或多個 / <code>}|</code> 一個或多個</p></li>
<li><p><b>Git 圖</b>: <code>gitGraph</code> + <code>commit id: "說明"</code>、<code>branch 分支名</code>、<code>checkout 分支名</code>、<code>merge 分支名 tag: "v1.0"</code></p></li>
<li><p><b>思維導圖</b>: <code>mindmap</code> + 縮排層級, 根節點可寫 <code>root((標題))</code>; <b>時間軸</b> <code>timeline</code>、<b>看板</b> <code>kanban</code>、<b>魚骨圖</b> <code>ishikawa-beta</code> 同樣用縮排表達層級/分類</p></li>
<li><p><b>資料圖表</b>: <code>quadrantChart</code> (象限, 座標用 <code>[x, y]</code> 0~1)、<code>xychart</code> (<code>x-axis</code> / <code>bar</code> / <code>line</code>)、<code>sankey</code> (<code>來源,目標,數值</code>)、<code>radar-beta</code> (<code>axis</code> + <code>curve</code>)、<code>treemap-beta</code>、<code>venn-beta</code> (<code>set</code> / <code>union</code>)、<code>packet</code> (<code>0-15: "欄位"</code> 位元區間)</p></li>
<li><p><b>結構圖</b>: <code>architecture-beta</code> (<code>group</code> / <code>service</code>, 預設可直接用 <code>cloud</code> / <code>database</code> / <code>disk</code> / <code>internet</code> / <code>server</code> 圖示)、<code>block-beta</code> (<code>columns N</code> + 方塊)、<code>requirementDiagram</code> (需求與元素用 <code>- satisfies -&gt;</code> 等關聯)</p></li>
<li><p><b>語法圖</b>: <code>railroad-beta</code> (IR) 與 <code>railroad-ebnf-beta</code> / <code>railroad-abnf-beta</code> / <code>railroad-peg-beta</code>, 寫法和對應文法一致, 適合給協定/DSL 配圖</p></li>
</ul>

<h2>匯出與注意事項</h2>
<ul>
<li><p><b>SVG</b> 是向量格式: 匯出時會寫入固定的 <code>width</code> / <code>height</code> 與 <code>viewBox</code>, 可直接放進網頁或用 Illustrator / Figma / Inkscape 再編輯, 背景保持透明</p></li>
<li><p><b>PNG</b> 適合文件與 IM, <b>WebP</b> 體積更小; 兩者都按「縮放」倍率放大後另存, 曲線與文字邊緣更清晰</p></li>
<li><p>深色模式下預覽會用 mermaid 的 dark 主題, 匯出前建議切回淺色模式, 否則深色文字在淺色文件裡不易閱讀; 「背景」只改變圖面底色 (預覽與點陣一致), 深色主題圖配「深色」背景更協調</p></li>
<li><p>出於安全考量, 圖表中的 HTML 標籤 (<code>htmlLabels</code>) 已關閉: 文字會按純文字渲染, 避免貼上來源不明的程式碼在預覽時執行腳本</p></li>
<li><p>少數圖形受 mermaid 詞法限制: <code>sankey</code> 的節點標籤只能是 ASCII (可用 front-matter 的 <code>title</code> 寫中文標題), <code>wardley-beta</code> 的中文節點名與關係兩端需要加引號</p></li>
<li><p>mermaid 的 <code>Use Case</code> 與 <code>ZenUML</code> 圖需要額外外掛 (<code>@mermaid-js/mermaid-zenuml</code> 等), <code>flowchart-elk</code> 需要 ELK 佈局外掛, 本工具未內建, 因此範例清單中不提供</p></li>
<li><p>渲染版本為 mermaid v11, 與 GitHub / GitLab / Typora / Obsidian 內建版本可能存在細節差異, 最終以渲染結果為準</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Write diagrams in <b>Mermaid</b> syntax with a live preview: type on the left, see the diagram on the right. Rendering happens entirely in your local browser (no network, no upload), and the result can be exported as <code>SVG</code> (vector — editable, sharp at any zoom) or as <code>PNG</code> / <code>WebP</code> bitmaps for docs, slides, blogs and chat.</p></blockquote>

<h2>How to use it</h2>
<ul>
<li><p>Pick a built-in template in the “Sample” dropdown (grouped into <b>basic diagrams / data charts / process &amp; planning / syntax diagrams</b>, covering everything mermaid can preview: flowchart, sequence, class, state, ER, mindmap, user journey, C4, architecture, block, requirement, pie, quadrant, XY, sankey, radar, treemap, Venn, packet, gantt, git graph, timeline, kanban, Ishikawa, Cynefin, Wardley map, event modeling, tree view and the railroad syntax diagrams). Type in the dropdown to filter, then edit from there</p></li>
<li><p>Edit the code in “Mermaid source”; the preview refreshes automatically (about 200 ms after you stop typing, to avoid constant re-rendering)</p></li>
<li><p>Syntax errors are shown above the preview with the offending line — fix the code and the preview recovers automatically</p></li>
<li><p>“Scale” (1x – 4x) and “Background” apply to both the preview and the bitmap export: <code>1x</code> fits the card width, <code>2x</code> – <code>4x</code> magnify the original size (scroll when it overflows) and give a higher-resolution image, and “Transparent” shows a checkerboard in the preview area — handy for dark documents</p></li>
<li><p>The panel buttons at the top collapse either column on its own: put the source away to inspect the result, or hide the preview column to focus on the code — click again to bring it back</p></li>
<li><p>Click “Export SVG / PNG / WebP” to save a file, or use “Copy source / Copy SVG” to paste the result elsewhere</p></li>
</ul>

<h2>Syntax cheat sheet</h2>
<ul>
<li><p><b>Flowchart</b>: <code>flowchart TD</code> plus <code>A[Start] --&gt; B{Decision}</code>; direction can be <code>TD</code> (top-down) or <code>LR</code> (left-right); rounded <code>A(text)</code>, diamond <code>{text}</code>, circle <code>((text))</code></p></li>
<li><p><b>Sequence</b>: <code>sequenceDiagram</code> plus <code>participant A as Alice</code> and <code>A-&gt;&gt;B: request</code> (solid) / <code>B--&gt;&gt;A: response</code> (dashed); <code>autonumber</code> numbers the messages</p></li>
<li><p><b>Class</b>: <code>classDiagram</code> plus <code>class Foo { +String field; +method() }</code>; relations <code>&lt;|--</code> inheritance, <code>*--</code> composition, <code>o--</code> aggregation, <code>--&gt;</code> association</p></li>
<li><p><b>State</b>: <code>stateDiagram-v2</code> plus <code>[*] --&gt; State</code>; put the transition label after a colon on the same line (<code>A --&gt; B : event</code>)</p></li>
<li><p><b>Gantt</b>: <code>gantt</code> plus <code>dateFormat YYYY-MM-DD</code>; task lines look like <code>Task name :id, start date, duration</code>, use <code>after id</code> to chain tasks and <code>:milestone</code> for milestones</p></li>
<li><p><b>Pie</b>: <code>pie showData</code> plus <code>title Title</code> and <code>"Slice" : 42</code> (percentages are computed for you)</p></li>
<li><p><b>ER</b>: <code>erDiagram</code> plus <code>ENTITY_A ||--o{ ENTITY_B : relation</code>; cardinality <code>||</code> exactly one, <code>o|</code> zero or one, <code>}o</code> zero or more, <code>}|</code> one or more</p></li>
<li><p><b>Git graph</b>: <code>gitGraph</code> plus <code>commit id: "msg"</code>, <code>branch name</code>, <code>checkout name</code>, <code>merge name tag: "v1.0"</code></p></li>
<li><p><b>Mindmap</b>: <code>mindmap</code> plus indentation, with <code>root((Title))</code> for the centre. <b>Timeline</b> (<code>timeline</code>), <b>kanban</b> and <b>Ishikawa</b> (<code>ishikawa-beta</code>) also use indentation for grouping</p></li>
<li><p><b>Data charts</b>: <code>quadrantChart</code> (points are <code>[x, y]</code> in 0–1), <code>xychart</code> (<code>x-axis</code>, <code>bar</code>, <code>line</code>), <code>sankey</code> (<code>source,target,value</code>), <code>radar-beta</code> (<code>axis</code> + <code>curve</code>), <code>treemap-beta</code>, <code>venn-beta</code> (<code>set</code> / <code>union</code>), <code>packet</code> (<code>0-15: "field"</code> bit ranges)</p></li>
<li><p><b>Structure</b>: <code>architecture-beta</code> (<code>group</code> / <code>service</code>; the bundled <code>cloud</code>, <code>database</code>, <code>disk</code>, <code>internet</code> and <code>server</code> icons work offline), <code>block-beta</code> (<code>columns N</code> plus blocks), <code>requirementDiagram</code> (link requirements and elements with <code>- satisfies -&gt;</code>)</p></li>
<li><p><b>Syntax diagrams</b>: <code>railroad-beta</code> (IR) together with <code>railroad-ebnf-beta</code> / <code>railroad-abnf-beta</code> / <code>railroad-peg-beta</code> — the notation mirrors the grammar, handy for protocols and DSLs</p></li>
</ul>

<h2>Export &amp; caveats</h2>
<ul>
<li><p><b>SVG</b> is a vector format: the export writes a fixed <code>width</code> / <code>height</code> and a <code>viewBox</code>, so the file can go straight into a page or be re-edited in Illustrator / Figma / Inkscape; the background stays transparent</p></li>
<li><p><b>PNG</b> suits documents and chat, <b>WebP</b> is smaller; both are rasterised at the selected scale so curves and text stay crisp</p></li>
<li><p>In dark mode the preview uses mermaid’s dark theme — switch back to light before exporting, otherwise dark text is hard to read on light documents; “Background” only paints the diagram background (identical in the preview and the bitmap), and dark theme diagrams look best on the dark background</p></li>
<li><p>For safety, HTML labels (<code>htmlLabels</code>) are disabled: text is rendered as plain text so pasted code cannot execute scripts in the preview</p></li>
<li><p>A couple of diagram types are limited by mermaid’s own lexer: <code>sankey</code> node labels must be ASCII (use a front-matter <code>title</code> for a localised heading), and <code>wardley-beta</code> needs quotes around non-ASCII node names and around both ends of a relation</p></li>
<li><p>mermaid’s <code>Use Case</code> and <code>ZenUML</code> diagrams require extra plugins (<code>@mermaid-js/mermaid-zenuml</code> and friends) and <code>flowchart-elk</code> needs the ELK layout plugin; none of them ship with this tool, so they are absent from the sample list</p></li>
<li><p>Rendering uses mermaid v11; GitHub / GitLab / Typora / Obsidian may bundle a different version, so small differences are possible — the preview here is the reference</p></li>
</ul>`;

const MermaidIntro :React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default MermaidIntro;
