import {
  clampCount, getDefaultCount, setDefaultCount,
  getDefaultFormat, setDefaultFormat,
  getDefaultTable, setDefaultTable, normalizeTable,
  parseKey, splitArgs, resolvePlaceholders, genValue, generateRows,
  parseTemplate, toCsv, toSql, sqlValue, sqlTypeOf, generateOutput,
  type GenCtx,
} from './lib';
import { COUNT_MAX, DEFAULT_COUNT, DEFAULT_TABLE } from './data';

const ctxOf = (): GenCtx => ({ inc: new Map<string, number>() });

describe('数据生成 / 键规则解析', () => {
  it('无规则 / 数量 / 范围 / 自增 / 小数位', () => {
    expect(parseKey('name')).toEqual({ name: 'name' });
    expect(parseKey('list|3')).toMatchObject({ name: 'list', min: 3, max: 3 });
    expect(parseKey('list|1-10')).toMatchObject({ name: 'list', min: 1, max: 10 });
    expect(parseKey('id|+2')).toMatchObject({ name: 'id', plus: 2 });
    expect(parseKey('score|60-100.1-2')).toMatchObject({ name: 'score', min: 60, max: 100, dmin: 1, dmax: 2 });
    expect(parseKey('x|')).toEqual({ name: 'x' });
    expect(parseKey('a|b')).toEqual({ name: 'a' });
  });

  it('参数切分: 忽略引号与括号内的逗号', () => {
    expect(splitArgs("'a,b', 1, [2,3]")).toEqual(["'a,b'", '1', '[2,3]']);
    expect(splitArgs('1,2')).toEqual(['1', '2']);
  });
});

