// CodeShot 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "程式碼截圖" },
  en: { appName: "Code Screenshot" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const imagelangRows: Record<string, [string, string]> = {
  '清除': ['清除', 'Clear'],
  '预览': ['預覽', 'Preview'],
  '清空': ['清空', 'Clear'],
  '尺寸': ['尺寸', 'Size'],
  '高': ['高', 'H'],
  '默认': ['預設', 'Default'],
  '生成图片': ['產生圖片', 'Generate'],
  '代码截图': ['程式碼截圖', 'Code Screenshot'],
  'Shiki 语法高亮 + 一键导出 PNG。支持全部内置语言（常用语言置顶），编辑器风格可选 Mac / VSCode / IntelliJ / Sublime / Vim / Emacs，明暗自适应配色，默认值均可在「设置 → 其它」中调整。': ['Shiki 語法高亮 + 一鍵匯出 PNG。支援全部內建語言（常用語言置頂），編輯器風格可選 Mac / VSCode / IntelliJ / Sublime / Vim / Emacs，明暗自適應配色，預設值均可在「設定 → 其它」中調整。', 'Shiki syntax highlighting with one-click PNG export. All built-in languages are supported (common ones on top); editor styles include Mac / VSCode / IntelliJ / Sublime / Vim / Emacs with light/dark-adaptive themes. Defaults can be changed under Settings → Other.'],
  '代码与外观': ['程式碼與外觀', 'Code & appearance'],
  '载入示例': ['載入範例', 'Load sample'],
  '语言': ['語言', 'Language'],
  '常用': ['常用', 'Common'],
  '全部 ({n})': ['全部 ({n})', 'All ({n})'],
  '编辑器': ['編輯器', 'Editor'],
  '外观': ['外觀', 'Appearance'],
  '深色': ['深色', 'Dark'],
  '浅色': ['淺色', 'Light'],
  '内边距': ['內邊距', 'Padding'],
  '显示行号': ['顯示行號', 'Show line numbers'],
  '粘贴需要截图的代码…': ['貼上需要截圖的程式碼…', 'Paste the code you want to capture…'],
  '截图预览': ['截圖預覽', 'Preview'],
  '导出 PNG': ['匯出 PNG', 'Export PNG'],
  '已导出 PNG': ['已匯出 PNG', 'PNG exported'],
  '导出失败: {msg}': ['匯出失敗: {msg}', 'Export failed: {msg}'],
  '高亮失败': ['高亮失敗', 'Highlighting failed'],
  '高亮中…': ['高亮中…', 'Highlighting…'],
  '导出尺寸 = 截图内容实际像素 × 2 (pixelRatio); 行号随行对齐并随 PNG 一并导出。若内边距较小时圆角会自动收小, 避免代码压弧产生暗圈。': ['匯出尺寸 = 截圖內容實際像素 × 2 (pixelRatio); 行號隨行對齊並隨 PNG 一併匯出。若內邊距較小時圓角會自動縮小, 避免程式碼壓弧產生暗圈。', 'Export size = the actual pixels of the captured content × 2 (pixelRatio); line numbers stay aligned with lines and are exported with the PNG. When padding is small the corner radius shrinks so the code never touches the arc edge.'],
  '输入代码后实时预览，点击「导出 PNG」生成图片。': ['輸入程式碼後即時預覽，點擊「匯出 PNG」產生圖片。', 'Preview updates live as you type — click Export PNG to generate the image.'],
  '显示': ['顯示', 'Show'],
};

// 取词: 无命中回退 zh 原文 (与共享 image-lang 行为一致)
export const im = (locale: string, zh: string): string => {
  const e = imagelangRows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const imT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = im(locale, zh);
  if (v) for (const [k, val] of Object.entries(v)) s = s.split('{'+k+'}').join(String(val));
  return s;
};

