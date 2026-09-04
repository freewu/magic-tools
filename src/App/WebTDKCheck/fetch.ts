// 网页抓取层: Tauri 桌面端经 Rust 命令绕过 CORS, 浏览器端直接 fetch (受限)

import { isTauri } from '../../lib/tauri';

type FetchedPage = {
  status: number;
  contentType: string | null;
  finalUrl: string;
  base64: string;
};

// Base64 -> Uint8Array
function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// 字符集名归一化到 TextDecoder 支持标签
function normalizeCharset(name: string): string {
  const n = name.trim().toLowerCase();
  if (n === '' ) return 'utf-8';
  if (n.includes('utf') || n === 'unicode') return 'utf-8';
  if (n.includes('gb2312') || n.includes('gbk') || n.includes('cp936') || n === 'ms936') return 'gbk';
  if (n.includes('big5')) return 'big5';
  if (n.includes('gb18030')) return 'gb18030';
  if (n.includes('shift_jis') || n === 'sjis') return 'shift_jis';
  if (n.includes('8859-1') || n.includes('latin1') || n === 'latin-1' || n.includes('cp1252')) return 'windows-1252';
  return 'utf-8';
}

// 从响应头 Content-Type 与页面前 4KB 的 <meta charset> 中探测字符集
export function sniffCharset(bytes: Uint8Array, contentType?: string | null): string {
  // 头 4KB 可能存在被截断的多字节字符, 宽容解码后仅用于正则匹配
  const head = new TextDecoder('utf-8').decode(bytes.slice(0, 4096));
  const meta = /<meta[^>]+charset\s*=\s*["']?\s*([\w-]+)/i.exec(head);
  if (meta) return normalizeCharset(meta[1]);
  if (contentType) {
    const ct = /charset\s*=\s*"?([\w-]+)"?/i.exec(contentType);
    if (ct) return normalizeCharset(ct[1]);
  }
  return 'utf-8';
}

export type FetchedPageResult = {
  /** 解码后的 HTML 文本 */
  html: string;
  /** 重定向后的最终地址 (桌面端由 Rust 返回) */
  finalUrl: string;
};

/**
 * 抓取网页 HTML (自动解码页面字符集)
 * @param url 以 http:// 或 https:// 开头的网址
 */
export async function fetchPageHtml(url: string): Promise<FetchedPageResult> {
  const target = url.trim();
  if (!/^https?:\/\//i.test(target)) {
    throw new Error('网址必须以 http:// 或 https:// 开头');
  }

  // Tauri 桌面端: Rust 侧抓取, 无跨域限制
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    const page = await invoke<FetchedPage>('fetch_url_body', { url: target });
    const bytes = base64ToBytes(page.base64);
    const html = new TextDecoder(sniffCharset(bytes, page.contentType)).decode(bytes);
    return { html, finalUrl: page.finalUrl || target };
  }

  // 纯浏览器回退: 仅同源 / 允许跨域的站点可用 (GitHub Pages 演示版多数站点会被 CORS 拦截)
  const resp = await fetch(target, { redirect: 'follow' });
  if (!resp.ok) throw new Error(`服务器返回 HTTP ${resp.status}`);
  const contentType = resp.headers.get('content-type');
  const bytes = new Uint8Array(await resp.arrayBuffer());
  const html = new TextDecoder(sniffCharset(bytes, contentType)).decode(bytes);
  return { html, finalUrl: resp.url || target };
}
