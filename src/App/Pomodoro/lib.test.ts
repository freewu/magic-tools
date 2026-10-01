import { DEFAULTS_STORAGE_KEY } from './data';
import {
  DEFAULT_OPTIONS, bgImageOf, clampBlur, clampDim, clampMinutes, clampRepeat, clampRounds,
  clampVolume, formatClock, getDefaultOptions, isSameOptions, nextPhaseOf, normalizeBackground,
  normalizeBgMode, normalizeHex, normalizeImageUrl, normalizeOptions, normalizeSound,
  patchDefaultOptions, phaseSeconds, remainingOf, setDefaultOptions, shouldLongBreak,
  trySetDefaultOptions,
  isToggleKey, isTypingTarget,
} from './lib';

const IMG = 'data:image/jpeg;base64,AAAA';
const IMG2 = 'data:image/png;base64,BBBB';

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
    expect(normalizeOptions({ background: '#123abc' }).background).toBe('#123abc');
    expect(normalizeOptions({ background: 'red' }).background).toBe('#000000');
    expect(normalizeOptions({ workColor: '#ff0000' }).workColor).toBe('#ff0000');
    expect(normalizeOptions({ workColor: 'bad' }).workColor).toBe('#ffffff');
    expect(normalizeOptions({ breakColor: '#00ff00' }).breakColor).toBe('#00ff00');
    expect(normalizeOptions({ breakColor: '' }).breakColor).toBe('#34d399');
    // 图片背景字段
    expect(normalizeOptions({ bgMode: 'image' }).bgMode).toBe('image');
    expect(normalizeOptions({ bgMode: 'video' as never }).bgMode).toBe('color');
    expect(normalizeOptions({ bgImage: IMG, bgDim: 200, bgBlur: 99, bgSameImage: true })).toEqual({
      ...DEFAULT_OPTIONS,
      bgImage: IMG,
      bgDim: 90,
      bgBlur: 20,
      bgSameImage: true,
    });
  });

  test('背景模式 / 遮罩 / 模糊 / 图片地址归一化', () => {
    expect(normalizeBgMode('image')).toBe('image');
    expect(normalizeBgMode('color')).toBe('color');
    expect(normalizeBgMode(null)).toBe('color');
    expect(clampDim(0)).toBe(0);
    expect(clampDim(120)).toBe(90);
    expect(clampDim('x')).toBe(40);
    expect(clampBlur(-3)).toBe(0);
    expect(clampBlur(50)).toBe(20);
    expect(clampBlur(Number.NaN)).toBe(0);

    expect(normalizeImageUrl(IMG)).toBe(IMG);
    expect(normalizeImageUrl('  data:image/png;base64,AA  ')).toBe('data:image/png;base64,AA');
    expect(normalizeImageUrl('https://a.com/b.png')).toBe('https://a.com/b.png');
    expect(normalizeImageUrl('blob:http://localhost/abc')).toBe('blob:http://localhost/abc');
    // svg 可能内嵌脚本, 不支持; 其它非图片一律归空
    expect(normalizeImageUrl('data:image/svg+xml;base64,AA')).toBe('');
    expect(normalizeImageUrl('javascript:alert(1)')).toBe('');
    expect(normalizeImageUrl('')).toBe('');
    expect(normalizeImageUrl(null)).toBe('');
  });

  test('bgImageOf: 共用一张 / 专注与休息分开', () => {
    const shared = normalizeOptions({ bgSameImage: true, bgImage: IMG, bgFocusImage: IMG2 });
    expect(bgImageOf(shared, 'focus')).toBe(IMG);
    expect(bgImageOf(shared, 'short')).toBe(IMG);
    expect(bgImageOf(shared, 'long')).toBe(IMG);

    const split = normalizeOptions({ bgSameImage: false, bgImage: IMG, bgFocusImage: IMG2, bgBreakImage: '' });
    expect(bgImageOf(split, 'focus')).toBe(IMG2);
    expect(bgImageOf(split, 'short')).toBe('');
    expect(bgImageOf(split, 'long')).toBe('');
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

  test('trySetDefaultOptions: 成功 true / 写入异常 false', () => {
    expect(trySetDefaultOptions({ workMinutes: 30 })).toBe(true);
    expect(getDefaultOptions().workMinutes).toBe(30);

    const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    expect(trySetDefaultOptions({ workMinutes: 31 })).toBe(false);
    spy.mockRestore();
  });

  test('isSameOptions 逐字段比较', () => {
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS })).toBe(true);
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS, notify: false })).toBe(false);
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS, volume: 81 })).toBe(false);
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS, background: '#ff0000' })).toBe(false);
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS, workColor: '#112233' })).toBe(false);
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS, bgMode: 'image' })).toBe(false);
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS, bgImage: IMG })).toBe(false);
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS, bgDim: 50 })).toBe(false);
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS, bgBreakImage: IMG })).toBe(false);
  });

  test('normalizeHex/normalizeBackground 校验', () => {
    expect(normalizeHex('#AbCdEf', '#000')).toBe('#AbCdEf');
    expect(normalizeHex('123456', '#000')).toBe('#000');
    expect(normalizeHex(null, '#fff')).toBe('#fff');
    expect(normalizeBackground('#010203')).toBe('#010203');
    expect(normalizeBackground(123)).toBe('#000000');
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

  test('isToggleKey 识别空格 / 回车; isTypingTarget 识别输入控件', () => {
    expect(isToggleKey({ key: ' ' })).toBe(true);
    expect(isToggleKey({ code: 'Space' })).toBe(true);
    expect(isToggleKey({ key: 'Spacebar' })).toBe(true);
    expect(isToggleKey({ key: 'Enter' })).toBe(true);
    expect(isToggleKey({ key: 'Escape' })).toBe(false);
    expect(isToggleKey(null)).toBe(false);
    expect(isTypingTarget({ tagName: 'input' })).toBe(true);
    expect(isTypingTarget({ tagName: 'TEXTAREA' })).toBe(true);
    expect(isTypingTarget({ tagName: 'div', isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: 'button' })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
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
