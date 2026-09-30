// 番茄时钟: 纯逻辑 (默认设置校验/存取、时间格式化、阶段轮换)
import {
  AUTONEXT_DEFAULT, BACKGROUND_DEFAULT, BREAK_COLOR_DEFAULT, DEFAULTS_STORAGE_KEY,
  LONG_MIN_DEFAULT, MINUTES_MAX, MINUTES_MIN, NOTIFY_DEFAULT, REPEAT_DEFAULT, REPEAT_MAX,
  REPEAT_MIN, ROUNDS_BEFORE_LONG_DEFAULT, SHORT_MIN_DEFAULT, SOUND_KEYS, VOLUME_DEFAULT,
  VOLUME_MAX, VOLUME_MIN, WORK_COLOR_DEFAULT, WORK_MIN_DEFAULT, type PhaseKey, type SoundKey,
} from './data';

/** 番茄时钟参数 (工具页当前参数与默认设置共用同一结构) */
export interface PomodoroOptions {
  /** 专注时长 (分钟) */
  workMinutes: number;
  /** 短休息时长 (分钟) */
  shortMinutes: number;
  /** 长休息时长 (分钟) */
  longMinutes: number;
  /** 每完成几个专注后进入长休息 */
  roundsBeforeLong: number;
  /** 完成提示音 (custom = 用户指定的音频文件) */
  sound: SoundKey;
  /** 完成时提示音播放次数 (1 ~ 5) */
  repeatCount: number;
  /** 时钟/全屏背景色 (#RRGGBB) */
  background: string;
  /** 专注阶段时间数字颜色 */
  workColor: string;
  /** 休息阶段时间数字颜色 */
  breakColor: string;
  /** 音量 0 ~ 100 */
  volume: number;
  /** 阶段完成时弹系统通知 */
  notify: boolean;
  /** 阶段结束后自动开始下一阶段 */
  autoNext: boolean;
}

export const DEFAULT_OPTIONS: PomodoroOptions = {
  workMinutes: WORK_MIN_DEFAULT,
  shortMinutes: SHORT_MIN_DEFAULT,
  longMinutes: LONG_MIN_DEFAULT,
  roundsBeforeLong: ROUNDS_BEFORE_LONG_DEFAULT,
  sound: 'ding',
  repeatCount: REPEAT_DEFAULT,
  volume: VOLUME_DEFAULT,
  background: BACKGROUND_DEFAULT,
  workColor: WORK_COLOR_DEFAULT,
  breakColor: BREAK_COLOR_DEFAULT,
  notify: NOTIFY_DEFAULT,
  autoNext: AUTONEXT_DEFAULT,
};

/** 任意输入 -> 有限数字 (失败返回 NaN) */
const toNum = (v: unknown): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : Number.NaN;
  if (typeof v === 'string' && v.trim() !== '') return Number(v);
  return Number.NaN;
};

const clampInt = (v: unknown, min: number, max: number, def: number): number => {
  const n = toNum(v);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, Math.round(n)));
};

/** 分钟数: 1 ~ 180 (非法回退默认) */
export const clampMinutes = (v: unknown, def: number): number =>
  clampInt(v, MINUTES_MIN, MINUTES_MAX, def);

/** 轮次: 1 ~ 12 */
export const clampRounds = (v: unknown): number => clampInt(v, 1, 12, ROUNDS_BEFORE_LONG_DEFAULT);

/** 音量: 0 ~ 100 */
export const clampVolume = (v: unknown): number => clampInt(v, VOLUME_MIN, VOLUME_MAX, VOLUME_DEFAULT);

/** 提示音次数: 1 ~ 5 */
export const clampRepeat = (v: unknown): number => clampInt(v, REPEAT_MIN, REPEAT_MAX, REPEAT_DEFAULT);

/** 颜色: 只接受 #RRGGBB (非法回退 fallback) */
export const normalizeHex = (v: unknown, fallback: string): string =>
  typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim() : fallback;

/** 背景色: 只接受 #RRGGBB (非法回退默认黑) */
export const normalizeBackground = (v: unknown): string => normalizeHex(v, BACKGROUND_DEFAULT);

/** 音色: 只接受已知 key */
export const normalizeSound = (v: unknown): SoundKey =>
  SOUND_KEYS.includes(v as SoundKey) ? (v as SoundKey) : DEFAULT_OPTIONS.sound;

