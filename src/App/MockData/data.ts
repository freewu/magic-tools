// 数据生成: 依据 Mock.js 语法模板批量生成 JSON / JSONL / CSV / SQL 数据
// - 模板语法 (兼容 Mock.js 的常用部分):
//   '字段名|规则': 值    规则支持  min-max / count / +step / min-max.dmin-dmax
//   值中的 '@占位符'     e.g. '@cname' / '@integer(1,100)' / '@date("yyyy-MM-dd")'
// - 不支持: 函数值 / 正则值 (模板以 JSON5 解析, 无法表达函数与正则)

/** 输出格式 (ext: 下载文件的扩展名) */
export const FORMAT_LIST = [
  { value: 'json', label: 'JSON', ext: 'json' },
  { value: 'jsonl', label: 'JSONL', ext: 'jsonl' },
  { value: 'csv', label: 'CSV', ext: 'csv' },
  { value: 'sql', label: 'SQL', ext: 'sql' },
] as const;

export type MockFormat = typeof FORMAT_LIST[number]['value'];

/** 生成数量范围 (用户要求: 默认 100, 不超过 1000) */
export const COUNT_MIN = 1;
export const COUNT_MAX = 1000;
export const DEFAULT_COUNT = 100;

/** 默认表名 (SQL 输出) */
export const DEFAULT_TABLE = 'mock_data';

/** 默认输出格式 */
export const DEFAULT_FORMAT: MockFormat = 'json';

/** 示例模板 (根节点 = 一条记录) */
export const SAMPLE_TEMPLATE = `{
  // 根节点表示"一条记录"; 生成数量由页面上的条数决定
  'id|+1': 1,
  'name': '@cname',
  'email': '@email',
  'age|18-60': 1,
  'score|60-100.1-2': 1,
  'city': '@city',
  'active|1': true,
  'tags|1-3': ['@word'],
  'createdAt': '@datetime',
}`;
