import {
  AUDIO_DEFAULT, BITRATE_DEFAULT, DEFAULTS_STORAGE_KEY, FILE_PREFIX_DEFAULT, FPS_DEFAULT,
  MIME_CANDIDATES, SIZE_DEFAULT,
} from './data';
import {
  DEFAULT_OPTIONS,
  clampBitrate,
  clampFps,
  detectSupport,
  estimateBytesPerMinute,
  extensionOf,
  formatBytes,
  formatDuration,
  getDefaultOptions,
  isSameOptions,
  isToggleKey,
  isTypingTarget,
  needsMic,
  normalizeAudio,
  normalizeOptions,
  normalizePrefix,
  normalizeSize,
  patchDefaultOptions,
  pickMimeType,
  recordFileName,
  setDefaultOptions,
  trackInfoOf,
  videoConstraintsOf,
} from './lib';

beforeEach(() => {
  localStorage.clear();
});

describe('参数校验', () => {
  it('帧率取候选里最接近的值', () => {
    expect(clampFps(15)).toBe(15);
    expect(clampFps(30)).toBe(30);
    expect(clampFps(26)).toBe(24);
    expect(clampFps(100)).toBe(60);
    expect(clampFps(1)).toBe(15);
    expect(clampFps(-10)).toBe(FPS_DEFAULT);
    expect(clampFps('abc')).toBe(FPS_DEFAULT);
    expect(clampFps(undefined)).toBe(FPS_DEFAULT);
  });

  it('码率取候选里最接近的值', () => {
    expect(clampBitrate(2_000_000)).toBe(2_000_000);
    expect(clampBitrate(9_000_000)).toBe(8_000_000);
    expect(clampBitrate(99_000_000)).toBe(16_000_000);
    expect(clampBitrate(0)).toBe(BITRATE_DEFAULT);
    expect(clampBitrate(Number.NaN)).toBe(BITRATE_DEFAULT);
    expect(clampBitrate('4000000')).toBe(4_000_000);
    expect(clampBitrate(-1)).toBe(BITRATE_DEFAULT);
  });

  it('声音来源只接受已知取值', () => {
    expect(normalizeAudio('none')).toBe('none');
    expect(normalizeAudio('system')).toBe('system');
    expect(normalizeAudio('both')).toBe('both');
    expect(normalizeAudio('mic')).toBe(AUDIO_DEFAULT);
    expect(normalizeAudio(null)).toBe(AUDIO_DEFAULT);
  });

  it('分辨率只接受已知取值', () => {
    expect(normalizeSize('source')).toBe('source');
    expect(normalizeSize('1080p')).toBe('1080p');
    expect(normalizeSize('4k')).toBe(SIZE_DEFAULT);
    expect(normalizeSize(720)).toBe(SIZE_DEFAULT);
  });

  it('文件名前缀去掉非法字符与首尾空白, 空则回退默认', () => {
    expect(normalizePrefix('demo')).toBe('demo');
    expect(normalizePrefix('  my/demo:v?2  ')).toBe('mydemov2');
    expect(normalizePrefix('')).toBe(FILE_PREFIX_DEFAULT);
    expect(normalizePrefix('   ')).toBe(FILE_PREFIX_DEFAULT);
    expect(normalizePrefix(undefined)).toBe(FILE_PREFIX_DEFAULT);
    expect(normalizePrefix(123)).toBe(FILE_PREFIX_DEFAULT);
    expect(normalizePrefix('x'.repeat(80))).toHaveLength(40);
  });

  it('normalizeOptions 逐项回退', () => {
    expect(normalizeOptions()).toEqual(DEFAULT_OPTIONS);
    expect(normalizeOptions({ fps: 60, bitrate: 16_000_000, audio: 'both', size: '720p', prefix: 'p1' }))
      .toEqual({ fps: 60, bitrate: 16_000_000, audio: 'both', size: '720p', prefix: 'p1' });
    expect(normalizeOptions({ fps: -1, bitrate: -1, audio: 'x' as never, size: 'x' as never, prefix: '' }))
      .toEqual(DEFAULT_OPTIONS);
  });

  it('needsMic 只对「系统声音 + 麦克风」为真', () => {
    expect(needsMic('both')).toBe(true);
    expect(needsMic('system')).toBe(false);
    expect(needsMic('none')).toBe(false);
  });
});

describe('默认设置读写', () => {
  it('未写入时返回默认值', () => {
    expect(getDefaultOptions()).toEqual(DEFAULT_OPTIONS);
  });

  it('写入后读回, 且写入前先归一化', () => {
    const saved = setDefaultOptions({ fps: 24, audio: 'system', prefix: 'a/b' });
    expect(saved).toEqual({ ...DEFAULT_OPTIONS, fps: 24, audio: 'system', prefix: 'ab' });
    expect(getDefaultOptions()).toEqual(saved);
    expect(JSON.parse(localStorage.getItem(DEFAULTS_STORAGE_KEY) as string)).toEqual(saved);
  });

  it('存储内容损坏时回退默认', () => {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, '###');
    expect(getDefaultOptions()).toEqual(DEFAULT_OPTIONS);
  });

  it('patchDefaultOptions 只改传入字段', () => {
    setDefaultOptions({ fps: 60, prefix: 'keep' });
    expect(patchDefaultOptions({ size: '720p' })).toEqual({
      ...DEFAULT_OPTIONS, fps: 60, prefix: 'keep', size: '720p',
    });
  });

  it('isSameOptions 逐字段比较', () => {
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS })).toBe(true);
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS, fps: 60 })).toBe(false);
    expect(isSameOptions(DEFAULT_OPTIONS, { ...DEFAULT_OPTIONS, prefix: 'x' })).toBe(false);
  });
});

