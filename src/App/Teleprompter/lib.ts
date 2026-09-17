// 提词器: 纯逻辑 (默认设置校验与读写 / 脚本切行 / 滚动数学 / 时间格式 / 快捷键判定)
// 设计: 与 DOM 解耦 —— 组件负责测量"视口高度"与"文本高度"后注入,
//       滚动推进 / 进度 / 剩余时间等计算都放在这里, 便于单元测试覆盖
import {
  DEFAULTS_STORAGE_KEY,
  FADE_DEFAULT, FOCUS_DECAY, FOCUS_DEFAULT, FOCUS_MIN_OPACITY,
  FONT_SIZE_DEFAULT, FONT_SIZE_MAX, FONT_SIZE_MIN,
  LINE_HEIGHT_DEFAULT, LINE_HEIGHT_MAX, LINE_HEIGHT_MIN,
  PAD_RATIO, SAMPLE_SCRIPTS, SPEED_DEFAULT, SPEED_MAX, SPEED_MIN,
} from './data';

/** 提词器选项 (工具页的当前参数; 默认值可在 设置中心 或工具页里修改) */
export interface PrompterOptions {
  /** 滚动速度 (像素/秒) */
  speed: number;
  /** 字号 (px) */
  fontSize: number;
  /** 行距倍率 */
  lineHeight: number;
  /** 上下边缘淡入淡出 */
  fade: boolean;
  /** 逐行焦点高亮 (只高亮当前阅读行, 越远越淡) */
  focus: boolean;
}

/** 默认可选项 */
export const DEFAULT_OPTIONS: PrompterOptions = {
  speed: SPEED_DEFAULT,
  fontSize: FONT_SIZE_DEFAULT,
  lineHeight: LINE_HEIGHT_DEFAULT,
  fade: FADE_DEFAULT,
  focus: FOCUS_DEFAULT,
};

// ==================== 取值校验 ====================
const toNum = (v: unknown): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : NaN;
};

/** 夹取到 [min, max] 并取整; 非法值回退 def */
const clampInt = (v: unknown, min: number, max: number, def: number): number => {
  const n = toNum(v);
  if (Number.isNaN(n)) return def;
  return Math.min(max, Math.max(min, Math.round(n)));
};

/** 速度 (像素/秒), 非法值回退默认 */
export const clampSpeed = (v: unknown): number => clampInt(v, SPEED_MIN, SPEED_MAX, SPEED_DEFAULT);

/** 字号 (px), 非法值回退默认 */
export const clampFontSize = (v: unknown): number => clampInt(v, FONT_SIZE_MIN, FONT_SIZE_MAX, FONT_SIZE_DEFAULT);

/** 行距倍率 (保留一位小数), 非法值回退默认 */
export const clampLineHeight = (v: unknown): number => {
  const n = toNum(v);
  if (Number.isNaN(n)) return LINE_HEIGHT_DEFAULT;
  const clamped = Math.min(LINE_HEIGHT_MAX, Math.max(LINE_HEIGHT_MIN, n));
  return Math.round(clamped * 10) / 10;
};

/** 把任意来源 (JSON / 旧版本存储值) 规整成合法选项: 缺字段与非法值都回退默认 */
export const normalizeOptions = (raw: unknown): PrompterOptions => {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof PrompterOptions, unknown>>;
  return {
    speed: clampSpeed(src.speed),
    fontSize: clampFontSize(src.fontSize),
    lineHeight: clampLineHeight(src.lineHeight),
    fade: typeof src.fade === 'boolean' ? src.fade : FADE_DEFAULT,
    focus: typeof src.focus === 'boolean' ? src.focus : FOCUS_DEFAULT,
  };
};

/** 读取默认设置 (工具页打开时的初始值; 无配置 / JSON 损坏 / 隐私模式禁用 localStorage 时均回退内置默认) */
export const getDefaultOptions = (): PrompterOptions => {
  try {
    const raw = localStorage.getItem(DEFAULTS_STORAGE_KEY);
    return raw ? normalizeOptions(JSON.parse(raw)) : normalizeOptions(null);
  } catch {
    return normalizeOptions(null);
  }
};

