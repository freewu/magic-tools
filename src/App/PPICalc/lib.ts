// PPI 值计算: 分辨率(宽×高 像素) + 屏幕对角线尺寸(英寸)
//   -> 标准 RGB 排列 PPI、Pentile 排列等效 PPI 及相关物理参数
//
// 说明:
//   PPI (Pixels Per Inch) = sqrt(宽² + 高²) / 对角线英寸 (对角线方向每英寸像素数,
//   因像素均匀分布, 水平/垂直方向的每英寸像素数与之相同)。
//   PenTile (菱形/钻石子像素排列, 常见于 OLED) 每个像素只有 2 个子像素
//   (RGB 为标准 3 个), 红色/蓝色通道按 2x2 共享子像素, 等效细节密度约为
//   标准 RGB 的 sqrt(2/3) ≈ 0.8165 倍, 即「Pentile 等效 PPI = RGB PPI × √(2/3)」。

export interface PpiParams {
  /** 分辨率宽度 (像素) */
  widthPx: number;
  /** 分辨率高度 (像素) */
  heightPx: number;
  /** 屏幕对角线尺寸 (英寸) */
  diagInch: number;
}

export interface PpiResult {
  /** 标准 RGB 排列 PPI (对角线) */
  ppi: number;
  /** Pentile 等效 PPI (≈ RGB PPI × 0.8165) */
  pentilePpi: number;
  /** RGB 排列子像素密度 (每英寸 3×ppi) */
  rgbSubpixelPpi: number;
  /** Pentile 排列子像素密度 (每英寸 2×ppi) */
  pentileSubpixelPpi: number;
  /** 物理宽度 (英寸) */
  widthInch: number;
  /** 物理高度 (英寸) */
  heightInch: number;
  /** 总像素 */
  totalPx: number;
  /** 百万像素 (1 位小数) */
  megapixel: number;
  /** 宽高比 (最简整数比, 过大时以 "长:9" 风格近似) */
  ratio: string;
}

const round2 = (x: number): number => Math.round(x * 100) / 100;

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** 宽高比 (宽:高): 最简整数比; 简化后数值过大(如 195:422)时退化为长边/短边数值 (x.xx : 1) */
const ratioOf = (w: number, h: number): string => {
  const g = gcd(w, h);
  const a = w / g;
  const b = h / g;
  if (Math.max(a, b) <= 100) return `${a}:${b}`;
  const long = Math.max(w, h);
  const short = Math.min(w, h);
  return `${(long / short).toFixed(2)} : 1`;
};

export const calcPpi = ({ widthPx, heightPx, diagInch }: PpiParams): PpiResult => {
  if (!Number.isFinite(widthPx) || !Number.isFinite(heightPx) || !Number.isFinite(diagInch)) {
    throw new Error('分辨率与尺寸必须为有效数字');
  }
  if (widthPx <= 0 || heightPx <= 0) throw new Error('分辨率宽高必须为正整数');
  if (diagInch <= 0) throw new Error('屏幕尺寸必须大于 0 英寸');

  const diagPx = Math.hypot(widthPx, heightPx); // 对角线方向像素数
  const ppi = diagPx / diagInch; // 标准 RGB 排列 PPI
  const pentileFactor = Math.sqrt(2 / 3); // Pentile 等效系数 ≈ 0.8165

  return {
    ppi: round2(ppi),
    pentilePpi: round2(ppi * pentileFactor),
    rgbSubpixelPpi: round2(ppi * 3),
    pentileSubpixelPpi: round2(ppi * 2),
    widthInch: round2(widthPx / ppi),
    heightInch: round2(heightPx / ppi),
    totalPx: widthPx * heightPx,
    megapixel: round2((widthPx * heightPx) / 1e6),
    ratio: ratioOf(widthPx, heightPx),
  };
};

/** 常用屏幕预设 (分辨率 + 典型尺寸), label 供 UI 下拉展示 */
export interface ScreenPreset {
  key: string;
  label: string;
  widthPx: number;
  heightPx: number;
  diagInch: number;
}

export const SCREEN_PRESETS: ScreenPreset[] = [
  // 手机 (竖屏)
  { key: 'phone-1080x1920',  label: '手机 1080×1920 · 16:9 · 5.5″',         widthPx: 1080, heightPx: 1920, diagInch: 5.5 },
  { key: 'phone-1080x2340',  label: '手机 1080×2340 · 19.5:9 · 6.4″',       widthPx: 1080, heightPx: 2340, diagInch: 6.4 },
  { key: 'phone-1440x3120',  label: '手机 1440×3120 · 19.5:9 · 6.7″',       widthPx: 1440, heightPx: 3120, diagInch: 6.7 },
  { key: 'phone-1170x2532',  label: 'iPhone 13/14  1170×2532 · 6.1″',       widthPx: 1170, heightPx: 2532, diagInch: 6.1 },
  { key: 'phone-1290x2796',  label: 'iPhone Pro Max 1290×2796 · 6.7″',      widthPx: 1290, heightPx: 2796, diagInch: 6.7 },
  // 平板
  { key: 'pad-1640x2360',    label: '平板 1640×2360 · 2K · 11″',            widthPx: 1640, heightPx: 2360, diagInch: 11 },
  { key: 'pad-2560x1600',    label: '平板 2560×1600 · 16:10 · 10.5″',       widthPx: 2560, heightPx: 1600, diagInch: 10.5 },
  // 笔记本
  { key: 'nb-1920x1200',     label: '笔记本 1920×1200 · 16:10 · 14″',       widthPx: 1920, heightPx: 1200, diagInch: 14 },
  { key: 'nb-2560x1600',     label: '笔记本 2560×1600 · 16:10 · 16″',       widthPx: 2560, heightPx: 1600, diagInch: 16 },
  // 显示器
  { key: 'mon-1920x1080',    label: '显示器 1920×1080 · 16:9 · 24″',        widthPx: 1920, heightPx: 1080, diagInch: 24 },
  { key: 'mon-2560x1440',    label: '显示器 2560×1440 · 16:9 · 27″',        widthPx: 2560, heightPx: 1440, diagInch: 27 },
  { key: 'mon-3840x2160',    label: '显示器 3840×2160 · 16:9 · 27″',        widthPx: 3840, heightPx: 2160, diagInch: 27 },
  { key: 'mon-3440x1440',    label: '带鱼屏 3440×1440 · 21:9 · 34″',        widthPx: 3440, heightPx: 1440, diagInch: 34 },
];
