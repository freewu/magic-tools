import { optimizeSvgXml, svgoConfigFor } from './lib';

describe('SVG 格式化 - 配置', () => {
  test('压缩模式非 pretty, 美化模式 pretty 且缩进默认 2', () => {
    const min = svgoConfigFor('min');
    const pretty = svgoConfigFor('pretty');
    expect(min.js2svg?.pretty).toBe(false);
    expect(pretty.js2svg?.pretty).toBe(true);
    expect(pretty.js2svg?.indent).toBe(2);
    expect(svgoConfigFor('pretty', 4).js2svg?.indent).toBe(4);
  });
  test('均使用 multipass 与 preset-default', () => {
    const cfg = svgoConfigFor('min') as { multipass: boolean; plugins: Array<{ name: string }> };
    expect(cfg.multipass).toBe(true);
    expect(cfg.plugins.some((p) => p.name === 'preset-default')).toBe(true);
  });
});

describe('SVG 格式化 - 真实 SVGO 优化', () => {
  const SRC = '<svg xmlns="http://www.w3.org/2000/svg"><!-- 注释 --><g id="x"><rect width="10" height="10" fill="red"/></g></svg>';

  test('压缩: 去注释去多余分组, 体积变小', async () => {
    const r = await optimizeSvgXml(SRC, 'min');
    expect(r.ok).toBe(true);
    expect(r.data).not.toContain('注释');
    expect(r.data).not.toContain('<g');
    expect(r.afterBytes ?? 0).toBeLessThan(r.beforeBytes ?? 0);
  });

  test('美化模式: 多行缩进输出', async () => {
    const r = await optimizeSvgXml(SRC, 'pretty');
    expect(r.ok).toBe(true);
    expect(r.data).toContain('\n');
  });

  test('空输入报错', async () => {
    const r = await optimizeSvgXml('   ', 'min');
    expect(r.ok).toBe(false);
  });

  test('非法 SVG 返回错误而非抛出', async () => {
    const r = await optimizeSvgXml('<svg><rect', 'min');
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });

  test('viewBox 保留', async () => {
    const r = await optimizeSvgXml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>', 'min');
    expect(r.ok).toBe(true);
    expect(r.data).toContain('viewBox="0 0 10 10"');
  });
});
