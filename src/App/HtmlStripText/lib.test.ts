import { decodeEntities, htmlToPlainText } from './lib';

describe('实体解码', () => {
  test('常用命名实体', () => {
    expect(decodeEntities('&amp;&lt;&gt;&quot;&apos;')).toBe('&<>"\'');
    expect(decodeEntities('&copy; &reg; &nbsp;')).toBe('© ® \u00a0');
    expect(decodeEntities('&eacute; &mdash; &hellip;')).toBe('é — …');
  });
  test('数字实体', () => {
    expect(decodeEntities('&#x4F60;&#x597D;')).toBe('你好');
    expect(decodeEntities('&#20320;&#22909;')).toBe('你好');
    expect(decodeEntities('&#65;&#x42;')).toBe('AB');
  });
  test('未知实体保留原样, 可省略分号', () => {
    expect(decodeEntities('&foo; &unknown')).toBe('&foo; &unknown');
    expect(decodeEntities('&copy')).toBe('©');
  });
});

describe('HTML → 纯文本', () => {
  test('剥除行内标签', () => {
    expect(htmlToPlainText('<p>Hello <b>world</b> <i>!</i></p>')).toBe('Hello world !');
    expect(htmlToPlainText('a<span style="color:red">b</span>c')).toBe('abc');
  });

  test('块级标签产生换行 (段落间保留一个空行)', () => {
    expect(htmlToPlainText('<div>第一行</div><div>第二行</div>')).toBe('第一行\n\n第二行');
    expect(htmlToPlainText('<h1>标题</h1><p>正文</p>')).toBe('标题\n\n正文');
  });

  test('列表逐项换行', () => {
    expect(htmlToPlainText('<ul><li>甲</li><li>乙</li><li>丙</li></ul>')).toBe('甲\n乙\n丙');
  });

  test('<br> 换行', () => {
    expect(htmlToPlainText('a<br>b<br/>c')).toBe('a\nb\nc');
  });

  test('script/style/注释内容不出现', () => {
    const html = '<p>保留</p><script>var x = 1; alert("隐藏");</script><style>p{color:red}</style><!-- 注释 --><p>正文</p>';
    const out = htmlToPlainText(html);
    expect(out).toContain('保留');
    expect(out).toContain('正文');
    expect(out).not.toContain('var');
    expect(out).not.toContain('alert');
    expect(out).not.toContain('color');
    expect(out).not.toContain('注释');
  });

  test('保留换行结构 (多行源码)', () => {
    const html = [
      '<html><body>',
      '  <p>段落一</p>',
      '  <p>段落二</p>',
      '  <div>尾部</div>',
      '</body></html>',
    ].join('\n');
    expect(htmlToPlainText(html)).toBe('段落一\n\n段落二\n\n尾部');
  });

  test('select/option 提取为 value: 文本', () => {
    const html = '<select><option value="cn">中国</option><option value="us">美国</option><option value="jp">日本</option></select>';
    expect(htmlToPlainText(html)).toBe('cn: 中国\nus: 美国\njp: 日本');
  });

  test('option 无 value 属性时仅输出文本', () => {
    expect(htmlToPlainText('<select><option>红色</option><option>蓝色</option></select>')).toBe('红色\n蓝色');
  });

  test('option 未闭合 (隐式闭合) 也可解析', () => {
    const html = '<select><option value="a">甲<option value="b">乙</select>';
    expect(htmlToPlainText(html)).toBe('a: 甲\nb: 乙');
  });

  test('selectValue=false 时 select 仅输出选项文本', () => {
    const html = '<select><option value="cn">中国</option></select>';
    expect(htmlToPlainText(html, { selectValue: false })).toBe('中国');
  });

  test('option 文本内嵌标签被剥除', () => {
    const html = '<select><option value="x"><b>加粗</b>选项</option></select>';
    expect(htmlToPlainText(html)).toBe('x: 加粗选项');
  });

  test('完整中文样例', () => {
    const html = [
      '<!DOCTYPE html><html><head><title>示例</title><style>p{color:red}</style></head>',
      '<body>',
      '<h1>报告标题</h1>',
      '<p>第一段, 包含<b>加粗</b>与<a href="#">链接</a>文字。</p>',
      '<ul><li>列表项一</li><li>列表项二</li></ul>',
      '<div>选择你的国家: <select>',
      '<option value="cn">中国</option>',
      '<option value="us">美国</option>',
      '</select></div>',
      '<p>价格: &yen;99 &amp; 运费 &yen;5</p>',
      '<script>var a = 1;</script>',
      '</body></html>',
    ].join('\n');
    const out = htmlToPlainText(html);
    expect(out).toBe([
      '报告标题',
      '',
      '第一段, 包含加粗与链接文字。',
      '',
      '列表项一',
      '列表项二',
      '',
      '选择你的国家:',
      'cn: 中国',
      'us: 美国',
      '',
      '价格: ¥99 & 运费 ¥5',
    ].join('\n'));
  });

  test('textarea 内容保留, 实体解码', () => {
    expect(htmlToPlainText('<div>见下</div><textarea rows="2">第一行\n第二行 &amp; 更多</textarea>')).toContain('第一行');
    expect(htmlToPlainText('<textarea>a &lt; b</textarea>')).toContain('a < b');
  });

  test('空输入与纯文本原样', () => {
    expect(htmlToPlainText('')).toBe('');
    expect(htmlToPlainText('  纯文本  ')).toBe('纯文本');
    expect(htmlToPlainText('a&amp;b')).toBe('a&b');
  });

  test('img/自闭合等无文本标签不影响结果', () => {
    expect(htmlToPlainText('<p>图:<img src="x.png" alt="图释" /></p>')).toBe('图:');
  });
});
