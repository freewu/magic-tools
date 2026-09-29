import {
  BANK_KEYS, BANK_LABELS, COMMON_BANK, DEFAULTS_STORAGE_KEY, GZH_BANK, LEVEL_COLOR,
  LEVEL_DESC, LEVEL_LABELS, LEVEL_ORDER, MASK_CHAR_DEFAULT, MASK_CHAR_OPTIONS,
  SENSITIVE_BANKS, SAMPLE_TEXT, XHS_BANK, unionBank,
} from './data';
import {
  DEFAULT_SETTINGS, POS_LIMIT, automatonOf, buildAutomaton, fileStamp, getSettings,
  highlightParts, lineCol, maskSpans, maskText, maskedFileName, normalizeBank,
  normalizeMaskChar, normalizeSettings, normalizeText, patchSettings, positionLabel,
  readTime, reportFileName, reportText, scanBank, scanText, setSettings, textLength,
} from './lib';

const wordsOf = (bank: { word: string }[]) => bank.map((e) => e.word.toLowerCase());

beforeEach(() => {
  localStorage.clear();
});

// ---------------- 词库数据自检 ----------------

describe('词库数据', () => {
  test('三个词库的规模与说明一致', () => {
    expect(XHS_BANK).toHaveLength(66);
    expect(GZH_BANK).toHaveLength(55);
    expect(COMMON_BANK).toHaveLength(78);
  });

  test('各词库内部没有重复词 (忽略大小写)', () => {
    [ XHS_BANK, GZH_BANK, COMMON_BANK ].forEach((bank) => {
      const keys = wordsOf(bank);
      expect(new Set(keys).size).toBe(keys.length);
    });
  });

  test('每条词条都有词 / 合法等级 / 建议', () => {
    [ XHS_BANK, GZH_BANK, COMMON_BANK ].forEach((bank) => {
      bank.forEach((entry) => {
        expect(entry.word.length).toBeGreaterThan(0);
        expect(LEVEL_ORDER).toContain(entry.level);
        expect(entry.tip.length).toBeGreaterThan(0);
      });
    });
  });

  test('通用词库是两个平台词库的并集', () => {
    const common = new Set(wordsOf(COMMON_BANK));
    [ XHS_BANK, GZH_BANK ].forEach((bank) => {
      wordsOf(bank).forEach((word) => expect(common.has(word)).toBe(true));
    });
    expect(COMMON_BANK).toHaveLength(66 + 55 - 43);
  });

  test('unionBank 按出现顺序去重, 先出现的词条优先', () => {
    const merged = unionBank(
      [ { word: 'A', level: 'high', tip: 'first' } ],
      [ { word: 'a', level: 'low', tip: 'second' }, { word: 'B', level: 'mid', tip: 'b' } ]
    );
    expect(merged.map((e) => e.word)).toEqual([ 'A', 'B' ]);
    expect(merged[0].tip).toBe('first');
  });

  test('SENSITIVE_BANKS / 标签 / 颜色 / 描述 覆盖全部词库与等级', () => {
    expect(BANK_KEYS).toEqual([ 'common', 'xhs', 'gzh' ]);
    BANK_KEYS.forEach((key) => {
      expect(SENSITIVE_BANKS[key]).toBeDefined();
      expect(typeof BANK_LABELS[key]).toBe('string');
    });
    LEVEL_ORDER.forEach((level) => {
      expect(typeof LEVEL_LABELS[level]).toBe('string');
      expect(typeof LEVEL_DESC[level]).toBe('string');
      expect(typeof LEVEL_COLOR[level]).toBe('string');
    });
    expect(DEFAULTS_STORAGE_KEY).toBe('sensitive-word:defaults');
    expect(MASK_CHAR_OPTIONS).toContain(MASK_CHAR_DEFAULT);
  });

  test('示例文案覆盖多个等级与两个平台的专有词', () => {
    const scan = scanText(SAMPLE_TEXT, { loose: true, latinBoundary: true });
    expect(scan.xhs.total).toBeGreaterThan(3);
    expect(scan.gzh.total).toBeGreaterThan(0);
    expect(scan.common.counts.high).toBeGreaterThan(0);
  });
});

