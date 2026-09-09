// DotMatrixFont 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "點陣字生成器" },
  en: { appName: "Dot Matrix Font Generator" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '已复制': ['已複製', 'Copied'],
  '复制': ['複製', 'Copy'],
  '{n} 字符': ['{n} 字元', '{n} characters'],
  '数组': ['陣列', 'Array'],
  '保存失败: {m}': ['儲存失敗: {m}', 'Save failed: {m}'],
  '行号': ['行號', 'Line numbers'],
  '格式化': ['格式化', 'Format'],
  '左': ['左', 'Left'],
  '右': ['右', 'Right'],
  '写': ['寫', 'Write'],
  '宽': ['寬', 'Width'],
  '高': ['高', 'Height'],
  'px': ['px', 'px'],
  '宽高比': ['寬高比', 'Aspect ratio'],
  '生成': ['產生', 'Generate'],
  '字节': ['位元組', 'bytes'],
  '位': ['位', 'bits'],
  'r:': ['r:', 'r:'],
  '规格': ['規格', 'Size'],
  '字符': ['字元', 'Characters'],
  '输入字符, 多个自动去重, 如: 中A8': ['輸入字元, 多個自動去重, 如: 中A8', 'Enter characters; duplicates are removed automatically, e.g. 中A8'],
  '取模方式': ['取模方式', 'Extraction mode'],
  '逐行式': ['逐行式', 'Row-wise'],
  '逐列式': ['逐列式', 'Column-wise'],
  '位序': ['位序', 'Bit order'],
  '高位在前': ['高位在前', 'MSB first'],
  '低位在前': ['低位在前', 'LSB first'],
  '反色 (取白)': ['反色 (取白)', 'Invert (white sampled as on)'],
  '阈值': ['閾值', 'Threshold'],
  '生成取模代码': ['產生取模程式碼', 'Generate code'],
  '复制代码': ['複製程式碼', 'Copy code'],
  '下载 .h': ['下載 .h', 'Download .h'],
  '清除结果': ['清除結果', 'Clear result'],
  '请输入需要取模的字符 (可多个, 自动去重)': ['請輸入需要取模的字元 (可多個, 自動去重)', 'Enter characters to extract (multiple allowed, duplicates removed)'],
  '当前环境不支持 Canvas 字形采样': ['目前環境不支援 Canvas 字形取樣', 'Canvas glyph sampling is not supported in this environment'],
  '已为 {n} 个字符生成取模代码': ['已為 {n} 個字元產生取模程式碼', 'Generated bitmaps for {n} character(s)'],
  '取模代码已复制到粘贴板': ['取模程式碼已複製到剪貼簿', 'Code copied to clipboard'],
  '保存字库头文件': ['儲存字庫標頭檔', 'Save font header'],
  '已保存 .h 文件': ['已儲存 .h 檔案', '.h file saved'],
  '字形按系统字体渲染后以 {w}×{h} 网格采样 (取每格中心判定), 与所选系统字体相关, 与标准字库字形可能有差异; 如需精确标准点阵字库请用字库文件/专业取模软件。': ['字形依系統字型轉譯後以 {w}×{h} 網格取樣 (取每格中心判定), 與所選系統字型相關, 與標準字庫字形可能有差異; 如需精確標準點陣字庫請使用字庫檔/專業取模軟體。', 'Glyphs are rendered with the system font, then sampled on a {w}×{h} grid (center of each cell). Output depends on the selected font and may differ from standard font library glyphs; for exact standard bitmaps use a font file or dedicated sampling software.'],
  '预览 (仅第一个字符 “{c}”)': ['預覽 (僅第一個字元 “{c}”)', 'Preview (first character “{c}” only)'],
  '取模结果 ({n} 字符 · {w}×{h} · {m} · {b})': ['取模結果 ({n} 字元 · {w}×{h} · {m} · {b})', 'Result ({n} chars · {w}×{h} · {m} · {b})'],
  '请在输入框中输入字符后点击「生成取模代码」': ['請在輸入框中輸入字元後點擊「產生取模程式碼」', 'Enter characters in the input above, then click Generate code'],
  'C 头文件': ['C 標頭檔', 'C header'],
  '清除': ['清除', 'Clear'],
  '标准': ['標準', 'Standard'],
  '文字': ['文字', 'Text'],
  '字体': ['字體', 'Font'],
  '个': ['個', ''],
  '预览': ['預覽', 'Preview'],
  '每': ['每', 'Every'],
  '分': ['分', 'm'],
  '周': ['週', 'w'],
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

