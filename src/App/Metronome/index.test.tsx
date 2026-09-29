import '@testing-library/jest-dom';
import { act, fireEvent, render } from '@testing-library/react';
import Metronome from './index';
import {
  BEATS_DEFAULT, BPM_DEFAULT, DEFAULTS_STORAGE_KEY, FLASH_COLOR, SCHEDULE_INTERVAL_MS, STAGE_BG,
} from './data';
import { COUNTDOWN_DEFAULT } from './data';

/** jsdom 会把内联的 #rrggbb 归一化成 rgb(), 断言时统一用后者 */
const rgb = (hex: string): string => {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};
const ACCENT_RGB = rgb(FLASH_COLOR.accent);
const PREP_RGB = rgb(FLASH_COLOR.prep);
const STAGE_BG_RGB = rgb(STAGE_BG);

// ---- Web Audio 桩: jsdom 没有 AudioContext, 记录每次打点的时刻 ----
const starts: number[] = [];

class FakeParam {
  setValueAtTime = jest.fn();
  exponentialRampToValueAtTime = jest.fn();
}

class FakeOscillator {
  type = 'sine';
  frequency = new FakeParam();
  connect = jest.fn();
  start = jest.fn((t: number) => { starts.push(t); });
  stop = jest.fn();
}

class FakeGain {
  gain = new FakeParam();
  connect = jest.fn();
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];

  currentTime = 0;

  state = 'running';

  destination = {};

  createOscillator = () => new FakeOscillator();

  createGain = () => new FakeGain();

  resume = jest.fn(async () => { this.state = 'running'; });

  close = jest.fn(async () => { this.state = 'closed'; });

  constructor() {
    FakeAudioContext.instances.push(this);
  }
}

const ctxOf = () => FakeAudioContext.instances[FakeAudioContext.instances.length - 1];

/** 舞台 / 圆点 / 拍点 */
const stageOf = (c: HTMLElement) => c.querySelector('.mt-stage') as HTMLElement;
const dotOf = (c: HTMLElement) => c.querySelector('.mt-dot') as HTMLElement;
const beatDotsOf = (c: HTMLElement) => Array.from(c.querySelectorAll('.mt-beat'));
const tempoTextOf = (c: HTMLElement) => (c.querySelector('.mt-stage-tempo') as HTMLElement).textContent ?? '';
const hintTextOf = (c: HTMLElement) => (c.querySelector('.mt-stage-hint') as HTMLElement).textContent ?? '';

/** 按钮: 按可见文案查找 (antd 图标按钮的可访问名含图标名, 故直接比对文本) */
const norm = (s: string) => s.replace(/\s+/g, '');
const btn = (c: HTMLElement, name: string) => {
  const all = Array.from(c.querySelectorAll('button')) as HTMLButtonElement[];
  const hit = all.filter((b) => norm(b.textContent ?? '') === norm(name));
  if (hit.length !== 1) throw new Error(`找不到唯一按钮「${name}」(实际 ${hit.length} 个)`);
  return hit[0];
};
const saveBtn = (c: HTMLElement) => btn(c, '保存为默认设置');

/** 速度一行的按钮顺序: 减 / 加 / 连击测速 */
const bpmButtons = (c: HTMLElement) => {
  const field = c.querySelector('.mt-field') as HTMLElement;
  return Array.from(field.querySelectorAll('button')) as HTMLButtonElement[];
};

/** 让音频时钟与定时器同步前进 (调度器每 SCHEDULE_INTERVAL_MS 跑一次) */
const tickClock = async (ctx: FakeAudioContext, ms: number) => {
  const step = Math.min(SCHEDULE_INTERVAL_MS, ms);
  let left = ms;
  while (left > 0) {
    const delta = Math.min(step, left);
    left -= delta;
    // eslint-disable-next-line no-await-in-loop
    await act(async () => {
      ctx.currentTime += delta / 1000;
      jest.advanceTimersByTime(delta);
    });
  }
};

const startTool = async (c: HTMLElement) => {
  await act(async () => {
    fireEvent.click(btn(c, '开始'));
  });
};

const stopTool = async (c: HTMLElement) => {
  await act(async () => {
    fireEvent.click(btn(c, '停止'));
  });
};

beforeEach(() => {
  localStorage.clear();
  starts.length = 0;
  FakeAudioContext.instances.length = 0;
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-09-26T10:00:00Z'));
  (window as unknown as { AudioContext?: unknown }).AudioContext = FakeAudioContext;
});

afterEach(() => {
  jest.useRealTimers();
});

