// 拼豆图纸: 图片 -> 拼豆图纸 纯逻辑层 (不依赖 canvas / DOM, 便于单测)
//
// 参考 https://www.bitbead.app/zh/generator 的做法:
//   1) 把图片缩到目标豆数 (宽 x 高 格), 每格取平均色 -> 亮度/对比度/饱和度微调
//   2) 背景留空: 透明格不放豆; 边缘主色 (纯色背景) 附近的格子也不放豆
//   3) 用色数限制: 中位切分取候选色 -> CIEDE2000 匹配到品牌色卡 -> 按用量保留前 N 色
//   4) 逐格匹配到最终色号 (可选 4x4 Bayer 有序抖动)
//   5) 统计豆数 / 成品尺寸 / 拼豆板数; 导出图纸 CSV / 用量清单
//
// 说明: 中位切分与 Bayer 抖动复用「像素图」工具的实现 (src/App/PixelArt/lib.ts),
//       本文件只按「每格 = 一颗豆」的粒度做色号匹配与统计。
import { medianCut, ditherAmplitude, ditherOffset, type PixelGrid, type Rgb } from '../PixelArt/lib';
import type { BeadBrand } from './palette';

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

export const WIDTH_MIN = 8;
export const WIDTH_MAX = 200;
export const COLORS_MIN = 2;
export const COLORS_MAX = 48;
export const DEFAULT_WIDTH = 58;
export const DEFAULT_COLORS = 16;
/** 低于该 α 的格子视为无豆 (透明背景) */
export const ALPHA_MIN = 128;
/** 背景识别默认色差阈值 (ΔE00): 与边缘主色差小于该值即视为背景 */
export const BG_THRESHOLD = 8;
/** 标准拼豆板规格 29 x 29 */
export const PEGBOARD = 29;

// ---------------------------------------------------------------------------
// 颜色空间: sRGB -> Lab, ΔE76 / ΔE00 (CIEDE2000)
// ---------------------------------------------------------------------------

export interface Lab { L: number; a: number; b: number; }

const toRad = (deg: number): number => (deg * Math.PI) / 180;

const srgbToLinear = (v: number): number => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const labF = (t: number): number => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29);

/** sRGB (0-255) -> CIE Lab (D65) */
export const rgbToLab = (r: number, g: number, b: number): Lab => {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  const X = R * 0.4124564 + G * 0.3575761 + B * 0.1804375;
  const Y = R * 0.2126729 + G * 0.7151522 + B * 0.0721750;
  const Z = R * 0.0193339 + G * 0.1191920 + B * 0.9503041;
  const fx = labF(X / 0.95047);
  const fy = labF(Y);
  const fz = labF(Z / 1.08883);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
};

/** #RRGGBB -> Rgb (非法输入返回黑色) */
export const hexToRgb = (hex: string): Rgb => {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(String(hex ?? '').trim());
  if (!m) return { r: 0, g: 0, b: 0 };
  const v = parseInt(m[1], 16);
  return { r: (v >> 16) & 0xff, g: (v >> 8) & 0xff, b: v & 0xff };
};

/** Lab 欧氏距离 (ΔE76): 快, 用于粗排 */
export const deltaE76 = (l1: Lab, l2: Lab): number =>
  Math.hypot(l1.L - l2.L, l1.a - l2.a, l1.b - l2.b);

/**
 * CIEDE2000 色差 (ΔE00): 与人眼感知更接近, 用于色卡匹配
 * 公式按 Sharma / Wu / Dalal (2005) 的标准实现 (kL = kC = kH = 1)
 */
