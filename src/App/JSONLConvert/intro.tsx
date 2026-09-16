import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>在 <b>JSON 数组</b> 与 <b>JSONL</b> (JSON Lines / NDJSON, 每行一条记录) 之间互相转换。粘贴文本、拖入文件或点击「选择文件」即可, 转换全部在浏览器本地完成, 内容不会上传。</p></blockquote>

<h2>两种格式的区别</h2>
<ul>
<li><p><b>JSON 数组</b> — 一个由 <code>[ ]</code> 包裹的整体, 元素之间用逗号分隔, 常带缩进与换行, 适合人工阅读、配置文件与接口返回: <code>[{"id":1},{"id":2}]</code></p></li>
<li><p><b>JSONL</b> (JSON Lines / NDJSON) — 不做整体包裹, <b>每行一个独立的 JSON 值</b>, 行尾用换行分隔, 没有逗号与外层括号: 两行 <code>{"id":1}</code> 与 <code>{"id":2}</code></p></li>
<li><p>JSONL 的好处是按行读取: 可以流式处理超大文件、逐行追加写入、被 Spark / ClickHouse / Elasticsearch / 日志采集器等按行消费; JSON 数组则必须整体读入内存才能解析</p></li>
</ul>

<h2>使用步骤</h2>
<ul>
<li><p>页面有<b>两个框</b>: 上方是 <b>JSON 框</b>, 下方是 <b>JSONL 框</b>, 两个框都既可输入也可输出 (结果写进对应格式的那个框, 源内容保留)</p></li>
<li><p><b>JSON → JSONL</b>: 在上方 JSON 框粘贴 JSON 数组 (或单个 JSON 对象 / 值), 点击蓝色按钮, 每个数组元素会被压成一行紧凑 JSON 写入下方 JSONL 框</p></li>
<li><p><b>JSONL → JSON</b>: 在下方 JSONL 框粘贴每行一条的 JSONL 文本, 点击绿色按钮, 结果是一个格式化后的 JSON 数组 (缩进可选 2 空格 / 4 空格 / Tab) 写入上方 JSON 框</p></li>
<li><p>每个框下方都会显示识别结果 (JSON 数组 / JSON 对象 / JSONL 及其条数), 便于确认粘贴的内容符合预期</p></li>
<li><p>拖拽文件到任一框、点击「选择文件」或「载入示例」时, 会按识别结果放进对应的框并<b>立即转换</b>到另一个框</p></li>
<li><p>结果可双击复制、点「复制结果」或「下载」: 桌面版会弹出系统保存对话框 (可自选目录与文件名), Web 版走浏览器下载; 扩展名随转换方向为 <code>.jsonl</code> / <code>.json</code>, 文件名沿用已载入文件的主名</p></li>
<li><p>点错按钮或把内容放进了另一个框也没关系: 源框为空或内容与按钮方向明显不符时, 会<b>自动按正确方向转换</b>并给出提示</p></li>
</ul>

<h2>说明</h2>
<ul>
<li><p>JSON 必须是<b>严格 JSON</b>: 不支持注释、尾逗号与单引号 (需要这类宽松语法时先用 JSON5 工具处理)</p></li>
<li><p>JSONL 逐行解析, 出错时会提示<b>具体行号</b>; 空白行默认忽略 (可关闭「忽略空行」, 关闭后空行会报错, 因为规范中空行不是合法的 JSONL)</p></li>
<li><p>整段内容本身就是一个 JSON 数组 (如 <code>[{"id":1}]</code>) 时, 点「JSONL → JSON」会<b>自动改为</b>「JSON → JSONL」, 避免把外层数组当成一行数据</p></li>
<li><p>自动忽略文件开头的 UTF-8 BOM, 兼容 Windows 编辑器与各种导出文件; 换行兼容 CRLF / CR / LF</p></li>
<li><p>JSONL 每行可以是任意合法 JSON 值 (对象 / 数组 / 数字 / 字符串 / null), 但按行消费的工具通常只处理对象行</p></li>
<li><p>需要批量<b>造</b>测试数据时, 可用「数据生成」工具 (其输出格式支持 JSONL); 需要美化 / 压缩 JSON 时可用「JSON 格式化」工具</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>在 <b>JSON 陣列</b> 與 <b>JSONL</b> (JSON Lines / NDJSON, 每列一筆記錄) 之間互相轉換。貼上文字、拖入檔案或點擊「選擇檔案」即可, 轉換全部在本機瀏覽器完成, 內容不會上傳。</p></blockquote>

