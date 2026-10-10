// 节拍器: 纯逻辑 (参数校验 / 默认设置读写 / 节拍计算 / 连击测速 / 调度与闪烁队列)
// 说明: 本文件不依赖 DOM 与 Web Audio, 便于单测; 页面只做渲染与副作用
import {
  BEATS_DEFAULT,
  BEATS_MAX,
  BEATS_MIN,
  BPM_DEFAULT,
  BPM_MAX,
  BPM_MIN,
  COUNTDOWN_DEFAULT,
  COUNTDOWN_OPTIONS,
  DEFAULTS_STORAGE_KEY,
  PREP_INTERVAL_SEC,
  SUBDIVISION_DEFAULT,
  SUBDIVISION_OPTIONS,
  TAP_MAX_SAMPLES,
  TAP_RESET_MS,
  TEMPO_TERMS,
  TIMBRE_DEFAULT,
  TIMBRE_KEYS,
  VOLUME_DEFAULT,
  VOLUME_MAX,
  VOLUME_MIN,
  type TimbreKey,
} from './data';

/** 节拍器参数 (页面状态 + 默认设置共用同一结构) */
export interface MetronomeOptions {
  /** 速度 */
  bpm: number;
  /** 每小节拍数 */
  beats: number;
  /** 每拍细分 */
  subdivision: number;
  /** 音量 0 ~ 100 */
  volume: number;
  /** 音色 */
  timbre: TimbreKey;
  /** 首拍重音 */
  accent: boolean;
  /** 开始前的数字倒计时秒数 (0 = 关闭): 每秒一个预备拍并在圆点上跳动剩余秒数, 数完进入正拍 */
  countdown: number;
}

export const DEFAULT_OPTIONS: MetronomeOptions = {
  bpm: BPM_DEFAULT,
  beats: BEATS_DEFAULT,
  subdivision: SUBDIVISION_DEFAULT,
  volume: VOLUME_DEFAULT,
  timbre: TIMBRE_DEFAULT,
  accent: true,
  countdown: COUNTDOWN_DEFAULT,
};

/** 任意输入 -> 有限数字 (无法解析时返回 NaN) */
const toNum = (v: unknown): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : Number.NaN;
  if (typeof v === 'string' && v.trim() !== '') return Number(v);
  return Number.NaN;
};

/** 取整并夹紧到 [min, max]; 非法值回退 fallback */
const clampInt = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = toNum(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
};

/** 速度: 20 ~ 300 */
export const clampBpm = (v: unknown): number => clampInt(v, BPM_MIN, BPM_MAX, BPM_DEFAULT);

/** 每小节拍数: 1 ~ 12 */
export const clampBeats = (v: unknown): number => clampInt(v, BEATS_MIN, BEATS_MAX, BEATS_DEFAULT);

/** 细分: 只能取 SUBDIVISION_OPTIONS 里的值, 取最接近的一个 */
export const clampSubdivision = (v: unknown): number => {
  const n = toNum(v);
  if (!Number.isFinite(n)) return SUBDIVISION_DEFAULT;
  let best = SUBDIVISION_OPTIONS[0];
  for (const opt of SUBDIVISION_OPTIONS) {
    if (Math.abs(opt - n) < Math.abs(best - n)) best = opt;
  }
  return best;
};

/** 倒计时秒数: 只取预设档位里最接近的一个, 非法值回退默认 */
export const clampCountdown = (v: unknown): number => {
  const n = toNum(v);
  if (!Number.isFinite(n)) return COUNTDOWN_DEFAULT;
  let best = COUNTDOWN_OPTIONS[0];
  for (const opt of COUNTDOWN_OPTIONS) {
    if (Math.abs(opt - n) < Math.abs(best - n)) best = opt;
  }
  return best;
};

/** 音量: 0 ~ 100 */
export const clampVolume = (v: unknown): number => clampInt(v, VOLUME_MIN, VOLUME_MAX, VOLUME_DEFAULT);

/** 音色: 非法值回退默认音色 */
export const normalizeTimbre = (v: unknown): TimbreKey =>
  TIMBRE_KEYS.includes(v as TimbreKey) ? (v as TimbreKey) : TIMBRE_DEFAULT;

/** 任意输入 -> 完整合法的参数 */
export const normalizeOptions = (raw?: Partial<MetronomeOptions> | null): MetronomeOptions => ({
  bpm: clampBpm(raw?.bpm),
  beats: clampBeats(raw?.beats),
  subdivision: clampSubdivision(raw?.subdivision),
  volume: clampVolume(raw?.volume),
  timbre: normalizeTimbre(raw?.timbre),
  accent: raw?.accent === undefined ? DEFAULT_OPTIONS.accent : raw.accent === true,
  countdown: clampCountdown(raw?.countdown),
});

