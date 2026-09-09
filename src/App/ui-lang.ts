// 其余分类剩余工具共享词条 (formatter / misc / 统计等): zh 原文即 key, 值为 [zh-TW, en]
// 用法: const t = (zh:string) => u(locale, zh); 动态模板: uT(locale, zhTpl, {x:...}) (占位符 {x})
type UiRec = Record<string, [string, string]>;
const D: UiRec = {
  // 通用
  '已复制': ['已複製', 'Copied'],
  '载入示例': ['載入範例', 'Load sample'],
  '清空': ['清空', 'Clear'],
  '复制': ['複製', 'Copy'],
  '暂无结果 — 输入文本后自动排版。': ['尚無結果 — 輸入文字後自動排版。', 'No result yet — typing text reformats it automatically.'],
  '复制到粘贴板成功！！！': ['複製到剪貼簿成功！！！', 'Copied to clipboard!!!'],
  // CnEnSpacing 中英混排
  '中英文自动排版': ['中英文自動排版', 'Auto-spacing between Chinese and English'],
  '自动在中文与英文字母、数字之间插入空格（如 “使用HTML” → “使用 HTML”）。仅处理紧邻的混排边界：已存在的空格不会重复添加；标点符号、换行与段落结构不会被修改。': ['自動在中文與英文字母、數字之間插入空格（如「使用HTML」→「使用 HTML」）。僅處理緊鄰的混排邊界：已存在的空格不會重複加入；標點符號、換行與段落結構不會被修改。', 'Automatically inserts spaces between Chinese and adjacent Latin letters/digits (e.g. “使用HTML” → “使用 HTML”). Only tight mixed-script boundaries are touched: existing spaces are never duplicated, and punctuation, line breaks and paragraph structure are left intact.'],
  '待排版文本': ['待排版文字', 'Text to space'],
  '排版结果': ['排版結果', 'Result'],
  '粘贴中英混排文本…': ['貼上中英混排文字…', 'Paste mixed Chinese/English text…'],
  '已插入 ': ['已插入 ', 'Inserted '],
  ' 个空格': [' 個空格', ' space(s)'],
  // HtmlFormat
  'HTML 格式化': ['HTML 格式化', 'HTML formatter'],
  '美化格式化 HTML 代码: 块级元素缩进换行、行内元素保留在一行、文本空白自动折叠。script / style / pre / textarea 内容原样保留。缩进空格数可在右侧或「设置 → 格式化」中切换 2 / 4 空格。': ['美化格式化 HTML 程式碼: 區塊元素縮排換行、行內元素保留在同一行、文字空白自動摺疊。script / style / pre / textarea 內容原樣保留。縮排空格數可在右側或「設定 → 格式化」中切換 2 / 4 空格。', 'Prettifies HTML: block-level elements are indented on new lines, inline elements stay on one line, and text whitespace collapses. Content inside script / style / pre / textarea is preserved as-is. The indentation can be switched between 2 / 4 spaces on the right or under Settings → Formatting.'],
  'HTML 源码': ['HTML 原始碼', 'HTML source'],
  '格式化结果': ['格式化結果', 'Formatted result'],
  '2 空格': ['2 空格', '2 spaces'],
  '4 空格': ['4 空格', '4 spaces'],
  '粘贴 HTML 代码…': ['貼上 HTML 程式碼…', 'Paste HTML code…'],
  '如: <div><p>你好</p></div>': ['如: <div><p>你好</p></div>', 'e.g. <div><p>hello</p></div>'],
  '{n} 字符': ['{n} 字元', '{n} characters'],
  '暂无结果 — 输入 HTML 后自动格式化。': ['尚無結果 — 輸入 HTML 後自動格式化。', 'No result yet — pasting HTML formats it automatically.'],
  // LineCount 内容统计
  '选取内容已复制到粘贴板!!!': ['選取內容已複製到剪貼簿!!!', 'Selected content copied to clipboard!!!'],
  '去除空行': ['移除空行', 'Remove empty lines'],
  '提取内容': ['提取內容', 'Extract range'],
  '打开文件': ['開啟檔案', 'Open file'],
  '开始行数': ['開始行數', 'Start line'],
  '结束行数': ['結束行數', 'End line'],
  '行数:': ['行數:', 'Lines:'],
  '字符数:': ['字元數:', 'Characters:'],
  '输入需要统计的内容 或 拖拽文件到框内': ['輸入需要統計的內容 或 拖曳檔案到框內', 'Enter the content to count, or drop a file into the box'],
  '已复制格式化结果': ['已複製格式化結果', 'Formatted result copied'],
  '已下载 formatted.xml': ['已下載 formatted.xml', 'formatted.xml downloaded'],
  '已载入示例 XML': ['已載入範例 XML', 'Sample XML loaded'],
  '复制失败, 请手动全选复制': ['複製失敗, 請手動全選複製', 'Copy failed — select and copy manually'],
  'XML 格式化': ['XML 格式化', 'XML formatter'],
  'XML / XAML / SVG / plist / 配置文件美化缩进，支持 XML 声明、注释、CDATA 与处理指令的保留。标签未闭合、交叉嵌套或多余闭合会给出带行号的错误提示。': ['XML / XAML / SVG / plist / 設定檔美化縮排，支援 XML 宣告、註解、CDATA 與處理指令的保留。標籤未閉合、交叉巢狀或多餘閉合會給出帶行號的錯誤提示。', 'Prettifies XML / XAML / SVG / plist / config files; XML declarations, comments, CDATA and processing instructions are preserved. Unclosed tags, interleaved nesting or stray closing tags produce an error message with a line number.'],
  '原始 XML': ['原始 XML', 'Raw XML'],
  '在此粘贴 XML 源码…': ['在此貼上 XML 原始碼…', 'Paste XML source here…'],
  '例如: <config><server host="127.0.0.1"/></config>': ['例如: <config><server host="127.0.0.1"/></config>', 'e.g. <config><server host="127.0.0.1"/></config>'],
  '下载 .xml': ['下載 .xml', 'Download .xml'],
  'XML 语法错误': ['XML 語法錯誤', 'XML syntax error'],
  '原始 {c} 字符 / {n} 行': ['原始 {c} 字元 / {n} 行', 'Raw: {c} characters / {n} lines'],
  '格式化后 {c} 字符': ['格式化後 {c} 字元', 'After formatting: {c} characters'],
  '{n} 行': ['{n} 行', '{n} lines'],
  '暂无结果 — 在上方粘贴 XML 后自动格式化。': ['尚無結果 — 在上方貼上 XML 後自動格式化。', 'No result yet — pasting XML above formats it automatically.'],
  'SVG 格式化 / 压缩': ['SVG 格式化 / 壓縮', 'SVG formatter / minifier'],
  '基于 SVGO 引擎处理 SVG: 去除注释、冗余属性、多余分组并优化路径等。可「美化」为多行缩进或「压缩」为单行最小体积, 适合发布到网页前瘦身。': ['基於 SVGO 引擎處理 SVG: 移除註解、冗餘屬性、多餘群組並最佳化路徑等。可「美化」為多行縮排或「壓縮」為單行最小體積, 適合發佈到網頁前瘦身。', 'Processes SVG with the SVGO engine: removes comments, redundant attributes and extra groups, and optimizes paths. "Pretty" reformats to multi-line indentation, "Minify" produces a single-line minimum-size file — great for slimming SVGs before publishing.'],
  'SVG 源码': ['SVG 原始碼', 'SVG source'],
  '读取 .svg 文件': ['讀取 .svg 檔案', 'Read .svg file'],
  '粘贴 SVG 代码, 或读取本地 .svg 文件…': ['貼上 SVG 程式碼, 或讀取本機 .svg 檔案…', 'Paste SVG code, or read a local .svg file…'],
  '优化选项与结果': ['最佳化選項與結果', 'Options & result'],
  '压缩 (单行)': ['壓縮 (單行)', 'Minify (one line)'],
  '美化 (多行)': ['美化 (多行)', 'Pretty (multi-line)'],
  '优化中…': ['最佳化中…', 'Optimizing…'],
  '处理失败': ['處理失敗', 'Processing failed'],
  '节省 {a} B ({p}%)': ['節省 {a} B ({p}%)', 'Saved {a} B ({p}%)'],
  '体积无变化': ['體積無變化', 'No size change'],
  '下载 .svg': ['下載 .svg', 'Download .svg'],
  '预览:': ['預覽:', 'Preview:'],
  'SVG 预览': ['SVG 預覽', 'SVG preview'],
  '输入 SVG 后自动优化。文件 → 网络: 平均可缩小 30%~60%。': ['輸入 SVG 後自動最佳化。檔案 → 網路: 平均可縮小 30%~60%。', 'SVG is optimized automatically as you type. File → web: typically 30%~60% smaller.'],
  '已读取 {name} ({c} 字符)': ['已讀取 {name} ({c} 字元)', '{name} loaded ({c} characters)'],
};

export const u = (locale: string, zh: string): string => {
  const hit = D[zh];
  if (!hit) return zh;
  return locale === 'zh-TW' ? hit[0] : locale === 'en' ? hit[1] : zh;
};

export const uT = (locale: string, zhTpl: string, vars?: Record<string, string | number>): string => {
  let out = u(locale, zhTpl);
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
  return out;
};