describe('节拍器 页面', () => {
  it('渲染标题 / 参数 / 舞台与说明', () => {
    const { container } = render(<Metronome />);
    expect(container.querySelector('.ant-card-head-title')?.textContent).toBe('节拍器');
    expect(tempoTextOf(container)).toBe(`${BPM_DEFAULT} BPM · Andante`);
    expect(beatDotsOf(container)).toHaveLength(BEATS_DEFAULT);
    expect(container.querySelector('.intro')).not.toBeNull();
    expect(stageOf(container).style.background).toBe(STAGE_BG_RGB);
    // 未开始时给出提示
    expect(hintTextOf(container)).toContain('点击「开始」后这里会跟着节拍闪烁');
  });

  it('未开始时不创建 AudioContext', () => {
    render(<Metronome />);
    expect(FakeAudioContext.instances).toHaveLength(0);
  });

  it('点击开始后按拍长排期发声, 圆点跟着闪烁', async () => {
    const { container } = render(<Metronome />);
    await startTool(container);
    const ctx = ctxOf();
    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(starts).toHaveLength(1);
    expect(starts[0]).toBeCloseTo(0.06, 6); // START_DELAY_SEC
    // 进入运行态: 按钮变成「停止」
    expect(btn(container, '停止')).toBeInTheDocument();

    // 前进 60ms: 首次打点的闪烁到期 —— 默认带 2 个预排拍, 先闪倒数色
    await act(async () => {
      ctx.currentTime += 0.06;
      jest.advanceTimersByTime(60);
    });
    expect(dotOf(container).className).toContain('mt-dot-prep');
    expect(dotOf(container).style.background).toBe(PREP_RGB);
    expect(hintTextOf(container)).toContain('倒数 2 拍');

    // 预排拍走完 (90 BPM × 2 拍 ≈ 1.33s) 进入正拍: 首拍重音, 显示小节/拍
    await tickClock(ctx, 1500);
    expect(hintTextOf(container)).toMatch(/第 \d+ 小节 · 第 \d+ 拍/);
    expect(starts.length).toBeGreaterThanOrEqual(3);
  });

  it('暂停后不再排期, 已有排期不再发声', async () => {
    const { container } = render(<Metronome />);
    await startTool(container);
    const ctx = ctxOf();
    await tickClock(ctx, 1500);
    const before = starts.length;
    expect(before).toBeGreaterThanOrEqual(2);
    await stopTool(container);
    expect(btn(container, '开始')).toBeInTheDocument();
    await tickClock(ctx, 2000);
    expect(starts).toHaveLength(before);
  });

  it('停止后圆点回到静默态', async () => {
    const { container } = render(<Metronome />);
    await startTool(container);
    const ctx = ctxOf();
    await act(async () => {
      ctx.currentTime += 0.06;
      jest.advanceTimersByTime(60);
    });
    expect(dotOf(container).className).toContain('mt-dot-prep');
    await stopTool(container);
    expect(dotOf(container).className).not.toContain('mt-dot-prep');
    expect(dotOf(container).style.background).not.toBe(PREP_RGB);
  });

  it('点击圆点也能开始 / 停止', async () => {
    const { container } = render(<Metronome />);
    await act(async () => {
      fireEvent.click(dotOf(container));
    });
    expect(btn(container, '停止')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(dotOf(container));
    });
    expect(btn(container, '开始')).toBeInTheDocument();
  });

  it('空格键切换开始 / 停止', async () => {
    const { container } = render(<Metronome />);
    await act(async () => {
      fireEvent.keyDown(document.body, { key: ' ' });
    });
    expect(btn(container, '停止')).toBeInTheDocument();
    await act(async () => {
      fireEvent.keyDown(document.body, { key: ' ' });
    });
    expect(btn(container, '开始')).toBeInTheDocument();
  });
});

