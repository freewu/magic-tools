import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>用 <b>Mermaid</b> 语法写图表并实时预览: 左侧输入代码, 右侧立即渲染。渲染完全在本地浏览器完成 (不联网、不上传), 可把结果导出为 <code>SVG</code> (矢量, 可再编辑、放大不糊) / <code>PNG</code> / <code>WebP</code> 位图, 便于贴到文档、PPT、博客或 IM 里。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>从「示例」下拉里选一个内置模板 (按 <b>基础图 / 数据图表 / 流程与排期 / 语法图</b> 分组, 覆盖 pele 引擎支持的 32 种图形: 流程图、时序图、类图、状态图、ER 图、思维导图、用户旅程图、C4 图、架构图、块图、需求图、饼图、象限图、XY 图、桑基图、雷达图、矩形树图、韦恩图、数据包图、甘特图、Git 分支图、时间线、看板、鱼骨图、Cynefin 框架、Wardley 地图、事件建模、目录树、铁路语法图), 下拉框里可直接输入关键字筛选, 选完在此基础上改</p></li>
<li><p>在「Mermaid 源码」里编辑, 右侧预览会自动刷新 (输入停顿约 200ms 后渲染, 避免频繁重绘)</p></li>
<li><p>语法有误时预览区上方会显示具体错误行与提示, 修正后自动恢复</p></li>
<li><p>「缩放」(1x ~ 4x) 与「背景」同时作用于预览与位图导出: <code>1x</code> 自适应卡片宽度, <code>2x</code> ~ <code>4x</code> 按原图倍率放大 (超出时可滚动查看), 缩放大 = 高清大图 (适合打印 / 高分屏), 背景选「透明」时预览区显示棋盘格, 便于叠到深色文档上; <b>图表配色跟随「背景」</b> — 选「白色」用浅色配色、选「深色」用深色配色 (配色会写进导出的 SVG, 在别处打开也是同一套颜色), 选「透明」时跟随应用的浅色 / 深色模式</p></li>
<li><p>顶部还可 <b>打开文件 / 保存为 .md / 全屏</b>: 「打开文件」读取本地 <code>.mmd</code> 源码或 <code>.md</code> 文档 (会把 <code>\`\`\`mermaid</code> 代码块取出来编辑, 也可直接把文件拖到编辑区), 「保存为 .md」时只替换代码块内部的代码, 周边的 Markdown 文字原样保留 (打开的是纯源码文件时自动补一层 <code>\`\`\`mermaid</code> 代码块); 「全屏」进入全屏专注模式 (Esc 退出), 此时说明区自动隐藏, 左右两栏铺满整屏</p></li>
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
<li><p><b>背景与配色</b>: 图表配色由「背景」决定 (见上), 导出的 SVG 会把配色变量一并写进文件, 因此在别处打开与这里所见一致; 要贴进浅色文档, 导出前切回「白色」背景即可</p></li>
<li><p><b>安全与隐私</b>: 图表里的 HTML 标签一律按纯文本渲染, 不会执行脚本; 图表内的链接与外部图片默认不生效 (点不跳转、不发起网络请求), 渲染全程在本机完成</p></li>
<li><p>少数图形受语法本身限制: <code>sankey</code> 的节点标签只能是 ASCII (可用 front-matter 的 <code>title</code> 写中文标题), <code>wardley-beta</code> 的中文节点名与关系两端需要加引号, <code>requirementDiagram</code> 的 <code>text</code> 字段中文也需加引号</p></li>
<li><p>渲染引擎是 <b>pele</b> (pele.run, 语法对齐 Mermaid 12.1.0): 它支持用例图、泳道图、Agentflow、信息图等图形, 但本工具示例只收录了上面 32 个; ZenUML 等外挂插件图形与 <code>flowchart-elk</code> 的 ELK 布局不受支持</p></li>
<li><p>pele 的布局与配色是自己的实现, 与 GitHub / GitLab / Typora / Obsidian 内置的 mermaid 渲染结果会有差异, 以本工具的渲染结果为准</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>用 <b>Mermaid</b> 語法寫圖表並即時預覽: 左側輸入程式碼, 右側立即渲染。渲染完全在本機瀏覽器完成 (不連網、不上傳), 可把結果匯出為 <code>SVG</code> (向量, 可再編輯、放大不糊) / <code>PNG</code> / <code>WebP</code> 位圖, 便於貼到文件、PPT、部落格或 IM 裡。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>從「範例」下拉裡選一個內建模板 (按 <b>基礎圖 / 資料圖表 / 流程與排期 / 語法圖</b> 分組, 涵蓋 pele 引擎支援的 32 種圖形: 流程圖、時序圖、類別圖、狀態圖、ER 圖、思維導圖、使用者旅程圖、C4 圖、架構圖、區塊圖、需求圖、圓餅圖、象限圖、XY 圖、桑基圖、雷達圖、矩形樹狀圖、韋恩圖、封包圖、甘特圖、Git 分支圖、時間軸、看板、魚骨圖、Cynefin 框架、Wardley 地圖、事件建模、目錄樹、鐵路語法圖), 下拉框裡可直接輸入關鍵字篩選, 選完在此基礎上改</p></li>
<li><p>在「Mermaid 原始碼」裡編輯, 右側預覽會自動更新 (輸入停頓約 200ms 後渲染, 避免頻繁重繪)</p></li>
<li><p>語法有誤時預覽區上方會顯示具體錯誤行與提示, 修正後自動恢復</p></li>
<li><p>「縮放」(1x ~ 4x) 與「背景」同時作用於預覽與點陣匯出: <code>1x</code> 自動適應卡片寬度, <code>2x</code> ~ <code>4x</code> 按原圖倍率放大 (超出時可捲動檢視), 縮放大 = 高解析大圖 (適合列印 / 高解析螢幕), 背景選「透明」時預覽區顯示棋盤格, 便於疊到深色文件上; <b>圖表配色跟隨「背景」</b> — 選「白色」用淺色配色、選「深色」用深色配色 (配色會寫進匯出的 SVG, 在別處開啟也是同一套顏色), 選「透明」時跟隨應用程式的淺色 / 深色模式</p></li>
<li><p>頂部還可 <b>開啟檔案 / 儲存為 .md / 全螢幕</b>: 「開啟檔案」讀取本機 <code>.mmd</code> 原始碼或 <code>.md</code> 文件 (會把 <code>\`\`\`mermaid</code> 程式碼區塊取出來編輯, 也可直接將檔案拖曳到編輯區), 「儲存為 .md」只替換程式碼區塊內部的程式碼, 周邊的 Markdown 文字原樣保留 (開啟的是純原始碼檔案時自動補一層 <code>\`\`\`mermaid</code> 程式碼區塊); 「全螢幕」進入全螢幕專注模式 (Esc 離開), 此時說明區自動隱藏, 左右兩欄鋪滿整個畫面</p></li>
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
<li><p><b>背景與配色</b>: 圖表配色由「背景」決定 (見上), 匯出的 SVG 會把配色變數一併寫進檔案, 因此在別處開啟與這裡所見一致; 要貼進淺色文件, 匯出前切回「白色」背景即可</p></li>
<li><p><b>安全與隱私</b>: 圖表中的 HTML 標籤一律按純文字渲染, 不會執行腳本; 圖表內的連結與外部圖片預設不生效 (點不跳轉、不發起網路請求), 渲染全程在本機完成</p></li>
<li><p>少數圖形受語法本身限制: <code>sankey</code> 的節點標籤只能是 ASCII (可用 front-matter 的 <code>title</code> 寫中文標題), <code>wardley-beta</code> 的中文節點名與關係兩端需要加引號, <code>requirementDiagram</code> 的 <code>text</code> 欄位中文也需加引號</p></li>
<li><p>渲染引擎是 <b>pele</b> (pele.run, 語法對齊 Mermaid 12.1.0): 它支援用例圖、泳道圖、Agentflow、資訊圖等圖形, 但本工具範例只收錄了上面 32 個; ZenUML 等外掛圖形與 <code>flowchart-elk</code> 的 ELK 佈局不受支援</p></li>
<li><p>pele 的佈局與配色是自己的實作, 與 GitHub / GitLab / Typora / Obsidian 內建的 mermaid 渲染結果會有差異, 以本工具的渲染結果為準</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Write diagrams in <b>Mermaid</b> syntax with a live preview: type on the left, see the diagram on the right. Rendering happens entirely in your local browser (no network, no upload), and the result can be exported as <code>SVG</code> (vector — editable, sharp at any zoom) or as <code>PNG</code> / <code>WebP</code> bitmaps for docs, slides, blogs and chat.</p></blockquote>

<h2>How to use it</h2>
<ul>
<li><p>Pick a built-in template in the “Sample” dropdown (grouped into <b>basic diagrams / data charts / process &amp; planning / syntax diagrams</b>, covering the 32 diagram types the pele engine supports: flowchart, sequence, class, state, ER, mindmap, user journey, C4, architecture, block, requirement, pie, quadrant, XY, sankey, radar, treemap, Venn, packet, gantt, git graph, timeline, kanban, Ishikawa, Cynefin, Wardley map, event modeling, tree view and the railroad syntax diagrams). Type in the dropdown to filter, then edit from there</p></li>
<li><p>Edit the code in “Mermaid source”; the preview refreshes automatically (about 200 ms after you stop typing, to avoid constant re-rendering)</p></li>
<li><p>Syntax errors are shown above the preview with the offending line — fix the code and the preview recovers automatically</p></li>
<li><p>“Scale” (1x – 4x) and “Background” apply to both the preview and the bitmap export: <code>1x</code> fits the card width, <code>2x</code> – <code>4x</code> magnify the original size (scroll when it overflows) and give a higher-resolution image, and “Transparent” shows a checkerboard in the preview area — handy for dark documents. <b>The diagram palette follows “Background”</b>: white uses the light palette, dark uses the dark palette (the colours are written into the exported SVG, so it looks the same everywhere else), and transparent follows the app’s light/dark mode</p></li>
<li><p>The same toolbar also offers <b>Open file / Save as .md / Fullscreen</b>: “Open file” reads a local <code>.mmd</code> source or a <code>.md</code> document (the <code>\`\`\`mermaid</code> block is extracted for editing, and you can drop a file onto the editor instead), “Save as .md” rewrites only the code inside that block and keeps the surrounding Markdown text intact (a plain source file gets a <code>\`\`\`mermaid</code> block added); “Fullscreen” gives you a distraction-free full-screen view (Esc to leave) that hides the docs section and lets both columns fill the screen</p></li>
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
<li><p><b>Background and palette</b>: the palette follows “Background” (see above), and the exported SVG carries the colour variables with it, so it looks the same wherever you open it; switch back to the white background before exporting if the diagram is going into a light document</p></li>
<li><p><b>Safety and privacy</b>: HTML inside diagram text is always rendered as plain text and never executed; links and remote images inside a diagram are disabled (clicking does not navigate and nothing is fetched), and rendering happens entirely on your machine</p></li>
<li><p>A few diagram types are limited by their own syntax: <code>sankey</code> node labels must be ASCII (use a front-matter <code>title</code> for a localised heading), <code>wardley-beta</code> needs quotes around non-ASCII node names and around both ends of a relation, and <code>requirementDiagram</code> needs quotes around non-ASCII <code>text</code> values</p></li>
<li><p>The renderer is <b>pele</b> (pele.run, targeting Mermaid 12.1.0 syntax): it also supports use case, swimlane, agentflow and info diagrams, but this tool ships samples for the 32 types above only; ZenUML-style plugin diagrams and the ELK layout of <code>flowchart-elk</code> are not supported</p></li>
<li><p>Pele has its own layout and palette, so results differ from the mermaid build bundled in GitHub / GitLab / Typora / Obsidian — the preview here is the reference</p></li>
</ul>`;

const MermaidIntro :React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default MermaidIntro;
