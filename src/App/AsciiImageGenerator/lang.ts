// AsciiImageGenerator 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "ASCII 圖片" },
  en: { appName: "ASCII Image" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const imagelangRows: Record<string, [string, string]> = {
  '预览': ['預覽', 'Preview'],
  '保存 {name}': ['儲存 {name}', 'Save {name}'],
  '已保存 {name}': ['已儲存 {name}', 'Saved {name}'],
  '点击或拖拽图片到此处': ['點擊或拖曳圖片到此處', 'Click or drag an image here'],
  '读取文件失败': ['讀取檔案失敗', 'Failed to read the file'],
  '图片解析失败, 请确认文件格式': ['圖片解析失敗, 請確認檔案格式', 'Failed to decode the image — check the file format'],
  '无法创建画布': ['無法建立畫布', 'Could not create canvas'],
  '请选择图片文件': ['請選擇圖片檔案', 'Choose an image file'],
  '已载入 {name} ({w}×{h}px)': ['已載入 {name} ({w}×{h}px)', 'Loaded {name} ({w}×{h}px)'],
  '载入失败': ['載入失敗', 'Load failed'],
  '已复制 {n} 字符到剪贴板': ['已複製 {n} 字元到剪貼簿', 'Copied {n} characters to clipboard'],
  '复制失败, 请手动选中文本复制': ['複製失敗, 請手動選取文字複製', 'Copy failed — please select the text and copy manually'],
  '文本文件': ['文字檔', 'Text file'],
  '点击或拖拽图片到此处载入': ['點擊或拖曳圖片到此處載入', 'Click or drag an image here to load'],
  '支持 png / jpg / webp / gif (首帧), 自动按最长边 600px 缩小处理': ['支援 png / jpg / webp / gif (首幀), 自動依最長邊 600px 縮小處理', 'Supports png / jpg / webp / gif (first frame); shrunk automatically so the longest side is 600px'],
  '载入图片后自动生成 ASCII 图: 灰度字符按亮度映射, 可用下方参数实时调整': ['載入圖片後自動產生 ASCII 圖: 灰階字元依亮度對應, 可用下方參數即時調整', 'The ASCII art generates automatically after loading: gray levels map to characters by brightness and can be tuned live below'],
  '输出宽': ['輸出寬', 'Output width'],
  '字符': ['字元', 'chars'],
  '字符集': ['字元集', 'Char set'],
  '标准 (10 级 @%#*+=-:. )': ['標準 (10 級 @%#*+=-:. )', 'Standard (10 levels @%#*+=-:. )'],
  '密度块 (Unicode █▓▒░ )': ['密度塊 (Unicode █▓▒░ )', 'Density blocks (Unicode █▓▒░ )'],
  '极简 (2 级 # )': ['極簡 (2 級 # )', 'Minimal (2 levels # )'],
  '自定义…': ['自訂…', 'Custom…'],
  '按暗->亮输入字符, 如 @%# ': ['按暗→亮輸入字元, 如 @%# ', 'Enter chars from dark to light, e.g. @%# '],
  '反色': ['反色', 'Invert'],
  '亮度': ['亮度', 'Brightness'],
  '对比度': ['對比度', 'Contrast'],
  '结果预览 ({l} 行 · {c} 字符 · 点击复制):': ['結果預覽 ({l} 行 · {c} 字元 · 點擊複製):', 'Preview ({l} lines · {c} chars · click to copy):'],
  '复制文本': ['複製文字', 'Copy text'],
  '下载 .txt': ['下載 .txt', 'Download .txt'],
  '提示: 预览按等宽字体 2:1 比例示意, 复制到 Markdown 代码块 / 等宽字体编辑器查看效果最佳': ['提示: 預覽以等寬字型 2:1 比例示意, 複製到 Markdown 程式碼區塊 / 等寬字型編輯器檢視效果最佳', 'Tip: the preview simulates a monospace font at a 2:1 ratio; the result looks best pasted into a Markdown code block or a monospace editor'],
  '预设': ['預設', 'Preset'],
  '宽': ['寬', 'W'],
  '高': ['高', 'H'],
  '格式': ['格式', 'Format'],
  '默认': ['預設', 'Default'],
  '编辑器': ['編輯器', 'Editor'],
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

