// 像素图: 像素化 + 灰度 + 调色板量化 + 有序抖动 (纯函数, 不依赖 canvas / DOM, 便于单测)
//
// 处理顺序: 先按像素块求平均 (像素化) -> 灰度 -> 调色板量化 (含抖动) -> 展开回原尺寸
//   先平均再量化, 才能保证"每个色块只用一个调色板颜色";
//   反过来先量化再平均会让相邻色块的平均值落在调色板之外, 出现脏色。
// 抖动在"色块网格"上进行 (而非逐像素), 因此抖动出来的花纹也是像素块的粒度, 不会打散色块。

import {
  AUTO_COUNTS, BLOCK_MAX, BLOCK_MIN, DITHER_DEFAULT, PALETTE_DEFS, PALETTE_KEYS, PRESET_DEFAULT, PRESET_DEFS,
  PRESETS,
  type FixedPreset, type PaletteKey, type Preset, type PresetDef,
} from './data';

/** 颜色 (0~255) */
export interface Rgb { r: number; g: number; b: number; }

/** 数值夹取到 0~255 并四舍五入 (非数字回退 0) */
export const clampByte = (v: number): number => {
  if (!Number.isFinite(v)) return 0;
  return Math.min(255, Math.max(0, Math.round(v)));
};

/** #RRGGBB (可省略 #) -> Rgb; 非法输入返回黑色 */
export const hexToRgb = (hex: string): Rgb => {
  const s = String(hex ?? '').replace(/^#/, '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(s.slice(0, 2), 16),
    g: parseInt(s.slice(2, 4), 16),
    b: parseInt(s.slice(4, 6), 16),
  };
};

/** Rgb -> #RRGGBB (大写) */
export const rgbToHex = (c: Rgb): string =>
  '#' + [ c.r, c.g, c.b ].map((v) => clampByte(v).toString(16).toUpperCase().padStart(2, '0')).join('');

/** 像素块边长归一化: 非法值回退 8, 取整并夹取到 [BLOCK_MIN, BLOCK_MAX] */
export const normalizeBlock = (v: unknown): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  if (!Number.isFinite(n)) return 8;
  return Math.min(BLOCK_MAX, Math.max(BLOCK_MIN, Math.round(n)));
};

/** 调色板归一化 (非法值回退 off) */
export const normalizePalette = (v: unknown): PaletteKey =>
  (PALETTE_KEYS as readonly string[]).includes(v as string) ? v as PaletteKey : 'off';

/** 快捷配置归一化 (非法值回退默认预设) */
export const normalizePreset = (v: unknown): Preset =>
  (PRESETS as readonly string[]).includes(v as string) ? v as Preset : PRESET_DEFAULT;

/** 快捷配置对应的参数 (custom 无参数, 回退默认预设) */
export const presetSettings = (v: unknown): PresetDef => {
  const p = normalizePreset(v);
  return PRESET_DEFS[(p === 'custom' ? PRESET_DEFAULT : p) as FixedPreset];
};

// ---------------------------------------------------------------------------
// 像素块网格
// ---------------------------------------------------------------------------

/** 像素块网格: 每个格子的颜色 = 该块内像素的加权平均 */
export interface PixelGrid {
  width: number;
  height: number;
  /** 像素块边长 (px) */
  block: number;
  /** 网格宽 / 高 (块数) */
  gw: number;
  gh: number;
  /** 颜色: 长度 gw*gh*3, 依次为 r,g,b */
  rgb: Uint8Array;
  /** 透明度: 长度 gw*gh */
  alpha: Uint8Array;
}

/**
 * 按像素块求平均, 得到块级网格
 * - 颜色按 α 加权 (等价于先乘 α 再还原), 避免透明区域把色块"染黑"
 * - α 本身按块内像素简单平均
 */
export const buildGrid = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  block: number,
): PixelGrid => {
  const b = normalizeBlock(block);
  const w = Math.max(1, Math.floor(width));
  const h = Math.max(1, Math.floor(height));
  const gw = Math.max(1, Math.ceil(w / b));
  const gh = Math.max(1, Math.ceil(h / b));
  const rgb = new Uint8Array(gw * gh * 3);
  const alpha = new Uint8Array(gw * gh);
  for (let gy = 0; gy < gh; gy++) {
    const y1 = Math.min(h, (gy + 1) * b);
    for (let gx = 0; gx < gw; gx++) {
      const x1 = Math.min(w, (gx + 1) * b);
      let sr = 0;
      let sg = 0;
      let sb = 0;
      let sa = 0;
      let n = 0;
      for (let y = gy * b; y < y1; y++) {
        for (let x = gx * b; x < x1; x++) {
          const i = (y * w + x) * 4;
          const a = data[i + 3];
          sr += data[i] * a;
          sg += data[i + 1] * a;
          sb += data[i + 2] * a;
          sa += a;
          n++;
        }
      }
      const gi = gy * gw + gx;
      if (sa > 0) {
        rgb[gi * 3] = clampByte(sr / sa);
        rgb[gi * 3 + 1] = clampByte(sg / sa);
        rgb[gi * 3 + 2] = clampByte(sb / sa);
      }
      alpha[gi] = n > 0 ? clampByte(sa / n) : 0;
    }
  }
  return { width: w, height: h, block: b, gw, gh, rgb, alpha };
};

