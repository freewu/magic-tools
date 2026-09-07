// 新版本检测 (桌面/Web 共用):
// 启动后查询 GitHub Releases 最新版本, 与本地 package.json 版本比较,
// 有新版时由 UI 层 (src/layout/update-checker.tsx) 弹出右下角提示。

export const REPO = 'freewu/magic-tools';

export const LATEST_API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;

export const LATEST_PAGE_URL = `https://github.com/${REPO}/releases/latest`;

/** 'v2.5.0' / '2.5.0' -> [2, 5, 0]; 无法解析的段按 0 计 */
export function parseVersion(v: string): number[] {
  return String(v)
    .trim()
    .replace(/^v/i, '')
    .split('.')
    .map((seg) => {
      const n = Number.parseInt(seg, 10);
      return Number.isNaN(n) ? 0 : n;
    });
}

/** 逐段数字比较 (忽略前导 v); a > b 返回正数, 相等返回 0 */
export function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export interface UpdateInfo {
  /** 远端 tag, 如 v2.6.0 */
  tag: string;
  /** 去掉 v 的版本, 如 2.6.0 */
  version: string;
  /** Release 页面链接 */
  url: string;
}

/** 查询 GitHub 最新 Release; 网络失败 / 非 2xx / 无 tag 一律返回 null (静默) */
export async function fetchLatestRelease(
  fetchImpl: typeof fetch = fetch,
): Promise<UpdateInfo | null> {
  try {
    const res = await fetchImpl(LATEST_API_URL, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const tag =
      data && typeof data === 'object' && 'tag_name' in data
        ? String((data as { tag_name?: unknown }).tag_name ?? '')
        : '';
    if (!tag) return null;
    const url =
      data && typeof data === 'object' && 'html_url' in data
        ? String((data as { html_url?: unknown }).html_url ?? LATEST_PAGE_URL)
        : LATEST_PAGE_URL;
    return { tag, version: tag.replace(/^v/i, ''), url };
  } catch {
    return null;
  }
}
