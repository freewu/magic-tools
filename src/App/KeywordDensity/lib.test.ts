import {
  analyzeText, buildTermTable, countOccurrences, keywordDensity, keywordsReport, levelLabel, countEffectiveChars,
} from './lib';

describe('基础统计', () => {
  test('有效字符计数排除空白与标点', () => {
    expect(countEffectiveChars('Hello, world! 你好，世界！')).toBe(14); // 10 英文 + 4 中文
  });
  test('analyzeText 基础统计', () => {
    const s = analyzeText('Hello world 你好世界。\n第二段 Seo 技巧!');
    expect(s.latinWords).toBe(3); // Hello world Seo
    expect(s.hanChars).toBe(9); // 你好世界 + 第二段 + 技巧
    expect(s.paragraphs).toBe(2);
    expect(s.sentences).toBeGreaterThan(0);
  });
});

describe('词频表', () => {
  test('英文 token 统计与降序', () => {
    const list = buildTermTable('Apple apple banana, apples!');
    expect(list[0]).toMatchObject({ term: 'apple', count: 2 });
    expect(list.map((x) => x.term)).toEqual(['apple', 'apples', 'banana']);
  });
  test('停用词过滤', () => {
    const all = buildTermTable('the apple and the banana');
    expect(all.length).toBe(4); // the(2次) apple and banana
    const clean = buildTermTable('the apple and the banana', { stopwords: true });
    expect(clean.map((x) => x.term)).toEqual(['apple', 'banana']);
  });
});

describe('关键词出现次数', () => {
  test('英文大小写不敏感 + 词边界', () => {
    expect(countOccurrences('SEO 优化 seo 技巧 seofoo', 'seo')).toBe(2);
  });
  test('中文子串统计', () => {
    expect(countOccurrences('数据分析 数据挖掘 数据结构', '数据')).toBe(3);
  });
});

describe('密度与水平', () => {
  const base = 'Keyword density measures the share of a keyword in your content. ';
  const filler = 'This article explains how search engines analyze pages, rank results, and evaluate on-page topics in practice. ';
  const text = base + filler.repeat(8);
  test('密度公式与正常水平', () => {
    const r = keywordDensity(text, 'keyword');
    expect(r.occurrences).toBe(2); // Keyword + keyword
    const expectDensity = Number(((2 * 7 / countEffectiveChars(text)) * 100).toFixed(2));
    expect(r.density).toBe(expectDensity);
    expect(r.level).toBe('normal');
    expect(levelLabel(r.level)).toBe('正常');
  });
  test('未出现 / 堆砌过高', () => {
    expect(keywordDensity(text, 'xyzabc').level).toBe('not-found');
    const spam = keywordDensity('seo seo seo seo seo tips', 'seo');
    expect(spam.level).toBe('over');
    expect(levelLabel(spam.level)).toContain('堆砌');
  });
  test('批处理去重', () => {
    const rs = keywordsReport('seo 与 seo 工具', ['seo', ' seo ', '工具']);
    expect(rs).toHaveLength(2);
    expect(rs[0].keyword).toBe('seo');
    expect(rs[0].occurrences).toBe(2);
  });
  test('空输入安全', () => {
    expect(keywordDensity('', 'x').density).toBe(0);
    expect(keywordDensity('abc', '').level).toBe('not-found');
  });
});
