// GridPaper 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '格子紙' },
  en: { appName: 'Grid Paper' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const rows: Record<string, [string, string]> = {
  // 工具栏 / 操作
  '打印 {p}': ['列印 {p}', 'Print {p}'],
  '已打开打印对话框, 选择打印机即可打印': [
    '已開啟列印對話框, 選擇印表機即可列印',
    'Print dialog opened — choose your printer',
  ],
  '打印失败: 当前环境不支持打印': [
    '列印失敗: 目前環境不支援列印',
    'Print failed: printing is not supported here',
  ],

  // 设置项
  '纸张设置': ['紙張設定', 'Paper & grid'],
  '纸张': ['紙張', 'Paper'],
  '方向': ['方向', 'Orientation'],
  '纵向': ['縱向', 'Portrait'],
  '横向': ['橫向', 'Landscape'],
  '格型': ['格型', 'Pattern'],
  '方格': ['方格', 'Grid'],
  '点阵': ['點陣', 'Dots'],
  '横线': ['橫線', 'Lines'],
  '格子大小': ['格子大小', 'Cell size'],
  '常用': ['常用', 'Presets'],
  '页边距': ['頁邊距', 'Margin'],
  '线宽': ['線寬', 'Line width'],
  '线色': ['線色', 'Line colour'],
  '页数': ['頁數', 'Pages'],
  '加粗间隔': ['加粗間隔', 'Major line every'],
  '灰色': ['灰色', 'Gray'],
  '蓝色': ['藍色', 'Blue'],
  '淡绿': ['淡綠', 'Light green'],
  '淡红': ['淡紅', 'Light red'],

  // 统计与提示
  '每页格子': ['每頁格子', 'Cells per page'],
  '总页数': ['總頁數', 'Total pages'],
  '格子 {c}mm · 每页 {cols} × {rows} = {n} 格': [
    '格子 {c}mm · 每頁 {cols} × {rows} = {n} 格',
    'Cell {c}mm · {cols} × {rows} = {n} cells per page',
  ],
  '加粗间隔为 0 表示不加粗; 设为 N 时每 N 格加深一条线, 方便分块书写': [
    '加粗間隔為 0 表示不加粗; 設為 N 時每 N 格加深一條線, 方便分塊書寫',
    '0 disables major lines; set N to make every Nth line thicker for blocking out areas',
  ],
  '打印时请把纸张设为 {p}, 缩放保持 100% (实际大小), 否则格子边长会不准': [
    '列印時請把紙張設為 {p}, 縮放保持 100% (實際大小), 否則格子邊長會不準',
    'Set the printer paper to {p} and keep scaling at 100% (actual size), otherwise the cell size will be off',
  ],
  '5mm 适合工程笔记, 3mm 更密适合密集型笔记, 8 / 10mm 适合草图': [
    '5mm 適合工程筆記, 3mm 更密適合密集型筆記, 8 / 10mm 適合草圖',
    '5mm suits engineering notes, 3mm is denser, 8 / 10mm suits sketches',
  ],

  // 预览 / 说明
  '打印预览 ({p})': ['列印預覽 ({p})', 'Print preview ({p})'],
  '格子纸说明': ['格子紙說明', 'About grid paper'],
};

// 取词: 无命中回退 zh 原文
export const gp = (locale: string, zh: string): string => {
  const e = rows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};

export const gpT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = gp(locale, zh);
  if (v) for (const [k, val] of Object.entries(v)) s = s.split('{' + k + '}').join(String(val));
  return s;
};
