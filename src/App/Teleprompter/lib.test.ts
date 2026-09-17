import {
  DEFAULT_OPTIONS, advance, clampFontSize, clampLineHeight, clampSpeed, formatClock,
  getStoredOptions, isSliderTarget, isToggleKey, isTypingTarget, nextSampleScript,
  normalizeOptions, pickSampleScript, progressOf, remainingSeconds, sampleScriptsOf,
  scrollDistance, setStoredOptions, splitScript,
} from './lib';
import {
  FADE_DEFAULT, FONT_SIZE_DEFAULT, FONT_SIZE_MAX, FONT_SIZE_MIN, LINE_HEIGHT_DEFAULT,
  LINE_HEIGHT_MAX, LINE_HEIGHT_MIN, OPTIONS_STORAGE_KEY, PAD_RATIO, SAMPLE_SCRIPTS,
  SPEED_DEFAULT, SPEED_MAX, SPEED_MIN,
} from './data';

beforeEach(() => {
  localStorage.clear();
});

describe('选项校验', () => {
  test('速度 / 字号夹取到范围内并取整, 非法值回退默认', () => {
    expect(clampSpeed(SPEED_MAX + 500)).toBe(SPEED_MAX);
    expect(clampSpeed(SPEED_MIN - 500)).toBe(SPEED_MIN);
    expect(clampSpeed(72.6)).toBe(73);
    expect(clampSpeed('90')).toBe(90);
    expect(clampSpeed('abc')).toBe(SPEED_DEFAULT);
    expect(clampSpeed(undefined)).toBe(SPEED_DEFAULT);
    expect(clampSpeed(NaN)).toBe(SPEED_DEFAULT);

    expect(clampFontSize(10)).toBe(FONT_SIZE_MIN);
    expect(clampFontSize(1000)).toBe(FONT_SIZE_MAX);
    expect(clampFontSize(null)).toBe(FONT_SIZE_DEFAULT);
  });

  test('行距保留一位小数并夹取', () => {
    expect(clampLineHeight(1.234)).toBe(1.2);
    expect(clampLineHeight(2.567)).toBe(2.6);
    expect(clampLineHeight(1)).toBe(LINE_HEIGHT_MIN);
    expect(clampLineHeight(9)).toBe(LINE_HEIGHT_MAX);
    expect(clampLineHeight('')).toBe(LINE_HEIGHT_DEFAULT);
  });

  test('normalizeOptions: 缺字段 / 类型错误 / 非对象都回退默认', () => {
    expect(normalizeOptions(null)).toEqual(DEFAULT_OPTIONS);
    expect(normalizeOptions('nope')).toEqual(DEFAULT_OPTIONS);
    expect(normalizeOptions({ fade: 'yes' })).toEqual(DEFAULT_OPTIONS);
    expect(normalizeOptions({ speed: 120, fade: false })).toEqual({
      speed: 120, fontSize: FONT_SIZE_DEFAULT, lineHeight: LINE_HEIGHT_DEFAULT, fade: false,
    });
    expect(DEFAULT_OPTIONS.fade).toBe(FADE_DEFAULT);
    expect(DEFAULT_OPTIONS.speed).toBe(SPEED_DEFAULT);
  });
});

describe('选项记忆', () => {
  test('无记忆时返回默认值', () => {
    expect(localStorage.getItem(OPTIONS_STORAGE_KEY)).toBeNull();
    expect(getStoredOptions()).toEqual(DEFAULT_OPTIONS);
  });

  test('写入后可读回 (非法规整后再存)', () => {
    setStoredOptions({ speed: 999, fontSize: 52, lineHeight: 2.04, fade: false });
    expect(JSON.parse(localStorage.getItem(OPTIONS_STORAGE_KEY) as string)).toEqual({
      speed: SPEED_MAX, fontSize: 52, lineHeight: 2, fade: false,
    });
    expect(getStoredOptions()).toEqual({ speed: SPEED_MAX, fontSize: 52, lineHeight: 2, fade: false });
  });

  test('记忆内容损坏 / 越界时回退 (不抛异常)', () => {
    localStorage.setItem(OPTIONS_STORAGE_KEY, '{ not json');
    expect(getStoredOptions()).toEqual(DEFAULT_OPTIONS);

    localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify({ speed: 1, fontSize: 9999, lineHeight: -3 }));
    expect(getStoredOptions()).toEqual({
      speed: SPEED_MIN, fontSize: FONT_SIZE_MAX, lineHeight: LINE_HEIGHT_MIN, fade: FADE_DEFAULT,
    });
  });

  test('localStorage 不可用 (隐私模式) 时读写都不抛异常', () => {
    const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    const setSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    expect(getStoredOptions()).toEqual(DEFAULT_OPTIONS);
    expect(() => setStoredOptions(DEFAULT_OPTIONS)).not.toThrow();
    spy.mockRestore();
    setSpy.mockRestore();
  });
});

