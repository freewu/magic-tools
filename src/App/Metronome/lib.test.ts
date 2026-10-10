import { BEATS_DEFAULT, BPM_DEFAULT, COUNTDOWN_DEFAULT, DEFAULTS_STORAGE_KEY, SUBDIVISION_DEFAULT, TIMBRE_DEFAULT, VOLUME_DEFAULT } from './data';
import {
  DEFAULT_OPTIONS,
  barsPlayed,
  beatInfoAt,
  clampBeats,
  clampBpm,
  clampCountdown,
  clampSubdivision,
  clampVolume,
  collectTickTimes,
  dueFlashes,
  formatClock,
  getDefaultOptions,
  isMainBeat,
  isSameOptions,
  isSliderTarget,
  isToggleKey,
  isTypingTarget,
  normalizeOptions,
  normalizeTimbre,
  patchDefaultOptions,
  prepClickTimes,
  prepDurationSec,
  setDefaultOptions,
  tapTempo,
  tempoTerm,
  tickIntervalMs,
  tickIntervalSec,
} from './lib';


beforeEach(() => {
  localStorage.clear();
});

describe('clamp 系列', () => {
  it('速度夹紧到 20 ~ 300 并取整', () => {
    expect(clampBpm(90)).toBe(90);
    expect(clampBpm(10)).toBe(20);
    expect(clampBpm(999)).toBe(300);
    expect(clampBpm(89.6)).toBe(90);
    expect(clampBpm('120')).toBe(120);
  });

  it('速度非法值回退默认', () => {
    expect(clampBpm(undefined)).toBe(BPM_DEFAULT);
    expect(clampBpm(null)).toBe(BPM_DEFAULT);
    expect(clampBpm('abc')).toBe(BPM_DEFAULT);
    expect(clampBpm(Number.NaN)).toBe(BPM_DEFAULT);
    expect(clampBpm(Number.POSITIVE_INFINITY)).toBe(BPM_DEFAULT);
  });

  it('拍数夹紧到 1 ~ 12', () => {
    expect(clampBeats(4)).toBe(4);
    expect(clampBeats(0)).toBe(1);
    expect(clampBeats(100)).toBe(12);
    expect(clampBeats('x')).toBe(BEATS_DEFAULT);
  });

  it('倒计时秒数只取预设档位里最接近的一个', () => {
    expect(clampCountdown(0)).toBe(0);
    expect(clampCountdown(3)).toBe(3);
    expect(clampCountdown(6)).toBe(6);
    expect(clampCountdown(10)).toBe(10);
    expect(clampCountdown(2)).toBe(3); // |2-3|=1 < |2-0|=2 → 3
    expect(clampCountdown(11)).toBe(10);
    expect(clampCountdown(-5)).toBe(0);
    expect(clampCountdown('bad')).toBe(COUNTDOWN_DEFAULT);
    expect(clampCountdown(undefined)).toBe(COUNTDOWN_DEFAULT);
  });

  it('细分只取候选里最接近的值', () => {
    expect(clampSubdivision(1)).toBe(1);
    expect(clampSubdivision(3)).toBe(3);
    expect(clampSubdivision(2.4)).toBe(2);
    expect(clampSubdivision(2.6)).toBe(3);
    expect(clampSubdivision(99)).toBe(4);
    expect(clampSubdivision(0)).toBe(1);
    expect(clampSubdivision('bad')).toBe(SUBDIVISION_DEFAULT);
  });

  it('音量夹紧到 0 ~ 100', () => {
    expect(clampVolume(70)).toBe(70);
    expect(clampVolume(-5)).toBe(0);
    expect(clampVolume(200)).toBe(100);
    expect(clampVolume('nope')).toBe(VOLUME_DEFAULT);
  });

  it('音色只接受已知 key', () => {
    expect(normalizeTimbre('wood')).toBe('wood');
    expect(normalizeTimbre('beep')).toBe('beep');
    expect(normalizeTimbre('triangle')).toBe(TIMBRE_DEFAULT);
    expect(normalizeTimbre(null)).toBe(TIMBRE_DEFAULT);
  });
});

