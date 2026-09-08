// Sitemap 检查 纯逻辑层
// 校验 sitemap.xml (urlset) / sitemap index (sitemapindex), 提取条目并给出
// loc/lastmod/changefreq/priority 等字段的规范性问题与重复 URL 统计。
import { XMLParser, XMLValidator } from 'fast-xml-parser';

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export interface SitemapReport {
  kind: 'urlset' | 'sitemapindex' | null;
  entries: SitemapEntry[];
  errors: string[];
  warnings: string[];
  duplicates: string[];
  totalCount: number;
  duplicateCount: number;
}

const asArray = <T,>(x: T | T[] | undefined): T[] => (x === undefined ? [] : Array.isArray(x) ? x : [x]);

const CHANGEFREQ = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
const HTTP_URL = /^https?:\/\/\S+$/i;

/** 校验文本并解析 sitemap */
export function parseSitemap(text: string): SitemapReport {
  const report: SitemapReport = {
    kind: null, entries: [], errors: [], warnings: [], duplicates: [],
    totalCount: 0, duplicateCount: 0,
  };
  const src = String(text ?? '');
  if (!src.trim()) {
    report.errors.push('内容为空: 请粘贴 sitemap XML, 或输入网址后抓取。');
    return report;
  }
  const v = XMLValidator.validate(src);
  if (typeof v !== 'boolean' && v.err) {
    const e = v.err as { msg?: string; line?: number; col?: number };
    report.errors.push(`XML 解析错误: ${e.msg ?? '格式不正确'}${e.line ? ` (第 ${e.line} 行${e.col ? `, 第 ${e.col} 列` : ''})` : ''}`);
    return report;
  }
  let root: Record<string, unknown>;
  try {
    root = new XMLParser({ ignoreAttributes: true, trimValues: true, parseTagValue: false }).parse(src);
  } catch (e) {
    report.errors.push(`解析失败: ${e instanceof Error ? e.message : String(e)}`);
    return report;
  }

  const checkEntry = (item: Record<string, unknown>, indexName: 'url' | 'sitemap') => {
    const loc = String(item.loc ?? '').trim();
    if (!loc) {
      report.warnings.push(`第 ${indexName === 'url' ? 'URL' : 'Sitemap'} 项缺少 <loc>: ${JSON.stringify(item).slice(0, 80)}…`);
      return;
    }
    const e: SitemapEntry = { loc };
    if (!HTTP_URL.test(loc)) report.warnings.push(`loc 不是合法的 http(s) 地址: ${loc}`);
    const lastmod = item.lastmod === undefined ? undefined : String(item.lastmod).trim();
    const changefreq = item.changefreq === undefined ? undefined : String(item.changefreq).trim().toLowerCase();
    const priority = item.priority === undefined ? undefined : String(item.priority).trim();
    if (lastmod !== undefined) {
      e.lastmod = lastmod;
      if (!ISO_DATE.test(lastmod)) report.warnings.push(`lastmod 不是标准日期格式 (应形如 2025-01-01 / 2025-01-01T10:00:00+08:00): ${lastmod}`);
    }
    if (changefreq !== undefined) {
      e.changefreq = changefreq;
      if (!CHANGEFREQ.includes(changefreq)) report.warnings.push(`changefreq 取值应为 ${CHANGEFREQ.join('/')}, 实际: ${changefreq}`);
    }
    if (priority !== undefined) {
      e.priority = priority;
      const n = Number.parseFloat(priority);
      if (Number.isNaN(n)) report.warnings.push(`priority 应为 0.0~1.0 的数字, 实际: ${priority}`);
      else if (n < 0 || n > 1) report.warnings.push(`priority 超出 0.0~1.0 范围: ${priority}`);
    }
    report.entries.push(e);
  };

  const keys = Object.keys(root);
  if (keys.length === 0) {
    report.errors.push('XML 内容为空, 未解析到任何元素。');
    return report;
  }
  const key = keys.find((k) => /^(urlset|sitemapindex)$/i.test(k));
  if (!key) {
    report.errors.push(`根元素应为 <urlset> 或 <sitemapindex>, 实际为 <${keys[0]}>。`);
    return report;
  }
  report.kind = key.toLowerCase() === 'urlset' ? 'urlset' : 'sitemapindex';
  const tag = report.kind === 'urlset' ? 'url' : 'sitemap';
  const listObj = root[key] as Record<string, unknown> | undefined;
  const items = asArray<Record<string, unknown>>(listObj?.[tag] as Record<string, unknown> | undefined);
  if (!items.length) {
    report.warnings.push(report.kind === 'urlset' ? '未发现任何 <url> 条目。' : '未发现任何 <sitemap> 条目。');
    return report;
  }
  for (const item of items) {
    if (item && typeof item === 'object') checkEntry(item as Record<string, unknown>, report.kind === 'urlset' ? 'url' : 'sitemap');
  }
  // 重复 URL 统计
  const seen = new Map<string, number>();
  for (const e of report.entries) {
    if (!e.loc) continue;
    seen.set(e.loc, (seen.get(e.loc) ?? 0) + 1);
  }
  for (const [loc, n] of seen) {
    if (n > 1) {
      report.duplicates.push(loc);
      report.warnings.push(`重复 URL (出现 ${n} 次): ${loc}`);
    }
  }
  report.totalCount = report.entries.length;
  report.duplicateCount = report.duplicates.length;
  return report;
}

/** 条目 → CSV 文本 */
export function entriesToCsv(entries: SitemapEntry[]): string {
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const head = ['loc', 'lastmod', 'changefreq', 'priority'];
  const rows = entries.map((e) => [e.loc ?? '', e.lastmod ?? '', e.changefreq ?? '', e.priority ?? ''].map((c) => esc(c)).join(','));
  return [head.join(','), ...rows].join('\n');
}

/** 生成规范 sitemap.xml 文本 (urlset) */
export function buildSitemapXml(locs: string[], options?: { lastmod?: string }): string {
  const items = locs
    .filter((l) => HTTP_URL.test(l.trim()))
    .map((l) => {
      const lm = options?.lastmod ? `\n    <lastmod>${options.lastmod}</lastmod>` : '';
      return `  <url>\n    <loc>${l.trim()}</loc>${lm}\n  </url>`;
    });
  const xml = ['<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...items,
    '</urlset>',
  ].join('\n');
  return items.length ? xml : '';
}