<h2>兩種格式的差別</h2>
<ul>
<li><p><b>JSON 陣列</b> — 一個由 <code>[ ]</code> 包住的整體, 元素之間以逗號分隔, 常帶縮排與換行, 適合人工閱讀、設定檔與 API 回應: <code>[{"id":1},{"id":2}]</code></p></li>
<li><p><b>JSONL</b> (JSON Lines / NDJSON) — 不做整體包裹, <b>每列一個獨立的 JSON 值</b>, 以換行分隔, 沒有逗號與外層括號: 兩列 <code>{"id":1}</code> 與 <code>{"id":2}</code></p></li>
<li><p>JSONL 的好處是逐列讀取: 可以串流處理超大檔案、逐列追加寫入、被 Spark / ClickHouse / Elasticsearch / 日誌採集器等逐列消費; JSON 陣列必須整體載入記憶體才能解析</p></li>
</ul>

<h2>使用步驟</h2>
<ul>
<li><p>頁面有<b>兩個框</b>: 上方是 <b>JSON 框</b>, 下方是 <b>JSONL 框</b>, 兩個框都既可輸入也可輸出 (結果寫進對應格式的那個框, 來源內容保留)</p></li>
<li><p><b>JSON → JSONL</b>: 在上方 JSON 框貼上 JSON 陣列 (或單一 JSON 物件 / 值), 點擊藍色按鈕, 每個陣列元素會被壓成一列緊湊 JSON 寫入下方 JSONL 框</p></li>
<li><p><b>JSONL → JSON</b>: 在下方 JSONL 框貼上每列一筆的 JSONL 文字, 點擊綠色按鈕, 結果是格式化後的 JSON 陣列 (縮排可選 2 空格 / 4 空格 / Tab) 寫入上方 JSON 框</p></li>
<li><p>每個框下方都會顯示識別結果 (JSON 陣列 / JSON 物件 / JSONL 及其筆數), 便於確認貼上的內容符合預期</p></li>
<li><p>拖曳檔案到任一框、點擊「選擇檔案」或「載入範例」時, 會依識別結果放進對應的框並<b>立即轉換</b>到另一個框</p></li>
<li><p>結果可雙擊複製、點「複製結果」或「下載」: 桌面版會彈出系統儲存對話框 (可自選目錄與檔名), Web 版走瀏覽器下載; 副檔名依轉換方向為 <code>.jsonl</code> / <code>.json</code>, 檔名沿用已載入檔案的主名</p></li>
<li><p>點錯按鈕或把內容放進了另一個框也沒關係: 來源框為空或內容與按鈕方向明顯不符時, 會<b>自動依正確方向轉換</b>並給出提示</p></li>
</ul>

<h2>說明</h2>
<ul>
<li><p>JSON 必須是<b>嚴格 JSON</b>: 不支援註解、尾逗號與單引號 (需要這類寬鬆語法時請先用 JSON5 工具處理)</p></li>
<li><p>JSONL 逐列解析, 出錯時會提示<b>具體列號</b>; 空白列預設忽略 (可關閉「忽略空行」, 關閉後空白列會報錯, 因為規範中空白列不是合法的 JSONL)</p></li>
<li><p>整段內容本身就是一個 JSON 陣列 (如 <code>[{"id":1}]</code>) 時, 點「JSONL → JSON」會<b>自動改為</b>「JSON → JSONL」, 避免把外層陣列當成一筆資料</p></li>
<li><p>自動忽略檔案開頭的 UTF-8 BOM, 相容 Windows 編輯器與各種匯出檔案; 換行相容 CRLF / CR / LF</p></li>
<li><p>JSONL 每列可以是任意合法 JSON 值 (物件 / 陣列 / 數字 / 字串 / null), 但逐列消費的工具通常只處理物件列</p></li>
<li><p>需要批次<b>產生</b>測試資料時, 可用「資料產生」工具 (其輸出格式支援 JSONL); 需要美化 / 壓縮 JSON 時可用「JSON 格式化」工具</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Convert between a <b>JSON array</b> and <b>JSONL</b> (JSON Lines / NDJSON — one record per line). Paste text, drop a file, or use "Choose file"; everything runs locally in the browser and nothing is uploaded.</p></blockquote>

