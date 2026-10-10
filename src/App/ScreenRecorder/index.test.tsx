import '@testing-library/jest-dom';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import ScreenRecorder from './index';
import { DEFAULTS_STORAGE_KEY, FPS_DEFAULT, TIMESLICE_MS } from './data';
import { openUrl } from '../../lib/tauri';

// ---- tauri 桩: 桌面版标记与保存调用 ----
const mockSaveBytes = jest.fn().mockResolvedValue(true);
let mockTauri = false;
const mockOpenUrl = openUrl as jest.Mock;
jest.mock('../../lib/tauri', () => ({
  isTauri: () => mockTauri,
  openUrl: jest.fn(),
  saveBytesFile: (...args: unknown[]) => mockSaveBytes(...args),
}));

// jsdom 没有 URL.createObjectURL
const mockCreateObjectURL = jest.fn(() => 'blob:mock');
const mockRevokeObjectURL = jest.fn();

// 让 blob.arrayBuffer 走同步实现, 不依赖 FileReader 的异步事件
beforeAll(() => {
  Blob.prototype.arrayBuffer = function arrayBuffer(this: Blob) {
    return Promise.resolve(new ArrayBuffer(this.size));
  };
});

// ---- MediaStream / MediaTrack 桩 ----
class FakeTrack {
  kind: string;

  settings: Record<string, unknown>;

  stopped = false;

  onended: (() => void) | null = null;

  constructor(kind: string, settings: Record<string, unknown> = {}) {
    this.kind = kind;
    this.settings = settings;
  }

  getSettings() {
    return this.settings;
  }

  stop() {
    this.stopped = true;
  }
}

class FakeMediaStream {
  tracks: FakeTrack[];

  constructor(tracks: FakeTrack[] = []) {
    this.tracks = tracks;
  }

  getTracks() {
    return this.tracks;
  }

  getVideoTracks() {
    return this.tracks.filter((t) => t.kind === 'video');
  }

  getAudioTracks() {
    return this.tracks.filter((t) => t.kind === 'audio');
  }
}

const makeDisplayStream = (opts: { audio?: boolean; width?: number; height?: number; frameRate?: number } = {}) => {
  const tracks = [
    new FakeTrack('video', {
      width: opts.width ?? 1920,
      height: opts.height ?? 1080,
      frameRate: opts.frameRate ?? 30,
    }),
  ];
  if (opts.audio) tracks.push(new FakeTrack('audio'));
  return new FakeMediaStream(tracks);
};

// ---- MediaRecorder 桩 ----
interface FakeRecorderLike {
  state: string;
  mimeType: string;
  stream: FakeMediaStream;
  timeslice: number;
  start: (ts?: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  emit: (data: Blob) => void;
  ondataavailable: ((e: { data: Blob }) => void) | null;
  onstop: (() => void) | null;
  onerror: (() => void) | null;
}

const recorders: FakeRecorderLike[] = [];
let mockIsTypeSupported = (mime: string) => mime.includes('vp9');

class FakeMediaRecorder implements FakeRecorderLike {
  static isTypeSupported = (mime: string) => mockIsTypeSupported(mime);

  state = 'inactive';

  mimeType: string;

  stream: FakeMediaStream;

  timeslice = 0;

  ondataavailable: ((e: { data: Blob }) => void) | null = null;

  onstop: (() => void) | null = null;

  onerror: (() => void) | null = null;

  constructor(stream: FakeMediaStream, options: { mimeType?: string } = {}) {
    this.stream = stream;
    this.mimeType = options.mimeType ?? '';
    recorders.push(this);
  }

  start(ts?: number) {
    this.timeslice = ts ?? 0;
    this.state = 'recording';
  }

  pause() {
    this.state = 'paused';
  }

  resume() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    this.onstop?.();
  }

  emit(data: Blob) {
    this.ondataavailable?.({ data });
  }
}

const lastRecorder = () => recorders[recorders.length - 1];

