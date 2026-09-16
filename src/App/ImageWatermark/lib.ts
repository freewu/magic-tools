// 图片水印: 纯逻辑 (尺寸与位置排布 / 文字度量与自动缩放 / 绘制指令 / 格式与文件名)
// 设计: 与 DOM 解耦 —— 文字度量函数由调用方注入, 绘制只用到 CanvasRenderingContext2D 的少量方法,
//       因此排布与绘制都能在单元测试里用桩函数验证
import {
  DEFAULT_BASE, FONT_SCALE_DEFAULT, FONT_SCALE_MAX, FONT_SCALE_MIN, FONT_SIZE_MIN, LINE_HEIGHT_RATIO,
  LOGO_SCALE_DEFAULT, LOGO_SCALE_MAX, LOGO_SCALE_MIN, MARGIN_DEFAULT, MARGIN_MAX, NAME_SUFFIX,
  OPACITY_DEFAULT, OPACITY_MAX, OPACITY_MIN, QUALITY_DEFAULT, QUALITY_MAX, QUALITY_MIN,
  ROTATE_DEFAULT, ROTATE_MAX, ROTATE_MIN, GAP_DEFAULT, GAP_MAX, GAP_MIN, STROKE_RATIO,
} from './data';

/** 水印类型: 文字 / 图片 (logo) */
export type WatermarkKind = 'text' | 'image';
export const WATERMARK_KINDS: WatermarkKind[] = [ 'text', 'image' ];

/** 水印位置 (九宫格): tl=左上, mc=正中, br=右下 … */
export type WatermarkPosition = 'tl' | 'tc' | 'tr' | 'ml' | 'mc' | 'mr' | 'bl' | 'bc' | 'br';
export const POSITIONS: WatermarkPosition[] = [ 'tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br' ];

/** 排布方式: 单个 / 平铺 (整图重复) */
export type LayoutMode = 'single' | 'tile';
export const LAYOUT_MODES: LayoutMode[] = [ 'single', 'tile' ];

/** 字体 (仅用通用族名, 交给系统字体回退, 避免依赖内置字体文件) */
export type FontKey = 'sans' | 'serif' | 'mono' | 'kai';
export const FONT_KEYS: FontKey[] = [ 'sans', 'serif', 'mono', 'kai' ];
export const FONT_STACKS: Record<FontKey, string> = {
  sans: "system-ui, -apple-system, 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', sans-serif",
  serif: "Georgia, 'Times New Roman', 'Songti SC', 'SimSun', 'Noto Serif CJK SC', serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New', monospace",
  kai: "'KaiTi', 'STKaiti', 'Kaiti SC', '楷体', cursive",
};

/** 输出格式 (WebP 需要浏览器支持 canvas 导出, 见 supportsWebp) */
export type OutputFormat = 'PNG' | 'JPEG' | 'WebP';
export const OUTPUT_FORMATS: OutputFormat[] = [ 'PNG', 'JPEG', 'WebP' ];

/** 尺寸 / 坐标 */
export interface Size { width: number; height: number; }
export interface Point { x: number; y: number; }

/** 文字度量函数: 给定文本与 font 字符串, 返回像素宽度 (页面注入 ctx.measureText, 单测传桩函数) */
export type Measure = (text: string, font: string) => number;

// ==================== 取值校验 ====================
const toNum = (v: unknown): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : NaN;
};

/** 夹取到 [min, max]; 非法值回退 def */
export const clampNum = (v: unknown, min: number, max: number, def: number): number => {
  const n = toNum(v);
  if (Number.isNaN(n)) return def;
  return Math.min(max, Math.max(min, n));
};

export const isWatermarkKind = (v: unknown): v is WatermarkKind => WATERMARK_KINDS.includes(v as WatermarkKind);
export const isPosition = (v: unknown): v is WatermarkPosition => POSITIONS.includes(v as WatermarkPosition);
export const isLayoutMode = (v: unknown): v is LayoutMode => LAYOUT_MODES.includes(v as LayoutMode);
export const isFontKey = (v: unknown): v is FontKey => FONT_KEYS.includes(v as FontKey);
export const isOutputFormat = (v: unknown): v is OutputFormat => OUTPUT_FORMATS.includes(v as OutputFormat);

