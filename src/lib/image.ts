// 图片类工具通用能力: 读取图片文件 / 画布与像素读写 / 导出与保存 / 体积与文件名
//
// 说明: 这里只放与"滤镜算法"无关的管道代码, 各工具的像素算法放在各自的 lib.ts 中,
//       以便单测不依赖 canvas (详见 ImageNegative / ImageGrayscale / ImageSharpen / ImageColorPicker)。
import { saveBytesFile, savePngFile } from './tauri';

/** 宽高 (像素) */
export interface Size { width: number; height: number; }

/** 输出格式 (WebP 需要浏览器支持 canvas 导出, 见 supportsWebp) */
export type OutputFormat = 'PNG' | 'JPEG' | 'WebP';
export const OUTPUT_FORMATS: OutputFormat[] = [ 'PNG', 'JPEG', 'WebP' ];

/** 默认文件名主体 */
export const DEFAULT_BASE = 'image';

/** 画布单边安全上限 (超过该尺寸的浏览器 canvas 会渲染失败) */
export const CANVAS_MAX = 16384;

/** 读取图片文件时的失败原因 (页面据此给出本地化提示) */
export type ImageErrorCode = 'not-image' | 'read-failed' | 'decode-failed';
export class ImageError extends Error {
  code: ImageErrorCode;
  constructor(code: ImageErrorCode) {
    super(code);
    this.name = 'ImageError';
    this.code = code;
  }
}

/** 是否为图片文件 (按 MIME 判断) */
export const isImageFile = (file: File): boolean =>
  typeof file?.type === 'string' && file.type.startsWith('image/');

/** 等比缩放到不超过 maxW × maxH (本身未超限时原样返回) */
export const fitWithin = (size: Size, maxW: number, maxH: number): Size => {
  if (size.width <= maxW && size.height <= maxH) return size;
  const ratio = Math.min(maxW / size.width, maxH / size.height);
  return {
    width: Math.max(1, Math.round(size.width * ratio)),
    height: Math.max(1, Math.round(size.height * ratio)),
  };
};