// ---- DOM 查询辅助 ----
const norm = (s: string) => s.replace(/\s+/g, '');
const btn = (c: HTMLElement, name: string) => {
  const all = Array.from(c.querySelectorAll('button')) as HTMLButtonElement[];
  const hit = all.filter((b) => norm(b.textContent ?? '') === norm(name));
  if (hit.length !== 1) throw new Error(`找不到唯一按钮「${name}」(实际 ${hit.length} 个)`);
  return hit[0];
};
const hasBtn = (c: HTMLElement, name: string) =>
  (Array.from(c.querySelectorAll('button')) as HTMLButtonElement[])
    .some((b) => norm(b.textContent ?? '') === norm(name));
const clockOf = (c: HTMLElement) => c.querySelector('.sr-clock')?.textContent ?? '';
const recDotOf = (c: HTMLElement) => c.querySelector('.sr-rec') as HTMLElement;

const startRec = async (c: HTMLElement) => {
  await act(async () => { fireEvent.click(btn(c, '开始录制')); });
};

const stopRec = async (c: HTMLElement) => {
  await act(async () => { fireEvent.click(btn(c, '停止')); });
};

/** antd Select 虚拟列表: 打开后按文案点选项 */
const openSelect = async (index: number) => {
  const selector = document.querySelectorAll('.ant-select-selector')[index] as HTMLElement;
  await act(async () => { fireEvent.mouseDown(selector); });
};
const clickOption = async (text: string) => {
  const options = Array.from(document.querySelectorAll('.ant-select-item-option-content'));
  const hit = options.find((o) => (o.textContent ?? '') === text);
  if (!hit) throw new Error(`找不到选项「${text}」`);
  await act(async () => { fireEvent.click(hit); });
};

/** getDisplayMedia 桩: 记录传入的约束 */
const makeGetDisplayMedia = (stream: FakeMediaStream = makeDisplayStream()) =>
  jest.fn(async (_constraints?: unknown) => stream);
const makeGetUserMedia = () => jest.fn(async (_constraints?: unknown) => new FakeMediaStream([ new FakeTrack('audio') ]));

let mockGetDisplayMedia = makeGetDisplayMedia();
let mockGetUserMedia = makeGetUserMedia();

const installSupport = (supported = true) => {
  const mediaDevices = supported
    ? {
      getDisplayMedia: (c?: unknown) => mockGetDisplayMedia(c),
      getUserMedia: (c?: unknown) => mockGetUserMedia(c),
    }
    : undefined;
  Object.defineProperty(navigator, 'mediaDevices', { value: mediaDevices, configurable: true });
  (window as unknown as { MediaRecorder?: unknown }).MediaRecorder = supported ? FakeMediaRecorder : undefined;
  (window as unknown as { MediaStream?: unknown }).MediaStream = FakeMediaStream;
};

beforeEach(() => {
  localStorage.clear();
  recorders.length = 0;
  mockSaveBytes.mockClear();
  mockOpenUrl.mockClear();
  mockCreateObjectURL.mockClear();
  mockRevokeObjectURL.mockClear();
  mockTauri = false;
  mockIsTypeSupported = (mime) => mime.includes('vp9');
  mockGetDisplayMedia = makeGetDisplayMedia();
  mockGetUserMedia = makeGetUserMedia();
  (URL as unknown as Record<string, unknown>).createObjectURL = mockCreateObjectURL;
  (URL as unknown as Record<string, unknown>).revokeObjectURL = mockRevokeObjectURL;
  installSupport(true);
});

