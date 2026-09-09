// JsonFormatter 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  en: { appName: "JSON Formatter" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '复制': ['複製', 'Copy'],
  '复制到粘贴板成功！！！': ['複製到剪貼簿成功！！！', 'Copied to clipboard!!!'],
  '2 空格': ['2 空格', '2 spaces'],
  '数组': ['陣列', 'Array'],
  '对象': ['物件', 'Object'],
  '请先输入 JSON 字符串': ['請先輸入 JSON 字串', 'Enter a JSON string first'],
  'JSON 解析失败: {m}': ['JSON 解析失敗: {m}', 'JSON parse failed: {m}'],
  '请先格式化 JSON 再保存': ['請先格式化 JSON 再儲存', 'Format the JSON before saving'],
  'JSON 文件': ['JSON 檔案', 'JSON file'],
  '已保存 JSON 文件': ['已儲存 JSON 檔案', 'JSON file saved'],
  '保存失败: {m}': ['儲存失敗: {m}', 'Save failed: {m}'],
  '请选择 .json 文件': ['請選擇 .json 檔案', 'Please choose a .json file'],
  '格式化后的 JSON 将显示在这里（每行左侧带行号，点击结果可复制）': ['格式化後的 JSON 將顯示在這裡（每行左側帶行號，點擊結果可複製）', 'The formatted JSON appears here (line numbers on the left; click the result to copy it)'],
  '先在上方输入 JSON 并点击「格式化」，即可在此折叠/展开查看结构': ['先在上方輸入 JSON 並點擊「格式化」，即可在此摺疊/展開檢視結構', 'Enter JSON above and click Format, then fold/expand the structure here'],
  '行号': ['行號', 'Line numbers'],
  '点击复制内容到粘贴板': ['點擊複製內容到剪貼簿', 'Click to copy'],
  '格式化': ['格式化', 'Format'],
  '转一行': ['轉一行', 'Minify'],
  '保存为 .json': ['儲存為 .json', 'Save as .json'],
  '打开 .json': ['開啟 .json', 'Open .json'],
  '输入需要格式化的 JSON 字符串  或 拖拽 .json 文件到框内打开': ['輸入需要格式化的 JSON 字串  或 拖曳 .json 檔案到框內開啟', 'Enter the JSON to format, or drop a .json file into the box'],
  '文本（行号）': ['文字（行號）', 'Text (line numbers)'],
  '树形折叠': ['樹形摺疊', 'Tree view'],
  '左': ['左', 'Left'],
  '数字': ['數字', 'Numeric'],
  '高': ['高', 'Height'],
  'px': ['px', 'px'],
  '生成': ['產生', 'Generate'],
  'r:': ['r:', 'r:'],
  '字符': ['字元', 'Characters'],
  '清除': ['清除', 'Clear'],
  '个': ['個', ''],
  '解析': ['解析', 'Parse'],
  '每': ['每', 'Every'],
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

