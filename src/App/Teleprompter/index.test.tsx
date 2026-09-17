import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import Teleprompter from './index';
import { OPTIONS_STORAGE_KEY, PAD_RATIO, READ_RATIO, SAMPLE_SCRIPTS } from './data';
import { focusOpacity, splitScript } from './lib';
import { LocaleProvider } from '../../hook/locale-context';

/** 默认语言 (zh-CN) 下打开时随机取到的第一首示例诗 (Mock 里的 Math.random 固定为 0) */
const SAMPLE = SAMPLE_SCRIPTS['zh-CN'][0];
const SAMPLE_LINES = splitScript(SAMPLE).length;

// ---- jsdom 不做排版, clientHeight / offsetHeight / offsetTop 恒为 0, 这里按类名给出稳定尺寸 ----
// 视口 400, 文本 600 → 滚动距离 = 600 + 2 * 0.6 * 400 - 400 = 680
const VIEW_H = 400;
const TEXT_H = 600;
const DISTANCE = 680;
/** 行高 = 字号 40 × 行距 1.8 = 72 (与实际设定的 40px / 1.8 一致) */
const LINE_STEP = 72;
/** 首行顶部 = 轨道上留白 = 视口 × 0.6 */
const LINE_TOP = Math.round(VIEW_H * PAD_RATIO);
/** 阅读基准线 */
const READ_Y = VIEW_H * READ_RATIO;

Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
  configurable: true,
  get() { return this.classList?.contains('tp-view') ? VIEW_H : 0; },
});
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  get() {
    if (this.classList?.contains('tp-text')) return TEXT_H;
    return this.classList?.contains('tp-line') ? LINE_STEP : 0;
  },
});
/** 每行按行高依次排下去 (把轨道上留白算进去, 与真实布局一致) */
Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
  configurable: true,
  get() {
    if (!this.classList?.contains('tp-line')) return 0;
    const siblings = Array.prototype.slice.call(this.parentElement?.children ?? []);
    return LINE_TOP + LINE_STEP * siblings.indexOf(this);
  },
});

// ---- requestAnimationFrame 队列: 手动推进帧, 让滚动位置可预期 ----
// 每帧 200ms 是组件设定的单帧上限, 60px/s 时即每帧 12px; 首帧只记时间不推进
let frames: FrameRequestCallback[] = [];
let now = 0;

beforeEach(() => {
  frames = [];
  now = 0;
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
    frames.push(cb);
    return frames.length;
  });
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  // 示例诗是随机取一首的, 固定 Math.random 以便断言具体文本
  jest.spyOn(Math, 'random').mockReturnValue(0);
  localStorage.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

/** 指定界面语言渲染 (LocaleProvider 从 localStorage('app-locale') 取初始值) */
const renderWithLocale = (locale: string) => {
  localStorage.setItem('app-locale', locale);
  return render(<LocaleProvider><Teleprompter /></LocaleProvider>);
};

/** 推进一帧 (默认 200ms) */
const step = (ms = 200) => {
  now += ms;
  const pending = frames;
  frames = [];
  pending.forEach((cb) => cb(now));
};
/** 推进 n 帧 */
const advanceFrames = (n: number) => act(() => { for (let i = 0; i < n; i += 1) step(); });

