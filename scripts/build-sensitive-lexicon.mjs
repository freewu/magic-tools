#!/usr/bin/env node
/**
 * 生成「敏感词检测」工具的扩展词库数据 (来源: konsheng/Sensitive-lexicon, MIT)
 *
 *   src/App/SensitiveWord/lexicon.meta.json   分类元信息 (label / level / 词条数), 明文, 供 UI 直接静态引用
 *   src/App/SensitiveWord/lexicon.enc.json    XOR + Base64 编码后的词表 (按分类), 由页面按需动态加载
 *
 * 为什么编码: 词表里有大量违禁词, 明文入库 / 进产物容易被平台风控与代码扫描规则命中;
 * 编码后仓库与 bundle 里只有密文, 运行时用户勾选某分类才解码该分类。
 *
 * 用法:
 *   git clone --depth 1 https://github.com/konsheng/Sensitive-lexicon.git ../Sensitive-lexicon
 *   node scripts/build-sensitive-lexicon.mjs                    # 默认读 ../Sensitive-lexicon/Vocabulary
 *   node scripts/build-sensitive-lexicon.mjs --src <dir>        # 指定上游 Vocabulary 目录
 *
 * XOR 密钥从 src/App/SensitiveWord/lexicon.ts 的 LEXICON_XOR_KEY 中读取, 两处不会不一致。
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP_DIR = path.join(ROOT, 'src', 'App', 'SensitiveWord');
const OUT_META = path.join(APP_DIR, 'lexicon.meta.json');
const OUT_DATA = path.join(APP_DIR, 'lexicon.enc.json');

/** 上游分类 -> 本工具分类 (key 需与 lexicon.ts 的 LexKey 一致, 顺序即 UI 展示顺序) */
const FILES = [
  { key: 'politics', file: '政治类型.txt', label: '涉政', level: 'high' },
  { key: 'rebel', file: '反动词库.txt', label: '反动', level: 'high' },
  { key: 'terror', file: '暴恐词库.txt', label: '涉恐', level: 'high' },
  { key: 'weapon', file: '涉枪涉爆.txt', label: '涉枪涉爆', level: 'high' },
  { key: 'porn', file: '色情词库.txt', label: '涉黄', level: 'high' },
  { key: 'pornType', file: '色情类型.txt', label: '涉黄类型', level: 'high' },
  { key: 'corrupt', file: '贪腐词库.txt', label: '贪腐', level: 'mid' },
  { key: 'livelihood', file: '民生词库.txt', label: '民生', level: 'mid' },
  { key: 'covid', file: 'COVID-19词库.txt', label: '涉疫', level: 'mid' },
  { key: 'thought', file: '新思想启蒙.txt', label: '思想启蒙', level: 'mid' },
  { key: 'gfw', file: 'GFW补充词库.txt', label: '网络审查', level: 'mid' },
  { key: 'netease', file: '网易前端过滤敏感词库.txt', label: '网易过滤词', level: 'low' },
  { key: 'tencent', file: '零时-Tencent.txt', label: '腾讯过滤词', level: 'low' },
  { key: 'ad', file: '广告类型.txt', label: '广告法', level: 'low' },
  { key: 'other', file: '其他词库.txt', label: '其他', level: 'low' },
  { key: 'extra', file: '补充词库.txt', label: '补充', level: 'low' },
  { key: 'url', file: '非法网址.txt', label: '非法网址', level: 'low' },
];

/** 单词长度上限 (码点): 太长的多为整段广告 / 整句, 无匹配价值且拖慢自动机 */
const MAX_LEN = 64;
/** 单词长度下限 (码点): 单字命中率过高, 噪声大 */
const MIN_LEN = 2;

const argOf = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const SRC_DIR = path.resolve(ROOT, argOf('src', path.join('..', 'Sensitive-lexicon', 'Vocabulary')));

/** 读取 runtime 里的 XOR 密钥, 保证与解码端一致 */
const readXorKey = () => {
  const src = fs.readFileSync(path.join(APP_DIR, 'lexicon.ts'), 'utf8');
  const m = /const LEXICON_XOR_KEY = '([^']+)'/.exec(src);
  if (!m) throw new Error(`未能在 lexicon.ts 中找到 LEXICON_XOR_KEY`);
  return m[1];
};

/**
 * 词条规范化:
 *  - 去首尾空白, 去掉词内空白 (上游有「出售炸药 电话」这类写法, 词内空格永远匹配不到)
 *  - 丢掉过短 / 过长 / 纯标点 (无可匹配内容) 的词条
 *  - 分类内去重并排序, 保证上游新增词条时 diff 稳定
 */
const normalize = (text) => {
  const seen = new Set();
  for (const rawLine of text.split(/\r?\n/)) {
    const word = rawLine.trim().replace(/\s+/g, '');
    const len = [ ...word ].length;
    if (len < MIN_LEN || len > MAX_LEN) continue;
    if (!/[\p{L}\p{N}]/u.test(word)) continue;
    seen.add(word);
  }
  return [ ...seen ].sort();
};

const xorEncode = (text, key) => {
  const keyBytes = Buffer.from(key, 'utf8');
  const bytes = Buffer.from(text, 'utf8');
  const out = Buffer.allocUnsafe(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) out[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
  return out.toString('base64');
};

const main = () => {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`词库目录不存在: ${SRC_DIR}\n请先执行: git clone --depth 1 https://github.com/konsheng/Sensitive-lexicon.git ../Sensitive-lexicon`);
    process.exit(1);
  }
  const xorKey = readXorKey();
  const categories = [];
  const data = {};
  let total = 0;

  for (const { key, file, label, level } of FILES) {
    const filePath = path.join(SRC_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.error(`缺少上游词库文件: ${file}`);
      process.exit(1);
    }
    const words = normalize(fs.readFileSync(filePath, 'utf8'));
    if (words.length === 0) {
      console.error(`上游词库为空: ${file}`);
      process.exit(1);
    }
    categories.push({ key, label, file, level, count: words.length });
    data[key] = xorEncode(words.join('\n'), xorKey);
    total += words.length;
    console.log(`${file.padEnd(26, ' ')} -> ${label.padEnd(5, ' ')} ${String(words.length).padStart(6, ' ')} 词`);
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const common = {
    v: 1,
    source: 'https://github.com/konsheng/Sensitive-lexicon',
    license: 'MIT License, Copyright (c) 2024~2099 Konsheng',
    builtAt: stamp,
  };
  fs.writeFileSync(OUT_META, `${JSON.stringify({ ...common, categories }, null, 2)}\n`);
  fs.writeFileSync(OUT_DATA, `${JSON.stringify({ ...common, algo: 'xor+base64', data })}\n`);
  console.log(`\n共 ${total} 词 / ${categories.length} 个分类`);
  console.log(`写入 ${path.relative(ROOT, OUT_META)} (${(fs.statSync(OUT_META).size / 1024).toFixed(1)} KB)`);
  console.log(`写入 ${path.relative(ROOT, OUT_DATA)} (${(fs.statSync(OUT_DATA).size / 1024 / 1024).toFixed(2)} MB)`);
};

main();
