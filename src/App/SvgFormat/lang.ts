// SvgFormat 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  en: { appName: "SVG Formatter" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '已复制': ['已複製', 'Copied'],
  '载入示例': ['載入範例', 'Load sample'],
  '清空': ['清空', 'Clear'],
  '复制': ['複製', 'Copy'],
  'SVG 格式化 / 压缩': ['SVG 格式化 / 壓縮', 'SVG formatter / minifier'],
  '基于 SVGO 引擎处理 SVG: 去除注释、冗余属性、多余分组并优化路径等。可「美化」为多行缩进或「压缩」为单行最小体积, 适合发布到网页前瘦身。': ['基於 SVGO 引擎處理 SVG: 移除註解、冗餘屬性、多餘群組並最佳化路徑等。可「美化」為多行縮排或「壓縮」為單行最小體積, 適合發佈到網頁前瘦身。', 'Processes SVG with the SVGO engine: removes comments, redundant attributes and extra groups, and optimizes paths. "Pretty" reformats to multi-line indentation, "Minify" produces a single-line minimum-size file — great for slimming SVGs before publishing.'],
  'SVG 源码': ['SVG 原始碼', 'SVG source'],
  '读取 .svg 文件': ['讀取 .svg 檔案', 'Read .svg file'],
  '粘贴 SVG 代码, 或读取本地 .svg 文件…': ['貼上 SVG 程式碼, 或讀取本機 .svg 檔案…', 'Paste SVG code, or read a local .svg file…'],
  '优化选项与结果': ['最佳化選項與結果', 'Options & result'],
  '压缩 (单行)': ['壓縮 (單行)', 'Minify (one line)'],
  '美化 (多行)': ['美化 (多行)', 'Pretty (multi-line)'],
  '优化中…': ['最佳化中…', 'Optimizing…'],
  '处理失败': ['處理失敗', 'Processing failed'],
  '节省 {a} B ({p}%)': ['節省 {a} B ({p}%)', 'Saved {a} B ({p}%)'],
  '体积无变化': ['體積無變化', 'No size change'],
  '下载 .svg': ['下載 .svg', 'Download .svg'],
  '预览:': ['預覽:', 'Preview:'],
  'SVG 预览': ['SVG 預覽', 'SVG preview'],
  '输入 SVG 后自动优化。文件 → 网络: 平均可缩小 30%~60%。': ['輸入 SVG 後自動最佳化。檔案 → 網路: 平均可縮小 30%~60%。', 'SVG is optimized automatically as you type. File → web: typically 30%~60% smaller.'],
  '已读取 {name} ({c} 字符)': ['已讀取 {name} ({c} 字元)', '{name} loaded ({c} characters)'],
  '格式化': ['格式化', 'Format'],
  '读': ['讀', 'Read'],
  '执行': ['執行', 'Execute'],
  'px': ['px', 'px'],
  '字节': ['位元組', 'bytes'],
  'r:': ['r:', 'r:'],
  'p:': ['p:', 'p:'],
  '字符': ['字元', 'Characters'],
  '预览': ['預覽', 'Preview'],
  '分': ['分', 'm'],
  '时': ['時', 'h'],
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