/** 按按钮文案定位 (antd 会在两个汉字间插空格, 故比较去掉空白后的文本) */
const btn = (name: string): HTMLButtonElement => {
  const target = name.replace(/\s+/g, '');
  const hit = screen
    .getAllByText((_, el) => (el?.textContent ?? '').replace(/\s+/g, '') === target)
    .map((el) => el.closest('button'))
    .find((b): b is HTMLButtonElement => !!b);
  if (!hit) throw new Error(`未找到按钮: ${name}`);
  return hit;
};
/** 脚本编辑框 */
const scriptArea = () => screen.getByPlaceholderText('在此粘贴或输入提词脚本…') as HTMLTextAreaElement;
/** 脚本编辑框 (不依赖文案, 用于切换语言后定位) */
const scriptAreaAny = () => document.querySelector('textarea') as HTMLTextAreaElement;
/** 舞台 / 滚动层 / 文本块 */
const stage = () => document.querySelector('.tp-stage') as HTMLElement;
const track = () => document.querySelector('.tp-track') as HTMLElement;
const textBlock = () => document.querySelector('.tp-text') as HTMLElement;
/** 滑块手柄的按键事件: rc-slider 读的是 which / keyCode, 单给 key 不会触发 */
const arrowUp = { key: 'ArrowUp', keyCode: 38, which: 38 };
/** 组件注入的舞台样式 (页面里还有 antd 自己的 style, 需按内容查找) */
const stageCss = (): string => {
  const hit = Array.from(document.querySelectorAll('style'))
    .map((el) => el.textContent ?? '')
    .find((text) => text.includes('.tp-stage'));
  if (!hit) throw new Error('未找到舞台样式');
  return hit;
};
/** 标签对应的滑块手柄 (面板里有字号/行距/速度三个滑块) */
const handleOf = (label: string): HTMLElement => {
  // 标签与滑块是同一个 <Space> 里的兄弟节点, 从标签所在的 space-item 往上找到容器再取手柄
  const item = screen.getByText(label).closest('.ant-space-item');
  const handle = item?.parentElement?.querySelector('.ant-slider-handle');
  if (!handle) throw new Error(`未找到滑块: ${label}`);
  return handle as HTMLElement;
};
/** 标签对应的开关 (淡入淡出 / 逐行高亮) */
const switchOf = (label: string): HTMLButtonElement => {
  const item = screen.getByText(label).closest('.ant-space-item');
  const sw = item?.parentElement?.querySelector('button[role="switch"]');
  if (!sw) throw new Error(`未找到开关: ${label}`);
  return sw as HTMLButtonElement;
};
/** 逐行渲染的行元素 */
const lineEls = () => Array.from(document.querySelectorAll('.tp-line')) as HTMLElement[];
/** 当前高亮的行 (只应有一行) */
const activeEls = () => lineEls().filter((el) => el.classList.contains('tp-line-active'));
/** 第 i 行的透明度 */
const opacityAt = (i: number) => Number(lineEls()[i].style.opacity);
/** 第 i 行中心线到阅读线的距离 (单位: 行) */
const centerGap = (i: number, offset: number) => Math.abs(LINE_TOP + LINE_STEP * i + LINE_STEP / 2 - offset - READ_Y) / LINE_STEP;

describe('Teleprompter 初始界面', () => {
  test('渲染脚本编辑区 / 提词舞台与播放控制', () => {
    render(<Teleprompter />);

    expect(screen.getByText('提词脚本')).toBeInTheDocument();
    expect(screen.getByText('提词器')).toBeInTheDocument();
    expect(scriptArea().value).toBe(SAMPLE);
    // 行 / 字符 / 全文总时长 (680px / 60px 每秒 ≈ 11 秒), 与剩余时间一致
    expect(screen.getByText(`${SAMPLE_LINES} 行 / ${SAMPLE.length} 字符 / 全文约 0:11`)).toBeInTheDocument();

    expect(btn('开始')).toBeEnabled();
    expect(btn('回到开头')).toBeDisabled();
    expect(btn('全屏')).toBeInTheDocument();

    // 默认速度 / 字号 / 行距, 淡入淡出默认开启
    expect(screen.getByText('60 px/s')).toBeInTheDocument();
    expect(screen.getByText('40 px')).toBeInTheDocument();
    expect(screen.getByText('1.8 x')).toBeInTheDocument();
    expect(stage().className).toContain('tp-fade');
    expect(stageCss()).toContain('mask-image');
    expect(stageCss()).toContain('.tp-line-active');

    // 逐行高亮: 只高亮一行, 其余行按距离衰减透明度
    const lines = lineEls();
    expect(lines).toHaveLength(SAMPLE_LINES);
    expect(activeEls()).toHaveLength(1);
    expect(activeEls()[0]).toBe(lines[0]); // 未滚动时最近的是第一行
    expect(opacityAt(0)).toBe(1);
    expect(opacityAt(1)).toBeCloseTo(focusOpacity(centerGap(1, 0)), 5);
    expect(opacityAt(1)).toBeLessThan(1);
    expect(opacityAt(2)).toBeLessThan(opacityAt(1));
    // 上下对称: 越远越淡 (上下两侧距离相同的行透明度一致)
    expect(opacityAt(3)).toBeCloseTo(focusOpacity(centerGap(3, 0)), 5);

    // 首个文本块按设定字号与行距渲染, 滚动起点为 0
    expect(textBlock().style.fontSize).toBe('40px');
    expect(textBlock().style.lineHeight).toBe('1.8');
    expect(track().style.transform).toBe('translateY(0px)');
    expect(screen.getByText('剩余 0:11')).toBeInTheDocument();
  });
});

