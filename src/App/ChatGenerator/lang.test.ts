import fs from 'fs';
import path from 'path';
import lang, { cr, crT } from './lang';

/** 词条表来源: 页面 / 预览里的 t() / tt() 字面量都要能查到词条 (设置面板走 Setting/rows-lang, 单独校验) */
const pageFiles = ['index.tsx', 'preview.tsx'];

/** 提取 "t('xxx')" / "tt('xxx')" 里的原文 */
const usedKeys = (): Set<string> => {
  const keys = new Set<string>();
  for (const file of pageFiles) {
    const src = fs.readFileSync(path.join(__dirname, file), 'utf8');
    for (const m of src.matchAll(/\b(?:t|tt|st|_r)\(\s*'([^']*)'/g)) keys.add(m[1]);
    // 行级文案 (设置面板) 走 Setting/rows-lang, 单独校验
  }
  return keys;
};

/** rows-lang 里收录的原文 */
const rowKeys = (): Set<string> => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'Setting', 'rows-lang.ts'), 'utf8');
  const keys = new Set<string>();
  for (const m of src.matchAll(/^  '((?:[^'\\]|\\.)*)':\s*\[/gm)) keys.add(m[1]);
  return keys;
};

describe('ChatGenerator 语言包', () => {
  test('应用名称三语齐全 (zh-CN 取自 define.tsx 的 AppName)', () => {
    expect(lang.default).toBe('zh-CN');
    expect(lang['zh-TW'].appName).toBe('聊天產生器');
    expect(lang.en.appName).toBe('Chat Generator');
  });

  test('cr: 命中词条返回对应语言, 未命中回退原文', () => {
    expect(cr('zh-CN', '导出 PNG')).toBe('导出 PNG');
    expect(cr('zh-TW', '导出 PNG')).toBe('匯出 PNG');
    expect(cr('en', '导出 PNG')).toBe('Export PNG');
    expect(cr('en', '添加时间')).toBe('Add timestamp');
    expect(cr('en', '没收录的文案')).toBe('没收录的文案');
  });

  test('crT: 替换占位符, 不传变量时保留占位符', () => {
    expect(crT('zh-CN', '消息 (共 {n} 条)', { n: 7 })).toBe('消息 (共 7 条)');
    expect(crT('en', '消息 (共 {n} 条)', { n: 7 })).toBe('Messages (7)');
    expect(crT('en', '导出失败: {msg}', { msg: 'boom' })).toBe('Export failed: boom');
    expect(crT('en', '消息 (共 {n} 条)')).toContain('{n}');
  });

  test('页面里用到的原文全部有词条 (三语都非空)', () => {
    const rows = new Set<string>();
    const src = fs.readFileSync(path.join(__dirname, 'lang.ts'), 'utf8');
    for (const m of src.matchAll(/^  '((?:[^'\\]|\\.)*)':\s*\[\s*'([^']*)',\s*'([^']*)',?\s*\]/gm)) {
      rows.add(m[1]);
      expect(m[2].trim().length).toBeGreaterThan(0);
      expect(m[3].trim().length).toBeGreaterThan(0);
    }
    const keys = [...usedKeys()];
    expect(keys.length).toBeGreaterThan(20);
    expect(keys.filter((k) => !rows.has(k))).toEqual([]);
  });

  test('设置面板用到的行级文案都在 Setting/rows-lang 中', () => {
    const src = fs.readFileSync(path.join(__dirname, 'setting.tsx'), 'utf8');
    const keys = [...src.matchAll(/\b(?:st|rowT|_r)\([^']*'([^']*)'/g)].map((m) => m[1]);
    const rows = rowKeys();
    expect(keys.length).toBeGreaterThan(0);
    const missing = keys.filter((k) => !rows.has(k));
    expect(missing).toEqual([]);
  });

  test('9 个平台名称在词条里保持品牌原文', () => {
    const row = '可切换 9 个平台: 微信 / QQ / Slack / Telegram / Discord / WhatsApp / LINE / 钉钉 / 飞书';
    for (const locale of ['zh-CN', 'zh-TW', 'en']) {
      const text = cr(locale, row);
      for (const brand of ['QQ', 'Slack', 'Telegram', 'Discord', 'WhatsApp', 'LINE']) {
        expect(text).toContain(brand);
      }
    }
  });
});
