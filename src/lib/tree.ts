// 树状视图通用数据层 (与 antd Tree 的 dataSource 结构兼容, 但本文件不依赖 antd):
// XML / HTML 等结构化文本解析出的节点树统一用 TreeItem 描述, 页面只负责渲染。

/** 节点类型: 元素 / 文本 / 注释等原样节点 */
export type TreeItemKind = 'element' | 'text' | 'raw';

export interface TreeItem {
  /** 唯一 key (由 TreeBuilder 统一编号) */
  key: string;
  /** 显示文本 (已做长度裁剪) */
  title: string;
  kind: TreeItemKind;
  /** 元素是否自闭合 / 空元素 (仅用于展示) */
  selfClose?: boolean;
  children?: TreeItem[];
}

/** 单棵树最多展示的节点数: 超大文档只解析前若干节点, 避免树撑爆页面 */
export const MAX_TREE_NODES = 2000;

/** 节点标题过长时裁剪, 保持树面整洁 */
export const treeTitle = (s: string, max = 80): string => {
  const text = String(s ?? '').replace(/[ \t\r\n\f]+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

/** 只有非空子节点时才挂 children (antd 用 children: [] 会当成可展开节点) */
export const withChildren = (item: TreeItem, children: TreeItem[]): TreeItem => {
  if (children.length) item.children = children;
  return item;
};

/** 收集整棵树的所有 key (「展开全部」用) */
export const treeKeys = (items: TreeItem[]): string[] =>
  items.flatMap((item) => [ item.key, ...(item.children ? treeKeys(item.children) : []) ]);

/** 统计节点总数 (含各级子节点) */
export const treeNodeCount = (items: TreeItem[]): number =>
  items.reduce((sum, item) => sum + 1 + treeNodeCount(item.children ?? []), 0);

/** 树构建器: 统一编号 key, 并在节点数超过上限时截断 (truncated 置位) */
export class TreeBuilder {
  private seq = 0;
  private count = 0;
  private cut = false;

  /** 是否因为节点过多被截断 */
  get truncated(): boolean {
    return this.cut;
  }

  /** 新建节点: 超出上限返回 null (调用方跳过即可, 树会停在已建好的部分) */
  create(kind: TreeItemKind, title: string, selfClose = false): TreeItem | null {
    if (this.count >= MAX_TREE_NODES) {
      this.cut = true;
      return null;
    }
    this.count += 1;
    this.seq += 1;
    const item: TreeItem = { key: `n${this.seq}`, kind, title };
    if (selfClose) item.selfClose = true;
    return item;
  }
}
