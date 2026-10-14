// HTML 格式化 纯逻辑层 (手写 pretty printer, 不依赖外部解析库)

import { fileNameWithExt } from '../../lib/file';
import { TreeBuilder, treeTitle, withChildren, type TreeItem } from '../../lib/tree';

export interface FormatOptions {
  /** 每层缩进空格数 (默认 2) */
  indentSize?: number;
}

interface TextNode { type: 'text'; raw: string }
interface RawNode { type: 'raw'; raw: string }          // 注释/DOCTYPE
interface ElementNode {
  type: 'element';
  tag: string;                 // 保留原始大小写
  lower: string;
  open: string;                // 完整开标签原文 (含属性)
  close: string | null;        // </tag> 原文, void/自闭合为 null
  rawText: boolean;            // script/style/pre/textarea 内容原样
  rawBody: string;             // rawText 元素的内文
  children: DocNode[];
}
type DocNode = TextNode | RawNode | ElementNode;

// 块级标签: 其内容按独立行缩进处理
const BLOCK_TAGS = new Set([
  'html', 'head', 'body', 'main', 'nav', 'header', 'footer', 'section', 'article',
  'aside', 'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'menu',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption', 'colgroup',
  'blockquote', 'form', 'fieldset', 'figure', 'figcaption', 'details', 'summary',
  'address', 'hr', 'pre', 'template', 'meta', 'link', 'title', 'base',
]);
// 空元素 (无闭合标签)
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);
// 内容需按原始文本保留的元素
const RAWTEXT_TAGS = new Set(['script', 'style', 'pre', 'textarea']);

const blockOf = (tag: string) => BLOCK_TAGS.has(tag.toLowerCase());

function tokenize(source: string): DocNode[] {
  const root: DocNode[] = [];
  const stack: ElementNode[] = [];
  const top = (): DocNode[] => (stack.length ? stack[stack.length - 1].children : root);
  const pushText = (s: string) => {
    if (!s) return;
    const list = top();
    const last = list[list.length - 1];
    if (last && last.type === 'text') { (last as TextNode).raw += s; return; }
    list.push({ type: 'text', raw: s });
  };
  const push = (n: DocNode) => top().push(n);

  /** 从 lt 处扫描标签结束的 '>' (跳过引号内) */
  const scanGt = (lt: number): number => {
    let j = lt + 1;
    let quote = '';
    for (; j < source.length; j += 1) {
      const ch = source[j];
      if (quote) { if (ch === quote) quote = ''; continue; }
      if (ch === '"' || ch === "'") { quote = ch; continue; }
      if (ch === '>') break;
    }
    return j;
  };

  let i = 0;
  while (i < source.length) {
    const lt = source.indexOf('<', i);
    if (lt === -1) { pushText(source.slice(i)); break; }
    if (lt > i) pushText(source.slice(i, lt));

    if (source.startsWith('<!--', lt)) {
      const end = source.indexOf('-->', lt + 4);
      if (end === -1) { pushText(source.slice(lt)); break; }
      push({ type: 'raw', raw: source.slice(lt, end + 3) });
      i = end + 3;
      continue;
    }
    if (source.startsWith('<!', lt) || source.startsWith('<?', lt)) {
      const end = scanGt(lt);
      if (end >= source.length) { pushText(source.slice(lt)); break; }
      push({ type: 'raw', raw: source.slice(lt, end + 1) });
      i = end + 1;
      continue;
    }
    if (lt + 1 < source.length && source[lt + 1] === '/') {
      // 闭合标签
      const m = /^<\/\s*([A-Za-z][\w:.-]*)\s*>/.exec(source.slice(lt));
      if (!m) { pushText(source[lt]); i = lt + 1; continue; }
      const name = m[1].toLowerCase();
      for (let k = stack.length - 1; k >= 0; k -= 1) {
        if (stack[k].lower === name) { stack.length = k; break; }
      }
      i = lt + m[0].length;
      continue;
    }
    // 开标签
    const open = /^<([A-Za-z][\w:.-]*)/.exec(source.slice(lt));
    if (!open) { pushText(source[lt]); i = lt + 1; continue; }
    const gt = scanGt(lt);
    if (gt >= source.length) { pushText(source.slice(lt)); break; }
    const openRaw = source.slice(lt, gt + 1);
    const name = open[1];
    const lower = name.toLowerCase();
    const selfClose = /\/\s*>$/.test(openRaw);
    if (RAWTEXT_TAGS.has(lower) && !selfClose) {
      // 内容原样保留直至闭合标签
      const closeRe = new RegExp(`</\\s*${name}\\s*>`, 'i');
      const rest = source.slice(gt + 1);
      const cm = closeRe.exec(rest);
      const body = cm ? rest.slice(0, cm.index) : rest;
      push({
        type: 'element', tag: name, lower, open: openRaw,
        close: cm ? cm[0] : null, rawText: true, rawBody: body, children: [],
      });
      i = cm ? gt + 1 + cm.index + cm[0].length : source.length;
      continue;
    }
    const el: ElementNode = {
      type: 'element', tag: name, lower, open: openRaw,
      close: selfClose || VOID_TAGS.has(lower) ? null : `</${name}>`,
      rawText: false, rawBody: '', children: [],
    };
    push(el);
    if (!selfClose && !VOID_TAGS.has(lower)) stack.push(el);
    i = gt + 1;
  }
  return root;
}

/** 该元素的子树中是否不含块级元素 (可安全压成一行) */
function isInlineTree(el: ElementNode): boolean {
  for (const c of el.children) {
    if (c.type === 'raw') return false; // 注释/DOCTYPE 需独立成行
    if (c.type === 'text') continue;
    if (c.rawText || blockOf(c.tag) || !isInlineTree(c)) return false;
  }
  return true;
}

