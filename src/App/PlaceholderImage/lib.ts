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
const KEY_CUSTOM = 'ph:custom';

/** 自定义预设变更事件 (设置页 → 工具页同步) */
export const PRESETS_CHANGED_EVENT = 'ph:presets-changed';
export const notifyPresetsChanged = () => {
  try { window.dispatchEvent(new Event(PRESETS_CHANGED_EVENT)); } catch (e) { /* ignore */ }
};

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

// ---- 预设尺寸 ----

export interface Dim { w: number; h: number }
export interface PresetItem extends Dim { name?: string }

/** 内置常用预设: 内容图 + 常见广告规格 (分组供下拉展示) */
export const BUILTIN_GROUPS: { label: string; items: PresetItem[] }[] = [
  {
    label: '常用',
    items: [
      { w: 640, h: 480 },
      { w: 800, h: 600 },
      { w: 1024, h: 768 },
      { w: 1280, h: 720 },
      { w: 1920, h: 1080 },
    ],
  },
  {
    label: '常见广告位',
    items: [
      { w: 300, h: 250, name: '中矩形' },
      { w: 336, h: 280, name: '大矩形' },
      { w: 468, h: 60, name: '横幅' },
      { w: 728, h: 90, name: '通栏' },
      { w: 320, h: 50, name: '移动横幅' },
      { w: 160, h: 600, name: '摩天楼' },
    ],
  },
];

export const BUILTIN_PRESETS: Dim[] = BUILTIN_GROUPS.flatMap((g) => g.items);

const validDim = (v: unknown): v is Dim =>
  !!v && typeof v === 'object'
  && Number.isInteger((v as Dim).w) && (v as Dim).w >= PH_MIN && (v as Dim).w <= PH_MAX
  && Number.isInteger((v as Dim).h) && (v as Dim).h >= PH_MIN && (v as Dim).h <= PH_MAX;

/** 用户自定义预设 (设置页增删) */
export const getCustomPresets = (): Dim[] => {
  try {
    const raw = localStorage.getItem(KEY_CUSTOM);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    const out: Dim[] = [];
    for (const v of arr) {
      if (validDim(v)) {
        // 与内置重复则忽略
        if (!BUILTIN_PRESETS.some((b) => b.w === v.w && b.h === v.h)
          && !out.some((o) => o.w === v.w && o.h === v.h)) out.push(v);
      }
    }
    return out;
  } catch (e) { return []; }
};

export const setCustomPresets = (dims: Dim[]) => {
  try { localStorage.setItem(KEY_CUSTOM, JSON.stringify(dims)); } catch (e) { /* ignore */ }
};

/** 尺寸 key (Select value): 如 640x480 */
export const dimKey = (w: number, h: number) => `${w}x${h}`;

export const parseDimKey = (key: string): Dim | null => {
  const m = /^(\d+)x(\d+)$/.exec(key);
  if (!m) return null;
  const w = Number(m[1]);
  const h = Number(m[2]);
  return (validDim({ w, h })) ? { w, h } : null;
};
