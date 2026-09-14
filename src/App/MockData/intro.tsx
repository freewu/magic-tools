import { useLocale } from '../../hook/locale-context';

const zh = `<h2>什么是 Mock 数据生成</h2>
<blockquote><p>按 <b>Mock.js 模板语法</b> 批量生成测试数据, 支持导出 <b>JSON</b> / <b>CSV</b> / <b>SQL</b>。模板用 JSON5 解析 (允许单引号、注释、尾逗号), 无需编写代码。</p></blockquote>

<h2>模板写法</h2>
<p>模板的 <b>根节点表示"一条记录"</b>, 生成数量由页面上的「生成数量」决定:</p>
<ul>
<li><p><code>'字段名|规则': 值</code> — 规则控制数量 / 范围 / 自增</p></li>
<li><p><code>age|18-60</code>: 18~60 的整数 &nbsp;·&nbsp; <code>score|60-100.1-2</code>: 60~100 且带 1~2 位小数</p></li>
<li><p><code>list|1-10</code>: 数组随机 1~10 个元素 &nbsp;·&nbsp; <code>id|+1</code>: 自增 (跨记录连续) &nbsp;·&nbsp; <code>tags|1</code>: 多元素数组随机取一个</p></li>
<li><p><code>nick|3</code>: 字符串重复 3 次 &nbsp;·&nbsp; <code>active|1</code>: 约 50% 概率为 true</p></li>
</ul>
<p>兼容 Mock.js 常见的 list 写法: 若根节点只有一个带数量规则的数组字段, 会自动改用它内部的元素作为记录模板。</p>

<h2>@占位符</h2>
<ul>
<li><p><b>基础</b>: <code>@boolean</code> <code>@natural(1,100)</code> <code>@integer(1,100)</code> <code>@float(1,100,2,4)</code> <code>@character("lower")</code> <code>@string(6)</code> <code>@string("number",8)</code> <code>@range(1,10,2)</code></p></li>
<li><p><b>日期</b>: <code>@date</code> <code>@time</code> <code>@datetime</code> <code>@now</code> (可带格式, 如 <code>@date("yyyy-MM-dd")</code>)</p></li>
<li><p><b>文本</b>: <code>@word</code> <code>@sentence</code> <code>@title</code> <code>@paragraph</code> 及中文版 <code>@cword</code> <code>@csentence</code> <code>@ctitle</code> <code>@cparagraph</code></p></li>
<li><p><b>人名</b>: <code>@first</code> <code>@last</code> <code>@name</code> <code>@cfirst</code> <code>@clast</code> <code>@cname</code></p></li>
<li><p><b>网络</b>: <code>@url</code> <code>@domain</code> <code>@protocol</code> <code>@tld</code> <code>@email</code> <code>@ip</code></p></li>
<li><p><b>颜色</b>: <code>@color</code> <code>@hex</code> <code>@rgb</code> <code>@rgba</code> <code>@hsl</code></p></li>
<li><p><b>行政区划 / 编码</b>: <code>@region</code> <code>@province</code> <code>@city</code> <code>@county</code> <code>@zip</code> <code>@id</code> (18 位含校验位) <code>@guid</code></p></li>
<li><p><b>其它</b>: <code>@increment(1)</code> <code>@pick([...])</code> <code>@shuffle([...])</code> <code>@capitalize</code> <code>@upper</code> <code>@lower</code></p></li>
<li><p>整串就是一个占位符时保留原生类型 (数字 / 布尔 / 数组); 混在文本中则拼接为字符串; <code>\\@</code> 可转义为字面量 <code>@</code></p></li>
</ul>

<h2>输出格式</h2>
<ul>
<li><p><b>JSON</b> — 记录数组, 缩进 2 空格, 可直接用于前端 mock</p></li>
<li><p><b>CSV</b> — 首行为列名表头 (可关闭); 含逗号 / 引号 / 换行的单元格自动加引号转义, 嵌套对象与数组按 JSON 字符串写入</p></li>
<li><p><b>SQL</b> — 每行一条 <code>INSERT</code>, 可选生成 <code>CREATE TABLE</code> 建表语句 (列类型按值推断), 表名可自定义</p></li>
</ul>

<h2>说明</h2>
<ul>
<li><p>生成数量默认 100 条, 上限 1000 条; 默认格式 / 默认表名 / 默认数量可在「设置 → 其它 → 数据生成」中调整</p></li>
<li><p>行政区划为精简内置数据 (34 个省级 + 常见城市); 需要完整数据可在源码 <code>lib.ts</code> 中扩展</p></li>
<li><p>模板按 JSON5 解析, 因此 <b>不支持函数值与正则</b> (Mock.js 的 <code>function()</code> / <code>/regex/</code> 写法)</p></li>
<li><p>表名会做安全规整 (只保留字母 / 数字 / 下划线 / <code>$</code>, 数字开头补下划线)</p></li>
</ul>`;

