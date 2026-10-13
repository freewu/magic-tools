import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import FakeMeeting from './index';
import { pickParticipants } from './lib';
import { LocaleProvider } from '../../hook/locale-context';

/** app 根 / 网格瓦片 / 顶部计时 */
const app = (c: HTMLElement) => c.querySelector('.fm-app') as HTMLElement;
const gridTiles = (c: HTMLElement) => [ ...c.querySelectorAll('.fm-grid .fm-tile') ] as HTMLElement[];
const allTiles = (c: HTMLElement) => [ ...c.querySelectorAll('.fm-tile') ] as HTMLElement[];
const clock = (c: HTMLElement) => c.querySelector('.fm-clock')?.textContent ?? '';

/** 文案匹配按钮 (antd 会在两个中文字之间插入空格, 统一去空白) */
const btn = (name: string): HTMLButtonElement => {
  const target = name.replace(/\s+/g, '');
  const hit = screen
    .getAllByText((_, el) => (el?.textContent ?? '').replace(/\s+/g, '') === target)
    .find((el) => el.closest('button'));
  if (!hit) throw new Error(`未找到按钮: ${name}`);
  return hit.closest('button') as HTMLButtonElement;
};

/** 按取值范围取滑块 (参会人数 2~12 / 音量 0~100) */
const slider = (c: HTMLElement, min: number, max: number): HTMLElement => {
  const hit = [ ...c.querySelectorAll('[role="slider"]') ].find(
    (el) => el.getAttribute('aria-valuemin') === String(min) && el.getAttribute('aria-valuemax') === String(max)
  );
  if (!hit) throw new Error(`未找到滑块: ${min}~${max}`);
  return hit as HTMLElement;
};

/** 顶部风格切换 (Segmented) */
const segment = (name: string) => {
  const hit = screen.getAllByText(name).find((el) => el.closest('.ant-segmented-item'));
  if (!hit) throw new Error(`未找到风格切换: ${name}`);
  fireEvent.click(hit);
};

const checkbox = (label: string) => screen.getByLabelText(label) as HTMLInputElement;
const inputNumber = (c: HTMLElement) => c.querySelector('.ant-input-number-input') as HTMLInputElement;

const track = { stop: jest.fn() };
const fakeStream = { getTracks: () => [ track ] } as unknown as MediaStream;

beforeEach(() => {
  message.destroy();
  track.stop.mockClear();
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: jest.fn().mockResolvedValue(fakeStream) },
  });
});

afterEach(() => cleanup());

describe('假装开会 三种界面', () => {
  test('默认是腾讯会议: 顶栏/会议号/计时/工具条齐全', () => {
    const { container } = render(<FakeMeeting />);
    expect(app(container)).toHaveClass('fm-tencent');
    const top = container.querySelector('.fm-top') as HTMLElement;
    expect(top.textContent).toContain('腾讯会议');
    expect(top.textContent).toContain('产品双周同步会');
    expect(top.textContent).toContain('812 345 678');
    expect(top.textContent).toContain('REC');
    expect(clock(container)).toBe('00:00:00');
    expect(gridTiles(container)).toHaveLength(6);
    for (const name of [ '麦克风', '视频', '共享屏幕', '成员', '聊天', '更多', '离开会议' ]) {
      expect(btn(name)).toBeInTheDocument();
    }
  });

  test('切到 Zoom: 独立自我小窗 + 已加密 + 会议 ID, 主题随皮肤默认值切换', () => {
    const { container } = render(<FakeMeeting />);
    segment('Zoom');
    expect(app(container)).toHaveClass('fm-zoom');
    expect(container.querySelector('.fm-selfpane')).toBeTruthy();
    expect(container.textContent).toContain('已加密');
    expect(container.textContent).toContain('928 4517 3062');
    expect(container.textContent).toContain('Weekly Product Sync');
    // Zoom 的「我」在小窗里, 网格只排其他人
    expect(gridTiles(container)).toHaveLength(5);
    expect(allTiles(container)).toHaveLength(6);
    expect(btn('录制')).toBeInTheDocument();
    expect(container.querySelectorAll('.fm-sep').length).toBe(3);
  });

  test('切到 Teams: 计时带「已过」前缀, 工具条为 Teams 文案', () => {
    const { container } = render(<FakeMeeting />);
    segment('Microsoft Teams');
    expect(app(container)).toHaveClass('fm-teams');
    expect(clock(container)).toBe('已过 00:00:00');
    for (const name of [ '聊天', '人员', '举手', '静音', '摄像头', '共享', '离开' ]) {
      expect(btn(name)).toBeInTheDocument();
    }
    // 参与者面板里的人数与计数一致
    fireEvent.click(btn('人员'));
    expect(container.querySelector('.fm-side')?.textContent).toContain('参会者 (6)');
  });

  test('自定义会议主题/名字/会议号会实时渲染到假界面', () => {
    const { container } = render(<FakeMeeting />);
    fireEvent.change(screen.getByDisplayValue('产品双周同步会'), { target: { value: 'Q4 复盘会' } });
    fireEvent.change(screen.getByDisplayValue('我'), { target: { value: '老王' } });
    fireEvent.change(screen.getByDisplayValue('812 345 678'), { target: { value: '999 888 777' } });
    const top = container.querySelector('.fm-top') as HTMLElement;
    expect(top.textContent).toContain('Q4 复盘会');
    expect(top.textContent).toContain('999 888 777');
    expect(container.textContent).toContain('老王');
  });
});

