// 图片分割: 纯逻辑 (行列边界 / 分块矩形 / 文件命名 / 设置持久化)
// 说明: 与 DOM / Canvas 无关, 便于单测; 页面只负责把矩形画到 canvas 上
import {
  DEFAULT_LAYOUT_KEY, DEFAULT_PARTS, DEFAULT_PREFIX,
  GAP_DEFAULT, GAP_MAX, GAP_MIN,
  PART_OPTIONS, QUALITY_DEFAULT, QUALITY_MAX, QUALITY_MIN, SPLIT_LAYOUTS,
  type PartCount, type SplitLayout,
} from './data';

/** 输出格式 */
export type OutputFormat = 'PNG' | 'JPEG';
export const OUTPUT_FORMATS: OutputFormat[] = [ 'PNG', 'JPEG' ];

/** 编号方式: seq = 顺序 1..n; rc = 行列 r{row}c{col} */
export type NumberMode = 'seq' | 'rc';
export const NUMBER_MODES: NumberMode[] = [ 'seq', 'rc' ];

/** 设置持久化 key */
export const KEY_PARTS = 'image-split.default-parts';
export const KEY_FORMAT = 'image-split.default-format';
export const KEY_QUALITY = 'image-split.jpeg-quality';

/** 单个分块在原图中的位置 (index 从 1 开始, row/col 从 0 开始) */
export interface TileRect { index: number; row: number; col: number; x: number; y: number; width: number; height: number; }

export const isPartCount = (v: unknown): v is PartCount => PART_OPTIONS.includes(v as PartCount);
export const isOutputFormat = (v: unknown): v is OutputFormat => OUTPUT_FORMATS.includes(v as OutputFormat);

/** 非法份数回退默认 */
export const normalizeParts = (v: unknown): PartCount => (isPartCount(v) ? v : DEFAULT_PARTS);
/** 非法格式回退 PNG */
export const normalizeFormat = (v: unknown): OutputFormat => (isOutputFormat(v) ? v : 'PNG');
/** 质量裁剪到 [QUALITY_MIN, QUALITY_MAX], 非法值 (含 null / '' ) 回退默认 */
export const normalizeQuality = (v: unknown): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  if (!Number.isFinite(n)) return QUALITY_DEFAULT;
  return Math.min(QUALITY_MAX, Math.max(QUALITY_MIN, n));
};

/** 预览图块间隔取整并裁剪到 [GAP_MIN, GAP_MAX], 非法值回退默认 */
export const normalizeGap = (v: unknown): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  if (!Number.isFinite(n)) return GAP_DEFAULT;
  return Math.min(GAP_MAX, Math.max(GAP_MIN, Math.round(n)));
};

/** 某份数支持的布局列表 (横向在前) */
export const layoutsFor = (parts: number): SplitLayout[] => SPLIT_LAYOUTS.filter((l) => l.parts === parts);

/** 取布局: key 未命中时回退该份数的第一个布局 */
export const findLayout = (key: string, parts?: number): SplitLayout => {
  const hit = SPLIT_LAYOUTS.find((l) => l.key === key);
  if (hit) return hit;
  const list = parts === undefined ? SPLIT_LAYOUTS : layoutsFor(parts);
  return list[0] ?? SPLIT_LAYOUTS[0];
};

/** 切换份数后应保持的布局 key (该份数不支持时用其第一个布局) */
export const layoutKeyForParts = (parts: number, prefer: string = DEFAULT_LAYOUT_KEY): string => {
  const list = layoutsFor(parts);
  if (list.some((l) => l.key === prefer)) return prefer;
  return list[0]?.key ?? prefer;
};

/**
 * 均分边界: 返回长度 n+1 的像素坐标数组 (首 0, 尾 total)
 * 逐条累积偏移而不是平均切分, 余数按四舍五入分配 -> 各块宽度只差 1 像素, 且总和恒等于 total (不丢像素)
 */
