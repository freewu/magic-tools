// SudokuGenerator 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '數獨產生器' },
  en: { appName: 'Sudoku Generator' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const rows: Record<string, [string, string]> = {
  // 工具栏 / 设置
  '重新生成': ['重新產生', 'Regenerate'],
  '打印 A4': ['列印 A4', 'Print A4'],
  '生成中…': ['產生中…', 'Generating…'],
  '数独设置': ['數獨設定', 'Sudoku settings'],
  '打印预览 (A4)': ['列印預覽 (A4)', 'Print preview (A4)'],
  '宫格': ['宮格', 'Grid'],
  '难度': ['難度', 'Difficulty'],
  '高': ['高', 'Hard'],
  '中': ['中', 'Medium'],
  '低': ['低', 'Easy'],
  '页数': ['頁數', 'Pages'],
  '打印内容': ['列印內容', 'Print content'],
  '仅题目': ['僅題目', 'Puzzle only'],
  '仅答案 (红色)': ['僅答案 (紅色)', 'Answers only (red)'],
  '题目 + 答案': ['題目 + 答案', 'Puzzle + answers'],
  '标题': ['標題', 'Title'],
  '显示姓名 / 日期栏': ['顯示姓名 / 日期欄', 'Show name / date row'],
  // 题型
  '4 宫格': ['4 宮格', '4×4'],
  '6 宫格': ['6 宮格', '6×6'],
  '9 宫格': ['9 宮格', '9×9'],
  // 打印文案 (进入打印页 HTML)
  '答案': ['答案', 'Answers'],
  '第 {n} 题': ['第 {n} 題', 'Puzzle {n}'],
  '姓名: ____________ 日期: ____________ 用时: ______ 分': [
    '姓名: ____________ 日期: ____________ 用時: ______ 分',
    'Name: ____________ Date: ____________ Time: ______ min',
  ],
  '第 {a} / {b} 页 · {d}': ['第 {a} / {b} 頁 · {d}', 'Page {a} / {b} · {d}'],
  // 状态 / 统计
  '提示数': ['提示數', 'Clues'],
  '耗时': ['耗時', 'Time'],
  '宫格 {side}mm · 单格 {cell}mm': ['宮格 {side}mm · 單格 {cell}mm', '{side}mm grid · {cell}mm cell'],
  '共生成 {n} 道题 · {p} 页': ['共產生 {n} 道題 · {p} 頁', '{n} puzzles · {p} pages'],
  '每页 {n} 题': ['每頁 {n} 題', '{n} per page'],
  '提示数 {a} ~ {b}': ['提示數 {a} ~ {b}', '{a} ~ {b} clues'],
  '生成用时 {ms} ms': ['產生用時 {ms} ms', 'Generated in {ms} ms'],
  '已打开打印对话框, 选择打印机即可打印': ['已開啟列印對話框, 選擇印表機即可列印', 'Print dialog opened — choose your printer'],
  '打印失败: 当前环境不支持打印': ['列印失敗: 目前環境不支援列印', 'Print failed: printing is not supported here'],
  '红色数字为答案, 黑色为题目原有提示数': ['紅色數字為答案, 黑色為題目原有提示數', 'Red digits are the answers, black digits are the given clues'],
  '所有题目均为唯一解; 提示数越少难度越高': ['所有題目均為唯一解; 提示數越少難度越高', 'Every puzzle has a unique solution; fewer clues means higher difficulty'],
  '浏览器/WebView 打印时可选择打印机, 也可「另存为 PDF」': ['瀏覽器/WebView 列印時可選擇印表機, 也可「另存為 PDF」', 'In the print dialog you can pick a printer, or save as PDF'],
  '数独生成器说明': ['數獨產生器說明', 'About the Sudoku generator'],
};

// 取词: 无命中回退 zh 原文
export const sd = (locale: string, zh: string): string => {
  const e = rows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};

export const sdT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = sd(locale, zh);
  if (v) for (const [k, val] of Object.entries(v)) s = s.split('{' + k + '}').join(String(val));
  return s;
};