describe('normalizeOptions', () => {
  it('空输入得到全默认值', () => {
    expect(normalizeOptions()).toEqual(DEFAULT_OPTIONS);
    expect(normalizeOptions(null)).toEqual(DEFAULT_OPTIONS);
  });

  it('非法字段逐项回退, 合法字段保留', () => {
    const out = normalizeOptions({ bpm: 500, beats: 0, subdivision: 4, volume: -1, timbre: 'wood', accent: false });
    expect(out).toEqual({ bpm: 300, beats: 1, subdivision: 4, volume: 0, timbre: 'wood', accent: false, countdown: COUNTDOWN_DEFAULT });
    expect(normalizeOptions({ countdown: 2 }).countdown).toBe(3); // 2 不是档位 → 夹到最近的 3
    expect(normalizeOptions({ countdown: 12 }).countdown).toBe(10);
  });

  it('accent 只有显式 true 才为真', () => {
    expect(normalizeOptions({ accent: true }).accent).toBe(true);
    expect(normalizeOptions({ accent: false }).accent).toBe(false);
    expect(normalizeOptions({}).accent).toBe(DEFAULT_OPTIONS.accent);
  });
});

describe('默认设置读写', () => {
  it('未写入时返回默认值', () => {
    expect(getDefaultOptions()).toEqual(DEFAULT_OPTIONS);
  });

  it('写入后读回, 且写入前先归一化', () => {
    const saved = setDefaultOptions({ bpm: 1000, beats: 3, timbre: 'beep', accent: false });
    expect(saved).toEqual({ ...DEFAULT_OPTIONS, bpm: 300, beats: 3, timbre: 'beep', accent: false });
    expect(getDefaultOptions()).toEqual(saved);
    expect(JSON.parse(localStorage.getItem(DEFAULTS_STORAGE_KEY) as string)).toEqual(saved);
  });

  it('存储内容损坏时回退默认', () => {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, '{oops');
    expect(getDefaultOptions()).toEqual(DEFAULT_OPTIONS);
  });

  it('patchDefaultOptions 只改传入字段', () => {
    setDefaultOptions({ bpm: 128, beats: 6, volume: 40 });
    const out = patchDefaultOptions({ volume: 90 });
    expect(out).toEqual({ ...DEFAULT_OPTIONS, bpm: 128, beats: 6, volume: 90 });
    expect(getDefaultOptions().bpm).toBe(128);
  });

  it('isSameOptions 逐字段比较', () => {
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS })).toBe(true);
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS, bpm: 91 })).toBe(false);
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS, accent: false })).toBe(false);
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS, countdown: 4 })).toBe(false);
  });
});

describe('间隔计算', () => {
  it('60 BPM 每拍 1000ms, 细分 2 则 500ms', () => {
    expect(tickIntervalMs(60, 1)).toBe(1000);
    expect(tickIntervalMs(60, 2)).toBe(500);
    expect(tickIntervalMs(60, 4)).toBe(250);
  });

  it('120 BPM 每拍 500ms', () => {
    expect(tickIntervalMs(120, 1)).toBe(500);
    expect(tickIntervalSec(120, 1)).toBeCloseTo(0.5, 6);
  });

  it('非法参数先归一化再计算', () => {
    expect(tickIntervalMs(0, 1)).toBe(3000); // 20 BPM
    expect(tickIntervalMs(1, 9)).toBeCloseTo(60000 / 20 / 4, 6);
  });
});

