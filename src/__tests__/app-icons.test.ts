// App 图标: 每个应用都配了图标, 且图标名都能在 app-icons.ts 的注册表里找到
import fs from 'fs';
import path from 'path';
import { APP_ICONS, FALLBACK_APP_ICON, appIconOf, appIconNode } from '../App/app-icons';

const APP_DIR = path.join(__dirname, '..', 'App');

/** 收集所有应用的 define.tsx (目录名 = app key) */
const defineFiles = fs
  .readdirSync(APP_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => ({ key: d.name, file: path.join(APP_DIR, d.name, 'define.tsx') }))
  .filter((item) => fs.existsSync(item.file));

/** 取 define.tsx 里 Icon 常量的值 */
const iconOf = (file: string): string => {
  const src = fs.readFileSync(file, 'utf-8');
  const m = /^const Icon = '([^']*)';$/m.exec(src);
  expect(m).not.toBeNull();
  return m ? m[1] : '';
};

describe('App 图标', () => {
  test('注册表每个图标名都能解析到组件', () => {
    const names = Object.keys(APP_ICONS);
    expect(names.length).toBeGreaterThan(50);
    names.forEach((name) => {
      expect(typeof APP_ICONS[name]).toBe('object'); // antd 图标是 forwardRef 组件
      expect(APP_ICONS[name]).toBeTruthy();
    });
    expect(APP_ICONS[FALLBACK_APP_ICON]).toBeTruthy();
  });

  test('每个 app 的 define.tsx 都配了图标, 且图标在注册表中存在', () => {
    expect(defineFiles.length).toBeGreaterThan(150);
    const missing = defineFiles.filter(({ file }) => iconOf(file) === '').map((d) => d.key);
    expect(missing).toEqual([]);

    const unknown = defineFiles
      .map(({ key, file }) => ({ key, icon: iconOf(file) }))
      .filter(({ icon }) => !APP_ICONS[icon])
      .map(({ key, icon }) => `${key}:${icon}`);
    expect(unknown).toEqual([]);
  });

  test('未配置 / 未知图标名回退到缺省图标, 不抛错', () => {
    expect(appIconOf('')).toBe(APP_ICONS[FALLBACK_APP_ICON]);
    expect(appIconOf('NotAnIcon')).toBe(APP_ICONS[FALLBACK_APP_ICON]);
    expect(appIconNode(undefined)).toBeTruthy();
    expect(appIconNode('Key')).toBeTruthy();
  });
});
