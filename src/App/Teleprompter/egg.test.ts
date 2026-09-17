/** @jest-environment jsdom */
// 彩蛋载荷的健壮性单测: 载荷是 base64 存放后以注入内联 script 方式执行的, 这里只验证"解码 → 执行 → 退出"整条链路可用
import '@testing-library/jest-dom';
import { eggKey, matchesEggKey, startEgg } from './egg';

/** 假的 2D 上下文: 只记录被画出来的字符 */
const fakeCtx = (drawn: string[]) => ({
  font: '',
  textBaseline: '',
  fillStyle: '',
  fillRect: () => undefined,
  fillText: (text: string) => { drawn.push(text); },
}) as unknown as CanvasRenderingContext2D;

const NAMES = [ 'DNS 查询', 'Base64 编解码' ];
const POOL = NAMES.join('');

describe('提词器口令彩蛋', () => {
  let frames: FrameRequestCallback[] = [];
  let caf: jest.Mock;
  /** 虚拟时钟: 载荷按时间推进下落节奏, 每帧固定 200ms (与页面测试一致) */
  let clock = 0;

  beforeEach(() => {
    frames = [];
    clock = 0;
    caf = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.querySelectorAll('.tp-egg-canvas').forEach((el) => el.remove());
  });

  /** 手动推进 n 帧 (载荷自己排下一帧, 与页面共用 requestAnimationFrame) */
  const runFrames = (n: number) => {
    for (let i = 0; i < n; i += 1) {
      const pending = frames;
      frames = [];
      clock += 200;
      pending.forEach((cb) => cb(clock));
    }
  };

  const start = () => startEgg({
    win: window,
    doc: document,
    host: document.body,
    names: NAMES,
    raf: (cb) => { frames.push(cb); return frames.length; },
    caf,
  });

  test('解码后可执行: 雨滴字符全部取自传入的应用名, 退出后画布清除且不再排帧', () => {
    const drawn: string[] = [];
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeCtx(drawn));

    const stop = start();
    const canvas = document.querySelector('.tp-egg-canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas?.getAttribute('aria-hidden')).toBe('true');

    runFrames(3);
    expect(drawn.length).toBeGreaterThan(0);
    expect(drawn.every((ch) => POOL.includes(ch))).toBe(true);

    stop();
    expect(document.querySelector('.tp-egg-canvas')).not.toBeInTheDocument();
    expect(caf).toHaveBeenCalled();
    // 已排队的最后一帧即使被触发也不会再排下一帧
    runFrames(3);
    expect(frames).toHaveLength(0);
    stop(); // 幂等: 重复退出不抛异常
  });

  test('环境没有 2D 上下文时安静退出, 不留画布', () => {
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const stop = start();
    expect(document.querySelector('.tp-egg-canvas')).not.toBeInTheDocument();
    expect(() => stop()).not.toThrow();
  });

  test('环境不允许执行脚本 (解码失败) 时安静退出, 不抛未捕获错误', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    // 让载荷解码失败, 等价于"这段代码无法执行": 应返回一个空退出函数并在控制台留提示
    jest.spyOn(globalThis, 'atob').mockImplementation(() => { throw new Error('blocked'); });
    const stop = start();
    expect(typeof stop).toBe('function');
    expect(() => stop()).not.toThrow();
    expect(warn).toHaveBeenCalled();
    expect(document.querySelector('.tp-egg-canvas')).not.toBeInTheDocument();
  });

  test('载荷以注入内联 script 的方式执行, 执行完不留 script 节点', () => {
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeCtx([]));
    const before = document.querySelectorAll('script').length;
    const stop = start();
    expect(document.querySelectorAll('script').length).toBe(before);
    expect(document.querySelector('.tp-egg-canvas')).toBeInTheDocument();
    stop();
    expect(document.querySelector('.tp-egg-canvas')).not.toBeInTheDocument();
  });

  test('口令识别忽略首尾空白与大小写', () => {
    expect(eggKey()).toHaveLength(8);
    expect(matchesEggKey(eggKey())).toBe(true);
    expect(matchesEggKey(`  ${eggKey().toUpperCase()}  `)).toBe(true);
    expect(matchesEggKey('')).toBe(false);
    expect(matchesEggKey('blue frog')).toBe(false);
    expect(matchesEggKey(undefined as unknown as string)).toBe(false);
  });
});