/** 网格转灰度 (就地修改): Rec.709 亮度权重, 与 CSS grayscale 观感一致 */
export const grayscaleGrid = (grid: PixelGrid): void => {
  const { rgb } = grid;
  for (let i = 0; i + 2 < rgb.length; i += 3) {
    const v = clampByte(0.2126 * rgb[i] + 0.7152 * rgb[i + 1] + 0.0722 * rgb[i + 2]);
    rgb[i] = v;
    rgb[i + 1] = v;
    rgb[i + 2] = v;
  }
};

/** 把网格展开回 width × height 的 RGBA 数据 (每个色块填充同色) */
export const expandGrid = (grid: PixelGrid): Uint8ClampedArray => {
  const { width, height, block, gw, gh, rgb, alpha } = grid;
  const out = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const gy = Math.min(gh - 1, Math.floor(y / block));
    for (let x = 0; x < width; x++) {
      const gx = Math.min(gw - 1, Math.floor(x / block));
      const gi = gy * gw + gx;
      const o = (y * width + x) * 4;
      out[o] = rgb[gi * 3];
      out[o + 1] = rgb[gi * 3 + 1];
      out[o + 2] = rgb[gi * 3 + 2];
      out[o + 3] = alpha[gi];
    }
  }
  return out;
};

/** 网格里的颜色 -> Rgb */
export const gridColorAt = (grid: PixelGrid, gx: number, gy: number): Rgb => {
  const gi = gy * grid.gw + gx;
  return { r: grid.rgb[gi * 3], g: grid.rgb[gi * 3 + 1], b: grid.rgb[gi * 3 + 2] };
};

// ---------------------------------------------------------------------------
// 调色板: 中位切分自适应取色 / 最近色匹配 / 位深量化 / 有序抖动
// ---------------------------------------------------------------------------

/** 4×4 Bayer 有序抖动矩阵 (0~15) */
export const BAYER = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
];

/**
 * 抖动幅度: 色数越少幅度越大 (色数少时更需要靠抖动补层次), 16~96 之间
 * 色数为 0 / 非法时返回 0 (不抖动)
 */
export const ditherAmplitude = (colorCount: number): number => {
  if (!Number.isFinite(colorCount) || colorCount <= 0) return 0;
  return Math.min(96, Math.max(16, (255 / Math.cbrt(colorCount)) * 0.5));
};

/** 抖动偏移: 由 (gx, gy) 处的 Bayer 值换算成 -amp/2 ~ +amp/2 */
export const ditherOffset = (gx: number, gy: number, amp: number): number =>
  ((BAYER[(Math.abs(gy) % 4) * 4 + (Math.abs(gx) % 4)] / 16) - 0.5) * amp;

/** 颜色距离平方 (RGB 欧氏距离, 够用且快) */
export const colorDistance2 = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number => {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return dr * dr + dg * dg + db * db;
};