export const axisBounds = (total: number, n: number): number[] => {
  const size = Math.max(1, Math.floor(n));
  const safeTotal = Math.max(0, Math.floor(total));
  const out: number[] = [];
  for (let i = 0; i <= size; i++) out.push(i === size ? safeTotal : Math.round((i * safeTotal) / size));
  // 总长小于份数时可能出现回退, 保证单调不减
  for (let i = 1; i < out.length; i++) if (out[i] < out[i - 1]) out[i] = out[i - 1];
  return out;
};

/** 按布局切出全部分块矩形 (行优先编号; 各块无重叠且拼合后即原图) */
export const tileRects = (width: number, height: number, layout: SplitLayout): TileRect[] => {
  const xs = axisBounds(width, layout.cols);
  const ys = axisBounds(height, layout.rows);
  const out: TileRect[] = [];
  for (let r = 0; r < layout.rows; r++) {
    for (let c = 0; c < layout.cols; c++) {
      out.push({
        index: r * layout.cols + c + 1,
        row: r,
        col: c,
        x: xs[c],
        y: ys[r],
        width: xs[c + 1] - xs[c],
        height: ys[r + 1] - ys[r],
      });
    }
  }
  return out;
};

/** 去掉扩展名与文件系统非法字符, 得到可用的文件名前缀 */
export const sanitizePrefix = (name: string): string => {
  const base = name
    .replace(/\.[^./\\]+$/, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return base === '' ? DEFAULT_PREFIX : base;
};

/** 左侧补零 */
export const padNum = (n: number, width: number): string => String(n).padStart(Math.max(1, width), '0');

export const extOf = (format: OutputFormat): string => (format === 'JPEG' ? 'jpg' : 'png');
export const mimeOf = (format: OutputFormat): string => (format === 'JPEG' ? 'image/jpeg' : 'image/png');

/** 分块文件名: seq = 前缀_01.png; rc = 前缀_r1c2.png */
export const tileFileName = (
  prefix: string,
  tile: Pick<TileRect, 'index' | 'row' | 'col'>,
  mode: NumberMode,
  format: OutputFormat,
  total: number,
): string => {
  const base = sanitizePrefix(prefix);
  const ext = extOf(format);
  if (mode === 'rc') return `${base}_r${tile.row + 1}c${tile.col + 1}.${ext}`;
  const digits = String(Math.max(1, Math.floor(total))).length;
  return `${base}_${padNum(tile.index, digits)}.${ext}`;
};

/** 每块缩放尺寸 (maxWidth <= 0 或原图更窄时保持原尺寸) */
export const scaleTileSize = (width: number, height: number, maxWidth: number): { width: number; height: number; scale: number } => {
  if (!Number.isFinite(maxWidth) || maxWidth <= 0 || width <= 0 || width <= maxWidth) {
    return { width, height, scale: 1 };
  }
  const scale = maxWidth / width;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)), scale };
};

/** data URL -> 字节 (atob 实现, jsdom 环境同样可用) */
export const dataUrlToBytes = (dataUrl: string): Uint8Array => {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

/** 字节数文本 (B / KB / MB) */
export const formatBytes = (n: number): string => {
  if (!Number.isFinite(n) || n <= 0) return '0 B';
  if (n < 1024) return `${Math.round(n)} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
};

// ---- 设置持久化 (localStorage 异常时静默回退默认) ----
const rawGet = (key: string): string | null => {
  try { return window.localStorage.getItem(key); } catch { return null; }
};
const rawSet = (key: string, value: string): void => {
  try { window.localStorage.setItem(key, value); } catch { /* 忽略隐私模式等异常 */ }
};

export const getDefaultParts = (): PartCount => normalizeParts(Number(rawGet(KEY_PARTS)));
export const setDefaultParts = (v: PartCount): void => rawSet(KEY_PARTS, String(v));
export const getDefaultFormat = (): OutputFormat => normalizeFormat(rawGet(KEY_FORMAT));
export const setDefaultFormat = (v: OutputFormat): void => rawSet(KEY_FORMAT, v);
export const getDefaultQuality = (): number => normalizeQuality(rawGet(KEY_QUALITY));
export const setDefaultQuality = (v: number): void => rawSet(KEY_QUALITY, String(v));
