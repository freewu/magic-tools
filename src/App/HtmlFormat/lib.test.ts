import { HTML_ACCEPT, formatHtml, getHtmlIndent, htmlFileNameOf, setHtmlIndent } from './lib';

describe('HTML 格式化 - 基础结构', () => {
  test('嵌套 div 缩进', () => {
    expect(formatHtml('<div><div><div>text</div></div></div>'))
      .toBe('<div>\n  <div>\n    <div>text</div>\n  </div>\n</div>\n');
  });
  test('纯 inline 内容保持一行', () => {
    expect(formatHtml('<p>hello <b>world</b></p>'))
      .toBe('<p>hello <b>world</b></p>\n');
  });
  test('多行输入空白折叠', () => {
    expect(formatHtml('<div>  a\n   b  </div>')).toBe('<div>a b</div>\n');
  });
  test('ul/li 列表', () => {
    expect(formatHtml('<ul><li>一</li><li>二<b>三</b></li></ul>'))
      .toBe('<ul>\n  <li>一</li>\n  <li>二<b>三</b></li>\n</ul>\n');
  });
  test('块级之间的行内文本单独成行', () => {
    expect(formatHtml('<body>前言<div>x</div>后记</body>'))
      .toBe('<body>\n  前言\n  <div>x</div>\n  后记\n</body>\n');
  });
});

describe('HTML 格式化 - 特殊元素', () => {
  test('script 内容原样保留', () => {
    expect(formatHtml('<script>if (a < b && c > d) { x = a<b; }</script>'))
      .toBe('<script>if (a < b && c > d) { x = a<b; }</script>\n');
  });
  test('pre 内容保留换行', () => {
    const pre = '<pre>line1\n  line2</pre>';
    expect(formatHtml(`<div>${pre}</div>`)).toBe(`<div>\n  ${pre}\n</div>\n`);
  });
  test('注释与 DOCTYPE 原样', () => {
    expect(formatHtml('<!DOCTYPE html><html><!-- hi --></html>'))
      .toBe('<!DOCTYPE html>\n<html>\n  <!-- hi -->\n</html>\n');
  });
});

describe('HTML 格式化 - 属性与标签', () => {
  test('属性原文保留', () => {
    expect(formatHtml('<input type="text" data-x=\'a > b\' disabled>'))
      .toBe('<input type="text" data-x=\'a > b\' disabled>\n');
  });
  test('自闭合标签', () => {
    expect(formatHtml('<img src="a.png"/>')).toBe('<img src="a.png"/>\n');
  });
  test('head 内 meta/title 各自成行', () => {
    expect(formatHtml('<head><meta charset="utf-8"><title>标题</title></head>'))
      .toBe('<head>\n  <meta charset="utf-8">\n  <title>标题</title>\n</head>\n');
  });
  test('大小写标签保留', () => {
    expect(formatHtml('<Div><P>x</P></Div>')).toBe('<Div>\n  <P>x</P>\n</Div>\n');
  });
});

describe('HTML 格式化 - 缩进与幂等', () => {
  test('4 空格缩进', () => {
    expect(formatHtml('<div><div>a</div></div>', { indentSize: 4 }))
      .toBe('<div>\n    <div>a</div>\n</div>\n');
  });
  test('缩进越界被钳制', () => {
    expect(formatHtml('<div><div>a</div></div>', { indentSize: 99 }))
      .toBe('<div>\n        <div>a</div>\n</div>\n'); // 最大 8
  });
  test('幂等: 二次格式化结果不变', () => {
    const src = '<html><body><div class="a"><p>Hello <span>world</span>!</p></div><ul><li>1</li></ul></body></html>';
    const once = formatHtml(src);
    expect(formatHtml(once)).toBe(once);
  });
  test('空输入', () => {
    expect(formatHtml('')).toBe('');
    expect(formatHtml('   \n  ')).toBe('');
  });
});

describe('HTML 打开 / 保存文件名', () => {
  test('打开过的文件沿用原名与后缀 (.html / .htm)', () => {
    expect(htmlFileNameOf('page.html')).toBe('page.html');
    expect(htmlFileNameOf('页面.HTML')).toBe('页面.HTML');
    expect(htmlFileNameOf('index.htm')).toBe('index.htm');
    expect(htmlFileNameOf('doc.xhtml')).toBe('doc.xhtml');
    expect(htmlFileNameOf('C:\\docs\\site/index.html')).toBe('index.html');
  });

  test('其它后缀换成 .html, 空名字回退 formatted.html', () => {
    expect(htmlFileNameOf('note.txt')).toBe('note.html');
    expect(htmlFileNameOf('no-ext')).toBe('no-ext.html');
    expect(htmlFileNameOf('')).toBe('formatted.html');
    expect(htmlFileNameOf('   ')).toBe('formatted.html');
    expect(htmlFileNameOf('a/b/')).toBe('formatted.html');
  });

  test('HTML_ACCEPT 覆盖 .html / .htm / 纯文本', () => {
    for (const ext of [ '.html', '.htm', '.xhtml', '.txt' ]) expect(HTML_ACCEPT).toContain(ext);
    expect(HTML_ACCEPT).toContain('text/html');
  });
});

describe('HTML 缩进设置', () => {
  test('默认 2 空格, 可以改成 4 空格并持久化', () => {
    localStorage.clear();
    expect(getHtmlIndent()).toBe(2);
    setHtmlIndent(4);
    expect(getHtmlIndent()).toBe(4);
  });
});
