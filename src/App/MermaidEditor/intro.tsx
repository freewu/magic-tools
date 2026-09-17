import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>用 <b>Mermaid</b> 语法写图表并实时预览: 左侧输入代码, 右侧立即渲染。渲染完全在本地浏览器完成 (不联网、不上传), 可把结果导出为 <code>SVG</code> (矢量, 可再编辑、放大不糊) / <code>PNG</code> / <code>WebP</code> 位图, 便于贴到文档、PPT、博客或 IM 里。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>从「示例」下拉里选一个内置模板 (流程图 / 时序图 / 类图 / 状态图 / 甘特图 / 饼图 / ER 图 / Git 分支图), 直接在此基础上改</p></li>
<li><p>在「Mermaid 源码」里编辑, 右侧预览会自动刷新 (输入停顿约 200ms 后渲染, 避免频繁重绘)</p></li>
<li><p>语法有误时预览区上方会显示具体错误行与提示, 修正后自动恢复</p></li>
<li><p>导出位图前可先选「缩放」(1x ~ 4x) 与「背景」: 缩放大 = 高清大图 (适合打印 / 高分屏), 透明背景适合叠到深色文档上</p></li>
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
<li><p><b>注释</b>: <code>%%</code> 开头的整行会被忽略; 文本含 <code>()[]{}"</code> 等特殊字符时用引号包起来, 例如 <code>A["带(括号)的文本"]</code></p></li>
</ul>

<h2>导出与注意事项</h2>
<ul>
<li><p><b>SVG</b> 是矢量格式: 导出时会写入固定的 <code>width</code> / <code>height</code> 与 <code>viewBox</code>, 可直接放进网页或用 Illustrator / Figma / Inkscape 再编辑, 背景保持透明</p></li>
<li><p><b>PNG</b> 适合文档与 IM, <b>WebP</b> 体积更小; 两者都按「缩放」倍率放大后另存, 曲线与文字边缘更清晰</p></li>
<li><p>深色模式下预览会用 mermaid 的 dark 主题, 导出前建议切回浅色模式, 否则深色文字在浅色文档里不易阅读; 位图导出的「背景」只影响位图, 深色主题图配「深色」背景更协调</p></li>
<li><p>出于安全考虑, 图表中的 HTML 标签 (<code>htmlLabels</code>) 已被关闭: 文本会按纯文本渲染, 避免粘贴来源不明的代码在预览时执行脚本</p></li>
<li><p>部分语法 (如 <code>xychart</code> / <code>sankey</code> 等较新图表) 依赖的插件默认未启用, 如需使用可参考 mermaid 官方文档; 本工具覆盖最常用的 8 类图表</p></li>
<li><p>渲染版本为 mermaid v11, 与 GitHub / GitLab / Typora / Obsidian 内置版本可能存在细节差异, 最终以渲染结果为准</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>用 <b>Mermaid</b> 語法寫圖表並即時預覽: 左側輸入程式碼, 右側立即渲染。渲染完全在本機瀏覽器完成 (不連網、不上傳), 可把結果匯出為 <code>SVG</code> (向量, 可再編輯、放大不糊) / <code>PNG</code> / <code>WebP</code> 位圖, 便於貼到文件、PPT、部落格或 IM 裡。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>從「範例」下拉裡選一個內建模板 (流程圖 / 時序圖 / 類別圖 / 狀態圖 / 甘特圖 / 圓餅圖 / ER 圖 / Git 分支圖), 直接在此基礎上改</p></li>
<li><p>在「Mermaid 原始碼」裡編輯, 右側預覽會自動更新 (輸入停頓約 200ms 後渲染, 避免頻繁重繪)</p></li>
<li><p>語法有誤時預覽區上方會顯示具體錯誤行與提示, 修正後自動恢復</p></li>
<li><p>匯出位圖前可先選「縮放」(1x ~ 4x) 與「背景」: 縮放大 = 高解析大圖 (適合列印 / 高解析螢幕), 透明背景適合疊到深色文件上</p></li>
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
<li><p><b>註解</b>: <code>%%</code> 開頭的整列會被忽略; 文字含 <code>()[]{}"</code> 等特殊字元時用引號包起來, 例如 <code>A["帶(括號)的文字"]</code></p></li>
</ul>

