// 节拍器: 速度范围 / 拍号 / 细分 / 音色 / 配色等常量
// 说明: 数值范围集中在此, 校验与计算逻辑在 lib.ts, 页面只读取这里的常量

/** 速度 (BPM): 20 ~ 300 覆盖从极慢练习到急板 */
export const BPM_MIN = 20;
export const BPM_MAX = 300;
export const BPM_STEP = 1;
export const BPM_DEFAULT = 90;

/** 每小节拍数 (1 ~ 12) */
export const BEATS_MIN = 1;
export const BEATS_MAX = 12;
export const BEATS_DEFAULT = 4;

/** 常用拍号快捷按钮 (标签为 x/y 写法, 左侧数字即每小节拍数) */
export const BEAT_PRESETS: ReadonlyArray<{ beats: number; label: string }> = [
  { beats: 2, label: '2/4' },
  { beats: 3, label: '3/4' },
  { beats: 4, label: '4/4' },
  { beats: 5, label: '5/4' },
  { beats: 6, label: '6/8' },
  { beats: 7, label: '7/8' },
  { beats: 9, label: '9/8' },
  { beats: 12, label: '12/8' },
];

/** 细分: 每拍再打几下 (1 = 不打细分) */
export const SUBDIVISION_OPTIONS: readonly number[] = [ 1, 2, 3, 4 ];
export const SUBDIVISION_DEFAULT = 1;

/** 音量 0 ~ 100 (0 = 静音) */
export const VOLUME_MIN = 0;
export const VOLUME_MAX = 100;
export const VOLUME_DEFAULT = 70;

/** 音色: 全部本地合成, 不加载任何音频文件 */
export type TimbreKey = 'click' | 'beep' | 'wood';
export const TIMBRE_KEYS: readonly TimbreKey[] = [ 'click', 'beep', 'wood' ];
export const TIMBRE_DEFAULT: TimbreKey = 'click';
/** 各音色的波形与衰减时长 (秒): click 最脆, wood 最有共鸣 */
export const TIMBRES: Record<TimbreKey, { type: OscillatorType; decay: number }> = {
  click: { type: 'square', decay: 0.035 },
  beep: { type: 'sine', decay: 0.06 },
  wood: { type: 'triangle', decay: 0.1 },
};

/** 三个重音级别的频率 (Hz): 首拍 / 普通拍 / 细分 */
export const TONE_FREQ = { accent: 1760, beat: 1174, sub: 880 } as const;
/** 三个级别的相对音量 */
export const TONE_GAIN = { accent: 1, beat: 0.66, sub: 0.4 } as const;

/** 单次闪烁时长 (ms) */
export const FLASH_MS = 100;
/** 首拍 / 普通拍 / 细分的闪烁色 */
export const FLASH_COLOR = { accent: '#ff4d4f', beat: '#1677ff', sub: '#8c8c8c' } as const;
/** 舞台配色 (深底: 全屏闪烁时刺眼程度低) */
export const STAGE_BG = '#101114';
export const STAGE_DOT_IDLE = '#2b2f36';

/**
 * 速度术语表 (按上界划分): 展示当前速度所处的快慢档位
 * 标签只给意大利语术语 —— 国际通用, 无需翻译
 */
export const TEMPO_TERMS: ReadonlyArray<{ max: number; label: string }> = [
  { max: 60, label: 'Largo' },
  { max: 76, label: 'Adagio' },
  { max: 108, label: 'Andante' },
  { max: 120, label: 'Moderato' },
  { max: 168, label: 'Allegro' },
  { max: 200, label: 'Presto' },
  { max: Number.POSITIVE_INFINITY, label: 'Prestissimo' },
];

/** 常用速度快捷按钮 */
export const TEMPO_PRESETS: ReadonlyArray<{ label: string; bpm: number }> = [
  { label: 'Largo 50', bpm: 50 },
  { label: 'Adagio 66', bpm: 66 },
  { label: 'Andante 84', bpm: 84 },
  { label: 'Moderato 100', bpm: 100 },
  { label: 'Allegro 132', bpm: 132 },
  { label: 'Presto 180', bpm: 180 },
];

/** 连击测速 (Tap Tempo) */
export const TAP_MAX_SAMPLES = 8; // 最多用最近 8 次点击求平均
export const TAP_RESET_MS = 2500; // 两次点击间隔超过该值视为重新开始

/** 调度参数: 每 25ms 检查一次, 提前 120ms 把打点排进 Web Audio 队列 (官方推荐的 lookahead 方案) */
export const SCHEDULE_INTERVAL_MS = 25;
export const SCHEDULE_AHEAD_SEC = 0.12;
/** 首次发声延迟 (秒): 留一点时间让调度器先跑起来 */
export const START_DELAY_SEC = 0.06;
/** 界面计时刷新间隔 (ms) */
export const CLOCK_INTERVAL_MS = 250;

/** 舞台高度 (非全屏时) */
export const STAGE_HEIGHT = 300;

/** 默认设置 key: 修改入口 设置中心「其它 → 节拍器」, 或工具页「保存为默认设置」 */
export const DEFAULTS_STORAGE_KEY = 'metronome-defaults';
