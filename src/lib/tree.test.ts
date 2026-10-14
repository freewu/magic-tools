import { MAX_TREE_NODES, TreeBuilder, treeKeys, treeNodeCount, treeTitle, withChildren } from './tree';
import type { TreeItem } from './tree';

const item = (key: string, children?: TreeItem[]): TreeItem => ({ key, title: key, kind: 'element', children });

describe('树状视图通用数据层', () => {
  test('treeKeys 递归收集所有 key (展开全部用)', () => {
    const tree = [ item('a', [ item('a1'), item('a2', [ item('a21') ]) ]), item('b') ];
    expect(treeKeys(tree)).toEqual([ 'a', 'a1', 'a2', 'a21', 'b' ]);
    expect(treeKeys([])).toEqual([]);
  });

  test('treeNodeCount 统计含各级子节点的总数', () => {
    const tree = [ item('a', [ item('a1'), item('a2', [ item('a21') ]) ]), item('b') ];
    expect(treeNodeCount(tree)).toBe(5);
    expect(treeNodeCount([])).toBe(0);
  });

  test('treeTitle 折叠空白并裁剪过长标题', () => {
    expect(treeTitle('  <a   href="x">  ')).toBe('<a href="x">');
    expect(treeTitle('一二三四五', 3)).toBe('一二三…');
    expect(treeTitle('一二三', 3)).toBe('一二三');
    expect(treeTitle('')).toBe('');
  });

  test('withChildren 只在有子节点时挂 children (空数组会让 antd 认为可展开)', () => {
    // 用 TreeBuilder 造节点: 与生产代码一致, 默认不带 children 字段
    const builder = new TreeBuilder();
    const leaf = builder.create('element', '<leaf>') as TreeItem;
    expect(withChildren(leaf, [])).toBe(leaf);
    expect('children' in leaf).toBe(false);
    expect(leaf).toEqual({ key: 'n1', kind: 'element', title: '<leaf>' });

    const parent = builder.create('element', '<parent>') as TreeItem;
    const child = builder.create('element', '<child>') as TreeItem;
    expect(withChildren(parent, [ child ]).children).toEqual([ child ]);
  });

  test('TreeBuilder 顺序编号, 超过上限后截断并置位 truncated', () => {
    const builder = new TreeBuilder();
    const first = builder.create('element', '<a>');
    expect(first).toEqual({ key: 'n1', kind: 'element', title: '<a>' });
    expect(builder.truncated).toBe(false);

    // 自闭合标记只在为 true 时写入
    const selfClosed = builder.create('element', '<br>', true);
    expect(selfClosed).toEqual({ key: 'n2', kind: 'element', title: '<br>', selfClose: true });
    expect(builder.create('text', '文本')).toEqual({ key: 'n3', kind: 'text', title: '文本' });

    const cap = new TreeBuilder();
    for (let i = 0; i < MAX_TREE_NODES; i += 1) expect(cap.create('element', `<n${i}>`)).not.toBeNull();
    expect(cap.truncated).toBe(false);
    expect(cap.create('element', '<overflow>')).toBeNull();
    expect(cap.truncated).toBe(true);
    // 截断后继续调用仍然是 null
    expect(cap.create('text', 'x')).toBeNull();
  });
});
