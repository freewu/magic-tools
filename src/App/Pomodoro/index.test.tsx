import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import Pomodoro from './index';
import { DEFAULTS_STORAGE_KEY, TICK_MS } from './data';

// ---- 背景图处理桩: 跳过真实 canvas 压缩, 用文件名回显可控 dataURL ----
const mockPrepare = jest.fn(async (file: File) => ({ url: `data:image/jpeg;base64,${file.name}`, bytes: 1 }));
jest.mock('./bg', () => ({
  prepareBackgroundImage: (file: File) => mockPrepare(file),
  TOO_LARGE: 'too-large',
}));

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
  mockPrepare.mockReset();
  mockPrepare.mockImplementation(async (file: File) => ({ url: `data:image/jpeg;base64,${file.name}`, bytes: 1 }));
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

/** 按标签文字定位同一行内的 Switch (intros 说明文字里也含同名文字, 因此限定控件归属) */
const ctrlSwitch = (label: string): HTMLElement => {
  const hit = screen.getAllByText(label).find((el) => el.closest('.ant-space')?.querySelector('.ant-switch'));
  if (!hit) throw new Error(`未找到开关: ${label}`);
  return (hit.closest('.ant-space') as HTMLElement).querySelector('.ant-switch') as HTMLElement;
};

/** 按标签文字定位同一行内的 ColorPicker 触发器 (不依赖取色器在页面里的先后顺序) */
const ctrlPicker = (label: string): HTMLElement => {
  const hit = screen.getAllByText(label).find((el) => el.closest('.ant-space')?.querySelector('.ant-color-picker-trigger'));
  if (!hit) throw new Error(`未找到取色器: ${label}`);
  return (hit.closest('.ant-space') as HTMLElement).querySelector('.ant-color-picker-trigger') as HTMLElement;
};

/** 「背景」选择器 (页面里第二个 Select) */
const bgSelect = (): HTMLElement => {
  const hit = Array.from(document.querySelectorAll('.ant-select')).find((s) => /纯色|圖片|图片/.test(s.textContent ?? ''));
  if (!hit) throw new Error('未找到背景模式选择器');
  return hit as HTMLElement;
};

/** 切换背景模式 (纯色 / 图片) */
const chooseBgMode = (label: string) => {
  fireEvent.mouseDown(bgSelect().querySelector('.ant-select-selector') as HTMLElement);
  const opt = Array.from(document.querySelectorAll('.ant-select-item-option')).find((o) => (o.textContent ?? '').trim() === label);
  fireEvent.click(opt as HTMLElement);
};

const bgLayer = () => document.querySelector('.pt-bg') as HTMLElement | null;
const bgLayerStyle = (): CSSStyleDeclaration => (bgLayer() as HTMLElement).style;
/** 唯一的隐藏图片选择框 (三个「选择图片…」按钮共用它) */
const bgInput = () => document.querySelector('input[type=file][accept="image/*"]') as HTMLInputElement;

/** 选一张背景图并等待压缩 Promise 落定 */
const pickBackground = async (name: string, row?: string) => {
  if (row) {
    const line = screen.getByText(row).closest('.ant-space') as HTMLElement;
    fireEvent.click(line.querySelector('button') as HTMLElement);
  }
  await act(async () => {
    fireEvent.change(bgInput(), { target: { files: [ new File([ 'x' ], name, { type: 'image/png' }) ] } });
  });
};

/** 推进 TICK 若干次 (模拟真实时钟) */
const advance = async (ms: number) => { await act(async () => { jest.advanceTimersByTime(ms); }); };