/** 去掉扩展名与非法字符, 生成文件名主体 (为空时回退 fallback) */
export const baseName = (fileName: string, fallback = DEFAULT_BASE): string => {
  const noExt = String(fileName ?? '').replace(/\.[^.\\/]+$/, '');
  const clean = noExt.replace(/[\\/:*?"<>|]+/g, '_').trim();
  return clean === '' ? fallback : clean;
};

/** 字节数格式化 */
export const formatBytes = (n: number): string => {
  if (!Number.isFinite(n) || n <= 0) return '0 B';
  if (n < 1024) return `${Math.round(n)} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
};

/** 输出扩展名 */
export const extOf = (format: OutputFormat): string =>
  (format === 'JPEG' ? 'jpg' : format === 'WebP' ? 'webp' : 'png');

/** 输出 MIME (同时用作 canvas.toDataURL 的 type) */
export const mimeOf = (format: OutputFormat): string =>
  (format === 'JPEG' ? 'image/jpeg' : format === 'WebP' ? 'image/webp' : 'image/png');

/** 是否为有损格式 (质量参数生效, 且透明区域需要铺白底) */
export const isLossy = (format: OutputFormat): boolean => format !== 'PNG';

let webpSupport: boolean | null = null;
/**
 * 当前环境是否支持 canvas 导出 WebP (结果做一次缓存)
 * 不支持的浏览器 toDataURL('image/webp') 会静默返回 PNG, 因此用前缀判断
 */
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

/** 仅测试用: 重置 WebP 能力缓存 */
export const resetWebpCache = (): void => { webpSupport = null; };

/** dataURL -> 字节数组 (base64 解码; 用于 JPEG / WebP 等需要原始字节的保存场景) */
export const dataUrlToBytes = (dataUrl: string): Uint8Array => {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

/** 创建画布 (尺寸非法时返回 null) */
export const createCanvas = (size: Size): HTMLCanvasElement | null => {
  const w = Math.round(size?.width ?? 0);
  const h = Math.round(size?.height ?? 0);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1) return null;
  if (w > CANVAS_MAX || h > CANVAS_MAX) return null;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
};

/** 取 2D 上下文 (环境不支持时返回 null) */
export const get2d = (canvas: HTMLCanvasElement): CanvasRenderingContext2D | null => {
  try {
    return canvas.getContext('2d');
  } catch {
    return null;
  }
};

/** 在画布上铺白底 (JPEG / WebP 无透明通道, 避免透明区域变黑) */
export const fillWhite = (ctx: CanvasRenderingContext2D, size: Size): void => {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size.width, size.height);
};

/**
 * 把图片 (或中间画布) 画到指定尺寸的新画布上
 * @param opaque 有损输出时先铺白底
 * @returns 绘制好的画布; 环境不支持返回 null
 */
export const drawToCanvas = (
  source: HTMLImageElement | HTMLCanvasElement,
  size: Size,
  opaque = false,
): HTMLCanvasElement | null => {
  const canvas = createCanvas(size);
  if (!canvas) return null;
  const ctx = get2d(canvas);
  if (!ctx) return null;
  if (opaque) fillWhite(ctx, size);
  ctx.drawImage(source, 0, 0, size.width, size.height);
  return canvas;
};

/** 读取画布像素 (环境不支持返回 null) */
export const readPixels = (canvas: HTMLCanvasElement): ImageData | null => {
  const ctx = get2d(canvas);
  if (!ctx) return null;
  try {
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch {
    return null;
  }
};

/** 把像素写回画布 (环境不支持返回 false) */
export const writePixels = (canvas: HTMLCanvasElement, data: ImageData): boolean => {
  const ctx = get2d(canvas);
  if (!ctx) return false;
  try {
    ctx.putImageData(data, 0, 0);
    return true;
  } catch {
    return false;
  }
};

/** 导出 dataURL (有损格式传质量) */
export const exportDataUrl = (canvas: HTMLCanvasElement, format: OutputFormat, quality?: number): string =>
  (isLossy(format) ? canvas.toDataURL(mimeOf(format), quality) : canvas.toDataURL(mimeOf(format)));

/** 逐像素处理管道的结果 */
export interface FilterResult { url: string; bytes: number; }

/**
 * 逐像素处理管道 (滤镜类工具共用):
 * 画布 -> drawImage -> getImageData -> transform 变换像素 -> putImageData -> dataURL
 *
 * @param source    已解码的原图 (或中间画布)
 * @param size      处理尺寸 (通常即原图尺寸)
 * @param opts.format    输出格式 (有损格式会先铺白底)
 * @param opts.quality   有损格式的质量 0~1
 * @param opts.transform 像素变换: 收到 RGBA 扁平数据, 返回等长的新数据 (纯函数)
 * @returns 导出结果; 环境不支持 canvas 或尺寸非法时返回 null
 */
export const filterImage = (
  source: HTMLImageElement | HTMLCanvasElement,
  size: Size,
  opts: { format: OutputFormat; quality?: number; transform: (data: Uint8ClampedArray) => Uint8ClampedArray },
): FilterResult | null => {
  const canvas = createCanvas(size);
  if (!canvas) return null;
  const ctx = get2d(canvas);
  if (!ctx) return null;
  if (isLossy(opts.format)) fillWhite(ctx, size);
  ctx.drawImage(source, 0, 0, size.width, size.height);
  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, size.width, size.height);
  } catch {
    return null;
  }
  const next = opts.transform(imageData.data);
  // 变换结果长度不一致时按原数据处理, 避免 putImageData 抛错
  if (next && next.length === imageData.data.length) imageData.data.set(next);
  try {
    ctx.putImageData(imageData, 0, 0);
  } catch {
    return null;
  }
  const url = exportDataUrl(canvas, opts.format, opts.quality);
  return { url, bytes: dataUrlBytes(url) };
};

/** dataURL 的大致字节数 (base64 长度换算, 用于体积对比) */
export const dataUrlBytes = (dataUrl: string): number =>
  Math.max(0, Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75));

/**
 * 保存 dataURL 为文件
 * - PNG 走图片保存 (系统图片保存对话框 / 浏览器下载)
 * - JPEG / WebP 走字节保存
 * @returns true = 已保存; false = 用户取消
 */
export const saveDataUrl = async (
  dataUrl: string,
  fileName: string,
  format: OutputFormat,
  labels: { title?: string } = {},
): Promise<boolean> => {
  if (format === 'PNG') return savePngFile(fileName, dataUrl);
  return saveBytesFile(fileName, dataUrlToBytes(dataUrl), {
    title: labels.title ?? 'Save',
    filterName: format,
    extensions: format === 'WebP' ? [ 'webp' ] : [ 'jpg', 'jpeg' ],
  });
};

/** 已解码的图片文件 */
export interface ImageFile {
  /** 原图 dataURL (预览用) */
  url: string;
  /** 已解码的图片 (可用于 canvas 绘制) */
  img: HTMLImageElement;
  /** 原始尺寸 */
  size: Size;
  /** 文件字节数 */
  bytes: number;
  /** 文件名主体 (无扩展名) */
  base: string;
}

/** FileReader.readAsDataURL 的 Promise 包装 */
const readAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new ImageError('read-failed'));
  reader.onload = () => resolve(String(reader.result ?? ''));
  reader.readAsDataURL(file);
});

/**
 * 读取并解码图片文件 (非图片 / 读取失败 / 解码失败时 reject 一个 ImageError)
 * 页面可据此按 code 给出本地化提示
 */
export const loadImageFile = async (file: File): Promise<ImageFile> => {
  if (!isImageFile(file)) throw new ImageError('not-image');
  const url = await readAsDataUrl(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onerror = () => reject(new ImageError('decode-failed'));
    el.onload = () => resolve(el);
    el.src = url;
  });
  const size = { width: img.naturalWidth || img.width, height: img.naturalHeight || img.height };
  if (size.width < 1 || size.height < 1) throw new ImageError('decode-failed');
  return { url, img, size, bytes: file.size, base: baseName(file.name) };
};