/** 在调色板中找最接近的颜色 (调色板为空时返回入参四舍五入后的黑色) */
export const nearestColor = (palette: Rgb[], r: number, g: number, b: number): Rgb => {
  if (!palette || palette.length === 0) return { r: clampByte(r), g: clampByte(g), b: clampByte(b) };
  let best = palette[0];
  let bestD = Infinity;
  for (const c of palette) {
    const d = colorDistance2(r, g, b, c.r, c.g, c.b);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
};

/**
 * 中位切分 (median cut) 自适应取色: 从网格颜色里挑出最多 maxColors 种代表色
 *
 * 为了在上百万色块的图上也能秒出结果, 先把颜色归入 5 bit/通道 的直方图桶 (最多 32768 桶),
 * 桶里记录像素数与各通道总和, 代表色取桶内真实平均值; 之后再对桶做中位切分。
 */
export const medianCut = (grid: PixelGrid, maxColors: number): Rgb[] => {
  const n = Math.floor(maxColors);
  if (!(n >= 1)) return [];

  interface Bucket { r: number; g: number; b: number; count: number; sr: number; sg: number; sb: number; }
  const buckets = new Map<number, Bucket>();
  for (let i = 0; i + 2 < grid.rgb.length; i += 3) {
    const r = grid.rgb[i];
    const g = grid.rgb[i + 1];
    const b = grid.rgb[i + 2];
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const hit = buckets.get(key);
    if (hit) {
      hit.sr += r;
      hit.sg += g;
      hit.sb += b;
      hit.count++;
    } else {
      buckets.set(key, { r: r >> 3, g: g >> 3, b: b >> 3, count: 1, sr: r, sg: g, sb: b });
    }
  }
  const entries = Array.from(buckets.values());
  if (entries.length === 0) return [];
  if (entries.length <= n) {
    return entries
      .sort((a, b) => b.count - a.count || a.r - b.r || a.g - b.g || a.b - b.b)
      .map((e) => ({ r: clampByte(e.sr / e.count), g: clampByte(e.sg / e.count), b: clampByte(e.sb / e.count) }));
  }

  /** 盒子统计: 跨度最大的通道 + 加权平均色 + 像素总数 */
  const statOf = (list: Bucket[]) => {
    let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
    let sr = 0, sg = 0, sb = 0, sw = 0;
    for (const e of list) {
      const r = e.sr / e.count;
      const g = e.sg / e.count;
      const b = e.sb / e.count;
      if (r < rMin) rMin = r;
      if (r > rMax) rMax = r;
      if (g < gMin) gMin = g;
      if (g > gMax) gMax = g;
      if (b < bMin) bMin = b;
      if (b > bMax) bMax = b;
      sr += e.sr;
      sg += e.sg;
      sb += e.sb;
      sw += e.count;
    }
    const spanR = rMax - rMin;
    const spanG = gMax - gMin;
    const spanB = bMax - bMin;
    const channel = spanR >= spanG && spanR >= spanB ? 0 : spanG >= spanB ? 1 : 2;
    const span = channel === 0 ? spanR : channel === 1 ? spanG : spanB;
    return {
      channel, span, weight: sw,
      avg: { r: clampByte(sr / sw), g: clampByte(sg / sw), b: clampByte(sb / sw) } as Rgb,
    };
  };

  let boxes = [ { list: entries, stat: statOf(entries) } ];
  while (boxes.length < n) {
    // 选跨度最大的盒子继续切分; 全部盒子都不可再分则结束
    let pick = -1;
    let pickSpan = 0;
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      if (box.list.length < 2 || box.stat.span <= 0) continue;
      if (box.stat.span > pickSpan) {
        pickSpan = box.stat.span;
        pick = i;
      }
    }
    if (pick < 0) break;
    const box = boxes[pick];
    const { channel, weight } = box.stat;
    const key = channel === 0 ? 'sr' : channel === 1 ? 'sg' : 'sb';
    const sorted = [ ...box.list ].sort((a, b) => ((a[key] / a.count) - (b[key] / b.count)) || (a.count - b.count));
    // 按累计像素数取中位, 让两半的"面积"尽量均衡
    let acc = 0;
    let cut = 1;
    for (let i = 0; i < sorted.length; i++) {
      acc += sorted[i].count;
      if (acc * 2 >= weight) {
        cut = Math.min(sorted.length - 1, Math.max(1, i + 1));
        break;
      }
    }
    const left = sorted.slice(0, cut);
    const right = sorted.slice(cut);
    if (left.length === 0 || right.length === 0) break;
    boxes = [
      ...boxes.slice(0, pick),
      { list: left, stat: statOf(left) },
      { list: right, stat: statOf(right) },
      ...boxes.slice(pick + 1),
    ];
  }

  const out: Rgb[] = [];
  const seen = new Set<string>();
  for (const box of boxes) {
    const { avg } = box.stat;
    const key = `${avg.r},${avg.g},${avg.b}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(avg);
  }
  return out;
};

/** 调色板 hex 表 -> Rgb 表 */
export const parsePalette = (key: PaletteKey): Rgb[] =>
  PALETTE_DEFS[key].colors.map(hexToRgb);

/**
 * 解析当前设置下实际使用的调色板
 * @returns null = 不量化 (关闭调色板); 空数组 = 无法确定 (未使用)
 */
export const resolvePalette = (key: PaletteKey, grid: PixelGrid): Rgb[] | null => {
  const k = normalizePalette(key);
  if (k === 'off') return null;
  if (k in AUTO_COUNTS) return medianCut(grid, AUTO_COUNTS[k]);
  return parsePalette(k);
};

/** 用调色板量化网格 (就地修改); palette 为空则不做处理 */
export const quantizeGrid = (grid: PixelGrid, palette: Rgb[], dither = DITHER_DEFAULT): void => {
  if (!palette || palette.length === 0) return;
  const amp = dither ? ditherAmplitude(palette.length) : 0;
  for (let gy = 0; gy < grid.gh; gy++) {
    for (let gx = 0; gx < grid.gw; gx++) {
      const gi = gy * grid.gw + gx;
      const off = ditherOffset(gx, gy, amp);
      const c = nearestColor(
        palette,
        grid.rgb[gi * 3] + off,
        grid.rgb[gi * 3 + 1] + off,
        grid.rgb[gi * 3 + 2] + off,
      );
      grid.rgb[gi * 3] = c.r;
      grid.rgb[gi * 3 + 1] = c.g;
      grid.rgb[gi * 3 + 2] = c.b;
    }
  }
};

/** 位深量化: 每通道保留 bits 位 (如 SMS 2 位 = 各通道 4 阶) */
export const quantizeGridBits = (grid: PixelGrid, bits: number, dither = DITHER_DEFAULT): void => {
  const b = Math.floor(bits);
  if (!(b >= 1 && b <= 8)) return;
  const levels = Math.pow(2, b);
  const step = 255 / (levels - 1);
  const amp = dither ? step : 0;
  for (let gy = 0; gy < grid.gh; gy++) {
    for (let gx = 0; gx < grid.gw; gx++) {
      const gi = gy * grid.gw + gx;
      const off = ditherOffset(gx, gy, amp);
      for (let c = 0; c < 3; c++) {
        const v = grid.rgb[gi * 3 + c] + off;
        grid.rgb[gi * 3 + c] = clampByte(Math.min(levels - 1, Math.max(0, Math.round(v / step))) * step);
      }
    }
  }
};

// ---------------------------------------------------------------------------
// 完整流程
// ---------------------------------------------------------------------------

export interface PixelArtOptions {
  /** 像素块边长 (px) */
  block: number;
  /** 是否转灰度 */
  grayscale?: boolean;
  /** 调色板 (off = 不量化) */
  palette?: PaletteKey;
  /** 是否开启抖动 */
  dither?: boolean;
}

/**
 * 像素图主流程: 像素化 -> 灰度 -> 调色板量化 (含抖动) -> 展开回原尺寸
 * @returns 与原图等长的 RGBA 数据 (尺寸不变, 每个像素块填充同一颜色)
 */
export const pixelArt = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  opts: PixelArtOptions,
): Uint8ClampedArray => {
  const grid = buildGrid(data, width, height, opts.block);
  if (opts.grayscale) grayscaleGrid(grid);
  const key = normalizePalette(opts.palette ?? 'off');
  const dither = opts.dither ?? DITHER_DEFAULT;
  const bits = PALETTE_DEFS[key].bits;
  if (bits) {
    quantizeGridBits(grid, bits, dither);
  } else if (key !== 'off') {
    const palette = resolvePalette(key, grid);
    if (palette && palette.length > 0) quantizeGrid(grid, palette, dither);
  }
  return expandGrid(grid);
};

/** 块数 (网格尺寸): 用于页面展示 "换算后 N × M 个色块" */
export const gridSize = (width: number, height: number, block: number): { gw: number; gh: number } => {
  const b = normalizeBlock(block);
  const w = Math.max(1, Math.floor(width));
  const h = Math.max(1, Math.floor(height));
  return { gw: Math.max(1, Math.ceil(w / b)), gh: Math.max(1, Math.ceil(h / b)) };
};

// ---------------------------------------------------------------------------
// 设置中心: 默认快捷配置
// ---------------------------------------------------------------------------

const STORE_KEY = 'pixelart:default-preset';

/** 读取默认快捷配置 (仅三种预设有效; 非法 / 未设置回退 portrait) */
export const getDefaultPreset = (): FixedPreset => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw === 'portrait' || raw === 'game' || raw === 'abstract') return raw;
  } catch {
    /* localStorage 不可用时忽略 */
  }
  return PRESET_DEFAULT as FixedPreset;
};

/** 写入默认快捷配置 */
export const setDefaultPreset = (v: Preset): void => {
  const p = normalizePreset(v);
  const fixed: FixedPreset = p === 'custom' ? (PRESET_DEFAULT as FixedPreset) : p;
  try {
    localStorage.setItem(STORE_KEY, fixed);
  } catch {
    /* localStorage 不可用时忽略 */
  }
};

/** 页面初始参数: 由默认快捷配置展开 */
export const initialSettings = (): { preset: Preset; settings: PresetDef } => {
  const preset = getDefaultPreset();
  return { preset, settings: PRESET_DEFS[preset] };
};
