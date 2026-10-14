// 敏感词检测 核心逻辑: Aho-Corasick 多模式匹配 + 命中聚合 / 打码 / 报告 / 默认设置
//
// 引擎说明: npm 上名为 sensitive-word 的包只是 4 行英文正则替换 (没有中文词库、
// 不给命中位置, 词里的正则元字符还会报错), 无法满足这里的需要, 因此按其 (以及
// mint-filter) 相同的 Aho-Corasick 思路在此实现: 构建一次自动机后线性扫过文本,
// 得到「敏感词 + 等级 + 建议 + 精确位置」。
import {
  BANK_KEYS, BANK_LABELS, DEFAULTS_STORAGE_KEY, LEVEL_LABELS, LEVEL_ORDER,
  MASK_CHAR_DEFAULT, SENSITIVE_BANKS,
  type BankKey, type Level, type WordMeta,
} from './data';

export type { BankKey, Level, WordMeta } from './data';

/** 单次命中 */
export interface Hit {
  /** 词库中的词 (原写法) */
  word: string;
  level: Level;
  tip: string;
  /** 原文起始下标 (0 起, 含) */
  start: number;
  /** 原文结束下标 (不含) */
  end: number;
  /** 原文命中片段 (宽松模式下可能夹着间隔符 / 全角字符) */
  text: string;
}

/** 同一敏感词的汇总 */
export interface WordStat {
  word: string;
  level: Level;
  tip: string;
  /** 命中次数 */
  count: number;
  /** 每次命中的原文起始下标 (升序) */
  positions: number[];
}

/** 单个词库的检测结果 (key 为内置词库编号或扩展词库分类键) */
export interface BankScan {
  key: string;
  /** 全部命中 (同一位置重复命中已去重) */
  hits: Hit[];
  /** 按敏感词汇总 (按等级 -> 次数排序) */
  words: WordStat[];
  /** 各等级的命中次数 */
  counts: Record<Level, number>;
  /** 命中总次数 */
  total: number;
}

/** 匹配选项 (工具页与设置中心共用) */
export interface ScanOptions {
  /** 宽松匹配: 忽略间隔符 / 零宽字符, 全角折半角 (用于发现「微 信」这类绕过写法) */
  loose: boolean;
  /** 拉丁词边界: 纯字母词要求左右不是字母, 避免「v」命中 version */
  latinBoundary: boolean;
}

/** 默认设置 (设置中心持久化; 工具页可临时改) */
export interface SensitiveDefaults extends ScanOptions {
  /** 默认词库 */
  bank: BankKey;
  /** 打码字符 */
  maskChar: string;
}

export const DEFAULT_SETTINGS: SensitiveDefaults = {
  bank: 'common',
  loose: true,
  latinBoundary: true,
  maskChar: MASK_CHAR_DEFAULT,
};

/** 报告里每个词最多列出的位置数 */
export const POS_LIMIT = 5;

/** 等级优先级 (0 = 最高) */
const rank = (level: Level): number => LEVEL_ORDER.indexOf(level);

// ---------------- 文本归一化 ----------------

/** 零宽 / 不可见字符 (绕过检测时常用) */
const INVISIBLE = new Set([
  '\u200B', '\u200C', '\u200D', '\u200E', '\u200F', '\u2060', '\uFEFF', '\u00AD', '\u180E',
]);