describe('屏幕录制 页面', () => {
  it('渲染标题 / 参数与空状态', () => {
    const { container } = render(<ScreenRecorder />);
    expect(container.querySelector('.ant-card-head-title')?.textContent).toBe('屏幕录制');
    expect(container.querySelector('.sr-empty')).not.toBeNull();
    // 编码格式与体积估算提示
    expect(container.textContent).toContain('WebM · VP9 + Opus');
    expect(container.textContent).toContain('预计约');
    expect(container.querySelector('.sr-stage')).not.toBeNull();
    expect(container.querySelector('.intro')).not.toBeNull();
    expect(btn(container, '开始录制')).toBeEnabled();
  });

  it('浏览器不支持时提示并禁用录制', () => {
    installSupport(false);
    const { container } = render(<ScreenRecorder />);
    expect(container.querySelector('.sr-unsupported')).not.toBeNull();
    expect(container.textContent).toContain('当前浏览器不支持屏幕录制');
    expect(btn(container, '开始录制')).toBeDisabled();
  });

  it('桌面版提示浏览器专享并禁用录制', () => {
    mockTauri = true;
    const { container } = render(<ScreenRecorder />);
    expect(container.querySelector('.web-only-notice')).not.toBeNull();
    expect(container.textContent).toContain('屏幕录制是浏览器专享功能');
    expect(btn(container, '开始录制')).toBeDisabled();
    // 「打开 Web 版」直达本工具的 Web 版地址
    fireEvent.click(btn(container, '打开 Web 版'));
    expect(mockOpenUrl).toHaveBeenCalledWith('https://freewu.github.io/magic-tools/tools/#/ScreenRecorder');
  });

  it('空格键开始 / 停止', async () => {
    const { container } = render(<ScreenRecorder />);
    await act(async () => { fireEvent.keyDown(document.body, { key: ' ' }); });
    expect(recorders).toHaveLength(1);
    expect(btn(container, '停止')).toBeInTheDocument();
    await act(async () => { fireEvent.keyDown(document.body, { key: ' ' }); });
    expect(btn(container, '开始录制')).toBeInTheDocument();
    expect(lastRecorder().state).toBe('inactive');
  });
});

