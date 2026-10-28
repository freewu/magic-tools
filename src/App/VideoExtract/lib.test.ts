import '@testing-library/jest-dom';
import {
  detectPlatform, extractUrl, fetchPlan, formatBytes, formatDuration, genericStreams, hostOf, isPlatformSupported,
  looksLikeVideoUrl, mediaFileName, parseBilibili, parseEmbeddedVideo, parseGeneric, parseTwitter, parseVimeo,
  parseWeibo, parseYouTube, readJsonAfter, readLooseJson, safeFileName, sliceBalanced, twitterStatusId, UNKNOWN_PLATFORM,
  walkJson, type MediaInfo, type MediaStream,
} from './lib';

const streamOf = (info: MediaInfo, kind: MediaStream['kind']) => info.streams.filter((s) => s.kind === kind);

describe('链接处理', () => {
  test('从分享文案里取出链接并去掉尾随中文标点', () => {
    expect(extractUrl('3.05 复制打开抖音, 看看 https://v.douyin.com/iAbCdEf/ 的视频')).toBe('https://v.douyin.com/iAbCdEf/');
    expect(extractUrl('看这个 https://www.bilibili.com/video/BV1xx411c7mD，很有意思')).toBe('https://www.bilibili.com/video/BV1xx411c7mD');
    expect(extractUrl('（https://x.com/a/status/1）')).toBe('https://x.com/a/status/1');
    expect(extractUrl('没有链接的一段话')).toBe('');
    expect(extractUrl('')).toBe('');
  });

  test('按域名识别平台', () => {
    expect(detectPlatform('https://www.bilibili.com/video/BV1xx').id).toBe('bilibili');
    expect(detectPlatform('https://b23.tv/abcd').id).toBe('bilibili');
    expect(detectPlatform('https://v.douyin.com/abcd/').id).toBe('douyin');
    expect(detectPlatform('https://www.tiktok.com/@a/video/1').id).toBe('tiktok');
    expect(detectPlatform('https://xhslink.com/abcd').id).toBe('xiaohongshu');
    expect(detectPlatform('https://x.com/a/status/1').id).toBe('twitter');
    expect(detectPlatform('https://vimeo.com/12345').id).toBe('vimeo');
    expect(detectPlatform('https://youtu.be/abcd').id).toBe('youtube');
    expect(detectPlatform('https://example.com/v.mp4')).toBe(UNKNOWN_PLATFORM);
    expect(detectPlatform('not a url').id).toBe('generic');
  });

  test('主机名解析: 非法地址返回空串', () => {
    expect(hostOf('https://Sub.Example.COM/x')).toBe('sub.example.com');
    expect(hostOf('nope')).toBe('');
  });

  test('快手等平台标记为暂不支持', () => {
    const kuaishou = detectPlatform('https://v.kuaishou.com/abcd');
    expect(isPlatformSupported(kuaishou)).toBe(false);
    expect(looksLikeVideoUrl('https://v.kuaishou.com/abcd')).toBe(false);
    expect(isPlatformSupported(detectPlatform('https://www.bilibili.com/video/BV1'))).toBe(true);
    expect(looksLikeVideoUrl('https://example.com/video')).toBe(true);
  });

  test('X 的抓取计划走 syndication 接口', () => {
    const twitter = detectPlatform('https://x.com/alice/status/1234567890');
    expect(twitterStatusId('https://x.com/alice/status/1234567890')).toBe('1234567890');
    expect(twitterStatusId('https://x.com/alice')).toBe('');
    const plans = fetchPlan('https://x.com/alice/status/1234567890', twitter);
    expect(plans).toHaveLength(2);
    expect(plans[0].json).toBe(true);
    expect(plans[0].url).toContain('1234567890');

    const bili = detectPlatform('https://www.bilibili.com/video/BV1xx');
    expect(fetchPlan('https://www.bilibili.com/video/BV1xx', bili)).toEqual([ { url: 'https://www.bilibili.com/video/BV1xx' } ]);
    // 缺少 status id 时不生成计划
    expect(fetchPlan('https://x.com/alice', twitter)).toEqual([]);
  });
});

