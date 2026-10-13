// GIF 拆解: 应用级配置 (精灵图排版) 与帧选择 / 导出命名的纯逻辑
//
// GIF 解析与帧合成见 src/lib/gif.ts (parseGif / composeFrames / composeSprite)。
import { baseName } from '../../lib/image';

/** 精灵图列数默认值 (设置页可改) */
export const SPRITE_COLS_KEY = 'gif-split:sprite-cols';
/** 精灵图间隔默认值 (设置页可改) */
export const SPRITE_GAP_KEY = 'gif-split:sprite-gap';
/** 默认值变化事件: 设置页调整后, 已打开的工具页实时跟随 */
export const GIF_SPLIT_CHANGED = 'gif-split:default-changed';

/** 可载入的 GIF 大小上限 (超过则拒绝, 防止一次性读爆内存) */
export const MAX_GIF_SIZE = 64 * 1024 * 1024;

/** 帧列表最多渲染的行数 (超大 GIF 只渲染前若干帧, 不影响导出全部) */
export const MAX_ROWS = 400;

/** 精灵图列数区间 */
export const COLS_MIN = 1;
export const COLS_MAX = 20;
export const COLS_DEFAULT = 5;

/** 帧间隔区间 (像素) */
export const GAP_MIN = 0;
export const GAP_MAX = 20;
export const GAP_DEFAULT = 0;

/** 播放速度档位 */
export const SPEEDS: readonly number[] = [ 0.25, 0.5, 1, 2, 4 ];

/** 取整并夹到区间内 (非法值回退 fallback) */
export const clampInt = (v: unknown, min: number, max: number, fallback: number): number => {
  // null / undefined / '' 视为「未设置」: Number(null) 与 Number('') 都会得到 0, 会把默认值顶成区间下限
  if (v === null || v === undefined || v === '') return fallback;
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

/** 精灵图列数规范化 */
export const toCols = (v: unknown): number => clampInt(v, COLS_MIN, COLS_MAX, COLS_DEFAULT);

/** 帧间隔规范化 */
export const toGap = (v: unknown): number => clampInt(v, GAP_MIN, GAP_MAX, GAP_DEFAULT);

/** 读取设置页配置的默认列数 */
export const getDefaultCols = (): number => {
  try {
    return toCols(localStorage.getItem(SPRITE_COLS_KEY));
  } catch {
    return COLS_DEFAULT;
  }
};

const broadcast = (): void => {
  try {
    window.dispatchEvent(new Event(GIF_SPLIT_CHANGED));
  } catch {
    /* 非浏览器环境忽略 */
  }
};

/** 保存默认列数并广播 (设置页与工具页共用) */
export const setDefaultCols = (v: unknown): void => {
  try {
    localStorage.setItem(SPRITE_COLS_KEY, String(toCols(v)));
  } catch {
    /* 隐私模式忽略 */
  }
  broadcast();
};

/** 读取设置页配置的默认间隔 */
export const getDefaultGap = (): number => {
  try {
    return toGap(localStorage.getItem(SPRITE_GAP_KEY));
  } catch {
    return GAP_DEFAULT;
  }
};

/** 保存默认间隔并广播 */
export const setDefaultGap = (v: unknown): void => {
  try {
    localStorage.setItem(SPRITE_GAP_KEY, String(toGap(v)));
  } catch {
    /* 隐私模式忽略 */
  }
  broadcast();
};

/** 全部帧 id (0..count-1) */
export const allFrameIds = (count: number): Set<number> => {
  const ids = new Set<number>();
  const n = Math.max(0, Math.floor(count));
  for (let i = 0; i < n; i += 1) ids.add(i);
  return ids;
};

/** 切换单个帧的选中状态 (返回新集合, 不改原集合) */
export const toggleId = (ids: ReadonlySet<number>, id: number): Set<number> => {
  const next = new Set(ids);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

/** 反选 */
export const invertIds = (ids: ReadonlySet<number>, count: number): Set<number> => {
  const next = new Set<number>();
  for (let i = 0; i < Math.max(0, Math.floor(count)); i += 1) if (!ids.has(i)) next.add(i);
  return next;
};

/** 去掉超出范围的 id (重新载入 GIF 后调用) */
export const pruneIds = (ids: ReadonlySet<number>, count: number): Set<number> => {
  const n = Math.max(0, Math.floor(count));
  const next = new Set<number>();
  for (const id of ids) if (Number.isInteger(id) && id >= 0 && id < n) next.add(id);
  return next;
};

/** 选中帧 id 升序数组 */
export const sortedIds = (ids: ReadonlySet<number>): number[] =>
  Array.from(ids).filter((id) => Number.isInteger(id)).sort((a, b) => a - b);

/** 帧文件名前缀 (GIF 文件名去扩展名, 为空回退 gif) */
export const framePrefix = (fileName: string): string => baseName(fileName, 'gif');

/** 解析失败的内部错误码 -> 页面文案 (未识别时返回空串, 由页面回退到原始错误信息) */
export const parseErrorKey = (code: string): string => {
  switch (code) {
    case 'too-many-frames': return 'GIF 帧数过多 (超过 {n} 帧), 已拒绝载入';
    case 'gif-too-large': return 'GIF 尺寸过大 (超过 16384 像素), 已拒绝载入';
    case 'invalid-gif':
    case 'invalid-gif-size': return '不是有效的 GIF 图片';
    case 'no-frames': return 'GIF 中没有可用的帧';
    default: return '';
  }
};

/** 帧的处置方式文案 (页面翻译用) */
export const disposalKey = (disposal: number): string => {
  if (disposal === 2) return '还原背景';
  if (disposal === 3) return '还原上一帧';
  return '保留';
};

/** 当前帧在播放序列中的下一个 (循环) */
export const nextFrame = (current: number, count: number): number => {
  const n = Math.max(0, Math.floor(count));
  if (n === 0) return 0;
  return (Math.max(0, Math.floor(current)) + 1) % n;
};

/** 上一帧 (循环) */
export const prevFrame = (current: number, count: number): number => {
  const n = Math.max(0, Math.floor(count));
  if (n === 0) return 0;
  return (Math.max(0, Math.floor(current)) + n - 1) % n;
};

/** 播放下一帧前的等待时长 (按速度倍率缩放, 至少 20ms) */
export const frameWait = (delay: number, speed: number): number => {
  const d = Number.isFinite(delay) && delay > 0 ? delay : 100;
  const s = Number.isFinite(speed) && speed > 0 ? speed : 1;
  return Math.max(20, Math.round(d / s));
};