const tw = `<h2>什麼是 Mock 資料產生</h2>
<blockquote><p>依 <b>Mock.js 範本語法</b> 批次產生測試資料, 支援匯出 <b>JSON</b> / <b>CSV</b> / <b>SQL</b>。範本以 JSON5 解析 (允許單引號、註解、尾逗號), 無需撰寫程式碼。</p></blockquote>

<h2>範本寫法</h2>
<p>範本的 <b>根節點表示「一筆記錄」</b>, 產生數量由頁面上的「產生數量」決定:</p>
<ul>
<li><p><code>'欄位名|規則': 值</code> — 規則控制數量 / 範圍 / 自增</p></li>
<li><p><code>age|18-60</code>: 18~60 的整數 &nbsp;·&nbsp; <code>score|60-100.1-2</code>: 60~100 且帶 1~2 位小數</p></li>
<li><p><code>list|1-10</code>: 陣列隨機 1~10 個元素 &nbsp;·&nbsp; <code>id|+1</code>: 自增 (跨記錄連續) &nbsp;·&nbsp; <code>tags|1</code>: 多元素陣列隨機取一個</p></li>
<li><p><code>nick|3</code>: 字串重複 3 次 &nbsp;·&nbsp; <code>active|1</code>: 約 50% 機率為 true</p></li>
</ul>
<p>相容 Mock.js 常見的 list 寫法: 若根節點只有一個帶數量規則的陣列欄位, 會自動改用其內部的元素作為記錄範本。</p>

<h2>@佔位符</h2>
<ul>
<li><p><b>基礎</b>: <code>@boolean</code> <code>@natural(1,100)</code> <code>@integer(1,100)</code> <code>@float(1,100,2,4)</code> <code>@character("lower")</code> <code>@string(6)</code> <code>@string("number",8)</code> <code>@range(1,10,2)</code></p></li>
<li><p><b>日期</b>: <code>@date</code> <code>@time</code> <code>@datetime</code> <code>@now</code> (可帶格式, 如 <code>@date("yyyy-MM-dd")</code>)</p></li>
<li><p><b>文字</b>: <code>@word</code> <code>@sentence</code> <code>@title</code> <code>@paragraph</code> 及中文版 <code>@cword</code> <code>@csentence</code> <code>@ctitle</code> <code>@cparagraph</code></p></li>
<li><p><b>人名</b>: <code>@first</code> <code>@last</code> <code>@name</code> <code>@cfirst</code> <code>@clast</code> <code>@cname</code></p></li>
<li><p><b>網路</b>: <code>@url</code> <code>@domain</code> <code>@protocol</code> <code>@tld</code> <code>@email</code> <code>@ip</code></p></li>
<li><p><b>顏色</b>: <code>@color</code> <code>@hex</code> <code>@rgb</code> <code>@rgba</code> <code>@hsl</code></p></li>
<li><p><b>行政區劃 / 編碼</b>: <code>@region</code> <code>@province</code> <code>@city</code> <code>@county</code> <code>@zip</code> <code>@id</code> (18 位含校驗位) <code>@guid</code></p></li>
<li><p><b>其它</b>: <code>@increment(1)</code> <code>@pick([...])</code> <code>@shuffle([...])</code> <code>@capitalize</code> <code>@upper</code> <code>@lower</code></p></li>
<li><p>整串就是一個佔位符時保留原生型別 (數字 / 布林 / 陣列); 混在文字中則拼接為字串; <code>\\@</code> 可轉義為字面量 <code>@</code></p></li>
</ul>

<h2>輸出格式</h2>
<ul>
<li><p><b>JSON</b> — 記錄陣列, 縮排 2 空格, 可直接用於前端 mock</p></li>
<li><p><b>CSV</b> — 首列為欄名表頭 (可關閉); 含逗號 / 引號 / 換行的儲存格自動加引號轉義, 巢狀物件與陣列以 JSON 字串寫入</p></li>
<li><p><b>SQL</b> — 每列一筆 <code>INSERT</code>, 可選產生 <code>CREATE TABLE</code> 建表語句 (欄位型別依值推斷), 表名可自訂</p></li>
</ul>

<h2>說明</h2>
<ul>
<li><p>產生數量預設 100 筆, 上限 1000 筆; 預設格式 / 預設表名 / 預設數量可在「設定 → 其他 → 資料產生」中調整</p></li>
<li><p>行政區劃為精簡內建資料 (34 個省級 + 常見城市); 需要完整資料可在原始碼 <code>lib.ts</code> 中擴充</p></li>
<li><p>範本以 JSON5 解析, 因此 <b>不支援函式值與正規式</b> (Mock.js 的 <code>function()</code> / <code>/regex/</code> 寫法)</p></li>
<li><p>表名會做安全規整 (只保留字母 / 數字 / 底線 / <code>$</code>, 數字開頭補底線)</p></li>
</ul>`;

