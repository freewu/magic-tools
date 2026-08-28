import fs from 'fs';
import path from 'path';
import webpackPaths from '../configs/webpack.paths';

// 删除 dist 下的 .js.map 源码映射文件 (避免把源码泄露到生产包)
// 注意: 不用 rimraf 的 glob 通配符 (Windows 上对 '*.js.map' 会报 EINVAL: Illegal characters in path),
//       改为 fs 遍历目录逐个删除, 跨平台可靠。
export default function deleteSourceMaps() {
  const distDir = webpackPaths.distRendererPath;
  if (!fs.existsSync(distDir)) return;

  const maps = fs
    .readdirSync(distDir)
    .filter((f) => f.endsWith('.js.map'));

  for (const f of maps) {
    fs.unlinkSync(path.join(distDir, f));
  }
}
