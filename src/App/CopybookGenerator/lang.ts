// CopybookGenerator 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '字帖產生器' },
  en: { appName: 'Copybook Generator' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const rows: Record<string, [string, string]> = {
  // 工具栏 / 设置
  '打印 A4': ['列印 A4', 'Print A4'],
  '字帖设置': ['字帖設定', 'Copybook settings'],
  '打印预览 (A4)': ['列印預覽 (A4)', 'Print preview (A4)'],
  '格子样式': ['格子樣式', 'Grid style'],
  '字体': ['字型', 'Font'],
  '上传字体': ['上傳字型', 'Upload font'],
  '移除自定义字体': ['移除自訂字型', 'Remove custom font'],
  '内容模式': ['內容模式', 'Content mode'],
  '格线颜色': ['格線顏色', 'Grid line color'],
  '每行格数': ['每行格數', 'Columns'],
  '每页行数': ['每頁行數', 'Rows per page'],
  '页数': ['頁數', 'Pages'],
  '格间距': ['格間距', 'Cell gap'],
  '文本': ['文字', 'Text'],
  '循环填充': ['循環填充', 'Repeat to fill'],
  '标题': ['標題', 'Title'],
  '显示姓名 / 日期栏': ['顯示姓名 / 日期欄', 'Show name / date row'],
  // 格型 / 字体 / 颜色 / 模式
  '米字格': ['米字格', 'Mi-grid'],
  '田字格': ['田字格', 'Tian-grid'],
  '回宫格': ['回宮格', 'Hui-grid'],
  '作文格': ['作文格', 'Essay grid'],
  '楷体': ['楷體', 'KaiTi'],
  '行楷': ['行楷', 'Xingkai'],
  '隶书': ['隸書', 'LiSu'],
  '宋体': ['宋體', 'SimSun'],
  '黑体': ['黑體', 'SimHei'],
  '仿宋': ['仿宋', 'FangSong'],
  '微软雅黑': ['微軟雅黑', 'Microsoft YaHei'],
  '自定义字体': ['自訂字型', 'Custom font'],
  '红色': ['紅色', 'Red'],
  '灰色': ['灰色', 'Gray'],
  '蓝色': ['藍色', 'Blue'],
  '淡绿': ['淡綠', 'Light green'],
  '描红 (浅灰)': ['描紅 (淺灰)', 'Trace (light gray)'],
  '黑字': ['黑字', 'Ink'],
  '首字示范': ['首字示範', 'First char only'],
  '空白格': ['空白格', 'Blank'],
  // 打印文案 (进入打印页 HTML)
  '姓名: ________ 日期: ________': ['姓名: ________ 日期: ________', 'Name: ________ Date: ________'],
  '第 {a} / {b} 页 · {d}': ['第 {a} / {b} 頁 · {d}', 'Page {a} / {b} · {d}'],
  // 状态 / 统计
  '每格 {cell}mm · 每页 {n} 格': ['每格 {cell}mm · 每頁 {n} 格', '{cell}mm per cell · {n} per page'],
  '共 {n} 格 · {c} 字': ['共 {n} 格 · {c} 字', '{n} cells · {c} characters'],
  '共 {n} 格 · {c} 字 (不循环: 仅前 {c} 格有字)': [
    '共 {n} 格 · {c} 字 (不循環: 僅前 {c} 格有字)',
    '{n} cells · {c} characters (no repeat: only the first {c} cells are filled)',
  ],
  '已打开打印对话框, 选择打印机即可打印': ['已開啟列印對話框, 選擇印表機即可列印', 'Print dialog opened — choose your printer'],
  '打印失败: 当前环境不支持打印': ['列印失敗: 目前環境不支援列印', 'Print failed: printing is not supported here'],
  '字体文件过大 (上限 12MB)': ['字型檔案過大 (上限 12MB)', 'Font file is too large (12MB limit)'],
  '字体读取失败': ['字型讀取失敗', 'Failed to read the font file'],
  '已载入自定义字体: {name}': ['已載入自訂字型: {name}', 'Custom font loaded: {name}'],
  '浅灰色为描红字, 可沿格线描写; 深色为范字': ['淺灰色為描紅字, 可沿格線描寫; 深色為範字', 'Light gray characters are for tracing; dark ones are models'],
  '文本会按空格 / 标点自动逐字拆分, 不足时循环填充 (可关闭)': [
    '文字會依空格 / 標點自動逐字拆分, 不足時循環填充 (可關閉)',
    'The text is split per character; when it runs out it repeats unless "Repeat to fill" is off',
  ],
  '可上传 ttf / otf / woff / woff2 字体文件, 仅在本地使用, 不会上传': [
    '可上傳 ttf / otf / woff / woff2 字型檔案, 僅在本機使用, 不會上傳',
    'You can upload a ttf / otf / woff / woff2 file; it is used locally only and never uploaded',
  ],
  '字帖生成器说明': ['字帖產生器說明', 'About the copybook generator'],
};

// 取词: 无命中回退 zh 原文
export const cb = (locale: string, zh: string): string => {
  const e = rows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};

export const cbT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = cb(locale, zh);
  if (v) for (const [k, val] of Object.entries(v)) s = s.split('{' + k + '}').join(String(val));
  return s;
};
