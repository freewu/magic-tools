import {
  DEFAULT_OPTIONS, advance, clampFontSize, clampLineHeight, clampSpeed,
  focusOpacity, formatClock, getDefaultOptions, isSameOptions, isSliderTarget, isToggleKey,
  isTypingTarget, lineCentersOf, lineStepOf, lineUnits, nextSampleScript, normalizeOptions,
  patchDefaultOptions, pickSampleScript, progressOf, remainingSeconds, sampleScriptsOf,
  scrollDistance, setDefaultOptions, splitLineAt, splitScript, sweepOf,
} from './lib';
import {
  DEFAULTS_STORAGE_KEY, FADE_DEFAULT, FOCUS_DEFAULT, FOCUS_MIN_OPACITY, FONT_SIZE_DEFAULT,
  FONT_SIZE_MAX, FONT_SIZE_MIN, LINE_HEIGHT_DEFAULT, LINE_HEIGHT_MAX, LINE_HEIGHT_MIN,
  PAD_RATIO, SAMPLE_SCRIPTS, SPEED_DEFAULT, SPEED_MAX, SPEED_MIN,
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
      speed: 120, fontSize: FONT_SIZE_DEFAULT, lineHeight: LINE_HEIGHT_DEFAULT, fade: false, focus: FOCUS_DEFAULT,
    });
    expect(normalizeOptions({ focus: 'on' }).focus).toBe(FOCUS_DEFAULT);
    expect(normalizeOptions({ focus: false }).focus).toBe(false);
    expect(DEFAULT_OPTIONS.fade).toBe(FADE_DEFAULT);
    expect(DEFAULT_OPTIONS.focus).toBe(FOCUS_DEFAULT);
    expect(DEFAULT_OPTIONS.speed).toBe(SPEED_DEFAULT);
  });
});

