// ZipExtract 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: 'Zip 解壓' },
  en: { appName: 'Zip Extract' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const ziplangRows: Record<string, [string, string]> = {
  '点击选择压缩包, 或把 .zip 文件拖到这里': [
    '點擊選擇壓縮包，或把 .zip 檔案拖到這裡',
    'Click to choose an archive, or drag a .zip file here',
  ],
  '松开鼠标即可载入压缩包': ['放開滑鼠即可載入壓縮包', 'Release to load the archive'],
  '选择压缩包': ['選擇壓縮包', 'Choose archive'],
  '清空': ['清空', 'Clear'],
  '还没有载入压缩包': ['還沒有載入壓縮包', 'No archive loaded yet'],
  '文件名编码': ['檔名編碼', 'File name encoding'],
  '自动识别 (推荐)': ['自動辨識 (推薦)', 'Auto detect (recommended)'],
  '繁体中文 (Big5)': ['繁體中文 (Big5)', 'Traditional Chinese (Big5)'],
  '简体中文 (GBK)': ['簡體中文 (GBK)', 'Simplified Chinese (GBK)'],
  '文件名编码说明: 老版 Windows 压缩工具常按 GBK 写文件名且不带 UTF-8 标志位, 出现乱码时切到 GBK 或自动识别': [
    '檔名編碼說明: 舊版 Windows 壓縮工具常按 GBK 寫檔名且不帶 UTF-8 標誌位，出現亂碼時切到 GBK 或自動辨識',
    'Old Windows archivers often store file names in GBK without the UTF-8 flag — switch to GBK or auto detect when names look garbled',
  ],
  '压缩包内容': ['壓縮包內容', 'Archive contents'],
  '全选': ['全選', 'Select all'],
  '反选': ['反選', 'Invert'],
  '取消选择': ['取消選擇', 'Deselect'],
  '解压选中': ['解壓選中', 'Extract selected'],
  '正在解压…': ['正在解壓…', 'Extracting…'],
  '下载': ['下載', 'Download'],
  '预览': ['預覽', 'Preview'],
  '名称': ['名稱', 'Name'],
  '大小': ['大小', 'Size'],
  '压缩后': ['壓縮後', 'Packed'],
  '修改时间': ['修改時間', 'Modified'],
  '目录': ['目錄', 'Folder'],
  '已截断, 仅预览前 {size}': ['已截斷，僅預覽前 {size}', 'Truncated — previewing the first {size}'],
  '无法预览二进制文件, 请直接下载后查看': [
    '無法預覽二進位檔案，請直接下載後查看',
    'Cannot preview a binary file — download it and open it instead',
  ],
  '读取条目失败: {msg}': ['讀取條目失敗: {msg}', 'Failed to read the entry: {msg}'],
  '压缩包解析失败: {msg}': ['壓縮包解析失敗: {msg}', 'Failed to parse the archive: {msg}'],
  '压缩包过大 ({size}), 请选择小于 {max} 的文件': [
    '壓縮包過大 ({size})，請選擇小於 {max} 的檔案',
    'Archive too large ({size}) — please pick one below {max}',
  ],
  '读取压缩包失败: {msg}': ['讀取壓縮包失敗: {msg}', 'Failed to read the archive: {msg}'],
  '请先选择要解压的文件': ['請先選擇要解壓的檔案', 'Select the files to extract first'],
  '已解压 {n} 个文件': ['已解壓 {n} 個檔案', 'Extracted {n} files'],
  '解压失败: {msg}': ['解壓失敗: {msg}', 'Extraction failed: {msg}'],
  '解压完成: 已写入 {n} 个文件': ['解壓完成: 已寫入 {n} 個檔案', 'Done: {n} files written'],
  '有 {n} 个文件写入失败, 详见控制台': ['有 {n} 個檔案寫入失敗，詳見控制台', '{n} files failed to write — see the console'],
  '共 {n} 个文件, {d} 个目录, 原始 {src} → 压缩后 {dst} (节省 {pct}%)': [
    '共 {n} 個檔案, {d} 個目錄, 原始 {src} → 壓縮後 {dst} (節省 {pct}%)',
    '{n} files, {d} folders, {src} → {dst} ({pct}% smaller)',
  ],
  '已选 {n} 个文件, {size}': ['已選 {n} 個檔案, {size}', '{n} files selected, {size}'],
  '含不安全路径 (../ 或绝对路径, 已自动剥离) 的条目: {n} 个': [
    '含不安全路徑 (../ 或絕對路徑，已自動剝離) 的條目: {n} 個',
    'Entries with unsafe paths (../ or absolute paths, already stripped): {n}',
  ],
  '只显示前 {n} 个条目 (不影响解压整包)': [
    '只顯示前 {n} 個條目 (不影響解壓整包)',
    'Showing the first {n} entries only (extraction still covers everything selected)',
  ],
  '空目录不会单独创建, 解压时按需建立上级目录': [
    '空目錄不會單獨建立，解壓時按需建立上級目錄',
    'Empty folders are not created separately — parent folders are made on demand',
  ],
  'Zip 解压说明': ['Zip 解壓說明', 'About Zip Extract'],
  '解析并解压 zip 压缩包, 全部在本地浏览器 / WebView 内完成 (JSZip), 压缩包不会上传到任何服务器。': [
    '解析並解壓 zip 壓縮包，全部在本機瀏覽器 / WebView 內完成 (JSZip)，壓縮包不會上傳到任何伺服器。',
    'Parses and extracts zip archives entirely inside your local browser / WebView (JSZip) — nothing is uploaded anywhere.',
  ],
  '桌面版点「解压选中」后选择一个目标文件夹, 会按包内目录层级写入文件; Web 演示版会逐个触发下载 (浏览器会拍平层级, 只保留文件名)。': [
    '桌面版點「解壓選中」後選取一個目標資料夾，會依封裝檔內目錄層級寫入檔案；Web 示範版會逐個觸發下載 (瀏覽器會拍平層級，只保留檔名)。',
    'On desktop “Extract selected” asks for a destination folder and writes files with their original folder structure; the web demo triggers one download per file (browsers flatten folders and keep file names only).',
  ],
  '包内路径中的 ../ 与绝对路径会被自动剥离 (防 zip-slip), 不会写到目标目录之外。': [
    '封裝檔內路徑中的 ../ 與絕對路徑會被自動剝離 (防 zip-slip)，不會寫到目標目錄之外。',
    'Leading “../” and absolute paths inside the archive are stripped (zip-slip protection) so nothing is written outside the destination folder.',
  ],
  '文本与图片条目支持在线预览, 其余类型请下载后查看; 超大压缩包需注意内存占用。': [
    '文字與圖片條目支援線上預覽，其餘類型請下載後查看；超大壓縮包需注意記憶體佔用。',
    'Text and image entries can be previewed in place; download other types to inspect them. Mind the memory usage with very large archives.',
  ],
};

// 取词: 无命中回退 zh 原文
export const im = (locale: string, zh: string): string => {
  const e = ziplangRows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};

export const imT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = im(locale, zh);
  if (v) for (const [k, val] of Object.entries(v)) s = s.split('{' + k + '}').join(String(val));
  return s;
};
