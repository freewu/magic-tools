import {
  EXT_OF,
  MIME_OF,
  dataUrlToBytes,
  fileNameOf,
  isBlankCode,
  mermaidConfig,
  parseSvgSize,
  prepareSvgForExport,
  scaleSize,
  svgToDataUrl,
  supportsWebp,
  utf8ToBase64,
} from './lib';
import { DEFAULT_FILE_BASE } from './data';

describe('MermaidEditor 导出文件名', () => {
  it('按格式拼扩展名', () => {
    expect(fileNameOf('mermaid-flowchart', 'svg')).toBe('mermaid-flowchart.svg');
    expect(fileNameOf('mermaid-flowchart', 'png')).toBe('mermaid-flowchart.png');
    expect(fileNameOf('mermaid-flowchart', 'webp')).toBe('mermaid-flowchart.webp');
  });

  it('清理非法字符与空白', () => {
    expect(fileNameOf('a b/c:d*e?f"g<h>i|j', 'png')).toBe('a-b-c-d-e-f-g-h-i-j.png');
    expect(fileNameOf('  --name--  ', 'svg')).toBe('name.svg');
  });

  it('空前缀回退默认名', () => {
    expect(fileNameOf('', 'png')).toBe(`${DEFAULT_FILE_BASE}.png`);
    expect(fileNameOf('///', 'png')).toBe(`${DEFAULT_FILE_BASE}.png`);
  });

  it('MIME / 扩展名映射与实际编码一致', () => {
    expect(MIME_OF.svg).toBe('image/svg+xml');
    expect(MIME_OF.png).toBe('image/png');
    expect(MIME_OF.webp).toBe('image/webp');
    expect(Object.values(EXT_OF)).toEqual([ 'svg', 'png', 'webp' ]);
  });
});

describe('MermaidEditor 源码判空', () => {
  it('空白 / 换行 / 空串算空', () => {
    expect(isBlankCode('')).toBe(true);
    expect(isBlankCode('   \n\t ')).toBe(true);
    expect(isBlankCode('flowchart TD')).toBe(false);
    expect(isBlankCode('%% 只有注释也算非空')).toBe(false);
  });
});

describe('MermaidEditor mermaid 配置', () => {
  it('浅色 / 深色主题与本地渲染开关', () => {
    const light = mermaidConfig(false);
    expect(light.startOnLoad).toBe(false);
    expect(light.theme).toBe('default');
    expect(light.securityLevel).toBe('strict'); // 预览用 innerHTML 注入, 必须禁止图表内的脚本
    expect(light.suppressErrorRendering).toBe(true);
    const dark = mermaidConfig(true);
    expect(dark.theme).toBe('dark');
  });

  it('默认关闭 useMaxWidth (导出需要固定宽高) 且关闭 htmlLabels', () => {
    const cfg = mermaidConfig(false);
    expect(cfg.flowchart).toMatchObject({ useMaxWidth: false, htmlLabels: false });
    for (const key of [ 'sequence', 'class', 'state', 'er', 'gantt', 'pie', 'journey' ] as const) {
      expect(cfg[key]).toMatchObject({ useMaxWidth: false });
    }
    expect(mermaidConfig(false, { useMaxWidth: true }).flowchart).toMatchObject({ useMaxWidth: true });
  });

  it('字号可覆盖', () => {
    expect(mermaidConfig(false).themeVariables.fontSize).toBe('14px');
    expect(mermaidConfig(false, { fontSize: 18 }).themeVariables.fontSize).toBe('18px');
  });
});

describe('MermaidEditor SVG 尺寸解析', () => {
  it('优先取数值型 width / height (含 px 单位)', () => {
    expect(parseSvgSize('<svg width="300" height="200" viewBox="0 0 300 200"></svg>')).toEqual({ width: 300, height: 200 });
    expect(parseSvgSize('<svg width="120px" height="80px"></svg>')).toEqual({ width: 120, height: 80 });
    expect(parseSvgSize('<svg width="120.5" height="80.25"></svg>')).toEqual({ width: 120.5, height: 80.25 });
  });

  it('mermaid 默认的 width=100% 时回退 viewBox', () => {
    const svg = '<svg id="mermaid-1" width="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 300px;" viewBox="0 0 300 200" role="graphics-document"></svg>';
    expect(parseSvgSize(svg)).toEqual({ width: 300, height: 200 });
  });

  it('viewBox 支持逗号 / 多余空格 / 负原点', () => {
    expect(parseSvgSize('<svg viewBox="0 0 640,480"></svg>')).toEqual({ width: 640, height: 480 });
    expect(parseSvgSize('<svg viewBox="  0   0   99   33  "></svg>')).toEqual({ width: 99, height: 33 });
    expect(parseSvgSize('<svg viewBox="-10 -20 50 60"></svg>')).toEqual({ width: 50, height: 60 });
  });

  it('无法确定尺寸时返回 null (百分比且无 viewBox / 非法值 / 非 svg)', () => {
    expect(parseSvgSize('<svg width="100%" height="100%"></svg>')).toBeNull();
    expect(parseSvgSize('<svg width="0" height="0"></svg>')).toBeNull();
    expect(parseSvgSize('<svg viewBox="0 0 abc 20"></svg>')).toBeNull();
    expect(parseSvgSize('<svg viewBox="0 0 100"></svg>')).toBeNull();
    expect(parseSvgSize('<div>不是 svg</div>')).toBeNull();
    expect(parseSvgSize('')).toBeNull();
  });

  it('scaleSize 按倍率取整且不小于 1 像素', () => {
    expect(scaleSize({ width: 300, height: 200 }, 2)).toEqual({ width: 600, height: 400 });
    expect(scaleSize({ width: 100.4, height: 60.6 }, 2)).toEqual({ width: 201, height: 121 });
    expect(scaleSize({ width: 0.2, height: 0.2 }, 0.1)).toEqual({ width: 1, height: 1 });
  });
});

