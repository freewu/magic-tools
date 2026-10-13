// GIF 公共能力: 解析 (gifuct-js) / 帧合成 / 精灵图排版 / 编码 (modern-gif)
//
// 说明: 这里只放与界面无关的纯逻辑 (帧合成用 Uint8ClampedArray 手工叠加, 不依赖 canvas),
//       便于单测; 页面只负责把合成结果画到 canvas 上展示或导出。
import { decompressFrames, parseGIF, type ParsedFrame, type ParsedGif } from 'gifuct-js';
import { encode, type DitherMethod } from 'modern-gif';

/** 解析后的一帧 (data 为整幅画布合成后的 RGBA 像素) */
export interface GifFrame {
  /** 帧序号 (0 起) */
  index: number;
  /** 帧延时 (毫秒, gifuct-js 已换算) */
  delay: number;
  /** 处置方式: 0/1 保留, 2 还原背景, 3 还原上一帧 */
  disposal: number;
  /** 该帧图像在画布中的位置与尺寸 */
  left: number; top: number; width: number; height: number;
  /** 合成到整幅画布后的 RGBA 像素 (length = 画布宽 * 高 * 4) */
  data: Uint8ClampedArray;
}

/** 解析结果 */
export interface GifData {
  width: number;
  height: number;
  frames: GifFrame[];
  /** 循环次数: null = 未声明 (播放一次), 0 = 无限循环 */
  loopCount: number | null;
  /** 格式版本: '89a' / '87a' */
  version: string;
  /** 原文件字节数 */
  bytes: number;
}

/** 单次可处理的最大帧数 (超大 GIF 时保护内存) */
export const GIF_MAX_FRAMES = 2000;

/** 单边最大像素 (与 canvas 上限保持一致, 超出直接拒绝) */
export const GIF_MAX_SIDE = 16384;

/** 帧延时的合理区间 (毫秒) */
export const GIF_DELAY_MIN = 10;
export const GIF_DELAY_MAX = 10000;
export const GIF_DELAY_DEFAULT = 100;

/** 抖动方式 (modern-gif) */
export type GifDither = 'none' | DitherMethod;
export const GIF_DITHERS: readonly GifDither[] = [ 'none', 'floyd-steinberg', 'atkinson', 'stucki' ] as const;

/** 调色板颜色数区间 (GIF 规范 2~256, modern-gif 的 maxColors 上限为 255) */
export const GIF_COLORS_MIN = 2;
export const GIF_COLORS_MAX = 255;
export const GIF_COLORS_DEFAULT = 255;

/** 循环设置: -1 = 只播放一次, 0 = 无限循环, n>0 = 播放 n 次 */
export const GIF_LOOP_ONCE = -1;
export const GIF_LOOP_INFINITE = 0;

/** 把 Uint8Array 视图转成独立 ArrayBuffer (视图可能只是大 buffer 的一段) */
const toArrayBuffer = (bytes: Uint8Array | ArrayBuffer): ArrayBuffer => {
  if (bytes instanceof ArrayBuffer) return bytes;
  const view = bytes as Uint8Array;
  if (view.byteOffset === 0 && view.byteLength === view.buffer.byteLength) return view.buffer as ArrayBuffer;
  return view.slice().buffer as ArrayBuffer;
};

/**
 * 读取循环次数 (NETSCAPE2.0 应用扩展)
 * @returns null = 没有该扩展 (按只播放一次处理), 0 = 无限循环
 */
export const loopCountOf = (parsed: ParsedGif): number | null => {
  for (const item of parsed.frames ?? []) {
    const app = (item as { application?: { id?: string; codes?: number[] } }).application;
    if (!app) continue;
    if (app.id !== 'NETSCAPE2.0' && app.id !== 'ANIMEXTS1.0') continue;
    const codes = app.codes ?? [];
    // codes: [1, low, high] (子块编号 1 + 16 位小端循环次数); 缺 codes 时按无限循环兜底
    if (codes.length >= 3 && codes[0] === 1) return (codes[1] | (codes[2] << 8)) >>> 0;
    return 0;
  }
  return null;
};

