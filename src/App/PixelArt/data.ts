// 像素图: 参数范围 / 快捷配置 / 内置调色板
//
// 调色板分三类:
// - 自适应 (autoNN): 用中位切分 (median cut) 从当前图片里取 NN 种颜色, 颜色最丰富, 适合照片
// - 经典主机: 固定色表, 还原 NES / PICO-8 / Game Boy / C64 / CGA / ZX Spectrum 等主机的观感
// - 位深量化 (bits): 不列色表, 直接按每通道保留 N 位来量化 (SMS 2 位 = 64 色, MD 3 位 = 512 色, SNES 5 位 = 32768 色)

/** 像素块边长 (px): 越小越接近原图, 越大越"粗" */
export const BLOCK_MIN = 2;
export const BLOCK_MAX = 48;

/** 抖动 (有序抖动 / Bayer 4×4) 默认值 */
export const DITHER_DEFAULT = true;

/** 色板分组 (Select 里的分组标题, 文案见 lang.ts) */
export const PALETTE_GROUPS = [ 'auto', 'retro', 'depth' ] as const;
export type PaletteGroup = typeof PALETTE_GROUPS[number];

/** 调色板条目 */
export interface PaletteDef {
  /** 归属分组 (决定下拉框里的分组) */
  group: PaletteGroup;
  /** 固定色表 (hex, 不带 #); 自适应 / 位深模式为空数组 */
  colors: readonly string[];
  /** 位深量化: 每通道保留位数 (与 colors 互斥) */
  bits?: number;
}

export const PALETTE_KEYS = [
  'off',
  'auto16', 'auto32', 'auto64', 'auto256',
  'nes', 'pico8', 'gameboy', 'c64', 'cga', 'zx',
  'sms', 'genesis', 'snes',
] as const;
export type PaletteKey = typeof PALETTE_KEYS[number];

/** 自适应模式的取色数 (auto16 -> 16) */
export const AUTO_COUNTS: Record<string, number> = {
  auto16: 16, auto32: 32, auto64: 64, auto256: 256,
};

/**
 * NES (2C02) 调色板: 64 个表项中有 10 个是同一个黑, 去重后共 55 色
 * 数值取较通行的 NTSC 近似表, 覆盖红白机上实际可用的全部颜色
 */
const NES: readonly string[] = [
  '7C7C7C', '0000FC', '0000BC', '4428BC', '940084', 'A80020', 'A81000', '881400', '503000', '007800',
  '006800', '005800', '004058', '000000',
  'BCBCBC', '0078F8', '0058F8', '6844FC', 'D800CC', 'E40058', 'F83800', 'E45C10', 'AC7C00', '00B800',
  '00A800', '00A844', '008888',
  'F8F8F8', '3CBCFC', '6888FC', '9878F8', 'F878F8', 'F85898', 'F87858', 'FCA044', 'F8B800', 'B8F818',
  '58D854', '58F898', '00E8D8', '787878',
  'FCFCFC', 'A4E4FC', 'B8B8F8', 'D8B8F8', 'F8B8F8', 'F8A4C0', 'F0D0B0', 'FCE0A8', 'F8D878', 'D8F878',
  'B8F8B8', 'B8F8D8', '00FCFC', 'F8D8F8',
];

/** PICO-8 官方 16 色 */
const PICO8: readonly string[] = [
  '000000', '1D2B53', '7E2553', '008751', 'AB5236', '5F574F', 'C2C3C7', 'FFF1E8',
  'FF004D', 'FFA300', 'FFEC27', '00E436', '29ADFF', '83769C', 'FF77A8', 'FFCCAA',
];

/** Game Boy (DMG) 4 阶绿屏 */
const GAMEBOY: readonly string[] = [ '0F380F', '306230', '8BAC0F', '9BBC0F' ];

/** Commodore 64 (Pepto 校准值, 16 色) */
const C64: readonly string[] = [
  '000000', 'FFFFFF', '68372B', '70A4B2', '6F3D86', '588D43', '352879', 'B8C76F',
  '6F4F25', '433900', '9A6759', '444444', '6C6C6C', '9AD284', '6C5EB5', '959595',
];

