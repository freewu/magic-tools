import { jsonPretty, jsonCompact, jsonToTree } from './lib';
import type { JsonTreeNode } from './lib';

describe('JSON 格式化', () => {
  it('格式化: 2 空格缩进输出', () => {
    const src = '{"name":"magic","tags":["a","b"],"count":3,"ok":true,"none":null}';
    expect(jsonPretty(src)).toBe(
      [
        '{',
        '  "name": "magic",',
        '  "tags": [',
        '    "a",',
        '    "b"',
        '  ],',
        '  "count": 3,',
        '  "ok": true,',
        '  "none": null',
        '}',
      ].join('\n'),
    );
  });

  it('压缩为一行', () => {
    const pretty = '{\n  "a": 1,\n  "b": [1, 2]\n}';
    expect(jsonCompact(pretty)).toBe('{"a":1,"b":[1,2]}');
  });

  it('中文与转义字符保留', () => {
    const src = '{"名字":"工具","esc":"a\\"b"}';
    expect(jsonPretty(src)).toBe('{\n  "名字": "工具",\n  "esc": "a\\"b"\n}');
    expect(jsonCompact('{ "n" : "中文" }')).toBe('{"n":"中文"}');
  });

  it('顶层数组与基本值也可处理', () => {
    expect(jsonPretty('[1,2,{"k":null}]')).toBe('[\n  1,\n  2,\n  {\n    "k": null\n  }\n]');
    expect(jsonPretty('"hello"')).toBe('"hello"');
  });

  it('非法 JSON 抛错', () => {
    expect(() => jsonPretty('{a:1}')).toThrow();
    expect(() => jsonPretty('')).toThrow();
    expect(() => jsonCompact('{"a":1,}')).toThrow();
  });
});

describe('JSON 树结构', () => {
  it('对象键与数组下标生成子节点', () => {
    const tree = jsonToTree('{"a":1,"list":["x","y"]}');
    expect(tree.meta).toBe('obj');
    expect(tree.size).toBe(2);
    const [a, list] = tree.children;
    expect(a.label).toBe('a');
    expect(a.meta).toBe('val');
    expect(a.text).toBe('1');
    expect(list.label).toBe('list');
    expect(list.meta).toBe('arr');
    expect(list.size).toBe(2);
    expect(list.children.map((c) => c.label)).toEqual(['0', '1']);
    expect(list.children[0].text).toBe('"x"');
  });

  it('嵌套对象多层展开, key 唯一', () => {
    const tree = jsonToTree('{"a":{"b":{"c":1}},"a.b":2}');
    const keys = new Set<string>();
    const walk = (n: JsonTreeNode) => {
      if (keys.has(n.key)) throw new Error('key 重复: ' + n.key);
      keys.add(n.key);
      n.children.forEach(walk);
    };
    walk(tree);
    const ab = tree.children[0];
    expect(ab.children[0].children[0].label).toBe('c');
    expect(ab.children[0].children[0].text).toBe('1');
  });

  it('叶子类型: null/bool/数字/字符串', () => {
    const tree = jsonToTree('{"n":null,"b":false,"i":-1.5,"s":"v"}');
    const texts = tree.children.map((c) => `${c.text}`);
    expect(texts).toEqual(['null', 'false', '-1.5', '"v"']);
  });

  it('空对象/数组', () => {
    const tree = jsonToTree('{"o":{},"arr":[]}');
    expect(tree.children[0].size).toBe(0);
    expect(tree.children[1].size).toBe(0);
  });
});