describe('假装开会 控制项', () => {
  test('麦克风开关切换关闭态, 摄像头打开后进入播放状态', async () => {
    const { container } = render(<FakeMeeting />);
    const mic = btn('麦克风');
    expect(mic).toHaveClass('is-off');
    fireEvent.click(mic);
    expect(btn('麦克风')).not.toHaveClass('is-off');
    expect(btn('视频')).toHaveClass('is-off');
    fireEvent.click(btn('视频'));
    await waitFor(() => expect(btn('视频')).not.toHaveClass('is-off'));
    expect(btn('关闭摄像头')).toBeInTheDocument();
    expect(container.querySelector('video')).toBeTruthy();
  });

  test('Teams 静音按钮的文案随状态切换为「取消静音」', () => {
    render(<FakeMeeting />);
    segment('Microsoft Teams');
    expect(btn('静音')).toBeInTheDocument();
    fireEvent.click(btn('静音'));
    expect(btn('取消静音')).toBeInTheDocument();
  });

  test('参会人数滑块改变瓦片数量 (上下限取整)', () => {
    const { container } = render(<FakeMeeting />);
    const s = slider(container, 2, 12);
    fireEvent.keyDown(s, { keyCode: 36 });
    expect(gridTiles(container)).toHaveLength(2);
    fireEvent.keyDown(s, { keyCode: 35 });
    expect(gridTiles(container)).toHaveLength(12);
  });

  test('起始时长改写计时器读数', () => {
    const { container } = render(<FakeMeeting />);
    fireEvent.change(inputNumber(container), { target: { value: '5' } });
    expect(clock(container)).toBe('00:05:00');
  });

  test('计时器每秒自增, 可暂停', () => {
    jest.useFakeTimers();
    try {
      const { container } = render(<FakeMeeting />);
      act(() => { jest.advanceTimersByTime(3000); });
      expect(clock(container)).toBe('00:00:03');
      fireEvent.click(btn('暂停计时'));
      act(() => { jest.advanceTimersByTime(3000); });
      expect(clock(container)).toBe('00:00:03');
      expect(btn('继续计时')).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  test('聊天面板显示逐条出现的消息, 关闭后未读有红点', () => {
    jest.useFakeTimers();
    try {
      const { container } = render(<FakeMeeting />);
      fireEvent.click(btn('聊天'));
      const side = container.querySelector('.fm-side') as HTMLElement;
      expect(side.querySelectorAll('.fm-msg')).toHaveLength(2);
      expect(side.textContent).toContain('说点什么…');
      expect(side.textContent).toContain('发送');
      fireEvent.click(btn('聊天'));
      expect(container.querySelector('.fm-side')).toBeNull();
      act(() => { jest.advanceTimersByTime(13000); });
      expect(container.querySelector('.fm-dot')).toBeTruthy();
      fireEvent.click(btn('聊天'));
      expect(container.querySelector('.fm-dot')).toBeNull();
      expect((container.querySelector('.fm-side') as HTMLElement).querySelectorAll('.fm-msg')).toHaveLength(3);
    } finally {
      jest.useRealTimers();
    }
  });

  test('参会者面板列出全部成员并标注主持人/(我)', () => {
    const { container } = render(<FakeMeeting />);
    fireEvent.click(btn('成员'));
    const rows = container.querySelectorAll('.fm-prow');
    expect(rows).toHaveLength(6);
    // 「主持人」标签在网格瓦片与参会者面板各渲染一次
    expect(container.querySelectorAll('.fm-side .fm-badge.is-host')).toHaveLength(1);
    expect(container.textContent).toContain('(我)');
    expect(container.textContent).toContain('邀请');
  });

  test('共享屏幕替换网格为假幻灯片, 再点恢复', () => {
    const { container } = render(<FakeMeeting />);
    fireEvent.click(btn('共享屏幕'));
    expect(container.querySelector('.fm-grid')).toBeNull();
    const share = container.querySelector('.fm-share') as HTMLElement;
    expect(share.textContent).toContain('Q4 目标与进度');
    expect(share.querySelectorAll('.fm-bar')).toHaveLength(6);
    expect(container.textContent).toContain('正在共享屏幕');
    expect(btn('停止共享')).toBeInTheDocument();
    fireEvent.click(btn('停止共享'));
    expect(container.querySelector('.fm-grid')).toBeTruthy();
    expect(container.querySelector('.fm-share')).toBeNull();
  });

  test('沉浸模式切换 class, Esc 退出', () => {
    const { container } = render(<FakeMeeting />);
    fireEvent.click(btn('沉浸模式'));
    expect(container.querySelector('.fm-stage')).toHaveClass('fm-immersive');
    expect(container.querySelector('.fm-exit')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(container.querySelector('.fm-stage')).not.toHaveClass('fm-immersive');
    expect(container.querySelector('.fm-exit')).toBeNull();
  });

  test('沉浸模式请求浏览器全屏, 浏览器原生退出时同步收起', () => {
    const { container } = render(<FakeMeeting />);
    const stage = container.querySelector('.fm-stage') as HTMLElement;
    const request = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(stage, 'requestFullscreen', { configurable: true, value: request });
    fireEvent.click(btn('沉浸模式'));
    expect(request).toHaveBeenCalledTimes(1);
    expect(stage).toHaveClass('fm-immersive');
    // 模拟浏览器原生退出全屏 (Esc) 触发的 fullscreenchange
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: null });
    act(() => { document.dispatchEvent(new Event('fullscreenchange')); });
    expect(stage).not.toHaveClass('fm-immersive');
  });
});

describe('假装开会 我的画面与背景人声', () => {
  test('打开摄像头后瓦片播放真实画面, 清除后恢复头像', async () => {
    const { container } = render(<FakeMeeting />);
    fireEvent.click(btn('打开摄像头'));
    await waitFor(() => expect(btn('关闭摄像头')).toBeInTheDocument());
    expect(container.querySelector('video')).toBeTruthy();
    expect(app(container).querySelector('.fm-tile.is-video')).toBeTruthy();
    fireEvent.click(btn('清除画面'));
    expect(container.querySelector('video')).toBeNull();
    expect(btn('打开摄像头')).toBeInTheDocument();
    expect(track.stop).toHaveBeenCalled();
  });

  test('摄像头不可用时提示且状态不变', async () => {
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValueOnce(new Error('denied'));
    render(<FakeMeeting />);
    fireEvent.click(btn('打开摄像头'));
    expect(await screen.findByText('摄像头不可用或未授权')).toBeInTheDocument();
    expect(btn('打开摄像头')).toBeInTheDocument();
  });

  test('环境不支持音频时背景人声自动取消并提示', async () => {
    render(<FakeMeeting />);
    fireEvent.click(checkbox('背景人声'));
    expect(await screen.findByText('人声不可用 (当前环境不支持音频)')).toBeInTheDocument();
    await waitFor(() => expect(checkbox('背景人声')).not.toBeChecked());
  });

  test('支持 WebAudio 时可开启背景人声并调音量', async () => {
    const connect = jest.fn();
    const node = () => ({ connect, start: jest.fn(), stop: jest.fn() });
    class FakeAudioContext {
      sampleRate = 8000;
      destination = {};
      createBuffer = (_ch: number, len: number) => ({ getChannelData: () => new Float32Array(len) });
      createBufferSource = () => ({ ...node(), buffer: null, loop: false });
      createBiquadFilter = () => ({ ...node(), type: '', frequency: { value: 0 }, Q: { value: 0 } });
      createOscillator = () => ({ ...node(), frequency: { value: 0 } });
      createGain = () => ({ ...node(), gain: { value: 0 } });
      close = jest.fn().mockResolvedValue(undefined);
    }
    const original = (window as unknown as { AudioContext?: unknown }).AudioContext;
    (window as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext;
    try {
      const { container } = render(<FakeMeeting />);
      fireEvent.click(checkbox('背景人声'));
      expect(checkbox('背景人声')).toBeChecked();
      const vol = slider(container, 0, 100);
      expect(vol).not.toBeDisabled();
      fireEvent.keyDown(vol, { keyCode: 36 });
      expect(vol.getAttribute('aria-valuenow')).toBe('0');
      // 上一条用例的 message 动画可能仍在退场, 等待其移除
      await waitFor(() => expect(screen.queryByText('人声不可用 (当前环境不支持音频)')).toBeNull());
    } finally {
      (window as unknown as { AudioContext?: unknown }).AudioContext = original;
    }
  });
});

describe('假装开会 组件交互与纯函数一致性', () => {
  test('瓦片名字与 pickParticipants 结果一致', () => {
    const { container } = render(<FakeMeeting />);
    const expected = pickParticipants(6, 'zh-CN', '我');
    const names = gridTiles(container).map((t) => t.querySelector('.fm-name')?.textContent ?? '');
    expect(names).toEqual(expected.map((p) => p.name));
  });

  test('点击瓦片名字可改名, 空值回退, 人数与语言变化时保留', () => {
    const { container } = render(<FakeMeeting />);
    const first = () => gridTiles(container)[0];
    const nameEl = () => first().querySelector('.fm-name') as HTMLElement;
    const original = nameEl().textContent;
    // 改名
    fireEvent.click(nameEl());
    const input = first().querySelector('.fm-name-input') as HTMLInputElement;
    expect(input).toBeTruthy();
    fireEvent.change(input, { target: { value: '  老板  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(nameEl().textContent).toBe('老板');
    expect(nameEl()).toHaveClass('is-edited');
    // 空输入保留旧名
    fireEvent.click(nameEl());
    const empty = first().querySelector('.fm-name-input') as HTMLInputElement;
    fireEvent.change(empty, { target: { value: '   ' } });
    fireEvent.keyDown(empty, { key: 'Enter' });
    expect(nameEl().textContent).toBe('老板');
    // 切换皮肤 (网格重排) 与语言后手动改的名字仍在
    segment('Zoom');
    expect(gridTiles(container)[0].querySelector('.fm-name')?.textContent).toBe('老板');
    expect(original).not.toBe('老板');
  });

  test('参会者面板里点名字同样可改名, 并同步到网格瓦片', () => {
    const { container } = render(<FakeMeeting />);
    fireEvent.click(btn('成员'));
    const row = container.querySelector('.fm-prow') as HTMLElement;
    fireEvent.click(row.querySelector('.fm-name') as HTMLElement);
    const input = row.querySelector('.fm-name-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '主持人甲' } });
    fireEvent.blur(input);
    expect(row.querySelector('.fm-name')?.textContent).toBe('主持人甲');
    expect(gridTiles(container)[0].querySelector('.fm-name')?.textContent).toBe('主持人甲');
  });

  test('改「我」的名字会同步到顶部「我的名字」输入框', () => {
    const { container } = render(<FakeMeeting />);
    const tiles = gridTiles(container);
    const meTile = tiles[tiles.length - 1];
    fireEvent.click(meTile.querySelector('.fm-name') as HTMLElement);
    const input = meTile.querySelector('.fm-name-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '老王' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByDisplayValue('老王')).toBeInTheDocument();
    expect(container.textContent).toContain('老王');
  });

  test('参会者面板打开时, 网格里不再重复出现改名输入框', () => {
    const { container } = render(<FakeMeeting />);
    fireEvent.click(btn('成员'));
    const tileName = gridTiles(container)[0].querySelector('.fm-name') as HTMLElement;
    expect(tileName).not.toHaveClass('is-editable');
    fireEvent.click(tileName);
    expect(container.querySelectorAll('.fm-name-input')).toHaveLength(0);
  });

  test('离开会议结束计时', () => {
    const { container } = render(<FakeMeeting />);
    jest.useFakeTimers();
    try {
      fireEvent.click(btn('离开会议'));
      act(() => { jest.advanceTimersByTime(2000); });
      expect(clock(container)).toBe('00:00:00');
      expect(btn('继续计时')).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('假装开会 多语言', () => {
  const renderLocale = (locale: string) => {
    localStorage.setItem('app-locale', locale);
    return render(
      <LocaleProvider>
        <FakeMeeting />
      </LocaleProvider>
    );
  };

  afterEach(() => localStorage.clear());

  test('en: 界面文案与会议软件按钮均为英文, 且不残留中文 key', () => {
    renderLocale('en');
    expect(screen.getByText('Interface')).toBeInTheDocument();
    expect(screen.getByText('Meeting topic')).toBeInTheDocument();
    expect(screen.queryByText('界面风格')).toBeNull();
    expect(btn('Mic')).toBeInTheDocument();
    expect(btn('Leave')).toBeInTheDocument();
    expect(btn('Chat')).toBeInTheDocument();
  });

  test('zh-TW: 使用繁体文案', () => {
    renderLocale('zh-TW');
    expect(screen.getByText('介面風格')).toBeInTheDocument();
    expect(screen.queryByText('界面风格')).toBeNull();
    expect(btn('麥克風')).toBeInTheDocument();
    expect(btn('離開會議')).toBeInTheDocument();
  });
});
