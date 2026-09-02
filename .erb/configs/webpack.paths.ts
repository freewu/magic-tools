const path = require('path');

const rootPath = path.join(__dirname, '../..');

const dllPath = path.join(__dirname, '../dll');

const srcPath = path.join(rootPath, 'src');
// renderer 代码已并入 src 根目录 (入口 index.tsx / 模板 index.ejs 均在 src 下)
const srcRendererPath = srcPath;

// Tauri frontendDist 目录 (tauri.conf.json -> build.frontendDist: "../dist")
const distPath = path.join(rootPath, 'dist');
const distRendererPath = distPath;

export default {
  rootPath,
  dllPath,
  srcPath,
  srcRendererPath,
  distPath,
  distRendererPath,
};