describe('页面数据提取', () => {
  test('sliceBalanced 按括号深度截取, 字符串里的括号不干扰', () => {
    const text = '前 __X__={"a":{"b":"}}"},"c":[1,2]} 后';
    const start = text.indexOf('{');
    expect(sliceBalanced(text, start)).toBe('{"a":{"b":"}}"},"c":[1,2]}');
    expect(sliceBalanced(text, -1)).toBe('');
    expect(sliceBalanced('abc', 0)).toBe('');
    // 未闭合时返回空串
    expect(sliceBalanced('{"a":1', 0)).toBe('');
  });

  test('readJsonAfter 跳过等号与空白', () => {
    const html = '<script>window.__P__ = {"x":1}</script>';
    expect(readJsonAfter<any>(html, 'window.__P__')).toEqual({ x: 1 });
    expect(readJsonAfter(html, 'window.__MISSING__')).toBeNull();
    expect(readJsonAfter('<script>window.__P__ = 非法</script>', 'window.__P__')).toBeNull();
  });

  test('readLooseJson 把 undefined 字面量替换成 null', () => {
    const html = '<script>window.__INITIAL_STATE__={"a":undefined,"b":1}</script>';
    expect(readLooseJson<any>(html, 'window.__INITIAL_STATE__')).toEqual({ a: null, b: 1 });
  });

  test('walkJson 遍历嵌套对象且不重复访问', () => {
    const visited: string[] = [];
    const root: any = { name: 'root', child: { name: 'child' }, list: [ { name: 'item' } ] };
    root.self = root;
    walkJson(root, (obj) => { visited.push(String(obj.name)); });
    expect(visited.sort()).toEqual([ 'child', 'item', 'root' ]);
  });
});

describe('B 站解析', () => {
  const html = `<html><head><title>页面标题</title></head><body>
<script>window.__playinfo__={"data":{"dash":{"video":[{"id":80,"baseUrl":"https://cdn/a.m4s","codecid":7,"height":1080}],"audio":[{"id":30280,"baseUrl":"https://cdn/b.m4a","codecs":"mp4a.40.2"}]}}};</script>
<script>window.__INITIAL_STATE__={"videoData":{"title":"测试视频","duration":125,"owner":{"name":"某UP主"},"pic":"https://i0.hdslb.com/p.jpg"}};</script>
</body></html>`;

  test('DASH 音视频分离时给出视频轨 / 音轨与提示', () => {
    const info = parseBilibili(html, 'https://www.bilibili.com/video/BV1xx');
    expect(info.platform).toBe('bilibili');
    expect(info.title).toBe('测试视频');
    expect(info.author).toBe('某UP主');
    expect(info.cover).toBe('https://i0.hdslb.com/p.jpg');
    expect(info.duration).toBe(125);
    expect(info.streams).toHaveLength(2);
    expect(streamOf(info, 'video')[0]).toMatchObject({ quality: '1080P', codec: 'H.264', ext: 'm4s' });
    expect(streamOf(info, 'audio')[0]).toMatchObject({ quality: '192K', ext: 'm4a' });
    expect(info.warnings.join()).toContain('ffmpeg 合并');
    expect(info.referer).toBe('https://www.bilibili.com/');
  });

  test('durl 合流时给出可播放的整段文件', () => {
    const durlHtml = `<html><body><script>window.__playinfo__={"data":{"durl":[{"url":"https://cdn/x.flv","size":1048576}]}};</script>
<title>合流视频</title></body></html>`;
    const info = parseBilibili(durlHtml, 'https://www.bilibili.com/video/BV1yy');
    expect(info.streams).toHaveLength(1);
    expect(info.streams[0]).toMatchObject({ kind: 'muxed', ext: 'flv', size: 1048576 });
    expect(info.title).toBe('合流视频');
    expect(info.warnings).toEqual([]);
  });

  test('没有播放地址时给出登录 / 付费提示', () => {
    const info = parseBilibili('<html><head><meta property="og:title" content="付费番剧"></head></html>', 'https://www.bilibili.com/bangumi/play/ep1');
    expect(info.streams).toHaveLength(0);
    expect(info.title).toBe('付费番剧');
    expect(info.warnings.join()).toContain('番剧');
  });
});

describe('X / Twitter 解析', () => {
  const json = JSON.stringify({
    text: 'hello  video  world',
    user: { name: 'Alice', screen_name: 'alice' },
    mediaDetails: [ {
      media_url_https: 'https://pbs.twimg.com/c.jpg',
      video_info: {
        duration_millis: 125000,
        variants: [
          { content_type: 'application/x-mpegURL', url: 'https://video.twimg.com/c.m3u8' },
          { bitrate: 2176000, content_type: 'video/mp4', url: 'https://video.twimg.com/hi.mp4' },
        ],
      },
    } ],
  });

  test('取 mp4 / m3u8 变体与时长', () => {
    const info = parseTwitter(json, 'https://x.com/alice/status/1');
    expect(info.platform).toBe('twitter');
    expect(info.title).toBe('hello video world');
    expect(info.author).toBe('Alice');
    expect(info.cover).toBe('https://pbs.twimg.com/c.jpg');
    expect(info.duration).toBe(125);
    expect(info.streams).toHaveLength(2);
    expect(info.streams[0]).toMatchObject({ ext: 'm3u8', quality: 'HLS' });
    expect(info.streams[1]).toMatchObject({ ext: 'mp4', quality: '2176 kbps', kind: 'muxed' });
    expect(info.warnings).toEqual([]);
  });

  test('纯图片推文提示没有视频', () => {
    const info = parseTwitter(JSON.stringify({ text: 'only images', user: { name: 'B' } }), 'https://x.com/b/status/2');
    expect(info.streams).toHaveLength(0);
    expect(info.warnings.join()).toContain('没有视频');
  });

  test('非法 JSON 不抛异常', () => {
    const info = parseTwitter('<html>not json</html>', 'https://x.com/c/status/3');
    expect(info.streams).toHaveLength(0);
  });
});

