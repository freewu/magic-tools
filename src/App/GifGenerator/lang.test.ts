import fs from 'fs';
import path from 'path';
import lang, { im, imT } from './lang';
import { DITHER_TEXT, FIT_HINTS, FIT_TEXT } from './lib';

/** 词条表来源: 页面 / 纯逻辑里的 t() / tt() 字面量都要能查到词条 (设置面板走 Setting/rows-lang, 单独校验) */
const sourceFiles = [ 'index.tsx', 'lib.ts' ];

/** 提取 "t('xxx')" / "tt('xxx')" 里的原文 */
const usedKeys = (): Set<string> => {
  const keys = new Set<string>();
  for (const file of sourceFiles) {
    const src = fs.readFileSync(path.join(__dirname, file), 'utf8');
    for (const m of src.matchAll(/\b(?:t|tt|st|_r)\(\s*'([^']*)'/g)) keys.add(m[1]);
  }
  return keys;
};

describe('GifGenerator 语言包', () => {
  test('应用名称三语齐全 (zh-CN 取自 define.tsx 的 AppName)', () => {
    expect(lang.default).toBe('zh-CN');
    expect(lang['zh-TW'].appName).toBe('GIF 生成');
    expect(lang.en.appName).toBe('GIF Generator');
  });

  test('im: 命中词条返回对应语言, 未命中回退原文', () => {
    expect(im('zh-CN', '生成 GIF')).toBe('生成 GIF');
    expect(im('zh-TW', '生成 GIF')).toBe('產生 GIF');
    expect(im('en', '生成 GIF')).toBe('Generate GIF');
    expect(im('en', '没收录的文案')).toBe('没收录的文案');
  });

  test('imT: 替换占位符, 不传变量时保留占位符', () => {
    expect(imT('zh-CN', '共 {n} 帧', { n: 3 })).toBe('共 3 帧');
    expect(imT('en', '共 {n} 帧', { n: 3 })).toBe('3 frames');
    expect(imT('en', '生成失败: {msg}', { msg: 'boom' })).toBe('Generation failed: boom');
    expect(imT('en', '共 {n} 帧')).toContain('{n}');
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

  test('尺寸模式 / 抖动文案也在词条表内', () => {
    const src = fs.readFileSync(path.join(__dirname, 'lang.ts'), 'utf8');
    const rows = new Set<string>();
    for (const m of src.matchAll(/^  '((?:[^'\\]|\\.)*)':\s*\[/gm)) rows.add(m[1]);
    const dynamic = [ ...Object.values(FIT_TEXT), ...Object.values(FIT_HINTS), ...Object.values(DITHER_TEXT) ];
    expect(dynamic.length).toBe(12);
    expect(dynamic.filter((k) => !rows.has(k))).toEqual([]);
    expect(im('en', FIT_TEXT.source)).toBe('Follow the first image');
    expect(im('zh-TW', DITHER_TEXT.none)).toBe('不抖動');
  });

  test('设置面板用到的行级文案都在 Setting/rows-lang 中', () => {
    const src = fs.readFileSync(path.join(__dirname, 'setting.tsx'), 'utf8');
    const keys = [ ...src.matchAll(/\b(?:st|gt|rowT|_r)\(\s*(?:locale,\s*)?'([^']*)'/g) ].map((m) => m[1]);
    const rowsSrc = fs.readFileSync(path.join(__dirname, '..', 'Setting', 'rows-lang.ts'), 'utf8');
    const rows = new Set<string>();
    for (const m of rowsSrc.matchAll(/^  '((?:[^'\\]|\\.)*)':\s*\[/gm)) rows.add(m[1]);
    expect(keys.length).toBeGreaterThan(5);
    expect(keys.filter((k) => !rows.has(k))).toEqual([]);
  });
});
