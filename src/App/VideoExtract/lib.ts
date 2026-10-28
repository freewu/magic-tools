// 视频提取: 纯解析逻辑 (不做任何网络请求, 全部可单测)
//
// 思路参考 qiaomu-download (https://github.com/joeseesun/qiaomu-download):
// 拿到分享链接 -> 解析出媒体信息 (标题 / 作者 / 封面 / 直链) -> 交给用户保存。
// 区别在于本工具不依赖 yt-dlp, 而是直接读各平台分享页里内嵌的播放数据;
// 因此只覆盖公开可访问的内容, 需要登录 / 付费 / DRM 的场景会给明确提示。

/** 流类型 */
export type StreamKind = 'video' | 'audio' | 'muxed';

/** 一条可下载的媒体直链 */
export type MediaStream = {
  /** 列表内唯一 id */
  id: string;
  /** 视频 / 音频 / 合流 (音视频同一个文件) */
  kind: StreamKind;
  /** 直链地址 */
  url: string;
  /** 清晰度文案, 如 1080P / 720P / 192K */
  quality?: string;
  /** 编码, 如 H.264 / H.265 / AV1 / AAC */
  codec?: string;
  /** 文件大小 (字节, 平台给出时才有) */
  size?: number;
  /** 容器 / 扩展名, 如 mp4 / m4s / m4a / m3u8 */
  ext?: string;
  /** 附加说明, 如 DASH 音视频分离需合并 */
  note?: string;
};

/** 解析结果 */
export type MediaInfo = {
  /** 平台 id */
  platform: string;
  /** 标题 */
  title: string;
  /** 作者 / UP 主 */
  author?: string;
  /** 封面图地址 */
  cover?: string;
  /** 时长 (秒) */
  duration?: number;
  /** 页面最终地址 (短链解析后) */
  pageUrl: string;
  /** 媒体流列表 */
  streams: MediaStream[];
  /** 提示 / 告警 (需要登录、需合并等) */
  warnings: string[];
  /** 下载直链时需要带的 Referer (部分 CDN 会校验) */
  referer?: string;
};

/** 平台定义 */
export type Platform = {
  id: string;
  name: string;
  hosts: string[];
  /** 下载直链时需要带的 Referer */
  referer?: string;
};

/** 支持的平台 (域名匹配按后缀, 越具体的放前面) */
export const PLATFORMS: Platform[] = [
  { id: 'bilibili', name: '哔哩哔哩', hosts: [ 'bilibili.com', 'b23.tv', 'bili2233.cn' ], referer: 'https://www.bilibili.com/' },
  { id: 'douyin', name: '抖音', hosts: [ 'douyin.com', 'iesdouyin.com' ], referer: 'https://www.douyin.com/' },
  { id: 'tiktok', name: 'TikTok', hosts: [ 'tiktok.com' ], referer: 'https://www.tiktok.com/' },
  { id: 'xiaohongshu', name: '小红书', hosts: [ 'xiaohongshu.com', 'xhslink.com' ], referer: 'https://www.xiaohongshu.com/' },
  { id: 'weibo', name: '微博', hosts: [ 'weibo.com', 'weibo.cn', 'video.weibo.com' ], referer: 'https://weibo.com/' },
  { id: 'twitter', name: 'X / Twitter', hosts: [ 'x.com', 'twitter.com', 't.co' ] },
  { id: 'vimeo', name: 'Vimeo', hosts: [ 'vimeo.com' ] },
  { id: 'youtube', name: 'YouTube', hosts: [ 'youtube.com', 'youtu.be' ] },
  { id: 'kuaishou', name: '快手', hosts: [ 'kuaishou.com', 'gifshow.com', 'chenzhongtech.com' ] },
];

/** 未知平台的占位信息 */
export const UNKNOWN_PLATFORM: Platform = { id: 'generic', name: '通用网页', hosts: [] };

/** 暂不支持自动解析的平台 (只做链接识别与提示) */
export const UNSUPPORTED_PLATFORMS = [ 'kuaishou' ];