describe('屏幕录制 采集与录制', () => {
  it('开始录制: 参数传给采集与录制器, 显示状态与规格', async () => {
    const { container } = render(<ScreenRecorder />);
    await startRec(container);

    expect(mockGetDisplayMedia).toHaveBeenCalledTimes(1);
    expect(mockGetDisplayMedia.mock.calls[0][0]).toEqual({
      video: { frameRate: FPS_DEFAULT },
      audio: false, // 默认「不录声音」
    });
    const rec = lastRecorder();
    expect(rec.mimeType).toBe('video/webm;codecs=vp9,opus');
    expect(rec.timeslice).toBe(TIMESLICE_MS);
    expect(rec.state).toBe('recording');

    expect(container.textContent).toContain('录制中');
    expect(recDotOf(container).className).not.toContain('sr-rec-paused');
    expect(container.textContent).toContain('1920×1080');
    expect(container.textContent).toContain('30 fps');
    expect(container.textContent).toContain('无声音');
    expect(btn(container, '暂停')).toBeInTheDocument();
    expect(btn(container, '停止')).toBeInTheDocument();
    // 录制中不允许改参数
    expect(document.querySelectorAll('.ant-select-disabled').length).toBeGreaterThan(0);
  });

  it('分片累计大小 / 暂停 / 继续', async () => {
    const { container } = render(<ScreenRecorder />);
    await startRec(container);
    const rec = lastRecorder();

    await act(async () => { rec.emit(new Blob([ 'abc' ], { type: 'video/webm' })); });
    expect(container.textContent).toContain('已写入 3 B');
    await act(async () => { rec.emit(new Blob([], { type: 'video/webm' })); }); // 空分片忽略
    expect(container.textContent).toContain('已写入 3 B');

    await act(async () => { fireEvent.click(btn(container, '暂停')); });
    expect(rec.state).toBe('paused');
    expect(container.textContent).toContain('已暂停');
    expect(recDotOf(container).className).toContain('sr-rec-paused');
    expect(btn(container, '继续')).toBeInTheDocument();

    await act(async () => { fireEvent.click(btn(container, '继续')); });
    expect(rec.state).toBe('recording');
    expect(container.textContent).toContain('录制中');
  });

  it('停止后合成结果: 预览 / 文件名 / 时长与大小', async () => {
    const { container } = render(<ScreenRecorder />);
    await startRec(container);
    await act(async () => { lastRecorder().emit(new Blob([ 'abcdef' ], { type: 'video/webm' })); });
    await stopRec(container);

    const video = container.querySelector('.sr-video') as HTMLVideoElement;
    expect(video).not.toBeNull();
    expect(video.getAttribute('src')).toBe('blob:mock');
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    expect(container.textContent).toMatch(/screen-recording-\d{8}-\d{6}\.webm/);
    expect(container.textContent).toContain('时长 0:00 · 大小 6 B');
    expect(container.textContent).toContain('video/webm');
    expect(hasBtn(container, '开始录制')).toBe(true);
  });

  it('用户点浏览器「停止共享」自动收尾', async () => {
    const { container } = render(<ScreenRecorder />);
    await startRec(container);
    const rec = lastRecorder();
    const track = rec.stream.getVideoTracks()[0];
    // 浏览器在真正停止前会派发最后一个分片, 随后才触发 onstop
    await act(async () => { rec.emit(new Blob([ 'xyz' ], { type: 'video/webm' })); });
    await act(async () => { track.onended?.(); });
    expect(rec.state).toBe('inactive');
    expect(container.querySelector('.sr-video')).not.toBeNull();
  });

  it('没有录到内容时给出错误', async () => {
    const { container } = render(<ScreenRecorder />);
    await startRec(container);
    await stopRec(container);
    expect(container.textContent).toContain('没有录到内容');
    expect(container.querySelector('.sr-video')).toBeNull();
  });

  it('采集被拒绝时提示失败原因', async () => {
    mockGetDisplayMedia = jest.fn(async (_c?: unknown) => { throw new Error('Permission denied'); });
    const { container } = render(<ScreenRecorder />);
    await startRec(container);
    expect(container.textContent).toContain('开始录制失败: Permission denied');
    expect(recorders).toHaveLength(0);
    expect(btn(container, '开始录制')).toBeEnabled();
  });

  it('浏览器一个编码格式都不支持时交给它自己决定', async () => {
    mockIsTypeSupported = () => false;
    const { container } = render(<ScreenRecorder />);
    expect(container.textContent).toContain('浏览器默认格式');
    await startRec(container);
    expect(lastRecorder().mimeType).toBe('');
  });

  it('分辨率上限传给采集约束', async () => {
    const { container } = render(<ScreenRecorder />);
    await openSelect(3); // 帧率 / 画质 / 声音 / 分辨率
    await clickOption('最高 720p');
    await startRec(container);
    expect(mockGetDisplayMedia.mock.calls[0][0]).toEqual({
      video: { frameRate: FPS_DEFAULT, height: { max: 720 }, width: { max: 1280 } },
      audio: false,
    });
  });
});