describe('示例脚本', () => {
  test('按语言分组: 中文简繁各两组, 英文两组, 组内都是完整成篇的稿件', () => {
    expect(sampleScriptsOf('zh-CN')).toEqual(SAMPLE_SCRIPTS['zh-CN']);
    expect(sampleScriptsOf('zh-TW')).toEqual(SAMPLE_SCRIPTS['zh-TW']);
    expect(sampleScriptsOf('en')).toEqual(SAMPLE_SCRIPTS.en);
    // 未知语言回退简体组 (与界面文案回退 zh-CN 一致)
    expect(sampleScriptsOf('fr')).toEqual(SAMPLE_SCRIPTS['zh-CN']);

    Object.values(SAMPLE_SCRIPTS).forEach((group) => {
      expect(group).toHaveLength(2);
      group.forEach((script) => {
        expect(script.split('\n').length).toBeGreaterThan(8); // 至少是成篇的诗/讲稿
        expect(script.trim()).toBe(script);
      });
    });
    // 中文/英文示例不相同, 且简繁两组内容不同 (逐首对照)
    expect(SAMPLE_SCRIPTS['zh-CN'][0]).not.toBe(SAMPLE_SCRIPTS['zh-CN'][1]);
    expect(SAMPLE_SCRIPTS['zh-CN'][0]).not.toBe(SAMPLE_SCRIPTS['zh-TW'][0]);
    expect(SAMPLE_SCRIPTS.en).toContain(SAMPLE_SCRIPTS.en[0]);
  });

  test('pickSampleScript: 按 rand 在组内取一首, 非法 rand 不报错也不返回空', () => {
    const zh = SAMPLE_SCRIPTS['zh-CN'];
    expect(pickSampleScript('zh-CN', 0)).toBe(zh[0]);
    expect(pickSampleScript('zh-CN', 0.4999)).toBe(zh[0]);
    expect(pickSampleScript('zh-CN', 0.5)).toBe(zh[1]);
    expect(pickSampleScript('zh-CN', 0.999)).toBe(zh[1]);
    expect(pickSampleScript('zh-CN', 1)).toBe(zh[1]);
    expect(pickSampleScript('en', 0)).toBe(SAMPLE_SCRIPTS.en[0]);
    expect(pickSampleScript('en', 0.7)).toBe(SAMPLE_SCRIPTS.en[1]);
    expect(pickSampleScript('zh-TW', 0)).toBe(SAMPLE_SCRIPTS['zh-TW'][0]);
    expect(pickSampleScript('zh-CN', NaN)).toBe(zh[0]);
    // 默认参数走 Math.random, 结果必须是组内某一首
    expect(zh).toContain(pickSampleScript('zh-CN'));
  });

  test('nextSampleScript: 换一首与当前不同的, 没有别的可选时返回组内唯一那首', () => {
    const zh = SAMPLE_SCRIPTS['zh-CN'];
    expect(nextSampleScript('zh-CN', zh[0], 0)).toBe(zh[1]);
    expect(nextSampleScript('zh-CN', zh[1], 0)).toBe(zh[0]);
    expect(nextSampleScript('zh-CN', '自己写的稿子', 0)).toBe(zh[0]);
    expect(nextSampleScript('en', SAMPLE_SCRIPTS.en[1], 0.9)).toBe(SAMPLE_SCRIPTS.en[0]);
    expect(zh).toContain(nextSampleScript('zh-CN', '自己写的稿子'));
  });

  test('示例稿切行后每行都不会只剩空白 (可直接逐行渲染)', () => {
    Object.values(SAMPLE_SCRIPTS).forEach((group) => {
      group.forEach((script) => {
        expect(splitScript(script).length).toBeGreaterThan(8);
      });
    });
  });
});

describe('脚本切行', () => {
  test('统一换行符并去掉首尾空行, 中间空行保留', () => {
    expect(splitScript('\n\n第一行\r\n\r\n第二行\n\n')).toEqual([ '第一行', '', '第二行' ]);
    expect(splitScript('   ')).toEqual([]);
    expect(splitScript('')).toEqual([]);
    expect(splitScript('单行')).toEqual([ '单行' ]);
    expect(splitScript('a\n \nb')).toEqual([ 'a', ' ', 'b' ]); // 只 trim 判断空行, 不丢内容
  });
});

