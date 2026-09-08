import { extractUrls, urlsToText, dedupeByOrigin } from './lib';

const TXT = `官网地址: https://www.example.com 与文档 https://docs.example.com/api
邮件里附带了 https://en.wikipedia.org/wiki/JSON_(file_format) 这个链接。
行尾例子: 访问 https://example.com/page1, https://example.com/page2。
重复的: https://example.com/page1 又出现一次; https://www.example.com 也算重复主体。
ftp 文件: ftp://files.example.com/pub/readme.txt (备用)
其它: https://example.com/search?q=a&&b&lang=zh-CN.`;

describe('URL 提取', () => {
  test('提取全部 URL 并按出现顺序', () => {
    const urls = extractUrls(TXT);
    expect(urls[0]).toBe('https://www.example.com');
    expect(urls[1]).toBe('https://docs.example.com/api');
    expect(urls).toContain('ftp://files.example.com/pub/readme.txt');
  });
  test('清理尾部句读/标点', () => {
    const urls = extractUrls('去 https://example.com/page1。再看 https://a.com/x, 然后 https://b.com/y?q=1.');
    expect(urls).toEqual([
      'https://example.com/page1',
      'https://a.com/x',
      'https://b.com/y?q=1',
    ]);
  });
  test('合法圆括号保留, 不成对括号截断', () => {
    expect(extractUrls('见 https://en.wikipedia.org/wiki/JSON_(file_format) 说明')[0]).toBe('https://en.wikipedia.org/wiki/JSON_(file_format)');
    const cut = extractUrls('链接 https://example.com/a_(b)) 结尾');
    expect(cut[0]).toBe('https://example.com/a_(b)');
  });
  test('去重 (默认) 与不去重', () => {
    const src = 'https://a.com https://a.com https://b.com';
    expect(extractUrls(src)).toEqual(['https://a.com', 'https://b.com']);
    expect(extractUrls(src, { dedupe: false })).toEqual(['https://a.com', 'https://a.com', 'https://b.com']);
  });
  test('httpOnly 过滤非 http(s)', () => {
    const urls = extractUrls('http://a.com ftp://f.com https://b.com', { httpOnly: true });
    expect(urls).toEqual(['http://a.com', 'https://b.com']);
  });
  test('空文本 / 无链接', () => {
    expect(extractUrls('')).toEqual([]);
    expect(extractUrls('没有链接的文本 www.example.com 也不是')).toEqual([]);
  });
  test('文本输出与按主体去重', () => {
    expect(urlsToText(['https://a.com', 'https://b.com'])).toBe('https://a.com\nhttps://b.com');
    const deduped = dedupeByOrigin(['https://www.example.com', 'https://www.example.com/a', 'https://docs.example.com']);
    expect(deduped).toEqual(['https://www.example.com', 'https://docs.example.com']);
  });
});