/**
 * 从分享文案里取出第一个链接
 * (各平台分享文案形如「3.05 复制打开抖音... https://v.douyin.com/xxx/ 看看」)
 */
export const extractUrl = (text: string): string => {
  // URL 里不会出现中日韩字符与全角标点, 遇到即判定链接结束
  // (分享文案常见形式: 「看这个 https://... ，很有意思」, 链接与中文直接相连)
  const m = /(https?:\/\/[^\s"'<>\\^`{|}\u3000-\u303F\u4E00-\u9FFF\uFF00-\uFFEF]+)/i.exec(String(text ?? ''));
  if (!m) return '';
  // 去掉粘连的英文标点 / 括号
  return m[1].replace(/[)\]}>,;:!?"']+$/, '');
};

/** 取主机名 (非法 URL 返回空串) */
export const hostOf = (url: string): string => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
};

/** 识别平台 (按域名后缀匹配) */
export const detectPlatform = (url: string): Platform => {
  const host = hostOf(url);
  if (host === '') return UNKNOWN_PLATFORM;
  for (const p of PLATFORMS) {
    for (const h of p.hosts) {
      if (host === h || host.endsWith('.' + h)) return p;
    }
  }
  return UNKNOWN_PLATFORM;
};

/** 平台是否支持自动解析 */
export const isPlatformSupported = (platform: Platform): boolean => !UNSUPPORTED_PLATFORMS.includes(platform.id);

// ---------------------------------------------------------------------------
// 通用文本 / JSON 工具
// ---------------------------------------------------------------------------

/** 安全 JSON.parse */
export const safeJson = <T = any>(text: string | undefined | null): T | null => {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
};

/**
 * 从 start (必须指向 '{' 或 '[') 开始截取一段平衡的 JSON 文本
 * (页面里是 `window.__X__={...}` 这种赋值, 无法直接 JSON.parse 整个脚本)
 */
export const sliceBalanced = (text: string, start: number): string => {
  if (start < 0 || start >= text.length) return '';
  const open = text[start];
  const close = open === '{' ? '}' : open === '[' ? ']' : '';
  if (close === '') return '';
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === open) depth += 1;
    else if (ch === close) {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return '';
};

/** 读取形如 `window.__X__=` / `"__X__":` 后面的一段 JSON */
export const readJsonAfter = <T = any>(html: string, marker: string): T | null => {
  const at = html.indexOf(marker);
  if (at < 0) return null;
  let i = at + marker.length;
  // 跳过空白与等号
  while (i < html.length && (html[i] === ' ' || html[i] === '=' || html[i] === ':' || html[i] === '\n' || html[i] === '\r' || html[i] === '\t')) i += 1;
  const raw = sliceBalanced(html, i);
  return raw === '' ? null : safeJson<T>(raw);
};

/** 读取 <script id="X" type="application/json">…</script> 里的 JSON */
export const readScriptJson = <T = any>(html: string, id: string): T | null => {
  const re = new RegExp(`<script[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)</script>`, 'i');
  const m = re.exec(html);
  if (!m) return null;
  return safeJson<T>(m[1].trim());
};

/** 小红书等页面的 `__INITIAL_STATE__` 里含非法字面量 undefined, 先替换再解析 */
export const readLooseJson = <T = any>(html: string, marker: string): T | null => {
  const at = html.indexOf(marker);
  if (at < 0) return null;
  let i = at + marker.length;
  while (i < html.length && /[\s=:]/.test(html[i])) i += 1;
  const raw = sliceBalanced(html, i);
  return raw === '' ? null : safeJson<T>(raw.replace(/([:\[,]\s*)undefined(?=\s*[,\]}])/g, '$1null'));
};

