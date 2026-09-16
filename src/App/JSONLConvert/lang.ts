// JSONLConvert 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: 'JSONL 轉換' },
  en: { appName: 'JSONL Converter' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const jcRows: Record<string, [string, string]> = {
  // 输入 / 输出
  '输入或粘贴 JSON (数组 / 对象)  或 拖拽文件到框内打开': ['輸入或貼上 JSON (陣列 / 物件), 或將檔案拖入框內開啟', 'Paste JSON (array / object), or drag & drop a file here'],
  '输入或粘贴 JSONL (每行一条 JSON)  或 拖拽文件到框内打开': ['輸入或貼上 JSONL (每列一筆 JSON), 或將檔案拖入框內開啟', 'Paste JSONL (one JSON per line), or drag & drop a file here'],
  '双击复制内容到粘贴板': ['雙擊複製內容到剪貼簿', 'Double-click to copy'],

  // 操作
  '复制结果': ['複製結果', 'Copy result'],
  '下载': ['下載', 'Download'],
  '载入示例': ['載入範例', 'Load sample'],
  '选择文件': ['選擇檔案', 'Choose file'],
  '清除': ['清除', 'Clear'],
  '缩进': ['縮排', 'Indent'],
  '2 空格': ['2 空格', '2 spaces'],
  '4 空格': ['4 空格', '4 spaces'],
  '忽略空行': ['忽略空行', 'Skip blank lines'],
  '忽略空行 (JSONL 输入)': ['忽略空行 (JSONL 輸入)', 'Skip blank lines (JSONL input)'],

  // 提示
  '请先在上方输入框粘贴或输入内容': ['請先在上方輸入框貼上或輸入內容', 'Paste or type something into the input box above first'],
  '输入框为空, 已改用下方结果框的内容': ['輸入框為空, 已改用下方結果框的內容', 'The input box was empty — using the result box below instead'],
  '检测到输入是 {kind}, 已自动按「{dir}」转换': ['偵測到輸入是 {kind}, 已自動依「{dir}」轉換', 'Input detected as {kind} — converted with "{dir}" instead'],
  'JSON 数组': ['JSON 陣列', 'a JSON array'],
  '保存失败: {msg}': ['儲存失敗: {msg}', 'Save failed: {msg}'],
  '已保存 {file}': ['已儲存 {file}', 'Saved {file}'],
  '保存 JSONL 文件': ['儲存 JSONL 檔案', 'Save JSONL file'],
  '保存 JSON 文件': ['儲存 JSON 檔案', 'Save JSON file'],
  'JSONL 文件': ['JSONL 檔案', 'JSONL file'],
  'JSON 文件': ['JSON 檔案', 'JSON file'],
  '已复制到剪贴板': ['已複製到剪貼簿', 'Copied to clipboard'],
  '已下载 {file}': ['已下載 {file}', 'Downloaded {file}'],
  '复制失败, 请手动选择文本复制': ['複製失敗, 請手動選取文字複製', 'Copy failed — please select the text and copy manually'],
  '已载入文件: {name}': ['已載入檔案: {name}', 'Loaded file: {name}'],
  '已转换 {n} 条记录 ({dir})': ['已轉換 {n} 筆記錄 ({dir})', 'Converted {n} records ({dir})'],
  '已转换 1 条记录 ({dir}, 顶层为单个值)': ['已轉換 1 筆記錄 ({dir}, 頂層為單一值)', 'Converted 1 record ({dir}; the top level is a single value)'],
  '识别到: JSON 数组 ({n} 条)': ['識別到: JSON 陣列 ({n} 筆)', 'Detected: JSON array ({n} items)'],
  '识别到: JSON 对象 (单条记录)': ['識別到: JSON 物件 (單筆記錄)', 'Detected: JSON object (a single record)'],
  '识别到: JSONL ({n} 行)': ['識別到: JSONL ({n} 行)', 'Detected: JSONL ({n} lines)'],
  '无法识别: 内容既不是完整 JSON, 也不是逐行合法的 JSONL': ['無法識別: 內容既不是完整 JSON, 也不是逐列合法的 JSONL', 'Not recognized: neither valid JSON nor line-by-line valid JSONL'],

  // 错误
  '内容为空, 请先输入 JSON 数组或 JSONL 文本': ['內容為空, 請先輸入 JSON 陣列或 JSONL 文字', 'The content is empty — paste a JSON array or JSONL text first'],
  'JSON 数组为空, 没有可转换的记录': ['JSON 陣列為空, 沒有可轉換的記錄', 'The JSON array is empty — there is nothing to convert'],
  'JSON 解析失败: {msg}': ['JSON 解析失敗: {msg}', 'JSON parse failed: {msg}'],
  '第 {n} 行不是有效的 JSON: {msg}': ['第 {n} 行不是有效的 JSON: {msg}', 'Line {n} is not valid JSON: {msg}'],
  '第 {n} 行是空行 (已关闭「忽略空行」): 空行不是合法的 JSONL': ['第 {n} 行是空行 (已關閉「忽略空行」): 空行不是合法的 JSONL', 'Line {n} is blank (Skipping blank lines is off): blank lines are not valid JSONL'],
  '整段内容是一个 JSON 数组, 请改用「JSON → JSONL」': ['整段內容是一個 JSON 陣列, 請改用「JSON → JSONL」', 'The whole input is a JSON array — use "JSON → JSONL" instead'],

  // 说明
  'JSONL 转换说明': ['JSONL 轉換說明', 'About JSONL conversion'],
  '每行一条紧凑 JSON, 便于流式读取与导入大数据平台': ['每列一筆緊湊 JSON, 便於串流讀取與匯入大資料平台', 'One compact JSON per line — ideal for streaming and big-data pipelines'],
};

// 取词: 无命中回退 zh 原文
export const jc = (locale: string, zh: string): string => {
  const e = jcRows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const jcT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = jc(locale, zh);
  if (v) for (const [ k, val ] of Object.entries(v)) s = s.split('{' + k + '}').join(String(val));
  return s;
};