/** 宽松模式下会忽略的间隔符 (不含 % 等词库中出现的字符) */
const SEPARATOR_RE = /[\s\u00A0\u3000·・.。•|｜/\\\-_—–~～*＊\^`+=,，、;；:：!！?？'"“”‘’()（）\[\]【】{}｛｝<>《》]/;

/** 归一化结果: text 为小写化文本, map[归一化下标] = 原文下标 */
export interface NormalizedText {
  text: string;
  map: number[];
}

/**
 * 文本归一化:
 * 1. 全角 ASCII (FF01-FF5E) 折成半角, 便于发现「ｖｘ」这类写法
 * 2. 去掉零宽 / 不可见字符
 * 3. 宽松模式再去掉间隔符 (空格、点、横线、括号等), 便于发现「微 信」这类写法
 */
export const normalizeText = (raw: string, loose = true): NormalizedText => {
  let text = '';
  const map: number[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    const code = raw.charCodeAt(i);
    let ch = raw[i];
    if (code >= 0xFF01 && code <= 0xFF5E) ch = String.fromCharCode(code - 0xFEE0);
    if (INVISIBLE.has(ch)) continue;
    if (loose && SEPARATOR_RE.test(ch)) continue;
    text += ch.toLowerCase();
    map.push(i);
  }
  return { text, map };
};

// ---------------- Aho-Corasick ----------------

interface AcNode {
  next: Map<string, AcNode>;
  fail: AcNode | null;
  /** 该节点结尾的词 (仅终端节点非空) */
  word: WordMeta | null;
  /** 该节点结尾词的归一化匹配串 (宽松模式下与词面不同, 边界判定用) */
  key: string | null;
  /** 从根到该节点的字符数 */
  depth: number;
}

/** 自动机 (root + 节点数, 节点数仅用于测试与调试) */
export interface Automaton {
  root: AcNode;
  size: number;
}

const newNode = (depth: number): AcNode => ({ next: new Map(), fail: null, word: null, key: null, depth });

/**
 * 构建 Aho-Corasick 自动机: 小写化 trie + 失配指针
 * @param loose 宽松模式: 词条也按同一套规则归一化 (否则「000.bbexe.cn」这类含分隔符的词
 *              永远匹配不到已去掉分隔符的文本), 命中时仍展示词面原写法
 */
export const buildAutomaton = (bank: WordMeta[], loose = false): Automaton => {
  const root = newNode(0);
  let size = 1;
  bank.forEach((meta) => {
    const key = loose ? normalizeText(meta.word, true).text : meta.word.toLowerCase();
    if (key === '') return;
    let cur = root;
    for (const ch of key) {
      let next = cur.next.get(ch);
      if (!next) {
        next = newNode(cur.depth + 1);
        cur.next.set(ch, next);
        size += 1;
      }
      cur = next;
    }
    if (!cur.word) { // 同词重复时保留第一条
      cur.word = meta;
      cur.key = key;
    }
  });

  // BFS 建失配指针
  const queue: AcNode[] = [];
  root.next.forEach((child) => {
    child.fail = root;
    queue.push(child);
  });
  for (let i = 0; i < queue.length; i += 1) {
    const cur = queue[i];
    cur.next.forEach((child, ch) => {
      let fail = cur.fail;
      while (fail && !fail.next.has(ch)) fail = fail.fail;
      const target = fail?.next.get(ch) ?? null;
      child.fail = target && target !== child ? target : root;
      queue.push(child);
    });
  }
  return { root, size };
};

const automatonCache = new Map<string, Automaton>();

/**
 * 取任意词表的自动机: 按「id + 匹配模式」缓存 (同一 id 的词表需保持稳定)
 * 扩展词库 (Sensitive-lexicon) 分类解码后也走这里, 同一分类同一模式只构建一次
 */
export const automatonOfWords = (id: string, bank: WordMeta[], loose = false): Automaton => {
  const cacheKey = `${id}::${loose ? 'loose' : 'exact'}`;
  const cached = automatonCache.get(cacheKey);
  if (cached) return cached;
  const built = buildAutomaton(bank, loose);
  automatonCache.set(cacheKey, built);
  return built;
};

/** 取内置词库的自动机 (构建一次后缓存; 词库是模块常量, 无需失效) */
export const automatonOf = (key: BankKey, loose = false): Automaton => automatonOfWords(key, SENSITIVE_BANKS[key], loose);

// ---------------- 扫描 ----------------

/**
 * 纯字母模式 (v / vx / qq / yyds) 需要词边界
 * 不含数字与符号 (域名、手机号、英文缩写等) 的模式不加边界: 它们本身足够特别,
 * 而加了边界反而会漏掉「http://000.bbexe.cn」这类被字母数字包住的命中
 */
const PURE_LATIN = /^[a-z]+$/;

/** 字母 (归一化后已小写) */
const LATIN = /[a-z]/;

/**
 * 扫描任意词表: 返回全部命中 (含位置) 与按词汇总的结果。
 * 同一位置重叠命中时全部保留 (例如「最后一天」与「最」), 打码 / 高亮再由 maskSpans 合并。
 */
export const scanWords = (raw: string, id: string, bank: WordMeta[], opts?: Partial<ScanOptions>): BankScan => {
  const loose = opts?.loose !== false;
  const latinBoundary = opts?.latinBoundary !== false;
  const { text, map } = normalizeText(raw, loose);
  const root = automatonOfWords(id, bank, loose).root;

  const hits: Hit[] = [];
  const seen = new Set<string>();
  let cur = root;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    while (cur !== root && !cur.next.has(ch)) cur = cur.fail ?? root;
    cur = cur.next.get(ch) ?? root;

    let node: AcNode | null = cur;
    while (node && node !== root) {
      const meta = node.word;
      if (meta) {
        const nStart = i - node.depth + 1;
        const wordKey = node.key ?? '';
        const blocked = latinBoundary && PURE_LATIN.test(wordKey)
          && (LATIN.test(text[nStart - 1] ?? '') || LATIN.test(text[i + 1] ?? ''));
        if (!blocked) {
          const start = map[nStart];
          const end = map[i] + 1;
          const id = `${wordKey}|${start}|${end}`;
          if (!seen.has(id)) {
            seen.add(id);
            hits.push({
              word: meta.word, level: meta.level, tip: meta.tip, start, end, text: raw.slice(start, end),
            });
          }
        }
      }
      node = node.fail;
    }
  }

  hits.sort((a, b) => a.start - b.start || b.end - a.end || rank(a.level) - rank(b.level) || a.word.localeCompare(b.word));

  const words: WordStat[] = [];
  const byWord = new Map<string, WordStat>();
  const counts: Record<Level, number> = { high: 0, mid: 0, low: 0 };
  hits.forEach((hit) => {
    counts[hit.level] += 1;
    const id = hit.word.toLowerCase();
    let stat = byWord.get(id);
    if (!stat) {
      stat = { word: hit.word, level: hit.level, tip: hit.tip, count: 0, positions: [] };
      byWord.set(id, stat);
      words.push(stat);
    }
    stat.count += 1;
    stat.positions.push(hit.start);
  });
  words.sort((a, b) => rank(a.level) - rank(b.level) || b.count - a.count || a.word.localeCompare(b.word));

  return { key: id, hits, words, counts, total: hits.length };
};

/** 扫描一个内置词库 */
export const scanBank = (raw: string, key: BankKey, opts?: Partial<ScanOptions>): BankScan =>
  scanWords(raw, key, SENSITIVE_BANKS[key], opts);

/** 扫描全部词库 (通用 / 小红书 / 微信公众号) */
export const scanText = (raw: string, opts?: Partial<ScanOptions>): Record<BankKey, BankScan> => {
  const out = {} as Record<BankKey, BankScan>;
  BANK_KEYS.forEach((key) => { out[key] = scanBank(raw, key, opts); });
  return out;
};

/** 合并重叠命中: 同一位置保留最长的那个, 供打码 / 高亮使用 */
export const maskSpans = (hits: Hit[]): Hit[] => {
  const sorted = [ ...hits ].sort((a, b) => a.start - b.start || b.end - a.end);
  const out: Hit[] = [];
  let lastEnd = -1;
  sorted.forEach((hit) => {
    if (hit.start >= lastEnd) {
      out.push(hit);
      lastEnd = hit.end;
    }
  });
  return out;
};

/** 打码: 命中片段每个字符换成打码字符 (可自定义单字符; 换行保留, 不改变段落结构) */
export const maskText = (raw: string, hits: Hit[], maskChar: string = MASK_CHAR_DEFAULT): string => {
  const ch = normalizeMaskChar(maskChar);
  const chars = raw.split('');
  maskSpans(hits).forEach((hit) => {
    for (let i = hit.start; i < hit.end && i < chars.length; i += 1) {
      if (chars[i] === '\n' || chars[i] === '\r') continue;
      chars[i] = ch;
    }
  });
  return chars.join('');
};

/** 高亮分段: 命中片段与普通片段交替 (供预览区渲染) */
export interface TextPart {
  text: string;
  hit: Hit | null;
}

export const highlightParts = (raw: string, hits: Hit[]): TextPart[] => {
  const parts: TextPart[] = [];
  let at = 0;
  maskSpans(hits).forEach((hit) => {
    if (hit.start > at) parts.push({ text: raw.slice(at, hit.start), hit: null });
    parts.push({ text: raw.slice(hit.start, hit.end), hit });
    at = hit.end;
  });
  if (at < raw.length) parts.push({ text: raw.slice(at), hit: null });
  return parts;
};

/**
 * 打码分段: 被打码的片段 (已换成打码字符) 与普通片段交替 (供「打码预览」渲染)
 * 拼接结果与 maskText 完全一致, 方便界面上把打码位置标出来
 */
export const maskedParts = (raw: string, hits: Hit[], maskChar: string = MASK_CHAR_DEFAULT): TextPart[] => {
  const ch = normalizeMaskChar(maskChar);
  const parts: TextPart[] = [];
  let at = 0;
  maskSpans(hits).forEach((hit) => {
    if (hit.start > at) parts.push({ text: raw.slice(at, hit.start), hit: null });
    const masked = raw.slice(hit.start, hit.end)
      .split('')
      .map((c) => (c === '\n' || c === '\r' ? c : ch))
      .join('');
    parts.push({ text: masked, hit });
    at = hit.end;
  });
  if (at < raw.length) parts.push({ text: raw.slice(at), hit: null });
  return parts;
};

/** 打码统计: 打码处数与被替换的字符数 (不含换行) */
export const maskStats = (parts: TextPart[]): { spots: number; chars: number } => parts.reduce(
  (acc, part) => (part.hit
    ? { spots: acc.spots + 1, chars: acc.chars + part.text.replace(/[\n\r]/g, '').length }
    : acc),
  { spots: 0, chars: 0 }
);

// ---------------- 位置 / 报告 ----------------

/** 字面位置: 第几行第几字 (1 起) */
export const lineCol = (raw: string, index: number): { line: number; col: number } => {
  const upto = raw.slice(0, Math.max(0, Math.min(index, raw.length)));
  const lastBreak = upto.lastIndexOf('\n');
  return { line: upto.split('\n').length, col: upto.length - lastBreak };
};

/** 位置描述: 「第 2 行第 5 字」 */
export const positionLabel = (raw: string, index: number): string => {
  const { line, col } = lineCol(raw, index);
  return `第 ${line} 行第 ${col} 字`;
};

/** 字数 (按码点计, emoji 算 1 个字) */
export const textLength = (raw: string): number => [ ...raw ].length;

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** 文件名时间戳: 20260928-213045 */
export const fileStamp = (date: Date = new Date()): string => `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`
  + `-${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`;

/** 可读时间: 2026-09-28 21:30:45 */
export const readTime = (date: Date = new Date()): string => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
  + ` ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;

/** 打码文本导出文件名 */
export const maskedFileName = (date: Date = new Date()): string => `sensitive-word-masked-${fileStamp(date)}.txt`;

/** 检测报告导出文件名 */
export const reportFileName = (date: Date = new Date()): string => `sensitive-word-report-${fileStamp(date)}.txt`;

/** 报告里的附加词库分组 (扩展词库按分类传入) */
export interface ReportGroup {
  /** 分类键 (扩展词库分类, 便于明细表标注来源) */
  key?: string;
  /** 分类名 (如「涉政」) */
  label: string;
  scan: BankScan;
}

/** 命中明细行 (扩展词库的行额外带分类键, 内置词库的行不填) */
export interface ScanRow extends WordStat {
  categoryKey?: string;
}

/** 融合结果: 内置词库扫描 + 扩展词库分类 (供「通用」自检一次性看全) */
export interface FusedScan {
  hits: Hit[];
  words: ScanRow[];
  counts: Record<Level, number>;
  total: number;
  /** 其中来自扩展词库的命中处数 / 词数 */
  extraHits: number;
  extraWords: number;
}

/**
 * 把扩展词库分类的命中并进内置词库扫描结果:
 * 命中明细按「内置在前、扩展在后」拼接 (扩展行带 categoryKey, 界面上多一列来源),
 * 等级计数与命中处数同步叠加, 没选分类时原样返回 base
 */
export const fuseScans = (base: BankScan, extras: ReportGroup[] = []): FusedScan => {
  if (extras.length === 0) {
    return { hits: base.hits, words: base.words, counts: base.counts, total: base.total, extraHits: 0, extraWords: 0 };
  }
  const counts: Record<Level, number> = { ...base.counts };
  const hits: Hit[] = [ ...base.hits ];
  const words: ScanRow[] = [ ...base.words ];
  let extraHits = 0;
  extras.forEach(({ key, scan }) => {
    extraHits += scan.total;
    scan.hits.forEach((hit) => hits.push(hit));
    scan.words.forEach((stat) => words.push({ ...stat, categoryKey: key }));
    LEVEL_ORDER.forEach((level) => { counts[level] += scan.counts[level]; });
  });
  return {
    hits,
    words,
    counts,
    total: base.total + extraHits,
    extraHits,
    extraWords: words.length - base.words.length,
  };
};

/** 单段词库明细 (内置词库与扩展词库分类共用) */
const sectionOf = (raw: string, title: string, scan: BankScan): string[] => {
  const lines: string[] = [];
  const levels = LEVEL_ORDER
    .filter((level) => scan.counts[level] > 0)
    .map((level) => `${LEVEL_LABELS[level]} ${scan.counts[level]}`)
    .join(' / ');
  lines.push(`【${title}】命中 ${scan.total} 处 / ${scan.words.length} 个词${levels ? ` (${levels})` : ''}`);
  if (scan.words.length === 0) {
    lines.push('  - 无命中');
  } else {
    scan.words.forEach((stat) => {
      const list = stat.positions.slice(0, POS_LIMIT).map((pos) => positionLabel(raw, pos)).join(', ');
      const more = stat.positions.length > POS_LIMIT ? ` 等 ${stat.positions.length} 处` : '';
      lines.push(`  - ${stat.word} [${LEVEL_LABELS[stat.level]}] ×${stat.count} 位置: ${list}${more}`);
      lines.push(`    建议: ${stat.tip}`);
    });
  }
  return lines;
};

/** 生成纯文本检测报告 (中文, 便于留档或交给运营同学) */
export const reportText = (
  raw: string,
  scans: Record<BankKey, BankScan>,
  opts: ScanOptions,
  date: Date = new Date(),
  groups: ReportGroup[] = []
): string => {
  const lines: string[] = [];
  const parts = [
    ...BANK_KEYS.map((key) => ({ title: `${BANK_LABELS[key]}词库`, scan: scans[key] })),
    ...groups.map((g) => ({ title: `扩展词库 · ${g.label}`, scan: g.scan })),
  ];
  const hitTotal = parts.reduce((n, p) => n + p.scan.total, 0);
  const wordTotal = parts.reduce((n, p) => n + p.scan.words.length, 0);
  lines.push('敏感词检测报告');
  lines.push(`生成时间: ${readTime(date)}`);
  lines.push(`文本字数: ${textLength(raw)}`);
  lines.push(`匹配规则: ${opts.loose ? '宽松匹配 (忽略间隔符 / 零宽字符)' : '精确匹配'} · 拉丁词边界${opts.latinBoundary ? '开' : '关'}`);
  if (groups.length > 0) {
    lines.push(`词库范围: ${BANK_KEYS.map((key) => `${BANK_LABELS[key]}词库`).join(' / ')} + 扩展词库 (${groups.map((g) => g.label).join('、')})`);
  }
  lines.push(`命中合计: ${hitTotal} 处 / ${wordTotal} 个词`);
  lines.push('');
  parts.forEach((part) => {
    lines.push(...sectionOf(raw, part.title, part.scan));
    lines.push('');
  });
  lines.push('说明: 词库为常见平台违规词的经验汇总, 平台规则会持续更新, 结果仅供发布前自检参考, 不构成法律意见。');
  return lines.join('\n');
};

// ---------------- 默认设置 ----------------

const isBankKey = (v: unknown): v is BankKey => BANK_KEYS.includes(v as BankKey);

export const normalizeBank = (v: unknown): BankKey => (isBankKey(v) ? v : DEFAULT_SETTINGS.bank);

/**
 * 打码字符输入值: 最多保留 1 个字符 (允许暂时为空, 方便清空重填)
 * - 用 Array.from 取首个字符, 兼容 emoji 等代理对
 */
export const maskCharInput = (v: string): string => Array.from(v.trim()).slice(0, 1).join('');

/** 打码字符归一化: 自定义字符保留 (只取第一个字符), 空 / 非法值回退默认「*」 */
export const normalizeMaskChar = (v: unknown): string => (
  (typeof v === 'string' ? maskCharInput(v) : '') || MASK_CHAR_DEFAULT
);

/** 归一化设置 (非法值一律回退默认) */
export const normalizeSettings = (raw?: Partial<SensitiveDefaults> | null): SensitiveDefaults => ({
  bank: normalizeBank(raw?.bank),
  loose: raw?.loose !== false,
  latinBoundary: raw?.latinBoundary !== false,
  maskChar: normalizeMaskChar(raw?.maskChar),
});

/** 读取默认设置 */
export const getSettings = (): SensitiveDefaults => {
  try {
    const raw = localStorage.getItem(DEFAULTS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return normalizeSettings(JSON.parse(raw) as Partial<SensitiveDefaults>);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

/** 写入默认设置 (已归一化; 返回真正写入的值) */
export const setSettings = (raw?: Partial<SensitiveDefaults> | null): SensitiveDefaults => {
  const next = normalizeSettings(raw);
  try {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 隐私模式等场景写入失败: 忽略 */
  }
  return next;
};

/** 局部更新默认设置 (未提供的字段保持原值) */
export const patchSettings = (patch: Partial<SensitiveDefaults>): SensitiveDefaults =>
  setSettings({ ...getSettings(), ...patch });
