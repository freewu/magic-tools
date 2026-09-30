// 番茄时钟: 阶段时长范围 / 默认值 / 音色定义 / 配置常量

/** 各阶段默认时长 (分钟) */
export const WORK_MIN_DEFAULT = 25;
export const SHORT_MIN_DEFAULT = 5;
export const LONG_MIN_DEFAULT = 15;
/** 每完成几个「专注 / 工作」后进入长休息 */
export const ROUNDS_BEFORE_LONG_DEFAULT = 4;
/** 可设定的分钟范围 */
export const MINUTES_MIN = 1;
export const MINUTES_MAX = 180;

/** 内置完成提示音 + 自定义音频 (custom = 用户指定播放的音频文件, 仅本地) */
export type SoundKey = 'ding' | 'bell' | 'beep' | 'wood' | 'chime' | 'custom';
export const SOUND_KEYS: readonly SoundKey[] = [ 'ding', 'bell', 'beep', 'wood', 'chime', 'custom' ];

/** 完成时提示音播放次数 (1 ~ 5) */
export const REPEAT_MIN = 1;
export const REPEAT_MAX = 5;
export const REPEAT_DEFAULT = 1;

/** 音量 0 ~ 100 */
export const VOLUME_MIN = 0;
export const VOLUME_MAX = 100;
export const VOLUME_DEFAULT = 80;

/** 是否在阶段完成时弹系统通知 */
export const NOTIFY_DEFAULT = true;
/** 阶段结束后是否自动开始下一阶段 */
export const AUTONEXT_DEFAULT = true;

/** 阶段 key */
export type PhaseKey = 'focus' | 'short' | 'long';
export const PHASE_KEYS: readonly PhaseKey[] = [ 'focus', 'short', 'long' ];

/** 时钟刷新间隔 (ms) */
export const TICK_MS = 250;

/**
 * 内置完成音的合成参数: 每个音符 (at 秒时开始, 持续 dur 秒, 指定波形与相对音量)
 * 全部用 Web Audio 在本机合成, 不加载任何音频文件
 */
export interface ToneNote {
  freq: number;
  at: number;
  dur: number;
  type: OscillatorType;
  gain: number;
}
export const SOUND_PATTERNS: Record<Exclude<SoundKey, 'custom'>, ToneNote[]> = {
  // 叮: 880Hz 长鸣 + 泛音, 收尾干净
  ding: [
    { freq: 880, at: 0, dur: 0.8, type: 'sine', gain: 1 },
    { freq: 1320, at: 0, dur: 0.6, type: 'sine', gain: 0.3 },
  ],
  // 钟声: 三根失谐正弦叠加, 余韵悠长
  bell: [
    { freq: 523, at: 0, dur: 1.4, type: 'sine', gain: 0.7 },
    { freq: 784, at: 0, dur: 1.2, type: 'sine', gain: 0.5 },
    { freq: 1046, at: 0, dur: 1.0, type: 'sine', gain: 0.3 },
  ],
  // 哔-哔-哔: 三连短鸣
  beep: [
    { freq: 880, at: 0, dur: 0.18, type: 'square', gain: 0.5 },
    { freq: 880, at: 0.3, dur: 0.18, type: 'square', gain: 0.5 },
    { freq: 880, at: 0.6, dur: 0.18, type: 'square', gain: 0.5 },
  ],
  // 木鱼: 短促的三角波敲击 (高频强调)
  wood: [
    { freq: 220, at: 0, dur: 0.1, type: 'triangle', gain: 1 },
    { freq: 660, at: 0, dur: 0.08, type: 'triangle', gain: 0.4 },
  ],
  // 风铃: 两个高音错开落下
  chime: [
    { freq: 1568, at: 0, dur: 0.7, type: 'sine', gain: 0.5 },
    { freq: 2093, at: 0.16, dur: 0.9, type: 'sine', gain: 0.45 },
  ],
};

/** 默认设置 key: 修改入口 设置中心「其它 → 番茄时钟」, 或工具页「保存为默认设置」 */
export const DEFAULTS_STORAGE_KEY = 'pomodoro-defaults';