describe('分享页内嵌 JSON 解析 (抖音 / TikTok / 小红书)', () => {
  const routerHtml = `<html><body><script>window._ROUTER_DATA = {"loaderData":{"video_(id)/page":{"videoInfoRes":{"item_list":[{
    "desc":"抖音测试视频 #测试",
    "author":{"nickname":"抖音作者"},
    "video":{"play_addr":{"url_list":["https://v.douyin.com/play.mp4"]},
             "download_addr":{"url_list":["https://v.douyin.com/download.mp4"]},
             "cover":{"url_list":["https://p.douyin.com/c.jpg"]},
             "duration":15000}
  }]}}}};</script><title>抖音</title></body></html>`;

  test('抖音: 播放 / 下载地址去重, 标题作者封面时长', () => {
    const info = parseEmbeddedVideo(routerHtml, 'https://www.iesdouyin.com/share/video/1', 'douyin', 'https://www.douyin.com/');
    expect(info.platform).toBe('douyin');
    expect(info.title).toContain('抖音测试视频');
    expect(info.author).toBe('抖音作者');
    expect(info.cover).toBe('https://p.douyin.com/c.jpg');
    // 15000ms -> 15s
    expect(info.duration).toBe(15);
    expect(info.streams.map((s) => s.url)).toEqual([ 'https://v.douyin.com/download.mp4', 'https://v.douyin.com/play.mp4' ]);
    expect(info.warnings).toEqual([]);
    expect(info.referer).toBe('https://www.douyin.com/');
  });

  test('小红书: RENDER_DATA (URL 编码) 里的视频', () => {
    const data = encodeURIComponent(JSON.stringify({ note: { title: '小红书标题', video: { media: { stream: { h264: [ { masterUrl: 'https://sns.xhscdn.com/v.mp4' } ] } } } } }));
    const html = `<html><body><script id="RENDER_DATA" type="application/json">${data}</script></body></html>`;
    const info = parseEmbeddedVideo(html, 'https://www.xiaohongshu.com/explore/1', 'xiaohongshu', 'https://www.xiaohongshu.com/');
    expect(info.streams.map((s) => s.url)).toEqual([ 'https://sns.xhscdn.com/v.mp4' ]);
    expect(info.title).toBe('小红书标题');
  });

  test('解析不出地址时给出提示而不是空结果', () => {
    const info = parseEmbeddedVideo('<html><head><title>空页面</title></head></html>', 'https://www.tiktok.com/@a/video/1', 'tiktok', 'https://www.tiktok.com/');
    expect(info.streams).toHaveLength(0);
    expect(info.title).toBe('空页面');
    expect(info.warnings.join()).toContain('没解析出播放地址');
  });
});

