/*
 * 将 Tauri 构建产物复制到项目根目录 release/
 *
 * 用法:
 *   node scripts/copy-to-release.js              # 仅复制单体免安装可执行文件 (just release 默认 --no-bundle)
 *   node scripts/copy-to-release.js nsis         # 复制单体 exe + nsis 安装包 (just release nsis)
 *   node scripts/copy-to-release.js msi          # 复制单体 exe + msi 安装包 (just release msi)
 *
 * 说明: bundle 目录可能残留历史构建的其它格式安装包, 不按目标筛选会误带进 release/,
 *       故仅当显式传入目标 (nsis/msi/appimage/deb/dmg/rpm/app) 时才复制对应 bundle 子目录。
 */
const fs = require('fs');
const path = require('path');

// 脚本位于 <项目根>/scripts/ 下, __dirname 上溯一级即项目根
// (迁移自 .erb/scripts/ 后目录层级由两级变为一级)
const projectRoot = path.resolve(__dirname, '..');
const bundleDir = path.join(projectRoot, 'src-tauri', 'target', 'release', 'bundle');
const releaseDir = path.join(projectRoot, 'release');
const targetReleaseDir = path.join(projectRoot, 'src-tauri', 'target', 'release');

// 支持同时传多个目标 (空格或逗号分隔), 与 justfile 的单 target 用法兼容
const targets = process.argv
  .slice(2)
  .flatMap((s) => s.split(/[\s,]+/))
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// 递归复制 srcDir 内容到 destDir, 返回复制的文件绝对路径列表
function copyDirContents(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return [];
  fs.mkdirSync(destDir, { recursive: true });
  const copied = [];
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      copied.push(...copyDirContents(src, dest));
    } else {
      fs.copyFileSync(src, dest);
      copied.push(dest);
    }
  }
  return copied;
}

fs.mkdirSync(releaseDir, { recursive: true });
const copied = [];

// 1. 复制单体免安装可执行文件 (Windows: *.exe) 到 release/ 根目录
//    (无论 --no-bundle 还是带安装包构建都会产出, 始终复制)
if (fs.existsSync(targetReleaseDir)) {
  for (const f of fs.readdirSync(targetReleaseDir)) {
    if (f.endsWith('.exe')) {
      const dest = path.join(releaseDir, f);
      fs.copyFileSync(path.join(targetReleaseDir, f), dest);
      copied.push(dest);
    }
  }
}

// 2. 复制安装包: 仅当显式传入目标时复制对应 bundle/<target> 子目录
//    (bundle/ 下残留的历史安装包不会在默认 just release 时被带入 release/)
if (targets.length > 0) {
  for (const t of targets) {
    copied.push(...copyDirContents(path.join(bundleDir, t), path.join(releaseDir, t)));
  }
}

if (copied.length === 0) {
  console.error(`[release] 未找到可复制的产物 (${targetReleaseDir} 下无 *.exe${targets.length > 0 ? `, ${targets.map((t) => `${bundleDir}/${t}`).join(', ')} 为空` : ''})`);
  console.error('[release] 请先运行打包命令 (just release 会先执行 tauri build)');
  process.exit(1);
}

console.log(`[release] 已复制 ${copied.length} 个文件到 release/:`);
for (const f of copied) {
  console.log(`  - ${path.relative(projectRoot, f)}`);
}
