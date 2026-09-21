import {
  EDITOR_HEIGHT,
  MARKDOWN_OPTIONS,
  TOOLBAR,
  assetBase,
  buildToc,
  contentTheme,
  countFences,
  countWords,
  docTitle,
  escapeHtml,
  exportFileName,
  fenceMask,
  headings,
  hljsStyle,
  inlineText,
  markdownStats,
  stripCode,
  vditorCdn,
  vditorLang,
  wrapExportHtml,
} from './lib';

const md = [
  '# 标题',
  '',
  '正文 with 3 words',
  '',
  '```ts',
  'const a = 1;',
  '# 不是标题',
  '```',
  '',
].join('\n');

describe('VditorMarkdown lib: 语言 / 主题 / 资源路径', () => {
  test('vditorLang 把应用语言映射为 Vditor 语言包名', () => {
    expect(vditorLang('zh-CN')).toBe('zh_CN');
    expect(vditorLang('zh-TW')).toBe('zh_TW');
    expect(vditorLang('en')).toBe('en_US');
    expect(vditorLang('fr')).toBe('zh_CN');
  });

  test('浅色 / 深色对应的内容主题与代码高亮主题', () => {
    expect(contentTheme(false)).toBe('light');
    expect(contentTheme(true)).toBe('dark');
    expect(hljsStyle(false)).toBe('github');
    expect(hljsStyle(true)).toBe('github-dark');
  });

  test('assetBase 把文档地址归一化为目录 URL', () => {
    expect(assetBase('http://localhost/index.html')).toBe('http://localhost/');
    expect(assetBase('http://localhost/a/b/')).toBe('http://localhost/a/b/');
    expect(assetBase('/x/y')).toBe('/x/');
    expect(assetBase('./')).toBe('./');
    expect(assetBase('')).toBe('');
  });

  test('assetBase 忽略 query 与 hash', () => {
    expect(assetBase('http://h/p/index.html?q=1#/tool')).toBe('http://h/p/');
    expect(assetBase('http://h/p/?q=1')).toBe('http://h/p/');
  });

  test('vditorCdn 拼出运行时资源前缀', () => {
    expect(vditorCdn('/')).toBe('/vditor');
    expect(vditorCdn('./')).toBe('./vditor');
    expect(vditorCdn('/magic-tools/')).toBe('/magic-tools/vditor');
    expect(vditorCdn('http://localhost/index.html')).toBe('http://localhost/vditor');
    expect(vditorCdn('')).toBe('/vditor');
  });

  test('共享的编辑器常量', () => {
    expect(EDITOR_HEIGHT).toBe(460);
    expect(MARKDOWN_OPTIONS.toc).toBe(true);
    expect(MARKDOWN_OPTIONS.footnotes).toBe(true);
    expect(MARKDOWN_OPTIONS.mathBlockPreview).toBe(true);
  });

  test('工具栏包含即时渲染常用项, 且不含需要后端的上传按钮 (图片走粘贴 / 拖入的 base64 内联)', () => {
    expect(TOOLBAR).toContain('headings');
    expect(TOOLBAR).toContain('table');
    expect(TOOLBAR).toContain('math');
    expect(TOOLBAR).toContain('outline');
    expect(TOOLBAR).toContain('fullscreen');
    expect(TOOLBAR).not.toContain('upload');
    expect(TOOLBAR).not.toContain('record');
  });
});

describe('VditorMarkdown lib: 围栏代码块扫描', () => {
  test('fenceMask 标记围栏块内的行 (含围栏行自身)', () => {
    expect(fenceMask(md)).toEqual([false, false, false, false, true, true, true, true, false]);
  });

  test('fenceMask 支持 ~~~ 围栏且不会与 ``` 混用', () => {
    const text = ['~~~', '```', 'still inside', '~~~', 'outside'].join('\n');
    expect(fenceMask(text)).toEqual([true, true, true, true, false]);
  });

  test('fenceMask 未闭合的围栏延伸到文末', () => {
    expect(fenceMask('a\n```\nb\nc')).toEqual([false, true, true, true]);
  });

  test('fenceMask 忽略带语言标记的关闭行', () => {
    const text = ['```', 'code', '```ts', 'still', '```'].join('\n');
    expect(fenceMask(text)).toEqual([true, true, true, true, true]);
  });

  test('countFences 统计开启围栏数量', () => {
    expect(countFences(md)).toBe(1);
    expect(countFences('```\na\n```\n\n~~~\nb\n~~~')).toBe(2);
    expect(countFences('```\n未闭合')).toBe(1);
    expect(countFences('普通文本')).toBe(0);
  });

  test('stripCode 去掉围栏块与行内代码', () => {
    expect(stripCode(md)).not.toContain('const a = 1;');
    expect(stripCode('a `code` b')).toBe('a   b');
    expect(stripCode('`x`')).toBe(' ');
  });
});