describe('数据生成 / @占位符', () => {
  it('整数区间: 整串占位符返回原生 number', () => {
    const ctx = ctxOf();
    for (let i = 0; i < 200; i++) {
      const v = resolvePlaceholders('@integer(1,3)', ctx);
      expect(typeof v).toBe('number');
      expect(v as number).toBeGreaterThanOrEqual(1);
      expect(v as number).toBeLessThanOrEqual(3);
    }
  });

  it('混合文本: 占位符结果拼接进字符串', () => {
    const ctx = ctxOf();
    expect(resolvePlaceholders('x-@upper(abc)-y', ctx)).toBe('x-ABC-y');
    const s = resolvePlaceholders('编号: @string(6)', ctx) as string;
    expect(s).toMatch(/^编号: [A-Za-z0-9]{6}$/);
  });

  it('转义与未知占位符', () => {
    const ctx = ctxOf();
    expect(resolvePlaceholders('\\@word', ctx)).toBe('@word');
    expect(resolvePlaceholders('@no_such_placeholder', ctx)).toBe('@no_such_placeholder');
  });

  it('姓名 / 邮箱 / 日期 / 身份证', () => {
    const ctx = ctxOf();
    expect(resolvePlaceholders('@cname', ctx)).toMatch(/^[\u4e00-\u9fa5]{2,4}$/);
    expect(resolvePlaceholders('@email', ctx)).toMatch(/^[a-z]+\d+@[a-z]+\.[a-z]+$/);
    expect(resolvePlaceholders('@date', ctx)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(resolvePlaceholders('@datetime', ctx)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    const id = resolvePlaceholders('@id', ctx) as string;
    expect(id).toHaveLength(18);
    // 校验位验证 (GB 11643-1999)
    const w = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    let sum = 0;
    for (let i = 0; i < 17; i++) sum += Number(id[i]) * w[i];
    expect(id[17]).toBe('10X98765432'[sum % 11]);
  });

  it('pick / range / province 校验', () => {
    const ctx = ctxOf();
    expect(resolvePlaceholders("@pick(['a','b'])", ctx)).toMatch(/^[ab]$/);
    expect(resolvePlaceholders('@range(1,4)', ctx)).toEqual([1, 2, 3]);
    expect(resolvePlaceholders('@province', ctx)).toMatch(/省|市|自治区|特别行政区/);
  });
});

describe('数据生成 / 规则生成', () => {
  it('数字范围与小数位', () => {
    const ctx = ctxOf();
    for (let i = 0; i < 100; i++) {
      const n = genValue(1, 'age|18-60', '#', ctx) as number;
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(18);
      expect(n).toBeLessThanOrEqual(60);
    }
    const f = genValue(1, 'score|60-100.1-2', '#', ctx) as number;
    expect(f).toBeGreaterThanOrEqual(60);
    expect(f).toBeLessThanOrEqual(101);
    expect(String(f).split('.')[1].length).toBeGreaterThanOrEqual(1);
  });

  it('|+step 自增 (跨记录连续)', () => {
    const tpl = { 'id|+1': 1 };
    const rows = generateRows(tpl, 5);
    expect(rows.map((r) => r.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it('字符串规则 = 重复次数', () => {
    const ctx = ctxOf();
    expect(genValue('ab', 's|3', '#', ctx)).toBe('ababab');
    const one = genValue('x', 's|1-4', '#', ctx) as string;
    expect(one.length).toBeGreaterThanOrEqual(1);
    expect(one.length).toBeLessThanOrEqual(4);
  });

  it('数组规则: count 生成 N 个元素, |1 多元素随机取一个', () => {
    const ctx = ctxOf();
    const arr = genValue([{ 'name': '@cname' }], 'list|3', '#', ctx) as unknown[];
    expect(arr).toHaveLength(3);
    expect(arr[0]).toHaveProperty('name');
    const one = genValue(['a', 'b', 'c'], 'x|1', '#', ctx) as string;
    expect(['a', 'b', 'c']).toContain(one);
  });

  it('对象规则: 选取 N 个属性', () => {
    const ctx = ctxOf();
    const o = genValue({ a: 1, b: 2, c: 3 }, 'obj|2', '#', ctx) as Record<string, number>;
    expect(Object.keys(o)).toHaveLength(2);
  });

  it('布尔规则: |1 约一半为 true', () => {
    const ctx = ctxOf();
    let t = 0;
    for (let i = 0; i < 400; i++) if (genValue(true, 'b|1', '#', ctx) === true) t++;
    expect(t).toBeGreaterThan(100);
    expect(t).toBeLessThan(300);
  });

  it('生成数量钳制 (0 -> 1, 超限 -> 1000)', () => {
    expect(generateRows({ a: 1 }, 0)).toHaveLength(1);
    expect(generateRows({ a: 1 }, COUNT_MAX + 500)).toHaveLength(COUNT_MAX);
    expect(generateRows({ a: 1 }, 7)).toHaveLength(7);
  });
});

describe('数据生成 / 模板解析', () => {
  it('JSON5 容错: 单引号 / 注释 / 尾逗号', () => {
    const r = parseTemplate(`{
      // 注释
      'a|1-2': 1,
    }`);
    expect(r.ok).toBe(true);
  });

  it('根节点必须是对象', () => {
    expect(parseTemplate('[1,2]')).toMatchObject({ ok: false, code: 'root' });
    expect(parseTemplate('{ bad json')).toMatchObject({ ok: false, code: 'parse' });
  });

  it('便捷写法: 单个 list 字段自动取其元素模板', () => {
    const r = parseTemplate(`{ 'list|5-10': [{ 'id|+1': 1, 'name': '@cname' }] }`);
    expect(r.ok).toBe(true);
    if (r.ok) expect(Object.keys(r.tpl).sort()).toEqual(['id|+1', 'name']);
  });
});

describe('数据生成 / 序列化', () => {
  const rows = [
    { id: 1, name: 'a,b', note: 'he said "hi"', tags: ['x', 'y'] },
    { id: 2, name: 'c', note: 'line\nbreak', tags: [] },
  ];

  it('CSV: 转义引号/逗号/换行, 可关闭表头', () => {
    const csv = toCsv(rows);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('id,name,note,tags');
    expect(csv).toContain('"a,b"');
    expect(csv).toContain('"he said ""hi"""');
    expect(csv).toContain('"line\nbreak"');
    expect(toCsv(rows, false).split('\n')[0]).toBe('1,"a,b","he said ""hi""","[""x"",""y""]"');
  });

  it('SQL: 值转义 / 布尔与 null / 表名规整', () => {
    expect(sqlValue("O'Brien")).toBe("'O''Brien'");
    expect(sqlValue(true)).toBe('1');
    expect(sqlValue(null)).toBe('NULL');
    expect(sqlValue(1.5)).toBe('1.5');
    expect(normalizeTable('my table;drop')).toBe('my_table_drop');
    expect(normalizeTable('1abc')).toBe('_1abc');
    expect(normalizeTable('  ')).toBe(DEFAULT_TABLE);
  });

  it('SQL: INSERT 与可选建表语句', () => {
    const sql = toSql(rows, 't_user', true);
    expect(sql).toContain('CREATE TABLE `t_user`');
    expect(sql).toContain('`id` INT');
    expect(sql).toContain('`name` VARCHAR(255)');
    expect(sql).toContain('INSERT INTO `t_user` (`id`, `name`, `note`, `tags`) VALUES (1, \'a,b\',');
    expect(toSql(rows, 't_user', false)).not.toContain('CREATE TABLE');
    expect(sqlTypeOf(12)).toBe('INT');
    expect(sqlTypeOf(1.2)).toBe('DOUBLE');
    expect(sqlTypeOf('2024-01-01 10:00:00')).toBe('DATETIME');
  });
});

describe('数据生成 / 设置读写', () => {
  afterEach(() => localStorage.clear());

  it('默认值: json / mock_data / 100', () => {
    expect(getDefaultFormat()).toBe('json');
    expect(getDefaultTable()).toBe(DEFAULT_TABLE);
    expect(DEFAULT_COUNT).toBe(100);
    expect(getDefaultCount()).toBe(100);
  });

  it('往返一致 + 计数钳制', () => {
    setDefaultFormat('sql');
    setDefaultTable('my table');
    setDefaultCount(500);
    expect(getDefaultFormat()).toBe('sql');
    expect(getDefaultTable()).toBe('my_table');
    expect(getDefaultCount()).toBe(500);
    setDefaultCount(99999);
    expect(getDefaultCount()).toBe(COUNT_MAX);
    setDefaultCount(0);
    expect(getDefaultCount()).toBe(1);
  });

  it('非法值回退默认', () => {
    localStorage.setItem('mock-data.format', 'xml');
    localStorage.setItem('mock-data.count', 'abc');
    expect(getDefaultFormat()).toBe('json');
    expect(getDefaultCount()).toBe(DEFAULT_COUNT);
    expect(clampCount(NaN)).toBe(DEFAULT_COUNT);
  });
});

describe('数据生成 / 完整输出', () => {
  const tpl = `{ 'id|+1': 1, 'name': '@cname', 'age|18-60': 1 }`;

  it('JSON: 条数正确且可解析', () => {
    const r = generateOutput(tpl, { format: 'json', count: 5 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const arr = JSON.parse(r.text) as { id: number }[];
    expect(arr).toHaveLength(5);
    expect(arr.map((v) => v.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it('CSV / SQL 输出', () => {
    const csv = generateOutput(tpl, { format: 'csv', count: 3 });
    expect(csv.ok && csv.text.split('\n')).toHaveLength(4);
    const sql = generateOutput(tpl, { format: 'sql', count: 2, tableName: 'demo', createTable: true });
    expect(sql.ok && sql.text).toContain('INSERT INTO `demo`');
    expect(sql.ok && sql.text).toContain('CREATE TABLE `demo`');
  });

  it('模板错误返回错误码', () => {
    const bad = generateOutput('{oops', { format: 'json', count: 1 });
    expect(bad).toMatchObject({ ok: false, code: 'parse' });
    const root = generateOutput('[1]', { format: 'json', count: 1 });
    expect(root).toMatchObject({ ok: false, code: 'root' });
  });
});