export const deltaE2000 = (l1: Lab, l2: Lab): number => {
  const { L: L1, a: a1, b: b1 } = l1;
  const { L: L2, a: a2, b: b2 } = l2;
  const c1 = Math.hypot(a1, b1);
  const c2 = Math.hypot(a2, b2);
  const cBar = (c1 + c2) / 2;
  const cBar7 = cBar ** 7;
  const g = 0.5 * (1 - Math.sqrt(cBar7 / (cBar7 + 25 ** 7)));
  const a1p = (1 + g) * a1;
  const a2p = (1 + g) * a2;
  const c1p = Math.hypot(a1p, b1);
  const c2p = Math.hypot(a2p, b2);
  const hue = (b: number, ap: number): number => {
    if (b === 0 && ap === 0) return 0;
    const h = (Math.atan2(b, ap) * 180) / Math.PI;
    return h >= 0 ? h : h + 360;
  };
  const h1p = hue(b1, a1p);
  const h2p = hue(b2, a2p);
  const dLp = L2 - L1;
  const dCp = c2p - c1p;
  let dhp = 0;
  if (c1p * c2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(c1p * c2p) * Math.sin(toRad(dhp) / 2);
  const lBarP = (L1 + L2) / 2;
  const cBarP = (c1p + c2p) / 2;
  let hBarP: number;
  if (c1p * c2p === 0) {
    hBarP = h1p + h2p;
  } else {
    hBarP = (h1p + h2p) / 2;
    if (Math.abs(h1p - h2p) > 180) hBarP += h1p + h2p < 360 ? 180 : -180;
  }
  const T = 1
    - 0.17 * Math.cos(toRad(hBarP - 30))
    + 0.24 * Math.cos(toRad(2 * hBarP))
    + 0.32 * Math.cos(toRad(3 * hBarP + 6))
    - 0.2 * Math.cos(toRad(4 * hBarP - 63));
  const dTheta = 30 * Math.exp(-(((hBarP - 275) / 25) ** 2));
  const cBarP7 = cBarP ** 7;
  const rc = 2 * Math.sqrt(cBarP7 / (cBarP7 + 25 ** 7));
  const l50 = (lBarP - 50) ** 2;
  const sl = 1 + (0.015 * l50) / Math.sqrt(20 + l50);
  const sc = 1 + 0.045 * cBarP;
  const sh = 1 + 0.015 * cBarP * T;
  const rt = -Math.sin(toRad(2 * dTheta)) * rc;
  const t1 = dLp / sl;
  const t2 = dCp / sc;
  const t3 = dHp / sh;
  return Math.sqrt(t1 * t1 + t2 * t2 + t3 * t3 + rt * t2 * t3);
};

// ---------------------------------------------------------------------------
// 品牌色卡 -> 带 Lab 的豆子列表 (按品牌缓存, 避免每次重算)
// ---------------------------------------------------------------------------

export interface Bead {
  /** 在 brand.colors 中的下标 */
  index: number;
  code: string;
  name: string;
  hex: string;
  rgb: Rgb;
  lab: Lab;
}

const beadCache = new Map<string, Bead[]>();

export const beadsOf = (brand: BeadBrand): Bead[] => {
  const hit = beadCache.get(brand.key);
  if (hit) return hit;
  const list = brand.colors.map((c, index) => {
    const rgb = hexToRgb(c.hex);
    return { index, code: c.code, name: c.name, hex: c.hex, rgb, lab: rgbToLab(rgb.r, rgb.g, rgb.b) };
  });
  beadCache.set(brand.key, list);
  return list;
};

// ---------------------------------------------------------------------------
// 像素 -> 豆格网格
// ---------------------------------------------------------------------------

/** 豆格网格: 每格 1 颗豆 (rgb 长度 w*h*3, alpha 长度 w*h) */
export interface CellGrid {
  w: number;
  h: number;
  rgb: Uint8Array;
  alpha: Uint8Array;
}

export interface AdjustOpts {
  /** 亮度偏移 -100 ~ 100 (100 = 整体 +1.0, 即 +255) */
  brightness?: number;
  /** 对比度 -100 ~ 100 (以 0.5 中灰为基准缩放) */
  contrast?: number;
  /** 饱和度 -100 ~ 100 (-100 变灰, 100 约 2 倍) */
  saturation?: number;
}

const clampByte = (v: number): number => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));

