import {
  buildFileName, checkSize, getDefaultBg, getDefaultFg, getDefaultSize,
  setDefaultBg, setDefaultFg, setDefaultSize,
  PH_DEFAULTS, PH_FORMATS, PH_MAX, PH_MIN,
} from './lib';

describe('占位图片', () => {
  it('默认背景/文字颜色与尺寸', () => {
    localStorage.clear();
    expect(getDefaultBg()).toBe('#e0e0e0');
    expect(getDefaultFg()).toBe('#555555');
    expect(getDefaultSize()).toEqual({ w: 640, h: 480 });
  });

  it('颜色与尺寸持久化', () => {
    localStorage.clear();
    setDefaultBg('#abcdef');
    setDefaultFg('#123456');
    setDefaultSize(320, 240);
    expect(getDefaultBg()).toBe('#abcdef');
    expect(getDefaultFg()).toBe('#123456');
    expect(getDefaultSize()).toEqual({ w: 320, h: 240 });
    localStorage.clear();
    expect(getDefaultBg()).toBe(PH_DEFAULTS.bg);
  });

  it('非法持久化值回退默认', () => {
    localStorage.clear();
    localStorage.setItem('ph:bg', 'red');       // 非 hex
    localStorage.setItem('ph:fg', '#12');       // 长度不对
    localStorage.setItem('ph:width', '99999');  // 超上限
    localStorage.setItem('ph:height', '-5');
    expect(getDefaultBg()).toBe(PH_DEFAULTS.bg);
    expect(getDefaultFg()).toBe(PH_DEFAULTS.fg);
    expect(getDefaultSize()).toEqual({ w: PH_DEFAULTS.w, h: PH_DEFAULTS.h });
    localStorage.clear();
  });

  it('默认文件名 宽x高.格式', () => {
    expect(buildFileName(1280, 720, 'png')).toBe('1280x720.png');
    expect(buildFileName(300, 250, 'jpg')).toBe('300x250.jpg');
    expect(buildFileName(640, 480, 'webp')).toBe('640x480.webp');
  });

  it('格式白名单', () => {
    expect(PH_FORMATS).toEqual([ 'png', 'jpg', 'webp' ]);
  });

  it('checkSize: 合法尺寸通过, 非法/超大抛错', () => {
    expect(() => checkSize(PH_MIN, PH_MIN)).not.toThrow();
    expect(() => checkSize(640, 480)).not.toThrow();
    expect(() => checkSize(PH_MAX, PH_MAX)).toThrow(/过大/); // 超 600 万像素总量
    expect(() => checkSize(0, 10)).toThrow(/宽高/);
    expect(() => checkSize(10.5, 10)).toThrow(/宽高/);
    expect(() => checkSize(PH_MAX + 1, 10)).toThrow(/宽高/);
    expect(() => checkSize(2000, 2000)).not.toThrow();
    expect(() => checkSize(PH_MAX, 2000)).not.toThrow(); // 恰好 600 万像素通过
    expect(() => checkSize(3000, 2001)).toThrow(/过大/);   // 超像素总量
  });
});