/** 读取默认设置 (读取失败/非法值一律回退默认) */
export const getDefaultOptions = (): MetronomeOptions => {
  try {
    const raw = localStorage.getItem(DEFAULTS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_OPTIONS };
    return normalizeOptions(JSON.parse(raw) as Partial<MetronomeOptions>);
  } catch {
    return { ...DEFAULT_OPTIONS };
  }
};

/** 写入默认设置 (已归一化; 返回真正写入的值) */
export const setDefaultOptions = (raw?: Partial<MetronomeOptions> | null): MetronomeOptions => {
  const next = normalizeOptions(raw);
  try {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 隐私模式等场景写入失败: 忽略 */
  }
  return next;
};

/** 局部更新默认设置 (未提供的字段保持原值) */
export const patchDefaultOptions = (
  patch: Partial<MetronomeOptions>
): MetronomeOptions => setDefaultOptions({ ...getDefaultOptions(), ...patch });

/** 两组参数是否一致 (用于「保存为默认设置」按钮的禁用状态) */
export const isSameOptions = (a: MetronomeOptions, b: MetronomeOptions): boolean =>
  a.bpm === b.bpm &&
  a.beats === b.beats &&
  a.subdivision === b.subdivision &&
  a.volume === b.volume &&
  a.timbre === b.timbre &&
  a.accent === b.accent &&
  a.countdown === b.countdown;

/** 一次打点的间隔 (毫秒): 速度决定拍长, 细分再把拍长等分 */
export const tickIntervalMs = (bpm: unknown, subdivision: unknown): number =>
  (60000 / clampBpm(bpm)) / clampSubdivision(subdivision);

/** 一次打点的间隔 (秒) —— Web Audio 调度用 */
export const tickIntervalSec = (bpm: unknown, subdivision: unknown): number =>
  tickIntervalMs(bpm, subdivision) / 1000;

/** 打点类型: 预排拍 (倒计时) / 首拍重音 / 普通拍 / 细分 */
export type BeatKind = 'prep' | 'accent' | 'beat' | 'sub';

/** 某次打点在曲谱中的位置 (index 从 0 开始) */
export interface BeatInfo {
  /** 第几小节 (从 0 开始) */
  bar: number;
  /** 小节内第几拍 (从 0 开始) */
  beat: number;
  /** 拍内第几个细分 (0 = 正拍) */
  sub: number;
  kind: BeatKind;
}

/**
 * 依据第 index 次打点计算它属于第几小节第几拍
 * prepBeats > 0 时, 前 prepBeats 次打点是「预排拍」(bar = -1, kind = prep), 之后从第 1 小节开始算
 */
export const beatInfoAt = (
  index: unknown,
  beats: unknown,
  subdivision: unknown,
  accent = true,
  prepBeats = 0
): BeatInfo => {
  const b = clampBeats(beats);
  const s = clampSubdivision(subdivision);
  const n = toNum(index);
  const i = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  const pp = toNum(prepBeats);
  const prep = Number.isFinite(pp) ? Math.max(0, Math.floor(pp)) : 0;
  if (i < prep) return { bar: -1, beat: i, sub: 0, kind: 'prep' };
  const perBar = b * s;
  const bar = Math.floor((i - prep) / perBar);
  const inBar = (i - prep) % perBar;
  const beat = Math.floor(inBar / s);
  const sub = inBar % s;
  const kind: BeatKind = sub > 0 ? 'sub' : accent && beat === 0 ? 'accent' : 'beat';
  return { bar, beat, sub, kind };
};

/** 已完整播放的小节数 (当前正在播放的小节不算) */
export const barsPlayed = (tickCount: unknown, beats: unknown, subdivision: unknown): number =>
  beatInfoAt(tickCount, beats, subdivision).bar;

/** 当前速度对应的术语 (如 90 -> Andante) */
export const tempoTerm = (bpm: unknown): string => {
  const v = clampBpm(bpm);
  const hit = TEMPO_TERMS.find((t) => v <= t.max);
  return hit ? hit.label : TEMPO_TERMS[TEMPO_TERMS.length - 1].label;
};

/**
 * 连击测速: 传入历史点击时间戳 (ms) 与本次点击时间
 * - 与上次间隔超过 TAP_RESET_MS 视为重新开始; 最多保留 TAP_MAX_SAMPLES 次
 * - 样本不足 2 次时 bpm 为 null
 */
