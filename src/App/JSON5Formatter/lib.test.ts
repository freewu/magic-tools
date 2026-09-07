import { j5Parse, j5Pretty, j5Compact, j5ParseValue } from './lib';

describe('JSON5 解析 (超集语法)', () => {
  it('无引号键 + 尾逗号', () => {
    expect(j5Parse('{a: 1, b: 2,}')).toEqual({ a: 1, b: 2 });
  });

  it('单引号字符串', () => {
    expect(j5Parse("{name: 'hello'}")).toEqual({ name: 'hello' });
  });

  it('行注释与块注释被忽略', () => {
    const v = j5Parse('{\n  // 这是注释\n  a: 1, /* 块注释 */ b: 2\n}');
    expect(v).toEqual({ a: 1, b: 2 });
  });

  it('十六进制/正号等 JSON5 数字', () => {
    expect(j5Parse('{hex: 0xFF, p: +1.5}')).toEqual({ hex: 255, p: 1.5 });
  });

  it('顶层数组 (允许尾逗号)', () => {
    expect(j5Parse('[1, "a",]')).toEqual([1, 'a']);
  });

  it('嵌套结构', () => {
    const v = j5Parse('{list:[{x:1},{x:2}], s: "v"}');
    expect(v).toEqual({ list: [{ x: 1 }, { x: 2 }], s: 'v' });
  });

  it('合法标准 JSON 也是合法 JSON5', () => {
    expect(j5Parse('{"a": 1, "b": [true, null]}')).toEqual({ a: 1, b: [true, null] });
  });

  it('语法错误抛出', () => {
    expect(() => j5Parse('{a: }')).toThrow();
    expect(() => j5Parse('not json5')).toThrow();
  });
});

describe('JSON5 格式化/压缩', () => {
  it('pretty: 缩进 + 尾逗号的多行输出', () => {
    const out = j5Pretty('{a:1,b:[1,2]}');
    expect(out).toContain('\n');
    expect(out).toContain('  a: 1,');
    expect(j5Parse(out)).toEqual({ a: 1, b: [1, 2] }); // 可回读
  });

  it('compact: 单行无尾逗号', () => {
    const out = j5Compact('{a: 1, b: [1, 2,],}');
    expect(out).not.toContain('\n');
    expect(out).not.toMatch(/,\s*$/);
    expect(j5Parse(out)).toEqual({ a: 1, b: [1, 2] });
  });

  it('注释在格式化时被剥离 (值保留)', () => {
    const out = j5Pretty('// header\n{a: /*x*/ 1}');
    expect(out).not.toContain('header');
    expect(j5Parse(out)).toEqual({ a: 1 });
  });

  it('字符串转义输出为双引号 JSON5', () => {
    const out = j5Pretty("{s: 'it\\'s'}");
    expect(j5Parse(out).s).toBe("it's");
  });
});

describe('j5ParseValue 供树面板', () => {
  it('返回解析后的原始值', () => {
    expect(j5ParseValue('{x: [1, 2]}')).toEqual({ x: [1, 2] });
  });
});
