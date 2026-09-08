// URL 提取 纯逻辑层
// 从任意文本中提取链接 (http/https/ftp 等带协议的 URL),
// 清理行尾句读与不成对括号, 支持去重 (保留首次出现顺序)。

export interface UrlExtractOptions {
  /** 去重: 相同的 URL 只保留第一个 (默认 true) */
  dedupe?: boolean;
  /** 只保留 http/https (默认 false, 即保留 ftp/mailto 等任意 scheme) */
  httpOnly?: boolean;
}

/** 任意 scheme 的 URL: scheme:// 后跟到空白/引号/括号等分隔符为止
 *  同时把中文标点视为分隔符 (避免「…page1。再看」把中文标点吞进 URL) */
const URL_SRC = /(?:[a-zA-Z][a-zA-Z0-9+.-]*:\/\/)[^\s<>"'`{}|\\^[\]，。、；：？！…—“”‘’（）《》〈〉「」『』【】\u3000]+/g;
const HTTP_RE = /^https?:\/\//i;

function trimUrlEnd(match: string): string {
  let s = match;
  // 1. 去除尾部句读等收尾标点 (点号、逗号、分号、冒号、叹问号、右引号/括号)
  s = s.replace(/[.,;:!?"'\u3002\uFF0C\uFF1B\uFF1A\uFF01\uFF1F\u2026]+$/, '');
  // 2. 括号配平: 结尾闭括号多于对应开括号时逐字去掉, 保留
  //    https://en.wikipedia.org/wiki/JSON_(file_format) 这类合法结尾
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  for (;;) {
    const last = s[s.length - 1];
    const open = pairs[last];
    if (!open) break;
    const closeRe = new RegExp(`\\${last}`, 'g');
    const openRe = new RegExp(`\\${open}`, 'g');
    const closeN = (s.match(closeRe) ?? []).length;
    const openN = (s.match(openRe) ?? []).length;
    if (closeN <= openN) break; // 配平或内部闭合更多
    s = s.slice(0, -1);
  }
  return s;
}

/** 从文本中提取 URL 列表 (按出现顺序) */
export function extractUrls(input: string, options?: UrlExtractOptions): string[] {
  const opts: Required<UrlExtractOptions> = { dedupe: options?.dedupe ?? true, httpOnly: options?.httpOnly ?? false };
  const text = String(input ?? '');
  const urls: string[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  URL_SRC.lastIndex = 0;
  while ((m = URL_SRC.exec(text)) !== null) {
    let url = trimUrlEnd(m[0]);
    if (!url) continue;
    if (opts.httpOnly && !HTTP_RE.test(url)) continue;
    if (urls.length === 0 || !opts.dedupe || !seen.has(url)) {
      urls.push(url);
      seen.add(url);
    }
  }
  return urls;
}

/** 结果文本: 每行一条 URL */
export function urlsToText(urls: string[]): string {
  return urls.join('\n');
}

/** 按 URL 主体去重 (忽略常见追踪参数, 可选用) */
export function dedupeByOrigin(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    let host = u;
    const scheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.exec(u);
    if (scheme) {
      const rest = u.slice(scheme[0].length);
      const slash = rest.indexOf('/');
      host = scheme[0] + (slash === -1 ? rest : rest.slice(0, slash));
    }
    if (!seen.has(host)) { seen.add(host); out.push(u); }
  }
  return out;
}

// ---------- 设置: 结果去重默认值 (设置-站长工具 可调整, 默认开启) ----------
const DEDUPE_STORAGE_KEY = 'url-extract-dedupe';

/** 设置页改动后广播, 已打开的工具页监听后即时刷新默认值 */
export const URL_DEDUPE_CHANGED = 'url-extract-dedupe-changed';

/** 读取「去重」默认值 (默认 true; localStorage 不可用/数据损坏时回退默认) */
export const getUrlDedupeDefault = (): boolean => {
  try {
    const raw = localStorage.getItem(DEDUPE_STORAGE_KEY);
    if (raw === null) return true;
    return raw !== '0';
  } catch (e) {
    return true;
  }
};

/** 保存「去重」默认值并通知已打开的工具页 */
export const setUrlDedupeDefault = (v: boolean): void => {
  try {
    localStorage.setItem(DEDUPE_STORAGE_KEY, v ? '1' : '0');
  } catch (e) {
    /* ignore */
  }
  try {
    window.dispatchEvent(new Event(URL_DEDUPE_CHANGED));
  } catch (e) {
    /* ignore */
  }
};
