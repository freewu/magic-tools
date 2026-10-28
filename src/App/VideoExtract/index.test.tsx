import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import VideoExtract from './index';
import { cancelDownload, downloadMedia, fetchText, pickSavePath } from './fetch';
import { copyTextToClipboard } from '../../lib';

jest.mock('./fetch', () => ({
  fetchText: jest.fn(),
  downloadMedia: jest.fn(),
  pickSavePath: jest.fn(),
  cancelDownload: jest.fn(),
}));
const mockIsTauri = jest.fn(() => true);
jest.mock('../../lib/tauri', () => ({
  isTauri: () => mockIsTauri(),
  openUrl: jest.fn(),
}));
jest.mock('../../lib', () => ({
  copyTextToClipboard: jest.fn(),
}));

const mockFetch = fetchText as jest.Mock;
const mockDownload = downloadMedia as jest.Mock;
const mockPick = pickSavePath as jest.Mock;
const mockCancel = cancelDownload as jest.Mock;
const mockCopy = copyTextToClipboard as jest.Mock;

/** 抖音分享页 (内嵌 _ROUTER_DATA) */
const DOUYIN_HTML = `<html><head><title>抖音分享</title></head><body><script>window._ROUTER_DATA = {"loaderData":{"video_(id)/page":{"videoInfoRes":{"item_list":[{
  "desc":"抖音测试视频",
  "author":{"nickname":"抖音作者"},
  "video":{"play_addr":{"url_list":["https://v.douyin.com/play.mp4"]},
           "download_addr":{"url_list":["https://v.douyin.com/download.mp4"]},
           "cover":{"url_list":["https://p.douyin.com/c.jpg"]},
           "duration":15000}
}]}}}};</script></body></html>`;

/** B 站分享页 (DASH 音视频分离) */
const BILI_HTML = `<html><head><title>B 站</title></head><body>
<script>window.__playinfo__={"data":{"dash":{"video":[{"id":80,"baseUrl":"https://cdn/a.m4s","codecid":7}],"audio":[{"id":30280,"baseUrl":"https://cdn/b.m4a"}]}}};</script>
<script>window.__INITIAL_STATE__={"videoData":{"title":"B 站视频","duration":60,"owner":{"name":"UP"}}};</script>
</body></html>`;

const messageText = () => document.querySelector('.ant-message')?.textContent ?? '';
const urlBox = () => screen.getByPlaceholderText('粘贴分享链接或分享文案, 如 https://v.douyin.com/xxxxxx/');
const extractBtn = () => screen.getByRole('button', { name: /提\s*取/ });
const downloadBtn = () => screen.getAllByRole('button', { name: /下\s*载/ })[0];

const paste = (text: string) => fireEvent.change(urlBox(), { target: { value: text } });

beforeEach(() => {
  jest.clearAllMocks();
  mockIsTauri.mockReturnValue(true);
  mockFetch.mockResolvedValue({ text: DOUYIN_HTML, finalUrl: 'https://www.iesdouyin.com/share/video/1', contentType: 'text/html' });
  mockPick.mockResolvedValue('C:/tmp/out.mp4');
  mockDownload.mockResolvedValue(2048);
  message.destroy();
});

