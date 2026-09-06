// ASCII 图片 (Image to ASCII): 核心纯函数

/** 标准字符集 (暗->亮, 同 asciiart.eu 默认 10 级) */
export const STD_CHARS = '@%#*+=-:. ';

/** 预设字符集 */
export const GRAY_PALETTES = [
  { key: 'std', label: '标准 (10 级 @%#*+=-:. )', chars: STD_CHARS },
  { key: 'block', label: '密度块 (Unicode █▓▒░ )', chars: '█▓▒░ ' },
  { key: 'minimal', label: '极简 (2 级 # )', chars: '# ' },
] as const;

/** 输出宽字符数上限 (防极端) */
export const OUT_W_MIN = 16;
export const OUT_W_MAX = 260;
export const OUT_W_DEFAULT = 100;

/** 字符单元宽高比校正: 等宽字符高约为宽 2 倍, 输出行数按 0.5 折算 */
export const ROW_SCALE = 0.5;

/** 彩色像素 -> 灰度 (Rec.709 加权) */
export const toGray = (r: number, g: number, b: number): number =>
  Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);

/**
 * 亮度/对比度/反色调节, 返回 0-255 灰度
 * brightness: -1..1 (偏移量); contrast: -1..1 (以 0.5 为中点缩放, 1 为原值);
 * invert: true 则反色
 */
export const adjustGray = (gray: number, brightness = 0, contrast = 0, invert = false): number => {
  let v = gray / 255;
  v += brightness;
  const k = contrast >= 0 ? 1 + contrast : 1 / (1 - contrast); // [0.5, 2]
  v = (v - 0.5) * k + 0.5;
  if (invert) v = 1 - v;
  v = Math.max(0, Math.min(1, v));
  return Math.round(v * 255);
};

/** 灰度(0-255, 0 最暗) -> 字符 (chars[0] 对应最暗) */
export const grayToChar = (gray: number, chars: string): string => {
  if (!chars) return ' ';
  const idx = Math.round((Math.min(255, Math.max(0, gray)) / 255) * (chars.length - 1));
  return chars[idx];
};

export interface RenderOpts {
  /** 源图灰度像素 (行优先, 每像素 1 字节) */
  gray: Uint8Array;
  srcW: number;
  srcH: number;
  /** 输出宽度 (字符数) */
  outW: number;
  /** 字符集 (暗->亮), 空串则用标准字符集 */
  chars?: string;
  brightness?: number;
  contrast?: number;
  invert?: boolean;
  /** 输出高度折算 (默认按等宽字符 2:1) */
  rowScale?: number;
}

/**
 * 图像灰度数组 -> ASCII 文本
 * 每个输出字符格对其覆盖的源像素取平均灰度, 再经调节映射为字符;
 * 返回的每行宽度固定为 outW (尾行空格保留以保证图形比例)
 */
export const renderAscii = (o: RenderOpts): string => {
  const chars = o.chars ?? STD_CHARS;
  const outW = Math.max(1, Math.round(o.outW));
  const outH = Math.max(1, Math.round(outW * (o.srcH / o.srcW) * (o.rowScale ?? ROW_SCALE)));
  const rows: string[] = [];
  for (let gy = 0; gy < outH; gy++) {
    let line = '';
    for (let gx = 0; gx < outW; gx++) {
      // 覆盖源像素区间 (含左右边界, 每格至少 1px)
      const x0 = Math.floor((gx * o.srcW) / outW);
      const x1 = Math.max(x0 + 1, Math.ceil(((gx + 1) * o.srcW) / outW));
      const y0 = Math.floor((gy * o.srcH) / outH);
      const y1 = Math.max(y0 + 1, Math.ceil(((gy + 1) * o.srcH) / outH));
      let sum = 0;
      let n = 0;
      for (let y = y0; y < y1; y++) {
        const base = y * o.srcW;
        for (let x = x0; x < x1; x++) {
          sum += o.gray[base + x];
          n++;
        }
      }
      const avg = n > 0 ? sum / n : 0;
      const adj = adjustGray(avg, o.brightness, o.contrast, o.invert);
      line += grayToChar(adj, chars);
    }
    rows.push(line);
  }
  return rows.join('\n');
};