describe('Teleprompter 播放控制', () => {
  test('空格开始 / 暂停, 再次空格恢复', () => {
    render(<Teleprompter />);

    fireEvent.keyDown(document, { key: ' ', code: 'Space' });
    expect(btn('暂停')).toBeInTheDocument();
    expect(frames.length).toBeGreaterThan(0); // 已启动动画帧

    fireEvent.keyDown(document, { key: ' ', code: 'Space' });
    expect(btn('开始')).toBeInTheDocument();
  });

  test('输入框内空格不误触播放; 播放中空格仍可暂停', () => {
    render(<Teleprompter />);

    fireEvent.keyDown(scriptArea(), { key: ' ', code: 'Space' });
    expect(btn('开始')).toBeInTheDocument(); // 光标在输入框内 → 空格只是输入

    fireEvent.click(btn('开始'));
    fireEvent.keyDown(scriptArea(), { key: ' ', code: 'Space' });
    expect(btn('开始')).toBeInTheDocument(); // 播放中 → 空格暂停
  });

  test('按速度推进滚动位置, 到结尾自动停止', () => {
    render(<Teleprompter />);
    fireEvent.click(btn('开始'));

    advanceFrames(6); // 首帧不推进, 之后 5 帧 × 200ms × 60px/s = 60px
    expect(track().style.transform).toBe('translateY(-60px)');
    expect(screen.getByText('剩余 0:10')).toBeInTheDocument();

    advanceFrames(58); // 12px/帧, 累计超过 680px 后贴住结尾
    expect(track().style.transform).toBe(`translateY(-${DISTANCE}px)`);
    expect(screen.getByText('播放结束')).toBeInTheDocument();
    expect(btn('重新播放')).toBeInTheDocument();

    // 播完再点一次: 从头开始
    fireEvent.click(btn('重新播放'));
    expect(btn('暂停')).toBeInTheDocument();
    expect(track().style.transform).toBe('translateY(0px)');
  });

  test('回到开头重置滚动位置', () => {
    render(<Teleprompter />);
    fireEvent.click(btn('开始'));
    advanceFrames(6);
    expect(screen.getByText('剩余 0:10')).toBeInTheDocument();

    fireEvent.click(btn('回到开头'));
    expect(track().style.transform).toBe('translateY(0px)');
    expect(screen.getByText('剩余 0:11')).toBeInTheDocument();
    expect(btn('回到开头')).toBeDisabled();
  });

  test('改稿后自动回到开头并停止播放', () => {
    render(<Teleprompter />);
    fireEvent.click(btn('开始'));
    advanceFrames(6);

    fireEvent.change(scriptArea(), { target: { value: '新的稿件\n第二行' } });
    expect(track().style.transform).toBe('translateY(0px)');
    expect(btn('开始')).toBeInTheDocument();
    expect(screen.getByText(`2 行 / 8 字符 / 全文约 0:11`)).toBeInTheDocument();
  });
});