describe('节拍器 参数', () => {
  it('加减按钮调整速度并刷新术语', async () => {
    const { container } = render(<Metronome />);
    const [ minus, plus ] = bpmButtons(container);
    await act(async () => { fireEvent.click(plus); });
    expect(tempoTextOf(container)).toBe(`${BPM_DEFAULT + 1} BPM · Andante`);
    await act(async () => { fireEvent.click(minus); });
    expect(tempoTextOf(container)).toBe(`${BPM_DEFAULT} BPM · Andante`);
  });

  it('↑↓ 调速 (Shift 步进 10), 输入框内不抢键', async () => {
    const { container } = render(<Metronome />);
    await act(async () => {
      fireEvent.keyDown(document.body, { key: 'ArrowUp' });
    });
    expect(tempoTextOf(container)).toBe(`${BPM_DEFAULT + 1} BPM · Andante`);
    await act(async () => {
      fireEvent.keyDown(document.body, { key: 'ArrowUp', shiftKey: true });
    });
    expect(tempoTextOf(container)).toBe(`${BPM_DEFAULT + 11} BPM · Andante`);
    await act(async () => {
      fireEvent.keyDown(document.body, { key: 'ArrowDown', shiftKey: true });
    });
    expect(tempoTextOf(container)).toBe(`${BPM_DEFAULT + 1} BPM · Andante`);
    // 输入框内按空格不应触发开始 / 停止 (快捷键让位给控件)
    const input = container.querySelector('.ant-input-number input') as HTMLInputElement;
    expect(input).not.toBeNull();
    await act(async () => {
      fireEvent.keyDown(input, { key: ' ' });
    });
    expect(btn(container, '开始')).toBeInTheDocument();
  });

  it('速度输入超范围值时夹紧到 20 ~ 300', async () => {
    const { container } = render(<Metronome />);
    const input = container.querySelector('.ant-input-number input') as HTMLInputElement;
    // antd v5 的 InputNumber 默认 changeOnBlur, 需要失焦才提交
    await act(async () => {
      fireEvent.change(input, { target: { value: '500' } });
      fireEvent.blur(input);
    });
    expect(tempoTextOf(container)).toBe('300 BPM · Prestissimo');
    await act(async () => {
      fireEvent.change(input, { target: { value: '0' } });
      fireEvent.blur(input);
    });
    expect(tempoTextOf(container)).toBe('20 BPM · Largo');
  });

  it('常用速度快捷按钮直接设值', async () => {
    const { container } = render(<Metronome />);
    await act(async () => { fireEvent.click(btn(container, 'Presto 180')); });
    expect(tempoTextOf(container)).toBe('180 BPM · Presto');
    await act(async () => { fireEvent.click(btn(container, 'Presto 180')); });
    expect(container.querySelector('.mt-stage-tempo')?.textContent).toContain('Presto');
  });

  it('拍号快捷按钮改变拍点数', async () => {
    const { container } = render(<Metronome />);
    expect(beatDotsOf(container)).toHaveLength(BEATS_DEFAULT);
    await act(async () => { fireEvent.click(btn(container, '3/4')); });
    expect(beatDotsOf(container)).toHaveLength(3);
    await act(async () => { fireEvent.click(btn(container, '9/8')); });
    expect(beatDotsOf(container)).toHaveLength(9);
  });

  it('连击测速两次点击得出 BPM 并显示取样数', async () => {
    const { container } = render(<Metronome />);
    const tap = btn(container, '连击测速');
    jest.setSystemTime(1000);
    await act(async () => { fireEvent.click(tap); });
    // 样本不足 2 次: 仍是引导文案, 但已出现「重置」
    expect(container.textContent).toContain('点击此处测速 (至少 2 次)');
    expect(btn(container, '重置')).toBeInTheDocument();
    jest.setSystemTime(1500); // 500ms 一拍 -> 120 BPM
    await act(async () => { fireEvent.click(tap); });
    expect(container.textContent).toContain('已取样 2 次');
    expect(tempoTextOf(container)).toBe('120 BPM · Moderato');
  });

  it('重置连击测速清空取样', async () => {
    const { container } = render(<Metronome />);
    const tap = btn(container, '连击测速');
    jest.setSystemTime(1000);
    await act(async () => { fireEvent.click(tap); });
    jest.setSystemTime(1500);
    await act(async () => { fireEvent.click(tap); });
    await act(async () => { fireEvent.click(btn(container, '重置')); });
    expect(container.textContent).toContain('点击此处测速 (至少 2 次)');
  });

  it('关闭背景闪烁后舞台保持底色', async () => {
    const { container } = render(<Metronome />);
    const switches = Array.from(container.querySelectorAll('.ant-switch')) as HTMLElement[];
    // 顺序: 首拍重音 / 背景闪烁
    expect(switches).toHaveLength(2);
    await act(async () => { fireEvent.click(switches[1]); });
    await startTool(container);
    const ctx = ctxOf();
    await act(async () => {
      ctx.currentTime += 0.06;
      jest.advanceTimersByTime(60);
    });
    expect(dotOf(container).className).toContain('mt-dot-prep');
    expect(dotOf(container).style.background).toBe(PREP_RGB);
    expect(stageOf(container).style.background).toBe(STAGE_BG_RGB);
  });
});

