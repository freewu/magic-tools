#!/usr/bin/env node
/**
 * 抓取拼豆色卡数据并生成 src/App/Color/data/*.ts (MARD / COCO / Artkal / Perler / Hama / DMC)
 *
 * 数据来源: https://www.bitbead.app/zh/colors (比特拼豆)
 * 用法:     node scripts/fetch-bead-colors.mjs
 *
 * 说明: 站点是 Next.js (RSC/flight) 渲染, 色值以 {"code":..,"name":..,"hex":..} 形式内嵌在 HTML 中;
 *       DMC 页是 crosswalk 表格, 从 <tr id="c-xxx"> 的 <th scope="row"> 中取线号/名称/色值。
 *       抓取结果直接覆盖生成数据文件, 生成后需手工在 data/index.ts 与 data.ts 注册 (见文件尾部提示)。
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(root, 'src/App/Color/data');
const BASE = 'https://www.bitbead.app/zh/colors';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

// 品牌页 slug / 生成文件名 / 注释标题
const BRANDS = [
  { slug: 'mard', name: 'MARD 221', file: 'mard.ts', kind: 'rsc' },
  { slug: 'coco', name: 'COCO 291', file: 'coco.ts', kind: 'rsc' },
  { slug: 'artkal', name: 'Artkal', file: 'artkal.ts', kind: 'rsc' },
  { slug: 'perler', name: 'Perler', file: 'perler.ts', kind: 'rsc' },
  { slug: 'hama', name: 'Hama', file: 'hama.ts', kind: 'rsc' },
  { slug: 'dmc', name: 'DMC 绣线', file: 'dmc.ts', kind: 'table' },
];

const fetchHtml = async (url) => {
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
};

// RSC/JSON 里的转义与 HTML 实体解码
const decode = (text) =>
  String(text)
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

// 色卡页: 解析内嵌的 {"code":"P01","name":"White","hex":"#F1F1F1"}
const parseRsc = (html) => {
  // 拼接被 </script><script>self.__next_f.push([1," 拆开的 flight 分片
  const text = html
    .replace(/\\"/g, '"')
    .replace(/<script>self\.__next_f\.push\(\[1,"/g, '')
    .replace(/"\]\)<\/script>/g, '');
  const rows = [];
  for (const part of text.split(/(?="code":")/).slice(1)) {
    const chunk = part.slice(0, 400);
    const code = /^"code":"([^"]*)"/.exec(part)?.[1];
    const name = /"name":"([^"]*)"/.exec(chunk)?.[1] ?? '';
    const hex = /"hex":"(#[0-9A-Fa-f]{3,8})"/.exec(chunk)?.[1];
    if (code && hex) rows.push({ code: decode(code), name: decode(name), hex });
  }
  return rows;
};

// DMC 对照表: <tr id="c-3713"><th scope="row"><i style="background:#FFE2E2"></i><b>3713</b><span>Salmon Very Light</span><small>#FFE2E2</small>
const parseTable = (html) => {
  const rows = [];
  const re = /<tr id="c-[^"]*"><th scope="row"><i[^>]*style="background:(#[0-9A-Fa-f]{3,8})"><\/i><b>([^<]+)<\/b>(?:<span>([^<]*)<\/span>)?<small>(#[0-9A-Fa-f]{3,8})<\/small>/g;
  for (const match of html.matchAll(re)) {
    const [, bg, code, name, small] = match;
    if (bg.toUpperCase() !== small.toUpperCase()) {
      throw new Error(`DMC 色值不一致: ${code} ${bg} != ${small}`);
    }
    const label = decode(code);
    rows.push({ code: label, name: decode(name || label), hex: bg });
  }
  return rows;
};

// 卡片 label: 色号 + 颜色名 (MARD/COCO 的名称就是色号, 只显示色号; 中英双语取中文部分)
const toLabel = ({ code, name }) => {
  if (!name || name === code) return code;
  return `${code} ${name.split(' / ')[0]}`;
};

const render = (brandName, slug, rows) => {
  const source = `${BASE}/${slug}`;
  const date = new Date().toISOString().slice(0, 10);
  const body = rows
    .map((row) => `  { label: ${JSON.stringify(toLabel(row))}, code: ${JSON.stringify(row.hex)}, info: ${JSON.stringify(row.name)} },`)
    .join('\n');
  return `/**\n * 拼豆色卡: ${brandName} (共 ${rows.length} 色)\n *\n * 数据来源: ${source}\n * 由 scripts/fetch-bead-colors.mjs 生成 (抓取日期 ${date})\n */\nexport default [\n${body}\n];\n`;
};

const main = async () => {
  for (const brand of BRANDS) {
    const url = `${BASE}/${brand.slug}`;
    const html = await fetchHtml(url);
    const rows = brand.kind === 'table' ? parseTable(html) : parseRsc(html);
    if (rows.length === 0) throw new Error(`未解析到颜色: ${url}`);
    // 去重 (按色号)
    const unique = [...new Map(rows.map((row) => [row.code, row])).values()];
    if (unique.length !== rows.length) {
      console.warn(`  ! ${brand.name} 存在重复色号: ${rows.length} -> ${unique.length}`);
    }
    writeFileSync(join(OUT_DIR, brand.file), render(brand.name, brand.slug, unique), 'utf8');
    console.log(`✓ ${brand.file.padEnd(12)} ${brand.name.padEnd(10)} ${String(unique.length).padStart(4)} 色`);
  }
  console.log('\n提示: 新增品牌需在 src/App/Color/data/index.ts 与 src/App/Color/data.ts 中注册, 并在 lang.ts 中补配色板名。');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
