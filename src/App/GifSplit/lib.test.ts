import {
  COLS_DEFAULT, COLS_MAX, COLS_MIN, GAP_DEFAULT, GAP_MAX, GAP_MIN, GIF_SPLIT_CHANGED, SPEEDS,
  allFrameIds, clampInt, disposalKey, framePrefix, frameWait, getDefaultCols, getDefaultGap,
  invertIds, nextFrame, parseErrorKey, prevFrame, pruneIds, setDefaultCols, setDefaultGap, sortedIds,
  toCols, toGap, toggleId,
} from './lib';

beforeEach(() => {
  localStorage.clear();
});

describe('gif-split 配置项', () => {
  test('clampInt 取整并夹到区间, 非法值回退', () => {
    expect(clampInt(3.6, 1, 10, 5)).toBe(4);
    expect(clampInt(0, 1, 10, 5)).toBe(1);
    expect(clampInt(99, 1, 10, 5)).toBe(10);
    expect(clampInt(null, 1, 10, 5)).toBe(5);
    expect(clampInt('abc', 1, 10, 5)).toBe(5);
    expect(clampInt('', 1, 10, 5)).toBe(5);
  });

  test('toCols / toGap 使用各自区间与默认值', () => {
    expect(toCols(undefined)).toBe(COLS_DEFAULT);
    expect(toCols(999)).toBe(COLS_MAX);
    expect(toCols(0)).toBe(COLS_MIN);
    expect(toGap(undefined)).toBe(GAP_DEFAULT);
    expect(toGap(999)).toBe(GAP_MAX);
    expect(toGap(2.4)).toBe(2);
  });

  test('默认列数 / 间隔读写与广播', () => {
    const seen: string[] = [];
    const onChange = () => seen.push('changed');
    window.addEventListener(GIF_SPLIT_CHANGED, onChange);

    expect(getDefaultCols()).toBe(COLS_DEFAULT);
    expect(getDefaultGap()).toBe(GAP_DEFAULT);

    setDefaultCols(7);
    setDefaultGap(3);
    expect(localStorage.getItem('gif-split:sprite-cols')).toBe('7');
    expect(localStorage.getItem('gif-split:sprite-gap')).toBe('3');
    expect(getDefaultCols()).toBe(7);
    expect(getDefaultGap()).toBe(3);
    expect(seen).toHaveLength(2);

    // 越界值写入时被规范化
    setDefaultCols(999);
    setDefaultGap(-5);
    expect(getDefaultCols()).toBe(COLS_MAX);
    expect(getDefaultGap()).toBe(GAP_MIN);

    window.removeEventListener(GIF_SPLIT_CHANGED, onChange);
  });

  test('localStorage 抛错时回退默认值', () => {
    const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    expect(getDefaultCols()).toBe(COLS_DEFAULT);
    expect(getDefaultGap()).toBe(GAP_DEFAULT);
    spy.mockRestore();
  });

  test('SPEEDS 档位从小到大且含 1 倍速', () => {
    expect(SPEEDS).toContain(1);
    expect([ ...SPEEDS ]).toEqual([ ...SPEEDS ].sort((a, b) => a - b));
  });
});

describe('帧选择', () => {
  test('allFrameIds', () => {
    expect([ ...allFrameIds(3) ]).toEqual([ 0, 1, 2 ]);
    expect([ ...allFrameIds(0) ]).toEqual([]);
    expect([ ...allFrameIds(-2) ]).toEqual([]);
  });

  test('toggleId 返回新集合, 不改原集合', () => {
    const base = new Set([ 0, 2 ]);
    const added = toggleId(base, 1);
    expect([ ...added ].sort()).toEqual([ 0, 1, 2 ]);
    const removed = toggleId(base, 0);
    expect([ ...removed ]).toEqual([ 2 ]);
    expect([ ...base ]).toEqual([ 0, 2 ]);
  });

  test('invertIds / pruneIds', () => {
    expect([ ...invertIds(new Set([ 1 ]), 3) ].sort()).toEqual([ 0, 2 ]);
    expect([ ...pruneIds(new Set([ 0, 2, 9, -1 ]), 3) ]).toEqual([ 0, 2 ]);
    expect([ ...pruneIds(new Set([ 1.5 ]), 3) ]).toEqual([]);
  });

  test('sortedIds 升序', () => {
    expect(sortedIds(new Set([ 5, 1, 3 ]))).toEqual([ 1, 3, 5 ]);
    expect(sortedIds(new Set())).toEqual([]);
  });
});

describe('命名与文案', () => {
  test('framePrefix 去扩展名与非法字符', () => {
    expect(framePrefix('demo.gif')).toBe('demo');
    expect(framePrefix('a b/c.gif')).toBe('a b_c');
    expect(framePrefix('.gif')).toBe('gif');
    expect(framePrefix('')).toBe('gif');
  });

  test('disposalKey', () => {
    expect(disposalKey(0)).toBe('保留');
    expect(disposalKey(1)).toBe('保留');
    expect(disposalKey(2)).toBe('还原背景');
    expect(disposalKey(3)).toBe('还原上一帧');
    expect(disposalKey(9)).toBe('保留');
  });

  test('parseErrorKey 映射常见错误码, 未知返回空串', () => {
    expect(parseErrorKey('too-many-frames')).toContain('帧数过多');
    expect(parseErrorKey('gif-too-large')).toContain('尺寸过大');
    expect(parseErrorKey('invalid-gif-size')).toBe('不是有效的 GIF 图片');
    expect(parseErrorKey('no-frames')).toContain('没有可用的帧');
    expect(parseErrorKey('boom')).toBe('');
  });
});

describe('播放控制', () => {
  test('nextFrame / prevFrame 循环', () => {
    expect(nextFrame(0, 3)).toBe(1);
    expect(nextFrame(2, 3)).toBe(0);
    expect(prevFrame(0, 3)).toBe(2);
    expect(prevFrame(1, 3)).toBe(0);
    expect(nextFrame(0, 0)).toBe(0);
    expect(prevFrame(5, 0)).toBe(0);
  });

  test('frameWait 按速度缩放并设下限', () => {
    expect(frameWait(100, 1)).toBe(100);
    expect(frameWait(100, 2)).toBe(50);
    expect(frameWait(100, 0.5)).toBe(200);
    expect(frameWait(10, 4)).toBe(20); // 下限
    expect(frameWait(0, 1)).toBe(100); // 非法延时回退
    expect(frameWait(100, 0)).toBe(100); // 非法速度回退
  });
});