describe('beatInfoAt', () => {
  it('4/4 不细分: 第 0 次是重音, 第 1~3 次是普通拍, 第 4 次进入下一小节', () => {
    expect(beatInfoAt(0, 4, 1)).toEqual({ bar: 0, beat: 0, sub: 0, kind: 'accent' });
    expect(beatInfoAt(1, 4, 1).kind).toBe('beat');
    expect(beatInfoAt(3, 4, 1)).toEqual({ bar: 0, beat: 3, sub: 0, kind: 'beat' });
    expect(beatInfoAt(4, 4, 1)).toEqual({ bar: 1, beat: 0, sub: 0, kind: 'accent' });
    expect(beatInfoAt(9, 4, 1)).toEqual({ bar: 2, beat: 1, sub: 0, kind: 'beat' });
  });

  it('关闭重音后首拍按普通拍处理', () => {
    expect(beatInfoAt(0, 4, 1, false).kind).toBe('beat');
    expect(beatInfoAt(4, 4, 1, false).kind).toBe('beat');
  });

  it('细分 2 (8 分音符): 奇数位置为 sub', () => {
    expect(beatInfoAt(0, 4, 2).kind).toBe('accent');
    expect(beatInfoAt(1, 4, 2)).toEqual({ bar: 0, beat: 0, sub: 1, kind: 'sub' });
    expect(beatInfoAt(2, 4, 2)).toEqual({ bar: 0, beat: 1, sub: 0, kind: 'beat' });
    expect(beatInfoAt(8, 4, 2)).toEqual({ bar: 1, beat: 0, sub: 0, kind: 'accent' });
  });

  it('3/4 细分 3 (9/8 感觉)', () => {
    expect(beatInfoAt(3, 3, 3)).toEqual({ bar: 0, beat: 1, sub: 0, kind: 'beat' });
    expect(beatInfoAt(4, 3, 3)).toEqual({ bar: 0, beat: 1, sub: 1, kind: 'sub' });
    expect(beatInfoAt(9, 3, 3).bar).toBe(1);
  });

  it('异常输入按 0 处理', () => {
    expect(beatInfoAt(-3, 4, 1).bar).toBe(0);
    expect(beatInfoAt('x', 4, 1)).toEqual({ bar: 0, beat: 0, sub: 0, kind: 'accent' });
    expect(beatInfoAt(2.9, 4, 1).beat).toBe(2);
  });

  it('barsPlayed 与 beatInfoAt 的小节一致', () => {
    expect(barsPlayed(7, 4, 1)).toBe(1);
    expect(barsPlayed(8, 4, 1)).toBe(2);
    expect(barsPlayed(0, 4, 1)).toBe(0);
  });

  it('预排拍 (倒计时): 前 prepBeats 次是 prep (bar = -1), 之后从第 1 小节起算', () => {
    // 2 个预排拍 + 4/4: 第 0/1 次是 prep, 第 2 次是重音起拍, 第 6 次进入第 2 小节
    expect(beatInfoAt(0, 4, 1, true, 2)).toEqual({ bar: -1, beat: 0, sub: 0, kind: 'prep' });
    expect(beatInfoAt(1, 4, 1, true, 2)).toEqual({ bar: -1, beat: 1, sub: 0, kind: 'prep' });
    expect(beatInfoAt(2, 4, 1, true, 2)).toEqual({ bar: 0, beat: 0, sub: 0, kind: 'accent' });
    expect(beatInfoAt(6, 4, 1, true, 2)).toEqual({ bar: 1, beat: 0, sub: 0, kind: 'accent' });
    // 不影响原有行为 (默认 0 个预排拍) 与重音开关
    expect(beatInfoAt(0, 4, 1)).toEqual({ bar: 0, beat: 0, sub: 0, kind: 'accent' });
    expect(beatInfoAt(0, 4, 1, false, 2).kind).toBe('prep');
    expect(beatInfoAt(2, 4, 1, false, 2).kind).toBe('beat');
    // 细分仍生效: 预排拍按整拍处理, 正拍细分正常
    expect(beatInfoAt(3, 4, 2, true, 2)).toEqual({ bar: 0, beat: 0, sub: 1, kind: 'sub' });
    // 非法值按 0 处理
    expect(beatInfoAt(0, 4, 1, true, -3)).toEqual({ bar: 0, beat: 0, sub: 0, kind: 'accent' });
  });

  it('isMainBeat 只对正拍为真', () => {
    expect(isMainBeat(beatInfoAt(0, 4, 2))).toBe(true);
    expect(isMainBeat(beatInfoAt(1, 4, 2))).toBe(false);
  });
});

