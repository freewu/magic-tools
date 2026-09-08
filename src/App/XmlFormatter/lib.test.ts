import { formatXml, minifyXml, getXmlIndent, setXmlIndent } from './lib';

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