const en = `<h2>What is mock data generation</h2>
<blockquote><p>Generate test data in bulk from a <b>Mock.js template syntax</b> and export it as <b>JSON</b>, <b>CSV</b> or <b>SQL</b>. Templates are parsed as JSON5 (single quotes, comments and trailing commas allowed) — no coding required.</p></blockquote>

<h2>Template syntax</h2>
<p>The template <b>root is one record</b>; the number of records comes from the Records field:</p>
<ul>
<li><p><code>'field|rule': value</code> — the rule controls count / range / increment</p></li>
<li><p><code>age|18-60</code>: integer in 18–60 &nbsp;·&nbsp; <code>score|60-100.1-2</code>: 60–100 with 1–2 decimals</p></li>
<li><p><code>list|1-10</code>: array of 1–10 random items &nbsp;·&nbsp; <code>id|+1</code>: auto-increment (continuous across records) &nbsp;·&nbsp; <code>tags|1</code>: pick one item at random</p></li>
<li><p><code>nick|3</code>: repeat the string 3 times &nbsp;·&nbsp; <code>active|1</code>: true with roughly 50% probability</p></li>
</ul>
<p>The Mock.js list style is accepted too: if the root holds a single array field with a count rule, its element is used as the record template automatically.</p>

<h2>@placeholders</h2>
<ul>
<li><p><b>Basics</b>: <code>@boolean</code> <code>@natural(1,100)</code> <code>@integer(1,100)</code> <code>@float(1,100,2,4)</code> <code>@character("lower")</code> <code>@string(6)</code> <code>@string("number",8)</code> <code>@range(1,10,2)</code></p></li>
<li><p><b>Dates</b>: <code>@date</code> <code>@time</code> <code>@datetime</code> <code>@now</code> — optional format, e.g. <code>@date("yyyy-MM-dd")</code></p></li>
<li><p><b>Text</b>: <code>@word</code> <code>@sentence</code> <code>@title</code> <code>@paragraph</code> plus Chinese variants <code>@cword</code> <code>@csentence</code> <code>@ctitle</code> <code>@cparagraph</code></p></li>
<li><p><b>Names</b>: <code>@first</code> <code>@last</code> <code>@name</code> <code>@cfirst</code> <code>@clast</code> <code>@cname</code></p></li>
<li><p><b>Web</b>: <code>@url</code> <code>@domain</code> <code>@protocol</code> <code>@tld</code> <code>@email</code> <code>@ip</code></p></li>
<li><p><b>Colors</b>: <code>@color</code> <code>@hex</code> <code>@rgb</code> <code>@rgba</code> <code>@hsl</code></p></li>
<li><p><b>Regions / codes</b>: <code>@region</code> <code>@province</code> <code>@city</code> <code>@county</code> <code>@zip</code> <code>@id</code> (18-digit with checksum) <code>@guid</code></p></li>
<li><p><b>Others</b>: <code>@increment(1)</code> <code>@pick([...])</code> <code>@shuffle([...])</code> <code>@capitalize</code> <code>@upper</code> <code>@lower</code></p></li>
<li><p>A string that is exactly one placeholder keeps its native type (number / boolean / array); inside a mixed string it is concatenated; <code>\\@</code> escapes a literal <code>@</code></p></li>
</ul>

<h2>Output formats</h2>
<ul>
<li><p><b>JSON</b> — array of records, 2-space indent, ready for front-end mocks</p></li>
<li><p><b>CSV</b> — first row is the header (can be disabled); cells containing commas, quotes or line breaks are quoted and escaped, nested objects/arrays are written as JSON strings</p></li>
<li><p><b>SQL</b> — one <code>INSERT</code> per row, optional <code>CREATE TABLE</code> statement (column types inferred from values), custom table name</p></li>
</ul>

<h2>Notes</h2>
<ul>
<li><p>The record count defaults to 100 and is capped at 1000; default format / table name / count can be changed under Settings → Others → Mock Data</p></li>
<li><p>Region data is a compact built-in set (34 province-level entries plus common cities); extend <code>lib.ts</code> if you need the full dataset</p></li>
<li><p>Templates are JSON5, so <b>function and regex values are not supported</b> (Mock.js <code>function()</code> / <code>/regex/</code> forms)</p></li>
<li><p>Table names are sanitized (letters, digits, underscore and <code>$</code> only; a leading digit gets an underscore)</p></li>
</ul>`;

const Intro = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
}

export default Intro;