describe('tempoTerm', () => {
  it('按上界返回意大利语术语', () => {
    expect(tempoTerm(40)).toBe('Largo');
    expect(tempoTerm(60)).toBe('Largo');
    expect(tempoTerm(61)).toBe('Adagio');
    expect(tempoTerm(90)).toBe('Andante');
    expect(tempoTerm(108)).toBe('Andante');
    expect(tempoTerm(120)).toBe('Moderato');
    expect(tempoTerm(140)).toBe('Allegro');
    expect(tempoTerm(180)).toBe('Presto');
    expect(tempoTerm(240)).toBe('Prestissimo');
  });

  it('超范围先夹紧', () => {
    expect(tempoTerm(1)).toBe('Largo');
    expect(tempoTerm(9999)).toBe('Prestissimo');
  });
});

describe('tapTempo', () => {
  it('一次点击无速度', () => {
    expect(tapTempo([], 1000)).toEqual({ taps: [ 1000 ], bpm: null });
  });

  it('稳定点击 500ms 一次得到 120 BPM', () => {
    let taps: number[] = [];
    let bpm: number | null = null;
    for (let i = 0; i < 5; i++) {
      const r = tapTempo(taps, 1000 + i * 500);
      taps = r.taps;
      bpm = r.bpm;
    }
    expect(bpm).toBe(120);
    expect(taps).toHaveLength(5);
  });

  it('间隔超过 resetMs 视为重新开始', () => {
    const first = tapTempo([], 1000);
    const second = tapTempo(first.taps, 1300); // 300ms -> 200 BPM
    const restart = tapTempo(second.taps, 1300 + 3000);
    expect(restart.taps).toEqual([ 4300 ]);
    expect(restart.bpm).toBeNull();
  });

  it('最多保留 maxSamples 个样本', () => {
    let taps: number[] = [];
    for (let i = 0; i < 20; i++) taps = tapTempo(taps, 1000 + i * 500).taps;
    expect(taps).toHaveLength(8);
    expect(taps[taps.length - 1]).toBe(1000 + 19 * 500);
  });

  it('自定义 maxSamples / resetMs 生效', () => {
    const r = tapTempo([ 0, 500, 1000 ], 1500, { maxSamples: 2, resetMs: 2000 });
    expect(r.taps).toEqual([ 1000, 1500 ]);
    expect(r.bpm).toBe(120);
  });

  it('时间戳相同不会算出 Infinity', () => {
    const r = tapTempo([ 1000 ], 1000);
    expect(r.bpm).toBeNull();
  });

  it('结果被夹紧到合法范围', () => {
    // 极快: 10ms 一次 = 6000 BPM -> 夹到上限 300
    expect(tapTempo([ 1000, 1010 ], 1020).bpm).toBe(300);
    // 极慢: 间隔接近重置阈值 (2500ms) -> 24 BPM (仍在区间内, 不做下限夹紧)
    expect(tapTempo([ 12500 ], 15000).bpm).toBe(24);
  });

  it('过滤掉非有限的历史样本', () => {
    const r = tapTempo([ Number.NaN, 1000 ], 1500);
    expect(r.taps).toEqual([ 1000, 1500 ]);
  });
});

describe('倒计时 (按秒)', () => {
  it('prepClickTimes: 从起始时刻起每秒一下, 共 seconds 下', () => {
    expect(prepClickTimes(1, 0)).toEqual([]);
    expect(prepClickTimes(1, 3)).toEqual([ 1, 2, 3 ]);
    expect(prepClickTimes(0.06, 3).map((t) => Number(t.toFixed(2)))).toEqual([ 0.06, 1.06, 2.06 ]);
    expect(prepClickTimes(1, 10)).toHaveLength(10);
  });

  it('prepClickTimes: 非法输入按 0 处理', () => {
    expect(prepClickTimes(Number.NaN, 3)).toEqual([ 0, 1, 2 ]);
    expect(prepClickTimes(1, Number.NaN)).toEqual([]);
    expect(prepClickTimes(1, -2)).toEqual([]);
    expect(prepClickTimes(1, 2.9)).toEqual([ 1, 2 ]); // 取整: 不足 3 秒不打第 3 下
  });

  it('prepDurationSec: 秒数即总时长 (最后一下预备拍与第一下正拍正好隔一秒)', () => {
    expect(prepDurationSec(0)).toBe(0);
    expect(prepDurationSec(3)).toBe(3);
    expect(prepDurationSec(2.9)).toBe(2);
    expect(prepDurationSec('bad')).toBe(0);
    expect(prepDurationSec(-1)).toBe(0);
  });
});