/** 源像素叠加到画布 (source-over; gifuct 的 patch 只有 α=0 / 255, 仍按通式处理) */
const blendInto = (
  canvas: Uint8ClampedArray,
  patch: Uint8ClampedArray,
  cw: number, ch: number,
  left: number, top: number, pw: number, ph: number,
): void => {
  const src = patch;
  for (let y = 0; y < ph; y++) {
    const cy = top + y;
    if (cy < 0 || cy >= ch) continue;
    for (let x = 0; x < pw; x++) {
      const cx = left + x;
      if (cx < 0 || cx >= cw) continue;
      const si = (y * pw + x) * 4;
      const sa = src[si + 3];
      if (sa === 0) continue; // 透明像素不覆盖底图
      const di = (cy * cw + cx) * 4;
      if (sa === 255) {
        canvas[di] = src[si];
        canvas[di + 1] = src[si + 1];
        canvas[di + 2] = src[si + 2];
        canvas[di + 3] = 255;
        continue;
      }
      // 半透明: 按 α 混合
      const a = sa / 255;
      const ia = 1 - a;
      const da = canvas[di + 3] / 255;
      const oa = a + da * ia;
      if (oa <= 0) continue;
      canvas[di] = (src[si] * a + canvas[di] * da * ia) / oa;
      canvas[di + 1] = (src[si + 1] * a + canvas[di + 1] * da * ia) / oa;
      canvas[di + 2] = (src[si + 2] * a + canvas[di + 2] * da * ia) / oa;
      canvas[di + 3] = oa * 255;
    }
  }
};

/** 把某帧的矩形区域清成透明 (处置方式 2: 还原背景) */
const clearRect = (
  canvas: Uint8ClampedArray,
  cw: number, ch: number,
  left: number, top: number, w: number, h: number,
): void => {
  for (let y = 0; y < h; y++) {
    const cy = top + y;
    if (cy < 0 || cy >= ch) continue;
    for (let x = 0; x < w; x++) {
      const cx = left + x;
      if (cx < 0 || cx >= cw) continue;
      const di = (cy * cw + cx) * 4;
      canvas[di] = 0;
      canvas[di + 1] = 0;
      canvas[di + 2] = 0;
      canvas[di + 3] = 0;
    }
  }
};

/**
 * 按 GIF 的处置方式把逐帧 patch 合成为整幅画布 (每帧一份完整 RGBA)
 * @param raw  gifuct-js decompressFrames(parsed, true) 的结果
 * @param width  画布宽 (逻辑屏幕宽度)
 * @param height 画布高
 */
export const composeFrames = (raw: readonly ParsedFrame[], width: number, height: number): GifFrame[] => {
  const cw = Math.max(0, Math.floor(width));
  const ch = Math.max(0, Math.floor(height));
  if (cw < 1 || ch < 1) return [];
  let canvas = new Uint8ClampedArray(cw * ch * 4);
  const out: GifFrame[] = [];

  raw.forEach((frame, index) => {
    const dims = frame?.dims ?? { left: 0, top: 0, width: 0, height: 0 };
    const disposal = Number(frame?.disposalType ?? 0);
    // 处置方式 3: 绘制前先记录当前画面, 绘制完成后还原
    const saved = disposal === 3 ? canvas.slice() : null;

    const pw = Math.max(0, Math.floor(dims.width));
    const ph = Math.max(0, Math.floor(dims.height));
    const patch = frame?.patch;
    if (patch && pw > 0 && ph > 0 && patch.length >= pw * ph * 4) {
      blendInto(canvas, patch, cw, ch, Math.floor(dims.left), Math.floor(dims.top), pw, ph);
    }

    out.push({
      index,
      delay: Number.isFinite(frame?.delay) ? Math.max(0, Math.round(frame.delay)) : GIF_DELAY_DEFAULT,
      disposal,
      left: Math.floor(dims.left),
      top: Math.floor(dims.top),
      width: pw,
      height: ph,
      data: canvas.slice(),
    });

    if (disposal === 2) {
      clearRect(canvas, cw, ch, Math.floor(dims.left), Math.floor(dims.top), pw, ph);
    } else if (disposal === 3 && saved) {
      canvas = saved;
    }
  });

  return out;
};

