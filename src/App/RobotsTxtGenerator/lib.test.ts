// robots.txt 生成 - 单元测试
import {
  buildRobotsTxt,
  ROBOTS_PRESETS,
  type RobotsRule,
} from './lib';

const rule = (kind: 'allow' | 'disallow', path: string): RobotsRule => ({ id: 'x', kind, path });

describe('robots.txt 内容生成', () => {
  it('基本结构: User-agent + Disallow', () => {
    expect(buildRobotsTxt({ userAgent: '*', rules: [rule('disallow', '/admin/')], sitemaps: [], crawlDelay: null }))
      .toBe('User-agent: *\nDisallow: /admin/\n');
  });
  it('Allow / Disallow 保持添加顺序', () => {
    const text = buildRobotsTxt({
      userAgent: '*',
      rules: [rule('disallow', '/admin/'), rule('allow', '/public/')],
      sitemaps: [],
      crawlDelay: null,
    });
    expect(text).toBe('User-agent: *\nDisallow: /admin/\nAllow: /public/\n');
  });
  it('Crawl-delay 仅在 >0 时输出', () => {
    expect(buildRobotsTxt({ userAgent: '*', rules: [], sitemaps: [], crawlDelay: 10 }))
      .toBe('User-agent: *\nCrawl-delay: 10\n');
    expect(buildRobotsTxt({ userAgent: '*', rules: [], sitemaps: [], crawlDelay: null }))
      .toBe('User-agent: *\n');
  });
  it('Sitemap 前空行分隔, 多行依次输出', () => {
    const text = buildRobotsTxt({
      userAgent: 'Baiduspider',
      rules: [rule('disallow', '/api/')],
      sitemaps: ['https://example.com/sitemap.xml', 'https://example.com/sitemap2.xml'],
      crawlDelay: 5,
    });
    expect(text).toBe(
      'User-agent: Baiduspider\nDisallow: /api/\nCrawl-delay: 5\n\n' +
      'Sitemap: https://example.com/sitemap.xml\nSitemap: https://example.com/sitemap2.xml\n'
    );
  });
  it('User-agent 首尾空白被裁剪', () => {
    expect(buildRobotsTxt({ userAgent: '  *  ', rules: [], sitemaps: [], crawlDelay: null }))
      .toBe('User-agent: *\n');
  });
  it('路径裁剪空白', () => {
    expect(buildRobotsTxt({ userAgent: '*', rules: [rule('disallow', '  /tmp/  ')], sitemaps: [], crawlDelay: null }))
      .toBe('User-agent: *\nDisallow: /tmp/\n');
  });
});

describe('参数校验', () => {
  it('路径必须以 / 开头', () => {
    expect(() => buildRobotsTxt({ userAgent: '*', rules: [rule('disallow', 'admin/')], sitemaps: [], crawlDelay: null }))
      .toThrow('必须以 "/" 开头');
    expect(() => buildRobotsTxt({ userAgent: '*', rules: [rule('allow', 'http://x')], sitemaps: [], crawlDelay: null }))
      .toThrow('必须以 "/" 开头');
  });
  it('路径为空抛错', () => {
    expect(() => buildRobotsTxt({ userAgent: '*', rules: [rule('disallow', '')], sitemaps: [], crawlDelay: null }))
      .toThrow('不能为空');
  });
  it('换行符抛错', () => {
    expect(() => buildRobotsTxt({ userAgent: '*', rules: [rule('disallow', '/a\nb')], sitemaps: [], crawlDelay: null }))
      .toThrow('换行');
  });
  it('User-agent 为空抛错', () => {
    expect(() => buildRobotsTxt({ userAgent: '  ', rules: [], sitemaps: [], crawlDelay: null }))
      .toThrow('不能为空');
  });
  it('Sitemap 需 http(s):// 开头', () => {
    expect(() => buildRobotsTxt({ userAgent: '*', rules: [], sitemaps: ['ftp://x'], crawlDelay: null }))
      .toThrow('http(s)://');
  });
});

describe('预设', () => {
  it('三个预设均能生成合法内容', () => {
    for (const p of ROBOTS_PRESETS) {
      const text = buildRobotsTxt({ userAgent: p.userAgent, rules: p.rules.map((r) => rule(r.kind, r.path)), sitemaps: [], crawlDelay: p.crawlDelay });
      expect(text.startsWith('User-agent: ')).toBe(true);
      expect(text.endsWith('\n')).toBe(true);
    }
  });
});
