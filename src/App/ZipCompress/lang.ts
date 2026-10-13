// ZipCompress 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: 'Zip 壓縮' },
  en: { appName: 'Zip Compress' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const ziplangRows: Record<string, [string, string]> = {
  '点击选择文件, 或把文件 / 文件夹拖到这里': [
    '點擊選擇檔案，或把檔案 / 資料夾拖到這裡',
    'Click to choose files, or drag files / folders here',
  ],
  '松开鼠标即可添加文件': ['放開滑鼠即可加入檔案', 'Release to add the files'],
  '选择文件': ['選擇檔案', 'Choose files'],
  '选择文件夹': ['選擇資料夾', 'Choose folder'],
  '清空': ['清空', 'Clear'],
  '待打包文件': ['待打包檔案', 'Files to pack'],
  '还没有添加文件': ['還沒有加入檔案', 'No files added yet'],
  '共 {n} 个文件, {size}': ['共 {n} 個檔案, {size}', '{n} files, {size}'],
  '删除': ['刪除', 'Remove'],
  '请先添加要打包的文件': ['請先加入要打包的檔案', 'Add some files to pack first'],
  '压缩级别': ['壓縮級別', 'Compression level'],
  '仅存储 (不压缩)': ['僅儲存 (不壓縮)', 'Store only (no compression)'],
  '最快': ['最快', 'Fastest'],
  '默认': ['預設', 'Default'],
  '最小 (最慢)': ['最小 (最慢)', 'Smallest (slowest)'],
  '压缩级别说明: 0 仅存储 (最快, 包最大), 6 默认, 9 体积最小但最慢; 已压缩过的文件 (jpg / mp4 / zip) 再压缩收益很小': [
    '壓縮級別說明: 0 僅儲存 (最快，封裝檔最大), 6 預設, 9 體積最小但最慢; 已壓縮過的檔案 (jpg / mp4 / zip) 再壓縮收益很小',
    'Level 0 stores without compressing (fastest, largest), 6 is the default and 9 gives the smallest archive but is the slowest; re-compressing already-compressed files (jpg / mp4 / zip) barely helps',
  ],
  '输出文件名': ['輸出檔名', 'Output file name'],
  '保留文件夹结构': ['保留資料夾結構', 'Keep folder structure'],
  '打包并下载': ['打包並下載', 'Pack & download'],
  '正在打包…': ['正在打包…', 'Packing…'],
  '压缩包已生成: {name} ({n} 个文件, {src} → {dst}, 节省 {pct}%)': [
    '壓縮包已產生: {name} ({n} 個檔案, {src} → {dst}, 節省 {pct}%)',
    'Archive created: {name} ({n} files, {src} → {dst}, {pct}% smaller)',
  ],
  '打包失败: {msg}': ['打包失敗: {msg}', 'Packing failed: {msg}'],
  '已添加 {n} 个文件': ['已加入 {n} 個檔案', 'Added {n} files'],
  '读取文件失败: {msg}': ['讀取檔案失敗: {msg}', 'Failed to read the file: {msg}'],
  '文件太多, 只添加了前 {n} 个': ['檔案太多，只加入了前 {n} 個', 'Too many files — only the first {n} were added'],
  '重名文件会自动加序号 (不会互相覆盖)': [
    '同名檔案會自動加序號 (不會互相覆蓋)',
    'Duplicate names get a number suffix (nothing is overwritten)',
  ],
  'Zip 压缩说明': ['Zip 壓縮說明', 'About Zip Compress'],
  '引入的文件列表里没有文件': ['引入的檔案列表裡沒有檔案', 'The selection contained no files'],
  '把多个文件 / 文件夹打包成一个 zip, 全部在本地浏览器 / WebView 内完成 (JSZip), 文件不会上传到任何服务器。': [
    '把多個檔案 / 資料夾打包成一個 zip，全部在本機瀏覽器 / WebView 內完成 (JSZip)，檔案不會上傳到任何伺服器。',
    'Packs multiple files / folders into one zip entirely inside your local browser / WebView (JSZip) — nothing is uploaded anywhere.',
  ],
  '拖入文件夹会保留目录层级 (包内路径与源目录一致); 取消勾选「保留文件夹结构」则只保留文件名, 重名自动加序号。': [
    '拖入資料夾會保留目錄層級 (封裝檔內路徑與來源目錄一致)；取消勾選「保留資料夾結構」則只保留檔名，同名自動加序號。',
    'Dropped folders keep their directory structure (archive paths match the source folder); uncheck “Keep folder structure” to keep file names only — duplicates get a number suffix.',
  ],
  '包内文件名按 UTF-8 写入并带 UTF-8 标志位, Windows 资源管理器 / macOS 解压都不会乱码。': [
    '封裝檔內檔名按 UTF-8 寫入並帶 UTF-8 標誌位，Windows 檔案總管 / macOS 解壓都不會亂碼。',
    'File names inside the archive are written as UTF-8 with the UTF-8 flag, so Windows Explorer and macOS both unpack them correctly.',
  ],
  '整个压缩包在内存中生成, 超大文件 (单个数百 MB 以上) 需注意内存占用。': [
    '整個壓縮包在記憶體中產生，超大檔案 (單數百 MB 以上) 需注意記憶體佔用。',
    'The whole archive is built in memory — mind the memory usage when packing files of several hundred MB.',
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