describe('默认设置', () => {
  test('无配置时返回内置默认值', () => {
    expect(localStorage.getItem(DEFAULTS_STORAGE_KEY)).toBeNull();
    expect(getDefaultOptions()).toEqual(DEFAULT_OPTIONS);
  });

  test('写入后可读回 (非法规整后再存), 返回落盘内容', () => {
    const saved = setDefaultOptions({ speed: 999, fontSize: 52, lineHeight: 2.04, fade: false, focus: false });
    expect(saved).toEqual({ speed: SPEED_MAX, fontSize: 52, lineHeight: 2, fade: false, focus: false });
    expect(JSON.parse(localStorage.getItem(DEFAULTS_STORAGE_KEY) as string)).toEqual(saved);
    expect(getDefaultOptions()).toEqual(saved);
  });

  test('patchDefaultOptions 只改传入字段, 其余沿用已存值 (无存值时回退内置默认)', () => {
    setDefaultOptions({ speed: 120, fontSize: 52, lineHeight: 2, fade: false, focus: false });
    const after = patchDefaultOptions({ speed: 90 });
    expect(after).toEqual({ speed: 90, fontSize: 52, lineHeight: 2, fade: false, focus: false });
    expect(getDefaultOptions()).toEqual(after);

    localStorage.clear();
    expect(patchDefaultOptions({ fade: false })).toEqual({ ...DEFAULT_OPTIONS, fade: false });
  });

  test('isSameOptions: 规整后逐字段比较 (越界值先被夹取)', () => {
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS })).toBe(true);
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS, speed: SPEED_MAX })).toBe(false);
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS, fade: !DEFAULT_OPTIONS.fade })).toBe(false);
    // 各字段独立比较: 只差一项就不算相同
    const keys = Object.keys(DEFAULT_OPTIONS) as (keyof typeof DEFAULT_OPTIONS)[];
    keys.forEach((k) => {
      const other: Record<string, unknown> = { ...DEFAULT_OPTIONS };
      other[k] = typeof other[k] === 'boolean' ? !other[k] : Number(other[k]) + 1;
      expect(isSameOptions(DEFAULT_OPTIONS, other as unknown as typeof DEFAULT_OPTIONS)).toBe(false);
    });
  });

  test('默认设置内容损坏 / 越界时回退 (不抛异常)', () => {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, '{ not json');
    expect(getDefaultOptions()).toEqual(DEFAULT_OPTIONS);

    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify({ speed: 1, fontSize: 9999, lineHeight: -3 }));
    expect(getDefaultOptions()).toEqual({
      speed: SPEED_MIN, fontSize: FONT_SIZE_MAX, lineHeight: LINE_HEIGHT_MIN, fade: FADE_DEFAULT, focus: FOCUS_DEFAULT,
    });
  });

  test('localStorage 不可用 (隐私模式) 时读写都不抛异常', () => {
    const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    const setSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    expect(getDefaultOptions()).toEqual(DEFAULT_OPTIONS);
    expect(() => setDefaultOptions(DEFAULT_OPTIONS)).not.toThrow();
    expect(() => patchDefaultOptions({ speed: 100 })).not.toThrow();
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

describe('逐行焦点', () => {
  test('focusOpacity: 当前行 1, 越远越淡且单调递减, 最远处收敛到下限', () => {
    expect(focusOpacity(0)).toBe(1);
    expect(focusOpacity(-0)).toBe(1);
    expect(focusOpacity(1)).toBeLessThan(1);
    expect(focusOpacity(2)).toBeLessThan(focusOpacity(1));
    expect(focusOpacity(5)).toBeLessThan(focusOpacity(4));
    expect(focusOpacity(50)).toBeCloseTo(FOCUS_MIN_OPACITY, 6);
    expect(focusOpacity(2)).toBe(focusOpacity(-2)); // 取绝对值, 上下对称
    expect(focusOpacity(0.5)).toBeGreaterThan(focusOpacity(1)); // 连续衰减, 可用于逐帧插值
    expect(focusOpacity(NaN)).toBe(1);
    expect(focusOpacity(undefined as unknown as number)).toBe(1);
  });

  test('lineCentersOf: 取每行的中心线 (折行的高行也居中)', () => {
    expect(lineCentersOf([])).toEqual([]);
    expect(lineCentersOf([{ top: 100, height: 40 }, { top: 140, height: 80 }])).toEqual([ 120, 180 ]);
    // 非法值当 0 处理
    expect(lineCentersOf([{ top: NaN, height: NaN }])).toEqual([ 0 ]);
  });

  test('sweepOf: 阅读线压在哪一行 + 该行已读比例 (越界钳到首/末行)', () => {
    const rects = [ { top: 240, height: 72 }, { top: 312, height: 72 }, { top: 384, height: 72 } ];
    expect(sweepOf([], 0, 168)).toEqual({ index: -1, progress: 0 });
    // 首行还没走到阅读线: 钳在首行, 比例 0 (整行还没开始点亮)
    expect(sweepOf(rects, 0, 168)).toEqual({ index: 0, progress: 0 });
    expect(sweepOf(rects, 72, 168)).toEqual({ index: 0, progress: 0 });
    // 首行正压着阅读线: 比例随滚动线性增长
    expect(sweepOf(rects, 108, 168).index).toBe(0);
    expect(sweepOf(rects, 108, 168).progress).toBeCloseTo(0.5, 6);
    // 比例 1 时正好轮到下一行从 0 开始 (逐字点亮因此无缝衔接)
    expect(sweepOf(rects, 144, 168)).toEqual({ index: 1, progress: 0 });
    expect(sweepOf(rects, 156, 168).progress).toBeCloseTo(0.1667, 3);
    // 越过了最后一行: 钳在末行且比例封顶 1
    expect(sweepOf(rects, 1000, 168)).toEqual({ index: 2, progress: 1 });
    // 非法输入不报错也不越界
    expect(sweepOf(rects, NaN, NaN)).toEqual({ index: 0, progress: 0 });
  });

  test('lineUnits / splitLineAt: 中文逐字、英文整词, 两段拼接后与原文完全一致', () => {
    expect(lineUnits('')).toEqual([]);
    expect(lineUnits('你好 world')).toEqual([ '你', '好', ' ', 'world' ]);
    expect(lineUnits('AES 加解密 v2')).toEqual([ 'AES', ' ', '加', '解', '密', ' ', 'v2' ]);

    const line = '你好 world';
    expect(splitLineAt(line, 0)).toEqual([ '', line ]);
    expect(splitLineAt(line, 1)).toEqual([ line, '' ]);
    expect(splitLineAt(line, 0.5)).toEqual([ '你好', ' world' ]); // 4 个单位点亮 2 个
    expect(splitLineAt('中文', 0.3)).toEqual([ '中', '文' ]);
    expect(splitLineAt('', 0.5)).toEqual([ '', '' ]);
    // 非法进度按 0 / 1 处理
    expect(splitLineAt('abc', NaN)).toEqual([ '', 'abc' ]);
    expect(splitLineAt('abc', 5)).toEqual([ 'abc', '' ]);
    // 任意进度下两段拼接都等于原文 (不丢字、不多字)
    [ 0, 0.13, 0.5, 0.87, 1 ].forEach((p) => {
      const [ head, tail ] = splitLineAt(line, p);
      expect(head + tail).toBe(line);
    });
  });

  test('lineStepOf: 取相邻行中心间距的中位数, 测不到时用兜底值', () => {
    expect(lineStepOf([], 72)).toBe(72);
    expect(lineStepOf([ 0, 0, 0 ], 72)).toBe(72); // 全等 → 无有效间距
    expect(lineStepOf([ 0, 72, 144 ], 72)).toBe(72);
    // 中间夹了一行折行的长行 (144), 中位数忽略它
    expect(lineStepOf([ 0, 72, 216, 288 ], 72)).toBe(72);
    expect(lineStepOf([ 0, 72 ], NaN)).toBe(72);
    expect(lineStepOf([], NaN)).toBe(1);
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