/** 单格颜色微调 (与「ASCII 图片」工具的亮度/对比度公式保持一致, 另加饱和度) */
export const adjustRgb = (r: number, g: number, b: number, o: AdjustOpts = {}): Rgb => {
  const brightness = (o.brightness ?? 0) / 100;
  const contrast = (o.contrast ?? 0) / 100;
  const saturation = (o.saturation ?? 0) / 100;
  const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const k = contrast >= 0 ? 1 + contrast : 1 / (1 - contrast);
  const f = (v: number): number => {
    // 先按饱和度向灰度插值 (saturation = -1 即纯灰), 再走亮度/对比度
    let x = gray + (v - gray) * (1 + saturation);
    x = x / 255 + brightness;
    x = (x - 0.5) * k + 0.5;
    return clampByte(x * 255);
  };
  return { r: f(r), g: f(g), b: f(b) };
};

/**
 * RGBA 像素数据 -> 豆格网格
 * 调用方需先把图片缩放绘制成 w x h (每像素 = 一颗豆), 这里只做取色与微调
 */
export const toCellGrid = (
  data: Uint8ClampedArray | Uint8Array,
  w: number,
  h: number,
  opts: AdjustOpts = {},
): CellGrid => {
  const width = Math.max(1, Math.floor(w));
  const height = Math.max(1, Math.floor(h));
  const n = width * height;
  const rgb = new Uint8Array(n * 3);
  const alpha = new Uint8Array(n);
  const adjust = (opts.brightness ?? 0) !== 0 || (opts.contrast ?? 0) !== 0 || (opts.saturation ?? 0) !== 0;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const a = data[o + 3] ?? 255;
    alpha[i] = a;
    const c = adjust
      ? adjustRgb(data[o] ?? 0, data[o + 1] ?? 0, data[o + 2] ?? 0, opts)
      : { r: data[o] ?? 0, g: data[o + 1] ?? 0, b: data[o + 2] ?? 0 };
    rgb[i * 3] = clampByte(c.r);
    rgb[i * 3 + 1] = clampByte(c.g);
    rgb[i * 3 + 2] = clampByte(c.b);
  }
  return { w: width, h: height, rgb, alpha };
};

// ---------------------------------------------------------------------------
// 背景留空
// ---------------------------------------------------------------------------

export interface BackgroundResult {
  /** 1 = 放豆, 0 = 留空 */
  mask: Uint8Array;
  /** 识别出的背景色 (未识别到纯色背景时为 null) */
  bg: Rgb | null;
  bgHex: string | null;
}

const rgbToHex = (c: Rgb): string =>
  '#' + [ c.r, c.g, c.b ].map((v) => clampByte(v).toString(16).padStart(2, '0')).join('').toUpperCase();

/**
 * 生成放豆掩码
 * - α < alphaMin 的格子一律留空
 * - removeBg 时: 取图片四条边上出现次数占优 (≥ 50%) 的颜色作为背景色,
 *   与其色差 < threshold (ΔE00) 的格子留空 (纯色背景的照片不用手动抠图)
 */
