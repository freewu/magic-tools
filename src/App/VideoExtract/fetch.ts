// 视频提取网络层
// - Tauri 桌面端: 走 Rust 命令 (media_fetch / media_download), 绕开浏览器 CORS
// - 浏览器端: 直接 fetch (多数平台会被 CORS 拦截, 仅作调试兜底)

import { isTauri } from '../../lib/tauri';

/** Rust media_fetch 的返回结构 */
type MediaResponse = {
  status: number;
  contentType: string | null;
  finalUrl: string;
  base64: string;
};

/** 抓取结果 */
export type FetchTextResult = {
  /** 响应文本 (HTML 或 JSON) */
  text: string;
  /** 跟随重定向后的最终地址 */
  finalUrl: string;
  /** 响应 Content-Type */
  contentType: string;
};

/** 下载进度 */
export type DownloadProgress = {
  /** 已写入字节数 */
  written: number;
  /** 总字节数 (0 表示服务器未给出) */
  total: number;
};

/** Base64 -> Uint8Array */
function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/**
 * 抓取分享页 / 平台接口文本
 * @param url 以 http(s):// 开头的地址
 * @param referer 部分平台校验来源页 (可选)
 */
export async function fetchText(url: string, referer?: string): Promise<FetchTextResult> {
  const target = url.trim();
  if (!/^https?:\/\//i.test(target)) {
    throw new Error('链接必须以 http:// 或 https:// 开头');
  }

  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    const res = await invoke<MediaResponse>('media_fetch', { url: target, referer: referer ?? null });
    const bytes = base64ToBytes(res.base64);
    // 分享页 / 接口都是 UTF-8, 直接解码即可
    const text = new TextDecoder('utf-8').decode(bytes);
    return { text, finalUrl: res.finalUrl || target, contentType: res.contentType ?? '' };
  }

  // 浏览器兜底: 只在目标站点允许跨域时可用
  const resp = await fetch(target);
  if (!resp.ok) throw new Error(`服务器返回 HTTP ${resp.status}`);
  return {
    text: await resp.text(),
    finalUrl: resp.url || target,
    contentType: resp.headers.get('content-type') ?? '',
  };
}

/**
 * 下载直链到本地 (Tauri 桌面端)
 * @param opts.url 直链 / opts.referer 来源页 / opts.dest 保存路径 / opts.onProgress 进度回调
 * @returns 写入的字节数
 */
export async function downloadMedia(opts: {
  url: string;
  referer?: string;
  dest: string;
  onProgress?: (p: DownloadProgress) => void;
}): Promise<number> {
  if (!isTauri()) {
    throw new Error('浏览器演示版不支持下载, 请使用桌面版');
  }
  const { invoke, Channel } = await import('@tauri-apps/api/core');
  const channel = new Channel<DownloadProgress>();
  if (opts.onProgress) {
    channel.onmessage = (p) => opts.onProgress!(p);
  }
  return await invoke<number>('media_download', {
    url: opts.url,
    referer: opts.referer ?? null,
    dest: opts.dest,
    onProgress: channel,
  });
}

/** 取消当前下载 */
export async function cancelDownload(): Promise<void> {
  if (!isTauri()) return;
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('media_download_cancel');
}

/**
 * 弹系统保存对话框
 * @returns 选中的路径; 用户取消时返回 null
 */
export async function pickSavePath(defaultName: string): Promise<string | null> {
  if (!isTauri()) return null;
  const { save } = await import('@tauri-apps/plugin-dialog');
  const path = await save({
    title: '保存媒体文件',
    defaultPath: defaultName,
    filters: [ { name: '媒体文件', extensions: [ 'mp4', 'm4a', 'flv', 'webm', 'm3u8', 'mp3' ] } ],
  });
  return path === null ? null : String(path);
}
