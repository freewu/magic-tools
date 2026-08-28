import rimraf from 'rimraf';
import fs from 'fs';
import webpackPaths from '../configs/webpack.paths';

const foldersToRemove = [
  webpackPaths.distPath,
];

foldersToRemove.forEach((folder) => {
  if (fs.existsSync(folder)) rimraf.sync(folder);
});