export const normalizeKind = (v: unknown): WatermarkKind => (isWatermarkKind(v) ? v : 'text');
export const normalizePosition = (v: unknown): WatermarkPosition => (isPosition(v) ? v : 'br');
export const normalizeLayout = (v: unknown): LayoutMode => (isLayoutMode(v) ? v : 'single');
export const normalizeFont = (v: unknown): FontKey => (isFontKey(v) ? v : 'sans');

/** 非法格式回退 PNG (大小写不敏感, 如 'webp' / 'jpeg') */
export const normalizeFormat = (v: unknown): OutputFormat => {
  if (typeof v !== 'string') return 'PNG';
  const up = v.trim().toUpperCase();
  return OUTPUT_FORMATS.find((f) => f.toUpperCase() === up) ?? 'PNG';
};

/** 透明度 (0.05 ~ 1) */
export const normalizeOpacity = (v: unknown): number => Math.round(clampNum(v, OPACITY_MIN, OPACITY_MAX, OPACITY_DEFAULT) * 100) / 100;
/** 字号 (占图片宽度百分比) */
export const normalizeFontScale = (v: unknown): number => clampNum(v, FONT_SCALE_MIN, FONT_SCALE_MAX, FONT_SCALE_DEFAULT);
/** logo 缩放 (占图片宽度百分比) */
export const normalizeLogoScale = (v: unknown): number => clampNum(v, LOGO_SCALE_MIN, LOGO_SCALE_MAX, LOGO_SCALE_DEFAULT);
/** 边距 / 间距 (px) */
export const normalizeMargin = (v: unknown): number => Math.round(clampNum(v, 0, MARGIN_MAX, MARGIN_DEFAULT));
export const normalizeGap = (v: unknown): number => Math.round(clampNum(v, GAP_MIN, GAP_MAX, GAP_DEFAULT));
/** 旋转角度 (度, -90 ~ 90) */
export const normalizeRotate = (v: unknown): number => Math.round(clampNum(v, ROTATE_MIN, ROTATE_MAX, ROTATE_DEFAULT));
/** 质量 (0.5 ~ 1) */
export const normalizeQuality = (v: unknown): number => clampNum(v, QUALITY_MIN, QUALITY_MAX, QUALITY_DEFAULT);

// ==================== 输出格式与文件名 ====================
/** 输出扩展名 */
export const extOf = (format: OutputFormat): string =>
  (format === 'JPEG' ? 'jpg' : format === 'WebP' ? 'webp' : 'png');
/** 输出 MIME (同时用作 canvas.toDataURL 的 type) */
export const mimeOf = (format: OutputFormat): string =>
  (format === 'JPEG' ? 'image/jpeg' : format === 'WebP' ? 'image/webp' : 'image/png');
/** 是否为有损编码 (质量参数生效) */
export const isLossy = (format: OutputFormat): boolean => format !== 'PNG';

let webpSupport: boolean | null = null;
/** 当前环境是否支持 canvas 导出 WebP (结果缓存; 不支持的浏览器会静默返回 PNG, 故用前缀判断) */
export const supportsWebp = (): boolean => {
  if (webpSupport !== null) return webpSupport;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const url = canvas.toDataURL('image/webp');
    webpSupport = typeof url === 'string' && url.startsWith('data:image/webp');
  } catch {
    webpSupport = false;
  }
  return webpSupport;
};

