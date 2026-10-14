#!/usr/bin/env node
// 组装可部署站点 _site/ —— GitHub Pages 与 Cloudflare Pages 共用同一套布局:
//   根目录  = 三语官网 (docs/: index.html / zh-CN.html / zh-TW.html + logo + images)
//   /tools/ = 纯前端 Web 版应用 (dist/, vite base './' + hash 路由, 子路径可直接访问)
//
// 用法:
//   npm run build:site          # vite build -> dist/ -> _site/ (推荐, 见 package.json)
//   node scripts/build-site.mjs # 只组装 (需已存在 dist/index.html)
//   node scripts/build-site.mjs out-dir   # 指定输出目录 (默认 _site)
//
// 两个平台怎么用:
//   GitHub Pages : deploy-pages.yml 执行 npm run build:site, 再把 _site 作为 artifact 上传
//   Cloudflare   : 项目设置 Build command = npm run build:site, Build output directory = _site
//                  (另外需环境变量 NODE_VERSION=22, 见 AGENTS.md)
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(rootDir, 'dist');
const docsDir = join(rootDir, 'docs');
const outDir = resolve(rootDir, process.argv[2] || '_site');

/** 人类可读的体积 (用于组装结果统计) */
const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

/** 递归统计文件数与总字节数 */
const statTree = (dir) => {
  let files = 0;
  let bytes = 0;
  const walk = (current) => {
    for (const name of readdirSync(current)) {
      const target = join(current, name);
      if (statSync(target).isDirectory()) walk(target);
      else {
        files += 1;
        bytes += statSync(target).size;
      }
    }
  };
  walk(dir);
  return { files, bytes };
};

if (outDir === rootDir || outDir === distDir || outDir.startsWith(`${distDir}/`)) {
  console.error(`⚠ 输出目录不合法: ${outDir}`);
  process.exit(1);
}
if (!existsSync(join(docsDir, 'index.html'))) {
  console.error(`⚠ 缺少官网页面: ${relative(rootDir, join(docsDir, 'index.html'))}`);
  process.exit(1);
}
if (!existsSync(join(distDir, 'index.html'))) {
  console.error('⚠ 缺少 dist/index.html, 请先执行 npm run build:renderer (或直接用 npm run build:site)');
  process.exit(1);
}

// 1) 官网 (docs/) -> 输出根目录
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(docsDir, outDir, { recursive: true });

// 2) Web 版 (dist/) -> 输出 /tools/
const toolsDir = join(outDir, 'tools');
mkdirSync(toolsDir, { recursive: true });
cpSync(distDir, toolsDir, { recursive: true });

const site = statTree(outDir);
const tools = statTree(toolsDir);
const pages = readdirSync(outDir).filter((name) => name.endsWith('.html')).sort();

console.log(`✓ 站点组装完成: ${relative(rootDir, outDir) || '.'} (共 ${site.files} 个文件, ${formatSize(site.bytes)})`);
console.log(`  根目录官网: ${pages.join(' / ')}`);
console.log(`  /tools/   : Web 版 (${tools.files} 个文件, ${formatSize(tools.bytes)})`);