/** 任意输入 -> 完整合法参数 */
export const normalizeOptions = (raw?: Partial<PomodoroOptions> | null): PomodoroOptions => ({
  workMinutes: clampMinutes(raw?.workMinutes, WORK_MIN_DEFAULT),
  shortMinutes: clampMinutes(raw?.shortMinutes, SHORT_MIN_DEFAULT),
  longMinutes: clampMinutes(raw?.longMinutes, LONG_MIN_DEFAULT),
  roundsBeforeLong: clampRounds(raw?.roundsBeforeLong),
  sound: normalizeSound(raw?.sound),
  repeatCount: clampRepeat(raw?.repeatCount),
  volume: clampVolume(raw?.volume),
  background: normalizeBackground(raw?.background),
  workColor: normalizeHex(raw?.workColor, WORK_COLOR_DEFAULT),
  breakColor: normalizeHex(raw?.breakColor, BREAK_COLOR_DEFAULT),
  notify: raw?.notify === undefined ? DEFAULT_OPTIONS.notify : raw.notify === true,
  autoNext: raw?.autoNext === undefined ? DEFAULT_OPTIONS.autoNext : raw.autoNext === true,
});

/** 读取默认设置 (无配置 / 损坏 / 隐私模式均回退内置默认) */
export const getDefaultOptions = (): PomodoroOptions => {
  try {
    const raw = localStorage.getItem(DEFAULTS_STORAGE_KEY);
    return raw ? normalizeOptions(JSON.parse(raw) as Partial<PomodoroOptions>) : { ...DEFAULT_OPTIONS };
  } catch {
    return { ...DEFAULT_OPTIONS };
  }
};

/** 写入默认设置 (规整后存储; 返回真正写入的值) */
export const setDefaultOptions = (raw?: Partial<PomodoroOptions> | null): PomodoroOptions => {
  const next = normalizeOptions(raw);
  try {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 隐私模式等写入失败: 忽略 */
  }
  return next;
};

/** 局部更新默认设置 */
export const patchDefaultOptions = (patch: Partial<PomodoroOptions>): PomodoroOptions =>
  setDefaultOptions({ ...getDefaultOptions(), ...patch });

/** 两组参数是否一致 (用于「保存为默认设置」按钮的禁用状态) */
export const isSameOptions = (a: PomodoroOptions, b: PomodoroOptions): boolean =>
  a.workMinutes === b.workMinutes &&
  a.shortMinutes === b.shortMinutes &&
  a.longMinutes === b.longMinutes &&
  a.roundsBeforeLong === b.roundsBeforeLong &&
  a.sound === b.sound &&
  a.repeatCount === b.repeatCount &&
  a.volume === b.volume &&
  a.background === b.background &&
  a.workColor === b.workColor &&
  a.breakColor === b.breakColor &&
  a.notify === b.notify &&
  a.autoNext === b.autoNext;

/** 剩余秒数: 由截止时刻推算 (负数取 0) */
export const remainingOf = (deadlineMs: number, nowMs: number): number => {
  const remain = Math.ceil((toNum(deadlineMs) - toNum(nowMs)) / 1000);
  return Number.isFinite(remain) ? Math.max(0, remain) : 0;
};

/** 秒 -> mm:ss (超过 1 小时则 h:mm:ss) */
export const formatClock = (seconds: number): string => {
  const total = Math.max(0, Math.floor(toNum(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

/** 当前阶段时长 (秒) */
export const phaseSeconds = (phase: PhaseKey, opts: PomodoroOptions): number =>
  (phase === 'focus'
    ? opts.workMinutes
    : phase === 'short'
      ? opts.shortMinutes
      : opts.longMinutes) * 60;

/** 依据完成的专注轮数判断下一个阶段 (达到阈值进入长休, 否则短休) */
export const nextPhaseOf = (current: PhaseKey): PhaseKey => {
  if (current === 'focus') return 'short'; // 是否长休由调用方按 round 决定
  return 'focus';
};

/** 是否该进入长休: 本组专注已完成 roundsBeforeLong 个 */
export const shouldLongBreak = (completedFocusInCycle: number, roundsBeforeLong: number): boolean =>
  completedFocusInCycle >= clampRounds(roundsBeforeLong);

// 供类型引用 (保持导入整洁)
export type { PhaseKey, SoundKey };