describe('能力检测与编码格式', () => {
  it('两者齐备才算支持', () => {
    expect(detectSupport({ getDisplayMedia: () => {}, MediaRecorder: function R() {} }))
      .toEqual({ screen: true, recorder: true, supported: true });
    expect(detectSupport({ getDisplayMedia: () => {}, MediaRecorder: undefined }))
      .toEqual({ screen: true, recorder: false, supported: false });
    expect(detectSupport({ getDisplayMedia: undefined, MediaRecorder: function R() {} }))
      .toEqual({ screen: false, recorder: true, supported: false });
    expect(detectSupport({})).toEqual({ screen: false, recorder: false, supported: false });
  });

  it('真实环境下按 navigator / window 判断 (jsdom 无此能力)', () => {
    expect(detectSupport().supported).toBe(false);
  });

  it('挑选第一个浏览器支持的编码格式', () => {
    expect(pickMimeType(() => true)?.mime).toBe(MIME_CANDIDATES[0].mime);
    expect(pickMimeType((m) => m.includes('vp8'))?.label).toBe('WebM · VP8 + Opus');
    expect(pickMimeType((m) => m.includes('mp4'))?.ext).toBe('mp4');
    expect(pickMimeType(() => false)).toBeNull();
  });

  it('isTypeSupported 抛错时继续尝试下一个', () => {
    const picked = pickMimeType((m) => {
      if (m.includes('vp9')) throw new Error('boom');
      return m.includes('vp8');
    });
    expect(picked?.label).toBe('WebM · VP8 + Opus');
  });

  it('MIME -> 文件后缀', () => {
    expect(extensionOf('video/webm;codecs=vp9,opus')).toBe('webm');
    expect(extensionOf('video/mp4')).toBe('mp4');
    expect(extensionOf('video/x-matroska;codecs=avc1')).toBe('webm');
    expect(extensionOf('')).toBe('webm');
    expect(extensionOf(undefined as unknown as string)).toBe('webm');
  });
});

describe('采集约束', () => {
  it('原始分辨率只限制帧率', () => {
    expect(videoConstraintsOf({ fps: 30, size: 'source' })).toEqual({ frameRate: 30 });
  });

  it('1080p / 720p 按高度限制并推导 16:9 宽度上限', () => {
    expect(videoConstraintsOf({ fps: 60, size: '1080p' })).toEqual({
      frameRate: 60, height: { max: 1080 }, width: { max: 1920 },
    });
    expect(videoConstraintsOf({ fps: 24, size: '720p' })).toEqual({
      frameRate: 24, height: { max: 720 }, width: { max: 1280 },
    });
  });

  it('非法帧率先归一化', () => {
    expect(videoConstraintsOf({ fps: 999, size: 'source' }).frameRate).toBe(60);
  });
});

describe('格式化', () => {
  it('时长 mm:ss / h:mm:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(1500)).toBe('0:01');
    expect(formatDuration(65_000)).toBe('1:05');
    expect(formatDuration(3_661_000)).toBe('1:01:01');
    expect(formatDuration(-100)).toBe('0:00');
    expect(formatDuration(Number.NaN)).toBe('0:00');
  });

  it('文件大小自动换算单位', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.0 GB');
    expect(formatBytes(-5)).toBe('0 B');
  });

  it('每分钟体积按码率估算', () => {
    expect(estimateBytesPerMinute(8_000_000)).toBe(60_000_000);
    expect(estimateBytesPerMinute(2_000_000)).toBe(15_000_000);
    // 非法值先归一化
    expect(estimateBytesPerMinute(Number.NaN)).toBe(60_000_000);
  });

  it('文件名 = 前缀 + 时间戳 + 后缀', () => {
    const date = new Date(2026, 8, 26, 15, 30, 12); // 2026-09-26 15:30:12
    expect(recordFileName('screen-recording', 'webm', date)).toBe('screen-recording-20260926-153012.webm');
    expect(recordFileName('demo', '.mp4', date)).toBe('demo-20260926-153012.mp4');
    expect(recordFileName('bad/name', 'webm', date)).toBe('badname-20260926-153012.webm');
    expect(recordFileName('', '', date)).toBe(`${FILE_PREFIX_DEFAULT}-20260926-153012.webm`);
  });
});

describe('轨道信息', () => {
  it('读取分辨率 / 帧率 / 是否带声音', () => {
    const info = trackInfoOf({
      getVideoTracks: () => [ { getSettings: () => ({ width: 1920, height: 1080, frameRate: 29.97 }) } ],
      getAudioTracks: () => [ {} ],
    });
    expect(info).toEqual({ width: 1920, height: 1080, frameRate: 30, hasAudio: true });
  });

  it('缺设置项 / 缺轨道时按 0 与无声音处理', () => {
    expect(trackInfoOf({ getVideoTracks: () => [ {} ], getAudioTracks: () => [] }))
      .toEqual({ width: 0, height: 0, frameRate: 0, hasAudio: false });
    expect(trackInfoOf({}))
      .toEqual({ width: 0, height: 0, frameRate: 0, hasAudio: false });
  });
});

describe('键盘判定', () => {
  it('空格键', () => {
    expect(isToggleKey({ key: ' ' })).toBe(true);
    expect(isToggleKey({ code: 'Space' })).toBe(true);
    expect(isToggleKey({ key: 'a' })).toBe(false);
    expect(isToggleKey(null)).toBe(false);
  });

  it('输入控件', () => {
    expect(isTypingTarget({ tagName: 'INPUT' })).toBe(true);
    expect(isTypingTarget({ tagName: 'div', isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: 'div' })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});
