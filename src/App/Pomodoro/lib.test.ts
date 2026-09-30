import { DEFAULTS_STORAGE_KEY } from './data';
import {
  DEFAULT_OPTIONS, clampMinutes, clampRepeat, clampRounds, clampVolume, formatClock,
  getDefaultOptions, isSameOptions, nextPhaseOf, normalizeOptions, normalizeSound,
  patchDefaultOptions, phaseSeconds, remainingOf, setDefaultOptions, shouldLongBreak,
} from './lib';

describe('番茄时钟 lib', () => {
  beforeEach(() => localStorage.clear());

  test('clamp 系列与音色归一化', () => {
    expect(clampMinutes(25, 25)).toBe(25);
    expect(clampMinutes(0, 25)).toBe(1);
    expect(clampMinutes(999, 25)).toBe(180);
    expect(clampMinutes('abc', 25)).toBe(25);
    expect(clampRounds(4)).toBe(4);
    expect(clampRounds(0)).toBe(1);
    expect(clampRounds(99)).toBe(12);
    expect(clampVolume(-5)).toBe(0);
    expect(clampVolume(200)).toBe(100);
    expect(clampVolume(Number.NaN)).toBe(80);
    expect(normalizeSound('bell')).toBe('bell');
    expect(normalizeSound('xyz')).toBe('ding');
    expect(normalizeSound(null)).toBe('ding');
    expect(clampRepeat(3)).toBe(3);
    expect(clampRepeat(0)).toBe(1);
    expect(clampRepeat(99)).toBe(5);
    expect(clampRepeat('abc')).toBe(1);
  });

  test('normalizeOptions: 缺字段回退默认, 越界夹取', () => {
    expect(normalizeOptions()).toEqual(DEFAULT_OPTIONS);
    expect(normalizeOptions({ workMinutes: 0, shortMinutes: 999, volume: -1, notify: false })).toEqual({
      ...DEFAULT_OPTIONS,
      workMinutes: 1,
      shortMinutes: 180,
      volume: 0,
      notify: false,
    });
    expect(normalizeOptions({ sound: 'custom' }).sound).toBe('custom');
    expect(normalizeOptions({ repeatCount: 9 }).repeatCount).toBe(5);
  });

  test('默认设置: 写入可读回, 损坏回退, patch 局部更新', () => {
    expect(getDefaultOptions()).toEqual(DEFAULT_OPTIONS);
    const saved = setDefaultOptions({ workMinutes: 50, sound: 'bell', autoNext: false });
    expect(saved.workMinutes).toBe(50);
    expect(getDefaultOptions().sound).toBe('bell');
    expect(JSON.parse(localStorage.getItem(DEFAULTS_STORAGE_KEY) as string).autoNext).toBe(false);

    // patch 只改传入字段, 其余沿用已存值
    const out = patchDefaultOptions({ workMinutes: 40 });
    expect(out.workMinutes).toBe(40);
    expect(out.sound).toBe(saved.sound);

    // 存储损坏后回退内置默认
    localStorage.setItem(DEFAULTS_STORAGE_KEY, '{oops');
    expect(getDefaultOptions()).toEqual(DEFAULT_OPTIONS);
    expect(patchDefaultOptions({ workMinutes: 40 }).sound).toBe(DEFAULT_OPTIONS.sound);
  });

  test('isSameOptions 逐字段比较', () => {
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS })).toBe(true);
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS, notify: false })).toBe(false);
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS, volume: 81 })).toBe(false);
  });

  test('remainingOf 按截止时刻推算, 非正/非法视为 0', () => {
    expect(remainingOf(60000, 0)).toBe(60);
    expect(remainingOf(60000, 1000)).toBe(59);
    expect(remainingOf(1000, 5000)).toBe(0);
    expect(remainingOf(Number.NaN, 0)).toBe(0);
  });

  test('formatClock: mm:ss 与 h:mm:ss', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(59)).toBe('00:59');
    expect(formatClock(1500)).toBe('25:00');
    expect(formatClock(3600)).toBe('1:00:00');
    expect(formatClock(3661)).toBe('1:01:01');
  });

  test('phaseSeconds 按阶段返回秒数', () => {
    const opts = DEFAULT_OPTIONS;
    expect(phaseSeconds('focus', opts)).toBe(25 * 60);
    expect(phaseSeconds('short', opts)).toBe(5 * 60);
    expect(phaseSeconds('long', opts)).toBe(15 * 60);
  });

  test('阶段轮换与长休阈值', () => {
    expect(nextPhaseOf('focus')).toBe('short');
    expect(nextPhaseOf('short')).toBe('focus');
    expect(nextPhaseOf('long')).toBe('focus');
    expect(shouldLongBreak(4, 4)).toBe(true);
    expect(shouldLongBreak(3, 4)).toBe(false);
    expect(shouldLongBreak(9, 4)).toBe(true);
  });
});