describe('VditorMarkdown lib: 标题与目录', () => {
  test('inlineText 去掉行内标记', () => {
    expect(inlineText('**加粗** 与 `代码`')).toBe('加粗 与 代码');
    expect(inlineText('[链接](http://a)')).toBe('链接');
    expect(inlineText('![图](a.png)')).toBe('图');
    expect(inlineText('~~删除~~ __粗__')).toBe('删除 粗');
  });

  test('headings 跳过围栏代码块内的 # 行', () => {
    const items = headings(md);
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({ level: 1, text: '标题', line: 1 });
  });

  test('headings 支持 1-6 级、行尾 # 与缩进 (1-3 空格)', () => {
    const items = headings('## 二级 ##\n   ### 三级\n####### 七级\n    # 四格缩进');
    expect(items.map((h) => [h.level, h.text])).toEqual([[2, '二级'], [3, '三级']]);
    expect(items[0].line).toBe(1);
    expect(items[1].line).toBe(2);
  });

  test('headings 忽略没有文字的标题', () => {
    expect(headings('#\n##   \n## 有文字')).toHaveLength(1);
  });

  test('buildToc 生成缩进列表并跳过 h1', () => {
    const toc = buildToc('# 文档\n## 一\n### 一甲\n## 二');
    expect(toc.startsWith('## 目录')).toBe(true);
    expect(toc).toContain('- 一');
    expect(toc).toContain('  - 一甲');
    expect(toc).toContain('- 二');
    expect(toc).not.toContain('文档');
    expect(toc.endsWith('\n')).toBe(true);
  });

  test('buildToc 没有 h2 及以下标题时返回空串', () => {
    expect(buildToc('# 只有一级标题')).toBe('');
    expect(buildToc('')).toBe('');
  });
});

describe('VditorMarkdown lib: 统计', () => {
  test('countWords 中日韩按字计, 拉丁按词计', () => {
    expect(countWords('你好世界')).toBe(4);
    expect(countWords('hello world')).toBe(2);
    expect(countWords('中文 mixed 3 words')).toBe(5);
    expect(countWords('')).toBe(0);
  });

  test('markdownStats 基础字段', () => {
    const stats = markdownStats(md);
    expect(stats.chars).toBe(md.length);
    expect(stats.lines).toBe(9);
    expect(stats.headings).toBe(1);
    expect(stats.codeBlocks).toBe(1);
    expect(stats.words).toBe(7);
  });

  test('markdownStats 空文档全为 0', () => {
    const stats = markdownStats('');
    expect(stats.chars).toBe(0);
    expect(stats.lines).toBe(0);
    expect(stats.words).toBe(0);
    expect(stats.headings).toBe(0);
    expect(stats.codeBlocks).toBe(0);
  });

  test('markdownStats 图片不计入链接', () => {
    const stats = markdownStats('![a](1.png) 与 [b](2)');
    expect(stats.images).toBe(1);
    expect(stats.links).toBe(1);
  });

  test('markdownStats 统计任务 / 引用 / 表格并跳过代码块', () => {
    const text = ['- [x] 完成', '- [ ] 未完成', '> 引用', '| a | b |', '| --- | --- |', '```', '- [x] 代码里的', '```'].join('\n');
    const stats = markdownStats(text);
    expect(stats.tasks).toBe(2);
    expect(stats.tasksDone).toBe(1);
    expect(stats.quotes).toBe(1);
    expect(stats.tables).toBe(1);
  });

  test('markdownStats 去空白字符数', () => {
    expect(markdownStats('a b\n c').charsNoSpace).toBe(3);
  });
});

describe('VditorMarkdown lib: 导出', () => {
  test('escapeHtml 转义 HTML 特殊字符', () => {
    expect(escapeHtml(`<a href="x">&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
  });

  test('wrapExportHtml 生成完整 HTML 文档', () => {
    const html = wrapExportHtml('<h1>t</h1>', { title: 'T&T', isDark: false, lang: 'zh-CN' });
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<title>T&amp;T</title>');
    expect(html).toContain('<html lang="zh-CN">');
    expect(html).toContain('<body class="markdown-export">');
    expect(html).toContain('<article class="vditor-reset"><h1>t</h1></article>');
    expect(html).toContain('.markdown-export .vditor-reset');
    expect(html.endsWith('\n')).toBe(true);
  });

  test('wrapExportHtml 深色模式加 class 并内联主题样式', () => {
    const html = wrapExportHtml('body', {
      title: 'x',
      isDark: true,
      themeCss: '/*theme*/',
      codeCss: '/*code*/',
    });
    expect(html).toContain('<body class="markdown-export markdown-export-dark">');
    expect(html).toContain('/*theme*/');
    expect(html).toContain('/*code*/');
    expect(html).toContain('<html lang="zh-CN">');
  });

  test('exportFileName 过滤非法字符并兜底', () => {
    expect(exportFileName('a/b:c*d?e"f<g>h|i j', 'md')).toBe('a-b-c-d-e-f-g-h-i-j.md');
    expect(exportFileName('   ', 'html')).toBe('markdown.html');
    expect(exportFileName('...', 'md')).toBe('markdown.md');
  });

  test('exportFileName 限制长度', () => {
    const name = exportFileName('x'.repeat(200), 'md');
    expect(name.length).toBe(63);
    expect(name.endsWith('.md')).toBe(true);
  });

  test('docTitle 优先一级标题, 否则回退第一个标题', () => {
    expect(docTitle('## 二\n# 一')).toBe('一');
    expect(docTitle('### 只有三级')).toBe('只有三级');
    expect(docTitle('没有标题')).toBe('Markdown');
  });
});
