// 敏感词检测 扩展词库 (Sensitive-lexicon) 运行时
//
// 数据来源: https://github.com/konsheng/Sensitive-lexicon
//   MIT License, Copyright (c) 2024~2099 Konsheng
// 上游按「文件」分类收录 (政治类型 / 暴恐词库 / 色情词库 / 非法网址 ...), 本模块沿用同样的分类,
// 命中时就能直接告诉用户属于哪一类 (涉政 / 涉恐 / 涉黄 ...), 而不是只给一个模糊的风险等级。
//
// 词表由 scripts/build-sensitive-lexicon.mjs 生成, 分两个文件:
//   lexicon.meta.json  分类元信息 (明文, 体积很小, 静态引用后即可渲染分类选择器)
//   lexicon.enc.json   词表本体 (XOR + Base64), 用户勾选分类后才动态 import + 解码该分类
// 这样既不把违禁词以明文写进仓库 / 产物, 也不会让 1MB 词表拖慢工具页首屏。
import { LEVEL_DESC, type Level, type WordMeta } from './data';
import meta from './lexicon.meta.json';

/** 扩展词库分类键 (与 scripts/build-sensitive-lexicon.mjs 的 FILES 一一对应) */
export type LexKey =
  | 'politics'
  | 'rebel'
  | 'terror'
  | 'weapon'
  | 'porn'
  | 'pornType'
  | 'corrupt'
  | 'livelihood'
  | 'covid'
  | 'thought'
  | 'gfw'
  | 'netease'
  | 'tencent'
  | 'ad'
  | 'other'
  | 'extra'
  | 'url';

/** 分类元信息 */
export interface LexCategory {
  /** 分类键 */
  key: LexKey;
  /** 分类显示名 (zh 原文, 由 lang.ts 翻译) */
  label: string;
  /** 上游词库文件名 (悬停提示 / 溯源) */
  file: string;
  /** 该分类的风险等级 (整类同一等级: 上游只按主题分文件, 不再分级) */
  level: Level;
  /** 词条数 */
  count: number;
}

/**
 * XOR 密钥: 与 scripts/build-sensitive-lexicon.mjs 共用
 * (生成脚本直接读取本常量, 改这里必须重新生成词库)
 */
const LEXICON_XOR_KEY = 'MagicTools::sensitive-lexicon::v1';

/** 编码词库文件结构 (lexicon.enc.json) */
interface LexiconFile {
  v: number;
  algo: string;
  data: Record<string, string>;
}

/** 元信息文件结构 (lexicon.meta.json) */
interface LexiconMeta {
  v: number;
  source: string;
  license: string;
  builtAt: string;
  categories: { key: string; label: string; file: string; level: string; count: number }[];
}

const isLevel = (v: unknown): v is Level => v === 'high' || v === 'mid' || v === 'low';

const metaFile = meta as unknown as LexiconMeta;

/** 上游词库名 (展示 / 溯源用) */
export const LEXICON_SOURCE = metaFile.source;

/** 上游许可 (页脚标注用) */
export const LEXICON_LICENSE = metaFile.license;

/** 词库生成日期 (YYYY-MM-DD) */
export const LEXICON_BUILT_AT = metaFile.builtAt;

/** 分类元信息 (顺序即 UI 展示顺序) */
export const LEXICON_CATEGORIES: readonly LexCategory[] = metaFile.categories.map((c) => ({
  key: c.key as LexKey,
  label: c.label,
  file: c.file,
  level: isLevel(c.level) ? c.level : 'mid',
  count: c.count,
}));

/** 全部词条数 (用于介绍文案) */
export const LEXICON_TOTAL = LEXICON_CATEGORIES.reduce((sum, c) => sum + c.count, 0);

/** key -> 分类元信息 */
export const LEXICON_MAP: Record<string, LexCategory> = LEXICON_CATEGORIES.reduce<Record<string, LexCategory>>(
  (map, c) => { map[c.key] = c; return map; },
  {},
);

/** 已解码的分类词表 (按分类缓存, 同一分类只解码一次) */
const cache = new Map<string, WordMeta[]>();

/** 词库文件的动态 import (只加载一次) */
let filePromise: Promise<LexiconFile> | null = null;

const lexiconFile = (): Promise<LexiconFile> => {
  filePromise ??= import('./lexicon.enc.json').then((m) => (m.default ?? m) as unknown as LexiconFile);
  return filePromise;
};

/** XOR + Base64 解码 (含 UTF-8 还原) */
export const decodeLexicon = (base64: string): string => {
  const key = new TextEncoder().encode(LEXICON_XOR_KEY);
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i) ^ key[i % key.length];
  return new TextDecoder().decode(bytes);
};

/**
 * 解码某个分类 (结果按分类缓存)
 * 词表与元信息不一致时抛错 (说明词库没重新生成), 由调用方提示用户
 */
export const lexiconWords = async (key: LexKey): Promise<WordMeta[]> => {
  const hit = cache.get(key);
  if (hit) return hit;
  const category = LEXICON_MAP[key];
  if (!category) throw new Error(`未知的扩展词库分类: ${key}`);
  const file = await lexiconFile();
  const base64 = file.data[key];
  if (!base64) throw new Error(`扩展词库缺少分类数据: ${key}`);
  const words = decodeLexicon(base64).split('\n').filter((w) => w !== '');
  if (words.length !== category.count) {
    throw new Error(`扩展词库「${category.label}」词条数与元信息不一致, 请重新生成词库`);
  }
  const list: WordMeta[] = words.map((word) => ({
    word,
    level: category.level,
    tip: LEVEL_DESC[category.level],
  }));
  cache.set(key, list);
  return list;
};

/** 解码多个分类 (页面按需调用, 未选中的分类不会被解码) */
export const loadLexiconWords = async (keys: readonly LexKey[]): Promise<Partial<Record<LexKey, WordMeta[]>>> => {
  const out: Partial<Record<LexKey, WordMeta[]>> = {};
  await Promise.all(keys.map(async (key) => { out[key] = await lexiconWords(key); }));
  return out;
};