export const backgroundMask = (
  grid: CellGrid,
  removeBg = true,
  threshold = BG_THRESHOLD,
  alphaMin = ALPHA_MIN,
): BackgroundResult => {
  const { w, h, rgb, alpha } = grid;
  const mask = new Uint8Array(w * h);
  let bg: Rgb | null = null;
  if (removeBg) {
    // 边缘取样: 上 / 下两行 + 左 / 右两列
    const buckets = new Map<number, { count: number; sr: number; sg: number; sb: number }>();
    let border = 0;
    const take = (i: number) => {
      if (alpha[i] < alphaMin) return;
      const r = rgb[i * 3];
      const g = rgb[i * 3 + 1];
      const b = rgb[i * 3 + 2];
      const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      const hit = buckets.get(key);
      border++;
      if (hit) {
        hit.count++;
        hit.sr += r;
        hit.sg += g;
        hit.sb += b;
      } else {
        buckets.set(key, { count: 1, sr: r, sg: g, sb: b });
      }
    };
    for (let x = 0; x < w; x++) {
      take(x);
      if (h > 1) take((h - 1) * w + x);
    }
    for (let y = 0; y < h; y++) {
      take(y * w);
      if (w > 1) take(y * w + w - 1);
    }
    let best: { count: number; sr: number; sg: number; sb: number } | null = null;
    for (const v of buckets.values()) if (!best || v.count > best.count) best = v;
    if (best && border > 0 && best.count / border >= 0.5) {
      bg = { r: Math.round(best.sr / best.count), g: Math.round(best.sg / best.count), b: Math.round(best.sb / best.count) };
    }
  }
  const bgLab = bg ? rgbToLab(bg.r, bg.g, bg.b) : null;
  for (let i = 0; i < w * h; i++) {
    if (alpha[i] < alphaMin) continue;
    if (bgLab && threshold > 0) {
      const lab = rgbToLab(rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]);
      if (deltaE2000(lab, bgLab) < threshold) continue;
    }
    mask[i] = 1;
  }
  return { mask, bg, bgHex: bg ? rgbToHex(bg) : null };
};

// ---------------------------------------------------------------------------
// 色号匹配 (用色数限制 + CIEDE2000)
// ---------------------------------------------------------------------------

/** 在候选 Lab 列表里精算最近的色 (ΔE00 全扫描; 只在“选色”阶段用, 调用次数少) */
const nearestExact = (lab: Lab, labs: Lab[]): number => {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < labs.length; i++) {
    const d = deltaE2000(lab, labs[i]);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
};

