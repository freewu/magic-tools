import {
  ConvertError, DEFAULT_INDENT, INDENT_LIST, detectInput, indentUnit,
  jsonToJsonl, jsonlToJson, stripBom,
} from './lib';

/** 取出抛出的 ConvertError (未抛出 / 类型不符时直接失败) */
const errOf = (fn: () => unknown): ConvertError => {
  try {
    fn();
  } catch (e) {
    if (e instanceof ConvertError) return e;
    throw e;
  }
  throw new Error('expected ConvertError');
};

describe('JSONL 转换 / 基础工具', () => {
  it('缩进选项与缩进字符串', () => {
    expect(INDENT_LIST.map((v) => v.value)).toEqual([ '2', '4', 'tab' ]);
    expect(DEFAULT_INDENT).toBe('2');
    expect(indentUnit('2')).toBe('  ');
    expect(indentUnit('4')).toBe('    ');
    expect(indentUnit('tab')).toBe('\t');
  });

  it('去除 UTF-8 BOM', () => {
    expect(stripBom('\uFEFF{"a":1}')).toBe('{"a":1}');
    expect(stripBom('{"a":1}')).toBe('{"a":1}');
    expect(stripBom('')).toBe('');
  });
});

describe('JSONL 转换 / JSON 数组 -> JSONL', () => {
  it('数组元素逐行输出为紧凑 JSON', () => {
    const r = jsonToJsonl('[{"id":1,"name":"a"},{"id":2,"name":"b"}]');
    expect(r.count).toBe(2);
    expect(r.single).toBeUndefined();
    expect(r.text).toBe('{"id":1,"name":"a"}\n{"id":2,"name":"b"}');
  });

  it('保留嵌套结构 / 原生类型 (含 null 与中文)', () => {
    const r = jsonToJsonl('[{ "a": [1, {"b": null}], "c": "中文" }]');
    expect(r.text).toBe('{"a":[1,{"b":null}],"c":"中文"}');
    expect(JSON.parse(r.text)).toEqual({ a: [ 1, { b: null } ], c: '中文' });
  });

  it('单个对象 (非数组) 输出一行并标记 single', () => {
    const r = jsonToJsonl('{\n  "id": 1\n}');
    expect(r).toMatchObject({ text: '{"id":1}', count: 1, single: true });
  });

  it('原始类型也可转换 (JSONL 允许任意 JSON 值)', () => {
    expect(jsonToJsonl('[1, "a", true, null]').text).toBe('1\n"a"\ntrue\nnull');
    expect(jsonToJsonl('123')).toMatchObject({ text: '123', count: 1, single: true });
  });

  it('兼容 BOM 与 CRLF', () => {
    expect(jsonToJsonl('\uFEFF[\r\n  1,\r\n  2\r\n]').text).toBe('1\n2');
  });

  it('空数组 / 空内容 / 非法 JSON 报对应错误码', () => {
    expect(errOf(() => jsonToJsonl('[]')).code).toBe('emptyArray');
    expect(errOf(() => jsonToJsonl('   ')).code).toBe('empty');
    expect(errOf(() => jsonToJsonl('\uFEFF')).code).toBe('empty');
    const bad = errOf(() => jsonToJsonl('[{oops}]'));
    expect(bad.code).toBe('jsonParse');
    expect(bad.detail).not.toBe('');
  });
});

