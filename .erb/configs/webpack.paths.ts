const path = require('path');

const rootPath = path.join(__dirname, '../..');

const dllPath = path.join(__dirname, '../dll');

const srcPath = path.join(rootPath, 'src');
const srcRendererPath = path.join(srcPath, 'renderer');

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
