// 点阵字生成器: 字符 -> w×h 点阵 (0/1) -> 嵌入式取模字节 (逐行式/逐列式 × MSB/LSB)
//
// 字形来源: 用 <canvas> 把字符按系统字体渲染后, 以 w×h 网格采样二值化。
// (渲染分辨率为 16x 超采样, 取每格中心像素判定) — 与所选字体相关, 中文建议黑体/系统中文字体。
//
// 注意: 本模块的矩阵来源函数 (sampleGlyph) 依赖 DOM canvas, 仅在浏览器环境可用;
// 编码/格式化部分 (rowsToBytes 等) 为纯函数, 可脱离 DOM 单测。

export interface FontSpec {
  /** 点阵宽 (列数) */
  w: number;
  /** 点阵高 (行数) */
  h: number;
}

/** 内置规格: 5x7 / 5x8 / 6x12 / 8x16 / 12x12 / 16x16 */
export const SPECS: FontSpec[] = [
  { w: 5, h: 7 },
  { w: 5, h: 8 },
  { w: 6, h: 12 },
  { w: 8, h: 16 },
  { w: 12, h: 12 },
  { w: 16, h: 16 },
];

export const specLabel = (s: FontSpec): string => `${s.w}x${s.h}`;

export type ExtractMode = 'row' | 'col';
export type BitOrder = 'msb' | 'lsb';

export const MODE_LABEL: Record<ExtractMode, string> = {
  row: '逐行式 (每行取模)',
  col: '逐列式 (每列取模)',
};
export const ORDER_LABEL: Record<BitOrder, string> = {
  msb: '高位在前 (MSB)',
  lsb: '低位在前 (LSB)',
};

export interface SampleOptions {
  /** 灰度阈值 0-255, 越大越容易判为空白 */
  threshold?: number;
  /** 反色 (取白色像素为墨点) */
  invert?: boolean;
}

const SUPERSAMPLE = 16; // 每格采样放大倍数

/**
 * 把单个字符渲染成 w×h 的 0/1 矩阵 (行主序, 1=墨点)。
 * 字形按原始宽高比缩放后居中放入网格 (四周留 ~5%/10% 边距)。
 * 无 canvas 环境 (如 jest jsdom) 返回 null。
 */
