// AppIconGenerator 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  en: { appName: "App Icon Generator" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const imagelangRows: Record<string, [string, string]> = {
  '预览': ['預覽', 'Preview'],
  '图片加载失败': ['圖片載入失敗', 'Failed to load the image'],
  '状态': ['狀態', 'Value'],
  '倍率': ['倍率', 'Export size'],
  'PNG 生成失败': ['PNG 產生失敗', 'PNG generation failed'],
  '请选择图片文件 (PNG/JPG/WebP 等)': ['請選擇圖片檔案 (PNG/JPG/WebP 等)', 'Choose an image file (PNG/JPG/WebP etc.)'],
  '生成失败': ['產生失敗', 'Generation failed'],
  '请先上传一张图片': ['請先上傳一張圖片', 'Upload an image first'],
  'App Icon 生成 · 批量结果 ({n} 张)': ['App Icon 產生 · 批次結果 ({n} 張)', 'App Icon generator — batch result ({n} icons)'],
  '【{t}】{d}:': ['【{t}】{d}:', '[{t}] {d}:'],
  '批量下载 App 图标': ['批次下載 App 圖示', 'Download app icons (batch)'],
  'ZIP 压缩包': ['ZIP 壓縮檔', 'ZIP archive'],
  '已生成 {n} 张图标并打包下载': ['已產生 {n} 張圖示並打包下載', 'Generated {n} icons and packed them for download'],
  '打包失败': ['打包失敗', 'Packaging failed'],
  '点击或拖拽图片到此处': ['點擊或拖曳圖片到此處', 'Click or drag an image here'],
  '建议 1024×1024 方形、无透明底素材': ['建議 1024×1024 方形、無透明底素材', 'A square 1024×1024 source without transparency is recommended'],
  ' · 当前: {name}': [' · 目前: {name}', ' · current: {name}'],
  '{n} 张': ['{n} 張', '{n} icon(s)'],
  'Apple HIG 规范 (含 iPhone/iPad/App Store 1024)': ['Apple HIG 規範 (含 iPhone/iPad/App Store 1024)', 'Apple HIG spec (incl. iPhone/iPad/App Store 1024)'],
  'Google 官方 mipmap 密度目录': ['Google 官方 mipmap 密度目錄', 'Google official mipmap density folders'],
  'Cordova res/icon 官方目录结构': ['Cordova res/icon 官方目錄結構', 'Cordova res/icon official folder layout'],
  '像素: {p}': ['像素: {p}', 'Pixels: {p}'],
  '点击卡片可勾选 / 取消平台, 选中的平台才会被打包下载 (当前选中 {n} 张)': ['點擊卡片可勾選 / 取消平台, 選中的平台才會被打包下載 (目前選中 {n} 張)', 'Click a card to select / deselect a platform; only selected platforms are packed (currently {n} icons)'],
  '正在生成…': ['正在產生…', 'Generating…'],
  '下载所选平台图标 (.zip · {n} 张)': ['下載所選平台圖示 (.zip · {n} 張)', 'Download icons for selected platforms (.zip · {n} icons)'],
  '1024 主图标预览': ['1024 主圖示預覽', '1024 master icon preview'],
  '上传后预览': ['上傳後預覽', 'Preview after upload'],
  'iOS · Android · PhoneGap 三平台同时生成': ['iOS · Android · PhoneGap 三平台同時產生', 'Generates for all three platforms: iOS · Android · PhoneGap'],
  '查看输出文件清单 ({n} 个可选, 以下仅列出已选平台)': ['查看輸出檔案清單 ({n} 個可選, 以下僅列出已選平台)', 'Output file list ({n} available, only selected platforms listed)'],
  '取消': ['取消', 'Cancel'],
  '无法创建画布': ['無法建立畫布', 'Could not create canvas'],
  '请选择图片文件': ['請選擇圖片檔案', 'Choose an image file'],
  '单个': ['單個', 'Single'],
  '批量': ['批次', 'Batch'],
  '尺寸': ['尺寸', 'Size'],
  '高': ['高', 'H'],
  '默认': ['預設', 'Default'],
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

