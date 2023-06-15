/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import { app } from 'electron';

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

// 获取 Asset路径
export const getAssetPath = (...paths: string[]): string => {
  const RESOURCES_PATH = app.isPackaged? path.join(process.resourcesPath, 'assets') : path.join(__dirname, '../../assets');
  return path.join(RESOURCES_PATH, ...paths);
};

// 调用系统默认浏览器打开链接
export const openDefaultBrowser = function (url :string) {
  var exec = require('child_process').exec;
  console.log(process.platform)
  switch (process.platform) {
    case "darwin":
      exec('open ' + url);
      break;
    case "win32":
      exec('start ' + url);
      break;
    default:
      exec('xdg-open', [url]);
  }
}
