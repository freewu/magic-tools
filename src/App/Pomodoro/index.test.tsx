import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import Pomodoro from './index';
import { DEFAULTS_STORAGE_KEY, TICK_MS } from './data';
afterEach(() => cleanup());

// 全量跑时并行资源紧张, 放宽本文件超时 (内部含 fake timers 长推进)
jest.setTimeout(60000);

// ---- Web Audio 合成桩: 记录 Oscillator.start 调用 ----
const oscStarts: number[] = [];
class FakeParam { setValueAtTime = jest.fn(); exponentialRampToValueAtTime = jest.fn(); }
class FakeOsc {
  type = 'sine';
  frequency = new FakeParam();
  connect = jest.fn();
  start = jest.fn((t: number) => { oscStarts.push(t); });
  stop = jest.fn();
}
class FakeGain { gain = new FakeParam(); connect = jest.fn(); }
class FakeAudioContext {
  currentTime = 0;
  state = 'running';
  destination = {};
  createOscillator = () => new FakeOsc();
  createGain = () => new FakeGain();
  close = jest.fn(async () => undefined);
}
(window as unknown as { AudioContext?: unknown }).AudioContext = FakeAudioContext;

// ---- 自定义音频 (Audio / objectURL) 桩 ----
const audioPlay = jest.fn(async () => undefined);
(globalThis as unknown as { Audio?: unknown }).Audio = class {
  src = '';
  volume = 1;
  play = audioPlay;
  pause = jest.fn();
};
const createUrl = jest.fn(() => 'blob:mock-audio');
const revokeUrl = jest.fn();

// ---- 系统通知桩 ----
const notifyCalls: Array<[string, string]> = [];
const requestPermission = jest.fn(async () => 'granted');
(globalThis as unknown as { Notification?: unknown }).Notification = class {
  static permission = 'granted';
  static requestPermission = requestPermission;
  constructor(title: string, opts: { body?: string }) {
    notifyCalls.push([ title, opts.body ?? '' ]);
  }
};