describe('微博 / Vimeo / YouTube / 通用网页', () => {
  test('微博: 提取 mp4 直链与 og 封面', () => {
    const html = `<html><head><meta property="og:title" content="微博视频"><meta property="og:image" content="https://wx/c.jpg"></head>
<body><video src="https://f.video.weibocdn.com/o0/x.mp4?label=mp4_720p"></video>
<script>https:\\/\\/f.video.weibocdn.com\\/o0\\/y.mp4?label=mp4_hd</script></body></html>`;
    const info = parseWeibo(html, 'https://weibo.com/tv/show/1');
    expect(info.title).toBe('微博视频');
    expect(info.cover).toBe('https://wx/c.jpg');
    expect(info.streams.length).toBeGreaterThanOrEqual(1);
    expect(info.streams[0].url).toContain('f.video.weibocdn.com');
    expect(info.referer).toBe('https://weibo.com/');
  });

  test('Vimeo: playerConfig 里的 progressive 直链', () => {
    const html = `<html><body><script>window.playerConfig={"video":{"title":"Vimeo 片","duration":10,"owner":{"name":"作者"},"thumbs":{"640":"https://i.vimeo.com/640.jpg"}},"request":{"files":{"progressive":[
      {"url":"https://v.vimeocdn.com/1080.mp4","quality":"1080p","mime":"video/mp4","height":1080},
      {"url":"https://v.vimeocdn.com/audio.m4a","quality":"audio","mime":"audio/mp4"}
    ]}}};</script></body></html>`;
    const info = parseVimeo(html, 'https://vimeo.com/12345');
    expect(info.title).toBe('Vimeo 片');
    expect(info.author).toBe('作者');
    expect(info.cover).toBe('https://i.vimeo.com/640.jpg');
    expect(info.duration).toBe(10);
    expect(info.streams.map((s) => s.kind)).toEqual([ 'muxed', 'audio' ]);
  });

  test('YouTube: 合流与自适应轨分别标注', () => {
    const html = `<html><body><script>var ytInitialPlayerResponse = {"videoDetails":{"title":"YT 片","author":"频道","lengthSeconds":"42","thumbnail":{"thumbnails":[{"url":"https://i.ytimg.com/1.jpg"},{"url":"https://i.ytimg.com/2.jpg"}]}},
      "streamingData":{"formats":[{"url":"https://v.googlevideo.com/a.mp4","mimeType":"video/mp4; codecs=\\"avc1\\"","qualityLabel":"720p"}],
      "adaptiveFormats":[{"url":"https://v.googlevideo.com/b.m4a","mimeType":"audio/mp4","audioQuality":"AUDIO_QUALITY_MEDIUM"}]}};</script></body></html>`;
    const info = parseYouTube(html, 'https://www.youtube.com/watch?v=1');
    expect(info.title).toBe('YT 片');
    expect(info.author).toBe('频道');
    expect(info.cover).toBe('https://i.ytimg.com/2.jpg');
    expect(info.duration).toBe(42);
    expect(info.streams.map((s) => s.kind)).toEqual([ 'muxed', 'audio' ]);
    expect(info.streams[1].quality).toBe('MEDIUM');
    expect(info.warnings).toEqual([]);
  });

  test('YouTube 没有直链时提示改用 yt-dlp', () => {
    const info = parseYouTube('<html><head><meta property="og:title" content="需要签名"></head></html>', 'https://www.youtube.com/watch?v=2');
    expect(info.streams).toHaveLength(0);
    expect(info.warnings.join()).toContain('yt-dlp');
  });

  test('通用网页: og:video / <video> / JSON-LD', () => {
    const html = `<html><head><meta property="og:title" content="通用页"><meta property="og:video" content="https://cdn.example.com/og.mp4">
      <meta property="og:image" content="https://cdn.example.com/c.jpg"></head><body>
      <video src="https://cdn.example.com/tag.mp4"></video>
      <script type="application/ld+json">{"contentUrl":"https://cdn.example.com/ld.mp4"}</script></body></html>`;
    expect(genericStreams(html).map((s) => s.url)).toEqual([
      'https://cdn.example.com/og.mp4',
      'https://cdn.example.com/tag.mp4',
      'https://cdn.example.com/ld.mp4',
    ]);
    const info = parseGeneric(html, 'https://example.com/post/1');
    expect(info.title).toBe('通用页');
    expect(info.cover).toBe('https://cdn.example.com/c.jpg');
    expect(info.streams).toHaveLength(3);
    expect(info.warnings).toEqual([]);
  });

  test('通用网页没找到直链时给出提示', () => {
    const info = parseGeneric('<html><head><title>纯文字页</title></head></html>', 'https://example.com/p');
    expect(info.streams).toHaveLength(0);
    expect(info.title).toBe('纯文字页');
    expect(info.warnings.join()).toContain('没有找到视频直链');
  });

  test('通用识别跳过 data: / blob: 地址', () => {
    const html = '<html><body><video src="blob:https://x/1"></video><video src="data:video/mp4;base64,AA"></video></body></html>';
    expect(genericStreams(html)).toHaveLength(0);
  });
});

describe('展示与文件名', () => {
  test('时长格式化', () => {
    expect(formatDuration(0)).toBe('--:--');
    expect(formatDuration(undefined)).toBe('--:--');
    expect(formatDuration(-5)).toBe('--:--');
    expect(formatDuration(75)).toBe('1:15');
    expect(formatDuration(3725)).toBe('1:02:05');
  });

  test('体积格式化', () => {
    expect(formatBytes(undefined)).toBe('--');
    expect(formatBytes(0)).toBe('--');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(12 * 1024 * 1024)).toBe('12 MB');
  });

  test('文件名去掉非法字符并保留清晰度', () => {
    expect(safeFileName('a/b:c*d?"e"<f>g|h')).toBe('a b c d e f g h');
    expect(safeFileName('   ')).toBe('video');
    expect(safeFileName('x'.repeat(200))).toHaveLength(80);
    const info = { title: '测试/视频', platform: 'x', pageUrl: '', streams: [], warnings: [] } as unknown as MediaInfo;
    expect(mediaFileName(info, { id: '1', kind: 'video', url: '', quality: '1080P', ext: 'm4s' })).toBe('测试 视频-1080P.m4s');
    expect(mediaFileName(info, { id: '2', kind: 'audio', url: '' })).toBe('测试 视频.m4a');
  });
});