/** 保存默认设置 (整体覆盖; 非法规整后再存, 写入失败时静默忽略, 不影响使用) */
export const setDefaultOptions = (opts: PrompterOptions): PrompterOptions => {
  const next = normalizeOptions(opts);
  try {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 忽略 */
  }
  return next;
};

/** 局部更新默认设置 (设置中心逐项修改用), 返回写入后的完整设置 */
export const patchDefaultOptions = (next: Partial<PrompterOptions>): PrompterOptions =>
  setDefaultOptions({ ...getDefaultOptions(), ...next });

/** 两组选项 (规整后) 是否完全一致 —— 工具页据此判断「保存为默认设置」是否还有必要 */
export const isSameOptions = (a: PrompterOptions, b: PrompterOptions): boolean => {
  const x = normalizeOptions(a);
  const y = normalizeOptions(b);
  return (Object.keys(x) as (keyof PrompterOptions)[]).every((k) => x[k] === y[k]);
};

// ==================== 示例脚本 ====================
/** 取当前语言的示例脚本组 (zh-TW 用繁体组, 其余非 en 一律回退简体组) */
export const sampleScriptsOf = (locale: string): readonly string[] => {
  if (locale === 'en') return SAMPLE_SCRIPTS.en;
  if (locale === 'zh-TW') return SAMPLE_SCRIPTS['zh-TW'];
  return SAMPLE_SCRIPTS['zh-CN'];
};

/** 随机取一首示例脚本; rand 可注入 (0 ~ 1) 便于测试与固定行为 */
export const pickSampleScript = (locale: string, rand: number = Math.random()): string => {
  const list = sampleScriptsOf(locale);
  const r = Number.isFinite(rand) ? rand : 0;
  const i = Math.min(list.length - 1, Math.max(0, Math.floor(r * list.length)));
  return list[i] ?? '';
};

/** 换一首示例: 优先挑与当前稿件不同的一首 (组内只有一首时则返回它本身) */
export const nextSampleScript = (locale: string, current: string, rand: number = Math.random()): string => {
  const list = sampleScriptsOf(locale);
  const pool = list.filter((item) => item !== current);
  const source = pool.length ? pool : list;
  if (!source.length) return '';
  const r = Number.isFinite(rand) ? rand : 0;
  const i = Math.min(source.length - 1, Math.max(0, Math.floor(r * source.length)));
  return source[i];
};

// ==================== 脚本 ====================
/** 切分为逐行渲染的行数组: 统一换行符, 去掉首尾空行, 中间空行保留 (充当段落间距) */
export const splitScript = (text: string): string[] => {
  const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  return lines;
};

// ==================== 滚动数学 ====================
/**
 * 滚动总距离: 上下留白 + 文本高度 - 视口高度
 * 上下各留 padRatio * 视口高度, 于是开头第一行从视口下方进入, 结尾最后一行停在视口偏上位置
 */
export const scrollDistance = (textHeight: number, viewHeight: number, padRatio: number = PAD_RATIO): number => {
  const th = Math.max(0, toNum(textHeight) || 0);
  const vh = Math.max(0, toNum(viewHeight) || 0);
  if (!vh) return th; // 尚未测量到视口高度时退化为文本高度
  return Math.max(0, th + 2 * padRatio * vh - vh);
};

/** 按速度推进一帧: 返回新偏移与是否已到结尾 */
export const advance = (
  offset: number,
  distance: number,
  speed: number,
  dtMs: number,
): { offset: number; done: boolean } => {
  const limit = Math.max(0, toNum(distance) || 0);
  const cur = Math.max(0, toNum(offset) || 0);
  const sp = Math.max(0, toNum(speed) || 0);
  const dt = Math.max(0, toNum(dtMs) || 0);
  const next = Math.min(limit, cur + (sp * dt) / 1000);
  return { offset: next, done: next >= limit };
};

