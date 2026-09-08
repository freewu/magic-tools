// 树形和路径转换 纯逻辑层
// 路径列表(每行一条, 支持 / 与 \ 分隔) ↔ 树形结构互转。
// 树形文本约定: 每层 2 空格缩进, 兼容 ├── └── │ 等常见目录树前缀字符。

export interface PNode {
  name: string;
  /** 从根到该节点的完整路径 ('/' 连接) */
  path: string;
  children: PNode[];
}

/** 将一行路径规范化并拆分为各段 (去 ./、\ → /、去空段) */
function splitParts(line: string): string[] {
  return line.replace(/\\/g, '/').replace(/^\.\//, '').split('/').filter((s) => s && s !== '.');
}

/** 路径列表文本 → 树根列表 (合并相同分支) */
export function parsePathsTextToRoots(text: string): PNode[] {
  const roots: PNode[] = [];
  for (const raw of String(text ?? '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const parts = splitParts(line);
    if (!parts.length) continue;
    let cur = roots;
    let prefix = '';
    for (const part of parts) {
      prefix = prefix ? `${prefix}/${part}` : part;
      let node = cur.find((n) => n.name === part);
      if (!node) {
        node = { name: part, path: prefix, children: [] };
        cur.push(node);
      }
      cur = node.children;
    }
  }
  return roots;
}

/** 文本中提取每行一条路径 (支持去重) */
export function textToPathList(text: string, dedupe = true): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of String(text ?? '').split(/\r?\n/)) {
    const line = raw.trim().replace(/\\/g, '/').replace(/^\.\//, '');
    if (!line || line === '/') continue;
    if (!dedupe || !seen.has(line)) { out.push(line); seen.add(line); }
  }
  return out;
}

/** 树 → 每行一条完整路径 (DFS 前序, 目录与文件节点都输出) */
export function rootsToPaths(roots: PNode[]): string[] {
  const out: string[] = [];
  const walk = (nodes: PNode[]) => {
    for (const n of nodes) { out.push(n.path); walk(n.children); }
  };
  walk(roots);
  return out;
}

/** 树 → 缩进文本 (每层 2 空格) */
export function rootsToIndentedText(roots: PNode[]): string {
  const lines: string[] = [];
  const walk = (nodes: PNode[], depth: number) => {
    for (const n of nodes) {
      lines.push(`${'  '.repeat(depth)}${n.name}`);
      walk(n.children, depth + 1);
    }
  };
  walk(roots, 0);
  return lines.join('\n');
}

/** 缩进树文本 → 树根列表
 * 1) 纯空格/tab 缩进: 每层 2 空格(兼容其它宽度)
 * 2) 含 ├── └── │ 前缀的目录树输出(tree 命令): 按名字所在列换算层级(每 4 列一层)
 */
export function parseIndentedTextToRoots(text: string): PNode[] {
  const src = String(text ?? '').replace(/\r\n/g, '\n');
  const hasGraph = /[├└│┌┐─]/.test(src);
  type Row = { indent: number; name: string };
  const rows: Row[] = [];
  for (const raw of src.split('\n')) {
    let indent = 0;
    let name: string;
    if (hasGraph) {
      // 名字所在列 → 层级 (每层 4 列)
      let col = 0;
      let i = 0;
      while (i < raw.length && /[ \t├└│┌┐─]/.test(raw[i])) {
        col += raw[i] === '\t' ? 4 : 1;
        i += 1;
      }
      name = raw.slice(i).trim();
      indent = Math.max(0, Math.round((col - 1) / 4));
    } else {
      const lead = /^[ \t]*/.exec(raw)?.[0] ?? '';
      for (const ch of lead) indent += ch === '\t' ? 2 : 1;
      name = raw.slice(lead.length).trim();
    }
    if (!name || name === '/') continue;
    rows.push({ indent, name });
  }
  const roots: PNode[] = [];
  const stack: Array<{ indent: number; node: PNode }> = [];
  for (const r of rows) {
    while (stack.length && stack[stack.length - 1].indent >= r.indent) stack.pop();
    const parent = stack.length ? stack[stack.length - 1].node : undefined;
    const node: PNode = { name: r.name, path: '', children: [] };
    if (parent) parent.children.push(node);
    else roots.push(node);
    stack.push({ indent: r.indent, node });
  }
  // 回填 path
  const fill = (nodes: PNode[], prefix: string) => {
    for (const n of nodes) {
      n.path = prefix ? `${prefix}/${n.name}` : n.name;
      fill(n.children, n.path);
    }
  };
  fill(roots, '');
  return roots;
}

/** 树 → 嵌套 JSON 对象 (空 children 的节点作为叶子, 值为 null) */
export function rootsToJson(roots: PNode[]): Record<string, unknown> {
  const build = (nodes: PNode[]): Record<string, unknown> => {
    const o: Record<string, unknown> = {};
    for (const n of nodes) o[n.name] = n.children.length ? build(n.children) : null;
    return o;
  };
  return build(roots);
}

/** 嵌套 JSON 树 → 树根列表 (值为对象的键继续下钻, 其余视为叶节点) */
export function jsonToRoots(jsonText: string): PNode[] {
  const roots: PNode[] = [];
  const walkObj = (obj: Record<string, unknown>, parent: PNode | null) => {
    for (const [key, val] of Object.entries(obj)) {
      const node: PNode = { name: key, path: '', children: [] };
      if (parent) parent.children.push(node);
      else roots.push(node);
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        walkObj(val as Record<string, unknown>, node);
      }
    }
  };
  const parsed: unknown = JSON.parse(jsonText);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('JSON 根应为对象');
  }
  walkObj(parsed as Record<string, unknown>, null);
  // 回填 path
  const fill = (nodes: PNode[], prefix: string) => {
    for (const n of nodes) {
      n.path = prefix ? `${prefix}/${n.name}` : n.name;
      fill(n.children, n.path);
    }
  };
  fill(roots, '');
  return roots;
}
