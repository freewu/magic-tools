import {
  CODE_ACCEPT,
  ENGINE_ERROR,
  EXT_OF,
  MIME_OF,
  PELE_DARK_VARS,
  PELE_FONT_FAMILY,
  PELE_FONT_SIZE,
  RENDER_ERROR_TITLE,
  applyPeleTheme,
  dataUrlToBytes,
  extractCode,
  fileNameOf,
  findFencedCode,
  isBlankCode,
  markdownFileNameOf,
  parseRenderError,
  parseSvgSize,
  peleOptions,
  prepareSvgForExport,
  scaleSize,
  svgToDataUrl,
  supportsWebp,
  toMarkdown,
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

describe('MermaidEditor 渲染引擎 (pele) 选项', () => {
  it('固定尺寸 / 不外链 / 严格按源码方向', () => {
    const opts = peleOptions();
    expect(opts.fontFamily).toBe(PELE_FONT_FAMILY); // 按字体测量排版, 必须与实际显示字体一致
    expect(opts.fontSize).toBe(PELE_FONT_SIZE);
    expect(opts.responsive).toBe(false); // 开着会给根节点写内联 max-width, 盖住预览的缩放样式
    expect(opts.autoDirection).toBe(false); // 不因容器窄自动改竖排
    expect(opts.links).toBe(false); // 预览用 innerHTML 注入, 避免误触跳走整页
    expect(opts.images).toBe(false); // 不外链图片 (纯本地渲染)
  });

  it('字号与 id 前缀可覆盖', () => {
    expect(peleOptions({ fontSize: 18 }).fontSize).toBe(18);
    expect(peleOptions({ idPrefix: 'mmd-3' }).idPrefix).toBe('mmd-3');
  });
});

describe('MermaidEditor 配色变量', () => {
  const svg = '<svg class="pele" width="10" height="10" style="--_fg:var(--pele-fg,#1f1f1f);color:var(--_fg)"></svg>';

  it('浅色原样返回 (pele 内置默认值即浅色)', () => {
    expect(applyPeleTheme(svg, false)).toBe(svg);
    expect(Object.keys(PELE_DARK_VARS)).toContain('bg');
  });

  it('深色配色写在 SVG 根节点样式最前', () => {
    const dark = applyPeleTheme(svg, true);
    expect(dark).toContain('style="--pele-bg:#1f1f1f;--pele-fg:#e6e6e6;');
    expect(dark).toContain('--pele-line:#d4d4d4;');
    // 原有样式与内容完整保留 (变量与引用同在一个 style 里, 顺序不影响取值)
    expect(dark).toContain('--_fg:var(--pele-fg,#1f1f1f);color:var(--_fg)');
    expect(dark.slice(-6)).toBe('</svg>');
  });

  it('没有内联样式时原样返回, 不抛错', () => {
    const plain = '<svg width="10" height="10"></svg>';
    expect(applyPeleTheme(plain, true)).toBe(plain);
  });
});

describe('MermaidEditor 渲染错误整理', () => {
  it('PeleError: 保留错误类型与行列信息', () => {
    const message = "Parse error on line 3:\n  C --> >\n--------^\nExpecting 'NODE_STRING', got 'TAGEND'";
    const err = Object.assign(new Error(message), { code: 'syntax', line: 3, column: 9, type: 'flowchart', snippet: 'C --> >' });
    expect(parseRenderError(err)).toEqual({ code: 'syntax', line: 3, column: 9, message });
  });

  it('语义错误无行列信息 / 未识别的 code 都能兜底', () => {
    expect(parseRenderError(Object.assign(new Error('Invalid date:2024-99-01'), { code: 'semantic', line: 0, column: 0 })))
      .toEqual({ code: 'semantic', line: 0, column: 0, message: 'Invalid date:2024-99-01' });
    expect(parseRenderError(Object.assign(new Error('No diagram type detected.'), { code: 'unsupported-diagram', line: 0, column: 0 })))
      .toEqual({ code: 'unsupported-diagram', line: 0, column: 0, message: 'No diagram type detected.' });
    // 引擎版本变化带来的未知 code 按普通错误处理 (仍然有信息可展示)
    expect(parseRenderError(Object.assign(new Error('x'), { code: 'brand-new', line: 2, column: 5 })))
      .toEqual({ code: null, line: 2, column: 5, message: 'x' });
    expect(parseRenderError('boom')).toEqual({ code: null, line: 0, column: 0, message: 'boom' });
    expect(parseRenderError(undefined)).toEqual({ code: null, line: 0, column: 0, message: 'undefined' });
  });

  it('错误标题按类型分类, 引擎加载失败单独标记', () => {
    expect(RENDER_ERROR_TITLE.syntax).toBe('语法错误');
    expect(RENDER_ERROR_TITLE.semantic).toBe('图表内容有误');
    expect(RENDER_ERROR_TITLE.limit).toBe('图形过大或嵌套过深');
    expect(RENDER_ERROR_TITLE['unsupported-diagram']).toBe('无法识别图形类型');
    expect(ENGINE_ERROR).toMatchObject({ code: 'engine', line: 0, column: 0 });
  });
});

describe('MermaidEditor SVG 尺寸解析', () => {
  it('优先取数值型 width / height (含 px 单位)', () => {
    expect(parseSvgSize('<svg width="300" height="200" viewBox="0 0 300 200"></svg>')).toEqual({ width: 300, height: 200 });
    expect(parseSvgSize('<svg width="120px" height="80px"></svg>')).toEqual({ width: 120, height: 80 });
    expect(parseSvgSize('<svg width="120.5" height="80.25"></svg>')).toEqual({ width: 120.5, height: 80.25 });
  });

  it('宽高为百分比时回退 viewBox', () => {
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

describe('MermaidEditor 打开 / 保存 .md', () => {
  const DOC = [
    '# 架构图',
    '',
    '下面这张图描述服务依赖:',
    '',
    '```mermaid',
    'graph TD',
    '  A --> B',
    '```',
    '',
    '说明文字 (保存时应原样保留)。',
    '',
  ].join('\n');

  it('markdownFileNameOf: 拼 .md 扩展名并清理非法字符', () => {
    expect(markdownFileNameOf('mermaid-flowchart')).toBe('mermaid-flowchart.md');
    expect(markdownFileNameOf('a b/c')).toBe('a-b-c.md');
    expect(markdownFileNameOf('')).toBe(`${DEFAULT_FILE_BASE}.md`);
  });

  it('findFencedCode: 定位代码块 (返回代码在原文中的位置)', () => {
    const found = findFencedCode(DOC)!;
    expect(found.code).toBe('graph TD\n  A --> B');
    expect(DOC.slice(found.start, found.end)).toBe(found.code);
    // 语言标记与围栏长度都兼容
    expect(findFencedCode('```mermaid\r\npie title x\r\n```')?.code).toBe('pie title x');
    expect(findFencedCode('````mermaid\nblock-beta\n````')?.code).toBe('block-beta');
    expect(findFencedCode('```js\nconst a = 1\n```')).toBeNull();
    expect(findFencedCode('graph TD\n  A --> B')).toBeNull();
  });

  it('extractCode: .md 取代码块内容, 纯源码文件整体当代码', () => {
    expect(extractCode(DOC)).toBe('graph TD\n  A --> B');
    expect(extractCode('flowchart LR\n  X --> Y')).toBe('flowchart LR\n  X --> Y');
  });

  it('toMarkdown: 原有代码块只替换内部代码 (周边 Markdown 文字保留)', () => {
    const out = toMarkdown('graph LR\n  A --> C', DOC);
    expect(out).toContain('# 架构图');
    expect(out).toContain('下面这张图描述服务依赖:');
    expect(out).toContain('说明文字 (保存时应原样保留)。');
    expect(out).toContain('```mermaid\ngraph LR\n  A --> C\n```');
    expect(out).not.toContain('A --> B');
  });

  it('toMarkdown: 纯源码文件 (无代码块) 自动包一层 mermaid 代码块', () => {
    expect(toMarkdown('pie title 占比\n  "A" : 1', 'pie title 占比\n  "A" : 1')).toBe('```mermaid\npie title 占比\n  "A" : 1\n```\n');
    // 空 source (未打开过文件) 同样补代码块
    expect(toMarkdown('graph TD', '')).toBe('```mermaid\ngraph TD\n```\n');
  });

  it('CODE_ACCEPT: 覆盖 .mmd / .md / .txt', () => {
    for (const ext of [ '.mmd', '.mermaid', '.md', '.markdown', '.txt' ]) expect(CODE_ACCEPT).toContain(ext);
  });
});