/** IBM PC CGA 16 色 */
const CGA: readonly string[] = [
  '000000', '0000AA', '00AA00', '00AAAA', 'AA0000', 'AA00AA', 'AA5500', 'AAAAAA',
  '555555', '5555FF', '55FF55', '55FFFF', 'FF5555', 'FF55FF', 'FFFF55', 'FFFFFF',
];

/** ZX Spectrum 15 色 (普通 / 高亮各 8 色, 黑色共用一个) */
const ZX: readonly string[] = [
  '000000', '0000D7', 'D70000', 'D700D7', '00D700', '00D7D7', 'D7D700', 'D7D7D7',
  '0000FF', 'FF0000', 'FF00FF', '00FF00', '00FFFF', 'FFFF00', 'FFFFFF',
];

/** 调色板表: colors / bits 二选一, 自适应与 off 两者皆空 */
export const PALETTE_DEFS: Record<PaletteKey, PaletteDef> = {
  off: { group: 'auto', colors: [] },
  auto16: { group: 'auto', colors: [] },
  auto32: { group: 'auto', colors: [] },
  auto64: { group: 'auto', colors: [] },
  auto256: { group: 'auto', colors: [] },
  nes: { group: 'retro', colors: NES },
  pico8: { group: 'retro', colors: PICO8 },
  gameboy: { group: 'retro', colors: GAMEBOY },
  c64: { group: 'retro', colors: C64 },
  cga: { group: 'retro', colors: CGA },
  zx: { group: 'retro', colors: ZX },
  sms: { group: 'depth', colors: [], bits: 2 }, // Sega Master System: RGB222, 64 色
  genesis: { group: 'depth', colors: [], bits: 3 }, // Mega Drive / Genesis: RGB333, 512 色
  snes: { group: 'depth', colors: [], bits: 5 }, // SNES / SFC: RGB555, 32768 色
};

/** 调色板可见色数 (off 视为 0; 位深模式按 2^(3·bits) 计) */
export const paletteColorCount = (key: PaletteKey): number => {
  const def = PALETTE_DEFS[key];
  if (!def) return 0;
  if (def.bits) return Math.pow(2, def.bits * 3);
  if (key in AUTO_COUNTS) return AUTO_COUNTS[key];
  return def.colors.length;
};

/** 是否为自适应取色 */
export const isAutoPalette = (key: PaletteKey): boolean => key in AUTO_COUNTS;

// ---------------------------------------------------------------------------
// 快捷配置 (预设): 一次点选同时定好 像素大小 / 灰度 / 调色板 / 抖动
// ---------------------------------------------------------------------------

export const PRESETS = [ 'portrait', 'game', 'abstract', 'custom' ] as const;
export type Preset = typeof PRESETS[number];
export const PRESET_DEFAULT: FixedPreset = 'portrait';

/** 可应用参数的三种预设 (custom = 手动微调, 不含参数) */
export type FixedPreset = Exclude<Preset, 'custom'>;

export interface PresetDef {
  /** 像素块边长 (px) */
  block: number;
  /** 是否转灰度 */
  grayscale: boolean;
  /** 调色板 */
  palette: PaletteKey;
  /** 是否开启抖动 */
  dither: boolean;
}

/**
 * 三种快捷配置 (与需求一一对应):
 * - 人像照片: 像素大小 6~8, 不开灰度, 选颜色较丰富的调色板 (自适应 64 色 + 抖动)
 * - 游戏素材: 像素大小 8~12, 经典主机调色板 (PICO-8 16 色, 关抖动保持色块干净)
 * - 抽象创作: 像素大小 15~25, 开灰度, 关闭调色板
 */
export const PRESET_DEFS: Record<FixedPreset, PresetDef> = {
  portrait: { block: 7, grayscale: false, palette: 'auto64', dither: true },
  game: { block: 10, grayscale: false, palette: 'pico8', dither: false },
  abstract: { block: 20, grayscale: true, palette: 'off', dither: false },
};

/** 结果预览区尺寸上限 (仅影响页面预览, 不影响导出) */
export const PREVIEW_MAX_W = 260;
export const PREVIEW_MAX_H = 200;

/** JPEG / WebP 输出质量 */
export const QUALITY_DEFAULT = 0.92;
export const QUALITY_MIN = 0.5;
export const QUALITY_MAX = 1;

/** 导出文件名后缀: 原名_pixelart.png */
export const FILE_SUFFIX = 'pixelart';