describe('VideoExtract - 输入与校验', () => {
  test('空输入只提示不抓取', async () => {
    render(<VideoExtract />);
    fireEvent.click(extractBtn());
    await waitFor(() => expect(messageText()).toContain('请先粘贴视频分享链接或分享文案'));
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('非 http(s) 链接直接提示', async () => {
    render(<VideoExtract />);
    paste('example.com/video');
    fireEvent.click(extractBtn());
    await waitFor(() => expect(messageText()).toContain('链接必须以 http:// 或 https:// 开头'));
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('快手链接提示暂不支持且不发起请求', async () => {
    render(<VideoExtract />);
    paste('https://v.kuaishou.com/abcd');
    fireEvent.click(extractBtn());
    await waitFor(() => expect(messageText()).toContain('暂不支持'));
    expect(messageText()).toContain('快手');
    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.getByText('该平台暂不支持自动解析')).toBeInTheDocument();
  });
});

describe('VideoExtract - 解析结果', () => {
  test('从整段分享文案里取出链接并展示结果', async () => {
    render(<VideoExtract />);
    paste('3.05 复制打开抖音, 看看 https://v.douyin.com/iAbCdEf/ 的视频');
    fireEvent.click(extractBtn());

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    // 链接被正确提取, 且带上平台 Referer
    expect(mockFetch).toHaveBeenCalledWith('https://v.douyin.com/iAbCdEf/', 'https://www.douyin.com/');

    expect(await screen.findByTestId('vx-title')).toHaveTextContent('抖音测试视频');
    expect(screen.getByText('作者: 抖音作者')).toBeInTheDocument();
    expect(screen.getByText('时长: 0:15')).toBeInTheDocument();
    expect(screen.getByText('直链数: 2')).toBeInTheDocument();
    await waitFor(() => expect(messageText()).toContain('解析成功: 共 2 条直链'));
    // 封面用无 referrer 加载, 避免平台校验
    expect(document.querySelector('.vx-cover')).toHaveAttribute('referrerpolicy', 'no-referrer');
  });

  test('B 站 DASH 结果展示视频 / 音频行与合并提示', async () => {
    mockFetch.mockResolvedValue({ text: BILI_HTML, finalUrl: 'https://www.bilibili.com/video/BV1xx', contentType: 'text/html' });
    render(<VideoExtract />);
    paste('https://www.bilibili.com/video/BV1xx');
    fireEvent.click(extractBtn());

    expect(await screen.findByTestId('vx-title')).toHaveTextContent('B 站视频');
    expect(screen.getByTestId('vx-platform')).toHaveTextContent('识别平台: 哔哩哔哩');
    expect(screen.getByText('视频')).toBeInTheDocument();
    expect(screen.getByText('音频')).toBeInTheDocument();
    expect(screen.getByTestId('vx-warnings')).toHaveTextContent('ffmpeg 合并');
  });

  test('解析失败展示错误原因', async () => {
    mockFetch.mockRejectedValue(new Error('服务器返回 HTTP 403'));
    render(<VideoExtract />);
    paste('https://www.bilibili.com/video/BV1xx');
    fireEvent.click(extractBtn());
    await waitFor(() => expect(messageText()).toContain('解析失败: 服务器返回 HTTP 403'));
  });

  test('没有直链时提示并保留说明', async () => {
    mockFetch.mockResolvedValue({ text: '<html><head><title>空页</title></head></html>', finalUrl: 'https://www.bilibili.com/video/BV1xx', contentType: 'text/html' });
    render(<VideoExtract />);
    paste('https://www.bilibili.com/video/BV1xx');
    fireEvent.click(extractBtn());
    await waitFor(() => expect(messageText()).toContain('没有解析到直链'));
    expect(await screen.findByTestId('vx-warnings')).toHaveTextContent('番剧');
  });

  test('复制直链写入剪贴板', async () => {
    render(<VideoExtract />);
    paste('https://v.douyin.com/iAbCdEf/');
    fireEvent.click(extractBtn());
    await screen.findByTestId('vx-title');

    fireEvent.click(screen.getAllByRole('button', { name: /复制直链/ })[0]);
    // 下载地址排在前面 (优先无水印), 复制第一条
    expect(mockCopy).toHaveBeenCalledWith('https://v.douyin.com/download.mp4');
    await waitFor(() => expect(messageText()).toContain('复制到粘贴板成功!!!'));
  });
});

describe('VideoExtract - 下载', () => {
  test('选好路径后带进度下载并提示保存成功', async () => {
    let finish: (n: number) => void = () => {};
    mockDownload.mockImplementation((opts: { onProgress?: (p: { written: number; total: number }) => void }) => new Promise<number>((resolve) => {
      finish = resolve;
      opts.onProgress?.({ written: 512, total: 1024 });
    }));

    render(<VideoExtract />);
    paste('https://v.douyin.com/iAbCdEf/');
    fireEvent.click(extractBtn());
    await screen.findByTestId('vx-title');

    fireEvent.click(downloadBtn());

    // 默认文件名: 标题 + 无清晰度 -> 标题.mp4
    await waitFor(() => expect(mockPick).toHaveBeenCalledWith('抖音测试视频.mp4'));
    await waitFor(() => expect(mockDownload).toHaveBeenCalledTimes(1));
    expect(mockDownload.mock.calls[0][0]).toMatchObject({
      url: 'https://v.douyin.com/download.mp4',
      referer: 'https://www.douyin.com/',
      dest: 'C:/tmp/out.mp4',
    });

    expect(await screen.findByTestId('vx-progress')).toHaveTextContent('已下载 512 B / 1 KB');

    finish(1024);
    await waitFor(() => expect(messageText()).toContain('已保存: 1 KB'));
    await waitFor(() => expect(screen.queryByTestId('vx-progress')).toBeNull());
  });

  test('取消保存对话框时不下载', async () => {
    mockPick.mockResolvedValue(null);
    render(<VideoExtract />);
    paste('https://v.douyin.com/iAbCdEf/');
    fireEvent.click(extractBtn());
    await screen.findByTestId('vx-title');

    fireEvent.click(downloadBtn());
    await waitFor(() => expect(mockPick).toHaveBeenCalled());
    expect(mockDownload).not.toHaveBeenCalled();
  });

  test('下载失败提示原因并清空进度', async () => {
    mockDownload.mockRejectedValue(new Error('写入文件失败'));
    render(<VideoExtract />);
    paste('https://v.douyin.com/iAbCdEf/');
    fireEvent.click(extractBtn());
    await screen.findByTestId('vx-title');

    fireEvent.click(downloadBtn());
    await waitFor(() => expect(messageText()).toContain('下载失败: 写入文件失败'));
    expect(screen.queryByTestId('vx-progress')).toBeNull();
  });

  test('下载中可取消', async () => {
    mockDownload.mockImplementation(() => new Promise<number>(() => {}));
    render(<VideoExtract />);
    paste('https://v.douyin.com/iAbCdEf/');
    fireEvent.click(extractBtn());
    await screen.findByTestId('vx-title');

    fireEvent.click(downloadBtn());
    await screen.findByTestId('vx-progress');
    fireEvent.click(screen.getByRole('button', { name: /取\s*消/ }));

    await waitFor(() => expect(mockCancel).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(messageText()).toContain('已取消下载'));
  });
});

describe('VideoExtract - 浏览器演示版', () => {
  test('非桌面端展示提示并禁用提取', async () => {
    mockIsTauri.mockReturnValue(false);
    render(<VideoExtract />);
    expect(screen.getByText('该功能仅在桌面应用中可用')).toBeInTheDocument();
    expect(extractBtn()).toBeDisabled();

    paste('https://v.douyin.com/iAbCdEf/');
    fireEvent.click(extractBtn());
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