/** 逐格匹配用: 先 ΔE76 粗排取前 6, 再 ΔE00 精算 (快且足够准) */
const nearestFast = (lab: Lab, labs: Lab[]): number => {
  const K = 6;
  const idx = new Array<number>(K).fill(-1);
  const dist = new Array<number>(K).fill(Infinity);
  for (let i = 0; i < labs.length; i++) {
    const d = deltaE76(lab, labs[i]);
    for (let k = 0; k < K; k++) {
      if (d < dist[k]) {
        for (let j = K - 1; j > k; j--) {
          dist[j] = dist[j - 1];
          idx[j] = idx[j - 1];
        }
        dist[k] = d;
        idx[k] = i;
        break;
      }
    }
  }
  if (labs.length === 1) return 0;
  let best = idx[0] < 0 ? 0 : idx[0];
  let bestD = Infinity;
  for (const i of idx) {
    if (i < 0) continue;
    const d = deltaE2000(lab, labs[i]);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
};

export interface QuantizeOpts {
  /** 最多用几种颜色 */
  maxColors?: number;
  /** 有序抖动 (色少时靠抖动补层次; 单色豆阵会略微变"花") */
  dither?: boolean;
}

export interface QuantizeResult {
  /** 每格色号 = brand.colors 的下标, -1 = 留空 */
  cells: Int32Array;
  /** 用到的色号下标, 按用量从多到少 */
  used: number[];
}

/**
 * 把豆格网格量化成品牌色卡里的具体色号
 * 候选色 = 中位切分 (maxColors x 3 种, 覆盖过渡色) 匹配到色卡 -> 按用量保留前 maxColors 种 -> 逐格匹配
 */
export const quantizeToBeads = (
  grid: CellGrid,
  mask: Uint8Array,
  brand: BeadBrand,
  opts: QuantizeOpts = {},
): QuantizeResult => {
  const beads = beadsOf(brand);
  const { w, h, rgb } = grid;
  const n = w * h;
  const cells = new Int32Array(n).fill(-1);
  if (!beads.length) return { cells, used: [] };
  const maxColors = Math.max(1, Math.min(COLORS_MAX, Math.floor(opts.maxColors ?? DEFAULT_COLORS)));

  // 1) 掩码内的格子: 紧凑 RGB (供中位切分) + 唯一色去重 (加速后续匹配)
  const compact: number[] = [];
  const uniqueId = new Int32Array(n).fill(-1);
  const colorMap = new Map<number, number>();
  const ur: number[] = [];
  const ug: number[] = [];
  const ub: number[] = [];
  const ucount: number[] = [];
  for (let i = 0; i < n; i++) {
    if (!mask[i]) continue;
    const r = rgb[i * 3];
    const g = rgb[i * 3 + 1];
    const b = rgb[i * 3 + 2];
    compact.push(r, g, b);
    const key = (r << 16) | (g << 8) | b;
    let id = colorMap.get(key);
    if (id === undefined) {
      id = ur.length;
      colorMap.set(key, id);
      ur.push(r);
      ug.push(g);
      ub.push(b);
      ucount.push(0);
    }
    ucount[id]++;
    uniqueId[i] = id;
  }
  const total = compact.length / 3;
  if (total === 0) return { cells, used: [] };
  const uniq = ur.length;
  const uLab: Lab[] = [];
  for (let u = 0; u < uniq; u++) uLab.push(rgbToLab(ur[u], ug[u], ub[u]));

  // 2) 候选色号: 中位切分取代表色 -> 匹配最近的品牌色
  const cutGrid: PixelGrid = {
    width: w, height: h, block: 1, gw: w, gh: h,
    rgb: Uint8Array.from(compact), alpha: new Uint8Array(total),
  };
  const candCount = Math.min(96, Math.max(4, maxColors * 3));
  const centroids = medianCut(cutGrid, candCount);
  const beadLabs = beads.map((b) => b.lab);
  const picked = new Set<number>();
  for (const c of centroids) {
    const lab = rgbToLab(c.r, c.g, c.b);
    picked.add(beads[nearestExact(lab, beadLabs)].index);
  }
  // 候选不足时用出现最多的唯一色补齐 (色卡粒度粗时中位切分容易塌缩成同一种豆),
  // 同时各补一个次近色, 让「抖动」有第二种豆可用
  if (picked.size < maxColors) {
    const order = Array.from({ length: uniq }, (_, i) => i).sort((a, b) => ucount[b] - ucount[a]);
    for (const u of order.slice(0, 64)) {
      if (picked.size >= maxColors) break;
      const ranked = beadLabs
        .map((lab, i) => ({ i, d: deltaE2000(uLab[u], lab) }))
        .sort((a, b) => a.d - b.d || a.i - b.i);
      for (const r of ranked.slice(0, 2)) {
        if (picked.size >= maxColors) break;
        picked.add(beads[r.i].index);
      }
    }
  }
  let cands = Array.from(picked);
  if (cands.length > 1) {
    // 3) 按用量排序, 只保留前 maxColors 种 (用量小的颜色直接合并掉, 少买一包豆)
    const candLabs = cands.map((i) => beads[i].lab);
    const counts = new Int32Array(cands.length);
    for (let u = 0; u < uniq; u++) counts[nearestFast(uLab[u], candLabs)] += ucount[u];
    const ranked = cands
      .map((beadIndex, pos) => ({ beadIndex, count: counts[pos], pos }))
      .sort((a, b) => b.count - a.count || a.pos - b.pos)
      .slice(0, maxColors)
      .sort((a, b) => a.pos - b.pos);
    cands = ranked.map((r) => r.beadIndex);
  }
  const keptLabs = cands.map((i) => beads[i].lab);

  // 4) 逐格匹配 (抖动时按 4x4 Bayer 给每格加偏移)
  const amp = opts.dither ? ditherAmplitude(cands.length) : 0;
  const finalOfUnique = new Int32Array(uniq);
  const ditherCache = new Map<number, number>();
  const usage = new Int32Array(cands.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const u = uniqueId[i];
      if (u < 0) continue;
      let pos: number;
      if (amp === 0) {
        if (!finalOfUnique[u]) finalOfUnique[u] = nearestFast(uLab[u], keptLabs) + 1;
        pos = finalOfUnique[u] - 1;
      } else {
        const unit = ditherOffset(x, y, 1); // -0.5 ~ +0.5
        const offset = unit * amp;
        const key = u * 16 + Math.round((unit + 0.5) * 16);
        const hit = ditherCache.get(key);
        if (hit !== undefined) {
          pos = hit;
        } else {
          const lab = rgbToLab(clampByte(ur[u] + offset), clampByte(ug[u] + offset), clampByte(ub[u] + offset));
          pos = nearestFast(lab, keptLabs);
          ditherCache.set(key, pos);
        }
      }
      usage[pos]++;
      cells[i] = cands[pos];
    }
  }

  // 5) 用量从多到少 (并列时按色卡原顺序, 保证结果稳定)
  const used = cands
    .map((beadIndex, pos) => ({ beadIndex, count: usage[pos], pos }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count || a.beadIndex - b.beadIndex)
    .map((r) => r.beadIndex);
  return { cells, used };
};

// ---------------------------------------------------------------------------
// 统计: 豆数 / 成品尺寸 / 拼豆板
// ---------------------------------------------------------------------------

export interface BeadUsage {
  index: number;
  code: string;
  name: string;
  hex: string;
  count: number;
  /** 占比 0-1 */
  ratio: number;
}

export interface PatternStats {
  w: number;
  h: number;
  /** 总豆数 (不含留空格) */
  total: number;
  empties: number;
  colors: number;
  used: BeadUsage[];
  /** 单个豆直径 (mm) */
  mm: number;
  /** 成品尺寸 (cm, 保留 1 位小数) */
  sizeCm: { w: number; h: number };
  /** 需要的 29 x 29 拼豆板 */
  boards: { x: number; y: number; total: number };
}

/** 成品尺寸 (cm): 豆数 x 单颗直径 */
export const beadSizeCm = (w: number, h: number, mm: number): { w: number; h: number } => ({
  w: Math.round(w * mm / 10 * 10) / 10,
  h: Math.round(h * mm / 10 * 10) / 10,
});

/** 需要的拼豆板数量 (标准板 board x board 格) */
export const pegboards = (w: number, h: number, board = PEGBOARD): { x: number; y: number; total: number } => {
  const x = Math.max(1, Math.ceil(w / board));
  const y = Math.max(1, Math.ceil(h / board));
  return { x, y, total: x * y };
};

export const patternStats = (cells: Int32Array, w: number, h: number, brand: BeadBrand): PatternStats => {
  const beads = beadsOf(brand);
  const counts = new Map<number, number>();
  let total = 0;
  for (let i = 0; i < cells.length; i++) {
    const v = cells[i];
    if (v < 0) continue;
    total++;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  const used: BeadUsage[] = Array.from(counts.entries())
    .map(([ index, count ]) => {
      const b = beads[index];
      return {
        index,
        code: b ? b.code : String(index),
        name: b ? b.name : '',
        hex: b ? b.hex : '#000000',
        count,
        ratio: total > 0 ? count / total : 0,
      };
    })
    .sort((a, b) => b.count - a.count || a.index - b.index);
  return {
    w, h, total,
    empties: w * h - total,
    colors: used.length,
    used,
    mm: brand.mm,
    sizeCm: beadSizeCm(w, h, brand.mm),
    boards: pegboards(w, h),
  };
};

// ---------------------------------------------------------------------------
// 导出: 图纸矩阵 / 用量清单
// ---------------------------------------------------------------------------

/** 每格色号 ('' = 留空) */
export const codeRows = (cells: Int32Array, w: number, h: number, brand: BeadBrand): string[][] => {
  const beads = beadsOf(brand);
  const rows: string[][] = [];
  for (let y = 0; y < h; y++) {
    const row: string[] = [];
    for (let x = 0; x < w; x++) {
      const v = cells[y * w + x];
      row.push(v < 0 ? '' : (beads[v] ? beads[v].code : ''));
    }
    rows.push(row);
  }
  return rows;
};

/** 图纸 CSV: 首行 / 首列是行列编号, 方便对着图纸数豆 (Excel / 表格软件可打开) */
export const patternCsv = (cells: Int32Array, w: number, h: number, brand: BeadBrand): string => {
  const rows = codeRows(cells, w, h, brand);
  const head = [ '' ].concat(Array.from({ length: w }, (_, x) => String(x + 1)));
  const lines = [ head.join(',') ];
  rows.forEach((row, y) => lines.push([ String(y + 1) ].concat(row).join(',')));
  return lines.join('\r\n') + '\r\n';
};

/** 用量清单 CSV (表头用中英双语, 方便他人直接看) */
export const usageCsv = (stats: PatternStats): string => {
  const lines = [ '色号 Code,颜色名 Name,HEX,数量 Count,占比 Ratio' ];
  for (const u of stats.used) {
    lines.push([ u.code, (u.name || '').replace(/,/g, ' '), u.hex, String(u.count), `${(u.ratio * 100).toFixed(1)}%` ].join(','));
  }
  lines.push([ '合计 Total', '', '', String(stats.total), '100.0%' ].join(','));
  return lines.join('\r\n') + '\r\n';
};

/** 用量清单文本 (复制到聊天 / 备忘; 文案由调用方传入以便多语言) */
export const usageText = (stats: PatternStats, unit: string, totalLabel: string, header: string): string => {
  const lines = [ header ];
  for (const u of stats.used) {
    const name = u.name ? ` ${u.name}` : '';
    lines.push(`${u.code}${name}\t${u.hex}\t${u.count}${unit}\t${(u.ratio * 100).toFixed(1)}%`);
  }
  lines.push(`${totalLabel}\t${stats.total}${unit}\t${stats.w}x${stats.h}`);
  return lines.join('\n');
};

// ---------------------------------------------------------------------------
// 手工修图 (画笔 / 橡皮 / 换色 / 魔棒填充 / 镜像)
// ---------------------------------------------------------------------------

/** 单格涂色 (value = -1 表示擦除); 越界返回原数组副本 */
export const setCell = (cells: Int32Array, w: number, h: number, x: number, y: number, value: number): Int32Array => {
  const next = new Int32Array(cells);
  if (x < 0 || y < 0 || x >= w || y >= h) return next;
  next[y * w + x] = value;
  return next;
};

/** 把图中所有 from 色号换成 to 色号 (换色工具) */
export const replaceColor = (cells: Int32Array, from: number, to: number): Int32Array => {
  const next = new Int32Array(cells);
  for (let i = 0; i < next.length; i++) if (next[i] === from) next[i] = to;
  return next;
};

/** 从 (x,y) 出发把同色连通区填充为 value (魔棒 / 油漆桶), 4 邻域 */
export const fillRegion = (
  cells: Int32Array, w: number, h: number, x: number, y: number, value: number,
): Int32Array => {
  const next = new Int32Array(cells);
  if (x < 0 || y < 0 || x >= w || y >= h) return next;
  const from = next[y * w + x];
  if (from === value) return next;
  const stack: number[] = [ y * w + x ];
  const seen = new Uint8Array(w * h);
  while (stack.length) {
    const i = stack.pop() as number;
    if (seen[i] || next[i] !== from) continue;
    seen[i] = 1;
    next[i] = value;
    const cx = i % w;
    const cy = (i - cx) / w;
    if (cx > 0) stack.push(i - 1);
    if (cx < w - 1) stack.push(i + 1);
    if (cy > 0) stack.push(i - w);
    if (cy < h - 1) stack.push(i + w);
  }
  return next;
};

/** 水平镜像 (熨烫翻面时对照用) */
export const mirrorCells = (cells: Int32Array, w: number, h: number): Int32Array => {
  const next = new Int32Array(cells.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) next[y * w + x] = cells[y * w + (w - 1 - x)];
  }
  return next;
};

/** 高度: 按原图比例换算的豆数 (与原图宽高比一致, 至少 1) */
export const heightForWidth = (srcW: number, srcH: number, outW: number): number => {
  if (!(srcW > 0) || !(srcH > 0)) return Math.max(1, Math.round(outW));
  return Math.max(1, Math.round((outW * srcH) / srcW));
};
