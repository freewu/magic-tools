// 占位图片 (Placeholder Image) 核心

// 支持的图片格式
export const PH_FORMATS = [ 'png', 'jpg', 'webp' ] as const;
export type PhFormat = (typeof PH_FORMATS)[number];

// 默认值
export const PH_DEFAULTS = { bg: '#e0e0e0', fg: '#555555', w: 640, h: 480 } as const;

// 尺寸上下限 (防画布爆内存)
export const PH_MIN = 1;
export const PH_MAX = 3000;

const KEY_BG = 'ph:bg';
const KEY_FG = 'ph:fg';
const KEY_W = 'ph:width';
const KEY_H = 'ph:height';

const isHexColor = (s: string) => /^#[0-9a-fA-F]{6}$/.test(s);

const readInt = (key: string, fallback: number): number => {
  try {
    const v = Number(localStorage.getItem(key));
    if (Number.isInteger(v) && v >= PH_MIN && v <= PH_MAX) return v;
  } catch (e) { /* ignore */ }
  return fallback;
};

// ---- 默认背景颜色 ----
export const getDefaultBg = (): string => {
  try {
    const v = localStorage.getItem(KEY_BG);
    if (v && isHexColor(v)) return v;
  } catch (e) { /* ignore */ }
  return PH_DEFAULTS.bg;
};
export const setDefaultBg = (hex: string) => { try { localStorage.setItem(KEY_BG, hex); } catch (e) { /* ignore */ } };

// ---- 默认文字颜色 ----
export const getDefaultFg = (): string => {
  try {
    const v = localStorage.getItem(KEY_FG);
    if (v && isHexColor(v)) return v;
  } catch (e) { /* ignore */ }
  return PH_DEFAULTS.fg;
};
export const setDefaultFg = (hex: string) => { try { localStorage.setItem(KEY_FG, hex); } catch (e) { /* ignore */ } };

// ---- 预设宽高 (打开页面时的默认尺寸) ----
export const getDefaultSize = (): { w: number; h: number } => {
  return { w: readInt(KEY_W, PH_DEFAULTS.w), h: readInt(KEY_H, PH_DEFAULTS.h) };
};
export const setDefaultSize = (w: number, h: number) => {
  try {
    localStorage.setItem(KEY_W, String(w));
    localStorage.setItem(KEY_H, String(h));
  } catch (e) { /* ignore */ }
};

/** 默认输出文件名: 宽x高.格式 */
export const buildFileName = (w: number, h: number, fmt: PhFormat): string => `${w}x${h}.${fmt}`;

/** 尺寸合法性检查 (非法抛中文错误) */
export const checkSize = (w: number, h: number) => {
  if (!Number.isInteger(w) || !Number.isInteger(h) || w < PH_MIN || h < PH_MIN || w > PH_MAX || h > PH_MAX) {
    throw new Error(`宽高须为 ${PH_MIN}-${PH_MAX} 的整数`);
  }
  if (w * h > PH_MAX * 2000) {
    throw new Error('尺寸过大, 宽高乘积建议不超过 600 万像素 (如 3000×2000)');
  }
};
