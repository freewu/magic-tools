#!/usr/bin/env node
/**
 * 抓取拼豆色卡数据并生成 src/App/Color/data/*.ts (MARD / COCO / Artkal / Perler / Hama / DMC)
 *
 * 数据来源: https://www.bitbead.app/zh/colors (比特拼豆)
 * 用法:     node scripts/fetch-bead-colors.mjs
 *
 * 说明: 站点是 Next.js (RSC/flight) 渲染, 色值以 {"code":..,"name":..,"hex":..} 形式内嵌在 HTML 中;
 *       MARD / COCO / Artkal / Artkal Mini 页按系列 (h3 A/B/... 或 MA/MB/...) 分组展示, 抓取时保留分组;
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

// 品牌页 slug / 生成文件名 / 注释标题 / 解析方式
// rsc    = 单段色卡列表 (页面无分组)
// grouped = 页面按系列 (A/B/... 或 MA/MB/...) 分组, 生成带分割行的配色板
// table  = DMC 线号对照表
const BRANDS = [
  { slug: 'mard', name: 'MARD 221', file: 'mard.ts', kind: 'grouped' },
  { slug: 'coco', name: 'COCO 291', file: 'coco.ts', kind: 'grouped' },
  { slug: 'artkal', name: 'Artkal', file: 'artkal.ts', kind: 'grouped' },
  { slug: 'artkal-mini', name: 'Artkal Mini', file: 'artkal-mini.ts', kind: 'grouped' },
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

// 拼接被 </script><script>self.__next_f.push([1," 拆开的 flight 分片, 并还原转义
const normalize = (html) =>
  html
    .replace(/\\"/g, '"')
    .replace(/<script>self\.__next_f\.push\(\[1,"/g, '')
    .replace(/"\]\)<\/script>/g, '');

// 色卡页: 解析内嵌的 {"code":"P01","name":"White","hex":"#F1F1F1"}
const extractColors = (text) => {
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

const parseRsc = (html) => extractColors(normalize(html));

// 分组色卡页: 每个系列一个 <h3>系列号</h3> + <span>色数</span>
// (色块网格里超出首屏的部分在 flight 里以 $Lxx 引用形式后置, 无法直接按位置切分,
//  因此按色号的字母前缀归组到 h3 声明的系列, 再用页面标注的色数校验, 不一致直接报错)
const H3_RE = /"h3",null,\{"className":"font-pixel text-h3 leading-tight text-ink-primary","children":"([^"]+)"\}/g;

const parseGrouped = (html) => {
  const text = normalize(html);
  const marks = [...text.matchAll(H3_RE)];
  if (marks.length === 0) throw new Error('未找到系列分组 (h3)');
  const groups = marks.map((mark) => {
    const declared = Number(
      /"children":(\d+)\}/.exec(text.slice(mark.index + mark[0].length, mark.index + mark[0].length + 200))?.[1],
    );
    return { name: decode(mark[1]), declared, colors: [] };
  });
  for (const color of extractColors(text)) {
    const series = /^[A-Za-z]+/.exec(color.code)?.[0];
    const group = groups.find((item) => item.name === series);
    if (!group) throw new Error(`色号 ${color.code} 找不到对应系列`);
    group.colors.push(color);
  }
  for (const group of groups) {
    // 系列内按色号后缀数字升序 (B1, B2, ... B10)
    group.colors.sort((a, b) => suffix(a.code) - suffix(b.code));
    if (group.declared && group.colors.length !== group.declared) {
      throw new Error(`系列 ${group.name} 色数不一致: 解析 ${group.colors.length} != 页面标注 ${group.declared}`);
    }
  }
  return groups;
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

// 色号里的数字后缀 (用于同一系列内排序)
const suffix = (code) => Number(/\d+/.exec(code)?.[0] ?? 0);

// 卡片 label: 色号 + 颜色名 (MARD/COCO 的名称就是色号, 只显示色号; 中英双语取中文部分)
const toLabel = ({ code, name }) => {
  if (!name || name === code) return code;
  return `${code} ${name.split(' / ')[0]}`;
};

const render = (brandName, slug, sections) => {
  const source = `${BASE}/${slug}`;
  const date = new Date().toISOString().slice(0, 10);
  const total = sections.reduce((sum, section) => sum + section.colors.length, 0);
  const lines = [];
  for (const section of sections) {
    if (sections.length > 1) {
      // code 为空 = 分割行 (color-pad 渲染成分隔标题)
      lines.push(`  { label: ${JSON.stringify(section.name)}, code: "", info: "" },`);
    }
    for (const row of section.colors) {
      lines.push(`  { label: ${JSON.stringify(toLabel(row))}, code: ${JSON.stringify(row.hex)}, info: ${JSON.stringify(row.name)} },`);
    }
  }
  const grouped = sections.length > 1 ? `\n * 按系列分组: ${sections.map((section) => `${section.name}(${section.colors.length})`).join(' ')}` : '';
  return `/**\n * 拼豆色卡: ${brandName} (共 ${total} 色)${grouped}\n *\n * 数据来源: ${source}\n * 由 scripts/fetch-bead-colors.mjs 生成 (抓取日期 ${date})\n */\nexport default [\n${lines.join('\n')}\n];\n`;
};

const main = async () => {
  for (const brand of BRANDS) {
    const url = `${BASE}/${brand.slug}`;
    const html = await fetchHtml(url);
    let sections;
    if (brand.kind === 'table') {
      sections = [{ name: brand.name, colors: parseTable(html) }];
    } else if (brand.kind === 'grouped') {
      sections = parseGrouped(html);
    } else {
      sections = [{ name: brand.name, colors: parseRsc(html) }];
    }
    if (sections.every((section) => section.colors.length === 0)) throw new Error(`未解析到颜色: ${url}`);
    // 系列内按色号去重, 跳过重复色号
    sections = sections.map((section) => {
      const unique = [...new Map(section.colors.map((row) => [row.code, row])).values()];
      if (unique.length !== section.colors.length) {
        console.warn(`  ! ${brand.name} ${section.name} 存在重复色号: ${section.colors.length} -> ${unique.length}`);
      }
      return { ...section, colors: unique };
    });
    writeFileSync(join(OUT_DIR, brand.file), render(brand.name, brand.slug, sections), 'utf8');
    const total = sections.reduce((sum, section) => sum + section.colors.length, 0);
    const detail = sections.length > 1 ? ` [${sections.map((section) => `${section.name}:${section.colors.length}`).join(' ')}]` : '';
    console.log(`✓ ${brand.file.padEnd(16)} ${brand.name.padEnd(12)} ${String(total).padStart(4)} 色${detail}`);
  }
  console.log('\n提示: 新增品牌需在 src/App/Color/data/index.ts 与 src/App/Color/data.ts 中注册, 并在 lang.ts 中补配色板名。');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