describe('番茄时钟 页面', () => {
  test('默认渲染: 专注 25:00, 背景黑色, 数字默认白/休息绿, 控件齐全', () => {
    render(<Pomodoro />);
    expect(screen.getByText('番茄时钟')).toBeInTheDocument();
    expect(bigClock().textContent).toBe('25:00');
    expect(screen.getByText(/专注\s*25\s*分钟/)).toBeInTheDocument();
    expect(btn('开始')).toBeInTheDocument();
    expect(btn('重置')).toBeInTheDocument();
    expect(btn('跳过当前阶段')).toBeInTheDocument();
    // 时钟舞台默认黑色背景
    const stage = document.querySelector('.pt-stage') as HTMLElement;
    expect(stage).not.toBeNull();
    expect(stage.style.background).toBe('rgb(0, 0, 0)');
    // 专注阶段数字默认为白色
    expect(bigClock().style.color).toBe('rgb(255, 255, 255)');
    // 背景 / 专注颜色 / 休息颜色 三个取色器
    expect(document.querySelectorAll('.ant-color-picker-trigger')).toHaveLength(3);
    // 每个标签旁边就是一个取色器控件 (intros 说明文字里也含同名文字, 因此校验控件归属)
    [ '背景颜色', '专注颜色', '休息颜色' ].forEach((label) => {
      expect(ctrlPicker(label)).toBeTruthy();
    });
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
    fireEvent.click(ctrlSwitch('完成时弹通知')); // 关闭通知
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

  test('休息阶段数字用休息色; 取色器改色后舞台与数字实时更新', () => {
    render(<Pomodoro />);
    // 休息阶段默认薄荷绿
    fireEvent.click(btn('短休息'));
    expect(bigClock().textContent).toBe('05:00');
    expect(bigClock().style.color).toBe('rgb(52, 211, 153)');

    // 三个取色器: 背景颜色 / 专注颜色 / 休息颜色 (按标签定位, 不依赖页面顺序)
    expect(document.querySelectorAll('.ant-color-picker-trigger')).toHaveLength(3);

    // 打开「背景颜色」弹出层, 用十六进制输入框改色
    fireEvent.click(ctrlPicker('背景颜色'));
    const hexWrap = document.querySelector('.ant-color-picker-hex-input') as HTMLElement | null;
    expect(hexWrap).not.toBeNull();
    const hexInput = (hexWrap?.tagName === 'INPUT' ? hexWrap : hexWrap?.querySelector('input')) as HTMLInputElement;
    expect(hexInput).not.toBeNull();
    fireEvent.change(hexInput, { target: { value: '123456' } });
    const stage = document.querySelector('.pt-stage') as HTMLElement;
    expect(stage.style.background).toBe('rgb(18, 52, 86)');
  });

  test('保存默认设置包含背景/配色字段', () => {
    render(<Pomodoro />);
    // 参数与默认一致时按钮禁用, 先改专注时长再保存
    const nums = Array.from(document.querySelectorAll('.ant-input-number input')) as HTMLInputElement[];
    fireEvent.change(nums[0], { target: { value: '26' } });
    fireEvent.blur(nums[0]);
    fireEvent.click(btn('保存为默认设置'));
    const saved = JSON.parse(localStorage.getItem(DEFAULTS_STORAGE_KEY) as string);
    expect(saved.workMinutes).toBe(26);
    expect(saved.background).toBe('#000000');
    expect(saved.workColor).toBe('#ffffff');
    expect(saved.breakColor).toBe('#34d399');
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

  test('背景模式切到图片: 选图后舞台叠加背景图层, 清除后移除', async () => {
    render(<Pomodoro />);
    // 默认纯色模式: 舞台不渲染背景图图层
    expect(bgLayer()).toBeNull();

    chooseBgMode('图片');
    // 图片模式多出「专注/休息同一张」开关; 未选图时仍只有底层纯色
    expect(ctrlSwitch('专注/休息同一张')).toBeInTheDocument();
    expect(bgLayer()).toBeNull();

    await pickBackground('bg1.png');
    expect(bgLayerStyle().backgroundImage).toContain('data:image/jpeg;base64,bg1.png');
    // 遮罩层默认 40% 黑
    expect((document.querySelector('.pt-bg-dim') as HTMLElement).style.background).toContain('0.4');
    // 选到图后按钮变为「更换图片…」并提供「清除」
    expect(btn('更换图片…')).toBeInTheDocument();
    fireEvent.click(btn('清除'));
    expect(bgLayer()).toBeNull();
    expect(btn('选择图片…')).toBeInTheDocument();
  });

  test('专注与休息可分开选图: 关掉「同一张」后各阶段用各自图片', async () => {
    render(<Pomodoro />);
    chooseBgMode('图片');
    await pickBackground('shared.png');
    expect(bgLayerStyle().backgroundImage).toContain('shared.png');

    // 关掉共用: 共用图复制到专注槽, 并出现「休息背景图」行
    fireEvent.click(ctrlSwitch('专注/休息同一张'));
    expect(screen.getByText('休息背景图')).toBeInTheDocument();
    expect(bgLayerStyle().backgroundImage).toContain('shared.png');

    // 给休息单独选一张
    await pickBackground('break.png', '休息背景图');
    expect(bgLayerStyle().backgroundImage).toContain('shared.png');
    // 切到休息阶段 → 换成休息图
    fireEvent.click(btn('短休息'));
    expect(bgLayerStyle().backgroundImage).toContain('break.png');
    // 切回专注 → 仍是专注图
    fireEvent.click(btn('专注'));
    expect(bgLayerStyle().backgroundImage).toContain('shared.png');
  });

  test('遮罩与模糊: 按默认设置渲染 filter/遮罩层, 且全屏同样生效', () => {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify({
      bgMode: 'image',
      bgImage: 'data:image/png;base64,SEED',
      bgDim: 60,
      bgBlur: 8,
    }));
    render(<Pomodoro />);
    expect(bgLayerStyle().filter).toBe('blur(8px)');
    expect(bgLayerStyle().transform).toBe('scale(1.06)');
    expect((document.querySelector('.pt-bg-dim') as HTMLElement).style.background).toContain('0.6');

    fireEvent.click(btn('全屏'));
    expect(document.querySelector('.pt-stage-full .pt-bg')).not.toBeNull();
  });

  test('背景图过大 / 读取失败: 提示错误且不写入背景', async () => {
    render(<Pomodoro />);
    chooseBgMode('图片');

    mockPrepare.mockRejectedValueOnce(new Error('too-large'));
    await pickBackground('huge.png');
    expect(screen.getByText('图片过大, 请换一张或先压缩')).toBeInTheDocument();
    expect(bgLayer()).toBeNull();

    mockPrepare.mockRejectedValueOnce(Object.assign(new Error('decode-failed'), { code: 'decode-failed' }));
    await pickBackground('broken.png');
    expect(screen.getByText('图片读取失败, 请重试')).toBeInTheDocument();
    expect(bgLayer()).toBeNull();

    // 非图片文件直接拒绝, 不进入处理流程
    mockPrepare.mockClear();
    await act(async () => {
      fireEvent.change(bgInput(), { target: { files: [ new File([ 'x' ], 'a.txt', { type: 'text/plain' }) ] } });
    });
    expect(screen.getByText('请选择图片文件…')).toBeInTheDocument();
    expect(mockPrepare).not.toHaveBeenCalled();
  });

  test('图片背景也能存入默认设置并重新打开沿用', async () => {
    render(<Pomodoro />);
    chooseBgMode('图片');
    await pickBackground('bg2.png');
    fireEvent.click(btn('保存为默认设置'));

    const saved = JSON.parse(localStorage.getItem(DEFAULTS_STORAGE_KEY) as string);
    expect(saved.bgMode).toBe('image');
    expect(saved.bgImage).toBe('data:image/jpeg;base64,bg2.png');
    expect(saved.bgDim).toBe(40);

    cleanup();
    render(<Pomodoro />);
    expect(bgLayerStyle().backgroundImage).toContain('bg2.png');
  });

  test('按钮排与阶段页签分两行: 「跳过当前阶段」与「专注」之间有间隔', () => {
    render(<Pomodoro />);
    const rowA = btn('跳过当前阶段').closest('.ant-space') as HTMLElement;
    const rowB = btn('专注').closest('.ant-space') as HTMLElement;
    // 两排不同行 (Space 为 inline-flex, 不包裹会排到同一行)
    expect(rowA).not.toBe(rowB);
    const stack = rowA.parentElement as HTMLElement;
    expect(stack).toBe(rowB.parentElement);
    expect(stack.style.display).toBe('flex');
    expect(stack.style.flexDirection).toBe('column');
    expect(parseInt(stack.style.gap || '0', 10)).toBeGreaterThanOrEqual(12);
  });

  test('控件排版: 「自动开始下一阶段」紧随时长参数, 背景与配色设置单独一排', () => {
    render(<Pomodoro />);
    // 控件包在 <Space size={6}> 里, 该 Space 的父级 ant-space-item 再往上就是那一排
    const rowOf = (label: string): HTMLElement => {
      const hit = screen.getAllByText(label).find((el) => el.closest('.ant-space'));
      if (!hit) throw new Error(`未找到控件: ${label}`);
      const inner = hit.closest('.ant-space') as HTMLElement;
      return inner.parentElement?.closest('.ant-space') as HTMLElement;
    };

    // 第一排: 时长参数 + 每几个专注后长休 + 自动开始下一阶段
    expect(rowOf('自动开始下一阶段')).toBe(rowOf('每几个专注后长休'));
    expect(rowOf('自动开始下一阶段')).toBe(rowOf('专注时长 (分钟)'));

    // 第二排: 提示音 / 音量 / 通知 (不含背景与配色)
    expect(rowOf('完成提示音')).toBe(rowOf('音量'));
    expect(rowOf('完成时弹通知')).toBe(rowOf('完成提示音'));

    // 第三排: 背景设置 + 时间数字配色
    const bgRow = rowOf('背景');
    expect(bgRow).not.toBe(rowOf('完成提示音'));
    expect(rowOf('背景颜色')).toBe(bgRow);
    expect(rowOf('专注颜色')).toBe(bgRow);
    expect(rowOf('休息颜色')).toBe(bgRow);

    // 图片模式下 「同一张」/ 遮罩 / 模糊 也都在第三排
    chooseBgMode('图片');
    expect(rowOf('专注/休息同一张')).toBe(bgRow);
    expect(rowOf('遮罩')).toBe(bgRow);
    expect(rowOf('模糊')).toBe(bgRow);
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