export const tapTempo = (
  taps: readonly number[],
  now: number,
  options?: { maxSamples?: number; resetMs?: number }
): { taps: number[]; bpm: number | null } => {
  const maxSamples = Math.max(2, options?.maxSamples ?? TAP_MAX_SAMPLES);
  const resetMs = options?.resetMs ?? TAP_RESET_MS;
  const t = toNum(now);
  const history = taps.filter((x) => Number.isFinite(x));
  if (!Number.isFinite(t)) return { taps: history, bpm: null };
  const last = history[history.length - 1];
  const base = last !== undefined && t - last > resetMs ? [] : history;
  const next = [ ...base, t ].slice(-maxSamples);
  if (next.length < 2) return { taps: next, bpm: null };
  const span = next[next.length - 1] - next[0];
  if (span <= 0) return { taps: next, bpm: null };
  const average = 60000 * ((next.length - 1) / span);
  return { taps: next, bpm: clampBpm(average) };
};

/**
 * Web Audio lookahead 调度: 取出 [nextTime, until) 之间需要排期的打点时刻
 * @param nextTime 下一次打点的 AudioContext 时刻 (秒)
 * @param intervalSec 打点间隔 (秒)
 * @param until 排期到哪个时刻为止 (通常是 ctx.currentTime + lookahead)
 * @param limit 单次最多排期数量 (防止极端参数下一口气排满)
 */
export const collectTickTimes = (
  nextTime: number,
  intervalSec: number,
  until: number,
  limit = 64
): { times: number[]; nextTime: number } => {
  const times: number[] = [];
  const step = Math.max(0.001, Number.isFinite(intervalSec) ? intervalSec : 0.5);
  let t = Number.isFinite(nextTime) ? nextTime : 0;
  while (t < until && times.length < limit) {
    times.push(t);
    t += step;
  }
  return { times, nextTime: t };
};

/**
 * 倒计时预备拍的绝对时刻 (AudioContext 秒): 从 startAt 起每秒一下, 共 seconds 下
 * 主拍从 startAt + prepDurationSec(seconds) 开始, 于是最后一下预备拍到第一下正拍正好隔一秒
 */
export const prepClickTimes = (startAt: number, seconds: unknown): number[] => {
  const t0 = Number.isFinite(startAt) ? startAt : 0;
  const n = toNum(seconds);
  const count = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  return Array.from({ length: count }, (_, k) => t0 + k * PREP_INTERVAL_SEC);
};

/** 倒计时总时长 (秒): 每秒一下预备拍, 0 = 关闭 */
export const prepDurationSec = (seconds: unknown): number => {
  const n = toNum(seconds);
  return (Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0) * PREP_INTERVAL_SEC;
};

/** 待闪烁事件 (时间是 AudioContext 时钟) */
export interface FlashEvent {
  time: number;
  kind: BeatKind;
  index: number;
}

/** 拆出已到期 / 未到期的闪烁事件 (顺序保持不变) */
export const dueFlashes = (
  queue: readonly FlashEvent[],
  now: number
): { due: FlashEvent[]; rest: FlashEvent[] } => {
  const due: FlashEvent[] = [];
  const rest: FlashEvent[] = [];
  for (const item of queue) {
    if (item.time <= now) due.push(item);
    else rest.push(item);
  }
  return { due, rest };
};

/** 秒 -> m:ss (超过 1 小时才显示 h:mm:ss) */
export const formatClock = (seconds: number): string => {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

/** 拍内细分点是否处于正拍 (供界面提示) */
export const isMainBeat = (info: BeatInfo): boolean => info.sub === 0;

/** 是否为空格键 (开始 / 停止) */
export const isToggleKey = (e: { key?: string; code?: string } | null | undefined): boolean => {
  if (!e) return false;
  return e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space';
};

/** 键盘事件是否来自输入控件 (此时空格/方向键归控件自己处理) */
export const isTypingTarget = (
  node: { tagName?: string; isContentEditable?: boolean } | null | undefined
): boolean => {
  if (!node) return false;
  const tag = String(node.tagName ?? '').toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable === true;
};

/** 是否为滑块手柄 (方向键归滑块自己处理, 页面快捷键不抢键) */
export const isSliderTarget = (
  node: { getAttribute?: (name: string) => string | null } | null | undefined
): boolean => {
  if (!node || typeof node.getAttribute !== 'function') return false;
  return node.getAttribute('role') === 'slider';
};
