// JSON 处理: 格式化 / 压缩 / 树结构
export const INDENT = 2;

// 格式化 (2 空格缩进)
export const jsonPretty = (text: string): string =>
  JSON.stringify(JSON.parse(text), null, INDENT);

// 压缩为一行
export const jsonCompact = (text: string): string =>
  JSON.stringify(JSON.parse(text));

export type JsonNodeMeta = 'obj' | 'arr' | 'val';

// 树节点 (纯结构, 便于单测; UI 再转换为 antd Tree 数据)
export interface JsonTreeNode {
  key: string;      // 唯一路径 (父 key + '.' + 序号)
  label: string;    // 键名 (数组为下标)
  meta: JsonNodeMeta; // 节点类型
  text: string;     // 叶子值的展示文本 (对象/数组为空)
  size: number;     // 子节点个数 (对象/数组有效)
  children: JsonTreeNode[];
}

const buildNode = (value: unknown, label: string, prefix: string): JsonTreeNode => {
  if (value === null) {
    return { key: prefix, label, meta: 'val', text: 'null', size: 0, children: [] };
  }
  const t = typeof value;
  if (t === 'object') {
    const arr = Array.isArray(value);
    const entries: Array<[string, unknown]> = arr
      ? (value as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
      : Object.entries(value as Record<string, unknown>);
    const children = entries.map(([k, v], idx) => buildNode(v, k, `${prefix}.${idx}`));
    return { key: prefix, label, meta: arr ? 'arr' : 'obj', text: '', size: children.length, children };
  }
  if (t === 'string') {
    return { key: prefix, label, meta: 'val', text: `"${value}"`, size: 0, children: [] };
  }
  return { key: prefix, label, meta: 'val', text: String(value), size: 0, children: [] };
};

// 解析 JSON 并构造树 (虚拟根, key 固定为 '0')
export const jsonToTree = (text: string): JsonTreeNode => {
  return jsonValueToTree(JSON.parse(text));
};

// 由任意解析后的值构造树 (JSON5 等其它解析器解析后可直接复用)
export const jsonValueToTree = (value: unknown, label = '$'): JsonTreeNode => {
  return buildNode(value, label, '0');
};
