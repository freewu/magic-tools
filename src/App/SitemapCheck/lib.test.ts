import { parseSitemap, entriesToCsv, buildSitemapXml } from './lib';
import type { SitemapReport } from './lib';

const VALID = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc><lastmod>2025-01-01</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>https://example.com/about</loc><lastmod>2025-01-01T10:00:00+08:00</lastmod></url>
  <url><loc>https://example.com/contact</loc></url>
</urlset>`;

const ISSUES = `<?xml version="1.0"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/a</loc><lastmod>昨天</lastmod><changefreq>sometimes</changefreq><priority>3.5</priority></url>
  <url><loc>not-a-url</loc></url>
  <url><lastmod>2025-01-01</lastmod></url>
</urlset>`;

describe('合法 sitemap', () => {
  const r: SitemapReport = parseSitemap(VALID);
  test('kind 与条目数', () => {
    expect(r.kind).toBe('urlset');
    expect(r.entries).toHaveLength(3);
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual([]);
    expect(r.duplicates).toEqual([]);
  });
  test('字段提取', () => {
    expect(r.entries[0]).toMatchObject({ loc: 'https://example.com/', lastmod: '2025-01-01', changefreq: 'daily', priority: '1.0' });
    expect(r.entries[1].lastmod).toBe('2025-01-01T10:00:00+08:00');
    expect(r.entries[2].priority).toBeUndefined();
  });
  test('重复 URL 统计', () => {
    const dup = parseSitemap(VALID.replace('https://example.com/contact', 'https://example.com/'));
    expect(dup.duplicates).toEqual(['https://example.com/']);
    expect(dup.warnings).toHaveLength(1);
  });
});

describe('问题条目', () => {
  const r: SitemapReport = parseSitemap(ISSUES);
  test('lastmod / changefreq / priority 告警', () => {
    const joined = r.warnings.join('\n');
    expect(joined).toContain('lastmod');
    expect(joined).toContain('changefreq');
    expect(joined).toContain('priority');
  });
  test('非 http loc 与缺失 loc 告警', () => {
    const joined = r.warnings.join('\n');
    expect(joined).toContain('not-a-url');
    expect(joined).toContain('缺少 <loc>');
  });
  test('坏条目仍计入 entries', () => {
    expect(r.entries.some((e) => e.loc === 'not-a-url')).toBe(true);
  });
});

describe('sitemap index / 边界', () => {
  test('sitemapindex 类型解析', () => {
    const r = parseSitemap(`<?xml version="1.0"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/sitemap-1.xml</loc><lastmod>2025-01-02</lastmod></sitemap>
  <sitemap><loc>https://example.com/sitemap-2.xml</loc></sitemap>
</sitemapindex>`);
    expect(r.kind).toBe('sitemapindex');
    expect(r.entries).toHaveLength(2);
    expect(r.entries[0].loc).toContain('sitemap-1.xml');
  });
  test('空内容 / 非法 XML / 错误根元素', () => {
    expect(parseSitemap('').errors.join()).toContain('为空');
    const bad = parseSitemap('<urlset><url><loc>https://a.com</loc>');
    expect(bad.errors.join()).toContain('XML');
    const wrongRoot = parseSitemap('<html><body>x</body></html>');
    expect(wrongRoot.errors.join()).toContain('根元素');
  });
  test('空 urlset 无条目告警', () => {
    const r = parseSitemap('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
    expect(r.warnings.join()).toContain('未发现任何');
  });
});

describe('输出', () => {
  test('CSV 含表头与转义', () => {
    const csv = entriesToCsv(parseSitemap(VALID).entries);
    expect(csv.split('\n')[0]).toBe('loc,lastmod,changefreq,priority');
    expect(csv).toContain('https://example.com/about');
  });
  test('buildSitemapXml 生成合法可回读的 XML', () => {
    const xml = buildSitemapXml(['https://a.com/', 'https://b.com/p'], { lastmod: '2025-01-01' });
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    const back = parseSitemap(xml);
    expect(back.errors).toEqual([]);
    expect(back.entries).toHaveLength(2);
    expect(buildSitemapXml(['ftp://x'])).toBe('');
  });
});
