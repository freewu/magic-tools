// 视频提取网络层: 断言 invoke 参数映射 / Base64 解码 / 浏览器拦截
import { cancelDownload, downloadMedia, fetchText, pickSavePath } from './fetch';

const mockInvoke = jest.fn();
const mockIsTauri = jest.fn(() => true);

jest.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
  Channel: class {
    onmessage: ((v: unknown) => void) | null = null;
  },
}));
jest.mock('../../lib/tauri', () => ({
  isTauri: () => mockIsTauri(),
}));
jest.mock('@tauri-apps/plugin-dialog', () => ({ save: jest.fn() }));

const b64 = (text: string) => Buffer.from(text, 'utf-8').toString('base64');

beforeEach(() => {
  jest.clearAllMocks();
  mockIsTauri.mockReturnValue(true);
});

describe('fetchText', () => {
  test('桌面端走 media_fetch 并按 UTF-8 解码', async () => {
    mockInvoke.mockResolvedValue({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      finalUrl: 'https://www.bilibili.com/video/BV1xx',
      base64: b64('<html>中文页面</html>'),
    });

    const res = await fetchText('https://b23.tv/abcd', 'https://www.bilibili.com/');
    expect(mockInvoke).toHaveBeenCalledWith('media_fetch', { url: 'https://b23.tv/abcd', referer: 'https://www.bilibili.com/' });
    expect(res.text).toBe('<html>中文页面</html>');
    expect(res.finalUrl).toBe('https://www.bilibili.com/video/BV1xx');
    expect(res.contentType).toContain('text/html');
  });

  test('未给 referer 时传 null (Rust 侧 Option)', async () => {
    mockInvoke.mockResolvedValue({ status: 200, contentType: null, finalUrl: '', base64: b64('{}') });
    await fetchText('https://example.com/x');
    expect(mockInvoke).toHaveBeenCalledWith('media_fetch', { url: 'https://example.com/x', referer: null });
  });

  test('非 http(s) 链接不发起请求', async () => {
    await expect(fetchText('file:///etc/passwd')).rejects.toThrow('链接必须以 http:// 或 https:// 开头');
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  test('浏览器环境退回 fetch, HTTP 错误抛出状态码', async () => {
    mockIsTauri.mockReturnValue(false);
    const okResp = { ok: true, status: 200, url: 'https://example.com/final', text: async () => '<html>ok</html>', headers: { get: () => 'text/html' } };
    const fetchMock = jest.fn().mockResolvedValue(okResp);
    (global as unknown as { fetch: unknown }).fetch = fetchMock;

    const res = await fetchText('https://example.com/x');
    expect(fetchMock).toHaveBeenCalledWith('https://example.com/x');
    expect(res.text).toBe('<html>ok</html>');
    expect(res.finalUrl).toBe('https://example.com/final');
    expect(mockInvoke).not.toHaveBeenCalled();

    fetchMock.mockResolvedValue({ ...okResp, ok: false, status: 403 });
    await expect(fetchText('https://example.com/x')).rejects.toThrow('服务器返回 HTTP 403');
  });
});

describe('downloadMedia', () => {
  test('桌面端把进度回调包成 Channel 传入', async () => {
    mockInvoke.mockResolvedValue(2048);
    const onProgress = jest.fn();
    const bytes = await downloadMedia({ url: 'https://cdn/x.mp4', referer: 'https://www.douyin.com/', dest: 'C:/tmp/x.mp4', onProgress });

    expect(bytes).toBe(2048);
    const [ cmd, args ] = mockInvoke.mock.calls[0];
    expect(cmd).toBe('media_download');
    expect(args).toMatchObject({ url: 'https://cdn/x.mp4', referer: 'https://www.douyin.com/', dest: 'C:/tmp/x.mp4' });
    // Channel 实例: 触发 onmessage 应转给调用方
    expect(typeof args.onProgress.onmessage).toBe('function');
    args.onProgress.onmessage({ written: 512, total: 2048 });
    expect(onProgress).toHaveBeenCalledWith({ written: 512, total: 2048 });
  });

  test('没有 onProgress 时也传 Channel (不注册回调)', async () => {
    mockInvoke.mockResolvedValue(1);
    await downloadMedia({ url: 'https://cdn/x.mp4', dest: 'C:/tmp/x.mp4' });
    const args = mockInvoke.mock.calls[0][1];
    expect(args.referer).toBeNull();
    expect(args.onProgress.onmessage).toBeNull();
  });

  test('浏览器环境直接拒绝下载', async () => {
    mockIsTauri.mockReturnValue(false);
    await expect(downloadMedia({ url: 'https://cdn/x.mp4', dest: 'x.mp4' })).rejects.toThrow('浏览器演示版不支持下载');
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  test('取消下载: 桌面端调用 media_download_cancel, 浏览器端静默', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await cancelDownload();
    expect(mockInvoke).toHaveBeenCalledWith('media_download_cancel');

    mockInvoke.mockClear();
    mockIsTauri.mockReturnValue(false);
    await cancelDownload();
    expect(mockInvoke).not.toHaveBeenCalled();
  });
});

describe('pickSavePath', () => {
  test('桌面端调用系统保存对话框并返回路径', async () => {
    const { save } = await import('@tauri-apps/plugin-dialog');
    (save as unknown as jest.Mock).mockResolvedValue('C:/tmp/out.mp4');

    await expect(pickSavePath('视频.mp4')).resolves.toBe('C:/tmp/out.mp4');
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ defaultPath: '视频.mp4' }));
  });

  test('用户取消返回 null, 浏览器端直接 null', async () => {
    const { save } = await import('@tauri-apps/plugin-dialog');
    (save as unknown as jest.Mock).mockResolvedValue(null);
    await expect(pickSavePath('视频.mp4')).resolves.toBeNull();

    mockIsTauri.mockReturnValue(false);
    await expect(pickSavePath('视频.mp4')).resolves.toBeNull();
  });
});