describe('节拍器 全屏与默认设置', () => {
  it('全屏按钮切换舞台 CSS 全屏 (原生全屏不可用时的兜底)', async () => {
    const { container } = render(<Metronome />);
    expect(stageOf(container).className).not.toContain('mt-full');
    await act(async () => { fireEvent.click(btn(container, '全屏')); });
    expect(stageOf(container).className).toContain('mt-full');
    expect(btn(container, '退出全屏')).toBeInTheDocument();
    expect(hintTextOf(container)).toContain('按 Esc 退出全屏');
    await act(async () => { fireEvent.click(btn(container, '退出全屏')); });
    expect(stageOf(container).className).not.toContain('mt-full');
  });

  it('全屏下 Esc 退出 CSS 全屏', async () => {
    const { container } = render(<Metronome />);
    await act(async () => { fireEvent.click(btn(container, '全屏')); });
    expect(stageOf(container).className).toContain('mt-full');
    await act(async () => {
      fireEvent.keyDown(document.body, { key: 'Escape' });
    });
    expect(stageOf(container).className).not.toContain('mt-full');
  });

  it('参数改动后才可保存为默认设置, 保存后按钮重新禁用', async () => {
    const { container } = render(<Metronome />);
    expect(saveBtn(container)).toBeDisabled();
    const [ , plus ] = bpmButtons(container);
    await act(async () => { fireEvent.click(plus); });
    expect(saveBtn(container)).toBeEnabled();
    await act(async () => { fireEvent.click(saveBtn(container)); });
    expect(saveBtn(container)).toBeDisabled();
    expect(JSON.parse(localStorage.getItem(DEFAULTS_STORAGE_KEY) as string)).toMatchObject({
      bpm: BPM_DEFAULT + 1,
    });
  });

  it('按保存的默认设置初始化页面', () => {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify({ bpm: 144, beats: 3, volume: 20 }));
    const { container } = render(<Metronome />);
    expect(tempoTextOf(container)).toBe('144 BPM · Allegro');
    expect(beatDotsOf(container)).toHaveLength(3);
    expect(saveBtn(container)).toBeDisabled();
  });

  it('存储内容损坏时回退内置默认值', () => {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, 'not-json');
    const { container } = render(<Metronome />);
    expect(tempoTextOf(container)).toBe(`${BPM_DEFAULT} BPM · Andante`);
  });
});

describe('节拍器 倒计时 (预排拍)', () => {
  /** 点击倒计时档位 (antd Segmented 需要点内部的 radio) */
  const chooseCountdown = (c: HTMLElement, text: string) => {
    const label = Array.from(c.querySelectorAll('label.ant-segmented-item'))
      .find((el) => (el.textContent ?? '').replace(/\s+/g, '') === text.replace(/\s+/g, ''));
    if (!label) throw new Error(`未找到倒计时档位: ${text}`);
    fireEvent.click(label.querySelector('input') ?? label);
  };

  it('默认 2 个预排拍: 依次倒数 2 → 1, 之后进入正拍', async () => {
    const { container } = render(<Metronome />);
    expect(container.querySelector('.ant-segmented-item-selected')?.textContent?.replace(/\s+/g, '')).toBe('2拍');
    await startTool(container);
    const ctx = ctxOf();

    // 第一下预排拍: 倒数剩 2 拍
    await act(async () => {
      ctx.currentTime += 0.06;
      jest.advanceTimersByTime(60);
    });
    expect(hintTextOf(container)).toContain('倒数 2 拍');

    // 第二下预排拍 (间隔一拍) : 倒数剩 1 拍
    await tickClock(ctx, 700);
    expect(hintTextOf(container)).toContain('倒数 1 拍');

    // 预排拍走完进入正拍
    await tickClock(ctx, 800);
    expect(hintTextOf(container)).toMatch(/第 \d+ 小节 · 第 \d+ 拍/);
  });

  it('关闭倒计时 (countdown: 0) 后开始立即进入正拍', async () => {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify({ countdown: 0 }));
    const { container } = render(<Metronome />);
    await startTool(container);
    const ctx = ctxOf();
    await act(async () => {
      ctx.currentTime += 0.06;
      jest.advanceTimersByTime(60);
    });
    expect(dotOf(container).className).toContain('mt-dot-accent');
    expect(dotOf(container).style.background).toBe(ACCENT_RGB);
    expect(hintTextOf(container)).toContain('第 1 小节 · 第 1 拍');
  });

  it('倒计时档位可切换预排拍数并计入「保存为默认设置」', async () => {
    const { container } = render(<Metronome />);
    // 默认选中 2 拍
    expect(container.querySelector('.ant-segmented-item-selected')?.textContent?.replace(/\s+/g, '')).toBe('2拍');
    // 切换到 4 拍: 与默认不一致 → 可保存
    await act(async () => { chooseCountdown(container, '4 拍'); });
    expect(saveBtn(container)).toBeEnabled();
    await act(async () => { fireEvent.click(saveBtn(container)); });
    expect(JSON.parse(localStorage.getItem(DEFAULTS_STORAGE_KEY) as string)).toMatchObject({ countdown: 4 });
    expect(COUNTDOWN_DEFAULT).toBe(2);
  });
});