describe('MermaidEditor 导出前 SVG 处理', () => {
  const mmd = '<svg id="mermaid-1" width="100%" xmlns="http://www.w3.org/2000/svg" class="flowchart" style="max-width: 300px;" viewBox="0 0 300 200" role="graphics-document"><g stroke-width="2" fill="none"><rect width="50" height="20" /></g></svg>';

  it('把 100% 宽高替换为固定像素值, 保留 viewBox 与其余属性', () => {
    const out = prepareSvgForExport(mmd, { width: 600, height: 400 });
    expect(out).toContain('width="600"');
    expect(out).toContain('height="400"');
    expect(out).not.toContain('width="100%"');
    expect(out).toContain('viewBox="0 0 300 200"');
    expect(out).toContain('id="mermaid-1"');
    expect(out).toContain('class="flowchart"');
    // 节点自身的 width/height 不能被改掉
    expect(out).toContain('<rect width="50" height="20" />');
    expect(out).toContain('stroke-width="2"');
    expect(out.startsWith('<svg width="600" height="400"')).toBe(true);
  });

  it('补 xmlns:xlink (缺 xmlns 时一并补上), 且重复处理不会重复追加', () => {
    const out = prepareSvgForExport('<svg width="10" height="10"></svg>', { width: 20, height: 20 });
    expect(out).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(out).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
    expect(out.match(/xmlns=/g)).toHaveLength(1);
    expect(out.match(/xmlns:xlink=/g)).toHaveLength(1);
    const again = prepareSvgForExport(out, { width: 40, height: 40 });
    expect(again.match(/xmlns:xlink=/g)).toHaveLength(1);
    expect(again.match(/xmlns=/g)).toHaveLength(1);
    expect(again).toContain('width="40"');
    expect(again).not.toContain('width="20"');
  });

  it('缺少 viewBox 时按导出尺寸补一个', () => {
    const out = prepareSvgForExport('<svg width="10" height="10"></svg>', { width: 20, height: 30 });
    expect(out).toContain('viewBox="0 0 20 30"');
  });

  it('只处理第一个 svg 根节点, 内嵌 svg 保持不变', () => {
    const inner = '<svg width="5" height="5"></svg>';
    const out = prepareSvgForExport(`<svg width="10" height="10">${inner}</svg>`, { width: 30, height: 30 });
    expect(out.startsWith('<svg width="30" height="30"')).toBe(true);
    expect(out.endsWith(`${inner}</svg>`)).toBe(true);
  });

  it('非 svg 输入原样返回', () => {
    expect(prepareSvgForExport('<p>x</p>', { width: 1, height: 1 })).toBe('<p>x</p>');
  });
});

describe('MermaidEditor data URL 编解码', () => {
  it('utf8ToBase64 与 Buffer 结果一致 (中文 / emoji / 换行)', () => {
    for (const s of [ 'hello', '流程图 <svg/>', '🎉 emoji', 'line1\nline2\t"引号"' ]) {
      expect(utf8ToBase64(s)).toBe(Buffer.from(s, 'utf8').toString('base64'));
    }
  });

  it('svgToDataUrl 前缀正确且可还原原文', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>中文标签 ✓</text></svg>';
    const url = svgToDataUrl(svg);
    expect(url.startsWith('data:image/svg+xml;base64,')).toBe(true);
    const back = new TextDecoder().decode(dataUrlToBytes(url));
    expect(back).toBe(svg);
  });

  it('dataUrlToBytes 兼容 URL 编码形式', () => {
    expect(new TextDecoder().decode(dataUrlToBytes('data:image/svg+xml,%3Csvg%3E%E4%B8%AD%3C%2Fsvg%3E'))).toBe('<svg>中</svg>');
  });

  it('dataUrlToBytes 解出原始字节 (PNG 魔数)', () => {
    const bytes = dataUrlToBytes('data:image/png;base64,iVBORw0KGgo=');
    expect(Array.from(bytes.slice(0, 4))).toEqual([ 0x89, 0x50, 0x4e, 0x47 ]);
  });
});

describe('MermaidEditor WebP 支持探测', () => {
  it('探测失败时返回 false 而不是抛错', () => {
    const original = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = (() => { throw new Error('not implemented'); }) as never;
    expect(supportsWebp()).toBe(false);
    HTMLCanvasElement.prototype.toDataURL = (() => 'data:image/png;base64,AAA') as never;
    expect(supportsWebp()).toBe(false);
    HTMLCanvasElement.prototype.toDataURL = (() => 'data:image/webp;base64,AAA') as never;
    expect(supportsWebp()).toBe(true);
    HTMLCanvasElement.prototype.toDataURL = original;
  });
});
