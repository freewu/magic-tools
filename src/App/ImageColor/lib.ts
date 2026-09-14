// 图片主题色提取: 像素统计 -> 相似色合并 -> 按占比排序
//
// 设计要点:
// 1. 统计阶段先按「色阶桶」(bucket) 量化, 把相近的像素归到同一桶, 既降内存又提速;
// 2. 合并阶段用切比雪夫距离 (各通道差值的最大值) 衡量相似度, 阈值由「相似度级别」映射;
// 3. 簇的代表色取加权平均 (按像素数), 合并后仍能反映该色系的真实观感;
// 4. 簇数量达到上限后, 剩余颜色并入最接近的簇, 保证所有像素都被统计, 占比之和为 100%。

export type Rgb = { r: number; g: number; b: number };

/** 一种颜色及其像素数 */
export type ColorEntry = { rgb: Rgb; count: number };

/** 调色板条目: hex + 占比 */
export type PaletteColor = { hex: string; rgb: Rgb; count: number; ratio: number };

export type CountResult = { entries: ColorEntry[]; total: number; unique: number };

export type CountOptions = {
  /** 色阶桶: 1 = 不量化, 2/4/8/16 = 各通道按该粒度取整 */
  bucket?: number;
  /** 忽略透明像素 (α 小于等于阈值) */
  ignoreTransparent?: boolean;
  /** 透明度阈值 0-255 */
  alphaThreshold?: number;
};

export type ExtractOptions = {
  /** 合并相似颜色 (关闭则输出精确 TopN) */
  merge?: boolean;
  /** 相似度级别 1-10, 越大合并越激进 */
  level?: number;
  /** 输出颜色数上限 */
  maxColors?: number;
  ignoreTransparent?: boolean;
  alphaThreshold?: number;
};

export type ExtractResult = {
  /** 按占比降序 */
  palette: PaletteColor[];
  /** 参与统计的像素总数 (不含被忽略的透明像素) */
  total: number;
  /** 量化后、合并前的颜色种数 */
  unique: number;
  /** 合并后的颜色种数 */
  merged: number;
  /** 本次使用的色阶桶 */
  bucket: number;
  /** 本次使用的相似度阈值 (切比雪夫距离) */
  tolerance: number;
};

/** 相似度级别范围与默认值 */
export const LEVEL_MIN = 1;
export const LEVEL_MAX = 10;
export const LEVEL_DEFAULT = 4;

/** 输出颜色数范围与默认值 */
export const COLORS_MIN = 1;
export const COLORS_MAX = 64;
export const COLORS_DEFAULT = 12;

/** 透明度阈值范围与默认值 */
export const ALPHA_MIN = 0;
export const ALPHA_MAX = 255;
export const ALPHA_DEFAULT = 16;

/** 分析用的最大边长 (超出则等比缩小, 避免超大图占用过多内存) */
export const MAX_EDGE = 1024;

/** 各相似度级别对应的色阶桶 */
const BUCKETS = [ 1, 1, 2, 2, 4, 4, 8, 8, 16, 16 ];

/** 数值夹取 (取整) */
export const clamp = (value: number, min: number, max: number): number =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : min;

/** 等比缩放到最大边之内 (返回分析尺寸与原图比例) */
export const fitSize = (
  width: number,
  height: number,
  maxEdge = MAX_EDGE
): { width: number; height: number; scale: number } => {
  const w = Math.max(1, Math.round(Number.isFinite(width) ? width : 1));
  const h = Math.max(1, Math.round(Number.isFinite(height) ? height : 1));
  const edge = Math.max(w, h);
  if (maxEdge <= 0 || edge <= maxEdge) return { width: w, height: h, scale: 1 };
  const scale = maxEdge / edge;
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)), scale };
};

const hex2 = (v: number): string => clamp(v, 0, 255).toString(16).padStart(2, '0');