beforeEach(() => {
  localStorage.clear();
  oscStarts.length = 0;
  notifyCalls.length = 0;
  audioPlay.mockClear();
  createUrl.mockClear();
  (URL as unknown as { createObjectURL?: () => string }).createObjectURL = createUrl;
  (URL as unknown as { revokeObjectURL?: () => void }).revokeObjectURL = revokeUrl;
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const btn = (name: string): HTMLButtonElement => {
  const target = name.replace(/\s+/g, '');
  const hit = screen.getAllByRole('button').find((b) => (b.textContent ?? '').replace(/\s+/g, '') === target);
  if (!hit) throw new Error(`未找到按钮: ${name}`);
  return hit as HTMLButtonElement;
};
const bigClock = () => Array.from(document.querySelectorAll('div')).find((d) => /^\d{1,2}:\d{2}$/.test(d.textContent ?? '')) as HTMLElement;

/** 推进 TICK 若干次 (模拟真实时钟) */
const advance = async (ms: number) => { await act(async () => { jest.advanceTimersByTime(ms); }); };

describe('番茄时钟 页面', () => {
  test('默认渲染: 专注 25:00, 开始/重置/跳过按钮齐全', () => {
    render(<Pomodoro />);
    expect(screen.getByText('番茄时钟')).toBeInTheDocument();
    expect(bigClock().textContent).toBe('25:00');
    expect(screen.getByText(/专注\s*25\s*分钟/)).toBeInTheDocument();
    expect(btn('开始')).toBeInTheDocument();
    expect(btn('重置')).toBeInTheDocument();
    expect(btn('跳过当前阶段')).toBeInTheDocument();
  });

  test('开始后按截止时刻倒计时, 暂停后剩余冻结', async () => {
    render(<Pomodoro />);
    fireEvent.click(btn('开始'));
    expect(screen.getByText('进行中')).toBeInTheDocument();

    await advance(1000);
    expect(bigClock().textContent).toBe('24:59');
    await advance(60 * 1000);
    expect(bigClock().textContent).toBe('23:59');

    // 暂停: 剩余不再变化
    fireEvent.click(btn('暂停'));
    await advance(10 * 1000);
    expect(bigClock().textContent).toBe('23:59');
  });

  test('修改专注时长后剩余随之更新', async () => {
    render(<Pomodoro />);
    const nums = Array.from(document.querySelectorAll('.ant-input-number input')) as HTMLInputElement[];
    // 顺序: 专注 / 短休 / 长休 / 每几个专注
    fireEvent.change(nums[0], { target: { value: '30' } });
    fireEvent.blur(nums[0]);
    expect(bigClock().textContent).toBe('30:00');
  });

  test('阶段结束: 播放提示音 + 自动进入短休息 (autoNext 默认开)', async () => {
    render(<Pomodoro />);
    // 专注设为 1 分钟方便完成
    const nums = Array.from(document.querySelectorAll('.ant-input-number input')) as HTMLInputElement[];
    fireEvent.change(nums[0], { target: { value: '1' } });
    fireEvent.blur(nums[0]);

    fireEvent.click(btn('开始'));
    await advance(60 * 1000 + TICK_MS * 2); // 1 分钟到点
    // 进入短休: 阶段标签切换, 内置音色通过 Oscillator 播放
    expect(screen.getByText(/短休\s*5\s*分钟/)).toBeInTheDocument();
    expect(oscStarts.length).toBeGreaterThan(0);
    // 自动开始下一阶段 → 进行中
    expect(screen.getByText('进行中')).toBeInTheDocument();
  });

  test('开启弹通知: 阶段完成时调用 Notification; 关闭则不调用', async () => {
    const switches = () => screen.getAllByRole('switch') as HTMLButtonElement[];
    render(<Pomodoro />);
    const nums = Array.from(document.querySelectorAll('.ant-input-number input')) as HTMLInputElement[];
    fireEvent.change(nums[0], { target: { value: '1' } });
    fireEvent.blur(nums[0]);

    fireEvent.click(btn('开始'));
    await advance(60 * 1000 + TICK_MS * 2);
    expect(notifyCalls.length).toBeGreaterThan(0);

    cleanup();
    notifyCalls.length = 0;
    render(<Pomodoro />);
    // 两个开关: [0]=弹通知 [1]=自动开始
    fireEvent.click(switches()[0]); // 关闭通知
    const nums2 = Array.from(document.querySelectorAll('.ant-input-number input')) as HTMLInputElement[];
    fireEvent.change(nums2[0], { target: { value: '1' } });
    fireEvent.blur(nums2[0]);
    fireEvent.click(btn('开始'));
    await advance(60 * 1000 + TICK_MS * 2);
    expect(notifyCalls).toHaveLength(0);
  });

  test('指定自定义音频: 上传文件后完成时用 Audio 播放该文件', async () => {
    render(<Pomodoro />);
    // 选「自定义音频」(Select 第 6 项)
    const select = document.querySelector('.ant-select') as HTMLElement;
    fireEvent.mouseDown(select.querySelector('.ant-select-selector') as HTMLElement);
    const option = Array.from(document.querySelectorAll('.ant-select-item-option')).find((o) => (o.textContent ?? '').includes('自定义'));
    fireEvent.click(option as HTMLElement);

    // 上传音频文件
    const fileInput = document.querySelector('input[type=file]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    fireEvent.change(fileInput, { target: { files: [ new File([ 'x' ], 'my-bell.mp3', { type: 'audio/mpeg' }) ] } });
    expect(screen.getByText('my-bell.mp3')).toBeInTheDocument();

    // 完成阶段 → 用 Audio 播放 blob 地址
    const nums = Array.from(document.querySelectorAll('.ant-input-number input')) as HTMLInputElement[];
    fireEvent.change(nums[0], { target: { value: '1' } });
    fireEvent.blur(nums[0]);
    fireEvent.click(btn('开始'));
    await advance(60 * 1000 + TICK_MS * 2);
    expect(audioPlay).toHaveBeenCalled();
  });

  test('提示次数设为 3: 阶段完成时内置音色重复播放 3 遍', () => {
    render(<Pomodoro />);
    const nums = Array.from(document.querySelectorAll('.ant-input-number input')) as HTMLInputElement[];
    // [工作, 短休, 长休, 每几个专注, 提示次数]
    fireEvent.change(nums[0], { target: { value: '1' } });
    fireEvent.blur(nums[0]);
    fireEvent.change(nums[4], { target: { value: '3' } });
    fireEvent.blur(nums[4]);

    fireEvent.click(btn('开始'));
    advance(60 * 1000 + TICK_MS * 2);
    // 叮 音 2 个音符 × 3 遍 = 6 个 Oscillator
    expect(oscStarts.length).toBe(6);
    // 各遍开始时间错开 (间隔 > 0)
    const sorted = [ ...oscStarts ];
    expect(sorted[2]).toBeGreaterThan(sorted[0]);
  });

  test('手动切换长休息显示 15:00, 重置恢复阶段时长', () => {
    render(<Pomodoro />);
    fireEvent.click(btn('长休息'));
    expect(bigClock().textContent).toBe('15:00');

    fireEvent.click(btn('重置'));
    expect(bigClock().textContent).toBe('15:00');
    fireEvent.click(btn('专注'));
    expect(bigClock().textContent).toBe('25:00');
  });

  test('保存为默认设置: 参数落盘, 重新打开沿用', () => {
    render(<Pomodoro />);
    const nums = Array.from(document.querySelectorAll('.ant-input-number input')) as HTMLInputElement[];
    fireEvent.change(nums[0], { target: { value: '50' } });
    fireEvent.blur(nums[0]);
    fireEvent.click(btn('保存为默认设置'));
    const saved = JSON.parse(localStorage.getItem(DEFAULTS_STORAGE_KEY) as string);
    expect(saved.workMinutes).toBe(50);
    expect(saved.repeatCount).toBe(1);

    cleanup();
    render(<Pomodoro />);
    expect(bigClock().textContent).toBe('50:00');
  });
});

describe('番茄时钟 全屏', () => {
  const fullBtn = () => {
    const hit = screen.getAllByRole('button').find((b) => (b.textContent ?? '').replace(/\s+/g, '') === '全屏');
    if (!hit) throw new Error('未找到全屏按钮');
    return hit as HTMLButtonElement;
  };
  test('无原生全屏时窗口内全屏 (fixed 铺满 + 大时钟), Esc 退出', () => {
    render(<Pomodoro />);
    const stage = () => document.querySelector('.pt-stage-full');
    expect(stage()).toBeNull();
    fireEvent.click(fullBtn());
    expect(stage()).not.toBeNull();
    expect(document.querySelector('.pt-clock-num')?.textContent).toBe('25:00');
    // 时钟字号放大
    expect((document.querySelector('.pt-clock-num') as HTMLElement).style.fontSize).toBe('140px');
    expect(screen.getByRole('button', { name: /退出全屏/ })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.querySelector('.pt-stage-full')).toBeNull();
    expect(fullBtn()).toBeInTheDocument();
  });

  test('支持原生全屏时调用 Fullscreen API', () => {
    const request = jest.fn().mockResolvedValue(undefined);
    const exit = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { configurable: true, value: request });
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => document.querySelector('.pt-stage-full'),
    });
    Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exit });
    try {
      render(<Pomodoro />);
      fireEvent.click(fullBtn());
      expect(request).toHaveBeenCalledTimes(1);
      expect(document.querySelector('.pt-stage-full')).not.toBeNull();
      fireEvent.click(screen.getByRole('button', { name: /退出全屏/ }));
      expect(exit).toHaveBeenCalledTimes(1);
      expect(document.querySelector('.pt-stage-full')).toBeNull();
    } finally {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>).requestFullscreen;
      delete (document as unknown as Record<string, unknown>).fullscreenElement;
      delete (document as unknown as Record<string, unknown>).exitFullscreen;
    }
  });
});
