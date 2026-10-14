// 扩展词库 (Sensitive-lexicon) 元信息 / 解码 / 缓存 测试
import fs from 'node:fs';
import path from 'node:path';
import { LEVEL_DESC, LEVEL_ORDER } from './data';
import {
  LEXICON_BUILT_AT, LEXICON_CATEGORIES, LEXICON_MAP, LEXICON_SOURCE, LEXICON_TOTAL,
  decodeLexicon, lexiconWords, loadLexiconWords, type LexKey,
} from './lexicon';

/** 与 scripts/build-sensitive-lexicon.mjs 的 FILES 保持一致 */
const KEYS: LexKey[] = [
  'politics', 'rebel', 'terror', 'weapon', 'porn', 'pornType', 'corrupt', 'livelihood',
  'covid', 'thought', 'gfw', 'netease', 'tencent', 'ad', 'other', 'extra', 'url',
];

describe('扩展词库 (Sensitive-lexicon) 元信息', () => {
  it('分类顺序与 LexKey 声明一致', () => {
    expect(LEXICON_CATEGORIES.map((c) => c.key)).toEqual(KEYS);
    expect(Object.keys(LEXICON_MAP).sort()).toEqual([ ...KEYS ].sort());
  });

  it('每个分类都有显示名 / 上游文件 / 合法等级 / 词条数', () => {
    LEXICON_CATEGORIES.forEach((c) => {
      expect(c.label).not.toBe('');
      expect(c.file).toMatch(/\.txt$/);
      expect(LEVEL_ORDER).toContain(c.level);
      expect(c.count).toBeGreaterThan(10);
    });
  });

  it('词条总数 = 各分类之和 (万级, 覆盖上游主要文件)', () => {
    expect(LEXICON_TOTAL).toBe(LEXICON_CATEGORIES.reduce((n, c) => n + c.count, 0));
    expect(LEXICON_TOTAL).toBeGreaterThan(50000);
  });

  it('带上游来源与许可信息 (MIT 署名)', () => {
    expect(LEXICON_SOURCE).toContain('github.com/konsheng/Sensitive-lexicon');
    expect(LEXICON_BUILT_AT).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('扩展词库解码', () => {
  it('按分类解码出词条, 等级与建议随分类元信息', async () => {
    const category = LEXICON_MAP.ad;
    const words = await lexiconWords('ad');
    expect(words).toHaveLength(category.count);
    const set = new Set(words.map((w) => w.word));
    expect(set.has('兼职')).toBe(true);
    expect(set.has('招聘')).toBe(true);
    expect(words[0].level).toBe('low');
    expect(words[0].tip).toBe(LEVEL_DESC.low);
  });

  it('解码结果按分类缓存 (同一数组引用)', async () => {
    const first = await lexiconWords('covid');
    const second = await lexiconWords('covid');
    expect(second).toBe(first);
  });

  it('可一次加载多个分类', async () => {
    const banks = await loadLexiconWords([ 'thought', 'pornType' ]);
    expect(banks.thought).toHaveLength(LEXICON_MAP.thought.count);
    expect(banks.pornType).toHaveLength(LEXICON_MAP.pornType.count);
    expect(banks.covid).toBeUndefined();
  });

  it('未知分类抛错 (避免静默返回空词表)', async () => {
    await expect(lexiconWords('nope' as LexKey)).rejects.toThrow('未知的扩展词库分类');
  });

  it('词表按「分类内去重 + 排序」生成, 无空词条 / 单字词条', async () => {
    const words = await lexiconWords('livelihood');
    const list = words.map((w) => w.word);
    expect(list).toEqual([ ...list ].sort());
    expect(new Set(list).size).toBe(list.length);
    list.forEach((w) => {
      expect(w.trim()).toBe(w);
      expect(w).not.toBe('');
      expect([ ...w ].length).toBeGreaterThan(1);
    });
  });
});

describe('扩展词库存储形态', () => {
  /** 读取仓库里的词库文件 (源码扫描式断言, 不依赖打包结果) */
  const read = (file: string) => fs.readFileSync(path.resolve(__dirname, file), 'utf8');

  it('词表以 XOR + Base64 编码存放, 明文不外泄', async () => {
    const enc = read('lexicon.enc.json');
    expect(enc).toContain('"algo":"xor+base64"');
    // 编码后的文件里不应出现明文词条 (仓库 / 产物被关键词扫描规则命中的风险)
    expect(enc).not.toContain('兼职');
    expect(enc).not.toContain('招聘');
    // 而解码后能拿到词条
    const words = await lexiconWords('ad');
    expect(words.some((w) => w.word === '兼职')).toBe(true);
  });

  it('元信息文件只有分类名 (明文), 不含词条本体', () => {
    const meta = read('lexicon.meta.json');
    expect(meta).toContain('涉政');
    expect(meta).not.toContain('兼职');
    expect(meta.length).toBeLessThan(20 * 1024);
  });

  it('decodeLexicon 能还原 UTF-8 (含 emoji / 代理对)', () => {
    const enc = read('lexicon.enc.json');
    const base64 = JSON.parse(enc).data.thought as string;
    const text = decodeLexicon(base64);
    expect(text.split('\n')).toHaveLength(LEXICON_MAP.thought.count);
    // 解码结果里包含中文多字节字符 (说明 UTF-8 还原正确)
    expect(/[\u4E00-\u9FA5]/.test(text)).toBe(true);
  });
});