/** 解析 GIF 字节 (尺寸非法 / 无帧 / 非 GIF 数据时抛出异常) */
export const parseGif = (bytes: Uint8Array | ArrayBuffer, maxFrames = GIF_MAX_FRAMES): GifData => {
  const buffer = toArrayBuffer(bytes);
  // 先验签名: 非 GIF 数据交给解析器会得到乱七八糟的尺寸, 不利于给出准确提示
  const head = new Uint8Array(buffer, 0, Math.min(6, buffer.byteLength));
  if (head.length < 6 || String.fromCharCode(head[0], head[1], head[2]) !== 'GIF') throw new Error('invalid-gif');
  const parsed = parseGIF(buffer);
  const width = Math.floor(Number(parsed?.lsd?.width ?? 0));
  const height = Math.floor(Number(parsed?.lsd?.height ?? 0));
  if (!(width >= 1) || !(height >= 1)) throw new Error('invalid-gif-size');
  if (width > GIF_MAX_SIDE || height > GIF_MAX_SIDE) throw new Error('gif-too-large');  const raw = decompressFrames(parsed, true);
  if (raw.length === 0) throw new Error('no-frames');
  if (maxFrames > 0 && raw.length > maxFrames) throw new Error('too-many-frames');
  return {
    width,
    height,
    frames: composeFrames(raw, width, height),
    loopCount: loopCountOf(parsed),
    version: String(parsed?.header?.version ?? ''),
    bytes: buffer.byteLength,
  };
};

/** 总时长 (毫秒; 单帧 GIF 返回 0) */
export const totalDuration = (frames: readonly { delay: number }[]): number =>
  frames.reduce((sum, f) => sum + (Number.isFinite(f?.delay) ? Math.max(0, f.delay) : 0), 0);

/** 时长文本: <1s 用 ms, 其余用秒 (保留两位小数) */
export const formatDuration = (ms: number): string => {
  const n = Math.max(0, Math.round(Number.isFinite(ms) ? ms : 0));
  if (n < 1000) return `${n} ms`;
  return `${(n / 1000).toFixed(2)} s`;
};

/** 每秒帧数文本 (时长为 0 时显示 '-' ) */
export const formatFps = (frames: readonly { delay: number }[]): string => {
  const total = totalDuration(frames);
  if (total <= 0 || frames.length === 0) return '-';
  return (frames.length * 1000 / total).toFixed(1);
};

/** 循环次数的展示文本 (纯文本, 供页面翻译) */
export const loopTextKey = (loopCount: number | null): string => {
  if (loopCount === null) return '只播放一次';
  if (loopCount === 0) return '无限循环';
  return `循环 ${loopCount} 次`;
};

/** 左侧补零 */
export const padNum = (n: number, width: number): string => String(n).padStart(Math.max(1, width), '0');

/** 帧文件名: 前缀_01.png */
export const frameFileName = (
  base: string,
  index: number,
  total: number,
  ext = 'png',
): string => `${base}_${padNum(index + 1, String(Math.max(1, total)).length)}.${ext}`;

/** 精灵图排版 (cols 超出帧数时收缩到帧数) */
export const spriteLayout = (count: number, cols: number): { cols: number; rows: number } => {
  const n = Math.max(0, Math.floor(count));
  if (n === 0) return { cols: 0, rows: 0 };
  const c = Math.min(n, Math.max(1, Math.floor(Number.isFinite(cols) ? cols : 1)));
  return { cols: c, rows: Math.ceil(n / c) };
};

/** 精灵图结果 */
export interface SpriteImage { data: Uint8ClampedArray; width: number; height: number; cols: number; rows: number; }

/**
 * 把合成后的帧拼成一张精灵图 (网格)
 * @param frames 各帧整幅 RGBA 像素 (可通过 GifFrame.data 得到)
 * @param width / height 单帧尺寸
 * @param cols 列数
 * @param gap 间隔像素
 * @param gapColor 间隔颜色 (RGBA, 默认透明)
 */
