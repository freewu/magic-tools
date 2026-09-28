import type { PaletteGroup, PaletteKey, Preset } from './data';

// PixelArt 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '像素圖' },
  en: { appName: 'Pixel Art' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const rows: Record<string, [ string, string ]> = {
  // 操作
  '选择图片': [ '選擇圖片', 'Choose image' ],
  '重新选择': [ '重新選擇', 'Choose another' ],
  '保存': [ '儲存', 'Save' ],
  '清空': [ '清空', 'Clear' ],
  '正在处理…': [ '正在處理…', 'Processing…' ],
  '已保存 {n}': [ '已儲存 {n}', 'Saved {n}' ],
  '已取消保存': [ '已取消儲存', 'Saving cancelled' ],
  '保存失败, 请重试': [ '儲存失敗, 請重試', 'Saving failed, please retry' ],
  '请选择图片文件': [ '請選擇圖片檔案', 'Please choose an image file' ],
  '图片读取失败': [ '圖片讀取失敗', 'Failed to read the image' ],
  '图片解析失败': [ '圖片解析失敗', 'Failed to decode the image' ],
  '拖拽图片到此处, 或点击「选择图片」': [ '拖曳圖片到此處, 或點擊「選擇圖片」', 'Drop an image here, or click "Choose image"' ],
  '支持 PNG / JPG / GIF / WebP / BMP 等浏览器可解码的图片 (本地处理, 不会上传)': [ '支援 PNG / JPG / GIF / WebP / BMP 等瀏覽器可解碼的圖片 (本機處理, 不會上傳)', 'Supports any image the browser can decode, such as PNG / JPG / GIF / WebP / BMP (processed locally, never uploaded)' ],
  '当前环境不支持 Canvas, 无法处理图片': [ '目前環境不支援 Canvas, 無法處理圖片', 'Canvas is unavailable in this environment, so the image cannot be processed' ],
  '图片尺寸过大, 单边不能超过 {n} px': [ '圖片尺寸過大, 單邊不能超過 {n} px', 'The image is too large — each side must stay under {n} px' ],

  // 预览与统计
  '原图': [ '原圖', 'Original' ],
  '结果': [ '結果', 'Result' ],
  '原图尺寸': [ '原圖尺寸', 'Original size' ],
  '结果尺寸': [ '結果尺寸', 'Result size' ],
  '原图体积': [ '原圖體積', 'Original size on disk' ],
  '结果体积': [ '結果體積', 'Result size on disk' ],
  '{a} × {b} px': [ '{a} × {b} px', '{a} × {b} px' ],
  '色块': [ '色塊', 'Blocks' ],
  '{a} × {b} 块': [ '{a} × {b} 塊', '{a} × {b} blocks' ],
  '像素块': [ '像素塊', 'Block size' ],

  // 参数
  '调整参数': [ '調整參數', 'Adjust settings' ],
  '快捷配置': [ '快捷設定', 'Presets' ],
  '人像照片': [ '人像照片', 'Portrait photo' ],
  '游戏素材': [ '遊戲素材', 'Game asset' ],
  '抽象创作': [ '抽象創作', 'Abstract art' ],
  '自定义': [ '自訂', 'Custom' ],
  '像素大小': [ '像素大小', 'Pixel size' ],
  '灰度': [ '灰階', 'Grayscale' ],
  '抖动': [ '抖動', 'Dither' ],
  '开': [ '開', 'On' ],
  '关': [ '關', 'Off' ],
  '调色板': [ '調色板', 'Palette' ],
  '像素大小 6~8 · 不开灰度 · 颜色较丰富的调色板': [ '像素大小 6~8 · 不開灰階 · 顏色較豐富的調色板', 'Pixel size 6–8 · grayscale off · a color-rich palette' ],
  '像素大小 8~12 · 适合目标主机的经典游戏调色板': [ '像素大小 8~12 · 適合目標主機的經典遊戲調色板', 'Pixel size 8–12 · classic console palette for the target hardware' ],
  '像素大小 15~25 · 开灰度 · 关闭调色板': [ '像素大小 15~25 · 開灰階 · 關閉調色板', 'Pixel size 15–25 · grayscale on · palette off' ],
  '已应用 像素大小 {n} · 灰度 {g} · 抖动 {d} · 调色板 {p}': [ '已套用 像素大小 {n} · 灰階 {g} · 抖動 {d} · 調色板 {p}', 'Applied — pixel size {n} · grayscale {g} · dither {d} · palette {p}' ],
  '关闭 (不量化)': [ '關閉 (不量化)', 'Off (no quantization)' ],
  '自适应 16 色': [ '自適應 16 色', 'Adaptive 16' ],
  '自适应 32 色': [ '自適應 32 色', 'Adaptive 32' ],
  '自适应 64 色': [ '自適應 64 色', 'Adaptive 64' ],
  '自适应 256 色': [ '自適應 256 色', 'Adaptive 256' ],
  'NES 红白机': [ 'NES 紅白機', 'NES' ],
  'PICO-8': [ 'PICO-8', 'PICO-8' ],
  'Game Boy DMG 绿屏': [ 'Game Boy DMG 綠屏', 'Game Boy (DMG)' ],
  'Commodore 64': [ 'Commodore 64', 'Commodore 64' ],
  'CGA IBM PC': [ 'CGA IBM PC', 'CGA (IBM PC)' ],
  'ZX Spectrum': [ 'ZX Spectrum', 'ZX Spectrum' ],
  'Sega Master System RGB222': [ 'Sega Master System RGB222', 'Sega Master System (RGB222)' ],
  'Sega Mega Drive / Genesis RGB333': [ 'Sega Mega Drive / Genesis RGB333', 'Sega Mega Drive / Genesis (RGB333)' ],
  'SNES / SFC RGB555': [ 'SNES / SFC RGB555', 'SNES / SFC (RGB555)' ],
  '自适应取色': [ '自適應取色', 'Adaptive' ],
  '经典主机': [ '經典主機', 'Classic consoles' ],
  '位深量化': [ '位深量化', 'Bit depth' ],
  '色': [ '色', 'colors' ],
  // 说明
  '像素图说明': [ '像素圖說明', 'About pixel art' ],
};

/** 快捷配置名称 */
export const PRESET_TEXT: Record<Preset, string> = {
  portrait: '人像照片',
  game: '游戏素材',
  abstract: '抽象创作',
  custom: '自定义',
};

/** 调色板名称 */
export const PALETTE_TEXT: Record<PaletteKey, string> = {
  off: '关闭 (不量化)',
  auto16: '自适应 16 色',
  auto32: '自适应 32 色',
  auto64: '自适应 64 色',
  auto256: '自适应 256 色',
  nes: 'NES 红白机',
  pico8: 'PICO-8',
  gameboy: 'Game Boy DMG 绿屏',
  c64: 'Commodore 64',
  cga: 'CGA IBM PC',
  zx: 'ZX Spectrum',
  sms: 'Sega Master System RGB222',
  genesis: 'Sega Mega Drive / Genesis RGB333',
  snes: 'SNES / SFC RGB555',
};

/** 调色板分组名称 */
export const PALETTE_GROUP_TEXT: Record<PaletteGroup, string> = {
  auto: '自适应取色',
  retro: '经典主机',
  depth: '位深量化',
};

/** 快捷配置的推荐参数说明 (与需求中的规格一一对应, 中文原文即词条 key) */
export const PRESET_HINTS: Record<'portrait' | 'game' | 'abstract', string> = {
  portrait: '像素大小 6~8 · 不开灰度 · 颜色较丰富的调色板',
  game: '像素大小 8~12 · 适合目标主机的经典游戏调色板',
  abstract: '像素大小 15~25 · 开灰度 · 关闭调色板',
};

// 取词: 无命中回退 zh 原文
export const pa = (locale: string, zh: string): string => {
  const e = rows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const paT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = pa(locale, zh);
  if (v) for (const [ k, val ] of Object.entries(v)) s = s.split('{' + k + '}').join(String(val));
  return s;
};