<h2>How the two formats differ</h2>
<ul>
<li><p><b>JSON array</b> — one document wrapped in <code>[ ]</code> with comma-separated elements, usually indented across many lines; great for humans, config files and API responses: <code>[{"id":1},{"id":2}]</code></p></li>
<li><p><b>JSONL</b> (JSON Lines / NDJSON) — no wrapper: <b>each line is one standalone JSON value</b>, separated by newlines, with no commas and no outer brackets: the two lines <code>{"id":1}</code> and <code>{"id":2}</code></p></li>
<li><p>The point of JSONL is line-by-line reading: you can stream huge files, append records one at a time, and feed consumers such as Spark, ClickHouse, Elasticsearch or log shippers; a JSON array has to be loaded into memory as a whole</p></li>
</ul>

<h2>How to use it</h2>
<ul>
<li><p>There are <b>two boxes</b>: the top one is the <b>JSON box</b>, the bottom one is the <b>JSONL box</b>. Both accept input and show output — the result is written into the box matching its format and the source is kept</p></li>
<li><p><b>JSON → JSONL</b>: paste a JSON array (or a single JSON object/value) into the top JSON box and click the blue button — every element becomes one compact JSON line in the bottom JSONL box</p></li>
<li><p><b>JSONL → JSON</b>: paste line-delimited JSON into the bottom JSONL box and click the green button — a formatted JSON array (2 spaces / 4 spaces / Tab indent) is written into the top JSON box</p></li>
<li><p>A detection line under each box shows what was recognized (JSON array / JSON object / JSONL and how many records), so you can verify the pasted content</p></li>
<li><p>Dropping a file onto either box, choosing one, or loading the sample places the content into the matching box from that detection and <b>converts right away</b> into the other box</p></li>
<li><p>Copy the result by double-clicking it, with the "Copy result" button, or save it with "Download": the desktop build opens the system save dialog (pick any folder and file name) while the Web build falls back to a browser download. The extension follows the direction — <code>.jsonl</code> / <code>.json</code> — and the name keeps the loaded file's base name</p></li>
<li><p>Clicking the wrong button — or putting the content into the other box — is fine too: when the source box is empty or the content clearly disagrees with the button's direction the tool <b>converts the correct way automatically</b> and tells you about it</p></li>
</ul>

<h2>Notes</h2>
<ul>
<li><p>The JSON must be <b>strict JSON</b>: no comments, trailing commas or single quotes (use the JSON5 tool first if you need those)</p></li>
<li><p>JSONL is parsed line by line and errors report the <b>exact line number</b>; blank lines are ignored by default (turn "Skip blank lines" off and they become an error, since blank lines are not valid JSONL)</p></li>
<li><p>If the whole input is itself a JSON array (e.g. <code>[{"id":1}]</code>), clicking "JSONL → JSON" <b>switches to</b> "JSON → JSONL" automatically so the wrapping array is not mistaken for one record</p></li>
<li><p>A leading UTF-8 BOM is stripped automatically (Windows editors and many exports add one); CRLF / CR / LF line endings are all supported</p></li>
<li><p>Any valid JSON value may be a JSONL line (object, array, number, string, null), although line-consuming tools usually expect objects</p></li>
<li><p>To <b>generate</b> test data in bulk, use the Mock Data tool (its output formats include JSONL); to prettify or minify JSON, use the JSON Formatter tool</p></li>
</ul>`;

const JSONLConvertIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default JSONLConvertIntro;