describe('JSONL 转换 / JSONL -> JSON 数组', () => {
  it('逐行解析并按缩进格式化输出 (末尾带换行)', () => {
    const r = jsonlToJson('{"id":1}\n{"id":2}');
    expect(r.count).toBe(2);
    expect(r.text).toBe('[\n  {\n    "id": 1\n  },\n  {\n    "id": 2\n  }\n]\n');
    expect(JSON.parse(r.text)).toEqual([ { id: 1 }, { id: 2 } ]);
  });

  it('缩进可选 4 空格 / Tab', () => {
    expect(jsonlToJson('{"a":1}', { indent: '4' }).text).toBe('[\n    {\n        "a": 1\n    }\n]\n');
    expect(jsonlToJson('{"a":1}', { indent: 'tab' }).text).toBe('[\n\t{\n\t\t"a": 1\n\t}\n]\n');
    expect(jsonlToJson('1\n2', { indent: 'tab' }).text).toBe('[\n\t1,\n\t2\n]\n');
  });

  it('默认忽略空行 / 行尾空白; 关闭后空行报错并给出行号', () => {
    expect(jsonlToJson('{"a":1}\n\n  \n{"b":2}').count).toBe(2);
    const e = errOf(() => jsonlToJson('{"a":1}\n\n{"b":2}', { skipBlank: false }));
    expect(e.code).toBe('blankLine');
    expect(e.line).toBe(2);
  });

  it('兼容 CRLF 与 BOM', () => {
    expect(jsonlToJson('\uFEFF{"a":1}\r\n{"b":2}\r\n').count).toBe(2);
  });

  it('单行对象 / 原始类型 / 嵌套一行都算一条记录', () => {
    expect(jsonlToJson('{"a":1}').count).toBe(1);
    expect(jsonlToJson('[1,2]\n"x"').count).toBe(2); // 整段不是 JSON 数组 -> 逐行解析
    expect(jsonlToJson('null').text).toBe('[\n  null\n]\n');
  });

  it('非法行报行号; 整段是 JSON 数组时提示换方向', () => {
    const e = errOf(() => jsonlToJson('{"a":1}\n{"b":\n{"c":3}'));
    expect(e.code).toBe('lineParse');
    expect(e.line).toBe(2);
    expect(e.detail).not.toBe('');

    expect(errOf(() => jsonlToJson('[{"a":1},{"b":2}]')).code).toBe('jsonArrayInput');
    expect(errOf(() => jsonlToJson('[\n  {"a": 1}\n]')).code).toBe('jsonArrayInput');
  });

  it('空内容报错误码 empty', () => {
    expect(errOf(() => jsonlToJson('   ')).code).toBe('empty');
    expect(errOf(() => jsonlToJson('\n\n')).code).toBe('empty');
  });
});

describe('JSONL 转换 / 往返一致', () => {
  const src = '[{"id":1,"tags":["a","b"],"score":1.5},{"id":2,"tags":[],"score":null}]';

  it('JSON -> JSONL -> JSON 与原文数据一致', () => {
    const jsonl = jsonToJsonl(src);
    const back = jsonlToJson(jsonl.text);
    expect(JSON.parse(back.text)).toEqual(JSON.parse(src));
    expect(back.count).toBe(jsonl.count);
  });

  it('多行输入往返稳定 (第二次转换结果不变)', () => {
    const once = jsonlToJson(jsonToJsonl(src).text).text;
    const twice = jsonlToJson(jsonToJsonl(once).text).text;
    expect(twice).toBe(once);
  });
});

describe('JSONL 转换 / 输入识别', () => {
  it('空 / JSON 数组 / JSON 对象 / JSONL / 非法', () => {
    expect(detectInput('')).toEqual({ kind: 'empty', count: 0 });
    expect(detectInput('  \n ')).toEqual({ kind: 'empty', count: 0 });

    expect(detectInput('[1,2,3]')).toEqual({ kind: 'json', count: 3, array: true });
    expect(detectInput('[\n  {"a":1},\n  {"a":2}\n]')).toEqual({ kind: 'json', count: 2, array: true });
    expect(detectInput('{"a":1}')).toEqual({ kind: 'json', count: 1, array: false });

    expect(detectInput('{"a":1}\n{"a":2}')).toEqual({ kind: 'jsonl', count: 2 });
    expect(detectInput('\uFEFF{"a":1}\r\n\r\n1\r\n')).toEqual({ kind: 'jsonl', count: 2 });

    expect(detectInput('{"a":1}\n{bad}')).toEqual({ kind: 'invalid', count: 0 });
    expect(detectInput('hello')).toEqual({ kind: 'invalid', count: 0 });
  });
});