export function sampleGlyph(ch: string, spec: FontSpec, opts: SampleOptions = {}): Uint8Array | null {
  if (ch === '' || !spec || spec.w <= 0 || spec.h <= 0) return null;
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  const { w, h } = spec;
  const threshold = opts.threshold ?? 100;
  const invert = opts.invert ?? false;

  // 逻辑坐标画布为 w×h 格, 设备像素 = 格数 × SUPERSAMPLE
  canvas.width = w * SUPERSAMPLE;
  canvas.height = h * SUPERSAMPLE;
  ctx.setTransform(SUPERSAMPLE, 0, 0, SUPERSAMPLE, 0, 0);

  const measure = (fontSize: number) => {
    ctx.font = `500 ${fontSize}px monospace, "PingFang SC", "Microsoft YaHei", sans-serif`;
    const m = ctx.measureText(ch);
    const asc = m.actualBoundingBoxAscent || fontSize * 0.75;
    const desc = m.actualBoundingBoxDescent || fontSize * 0.25;
    const left = m.actualBoundingBoxLeft || 0;
    const inkW = m.width - left + (m.actualBoundingBoxRight ?? m.width);
    return { asc, desc, left, inkW: Math.max(inkW, 1) };
  };

  // 先在大字号下量出墨迹 bbox (与字号线性), 再等比缩放进网格
  const F0 = 512;
  const m0 = measure(F0);
  const inkH0 = m0.asc + m0.desc;
  const scale = Math.min((w * 0.96) / m0.inkW, (h * 0.94) / inkH0);
  const drawW = m0.inkW * scale;
  const drawH = inkH0 * scale;
  const padX = (w - drawW) / 2;
  const padY = (h - drawH) / 2;

  const fontSize = F0 * scale;
  ctx.font = `500 ${fontSize}px monospace, "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#000000';
  ctx.fillText(ch, padX - m0.left * scale, padY + m0.asc * scale);

  // 逐格采样中心像素 (设备坐标 = 逻辑坐标 × SUPERSAMPLE, 中心再偏半格)
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const matrix = new Uint8Array(w * h);
  for (let row = 0; row < h; row += 1) {
    for (let col = 0; col < w; col += 1) {
      const px = Math.floor((col + 0.5) * SUPERSAMPLE);
      const py = Math.floor((row + 0.5) * SUPERSAMPLE);
      const alpha = img[(py * canvas.width + px) * 4 + 3]; // 墨迹为黑, 用 alpha 判
      const level = invert ? 255 - alpha : alpha;
      if (level >= threshold) matrix[row * w + col] = 1;
    }
  }
  return matrix;
}

const bitsToByte = (bits: number[], order: BitOrder): number => {
  let v = 0;
  for (let i = 0; i < bits.length; i += 1) {
    if (bits[i]) v += order === 'msb' ? 1 << (7 - i) : 1 << i;
  }
  return v;
};

/**
 * 0/1 矩阵 -> 取模字节数组。
 * 逐行式: 每行从左到右每 8 格合成 1 字节; 不足 8 格高位 (MSB) 或低位 (LSB) 补 0。
 * 逐列式: 每列从上到下每 8 格合成 1 字节。
 */
export function rowsToBytes(
  matrix: Uint8Array,
  w: number,
  h: number,
  mode: ExtractMode,
  order: BitOrder,
): number[] {
  const bytes: number[] = [];
  if (mode === 'row') {
    for (let r = 0; r < h; r += 1) {
      for (let start = 0; start < w; start += 8) {
        const bits: number[] = [];
        for (let c = start; c < Math.min(start + 8, w); c += 1) bits.push(matrix[r * w + c]);
        bytes.push(bitsToByte(bits, order));
      }
    }
  } else {
    for (let c = 0; c < w; c += 1) {
      for (let start = 0; start < h; start += 8) {
        const bits: number[] = [];
        for (let r = start; r < Math.min(start + 8, h); r += 1) bits.push(matrix[r * w + c]);
        bytes.push(bitsToByte(bits, order));
      }
    }
  }
  return bytes;
}

export const hexByte = (b: number): string => '0x' + b.toString(16).toUpperCase().padStart(2, '0');

export interface CArrayOptions {
  chars: string[];         // 与 chunks 一一对应
  chunks: number[][];      // 每字符的字节序列
  spec: FontSpec;
  mode: ExtractMode;
  order: BitOrder;
  arrayName?: string;
}

/**
 * 生成 C 头文件文本: 每字符一段注释 + 字节列表。
 */
export function formatCArray(opts: CArrayOptions): string {
  const { chars, chunks, spec, mode, order } = opts;
  const name = opts.arrayName || `font_${spec.w}x${spec.h}`;
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const perChar = chunks[0]?.length ?? 0;
  const lines: string[] = [];
  lines.push('// 点阵字库取模 — MagicTools');
  lines.push(`// 字符: ${chars.map((c) => (c === ' ' ? '(空格)' : c)).join(' ')}`);
  lines.push(`// 规格 ${spec.w}x${spec.h} 点; 方式: ${MODE_LABEL[mode]}; 位序: ${ORDER_LABEL[order]}`);
  lines.push(`// 每字符 ${perChar} 字节, 共 ${chars.length} 字符 ${total} 字节`);
  lines.push(`const unsigned char ${name}[] = {`);
  chunks.forEach((bytes, idx) => {
    lines.push(`  // '${chars[idx]}'`);
    for (let i = 0; i < bytes.length; i += 12) {
      lines.push('  ' + bytes.slice(i, i + 12).map(hexByte).join(', ') + ',');
    }
  });
  lines.push('};');
  return lines.join('\n') + '\n';
}

/** 纯 0/1 文本 (调试/展示): 每行一串 0/1 */
export function matrixToText(matrix: Uint8Array, w: number, h: number): string {
  const rows: string[] = [];
  for (let r = 0; r < h; r += 1) {
    let s = '';
    for (let c = 0; c < w; c += 1) s += matrix[r * w + c] ? '1' : '0';
    rows.push(s);
  }
  return rows.join('\n');
}