/** 去掉扩展名与路径分隔符 / 非法字符, 生成文件名主体 */
export const baseName = (fileName: string): string => {
  const noExt = fileName.replace(/\.[^.\\/]+$/, '');
  const clean = noExt.replace(/[\\/:*?"<>|]+/g, '_').trim();
  return clean === '' ? DEFAULT_BASE : clean;
};

/** 输出文件名: 原名_watermark.扩展名 (不覆盖原图) */
export const outputFileName = (base: string, format: OutputFormat): string =>
  `${base === '' ? DEFAULT_BASE : base}_${NAME_SUFFIX}.${extOf(format)}`;

/** dataURL -> 字节数组 (JPEG / WebP 等需要原始字节的保存场景) */
export const dataUrlToBytes = (dataUrl: string): Uint8Array => {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

/** 字节数格式化 */
export const formatBytes = (n: number): string => {
  if (!Number.isFinite(n) || n <= 0) return '0 B';
  if (n < 1024) return `${Math.round(n)} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
};

// ==================== 排布几何 ====================
/** 宽高旋转 deg 度后的外接矩形 (用于布局: 旋转后仍不越界) */
export const rotatedBBox = (size: Size, deg: number): Size => {
  const rad = (Math.abs(deg) % 360) * Math.PI / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  return {
    width: Math.round(size.width * cos + size.height * sin),
    height: Math.round(size.width * sin + size.height * cos),
  };
};

/**
 * 九宫格锚点: 返回水印外接矩形左上角坐标
 * @param pos 九宫格位置
 * @param img 图片尺寸
 * @param box 水印外接矩形 (旋转后的尺寸)
 * @param margin 与图片边缘的间距 (px)
 */
export const anchorOf = (pos: WatermarkPosition, img: Size, box: Size, margin: number): Point => {
  const m = Math.max(0, margin);
  const left = m;
  const centerX = (img.width - box.width) / 2;
  const right = img.width - box.width - m;
  const top = m;
  const centerY = (img.height - box.height) / 2;
  const bottom = img.height - box.height - m;
  const x = pos[1] === 'l' ? left : pos[1] === 'c' ? centerX : right;
  const y = pos[0] === 't' ? top : pos[0] === 'm' ? centerY : bottom;
  return { x, y };
};

/**
 * 平铺坐标: 以图片中心为对称中心排布 (第一列/行与最后一列/行的中心关于图片中心对称),
 * 网格向外多铺一圈, 保证旋转后的水印仍能覆盖到四角
 * @param img 图片尺寸
 * @param box 单个水印外接矩形 (旋转后的尺寸)
 * @param gap 相邻水印之间的空隙 (px)
 */
export const tilePositions = (img: Size, box: Size, gap: number): Point[] => {
  const cellW = Math.max(1, box.width + Math.max(0, gap));
  const cellH = Math.max(1, box.height + Math.max(0, gap));
  const cols = Math.max(1, Math.ceil(img.width / cellW) + 1);
  const rows = Math.max(1, Math.ceil(img.height / cellH) + 1);
  // 使首尾中心对称于图片中心
  const startX = img.width / 2 - box.width / 2 - (cols - 1) * cellW / 2;
  const startY = img.height / 2 - box.height / 2 - (rows - 1) * cellH / 2;
  const out: Point[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) out.push({ x: startX + c * cellW, y: startY + r * cellH });
  }
  return out;
};

/** 排布坐标: 单个 -> 九宫格锚点; 平铺 -> 网格 */
export const layoutPositions = (o: {
  img: Size; box: Size; layout: LayoutMode; position: WatermarkPosition; margin: number; gap: number;
}): Point[] => (normalizeLayout(o.layout) === 'tile'
  ? tilePositions(o.img, o.box, o.gap)
  : [ anchorOf(normalizePosition(o.position), o.img, o.box, normalizeMargin(o.margin)) ]);

// ==================== 文字度量与样式 ====================
/** 文本按行拆分 (兼容 CRLF / CR, 去掉首尾空白行) */
export const splitLines = (text: string): string[] =>
  text.replace(/\r\n?/g, '\n').split('\n').map((l) => l.trim()).filter((l) => l !== '');

/** 拼出 canvas font 字符串 (如 `bold 48px system-ui, sans-serif`) */
export const fontString = (o: { bold: boolean; italic: boolean; fontSize: number; family: string }): string =>
  `${o.italic ? 'italic ' : ''}${o.bold ? 'bold ' : ''}${Math.max(1, Math.round(o.fontSize))}px ${o.family}`;

/** 最宽一行的宽度 (lines 为空时返回 0) */
export const widestLine = (
  lines: string[], fontSize: number, family: string, bold: boolean, italic: boolean, measure: Measure,
): number => {
  const font = fontString({ bold, italic, fontSize, family });
  let w = 0;
  for (const line of lines) w = Math.max(w, measure(line, font));
  return w;
};

/** 文字块尺寸 (宽度取最宽一行, 高度 = 行数 × 行高) */
export const measureTextBlock = (o: {
  lines: string[]; fontSize: number; family: string; bold: boolean; italic: boolean; measure: Measure;
}): Size => ({
  width: Math.ceil(widestLine(o.lines, o.fontSize, o.family, o.bold, o.italic, o.measure)),
  height: Math.round(o.lines.length * o.fontSize * LINE_HEIGHT_RATIO),
});

/**
 * 自动缩小字号: 让最宽一行不超过 maxWidth (按比例迭代收敛, 最多 10 轮, 下限 FONT_SIZE_MIN)
 * 文字本身很短 (放得下) 时原样返回
 */
export const fitFontSize = (o: {
  lines: string[]; fontSize: number; maxWidth: number; family: string; bold: boolean; italic: boolean; measure: Measure;
}): number => {
  if (o.lines.length === 0 || o.maxWidth <= 0) return Math.max(1, Math.round(o.fontSize));
  let size = Math.max(1, Math.round(o.fontSize));
  for (let i = 0; i < 10 && size > FONT_SIZE_MIN; i++) {
    const w = widestLine(o.lines, size, o.family, o.bold, o.italic, o.measure);
    if (w <= o.maxWidth || w <= 0) break;
    size = Math.max(FONT_SIZE_MIN, Math.floor(size * o.maxWidth / w));
  }
  return size;
};

/** #rgb / #rrggbb -> [r, g, b] (无法解析返回 null) */
export const parseHex = (color: string): [number, number, number] | null => {
  const hex = color.trim().replace(/^#/, '');
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
};

/** 相对亮度 (0=黑, 1=白; 无法解析按白色处理) */
export const luminance = (color: string): number => {
  const rgb = parseHex(color);
  if (!rgb) return 1;
  const [ r, g, b ] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** 描边颜色: 文字偏亮用黑描边, 偏暗用白描边 (自动对比, 不用用户操心) */
export const contrastStroke = (color: string): string => (luminance(color) > 0.5 ? '#000000' : '#ffffff');

/** 描边宽度 (随字号缩放, 至少 1px) */
export const strokeWidthOf = (fontSize: number): number => Math.max(1, Math.round(fontSize / STROKE_RATIO));

// ==================== 水印方案 (排布 + 样式) ====================
/** 文字水印的最终样式 */
export interface TextPlan {
  lines: string[];
  family: string;
  fontSize: number;
  lineHeight: number;
  bold: boolean;
  italic: boolean;
  color: string;
  stroke: boolean;
  strokeColor: string;
  strokeWidth: number;
}

/** 水印方案: 页面先算 plan, 再交给 drawPlan 绘制 */
export interface WatermarkPlan {
  kind: WatermarkKind;
  /** 水印本体尺寸 (未旋转) */
  box: Size;
  /** 旋转后的外接矩形 (布局与九宫格锚点按它计算) */
  rotated: Size;
  rotate: number;
  opacity: number;
  /** 每个水印的左上角坐标 */
  positions: Point[];
  text?: TextPlan;
  /** logo 绘制尺寸 (= box) */
  logo?: Size;
}

export interface BuildPlanOptions {
  kind: WatermarkKind;
  text: string;
  font: FontKey;
  fontScale: number;
  bold: boolean;
  italic: boolean;
  color: string;
  stroke: boolean;
  /** 自动缩小字号以免超出图片宽度 */
  fit: boolean;
  /** logo 原始像素尺寸 */
  logoSize: Size;
  logoScale: number;
  layout: LayoutMode;
  position: WatermarkPosition;
  margin: number;
  gap: number;
  rotate: number;
  opacity: number;
  measure: Measure;
}

/** 组装水印方案 (纯计算: 尺寸 -> 文字块 / logo 尺寸 -> 旋转外接矩形 -> 排布坐标) */
export const buildPlan = (img: Size, o: BuildPlanOptions): WatermarkPlan => {
  const layout = normalizeLayout(o.layout);
  const rotate = normalizeRotate(o.rotate);
  const opacity = normalizeOpacity(o.opacity);
  const margin = normalizeMargin(o.margin);
  const gap = normalizeGap(o.gap);
  const kind = normalizeKind(o.kind);
  let box: Size;
  let text: TextPlan | undefined;
  let logo: Size | undefined;

  if (kind === 'image') {
    const w = Math.max(1, Math.round(img.width * normalizeLogoScale(o.logoScale) / 100));
    const ratio = o.logoSize.width > 0 && o.logoSize.height > 0 ? o.logoSize.height / o.logoSize.width : 1;
    const h = Math.max(1, Math.round(w * ratio));
    box = { width: w, height: h };
    logo = { ...box };
  } else {
    const family = FONT_STACKS[normalizeFont(o.font)];
    const lines = splitLines(o.text);
    let fontSize = Math.max(1, Math.round(img.width * normalizeFontScale(o.fontScale) / 100));
    if (o.fit && lines.length > 0) {
      fontSize = fitFontSize({
        lines, fontSize, maxWidth: Math.max(1, img.width - 2 * margin),
        family, bold: o.bold, italic: o.italic, measure: o.measure,
      });
    }
    const lineHeight = Math.round(fontSize * LINE_HEIGHT_RATIO);
    const block = measureTextBlock({ lines, fontSize, family, bold: o.bold, italic: o.italic, measure: o.measure });
    box = { width: Math.max(1, block.width), height: Math.max(lineHeight, block.height) };
    text = {
      lines,
      family,
      fontSize,
      lineHeight,
      bold: o.bold,
      italic: o.italic,
      color: o.color,
      stroke: o.stroke,
      strokeColor: contrastStroke(o.color),
      strokeWidth: o.stroke ? strokeWidthOf(fontSize) : 0,
    };
  }

  const rotated = rotatedBBox(box, rotate);
  const positions = layoutPositions({ img, box: rotated, layout, position: o.position, margin, gap });
  return { kind, box, rotated, rotate, opacity, positions, text, logo };
};

/** 绘制所需素材 (图片水印用的 logo 元素) */
export interface PlanAssets { logo?: CanvasImageSource; }

/**
 * 把水印方案画到 canvas 上
 * - 每个水印各自 save/restore, 绕自身中心旋转, 因此九宫格边距与平铺间距都不受旋转影响
 * - 文字居中绘制 (textAlign=center / textBaseline=middle), 行高按 plan 中的 lineHeight
 */
export const drawPlan = (ctx: CanvasRenderingContext2D, plan: WatermarkPlan, assets: PlanAssets = {}): number => {
  const rad = plan.rotate * Math.PI / 180;
  let drawn = 0;
  for (const p of plan.positions) {
    const cx = p.x + plan.rotated.width / 2;
    const cy = p.y + plan.rotated.height / 2;
    ctx.save();
    ctx.globalAlpha = plan.opacity;
    ctx.translate(cx, cy);
    if (rad !== 0) ctx.rotate(rad);
    if (plan.logo && assets.logo) {
      ctx.drawImage(assets.logo, -plan.box.width / 2, -plan.box.height / 2, plan.box.width, plan.box.height);
      drawn++;
    } else if (plan.text && plan.text.lines.length > 0) {
      const t = plan.text;
      ctx.font = fontString({ bold: t.bold, italic: t.italic, fontSize: t.fontSize, family: t.family });
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (t.stroke && t.strokeWidth > 0) {
        ctx.lineWidth = t.strokeWidth;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = t.strokeColor;
      }
      const total = t.lines.length * t.lineHeight;
      t.lines.forEach((line, i) => {
        const y = -total / 2 + t.lineHeight * (i + 0.5);
        if (t.stroke && t.strokeWidth > 0) ctx.strokeText(line, 0, y);
        ctx.fillStyle = t.color;
        ctx.fillText(line, 0, y);
      });
      drawn++;
    }
    ctx.restore();
  }
  return drawn;
};