<h2>匯出與注意事項</h2>
<ul>
<li><p><b>SVG</b> 是向量格式: 匯出時會寫入固定的 <code>width</code> / <code>height</code> 與 <code>viewBox</code>, 可直接放進網頁或用 Illustrator / Figma / Inkscape 再編輯, 背景保持透明</p></li>
<li><p><b>PNG</b> 適合文件與 IM, <b>WebP</b> 體積更小; 兩者都按「縮放」倍率放大後另存, 曲線與文字邊緣更清晰</p></li>
<li><p>深色模式下預覽會用 mermaid 的 dark 主題, 匯出前建議切回淺色模式, 否則深色文字在淺色文件裡不易閱讀; 位圖匯出的「背景」只影響位圖, 深色主題圖配「深色」背景更協調</p></li>
<li><p>出於安全考量, 圖表中的 HTML 標籤 (<code>htmlLabels</code>) 已關閉: 文字會按純文字渲染, 避免貼上來源不明的程式碼在預覽時執行腳本</p></li>
<li><p>部分語法 (如 <code>xychart</code> / <code>sankey</code> 等較新圖表) 依賴的外掛預設未啟用, 如需使用可參考 mermaid 官方文件; 本工具涵蓋最常用的 8 類圖表</p></li>
<li><p>渲染版本為 mermaid v11, 與 GitHub / GitLab / Typora / Obsidian 內建版本可能存在細節差異, 最終以渲染結果為準</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Write diagrams in <b>Mermaid</b> syntax with a live preview: type on the left, see the diagram on the right. Rendering happens entirely in your local browser (no network, no upload), and the result can be exported as <code>SVG</code> (vector — editable, sharp at any zoom) or as <code>PNG</code> / <code>WebP</code> bitmaps for docs, slides, blogs and chat.</p></blockquote>

<h2>How to use it</h2>
<ul>
<li><p>Pick one of the built-in templates in the “Sample” dropdown (flowchart, sequence, class, state, gantt, pie, ER, git graph) and edit from there</p></li>
<li><p>Edit the code in “Mermaid source”; the preview refreshes automatically (about 200 ms after you stop typing, to avoid constant re-rendering)</p></li>
<li><p>Syntax errors are shown above the preview with the offending line — fix the code and the preview recovers automatically</p></li>
<li><p>Before exporting a bitmap choose “Scale” (1x – 4x) and “Background”: a larger scale gives a high-resolution image, while a transparent background is handy for dark documents</p></li>
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
<li><p><b>Comments</b>: a whole line starting with <code>%%</code> is ignored; wrap text containing <code>()[]{}"</code> in quotes, e.g. <code>A["text (with parens)"]</code></p></li>
</ul>

<h2>Export &amp; caveats</h2>
<ul>
<li><p><b>SVG</b> is a vector format: the export writes a fixed <code>width</code> / <code>height</code> and a <code>viewBox</code>, so the file can go straight into a page or be re-edited in Illustrator / Figma / Inkscape; the background stays transparent</p></li>
<li><p><b>PNG</b> suits documents and chat, <b>WebP</b> is smaller; both are rasterised at the selected scale so curves and text stay crisp</p></li>
<li><p>In dark mode the preview uses mermaid’s dark theme — switch back to light before exporting, otherwise dark text is hard to read on light documents; the bitmap “Background” only affects bitmaps (dark theme diagrams look best on the dark background)</p></li>
<li><p>For safety, HTML labels (<code>htmlLabels</code>) are disabled: text is rendered as plain text so pasted code cannot execute scripts in the preview</p></li>
<li><p>A few newer diagram types (<code>xychart</code>, <code>sankey</code>, …) ship as plugins that stay disabled; see the mermaid docs if you need them. This tool covers the eight most common ones</p></li>
<li><p>Rendering uses mermaid v11; GitHub / GitLab / Typora / Obsidian may bundle a different version, so small differences are possible — the preview here is the reference</p></li>
</ul>`;

const MermaidIntro :React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default MermaidIntro;