/** HTML 实体反转义 (只处理常见的几种) */
export const decodeEntities = (text: string): string => String(text ?? '')
  .replace(/&quot;/g, '"')
  .replace(/&#34;/g, '"')
  .replace(/&apos;/g, "'")
  .replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&');

/** 取某个 meta 的 content (property / name 均可) */
export const metaContent = (html: string, key: string): string => {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'i');
  const tag = re.exec(html);
  if (!tag) return '';
  const c = /content=["']([\s\S]*?)["']/i.exec(tag[0]);
  return c ? decodeEntities(c[1]).trim() : '';
};

/** 取 <title> */
export const pageTitle = (html: string): string => {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return m ? decodeEntities(m[1]).replace(/\s+/g, ' ').trim() : '';
};

/** 把 `\u002F` / `\/` 之类的转义还原成正常链接 */
export const unescapeUrl = (url: string): string => String(url ?? '')
  .replace(/\\u002F/gi, '/')
  .replace(/\\u0026/gi, '&')
  .replace(/\\\//g, '/')
  .replace(/^\/\//, 'https://');

/**
 * 深度遍历 JSON, 对每个对象调用 visit
 * (各平台数据结构改版频繁, 按结构特征找比按固定路径找更耐用)
 */
export const walkJson = (root: unknown, visit: (obj: Record<string, any>) => void, maxDepth = 24): void => {
  const seen = new Set<unknown>();
  const stack: { node: unknown; depth: number }[] = [ { node: root, depth: 0 } ];
  while (stack.length > 0) {
    const { node, depth } = stack.pop()!;
    if (node === null || typeof node !== 'object' || depth > maxDepth) continue;
    if (seen.has(node)) continue;
    seen.add(node);

    if (Array.isArray(node)) {
      for (const item of node) stack.push({ node: item, depth: depth + 1 });
      continue;
    }
    visit(node as Record<string, any>);
    for (const value of Object.values(node as Record<string, any>)) {
      if (value !== null && typeof value === 'object') stack.push({ node: value, depth: depth + 1 });
    }
  }
};

/** 从 url_list / urlList 结构里取第一个可用链接 */
const pickUrl = (node: any): string => {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) {
    for (const item of node) {
      const u = pickUrl(item);
      if (u !== '') return u;
    }
    return '';
  }
  if (node && typeof node === 'object') {
    for (const key of [ 'url_list', 'urlList', 'url', 'src', 'masterUrl', 'master_url', 'backup_url' ]) {
      if (key in node) {
        const u = pickUrl(node[key]);
        if (u !== '') return u;
      }
    }
  }
  return '';
};

// ---------------------------------------------------------------------------
// 时长 / 体积 / 文件名
// ---------------------------------------------------------------------------

/** 秒 -> 1:02:03 */
export const formatDuration = (seconds?: number): string => {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return '--:--';
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

/** 字节 -> 12.3 MB */
export const formatBytes = (bytes?: number): string => {
  if (bytes === undefined || !Number.isFinite(bytes) || bytes <= 0) return '--';
  const units = [ 'B', 'KB', 'MB', 'GB' ];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const shown = value >= 100 || unit === 0 || Number.isInteger(value) ? Math.round(value) : value.toFixed(1);
  return `${shown} ${units[unit]}`;
};

/** 文件名里不能出现的字符统一替换掉 */
export const safeFileName = (name: string): string => String(name ?? '')
  .replace(/[\\/:*?"<>|\r\n\t]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 80) || 'video';

/** 生成下载用的默认文件名 (标题 - 清晰度.扩展名) */
export const mediaFileName = (info: MediaInfo, stream: MediaStream): string => {
  const base = safeFileName(info.title);
  const quality = (stream.quality ?? '').replace(/\s+/g, '');
  const ext = stream.ext ?? (stream.kind === 'audio' ? 'm4a' : 'mp4');
  const parts = [ base, quality ].filter((p) => p !== '');
  return `${parts.join('-')}.${ext}`;
};

// ---------------------------------------------------------------------------
// 各平台解析
// ---------------------------------------------------------------------------

/** 去重并生成 id */
const pushStream = (list: MediaStream[], stream: Omit<MediaStream, 'id'>): void => {
  if (!stream.url || list.some((s) => s.url === stream.url)) return;
  list.push({ ...stream, id: `${stream.kind}-${list.length + 1}` });
};

/** B 站清晰度 id -> 文案 */
const BILI_Q: Record<number, string> = {
  127: '8K', 126: '杜比视界', 125: 'HDR', 120: '4K', 116: '1080P60', 112: '1080P+',
  80: '1080P', 74: '720P60', 64: '720P', 32: '480P', 16: '360P',
};

/** B 站音频流 id -> 文案 */
const BILI_AUDIO_Q: Record<number, string> = {
  30216: '64K', 30232: '132K', 30280: '192K', 30250: '杜比', 30251: 'Hi-Res',
};

/** B 站编码 id -> 文案 */
const BILI_CODEC: Record<number, string> = { 7: 'H.264', 12: 'H.265', 13: 'AV1' };

/** B 站: 页面里内嵌 __playinfo__ + __INITIAL_STATE__ */
export const parseBilibili = (html: string, pageUrl: string): MediaInfo => {
  const play = readJsonAfter<any>(html, 'window.__playinfo__');
  const state = readLooseJson<any>(html, 'window.__INITIAL_STATE__');
  const vd = state?.videoData ?? state?.videoInfo ?? null;

  const streams: MediaStream[] = [];
  const warnings: string[] = [];

  const dash = play?.data?.dash;
  if (dash) {
    for (const v of Array.isArray(dash.video) ? dash.video : []) {
      pushStream(streams, {
        kind: 'video',
        url: unescapeUrl(pickUrl(v.baseUrl ?? v.base_url ?? v)),
        quality: BILI_Q[Number(v.id)] ?? (v.height ? `${v.height}P` : undefined),
        codec: BILI_CODEC[Number(v.codecid)] ?? undefined,
        ext: 'm4s',
        note: 'DASH 视频轨',
      });
    }
    for (const a of Array.isArray(dash.audio) ? dash.audio : []) {
      pushStream(streams, {
        kind: 'audio',
        url: unescapeUrl(pickUrl(a.baseUrl ?? a.base_url ?? a)),
        quality: BILI_AUDIO_Q[Number(a.id)],
        codec: typeof a.codecs === 'string' ? a.codecs.toUpperCase() : undefined,
        ext: 'm4a',
        note: 'DASH 音轨',
      });
    }
    if (streams.length > 0) warnings.push('B 站高清画质使用 DASH 音视频分离, 单独下载后需用 ffmpeg 合并成完整视频');
  }

  // durl: 音视频合流 (mp4 / flv), 单个文件即可播放
  for (const d of Array.isArray(play?.data?.durl) ? play.data.durl : []) {
    const url = unescapeUrl(pickUrl(d.url ?? d.backup_url));
    pushStream(streams, {
      kind: 'muxed',
      url,
      quality: '原始画质',
      size: Number(d.size) || undefined,
      ext: /\.flv(\?|$)/i.test(url) ? 'flv' : 'mp4',
      note: '音视频合流',
    });
  }

  const title = String(vd?.title ?? '').trim() || metaContent(html, 'og:title') || pageTitle(html);
  const info: MediaInfo = {
    platform: 'bilibili',
    title,
    author: vd?.owner?.name ?? vd?.staff?.[0]?.name,
    cover: typeof vd?.pic === 'string' ? vd.pic : (metaContent(html, 'og:image') || undefined),
    duration: Number(vd?.duration) || undefined,
    pageUrl,
    streams,
    warnings,
    referer: 'https://www.bilibili.com/',
  };
  if (streams.length === 0) {
    warnings.push('页面里没有播放地址: 番剧 / 付费 / 需要登录的视频无法直接提取, 可改用 yt-dlp 配合浏览器 Cookie');
  }
  return info;
};

/** X / Twitter: 来自 syndication 接口的 JSON */
export const parseTwitter = (json: string, pageUrl: string): MediaInfo => {
  const data = safeJson<any>(json) ?? {};
  const streams: MediaStream[] = [];
  const warnings: string[] = [];

  const media = Array.isArray(data.mediaDetails) ? data.mediaDetails : [];
  const variantsOf = (m: any): any[] => {
    const v = m?.video_info?.variants ?? m?.videoInfo?.variants;
    return Array.isArray(v) ? v : [];
  };

  let poster = '';
  let duration: number | undefined;
  const collected: any[] = [];
  for (const m of media) {
    if (!poster && typeof m?.media_url_https === 'string') poster = m.media_url_https;
    for (const v of variantsOf(m)) collected.push(v);
    if (m?.video_info?.duration_millis) duration = Number(m.video_info.duration_millis) / 1000;
  }
  // 兼容旧结构: data.video.variants
  for (const v of Array.isArray(data?.video?.variants) ? data.video.variants : []) collected.push(v);
  if (!poster && typeof data?.video?.poster === 'string') poster = data.video.poster;

  for (const v of collected) {
    const url = unescapeUrl(typeof v?.url === 'string' ? v.url : '');
    if (url === '') continue;
    const type = String(v?.content_type ?? v?.contentType ?? '');
    const bitrate = Number(v?.bitrate) || 0;
    if (/mpegurl/i.test(type)) {
      pushStream(streams, { kind: 'video', url, quality: bitrate > 0 ? `${Math.round(bitrate / 1000)} kbps` : 'HLS', ext: 'm3u8', note: 'HLS 分片列表, 需播放器或 ffmpeg 处理' });
    } else if (/mp4|video/i.test(type) || /\.mp4(\?|$)/i.test(url)) {
      pushStream(streams, { kind: 'muxed', url, quality: bitrate > 0 ? `${Math.round(bitrate / 1000)} kbps` : undefined, ext: 'mp4' });
    }
  }

  const text = String(data?.text ?? '').replace(/\s+/g, ' ').trim();
  const info: MediaInfo = {
    platform: 'twitter',
    title: text === '' ? pageTitle(json) : text.slice(0, 120),
    author: data?.user?.name ?? data?.user?.screen_name ?? undefined,
    cover: poster || undefined,
    duration,
    pageUrl,
    streams,
    warnings,
  };
  if (streams.length === 0) warnings.push('该推文里没有视频 (只有图片 / 纯文字), 或已被删除 / 需要登录');
  return info;
};

/**
 * 抖音 / TikTok / 小红书这类「分享页内嵌 JSON」的通用解析
 * 不绑定固定字段路径: 深度遍历找带播放地址的节点 (平台改版时更耐造)
 */
export const parseEmbeddedVideo = (html: string, pageUrl: string, platform: string, referer?: string): MediaInfo => {
  const roots: unknown[] = [];
  const push = (v: unknown) => { if (v) roots.push(v); };

  push(readJsonAfter(html, 'window._ROUTER_DATA'));
  push(readJsonAfter(html, 'window.__UNIVERSAL_DATA_FOR_REHYDRATION__'));
  push(readJsonAfter(html, 'window.__INITIAL_STATE__'));
  push(readLooseJson(html, 'window.__INITIAL_STATE__'));
  push(readJsonAfter(html, 'window.SIGI_STATE'));
  push(readJsonAfter(html, 'window._SSR_HYDRATED_DATA'));
  // RENDER_DATA: URL 编码的整页数据
  const render = /<script[^>]*id=["']RENDER_DATA["'][^>]*>([\s\S]*?)<\/script>/i.exec(html);
  if (render) {
    try {
      push(JSON.parse(decodeURIComponent(render[1])));
    } catch {
      // 忽略: 编码格式变化时走通用兜底
    }
  }
  push(readScriptJson(html, '__NEXT_DATA__'));

  const streams: MediaStream[] = [];
  const warnings: string[] = [];
  let title = '';
  let author = '';
  let cover = '';
  let duration: number | undefined;

  for (const root of roots) {
    walkJson(root, (obj) => {
      const playAddr = pickUrl(obj.play_addr ?? obj.playAddr ?? obj.play_url ?? obj.playUrl);
      const downloadAddr = pickUrl(obj.download_addr ?? obj.downloadAddr ?? obj.download_url ?? obj.downloadUrl);
      // 小红书等结构把地址放在 masterUrl / videoUrl 上, 顺带兜一层
      const masterAddr = pickUrl(obj.masterUrl ?? obj.master_url ?? obj.videoUrl ?? obj.video_url);
      for (const url of [ downloadAddr, playAddr, masterAddr ]) {
        if (url === '') continue;
        pushStream(streams, { kind: 'muxed', url: unescapeUrl(url), ext: /\.m3u8(\?|$)/i.test(url) ? 'm3u8' : 'mp4' });
      }

      if (title === '') {
        const t = obj.desc ?? obj.title ?? obj.caption ?? obj.shareTitle;
        if (typeof t === 'string' && t.trim() !== '') title = t.trim();
      }
      if (author === '') {
        const a = obj.nickname ?? obj.author?.nickname ?? obj.author?.name ?? obj.user?.nickname ?? obj.user?.name;
        if (typeof a === 'string' && a.trim() !== '') author = a.trim();
      }
      if (cover === '') {
        const c = pickUrl(obj.cover ?? obj.origin_cover ?? obj.dynamic_cover ?? obj.thumbnail ?? obj.image?.urlDefault);
        // 封面只接受图片直链, 避免把视频地址当封面
        if (c !== '' && !/\.(mp4|m3u8|webm)(\?|$)/i.test(c)) cover = unescapeUrl(c);
      }
      if (duration === undefined) {
        const d = Number(obj.duration ?? obj.video?.duration ?? obj.capa?.duration);
        if (Number.isFinite(d) && d > 0) duration = d > 1000 ? d / 1000 : d;
      }
    });
  }

  // 兜底: 页面里的 og:video / <video src>
  if (streams.length === 0) {
    for (const s of genericStreams(html)) pushStream(streams, s);
  }
  if (title === '') title = metaContent(html, 'og:title') || pageTitle(html);
  if (cover === '') cover = metaContent(html, 'og:image');
  if (duration === undefined) {
    const d = Number(metaContent(html, 'og:video:duration') || metaContent(html, 'video:duration'));
    if (Number.isFinite(d) && d > 0) duration = d;
  }

  if (streams.length === 0) {
    warnings.push('没解析出播放地址: 平台可能已改版, 或该内容需要登录 / 验证码; 可用 yt-dlp 配合浏览器 Cookie 尝试');
  }
  return {
    platform,
    title,
    author: author === '' ? undefined : author,
    cover: cover === '' ? undefined : cover,
    duration,
    pageUrl,
    streams,
    warnings,
    referer,
  };
};

/** YouTube: ytInitialPlayerResponse */
export const parseYouTube = (html: string, pageUrl: string): MediaInfo => {
  const player = readJsonAfter<any>(html, 'ytInitialPlayerResponse') ?? readJsonAfter<any>(html, 'var ytInitialPlayerResponse');
  const details = player?.videoDetails ?? {};
  const streams: MediaStream[] = [];
  const warnings: string[] = [];

  const sd = player?.streamingData ?? {};
  const add = (f: any, kind: StreamKind) => {
    const url = typeof f?.url === 'string' ? f.url : '';
    if (url === '') return;
    pushStream(streams, {
      kind,
      url,
      quality: f.qualityLabel ?? (f.audioQuality ? String(f.audioQuality).replace('AUDIO_QUALITY_', '') : undefined),
      codec: typeof f.mimeType === 'string' ? f.mimeType.replace(/^video\//i, '').replace(/^audio\//i, '').split(';')[0] : undefined,
      ext: /webm/i.test(String(f.mimeType)) ? 'webm' : 'mp4',
      note: kind === 'video' ? '仅视频轨 (无声音)' : undefined,
    });
  };
  for (const f of Array.isArray(sd.formats) ? sd.formats : []) add(f, 'muxed');
  for (const f of Array.isArray(sd.adaptiveFormats) ? sd.adaptiveFormats : []) {
    const mime = String(f.mimeType ?? '');
    add(f, /^audio\//i.test(mime) ? 'audio' : 'video');
  }
  if (streams.length === 0) {
    warnings.push('YouTube 播放地址需要签名解密, 内置解析拿不到直链; 建议用 yt-dlp (qiaomu-download) 下载');
  }

  const thumbs = Array.isArray(details?.thumbnail?.thumbnails) ? details.thumbnail.thumbnails : [];
  return {
    platform: 'youtube',
    title: String(details?.title ?? metaContent(html, 'og:title') ?? pageTitle(html)).trim(),
    author: details?.author ?? undefined,
    cover: thumbs.length > 0 ? thumbs[thumbs.length - 1].url : (metaContent(html, 'og:image') || undefined),
    duration: Number(details?.lengthSeconds) || undefined,
    pageUrl,
    streams,
    warnings,
  };
};

/** Vimeo: window.playerConfig */
export const parseVimeo = (html: string, pageUrl: string): MediaInfo => {
  const cfg = readJsonAfter<any>(html, 'window.playerConfig') ?? readJsonAfter<any>(html, 'window.vimeo.clip_page_config');
  const video = cfg?.video ?? {};
  const streams: MediaStream[] = [];
  const warnings: string[] = [];

  for (const f of Array.isArray(cfg?.request?.files?.progressive) ? cfg.request.files.progressive : []) {
    const url = typeof f?.url === 'string' ? f.url : '';
    if (url === '') continue;
    pushStream(streams, {
      kind: /audio/i.test(String(f.mime ?? '')) ? 'audio' : 'muxed',
      url,
      quality: f.quality ?? (f.height ? `${f.height}P` : undefined),
      ext: /webm/i.test(String(f.mime)) ? 'webm' : 'mp4',
    });
  }
  if (streams.length === 0) warnings.push('未找到直链: 付费 / 隐私视频需要登录, 无法直接提取');

  const thumbs = video?.thumbs ?? {};
  return {
    platform: 'vimeo',
    title: String(video?.title ?? metaContent(html, 'og:title') ?? pageTitle(html)).trim(),
    author: video?.owner?.name ?? undefined,
    cover: thumbs['1280'] ?? thumbs['640'] ?? (metaContent(html, 'og:image') || undefined),
    duration: Number(video?.duration) || undefined,
    pageUrl,
    streams,
    warnings,
  };
};

/** 微博: 页面里内嵌的 f.video.weibocdn 直链 */
export const parseWeibo = (html: string, pageUrl: string): MediaInfo => {
  const streams: MediaStream[] = [];
  const warnings: string[] = [];

  // Component_Play_Playinfo (视频页) 与 page_info (正文内嵌视频) 里的 mp4 直链
  const re = /https?:(?:\\?\/){2}[^"'\\\s]+?\.mp4[^"'\\\s]*/gi;
  const found = html.match(re) ?? [];
  for (const raw of found) {
    const url = unescapeUrl(raw);
    pushStream(streams, { kind: 'muxed', url, ext: 'mp4' });
  }
  if (streams.length === 0) warnings.push('没在页面里找到 mp4 直链: 可能需要登录或视频已失效');

  let title = metaContent(html, 'og:title') || pageTitle(html);
  let cover = metaContent(html, 'og:image');
  let author = '';
  const playinfo = readJsonAfter<any>(html, 'var $render_data') ?? readLooseJson<any>(html, 'var $render_data');
  if (playinfo?.status) {
    const status = playinfo.status;
    if (typeof status.title === 'string' && status.title.trim() !== '') title = status.title;
    author = status.user?.screen_name ?? '';
    cover = status.page_info?.page_pic ?? cover;
    const d = Number(status.page_info?.media_info?.duration);
    if (Number.isFinite(d) && d > 0) {
      return {
        platform: 'weibo', title, author: author || undefined, cover: cover || undefined,
        duration: d, pageUrl, streams,
        warnings: streams.length === 0 ? warnings : [],
        referer: 'https://weibo.com/',
      };
    }
  }
  return { platform: 'weibo', title, author: author || undefined, cover: cover || undefined, pageUrl, streams, warnings, referer: 'https://weibo.com/' };
};

/** 通用: og:video / <video src> / <source src> / JSON-LD contentUrl */
export const genericStreams = (html: string): MediaStream[] => {
  const list: MediaStream[] = [];
  const candidates: string[] = [];
  for (const key of [ 'og:video', 'og:video:url', 'og:video:secure_url', 'twitter:player:stream', 'video:url' ]) {
    const v = metaContent(html, key);
    if (v !== '') candidates.push(v);
  }
  for (const m of html.matchAll(/<(?:video|source)[^>]+src=["']([^"']+)["']/gi)) {
    candidates.push(decodeEntities(m[1]));
  }
  for (const m of html.matchAll(/"contentUrl"\s*:\s*"([^"]+)"/gi)) {
    candidates.push(unescapeUrl(m[1]));
  }
  for (const c of candidates) {
    const url = unescapeUrl(c.trim());
    if (url === '' || /^data:/i.test(url) || /^blob:/i.test(url)) continue;
    pushStream(list, {
      kind: 'muxed',
      url,
      ext: /\.m3u8(\?|$)/i.test(url) ? 'm3u8' : /\.webm(\?|$)/i.test(url) ? 'webm' : 'mp4',
      note: '页面通用识别',
    });
  }
  return list;
};

/** 通用网页解析 */
export const parseGeneric = (html: string, pageUrl: string): MediaInfo => {
  const streams = genericStreams(html);
  const warnings: string[] = [];
  if (streams.length === 0) {
    warnings.push('页面里没有找到视频直链; 内嵌播放器 / 加密流需要 yt-dlp 等专门工具处理');
  }
  return {
    platform: 'generic',
    title: metaContent(html, 'og:title') || pageTitle(html) || pageUrl,
    author: metaContent(html, 'og:site_name') || undefined,
    cover: metaContent(html, 'og:image') || undefined,
    duration: Number(metaContent(html, 'og:video:duration')) || undefined,
    pageUrl,
    streams,
    warnings,
  };
};

/** 平台 id -> 解析器 (twitter 走接口 JSON, 单独处理) */
export const htmlParserOf = (platform: string): ((html: string, pageUrl: string) => MediaInfo) => {
  switch (platform) {
    case 'bilibili': return parseBilibili;
    case 'youtube': return parseYouTube;
    case 'vimeo': return parseVimeo;
    case 'weibo': return parseWeibo;
    case 'douyin': return (html, url) => parseEmbeddedVideo(html, url, 'douyin', 'https://www.douyin.com/');
    case 'tiktok': return (html, url) => parseEmbeddedVideo(html, url, 'tiktok', 'https://www.tiktok.com/');
    case 'xiaohongshu': return (html, url) => parseEmbeddedVideo(html, url, 'xiaohongshu', 'https://www.xiaohongshu.com/');
    default: return parseGeneric;
  }
};

/** 一次性抓取失败时的备用地址 (oEmbed 等) */
export type FetchPlanItem = {
  /** 抓取地址 */
  url: string;
  /** 是否按 JSON 解析 (twitter syndication) */
  json?: boolean;
};

/** X / Twitter 状态 id */
export const twitterStatusId = (url: string): string => {
  const m = /\/status(?:es)?\/(\d+)/i.exec(url);
  return m ? m[1] : '';
};

/** 生成抓取计划: 按顺序尝试, 拿到结果就停 */
export const fetchPlan = (url: string, platform: Platform): FetchPlanItem[] => {
  if (platform.id === 'twitter') {
    const id = twitterStatusId(url);
    if (id !== '') {
      return [
        { url: `https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=en&token=a`, json: true },
        { url: `https://cdn.syndication.twimg.com/tweet-result?id=${id}&token=1`, json: true },
      ];
    }
    return [];
  }
  return [ { url } ];
};

/** 分享链接是否是受支持的视频页面 (粗筛, 用于输入提示) */
export const looksLikeVideoUrl = (url: string): boolean => {
  const platform = detectPlatform(url);
  if (platform.id === 'generic') return true;
  return !UNSUPPORTED_PLATFORMS.includes(platform.id);
};