/** Rgb -> #rrggbb (小写) */
export const rgbToHex = (rgb: Rgb): string => `#${hex2(rgb.r)}${hex2(rgb.g)}${hex2(rgb.b)}`;

/** #rgb / #rrggbb -> Rgb (非法返回 null) */
export const hexToRgb = (hex: string): Rgb | null => {
  const raw = String(hex ?? '').trim().replace(/^#/, '');
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
};

/** Rgb -> rgb(r, g, b) */
export const formatRgb = (rgb: Rgb): string => `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

/** 占比 -> 百分数字符串 */
export const formatRatio = (ratio: number, digits = 2): string =>
  `${(Number.isFinite(ratio) ? ratio * 100 : 0).toFixed(digits)}%`;

/** 依据相对亮度选前景色, 保证色块上的文字可读 */
export const contrastColor = (rgb: Rgb, dark = '#000000', light = '#ffffff'): string => {
  const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return lum > 0.6 ? dark : light;
};

/** 相似度级别 -> 色阶桶 */
export const levelToBucket = (level: number): number => BUCKETS[clamp(level, LEVEL_MIN, LEVEL_MAX) - 1];

/** 相似度级别 -> 相似度阈值 (切比雪夫距离 8-80) */
export const levelToTolerance = (level: number): number => clamp(level, LEVEL_MIN, LEVEL_MAX) * 8;

/** 单通道色阶量化 (取桶中心值, 保证结果仍在 0-255) */
const quantizeChannel = (v: number, bucket: number): number =>
  bucket <= 1 ? v : Math.min(255, Math.floor(v / bucket) * bucket + Math.floor(bucket / 2));

/** 按色阶桶量化颜色 */
export const quantizeRgb = (rgb: Rgb, bucket: number): Rgb => ({
  r: quantizeChannel(rgb.r, bucket),
  g: quantizeChannel(rgb.g, bucket),
  b: quantizeChannel(rgb.b, bucket),
});

/** 切比雪夫距离: 各通道差值的最大值 */
export const colorDistance = (a: Rgb, b: Rgb): number =>
  Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b));

/** 量化后的桶 key (仅用于归组) */
const bucketKey = (rgb: Rgb, bucket: number): string => {
  const q = quantizeRgb(rgb, bucket);
  return `${q.r},${q.g},${q.b}`;
};

/**
 * 统计像素颜色分布 (RGBA 扁平数据, 每 4 个一组)
 *
 * 同桶内累加原始通道值, 因此代表色是该桶像素的真实平均色 (量化只用于归组, 不改写颜色)。
 * @param data ImageData.data
 */
export const countColors = (data: Uint8ClampedArray, opts: CountOptions = {}): CountResult => {
  const bucket = Math.max(1, Math.round(opts.bucket ?? 1));
  const ignoreTransparent = opts.ignoreTransparent ?? true;
  const alphaThreshold = clamp(opts.alphaThreshold ?? ALPHA_DEFAULT, ALPHA_MIN, ALPHA_MAX);
  const acc = new Map<string, { r: number; g: number; b: number; count: number }>();
  let total = 0;
  for (let i = 0; i + 3 < data.length; i += 4) {
    if (ignoreTransparent && data[i + 3] <= alphaThreshold) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = bucketKey({ r, g, b }, bucket);
    const cur = acc.get(key);
    if (cur) {
      cur.r += r; cur.g += g; cur.b += b; cur.count += 1;
    } else {
      acc.set(key, { r, g, b, count: 1 });
    }
    total += 1;
  }
  const entries: ColorEntry[] = Array.from(acc.values())
    .map((a) => ({
      rgb: { r: Math.round(a.r / a.count), g: Math.round(a.g / a.count), b: Math.round(a.b / a.count) },
      count: a.count,
    }))
    .sort((a, b) => b.count - a.count);
  return { entries, total, unique: acc.size };
};

/**
 * 合并相似颜色: 按像素数从多到少建立色簇, 落在阈值内就并入 (代表色取加权平均);
 * 色簇达到上限后, 剩余颜色并入最接近的簇, 保证不丢失像素。
 */
export const mergeEntries = (entries: ColorEntry[], tolerance: number, maxClusters: number): ColorEntry[] => {
  const limit = Math.max(1, Math.round(maxClusters));
  const sorted = [ ...entries ].sort((a, b) => b.count - a.count);
  const clusters: ColorEntry[] = [];
  for (const e of sorted) {
    let hit = -1; // 阈值内最近 (最先遇到) 的簇
    let nearest = -1; // 全局最近的簇
    let nearestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < clusters.length; i++) {
      const d = colorDistance(e.rgb, clusters[i].rgb);
      if (d < nearestDist) { nearestDist = d; nearest = i; }
      if (hit === -1 && d <= tolerance) hit = i;
    }
    const target = hit >= 0 ? hit : (clusters.length < limit ? -1 : nearest);
    if (target < 0) { clusters.push({ rgb: { ...e.rgb }, count: e.count }); continue; }
    const c = clusters[target];
    const total = c.count + e.count;
    c.rgb = {
      r: Math.round((c.rgb.r * c.count + e.rgb.r * e.count) / total),
      g: Math.round((c.rgb.g * c.count + e.rgb.g * e.count) / total),
      b: Math.round((c.rgb.b * c.count + e.rgb.b * e.count) / total),
    };
    c.count = total;
  }
  return clusters.sort((a, b) => b.count - a.count);
};

/** 提取调色板: 统计 -> 量化 -> 合并 -> 按占比降序 */
export const extractPalette = (data: Uint8ClampedArray, opts: ExtractOptions = {}): ExtractResult => {
  const merge = opts.merge ?? true;
  const level = clamp(opts.level ?? LEVEL_DEFAULT, LEVEL_MIN, LEVEL_MAX);
  const maxColors = clamp(opts.maxColors ?? COLORS_DEFAULT, COLORS_MIN, COLORS_MAX);
  const bucket = merge ? levelToBucket(level) : 1;
  const tolerance = merge ? levelToTolerance(level) : 0;
  const { entries, total, unique } = countColors(data, {
    bucket,
    ignoreTransparent: opts.ignoreTransparent,
    alphaThreshold: opts.alphaThreshold,
  });
  const kept = merge
    ? mergeEntries(entries, tolerance, maxColors)
    : [ ...entries ].sort((a, b) => b.count - a.count).slice(0, maxColors);
  const palette: PaletteColor[] = [ ...kept ]
    .sort((a, b) => b.count - a.count)
    .map((e) => ({ hex: rgbToHex(e.rgb), rgb: e.rgb, count: e.count, ratio: total > 0 ? e.count / total : 0 }));
  return { palette, total, unique, merged: kept.length, bucket, tolerance };
};

/** 列表颜色合计覆盖的像素占比 (关闭合并时可能小于 1) */
export const coverage = (palette: PaletteColor[]): number =>
  palette.reduce((sum, c) => sum + (Number.isFinite(c.ratio) ? c.ratio : 0), 0);

export type PaletteTextMode = 'plain' | 'detail';

/** 调色板文本 (复制 / 下载用) */
export const paletteToText = (palette: PaletteColor[], mode: PaletteTextMode = 'detail'): string =>
  palette
    .map((c) => (mode === 'detail'
      ? `${c.hex}  ${formatRgb(c.rgb)}  ${formatRatio(c.ratio)}  ${c.count}px`
      : `${c.hex}  ${formatRatio(c.ratio)}`))
    .join('\n');

/** 调色板 CSV */
export const paletteToCsv = (palette: PaletteColor[]): string => [
  'hex,r,g,b,count,ratio',
  ...palette.map((c) => [ c.hex, c.rgb.r, c.rgb.g, c.rgb.b, c.count, `${(c.ratio * 100).toFixed(4)}%` ].join(',')),
].join('\n');