describe('屏幕录制 声音与结果', () => {
  it('「系统声音」向采集索取音频', async () => {
    const { container } = render(<ScreenRecorder />);
    await openSelect(2);
    await clickOption('系统声音 (屏幕 / 标签页)');
    await startRec(container);
    expect(mockGetDisplayMedia.mock.calls[0][0]).toEqual({
      video: { frameRate: FPS_DEFAULT },
      audio: true,
    });
    expect(mockGetUserMedia).not.toHaveBeenCalled();
  });

  it('「系统声音 + 麦克风」合并两条音轨', async () => {
    mockGetDisplayMedia = makeGetDisplayMedia(makeDisplayStream({ audio: true }));
    const { container } = render(<ScreenRecorder />);
    await openSelect(2);
    await clickOption('系统声音 + 麦克风');
    await startRec(container);
    expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
    const rec = lastRecorder();
    expect(rec.stream.getVideoTracks()).toHaveLength(1);
    expect(rec.stream.getAudioTracks()).toHaveLength(2); // 系统 + 麦克风
    expect(container.textContent).toContain('含声音');
  });

  it('麦克风被拒绝时退化为只录系统声音', async () => {
    mockGetUserMedia = jest.fn(async (_c?: unknown) => { throw new Error('no mic'); });
    const { container } = render(<ScreenRecorder />);
    await openSelect(2);
    await clickOption('系统声音 + 麦克风');
    await startRec(container);
    expect(lastRecorder().stream.getAudioTracks()).toHaveLength(0);
    expect(container.textContent).toContain('无声音');
  });

  it('下载视频: 交给 saveBytesFile 并带上文件名', async () => {
    const { container } = render(<ScreenRecorder />);
    await startRec(container);
    await act(async () => { lastRecorder().emit(new Blob([ 'abcdef' ], { type: 'video/webm' })); });
    await stopRec(container);
    await act(async () => { fireEvent.click(btn(container, '下载视频')); });
    await waitFor(() => expect(mockSaveBytes).toHaveBeenCalledTimes(1));
    const [ name, bytes, opts ] = mockSaveBytes.mock.calls[0];
    expect(String(name)).toMatch(/^screen-recording-\d{8}-\d{6}\.webm$/);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect((bytes as Uint8Array).length).toBe(6);
    expect(opts).toMatchObject({ extensions: [ 'webm' ] });
  });

  it('重新录制清掉结果并释放临时 URL', async () => {
    const { container } = render(<ScreenRecorder />);
    await startRec(container);
    await act(async () => { lastRecorder().emit(new Blob([ 'abcdef' ], { type: 'video/webm' })); });
    await stopRec(container);
    expect(container.querySelector('.sr-video')).not.toBeNull();
    await act(async () => { fireEvent.click(btn(container, '重新录制')); });
    expect(container.querySelector('.sr-video')).toBeNull();
    expect(container.querySelector('.sr-empty')).not.toBeNull();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });
});

describe('屏幕录制 设置与计时', () => {
  it('参数改动后才可保存为默认设置', async () => {
    const { container } = render(<ScreenRecorder />);
    const save = () => btn(container, '保存为默认设置');
    expect(save()).toBeDisabled();
    await openSelect(0);
    await clickOption('60 fps');
    expect(save()).toBeEnabled();
    await act(async () => { fireEvent.click(save()); });
    expect(save()).toBeDisabled();
    expect(JSON.parse(localStorage.getItem(DEFAULTS_STORAGE_KEY) as string)).toMatchObject({ fps: 60 });
  });

  it('按保存的默认设置初始化 (帧率 / 声音 / 分辨率 / 前缀)', async () => {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify({
      fps: 60, bitrate: 2_000_000, audio: 'both', size: '720p', prefix: 'demo',
    }));
    const { container } = render(<ScreenRecorder />);
    expect(container.textContent).toContain('2 Mbps · 省空间');
    expect(container.textContent).toContain('系统声音 + 麦克风');
    expect(container.textContent).toContain('最高 720p');
    expect(btn(container, '保存为默认设置')).toBeDisabled();
    await startRec(container);
    expect(mockGetDisplayMedia.mock.calls[0][0]).toEqual({
      video: { frameRate: 60, height: { max: 720 }, width: { max: 1280 } },
      audio: true,
    });
  });

  it('录制计时刷新, 暂停时长不计入', async () => {
    jest.useFakeTimers();
    try {
      const { container } = render(<ScreenRecorder />);
      await startRec(container);
      expect(clockOf(container)).toBe('0:00');
      await act(async () => { jest.advanceTimersByTime(2000); });
      expect(clockOf(container)).toBe('0:02');
      await act(async () => { fireEvent.click(btn(container, '暂停')); });
      await act(async () => { jest.advanceTimersByTime(5000); });
      expect(clockOf(container)).toBe('0:02');
      await act(async () => { fireEvent.click(btn(container, '继续')); });
      await act(async () => { jest.advanceTimersByTime(1000); });
      expect(clockOf(container)).toBe('0:03');
      await stopRec(container);
      await act(async () => { lastRecorder().onstop?.(); });
    } finally {
      jest.useRealTimers();
    }
  });
});