// ---------------- 自动机 ----------------

describe('buildAutomaton', () => {
  test('节点数 = 去重后的前缀数 + 根节点', () => {
    expect(buildAutomaton([ { word: 'ab', level: 'high', tip: '' } ]).size).toBe(3);
    expect(buildAutomaton([
      { word: 'ab', level: 'high', tip: '' },
      { word: 'ac', level: 'high', tip: '' },
    ]).size).toBe(4);
  });

  test('空词库只有根节点', () => {
    const automaton = buildAutomaton([]);
    expect(automaton.size).toBe(1);
    expect(automaton.root.next.size).toBe(0);
  });

  test('同一个词重复出现只建一个终端', () => {
    const automaton = buildAutomaton([
      { word: 'Abc', level: 'high', tip: 'a' },
      { word: 'abc', level: 'low', tip: 'b' },
    ]);
    expect(automaton.size).toBe(4);
    expect(automaton.root.next.get('a')?.next.get('b')?.next.get('c')?.word?.tip).toBe('a');
  });

  test('自动机按词库缓存', () => {
    expect(automatonOf('xhs')).toBe(automatonOf('xhs'));
    expect(automatonOf('xhs')).not.toBe(automatonOf('gzh'));
  });
});

// ---------------- 归一化 ----------------

describe('normalizeText', () => {
  test('全角字符折半角', () => {
    expect(normalizeText('ｖｘ１００％').text).toBe('vx100%');
  });

  test('去掉零宽字符 (两种模式都去)', () => {
    expect(normalizeText('微\u200B信').text).toBe('微信');
    expect(normalizeText('微\u200B信', false).text).toBe('微信');
  });

  test('宽松模式忽略间隔符, 精确模式保留', () => {
    expect(normalizeText('微 信').text).toBe('微信');
    expect(normalizeText('微 信', false).text).toBe('微 信');
    expect(normalizeText('v.x', true).text).toBe('vx');
  });

  test('百分号不是间隔符 (保证 100% 可命中)', () => {
    expect(normalizeText('100%', true).text).toBe('100%');
  });

  test('map 指回原文下标', () => {
    const { text, map } = normalizeText('微 信', true);
    expect(text).toBe('微信');
    expect(map).toEqual([ 0, 2 ]);
  });

  test('大小写统一为小写', () => {
    expect(normalizeText('VX').text).toBe('vx');
  });
});

// ---------------- 扫描 ----------------

