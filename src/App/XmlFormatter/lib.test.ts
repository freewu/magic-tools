import { XML_ACCEPT, formatXml, minifyXml, getXmlIndent, setXmlIndent, xmlFileNameOf, xmlTree } from './lib';

const MINI = '<?xml version="1.0" encoding="UTF-8"?><config><app name="demo"><version>2.6.0</version><debug>false</debug><servers><server host="a.example.com" port="8080"/><server host="b.example.com" port="9090"/></servers></app></config>';

describe('XML 格式化', () => {
  test('嵌套缩进输出 (含声明)', () => {
    const out = formatXml(MINI);
    expect(out).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(out).toContain('\n<config>');
    expect(out).toContain('\n  <app name="demo">');
    expect(out).toContain('\n    <version>2.6.0</version>');
    expect(out).toContain('\n      <server host="a.example.com" port="8080"/>');
    expect(out).toContain('\n  </app>');
    expect(out).not.toContain('\n\n\n');
  });
  test('4 空格缩进', () => {
    const out = formatXml('<r><a>1</a></r>', { indentSize: 4 });
    expect(out).toContain('\n    <a>1</a>');
  });
  test('原样保留注释 / CDATA / PI, 纯空白行不输出', () => {
    const out = formatXml('<?xml version="1.0"?>\n<r>\n  <!-- hi -->\n  <a>\n    <![CDATA[\nconst x = 1;\nif (a > b) {}\n]]>\n  </a>\n</r>');
    expect(out).toContain('<!-- hi -->');
    expect(out).toContain('<![CDATA[');
    expect(out).toContain('if (a > b) {}');
  });
  test('已格式化文本再格式化保持结构稳定', () => {
    const once = formatXml(MINI);
    expect(formatXml(once)).toBe(once);
  });
  test('空与纯空白输入返回空串', () => {
    expect(formatXml('')).toBe('');
    expect(formatXml('   \n  ')).toBe('');
  });
  test('非法 XML 抛出带行号错误', () => {
    expect(() => formatXml('<a><b></a>')).toThrow(/交叉嵌套/);
    expect(() => formatXml('<a><b></b>')).toThrow(/未闭合/);
    expect(() => formatXml('</a>')).toThrow(/多余/);
    expect(() => formatXml('<a>')).toThrow(/未闭合/);
  });
  test('压缩: 去掉标签间空白, 保留文本', () => {
    const out = minifyXml('<root>\n  <a> 1 </a>\n  <b> x &gt; y </b>\n</root>');
    expect(out).toBe('<root><a>1</a><b>x &gt; y</b></root>');
  });
  test('缩进设置持久化', () => {
    localStorage.clear();
    expect(getXmlIndent()).toBe(2);
    setXmlIndent(4);
    expect(getXmlIndent()).toBe(4);
    localStorage.setItem('xml-format.indent-size', 'abc');
    expect(getXmlIndent()).toBe(2);
  });
});

describe('XML 打开 / 保存文件名', () => {
  test('打开过的文件沿用原名与后缀 (含 XML 方言)', () => {
    expect(xmlFileNameOf('config.xml')).toBe('config.xml');
    expect(xmlFileNameOf('布局.XML')).toBe('布局.XML');
    expect(xmlFileNameOf('icon.svg')).toBe('icon.svg');
    expect(xmlFileNameOf('Info.plist')).toBe('Info.plist');
    expect(xmlFileNameOf('C:\\docs\\conf/config.xaml')).toBe('config.xaml');
  });

  test('其它后缀换成 .xml, 空名字回退 formatted.xml', () => {
    expect(xmlFileNameOf('data.txt')).toBe('data.xml');
    expect(xmlFileNameOf('no-ext')).toBe('no-ext.xml');
    expect(xmlFileNameOf('')).toBe('formatted.xml');
    expect(xmlFileNameOf('   ')).toBe('formatted.xml');
    expect(xmlFileNameOf('a/b/')).toBe('formatted.xml');
  });

  test('XML_ACCEPT 覆盖常见方言与纯文本', () => {
    for (const ext of [ '.xml', '.xaml', '.svg', '.plist', '.xsd', '.txt' ]) expect(XML_ACCEPT).toContain(ext);
    expect(XML_ACCEPT).toContain('text/xml');
  });
});

describe('XML 结构树 (树状折叠)', () => {
  test('元素 / 文本 / 注释分层, 元素标题保留开标签, 空白文本不建节点', () => {
    const { items, truncated } = xmlTree('<a x="1">\n  <b>文字</b>\n  <!-- 注释 -->\n  <c/>\n</a>');
    expect(truncated).toBe(false);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('<a x="1">');
    expect(items[0].kind).toBe('element');
    expect(items[0].selfClose).toBeUndefined();

    const kids = items[0].children ?? [];
    expect(kids.map((k) => [ k.kind, k.title ])).toEqual([
      [ 'element', '<b>' ],
      [ 'raw', '<!-- 注释 -->' ],
      [ 'element', '<c/>' ],
    ]);
    expect(kids[0].children).toEqual([{ key: 'n3', kind: 'text', title: '文字' }]);
    // 自闭合元素不挂 children
    expect('children' in kids[2]).toBe(false);
    expect(kids[2].selfClose).toBe(true);
  });

  test('多行文本折叠成单行, 过长的标题裁剪', () => {
    const { items } = xmlTree(`<a>\n  第一行\n  第二行\n  ${'x'.repeat(100)}\n</a>`);
    const text = (items[0].children ?? [])[0];
    expect(text.kind).toBe('text');
    expect(text.title).not.toContain('\n');
    expect(text.title.endsWith('…')).toBe(true);
  });

  test('声明 / DOCTYPE / CDATA 作为原样节点; 非法 XML 抛出错误', () => {
    const { items } = xmlTree('<?xml version="1.0"?><!DOCTYPE a><a><![CDATA[<b>原样</b>]]></a>');
    expect(items.map((i) => i.kind)).toEqual([ 'raw', 'raw', 'element' ]);
    expect(items[0].title).toBe('<?xml version="1.0"?>');
    expect((items[2].children ?? [])[0].title).toContain('CDATA');

    expect(() => xmlTree('<a><b></a>')).toThrow();
  });

  test('节点顺序渐进编号, 每个节点都有唯一 key', () => {
    const { items } = xmlTree('<a><b/><c><d/></c></a>');
    const flat: string[] = [];
    const walk = (list: typeof items) => list.forEach((i) => { flat.push(i.key); walk(i.children ?? []); });
    walk(items);
    expect(flat).toEqual([ 'n1', 'n2', 'n3', 'n4' ]);
    expect(new Set(flat).size).toBe(flat.length);
  });
});