const collapse = (s: string) => s.replace(/[ \t\r\n\f]+/g, ' ');

/** 将一组"行内内容"节点渲染为单行文本 (文本空白折叠, 整体去首尾空白) */
function renderInline(nodes: DocNode[]): string {
  const parts: string[] = [];
  for (const c of nodes) {
    if (c.type === 'text') parts.push(collapse(c.raw));
    else if (c.type === 'raw') parts.push(c.raw);
    else if (c.type === 'element') {
      const inner = c.rawText
        ? c.rawBody
        : renderInline(c.children);
      parts.push(c.open + inner + (c.close ?? ''));
    }
  }
  return parts.join('').trim();
}

function emitChildren(nodes: DocNode[], depth: number, indent: string, out: string[]): void {
  let seg: DocNode[] = [];
  const pad = (d: number) => indent.repeat(d);
  const flush = () => {
    if (!seg.length) return;
    const text = renderInline(seg);
    if (text) out.push(pad(depth) + text);
    seg = [];
  };
  for (const c of nodes) {
    if (c.type === 'text') { seg.push(c); continue; }
    if (c.type === 'raw') { flush(); out.push(pad(depth) + c.raw); continue; }
    if (c.rawText) { flush(); emitRawElement(c, depth, indent, out); continue; }
    if (blockOf(c.tag)) { flush(); emitElement(c, depth, indent, out); continue; }
    seg.push(c);
  }
  flush();
}

function emitRawElement(el: ElementNode, depth: number, indent: string, out: string[]): void {
  const pad = indent.repeat(depth);
  out.push(pad + el.open + (el.rawBody || '') + (el.close ?? ''));
}

function emitElement(el: ElementNode, depth: number, indent: string, out: string[]): void {
  const pad = indent.repeat(depth);
  if (el.children.length === 0) {
    out.push(pad + el.open + (el.close ?? ''));
    return;
  }
  if (isInlineTree(el)) {
    out.push(pad + el.open + renderInline(el.children) + (el.close ?? ''));
    return;
  }
  out.push(pad + el.open);
  emitChildren(el.children, depth + 1, indent, out);
  out.push(pad + (el.close ?? ''));
}

/** HTML 代码美化格式化。非法/残缺结构尽量宽容输出; 返回字符串。 */
export function formatHtml(source: string, options?: FormatOptions): string {
  const indentSize = Math.max(1, Math.min(8, options?.indentSize ?? 2));
  const indent = ' '.repeat(indentSize);
  const doc = tokenize(String(source ?? ''));
  const out: string[] = [];
  emitChildren(doc, 0, indent, out);
  const joined = out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return joined ? `${joined}\n` : '';
}

// ---- 设置: 默认缩进 (2 / 4 空格) ----
// ---- 结构树 (树状折叠视图) ----

/** 结构树构建结果: items 为根节点列表, truncated 表示节点过多被截断 */
export interface HtmlTreeResult {
  items: TreeItem[];
  truncated: boolean;
}

/** 把 HTML 解析成结构树: 元素节点标题取开标签原文, 文本节点做单行预览 */
export function htmlTree(source: string): HtmlTreeResult {
  const doc = tokenize(String(source ?? ''));
  const builder = new TreeBuilder();
  const walk = (nodes: DocNode[]): TreeItem[] => {
    const out: TreeItem[] = [];
    for (const node of nodes) {
      if (node.type === 'text') {
        const text = treeTitle(node.raw);
        // 标签之间的纯空白文本不建节点
        if (!text) continue;
        const item = builder.create('text', text);
        if (!item) break;
        out.push(item);
        continue;
      }
      if (node.type === 'raw') {
        const title = treeTitle(node.raw);
        if (!title) continue;
        const item = builder.create('raw', title);
        if (!item) break;
        out.push(item);
        continue;
      }
      const item = builder.create('element', treeTitle(node.open), node.close === null);
      if (!item) break;
      let kids: TreeItem[];
      if (node.rawText) {
        // script / style / pre / textarea: 内容原样保留, 树里只放一个文本子节点
        const body = treeTitle(node.rawBody);
        const child = body ? builder.create('text', body) : null;
        kids = child ? [ child ] : [];
      } else {
        kids = walk(node.children);
      }
      out.push(withChildren(item, kids));
    }
    return out;
  };
  const items = walk(doc);
  return { items, truncated: builder.truncated };
}

// ---- 打开 / 保存本地文件 ----

/** 「打开文件」允许的类型 (HTML 及其变体; 一律按文本读入) */
export const HTML_ACCEPT = '.html,.htm,.xhtml,.shtml,.txt,text/html,application/xhtml+xml,text/plain';

/** 与 .html 等价的后缀: 打开这些文件时保存沿用原后缀, 不强行改成 .html */
const HTML_ALIASES = ['htm', 'xhtml', 'shtml'];

/** 保存时用的文件名: 打开过文件就沿用它的名字, 没有则用 formatted.html */
export const htmlFileNameOf = (name: string): string => fileNameWithExt(name, 'html', 'formatted', HTML_ALIASES);

const INDENT_KEY = 'html-format.indent-size';

export function getHtmlIndent(): number {
  try {
    const v = Number(localStorage.getItem(INDENT_KEY));
    return v === 4 ? 4 : 2;
  } catch {
    return 2;
  }
}

export function setHtmlIndent(v: number): void {
  try {
    localStorage.setItem(INDENT_KEY, v === 4 ? '4' : '2');
  } catch { /* ignore */ }
}
