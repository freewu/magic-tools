// JSON5Formatter 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  en: { appName: "JSON5 Formatter" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '复制': ['複製', 'Copy'],
  '复制到粘贴板成功！！！': ['複製到剪貼簿成功！！！', 'Copied to clipboard!!!'],
  '2 空格': ['2 空格', '2 spaces'],
  '数组': ['陣列', 'Array'],
  '对象': ['物件', 'Object'],
  '请先输入 JSON5 字符串': ['請先輸入 JSON5 字串', 'Enter a JSON5 string first'],
  'JSON5 解析失败: {m}': ['JSON5 解析失敗: {m}', 'JSON5 parse failed: {m}'],
  '请先格式化 JSON5 再保存': ['請先格式化 JSON5 再儲存', 'Format the JSON5 before saving'],
  'JSON5 文件': ['JSON5 檔案', 'JSON5 file'],
  '已保存 JSON5 文件': ['已儲存 JSON5 檔案', 'JSON5 file saved'],
  '保存失败: {m}': ['儲存失敗: {m}', 'Save failed: {m}'],
  '请选择 .json5 / .json 文件': ['請選擇 .json5 / .json 檔案', 'Please choose a .json5 / .json file'],
  '格式化后的 JSON5 将显示在这里（每行左侧带行号，点击结果可复制）': ['格式化後的 JSON5 將顯示在這裡（每行左側帶行號，點擊結果可複製）', 'The formatted JSON5 appears here (line numbers on the left; click the result to copy it)'],
  '先在上方输入 JSON5 并点击「格式化」，即可在此折叠/展开查看结构': ['先在上方輸入 JSON5 並點擊「格式化」，即可在此摺疊/展開檢視結構', 'Enter JSON5 above and click Format, then fold/expand the structure here'],
  '行号': ['行號', 'Line numbers'],
  '点击复制内容到粘贴板': ['點擊複製內容到剪貼簿', 'Click to copy'],
  '格式化': ['格式化', 'Format'],
  '转一行': ['轉一行', 'Minify'],
  '保存为 .json': ['儲存為 .json', 'Save as .json'],
  '保存为 .json5': ['儲存為 .json5', 'Save as .json5'],
  '打开 .json': ['開啟 .json', 'Open .json'],
  '打开 .json5': ['開啟 .json5', 'Open .json5'],
  '输入 JSON5 字符串 (支持注释 // /* */、单引号、无引号键名、尾逗号)  或拖拽 .json5 文件到框内打开': ['輸入 JSON5 字串 (支援註解 // /* */、單引號、無引號鍵名、尾逗號)  或拖曳 .json5 檔案到框內開啟', 'Enter a JSON5 string (comments // /* */, single quotes, unquoted keys and trailing commas are supported), or drop a .json5 file into the box'],
  '文本（行号）': ['文字（行號）', 'Text (line numbers)'],
  '树形折叠': ['樹形摺疊', 'Tree view'],
  '左': ['左', 'Left'],
  '读': ['讀', 'Read'],
  '数字': ['數字', 'Numeric'],
  '十六进制': ['十六進位', 'Hexadecimal'],
  '+1': ['+1', '+1'],
  '高': ['高', 'Height'],
  'px': ['px', 'px'],
  'r:': ['r:', 'r:'],
  'p:': ['p:', 'p:'],
  '字符': ['字元', 'Characters'],
  '清除': ['清除', 'Clear'],
  '标准': ['標準', 'Standard'],
  '解析': ['解析', 'Parse'],
  '每': ['每', 'Every'],
  '分': ['分', 'm'],
  '时': ['時', 'h'],
  '解析失败': ['解析失敗', 'Parse failed'],
  '或': ['或', 'OR'],
};

// 取词: 无命中回退 zh 原文 (与共享 ui-lang 行为一致)
export const u = (locale: string, zh: string): string => {
  const hit = uilangRows[zh];
  if (!hit) return zh;
  return locale === 'zh-TW' ? hit[0] : locale === 'en' ? hit[1] : zh;
};
export const uT = (locale: string, zhTpl: string, vars?: Record<string, string | number>): string => {
  let out = u(locale, zhTpl);
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
  return out;
};