describe('collectTickTimes', () => {
  it('取出区间内的时刻并返回下一次的起点', () => {
    const r = collectTickTimes(1, 0.5, 2.6);
    expect(r.times).toEqual([ 1, 1.5, 2, 2.5 ]);
    expect(r.nextTime).toBe(3);
  });

  it('区间为空时不产出', () => {
    const r = collectTickTimes(5, 0.5, 5);
    expect(r.times).toEqual([]);
    expect(r.nextTime).toBe(5);
  });

  it('limit 限制单次数量', () => {
    const r = collectTickTimes(0, 0.001, 100, 10);
    expect(r.times).toHaveLength(10);
  });

  it('异常参数回退安全值', () => {
    const r = collectTickTimes(Number.NaN, Number.NaN, 1);
    expect(r.times[0]).toBe(0);
    expect(r.times).toEqual([ 0, 0.5 ]);
  });
});

describe('dueFlashes', () => {
  const queue = [
    { time: 1, kind: 'accent' as const, index: 0 },
    { time: 2, kind: 'beat' as const, index: 1 },
    { time: 3, kind: 'beat' as const, index: 2 },
  ];

  it('按时间拆成已到期与未到期, 顺序不变', () => {
    const r = dueFlashes(queue, 2);
    expect(r.due.map((x) => x.index)).toEqual([ 0, 1 ]);
    expect(r.rest.map((x) => x.index)).toEqual([ 2 ]);
  });

  it('空队列两边都空', () => {
    expect(dueFlashes([], 5)).toEqual({ due: [], rest: [] });
  });

  it('全部未到期', () => {
    const r = dueFlashes(queue, 0);
    expect(r.due).toHaveLength(0);
    expect(r.rest).toHaveLength(3);
  });

  it('不修改原队列', () => {
    const copy = queue.map((x) => ({ ...x }));
    dueFlashes(queue, 2);
    expect(queue).toEqual(copy);
  });
});

describe('formatClock', () => {
  it('小于 1 小时显示 m:ss', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(5)).toBe('0:05');
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(3599)).toBe('59:59');
  });

  it('超过 1 小时显示 h:mm:ss', () => {
    expect(formatClock(3600)).toBe('1:00:00');
    expect(formatClock(3661)).toBe('1:01:01');
  });

  it('负数与非数字按 0 处理', () => {
    expect(formatClock(-5)).toBe('0:00');
    expect(formatClock(Number.NaN)).toBe('0:00');
  });
});

describe('键盘判定', () => {
  it('空格键 (key / code 两种写法)', () => {
    expect(isToggleKey({ key: ' ' })).toBe(true);
    expect(isToggleKey({ key: 'Spacebar' })).toBe(true);
    expect(isToggleKey({ code: 'Space' })).toBe(true);
    expect(isToggleKey({ key: 'Enter' })).toBe(false);
    expect(isToggleKey(null)).toBe(false);
  });

  it('输入控件识别', () => {
    expect(isTypingTarget({ tagName: 'input' })).toBe(true);
    expect(isTypingTarget({ tagName: 'TEXTAREA' })).toBe(true);
    expect(isTypingTarget({ tagName: 'select' })).toBe(true);
    expect(isTypingTarget({ tagName: 'DIV', isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: 'DIV' })).toBe(false);
    expect(isTypingTarget(undefined)).toBe(false);
  });

  it('滑块手柄识别', () => {
    expect(isSliderTarget({ getAttribute: (n: string) => (n === 'role' ? 'slider' : null) })).toBe(true);
    expect(isSliderTarget({ getAttribute: () => 'button' })).toBe(false);
    expect(isSliderTarget(null)).toBe(false);
  });
});
