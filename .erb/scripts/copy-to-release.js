/*
 * 将 Tauri bundle 产物复制到项目根目录 release/
 * 用法: node .erb/scripts/copy-to-release.js
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..');
const bundleDir = path.join(projectRoot, 'src-tauri', 'target', 'release', 'bundle');
const releaseDir = path.join(projectRoot, 'release');
const targetReleaseDir = path.join(projectRoot, 'src-tauri', 'target', 'release');

// 递归复制 srcDir 内容到 destDir, 返回复制的文件绝对路径列表
function copyDirContents(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return [];
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
if (fs.existsSync(targetReleaseDir)) {
  for (const f of fs.readdirSync(targetReleaseDir)) {
    if (f.endsWith('.exe')) {
      const dest = path.join(releaseDir, f);
      fs.copyFileSync(path.join(targetReleaseDir, f), dest);
      copied.push(dest);
    }
  }
}

// 2. 复制 bundle 安装包 (nsis/msi/appimage/deb/dmg 等)
copied.push(...copyDirContents(bundleDir, releaseDir));

if (copied.length === 0) {
  console.error(`[release] 未找到可复制的产物 (${targetReleaseDir} 下无 *.exe, ${bundleDir} 为空)`);
  console.error('[release] 请先运行打包命令 (just release 会先执行 tauri build)');
  process.exit(1);
}

console.log(`[release] 已复制 ${copied.length} 个文件到 release/:`);
for (const f of copied) {
  console.log(`  - ${path.relative(projectRoot, f)}`);
}