describe('滚动数学', () => {
  test('滚动总距离 = 文本高度 + 上下留白 - 视口高度', () => {
    // 视口 400, 上下各留 0.6 * 400 = 240
    expect(scrollDistance(600, 400)).toBe(600 + 2 * PAD_RATIO * 400 - 400);
    // 未测量到视口高度时退化为文本高度
    expect(scrollDistance(600, 0)).toBe(600);
    // 留白(0.6+0.6 视口)高于视口, 所以空内容也会滚过留白差 (480-400), 但不会出现负距离
    expect(scrollDistance(0, 400)).toBe(80);
    expect(scrollDistance(0, 0)).toBe(0);
    expect(scrollDistance(NaN, NaN)).toBe(0);
    expect(scrollDistance(-100, -100)).toBe(0);
  });

  test('advance: 按速度推进, 到结尾置 done 且不越界', () => {
    expect(advance(0, 600, 60, 1000)).toEqual({ offset: 60, done: false });
    expect(advance(0, 600, 60, 500)).toEqual({ offset: 30, done: false });
    expect(advance(590, 600, 60, 1000)).toEqual({ offset: 600, done: true });
    expect(advance(600, 600, 60, 1000)).toEqual({ offset: 600, done: true });
    // 切后台再回来: dt 由调用方限制, 这里只验证非法输入不产生 NaN
    expect(advance(NaN, NaN, NaN, NaN)).toEqual({ offset: 0, done: true });
    expect(advance(-10, 100, 60, 1000).offset).toBe(60);
    expect(advance(0, 100, -60, 1000).offset).toBe(0);
    expect(advance(0, 100, 60, -1000).offset).toBe(0);
  });

  test('progressOf: 0 ~ 1 之间', () => {
    expect(progressOf(0, 600)).toBe(0);
    expect(progressOf(300, 600)).toBeCloseTo(0.5, 6);
    expect(progressOf(900, 600)).toBe(1);
    expect(progressOf(10, 0)).toBe(0);
    expect(progressOf(-5, 600)).toBe(0);
  });

  test('remainingSeconds: 剩余距离 / 速度, 速度为 0 时返回 0', () => {
    expect(remainingSeconds(0, 600, 60)).toBe(10);
    expect(remainingSeconds(300, 600, 60)).toBe(5);
    expect(remainingSeconds(610, 600, 60)).toBe(0);
    expect(remainingSeconds(0, 600, 0)).toBe(0);
    expect(remainingSeconds(0, 600, -30)).toBe(0);
  });

  test('formatClock: 秒 → m:ss', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(9.4)).toBe('0:09');
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(3600)).toBe('60:00');
    expect(formatClock(-3)).toBe('0:00');
    expect(formatClock(NaN)).toBe('0:00');
  });
});

describe('快捷键判定', () => {
  test('isToggleKey: 空格 (含 code 与旧写法)', () => {
    expect(isToggleKey({ key: ' ', code: 'Space' })).toBe(true);
    expect(isToggleKey({ key: 'Spacebar' })).toBe(true);
    expect(isToggleKey({ code: 'Space' })).toBe(true);
    expect(isToggleKey({ key: 'Enter' })).toBe(false);
    expect(isToggleKey(undefined)).toBe(false);
  });

  test('isSliderTarget: 滑块手柄上的方向键归滑块', () => {
    expect(isSliderTarget({ getAttribute: (n: string) => (n === 'role' ? 'slider' : null) })).toBe(true);
    expect(isSliderTarget({ getAttribute: () => 'button' })).toBe(false);
    expect(isSliderTarget(document.createElement('div'))).toBe(false);
    expect(isSliderTarget(document.createElement('textarea'))).toBe(false);
    expect(isSliderTarget(null)).toBe(false);
  });

  test('isTypingTarget: 输入控件内不抢空格', () => {
    expect(isTypingTarget({ tagName: 'TEXTAREA' })).toBe(true);
    expect(isTypingTarget({ tagName: 'input' })).toBe(true);
    expect(isTypingTarget({ tagName: 'SELECT' })).toBe(true);
    expect(isTypingTarget({ tagName: 'DIV', isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: 'DIV' })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget(undefined)).toBe(false);
  });
});
