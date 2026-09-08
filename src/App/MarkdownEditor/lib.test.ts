import { renderMarkdown, texToHtml, wrapExportHtml, MD_EXPORT_CSS } from './lib';

const has = (html: string, frag: string) => expect(html).toContain(frag);

describe('LaTeX 子集', () => {
  test('上下标与希腊字母', () => {
    has(texToHtml('x^2 + \\alpha_i'), '<sup>2</sup>');
    has(texToHtml('x^2 + \\alpha_i'), 'α');
    has(texToHtml('x_1^{n}'), '<sub>1</sub>');
    has(texToHtml('\\sum_{i=1}^{n} i'), '∑');
  });
  test('\\frac 与 \\sqrt', () => {
    const out = texToHtml('\\frac{a}{b}');
    has(out, 'class="tf"');
    expect(out.indexOf('tn')).toBeGreaterThan(-1);
    has(texToHtml('\\sqrt{x}'), '√');
  });
  test('常用符号映射与 \\text', () => {
    has(texToHtml('a \\leq b \\rightarrow \\infty'), '≤');
    has(texToHtml('\\pi \\approx 3.14'), 'π');
    has(texToHtml('\\text{单位:} m/s'), '单位:');
  });
  test('HTML 注入被转义', () => {
    const out = texToHtml('<script>alert(1)</script>');
    expect(out).not.toContain('<script>');
    has(out, '&lt;script&gt;');
  });
});

describe('Markdown 块级元素', () => {
  test('标题 / 段落 / 分隔线', () => {
    const out = renderMarkdown('# 一级标题\n\n普通段落 **加粗** 内容。\n\n---\n');
    has(out, '<h1>一级标题</h1>');
    has(out, '<strong>加粗</strong>');
    has(out, '<hr />');
  });
  test('无序 / 有序列表 (含嵌套缩进)', () => {
    const out = renderMarkdown('- a\n- b\n  - b1\n  - b2\n- c\n\n1. 第一\n2. 第二\n');
    has(out, '<ul>');
    has(out, '<ol>');
    const firstUl = out.indexOf('<ul>');
    const nestedUl = out.indexOf('<ul>', firstUl + 1);
    expect(nestedUl).toBeGreaterThan(firstUl);
    has(out, '<li>第二</li>');
  });
  test('表格', () => {
    const md = '| 名称 | 数量 |\n| --- | --- |\n| 苹果 | 3 |\n| 香蕉 | 5 |\n';
    const out = renderMarkdown(md);
    has(out, '<table>');
    has(out, '<th>名称</th>');
    has(out, '<td>5</td>');
  });
  test('引用与代码块', () => {
    const out = renderMarkdown('> 引用内容\n\n```ts\nconst a: number = 1;\n```\n');
    has(out, '<blockquote>引用内容</blockquote>');
    has(out, '<pre class="md-code lang-ts">');
    has(out, 'const a');
  });
  test('行内代码 / 删除线 / 链接 / 图片', () => {
    const out = renderMarkdown('安装 `npm i -g x` 即可, ~~旧文案~~ [文档](https://example.com) ![](https://example.com/a.png)');
    has(out, '<code>npm i -g x</code>');
    has(out, '<del>旧文案</del>');
    has(out, 'href="https://example.com"');
    has(out, '<img src="https://example.com/a.png"');
  });
});

describe('公式与安全', () => {
  test('行内 $..$ 与块级 $$..$$', () => {
    const out = renderMarkdown('勾股定理: $a^2 + b^2 = c^2$\n\n$$\n\\int_0^1 x \\, dx = \\frac{1}{2}\n$$\n');
    has(out, '<span class="math">');
    has(out, '<div class="math-block">');
  });
  test('脚本注入被整体转义', () => {
    const out = renderMarkdown('<script>alert(1)</script>\n\n[x](javascript:alert(1))');
    expect(out).not.toContain('<script>');
    has(out, '&lt;script&gt;');
    // javascript: 链接不生成 <a>, 按纯文本保留原文
    expect(out).not.toContain('<a href="javascript:');
    expect(out).toContain('[x](javascript:alert(1))');
  });
  test('空输入', () => {
    expect(renderMarkdown('')).toBe('');
    expect(renderMarkdown('   \n\n  ')).toBe('');
  });
});

describe('HTML 导出包装', () => {
  test('含完整文档骨架与内置样式', () => {
    const doc = wrapExportHtml('<p>hi</p>', '测试标题');
    has(doc, '<!DOCTYPE html>');
    has(doc, '<title>测试标题</title>');
    has(doc, '<style>');
    has(doc, '<p>hi</p>');
  });
  test('MD_EXPORT_CSS 常量非空且含关键选择器', () => {
    expect(MD_EXPORT_CSS.length).toBeGreaterThan(500);
    expect(MD_EXPORT_CSS).toContain('.md-preview table');
    expect(MD_EXPORT_CSS).toContain('.math-block');
  });
});
