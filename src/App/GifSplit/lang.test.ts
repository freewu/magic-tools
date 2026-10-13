import fs from 'fs';
import path from 'path';
import lang, { im, imT } from './lang';

/** 词条表来源: 页面 / 纯逻辑里的 t() / tt() 字面量都要能查到词条 (设置面板走 Setting/rows-lang, 单独校验) */
const sourceFiles = [ 'index.tsx', 'lib.ts' ];

/** 提取 "t('xxx')" / "tt('xxx')" 里的原文 */
const usedKeys = (): Set<string> => {
  const keys = new Set<string>();
  for (const file of sourceFiles) {
    const src = fs.readFileSync(path.join(__dirname, file), 'utf8');
    for (const m of src.matchAll(/\b(?:t|tt|st|_r)\(\s*'([^']*)'/g)) keys.add(m[1]);
    // parseErrorKey 返回的也是待翻译文案 (形如 `case 'x': return '原文';`)
    for (const m of src.matchAll(/case '[^']*': (?:return |\{\n\s*case '[^']*': return )'([^']+)'/g)) keys.add(m[1]);
  }
  return keys;
};

describe('GifSplit 语言包', () => {
  test('应用名称三语齐全 (zh-CN 取自 define.tsx 的 AppName)', () => {
    expect(lang.default).toBe('zh-CN');
    expect(lang['zh-TW'].appName).toBe('GIF 拆解');
    expect(lang.en.appName).toBe('GIF Splitter');
  });

  test('im: 命中词条返回对应语言, 未命中回退原文', () => {
    expect(im('zh-CN', '导出精灵图')).toBe('导出精灵图');
    expect(im('zh-TW', '导出精灵图')).toBe('匯出精靈圖');
    expect(im('en', '导出精灵图')).toBe('Export sprite sheet');
    expect(im('en', '没收录的文案')).toBe('没收录的文案');
  });

  test('imT: 替换占位符, 不传变量时保留占位符', () => {
    expect(imT('zh-CN', '已选 {n} 帧', { n: 3 })).toBe('已选 3 帧');
    expect(imT('en', '已选 {n} 帧', { n: 3 })).toBe('3 frames selected');
    expect(imT('en', '导出失败: {msg}', { msg: 'boom' })).toBe('Export failed: boom');
    expect(imT('en', '已选 {n} 帧')).toContain('{n}');
  });

  test('页面与逻辑里用到的原文全部有词条 (三语都非空)', () => {
    const rows = new Set<string>();
    const src = fs.readFileSync(path.join(__dirname, 'lang.ts'), 'utf8');
    for (const m of src.matchAll(/^  '((?:[^'\\]|\\.)*)':\s*\[\s*'([^']*)',\s*'([^']*)',?\s*\]/gm)) {
      rows.add(m[1]);
      expect(m[2].trim().length).toBeGreaterThan(0);
      expect(m[3].trim().length).toBeGreaterThan(0);
    }
    const keys = [ ...usedKeys() ];
    expect(keys.length).toBeGreaterThan(30);
    expect(keys.filter((k) => !rows.has(k))).toEqual([]);
  });

  test('设置面板用到的行级文案都在 Setting/rows-lang 中', () => {
    const src = fs.readFileSync(path.join(__dirname, 'setting.tsx'), 'utf8');
    const keys = [ ...src.matchAll(/\b(?:st|rowT|_r)\([^']*'([^']*)'/g) ].map((m) => m[1]);
    const rowsSrc = fs.readFileSync(path.join(__dirname, '..', 'Setting', 'rows-lang.ts'), 'utf8');
    const rows = new Set<string>();
    for (const m of rowsSrc.matchAll(/^  '((?:[^'\\]|\\.)*)':\s*\[/gm)) rows.add(m[1]);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.filter((k) => !rows.has(k))).toEqual([]);
  });
});