describe('Teleprompter 设置', () => {
  test('↑↓ 与滑块调速, 并写入本地记忆', () => {
    render(<Teleprompter />);

    fireEvent.keyDown(document, { key: 'ArrowUp' });
    expect(screen.getByText('65 px/s')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    expect(screen.getByText('60 px/s')).toBeInTheDocument();

    // 滑块手柄上的方向键由滑块处理, 不会被页面快捷键重复计算
    fireEvent.keyDown(handleOf('速度'), arrowUp);
    expect(screen.getByText('65 px/s')).toBeInTheDocument();

    expect(JSON.parse(localStorage.getItem(OPTIONS_STORAGE_KEY) as string).speed).toBe(65);
  });

  test('字号 / 行距 / 淡入淡出 即时生效', () => {
    render(<Teleprompter />);

    fireEvent.keyDown(handleOf('字号'), arrowUp);
    expect(screen.getByText('41 px')).toBeInTheDocument();
    expect(textBlock().style.fontSize).toBe('41px');

    fireEvent.keyDown(handleOf('行距'), arrowUp);
    expect(screen.getByText('1.9 x')).toBeInTheDocument();
    expect(textBlock().style.lineHeight).toBe('1.9');

    fireEvent.click(switchOf('淡入淡出'));
    expect(stage().className).not.toContain('tp-fade');
  });

  test('逐行高亮: 当前行随滚动下移, 越远越淡; 关闭后所有行同样清晰', () => {
    render(<Teleprompter />);

    expect(activeEls()).toHaveLength(1);
    expect(activeEls()[0]).toBe(lineEls()[0]);
    const firstOpacity = opacityAt(1);

    // 滚动约一行 (14 帧 → 13 帧推进 × 12px = 156px > 一个行高 72px) 后高亮行跟着下移
    fireEvent.click(btn('开始'));
    advanceFrames(14);
    expect(activeEls()).toHaveLength(1);
    expect(activeEls()[0]).toBe(lineEls()[1]);
    expect(opacityAt(1)).toBe(1);
    // 刚经过的那一行开始变淡
    expect(opacityAt(0)).toBeLessThan(1);
    expect(opacityAt(0)).toBeCloseTo(focusOpacity(centerGap(0, 156)), 5);
    expect(opacityAt(1)).toBeGreaterThan(firstOpacity);
    expect(opacityAt(2)).toBeLessThan(opacityAt(1));

    // 关掉后: 没有高亮行, 所有行都是全不透明
    fireEvent.click(switchOf('逐行高亮'));
    expect(activeEls()).toHaveLength(0);
    lineEls().forEach((el) => expect(Number(el.style.opacity)).toBe(1));
  });

  test('打开时沿用上次记忆的速度 / 字号 / 行距 / 淡入淡出 / 逐行高亮', () => {
    localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify({ speed: 120, fontSize: 52, lineHeight: 2.2, fade: false, focus: false }));
    render(<Teleprompter />);

    expect(screen.getByText('120 px/s')).toBeInTheDocument();
    expect(screen.getByText('52 px')).toBeInTheDocument();
    expect(screen.getByText('2.2 x')).toBeInTheDocument();
    expect(stage().className).not.toContain('tp-fade');
    // 逐行高亮被关掉 → 不再有高亮行, 所有行全不透明
    expect(activeEls()).toHaveLength(0);
    expect(opacityAt(0)).toBe(1);
    expect(opacityAt(1)).toBe(1);
  });

  test('清空后禁用播放并提示, 载入示例可恢复', () => {
    render(<Teleprompter />);

    fireEvent.click(btn('清空'));
    expect(scriptArea().value).toBe('');
    expect(btn('开始')).toBeDisabled();
    expect(screen.getByText('请先在上方输入提词脚本')).toBeInTheDocument();

    fireEvent.click(btn('载入示例'));
    expect(scriptArea().value).toBe(SAMPLE);
    expect(btn('开始')).toBeEnabled();
  });

  test('载入示例随机换一首 (不会重复当前稿件)', () => {
    render(<Teleprompter />);
    expect(scriptArea().value).toBe(SAMPLE);

    fireEvent.click(btn('载入示例'));
    expect(scriptArea().value).toBe(SAMPLE_SCRIPTS['zh-CN'][1]);
    expect(scriptArea().value).not.toBe(SAMPLE);

    // 再点一次换回来
    fireEvent.click(btn('载入示例'));
    expect(scriptArea().value).toBe(SAMPLE);
  });

  test('默认示例稿随界面语言切换: 繁體用繁體组, English 用英文组', () => {
    const { unmount } = renderWithLocale('zh-TW');
    expect(scriptAreaAny().value).toBe(SAMPLE_SCRIPTS['zh-TW'][0]);
    expect(scriptAreaAny().value).not.toBe(SAMPLE);
    unmount();

    renderWithLocale('en');
    expect(scriptAreaAny().value).toBe(SAMPLE_SCRIPTS.en[0]);
    expect(scriptAreaAny().value).toContain('Rage, rage against the dying of the light.');
    expect(screen.getByText('Script')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste or type your script here…')).toBeInTheDocument();
  });
});

describe('Teleprompter 全屏', () => {
  test('无原生全屏时使用窗口内全屏, Esc 退出', () => {
    render(<Teleprompter />);

    fireEvent.click(btn('全屏'));
    expect(stage().className).toContain('tp-full');
    expect(btn('退出全屏')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(stage().className).not.toContain('tp-full');
    expect(btn('全屏')).toBeInTheDocument();
  });

  test('支持原生全屏时调用 Fullscreen API, 退出时同步', () => {
    const request = jest.fn().mockResolvedValue(undefined);
    const exit = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { configurable: true, value: request });
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => document.querySelector('.tp-stage'),
    });
    Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exit });

    try {
      render(<Teleprompter />);
      fireEvent.click(btn('全屏'));
      expect(request).toHaveBeenCalledTimes(1);
      expect(stage().className).toContain('tp-full');

      fireEvent.click(btn('退出全屏'));
      expect(exit).toHaveBeenCalledTimes(1);
      expect(stage().className).not.toContain('tp-full');
    } finally {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>).requestFullscreen;
      delete (document as unknown as Record<string, unknown>).fullscreenElement;
      delete (document as unknown as Record<string, unknown>).exitFullscreen;
    }
  });
});
