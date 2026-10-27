// Help「使用组件」badge: 本地生成 shields.io 风格 SVG (data URL), 不请求网络
import {
  compomentList,
  componentBadgeSrc,
  DEFAULT_BADGE_COLOR,
  DEFAULT_BADGE_LABEL_COLOR,
} from './data';

/** data URL -> SVG 源码 (便于断言内部结构) */
const svgOf = (src: string) => {
  expect(src.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
  return decodeURIComponent(src.slice('data:image/svg+xml;charset=utf-8,'.length));
};

describe('Help 使用组件 badge', () => {
  test('生成 data URL, 内含组件名与版本号', () => {
    const src = componentBadgeSrc({ name: 'Vditor', version: '4.0.0', url: '' });
    expect(src).not.toContain('img.shields.io'); // 不再请求 shields.io
    expect(src.startsWith('data:image/svg+xml')).toBe(true);
    const svg = svgOf(src);
    expect(svg.startsWith('<svg ')).toBe(true);
    expect(svg).toContain('>Vditor<');
    expect(svg).toContain('>4.0.0<');
    expect(svg).toContain('height="20"');
  });

  test('缺省底色 / 标签底色与 shields.io 一致', () => {
    const svg = svgOf(componentBadgeSrc({ name: 'pkg', version: '1.0.0', url: '' }));
    expect(svg).toContain(`fill="#${DEFAULT_BADGE_COLOR}"`);
    expect(svg).toContain(`fill="#${DEFAULT_BADGE_LABEL_COLOR}"`);
  });

  test('自定义品牌色写进状态段背景', () => {
    const svg = svgOf(componentBadgeSrc({ name: 'React', version: '18.3.1', url: '', color: '087EA4' }));
    expect(svg).toContain('fill="#087EA4"');
    expect(svg).not.toContain(`fill="#${DEFAULT_BADGE_COLOR}"`);
  });

  test('特殊字符按 XML 转义, 不会破坏 SVG', () => {
    const svg = svgOf(componentBadgeSrc({ name: 'a&b', version: '1.0.0', url: '' }));
    expect(svg).toContain('>a&amp;b<');
    expect(svg).not.toContain('>a&b<');
  });

  test('组件清单: 名称唯一 / 均有版本号 / 均为 https 主页 / badge 均可本地生成', () => {
    expect(compomentList.length).toBeGreaterThan(0);
    const names = compomentList.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);

    compomentList.forEach((item) => {
      expect(item.name.trim()).not.toBe('');
      expect(item.version).toMatch(/^\d+\.\d+/);
      expect(item.url.startsWith('https://')).toBe(true);

      const svg = svgOf(componentBadgeSrc(item));
      expect(svg).toContain(`>${item.version.replace(/&/g, '&amp;')}<`);
      expect(svg).toContain(`fill="#${item.color || DEFAULT_BADGE_COLOR}"`);
    });
  });
});
