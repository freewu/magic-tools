import { xml2json, json2xml, guessFormat, yaml2json, json2yaml, ini2json, json2ini } from './lib';

describe('xml2json 解析', () => {
  it('简单嵌套', () => {
    expect(xml2json('<a><b>1</b></a>')).toEqual({ a: { b: '1' } });
  });

  it('属性 -> @_ 前缀, 文本 -> #text', () => {
    expect(xml2json('<r><a id="1">x</a></r>')).toEqual({ r: { a: { '#text': 'x', '@_id': '1' } } });
  });

  it('重复子元素自动成数组', () => {
    expect(xml2json('<r><i>1</i><i>2</i></r>')).toEqual({ r: { i: [ '1', '2' ] } });
  });

  it('注释被忽略, 换行空白不影响结构', () => {
    const xml = '<a>\n  <!-- 注释 -->\n  <b>1</b>\n  <!-- 跨\n行 -->\n</a>';
    expect(xml2json(xml)).toEqual({ a: { b: '1' } });
  });

  it('自闭合空元素 -> 空字符串', () => {
    expect(xml2json('<r><e/></r>')).toEqual({ r: { e: '' } });
  });

  it('数字保持字符串 (配置值语义)', () => {
    expect(xml2json('<c><port>8080</port><ratio>0.5</ratio></c>')).toEqual({ c: { port: '8080', ratio: '0.5' } });
  });

  it('空/纯注释输入 -> {}', () => {
    expect(xml2json('')).toEqual({});
    expect(xml2json('  <!-- only -->  ')).toEqual({});
  });
});

describe('json2xml 序列化', () => {
  it('单键对象生成单根 XML', () => {
    const out = json2xml({ a: { b: '1' } });
    expect(out).toContain('<a>');
    expect(out).toContain('<b>1</b>');
    expect(out).toContain('</a>');
  });

  it('属性对象 -> 属性 + 文本', () => {
    const out = json2xml({ r: { a: { '@_id': '1', '#text': 'x' } } });
    expect(out).toContain('<a id="1">x</a>');
  });

  it('数组 -> 重复元素', () => {
    const out = json2xml({ r: { i: [ '1', '2' ] } });
    expect(out).toContain('<i>1</i>');
    expect(out).toContain('<i>2</i>');
  });

  it('多键对象自动包一层 <root> (XML 单根约束)', () => {
    const out = json2xml({ a: '1', b: '2' });
    expect(out).toContain('<root>');
    expect(out).toContain('<a>1</a>');
    expect(out).toContain('<b>2</b>');
    expect(out).toContain('</root>');
  });

  it('数组根也包 <root>', () => {
    const out = json2xml([ { a: '1' }, { a: '2' } ]);
    expect(out).toContain('<root>');
    expect(out).toContain('<a>1</a>');
    expect(out).toContain('<a>2</a>');
  });

  it('空字符串值 -> 自闭合', () => {
    expect(json2xml({ r: { e: '' } })).toContain('<e/>');
  });

  it('特殊字符自动转义', () => {
    expect(json2xml({ r: { a: '&<>' } })).toContain('&amp;&lt;&gt;');
  });
});

describe('xml 与其它格式互通', () => {
  it('yaml -> json -> xml 链路', () => {
    const obj = yaml2json('server:\n  host: 127.0.0.1\n  port: 8080\n');
    const xml = json2xml(obj);
    expect(xml).toContain('<server>');
    expect(xml).toContain('<port>8080</port>');
    // xml 再回读
    expect(xml2json(xml)).toEqual({ server: { host: '127.0.0.1', port: '8080' } });
  });

  it('ini -> json -> xml 链路', () => {
    const obj = ini2json('[db]\nhost=localhost\nport=3306\n');
    const xml = json2xml(obj);
    expect(xml).toContain('<db>');
    // 数字经 XML 文本往返会变字符串 (配置值语义)
    expect(xml2json(xml)).toEqual({ db: { host: 'localhost', port: '3306' } });
  });
});

describe('guessFormat 扩展名识别', () => {
  it('常见配置扩展名', () => {
    expect(guessFormat('a.xml')).toBe('xml');
    expect(guessFormat('a.ini')).toBe('ini');
    expect(guessFormat('a.conf')).toBe('ini');
    expect(guessFormat('a.json')).toBe('json');
    expect(guessFormat('a.json5')).toBe('json');
    expect(guessFormat('a.yaml')).toBe('yaml');
    expect(guessFormat('a.yml')).toBe('yaml');
    expect(guessFormat('a.toml')).toBe('toml');
    expect(guessFormat('a.properties')).toBe('properties');
    expect(guessFormat('a.props')).toBe('properties');
  });

  it('未知/无扩展名 -> null', () => {
    expect(guessFormat('a.txt')).toBeNull();
    expect(guessFormat('noext')).toBeNull();
    expect(guessFormat('')).toBeNull();
  });
});