/** 进度 0 ~ 1 */
export const progressOf = (offset: number, distance: number): number => {
  const limit = toNum(distance);
  if (!Number.isFinite(limit) || limit <= 0) return 0;
  return Math.min(1, Math.max(0, (toNum(offset) || 0) / limit));
};

/** 剩余时间 (秒), 速度非法/为 0 时返回 0 (避免除零得到 Infinity) */
export const remainingSeconds = (offset: number, distance: number, speed: number): number => {
  const sp = toNum(speed);
  if (!Number.isFinite(sp) || sp <= 0) return 0;
  const left = Math.max(0, (toNum(distance) || 0) - (toNum(offset) || 0));
  return left / sp;
};

/** 秒数 → m:ss (超过 1 小时则累计分钟数) */
export const formatClock = (seconds: number): string => {
  const n = toNum(seconds);
  const total = Math.max(0, Math.round(Number.isFinite(n) ? n : 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

// ==================== 渐近高亮 ====================
/** 逐行焦点透明度: 以阅读行为中心, 每远离 1 行衰减 FOCUS_DECAY, 最远处收敛到 FOCUS_MIN_OPACITY */
export const focusOpacity = (distanceLines: number): number => {
  const d = Math.abs(toNum(distanceLines) || 0);
  return FOCUS_MIN_OPACITY + (1 - FOCUS_MIN_OPACITY) * Math.pow(FOCUS_DECAY, d);
};

/** 每行中心线在轨道坐标系里的位置 (行内折行时行高更大, 中心线仍然居中) */
export const lineCentersOf = (rects: readonly { top: number; height: number }[]): number[] =>
  rects.map((r) => (toNum(r?.top) || 0) + (toNum(r?.height) || 0) / 2);

/** 距阅读线最近的一行下标 (阅读线屏幕坐标 = 轨道内位置 - 偏移量); 无行时返回 -1 */
export const activeLineIndex = (centers: readonly number[], offset: number, readY: number): number => {
  if (!centers.length) return -1;
  const target = (toNum(readY) || 0) + (toNum(offset) || 0);
  let best = 0;
  let bestGap = Infinity;
  centers.forEach((c, i) => {
    const gap = Math.abs((toNum(c) || 0) - target);
    if (gap < bestGap) {
      bestGap = gap;
      best = i;
    }
  });
  return best;
};

/** 行距基准 (相邻行中心间距的中位数, 折行的长行不会把基准拉大); 测不到时用字号 × 行距兜底 */
export const lineStepOf = (centers: readonly number[], fallback: number): number => {
  const fallbackStep = Math.max(1, toNum(fallback) || 1);
  const diffs: number[] = [];
  for (let i = 1; i < centers.length; i += 1) {
    const d = (toNum(centers[i]) || 0) - (toNum(centers[i - 1]) || 0);
    if (d > 0) diffs.push(d);
  }
  if (!diffs.length) return fallbackStep;
  diffs.sort((a, b) => a - b);
  return diffs[Math.floor(diffs.length / 2)] || fallbackStep;
};

// ==================== 快捷键 ====================
/** 是否为「开始 / 暂停」触发键 (空格; 兼容老浏览器的 Spacebar 与 code) */
export const isToggleKey = (e: { key?: string; code?: string } | null | undefined): boolean => {
  if (!e) return false;
  return e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space';
};

/** 是否为滑块手柄 (方向键归滑块自己处理, 页面快捷键不抢键) */
export const isSliderTarget = (node: { getAttribute?: (name: string) => string | null } | null | undefined): boolean => {
  if (!node || typeof node.getAttribute !== 'function') return false;
  return node.getAttribute('role') === 'slider';
};

/** 键盘事件是否来自输入控件 (此时空格应正常输入文本, 不触发播放) */
export const isTypingTarget = (node: { tagName?: string; isContentEditable?: boolean } | null | undefined): boolean => {
  if (!node) return false;
  const tag = String(node.tagName ?? '').toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable === true;
};
