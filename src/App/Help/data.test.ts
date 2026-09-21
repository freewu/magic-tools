// Help「使用组件」badge 数据与地址拼接
import { compomentList, componentBadgeUrl, DEFAULT_BADGE_COLOR } from './data';

describe('Help 使用组件 badge', () => {
  test('缺省底色 / flat-square / 深色标签, 无图标时不带 logo 参数', () => {
    const url = componentBadgeUrl({ name: 'Vditor', version: '4.0.0', url: '' });
    expect(url.startsWith('https://img.shields.io/badge/Vditor-4.0.0-')).toBe(true);
    expect(url).toContain(DEFAULT_BADGE_COLOR);
    expect(url).toContain('style=flat-square');
    expect(url).toContain('labelColor=24292F');
    expect(url).not.toContain('logo=');
  });

  test('品牌色 + simple-icons 图标 (logoColor 缺省白色)', () => {
    const url = componentBadgeUrl({
      name: 'React',
      version: '18.3.1',
      url: '',
      color: '087EA4',
      logo: 'react',
    });
    expect(url).toContain('/badge/React-18.3.1-087EA4?');
    expect(url).toContain('logo=react');
    expect(url).toContain('logoColor=fff');
  });

  test('logoColor 可自定义', () => {
    const url = componentBadgeUrl({
      name: 'JSON5',
      version: '2.2.3',
      url: '',
      logo: 'json',
      logoColor: '1B1F24',
    });
    expect(url).toContain('logoColor=1B1F24');
  });

  test('badge 文本按 shields 规则转义: - => --, 空格 => _, _ => __', () => {
    const dashed = componentBadgeUrl({ name: 'fast-xml-parser', version: '4.5.7', url: '', color: '005FAD' });
    expect(dashed).toContain('/badge/fast--xml--parser-4.5.7-005FAD?');

    const spaced = componentBadgeUrl({ name: 'Ant Design', version: '5.29.3', url: '' });
    expect(spaced).toContain('/badge/Ant_Design-5.29.3-');

    expect(componentBadgeUrl({ name: 'a_b', version: '1.0.0', url: '' })).toContain('/badge/a__b-1.0.0-');
  });

  test('组件清单: 名称唯一 / 均有版本号 / 均为 shields badge 地址', () => {
    expect(compomentList.length).toBeGreaterThan(0);
    const names = compomentList.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);

    compomentList.forEach((item) => {
      expect(item.name.trim()).not.toBe('');
      expect(item.version).toMatch(/^\d+\.\d+/);
      expect(item.url.startsWith('https://')).toBe(true);

      const url = componentBadgeUrl(item);
      expect(url.startsWith('https://img.shields.io/badge/')).toBe(true);
      expect(url).toContain(item.version);
      expect(url).toContain(item.color || DEFAULT_BADGE_COLOR);
    });
  });
});
