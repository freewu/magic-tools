// 网页 TDK 信息检测 - 解析与长度检测单元测试
import {
  TDK_LIMITS,
  checkTdkField,
  countChars,
  decodeHtmlEntities,
  extractMetaContent,
  extractTitle,
  parseTdk,
} from './lib';

const sample = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>  某某网站 - 开发者工具集 &amp; 在线小工具  </title>
  <meta name="keywords" content="开发者工具,编码解码,加解密">
  <meta name="description" content='这是一段描述, 长度正常' />
  <meta property="og:description" content="不应被识别为 description">
</head>
<body><title>嵌套在 body 里的 title 不应被取到</title></body>
</html>
`;

describe('HTML 实体解码', () => {
  it('命名实体', () => {
    expect(decodeHtmlEntities('a&amp;b &lt;tag&gt; &quot;q&quot; &apos;x&apos;')).toBe('a&b <tag> "q" \'x\'');
    expect(decodeHtmlEntities('&nbsp;&copy;&hellip;')).toBe('\u00a0\u00a9\u2026');
  });
  it('十进制 / 十六进制数字实体', () => {
    expect(decodeHtmlEntities('&#39;&#x4e2d;&#x6587;')).toBe('\'中文');
  });
  it('未知实体原样保留', () => {
    expect(decodeHtmlEntities('&nosuchentity; &')).toBe('&nosuchentity; &');
  });
  it('无实体时原样返回', () => {
    expect(decodeHtmlEntities('abc def')).toBe('abc def');
  });
});

describe('标题提取', () => {
  it('取 head 中第一个 <title>, 折叠空白并解码实体', () => {
    expect(extractTitle(sample)).toBe('某某网站 - 开发者工具集 & 在线小工具');
  });
  it('无 <title> 返回空串', () => {
    expect(extractTitle('<html><head></head></html>')).toBe('');
  });
  it('标题含换行折叠为单空格', () => {
    expect(extractTitle('<title>\n  第一行\n  第二行\n</title>')).toBe('第一行 第二行');
  });
});

describe('meta 内容提取', () => {
  it('keywords', () => {
    expect(extractMetaContent(sample, 'keywords')).toBe('开发者工具,编码解码,加解密');
  });
  it('description 只认 name, 不认 property (og:description 忽略)', () => {
    expect(extractMetaContent(sample, 'description')).toBe('这是一段描述, 长度正常');
  });
  it('单引号 / 无引号属性', () => {
    expect(extractMetaContent('<meta name=keywords content=abc>', 'keywords')).toBe('abc');
    expect(extractMetaContent("<meta name='description' content='中文 描述'>", 'description')).toBe('中文 描述');
  });
  it('属性大小写不敏感', () => {
    expect(extractMetaContent('<META NAME="KEYWORDS" CONTENT="ABC">', 'keywords')).toBe('ABC');
  });
  it('缺失返回空串', () => {
    expect(extractMetaContent('<html></html>', 'description')).toBe('');
  });
});

describe('TDK 整体解析', () => {
  it('解析 title / keywords / description', () => {
    const tdk = parseTdk(sample);
    expect(tdk.title).toBe('某某网站 - 开发者工具集 & 在线小工具');
    expect(tdk.keywords).toBe('开发者工具,编码解码,加解密');
    expect(tdk.description).toBe('这是一段描述, 长度正常');
  });
  it('空页面全部为空', () => {
    expect(parseTdk('')).toEqual({ title: '', keywords: '', description: '' });
  });
});

describe('长度计数与检测', () => {
  it('字符计数: 中文英文混排, emoji 代理对计 1', () => {
    expect(countChars('abcd')).toBe(4);
    expect(countChars('中文字符测试')).toBe(6);
    expect(countChars('a中b😀')).toBe(4);
  });
  it('标题 80 上限边界', () => {
    const under = '字'.repeat(80);
    const over = '字'.repeat(81);
    expect(checkTdkField(under, TDK_LIMITS.title).status).toBe('ok');
    expect(checkTdkField(over, TDK_LIMITS.title).status).toBe('over');
    expect(checkTdkField('', TDK_LIMITS.title).status).toBe('empty');
  });
  it('keyword 100 / description 200 上限', () => {
    expect(checkTdkField('k'.repeat(100), TDK_LIMITS.keywords).status).toBe('ok');
    expect(checkTdkField('k'.repeat(101), TDK_LIMITS.keywords).status).toBe('over');
    expect(checkTdkField('d'.repeat(200), TDK_LIMITS.description).status).toBe('ok');
    expect(checkTdkField('d'.repeat(201), TDK_LIMITS.description).status).toBe('over');
  });
  it('percent 封顶 100', () => {
    expect(checkTdkField('x'.repeat(200), TDK_LIMITS.title).percent).toBe(100);
    expect(checkTdkField('x'.repeat(40), TDK_LIMITS.title).percent).toBe(50);
  });
});