describe('scanBank', () => {
  test('命中词 / 等级 / 位置与原文切片一致', () => {
    const raw = '这款面膜祛斑效果很好';
    const scan = scanBank(raw, 'xhs');
    const hit = scan.hits.find((h) => h.word === '祛斑');
    expect(hit).toBeDefined();
    expect(hit?.level).toBe('high');
    expect(hit?.start).toBe(4);
    expect(raw.slice(hit!.start, hit!.end)).toBe('祛斑');
    expect(hit?.text).toBe('祛斑');
  });

  test('干净文本没有命中', () => {
    const scan = scanBank('今天天气不错, 出门散步', 'common');
    expect(scan.total).toBe(0);
    expect(scan.words).toEqual([]);
    expect(scan.counts).toEqual({ high: 0, mid: 0, low: 0 });
  });

  test('默认就是宽松匹配 + 拉丁词边界', () => {
    expect(scanBank('微 信', 'xhs').total).toBe(1);
    expect(scanBank('version 2', 'xhs').total).toBe(0);
    expect(scanBank('version 2', 'xhs', { latinBoundary: false }).total).toBeGreaterThan(0);
  });

  test('关闭宽松匹配后夹间隔符的写法不再命中', () => {
    expect(scanBank('微 信', 'xhs', { loose: false }).total).toBe(0);
    expect(scanBank('微信', 'xhs', { loose: false }).total).toBe(1);
  });

  test('全角与大小写变体同样命中', () => {
    expect(scanBank('加我ｖｘ', 'xhs').hits.some((h) => h.word === 'vx')).toBe(true);
    expect(scanBank('加我VX123456', 'xhs').hits.some((h) => h.text === 'VX')).toBe(true);
  });

  test('拉丁词边界允许数字相邻 (vx123456), 但不允许字母相邻', () => {
    expect(scanBank('vx123456', 'xhs').hits.some((h) => h.word === 'vx')).toBe(true);
    expect(scanBank('version', 'xhs').hits.some((h) => h.word === 'v')).toBe(false);
    expect(scanBank('qqmail', 'gzh').hits.some((h) => h.word.toLowerCase() === 'qq')).toBe(false);
  });

  test('同一位置重叠命中全部返回且已去重', () => {
    const scan = scanBank('最后一天', 'gzh');
    const keys = scan.hits.map((h) => `${h.word}|${h.start}|${h.end}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(scan.words.map((w) => w.word)).toContain('最后一天');
    expect(scan.words.map((w) => w.word)).toContain('最');
  });

  test('命中按位置升序, 同位置长者在前', () => {
    const hits = scanBank('最后一天', 'gzh').hits;
    for (let i = 1; i < hits.length; i += 1) {
      expect(hits[i].start).toBeGreaterThanOrEqual(hits[i - 1].start);
      if (hits[i].start === hits[i - 1].start) expect(hits[i].end).toBeLessThanOrEqual(hits[i - 1].end);
    }
  });

  test('按词汇总次数与位置, 等级高的排前面', () => {
    const scan = scanBank('祛斑, 祛斑, 最后一天', 'common');
    const stat = scan.words.find((w) => w.word === '祛斑');
    expect(stat?.count).toBe(2);
    expect(stat?.positions).toEqual([ 0, 4 ]);
    expect(scan.counts.high + scan.counts.mid + scan.counts.low).toBe(scan.total);
    expect(scan.total).toBe(scan.hits.length);
    const ranks = scan.words.map((w) => LEVEL_ORDER.indexOf(w.level));
    expect([ ...ranks ].sort((a, b) => a - b)).toEqual(ranks);
  });

  test('两个平台的专有词互不干扰, 通用词库取并集', () => {
    const scans = scanText('二维码 集赞', { loose: true, latinBoundary: true });
    expect(scans.xhs.hits.some((h) => h.word === '二维码')).toBe(true);
    expect(scans.xhs.hits.some((h) => h.word === '集赞')).toBe(false);
    expect(scans.gzh.hits.some((h) => h.word === '集赞')).toBe(true);
    expect(scans.gzh.hits.some((h) => h.word === '二维码')).toBe(false);
    expect(scans.common.total).toBe(scans.xhs.total + scans.gzh.total);
  });

  test('scanText 返回三个词库, key 字段自洽', () => {
    const scans = scanText('微信', { loose: true, latinBoundary: true });
    expect(Object.keys(scans).sort()).toEqual([ 'common', 'gzh', 'xhs' ]);
    BANK_KEYS.forEach((key) => expect(scans[key].key).toBe(key));
  });
});

// ---------------- 打码 / 高亮 ----------------

describe('maskSpans / maskText', () => {
  test('同一起点保留最长命中', () => {
    const hits = scanBank('最后一天', 'gzh').hits;
    const spans = maskSpans(hits);
    const cover = spans.filter((s) => s.start === 0);
    expect(cover).toHaveLength(1);
    expect(cover[0].end).toBe(4);
  });

  test('重叠命中按最长贪心合并, 不重复覆盖', () => {
    const merged = maskSpans([
      { word: 'a', level: 'high', tip: '', start: 0, end: 2, text: '' },
      { word: 'b', level: 'high', tip: '', start: 1, end: 3, text: '' },
      { word: 'c', level: 'high', tip: '', start: 2, end: 4, text: '' },
    ]);
    expect(merged.map((s) => [ s.start, s.end ])).toEqual([ [ 0, 2 ], [ 2, 4 ] ]);
  });

  test('打码替换命中片段, 未命中部分保持原样', () => {
    const raw = 'a祛斑b';
    const hits = scanBank(raw, 'xhs').hits;
    expect(maskText(raw, hits)).toBe('a**b');
    expect(maskText(raw, hits, '●')).toBe('a●●b');
  });

  test('打码字符非法时回退默认字符', () => {
    const raw = '祛斑';
    expect(maskText(raw, scanBank(raw, 'xhs').hits, 'Z')).toBe('**');
  });

  test('宽松命中时打码覆盖整段 (含间隔符), 但保留换行', () => {
    const loose = '微 信';
    expect(maskText(loose, scanBank(loose, 'xhs').hits, '●')).toBe('●●●');
    const multi = '微\n信';
    expect(maskText(multi, scanBank(multi, 'xhs').hits, '●')).toBe('●\n●');
  });

  test('没有命中时返回原文', () => {
    expect(maskText('今天天气不错', scanBank('今天天气不错', 'common').hits)).toBe('今天天气不错');
  });
});

describe('highlightParts', () => {
  test('拼接结果等于原文, 命中片段带 hit', () => {
    const raw = 'a祛斑b微信c';
    const hits = scanBank(raw, 'common').hits;
    const parts = highlightParts(raw, hits);
    expect(parts.map((p) => p.text).join('')).toBe(raw);
    expect(parts.filter((p) => p.hit).length).toBe(hits.length);
    parts.filter((p) => p.hit).forEach((p) => expect(p.text).toBe(raw.slice(p.hit!.start, p.hit!.end)));
  });

  test('没有命中时只有一段普通文本', () => {
    const parts = highlightParts('今天天气不错', []);
    expect(parts).toEqual([ { text: '今天天气不错', hit: null } ]);
  });

  test('重叠命中按最长合并, 段落不重叠', () => {
    const raw = '最后一天';
    const parts = highlightParts(raw, scanBank(raw, 'gzh').hits);
    expect(parts.filter((p) => p.hit)).toHaveLength(1);
    expect(parts.map((p) => p.text).join('')).toBe(raw);
  });
});

// ---------------- 位置 / 文件名 / 报告 ----------------

describe('位置与字数', () => {
  test('lineCol 行列均从 1 开始', () => {
    expect(lineCol('ab\ncd', 0)).toEqual({ line: 1, col: 1 });
    expect(lineCol('ab\ncd', 3)).toEqual({ line: 2, col: 1 });
    expect(lineCol('ab\ncd', 2)).toEqual({ line: 1, col: 3 });
  });

  test('positionLabel 给出中文位置描述', () => {
    expect(positionLabel('你好\n世界', 3)).toBe('第 2 行第 1 字');
    expect(positionLabel('祛斑', 0)).toBe('第 1 行第 1 字');
  });

  test('textLength 按码点计数 (emoji 算一个字)', () => {
    expect(textLength('a😀')).toBe(2);
    expect(textLength('微 信')).toBe(3);
    expect(textLength('')).toBe(0);
  });
});

describe('文件名与时间', () => {
  const date = new Date(2026, 8, 28, 21, 30, 45);

  test('fileStamp 形如 YYYYMMDD-HHmmss', () => {
    expect(fileStamp(date)).toBe('20260928-213045');
  });

  test('readTime 形如 YYYY-MM-DD HH:mm:ss', () => {
    expect(readTime(date)).toBe('2026-09-28 21:30:45');
  });

  test('导出文件名带时间戳与 .txt 后缀', () => {
    expect(maskedFileName(date)).toBe('sensitive-word-masked-20260928-213045.txt');
    expect(reportFileName(date)).toBe('sensitive-word-report-20260928-213045.txt');
  });
});

describe('reportText', () => {
  const opt = { loose: true, latinBoundary: true };

  test('报告包含概览 / 各词库小节 / 词条位置与建议', () => {
    const raw = '祛斑 最后一天';
    const scans = scanText(raw, opt);
    const report = reportText(raw, scans, opt, new Date(2026, 8, 28, 10, 0, 0));
    expect(report).toContain('敏感词检测报告');
    expect(report).toContain('生成时间: 2026-09-28 10:00:00');
    expect(report).toContain('文本字数: 7');
    expect(report).toContain('宽松匹配');
    expect(report).toContain('【通用词库】');
    expect(report).toContain('【小红书词库】');
    expect(report).toContain('【微信公众号词库】');
    expect(report).toContain('祛斑 [高危] ×1 位置: 第 1 行第 1 字');
    expect(report).toContain('建议:');
    expect(report).toContain('命中合计');
    expect(report).toContain('不构成法律意见');
  });

  test('没有命中时每个词库都写「无命中」', () => {
    const raw = '今天天气不错';
    const report = reportText(raw, scanText(raw, opt), opt);
    expect(report.match(/无命中/g)).toHaveLength(BANK_KEYS.length);
    expect(report).toContain('命中合计: 0 处 / 0 个词');
  });

  test('精确匹配时规则描述为精确匹配', () => {
    const raw = '祛斑';
    const exact = { loose: false, latinBoundary: false };
    const report = reportText(raw, scanText(raw, exact), exact);
    expect(report).toContain('精确匹配');
    expect(report).toContain('拉丁词边界关');
  });

  test('位置过多时只列 POS_LIMIT 个并给出总数', () => {
    const raw = new Array(7).fill('祛斑').join(' ');
    const report = reportText(raw, scanText(raw, opt), opt);
    expect(report).toContain(`等 ${7} 处`);
    // 三个词库小节各一行 (祛斑在三个词库里都有)
    expect(report.match(/×7 位置: 第 1 行第 1 字/g)).toHaveLength(3);
    expect(report.split('第 1 行第 7 字').length).toBeGreaterThan(1);
    expect(POS_LIMIT).toBe(5);
  });
});

// ---------------- 默认设置 ----------------

describe('默认设置', () => {
  test('DEFAULT_SETTINGS 与文档一致', () => {
    expect(DEFAULT_SETTINGS).toEqual({ bank: 'common', loose: true, latinBoundary: true, maskChar: '*' });
  });

  test('normalizeSettings 回退非法值', () => {
    expect(normalizeSettings()).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings({ bank: 'nope' as never })).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings({ maskChar: '@' }).maskChar).toBe('*');
    expect(normalizeSettings({ bank: 'xhs', maskChar: '●', loose: false })).toEqual({
      bank: 'xhs', loose: false, latinBoundary: true, maskChar: '●',
    });
  });

  test('normalizeBank / normalizeMaskChar', () => {
    expect(normalizeBank('gzh')).toBe('gzh');
    expect(normalizeBank('other')).toBe('common');
    expect(normalizeMaskChar('○')).toBe('○');
    expect(normalizeMaskChar('')).toBe('*');
  });

  test('getSettings 无数据时返回默认', () => {
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  test('setSettings 写入 localStorage 且可读回', () => {
    setSettings({ bank: 'xhs', loose: false, latinBoundary: false, maskChar: '×' });
    expect(JSON.parse(localStorage.getItem(DEFAULTS_STORAGE_KEY) as string)).toEqual({
      bank: 'xhs', loose: false, latinBoundary: false, maskChar: '×',
    });
    expect(getSettings()).toEqual({ bank: 'xhs', loose: false, latinBoundary: false, maskChar: '×' });
  });

  test('getSettings 容忍损坏数据', () => {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, '{not json');
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  test('patchSettings 局部更新并持久化', () => {
    setSettings({ bank: 'gzh', maskChar: '●' });
    expect(patchSettings({ loose: false })).toEqual({ bank: 'gzh', loose: false, latinBoundary: true, maskChar: '●' });
    expect(getSettings().bank).toBe('gzh');
    expect(getSettings().loose).toBe(false);
  });
});
