// 关键词密度 纯逻辑层
// 文本基础统计 (总字符/英文词数/汉字数), 词频表 (面向英文 token),
// 以及任意关键词 (中文/英文) 的密度与 SEO 水平判定。
// 密度定义: 出现次数 × 关键词字符数 ÷ 有效字符总数 × 100。

/** 常见英文停用词 */
export const STOPWORDS_EN = new Set([
  'the', 'a', 'an', 'of', 'to', 'in', 'is', 'are', 'was', 'were', 'be', 'been',
  'and', 'or', 'but', 'for', 'on', 'at', 'by', 'with', 'from', 'as', 'it', 'its',
  'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they', 'my',
  'your', 'his', 'her', 'our', 'their', 'not', 'no', 'so', 'if', 'then', 'than',
  'too', 'very', 'can', 'will', 'just', 'do', 'does', 'did', 'has', 'have', 'had',
  'about', 'into', 'over', 'after', 'before', 'up', 'down', 'out', 'off', 'under',
  'more', 'most', 'such', 'only', 'own', 'same', 'also', 'may', 'must', 'should',
  'would', 'could', 'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how',
  'all', 'any', 'both', 'each', 'few', 'other', 'some', 'there', 'here',
]);

/** 标点/符号字符 (计入有效字符时排除, 中文全角亦覆盖) */
const PUNCT_RE = /[\s0-9`~!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|·，。、；：？！…—～《》「」『』【】（）〈〉"'‘’“”]/g;

/** 去除空白与标点后的有效字符数 (中英文字符均计 1) */
export function countEffectiveChars(text: string): number {
  return String(text ?? '').replace(PUNCT_RE, '').length;
}

/** 英文单词 token (含连字符/撇号内词) */
const EN_WORD = /[A-Za-z]+(?:['-][A-Za-z]+)*/g;

export interface TextStats {
  totalChars: number;
  latinWords: number;
  hanChars: number;
  paragraphs: number;
  sentences: number;
}

/** 文本基础统计 */
export function analyzeText(text: string): TextStats {
  const src = String(text ?? '');
  const enMatches = src.match(EN_WORD) ?? [];
  const latinWords = enMatches.length;
  const hanChars = (src.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const paragraphs = src.split(/\n+/).filter((l) => l.trim()).length || 0;
  const sentences = (src.match(/[。！？!?.]+|…/g) ?? []).length || (src.trim() ? 1 : 0);
  return {
    totalChars: countEffectiveChars(src),
    latinWords,
    hanChars,
    paragraphs,
    sentences,
  };
}

export interface TermStat { term: string; count: number; density: number; }

/** 英文词频表 (可选忽略停用词 / 最短长度) */
export function buildTermTable(text: string, options?: { stopwords?: boolean; minLen?: number }): TermStat[] {
  const { stopwords = false, minLen = 1 } = options ?? {};
  const src = String(text ?? '');
  const total = countEffectiveChars(src);
  const map = new Map<string, number>();
  for (const m of src.match(EN_WORD) ?? []) {
    const w = m.toLowerCase();
    if (w.length < minLen) continue;
    if (stopwords && STOPWORDS_EN.has(w)) continue;
    map.set(w, (map.get(w) ?? 0) + 1);
  }
  const list: TermStat[] = [];
  for (const [term, count] of map) {
    list.push({ term, count, density: total ? Number(((count * term.length) / total) * 100) : 0 });
  }
  list.sort((a, b) => b.count - a.count || a.term.localeCompare(b.term));
  return list;
}

/** 统计关键词在文本中出现次数 */
export function countOccurrences(text: string, keyword: string): number {
  const src = String(text ?? '');
  const kw = String(keyword ?? '').trim();
  if (!kw || !src) return 0;
  const isEn = /^[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*$/.test(kw);
  if (isEn) {
    const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?<![A-Za-z0-9])${esc}(?![A-Za-z0-9])`, 'gi');
    return (src.match(re) ?? []).length;
  }
  const hay = src.toLowerCase();
  const needle = kw.toLowerCase();
  let n = 0;
  let idx = hay.indexOf(needle);
  while (idx !== -1) { n += 1; idx = hay.indexOf(needle, idx + needle.length); }
  return n;
}

export type DensityLevel = 'not-found' | 'low' | 'normal' | 'high' | 'over';

export interface KeywordReport {
  keyword: string;
  occurrences: number;
  totalChars: number;
  density: number;   // %
  level: DensityLevel;
}

const LEVEL_LABEL: Record<DensityLevel, string> = {
  'not-found': '未出现',
  low: '密度偏低',
  normal: '正常',
  high: '偏高',
  over: '过高(疑似堆砌)',
};

export const levelLabel = (l: DensityLevel): string => LEVEL_LABEL[l];

function judge(density: number): DensityLevel {
  if (density === 0) return 'not-found';
  if (density < 0.5) return 'low';
  if (density < 3) return 'normal';
  if (density < 6) return 'high';
  return 'over';
}

/** 单关键词密度报告 */
export function keywordDensity(text: string, keyword: string): KeywordReport {
  const src = String(text ?? '');
  const kw = String(keyword ?? '').trim();
  const totalChars = countEffectiveChars(src);
  if (!kw) return { keyword: kw, occurrences: 0, totalChars, density: 0, level: 'not-found' };
  const occurrences = countOccurrences(src, kw);
  const density = totalChars ? Number((((occurrences * kw.length) / totalChars) * 100).toFixed(2)) : 0;
  return { keyword: kw, occurrences, totalChars, density, level: judge(density) };
}

/** 多关键词批量报告 */
export function keywordsReport(text: string, keywords: string[]): KeywordReport[] {
  const seen = new Set<string>();
  const out: KeywordReport[] = [];
  for (const raw of keywords) {
    const kw = String(raw ?? '').trim();
    if (!kw || seen.has(kw.toLowerCase())) continue;
    seen.add(kw.toLowerCase());
    out.push(keywordDensity(text, kw));
  }
  return out;
}

/** 密度水平对应颜色 (UI 使用) */
export const LEVEL_COLOR: Record<DensityLevel, string> = {
  'not-found': 'default',
  low: 'orange',
  normal: 'green',
  high: 'gold',
  over: 'red',
};