export const composeSprite = (
  frames: readonly Uint8ClampedArray[],
  width: number,
  height: number,
  cols: number,
  gap = 0,
  gapColor: [number, number, number, number] = [ 0, 0, 0, 0 ],
): SpriteImage => {
  const w = Math.max(0, Math.floor(width));
  const h = Math.max(0, Math.floor(height));
  const g = Math.max(0, Math.floor(gap));
  const { cols: c, rows: r } = spriteLayout(frames.length, cols);
  if (c === 0 || r === 0 || w < 1 || h < 1) return { data: new Uint8ClampedArray(0), width: 0, height: 0, cols: c, rows: r };
  const sw = c * w + (c - 1) * g;
  const sh = r * h + (r - 1) * g;
  const data = new Uint8ClampedArray(sw * sh * 4);
  if (g > 0 && gapColor[3] > 0) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = gapColor[0];
      data[i + 1] = gapColor[1];
      data[i + 2] = gapColor[2];
      data[i + 3] = gapColor[3];
    }
  }
  frames.forEach((frame, i) => {
    if (!frame || frame.length < w * h * 4) return;
    const cx = (i % c) * (w + g);
    const cy = Math.floor(i / c) * (h + g);
    for (let y = 0; y < h; y++) {
      const from = y * w * 4;
      data.set(frame.subarray(from, from + w * 4), ((cy + y) * sw + cx) * 4);
    }
  });
  return { data, width: sw, height: sh, cols: c, rows: r };
};

/** 待编码的一帧 */
export interface EncodeFrame { data: Uint8ClampedArray; delay: number; }

/** 编码参数 */
export interface GifEncodeOptions {
  width: number;
  height: number;
  /** -1 = 只播放一次; 0 = 无限循环 (默认) */
  loop?: number;
  /** 调色板上限 2~255 */
  maxColors?: number;
  dither?: GifDither;
  /** 是否把半透明像素预乘 (默认 true, 避免边缘发黑) */
  premultipliedAlpha?: boolean;
}

/** 把若干帧编码为 GIF 字节 (全部在本地完成) */
export const encodeGif = async (frames: readonly EncodeFrame[], opts: GifEncodeOptions): Promise<Uint8Array> => {
  const width = Math.floor(Number(opts.width));
  const height = Math.floor(Number(opts.height));
  if (!(width >= 1) || !(height >= 1)) throw new Error('invalid-gif-size');
  if (frames.length === 0) throw new Error('no-frames');
  const loop = Number.isFinite(opts.loop) ? Math.floor(opts.loop as number) : GIF_LOOP_INFINITE;
  const maxColors = Math.min(GIF_COLORS_MAX, Math.max(GIF_COLORS_MIN, Math.floor(opts.maxColors ?? GIF_COLORS_DEFAULT)));
  const dither = opts.dither && opts.dither !== 'none' ? opts.dither : undefined;
  const out = await encode({
    width,
    height,
    // TS 5.7 起 TypedArray 泛型化: modern-gif 的 BufferSource 只接受 ArrayBuffer 支撑的视图
    frames: frames.map((f) => ({ data: f.data as Uint8ClampedArray<ArrayBuffer>, delay: Math.max(0, Math.round(f.delay)) })),
    looped: loop >= 0,
    loopCount: loop > 0 ? loop : 0,
    maxColors,
    premultipliedAlpha: opts.premultipliedAlpha !== false,
    ...(dither ? { dither } : {}),
    format: 'arrayBuffer',
  });
  return new Uint8Array(out);
};

/** 把 RGBA 像素写到 canvas (环境不支持 canvas / 数据不足时返回 false) */
export const drawRgba = (
  canvas: HTMLCanvasElement,
  data: Uint8ClampedArray,
  width: number,
  height: number,
): boolean => {
  const w = Math.floor(width);
  const h = Math.floor(height);
  if (!canvas || w < 1 || h < 1 || !data || data.length < w * h * 4) return false;
  try {
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    const image = ctx.createImageData(w, h);
    image.data.set(data.subarray(0, w * h * 4));
    ctx.putImageData(image, 0, 0);
    return true;
  } catch {
    return false;
  }
};

/** 把 RGBA 像素写到 canvas 并返回 dataURL (环境不支持 canvas 时返回 null) */
export const rgbaToDataUrl = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
): string | null => {
  const w = Math.floor(width);
  const h = Math.floor(height);
  if (w < 1 || h < 1 || !data || data.length < w * h * 4) return null;
  try {
    const canvas = document.createElement('canvas');
    if (!drawRgba(canvas, data, w, h)) return null;
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
};

/** 把 RGBA 像素写成 PNG 字节 (环境不支持 canvas 时返回 null) */
export const rgbaToPngBytes = (data: Uint8ClampedArray, width: number, height: number): Uint8Array | null => {
  const url = rgbaToDataUrl(data, width, height);
  if (!url) return null;
  const base64 = url.slice(url.indexOf(',') + 1);
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};
