// XML 格式化 纯逻辑层
// 手写 pretty printer (不依赖 DOMParser/外部解析库, jest 链无 ESM 风险):
// 按元素嵌套缩进、行内化叶子文本, 保留注释/CDATA/DOCTYPE/PI 原样,
// 并对标签配平做合法性检查 (未闭合 / 交叉嵌套 / 多余闭合会抛出带行号的错误)。

export interface XmlFormatOptions {
  /** 每层缩进空格数 (1-8, 默认 2) */
  indentSize?: number;
}

interface ElementNode {
  type: 'element';
  tag: string;            // 保留原始大小写
  open: string;           // 完整开标签原文 (含属性)
  selfClose: boolean;
  close: string | null;   // </tag> 原文 (自闭合为 null)
  offset: number;         // 开标签在源文本中的位置 (定位行号)
  children: XmlNode[];
}
interface TextNode { type: 'text'; raw: string }
interface RawNode { type: 'raw'; raw: string } // 注释 / CDATA / DOCTYPE / PI
type XmlNode = ElementNode | TextNode | RawNode;

const lineOf = (source: string, offset: number): number => {
  let line = 1;
  for (let i = 0; i < offset && i < source.length; i += 1) {
    if (source[i] === '\n') line += 1;
  }
  return line;
};

function tokenize(source: string): XmlNode[] {
  const root: XmlNode[] = [];
  const stack: ElementNode[] = [];
  const top = (): XmlNode[] => (stack.length ? stack[stack.length - 1].children : root);
  const pushText = (s: string) => {
    if (!s) return;
    const list = top();
    const last = list[list.length - 1];
    if (last && last.type === 'text') { (last as TextNode).raw += s; return; }
    list.push({ type: 'text', raw: s });
  };

  /** 从 lt 处扫描 '>' 结束 (跳过引号内内容) */
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

    // CDATA: 内容按原样保留, 不参与标签解析
    if (source.startsWith('<![CDATA[', lt)) {
      const end = source.indexOf(']]>', lt + 9);
      if (end === -1) throw new Error(`CDATA 未闭合 (第 ${lineOf(source, lt)} 行)`);
      top().push({ type: 'raw', raw: source.slice(lt, end + 3) });
      i = end + 3;
      continue;
    }
    // 注释
    if (source.startsWith('<!--', lt)) {
      const end = source.indexOf('-->', lt + 4);
      if (end === -1) throw new Error(`注释未闭合 (第 ${lineOf(source, lt)} 行)`);
      top().push({ type: 'raw', raw: source.slice(lt, end + 3) });
      i = end + 3;
      continue;
    }
    // DOCTYPE / PI / 其它 <! 声明
    if (source.startsWith('<!', lt) || source.startsWith('<?', lt)) {
      const end = scanGt(lt);
      if (end >= source.length) throw new Error(`声明未闭合 (第 ${lineOf(source, lt)} 行)`);
      top().push({ type: 'raw', raw: source.slice(lt, end + 1) });
      i = end + 1;
      continue;
    }
    // 闭合标签 </name>
    if (source[lt + 1] === '/') {
      const m = /^<\/\s*([A-Za-z_][\w.:-]*)\s*>/.exec(source.slice(lt));
      if (!m) throw new Error(`非法闭合标签 (第 ${lineOf(source, lt)} 行)`);
      const name = m[1];
      if (!stack.length) throw new Error(`多余的闭合标签 </${name}> (第 ${lineOf(source, lt)} 行)`);
      const idx = stack.length - 1;
      if (stack[idx].tag !== name) {
        // 尝试栈内匹配, 判断是交叉嵌套还是缺失闭合
        const found = -1; // stack 索引从底到顶
        let k = stack.length - 1;
        for (; k >= 0; k -= 1) if (stack[k].tag === name) break;
        if (k < 0) throw new Error(`多余的闭合标签 </${name}> (第 ${lineOf(source, lt)} 行)`);
        throw new Error(`XML 标签交叉嵌套: <${stack[idx].tag}> 在 </${name}> 前未闭合 (第 ${lineOf(source, lt)} 行)`);
      }
      stack[idx].close = m[0];
      stack.pop();
      i = lt + m[0].length;
      continue;
    }
    // 开标签
    const open = /^<([A-Za-z_][\w.:-]*)/.exec(source.slice(lt));
    if (!open) { pushText(source[lt]); i = lt + 1; continue; }
    const gt = scanGt(lt);
    if (gt >= source.length) throw new Error(`标签 <${open[1]}> 未闭合 (> 缺失, 第 ${lineOf(source, lt)} 行)`);
    const openRaw = source.slice(lt, gt + 1);
    const selfClose = /\/\s*>$/.test(openRaw);
    const el: ElementNode = {
      type: 'element', tag: open[1], open: openRaw, selfClose,
      close: null, offset: lt, children: [],
    };
    top().push(el);
    if (!selfClose) stack.push(el);
    i = gt + 1;
  }
  if (stack.length) {
    const el = stack[stack.length - 1];
    throw new Error(`XML 标签未闭合: <${el.tag}> (开始于第 ${lineOf(source, el.offset)} 行)`);
  }
  return root;
}

const collapse = (s: string) => s.replace(/[ \t\r\n\f]+/g, ' ').trim();

function render(node: XmlNode, depth: number, indent: string, out: string[]): void {
  const pad = (d: number) => indent.repeat(d);
  if (node.type === 'text') {
    const s = collapse(node.raw);
    if (s) out.push(pad(depth) + s);
    return;
  }
  if (node.type === 'raw') {
    // CDATA 等多行原样保留, 每行做缩进
    const lines = node.raw.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const line = i === lines.length - 1 ? lines[i] : `${lines[i]}`;
      out.push(pad(depth) + line);
    }
    return;
  }
  const el = node;
  // 子节点分类
  const kids = el.children;
  const texts = kids.filter((c): c is TextNode => c.type === 'text');
  const others = kids.filter((c) => c.type !== 'text');
  const content = texts.map((t) => t.raw).join('');

  if (el.selfClose || kids.length === 0) {
    out.push(pad(depth) + (el.close ? `${el.open}${el.close}` : el.open));
    return;
  }
  // 纯文本叶子 (含可读文本): 尝试单行化; 多行文本拆行
  if (others.length === 0) {
    if (!content.trim()) {
      out.push(pad(depth) + el.open + (el.close ?? ''));
      return;
    }
    if (!content.includes('\n') && content.trim() === content && !/\n/.test(content)) {
      out.push(pad(depth) + el.open + content + (el.close ?? ''));
      return;
    }
    // 含换行的文本内容: 首行拼在开标签后? 保守起见展开为标签+文本行
    out.push(pad(depth) + el.open);
    const lines = content.split('\n').map((s) => collapse(s)).filter(Boolean);
    for (const line of lines) out.push(pad(depth + 1) + line);
    out.push(pad(depth) + (el.close ?? ''));
    return;
  }
  // 混合内容: 开标签独立成行, 子节点递归
  out.push(pad(depth) + el.open);
  for (const c of kids) render(c, depth + 1, indent, out);
  out.push(pad(depth) + (el.close ?? ''));
}

/** XML 代码美化。标签不合法时抛出带行号的 Error。 */
export function formatXml(source: string, options?: XmlFormatOptions): string {
  const indentSize = Math.max(1, Math.min(8, options?.indentSize ?? 2));
  const indent = ' '.repeat(indentSize);
  const doc = tokenize(String(source ?? ''));
  const out: string[] = [];
  for (const node of doc) render(node, 0, indent, out);
  const joined = out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return joined ? `${joined}\n` : '';
}

/** XML 压缩: 去掉元素间纯空白文本与多余换行, 保留可读文本与注释内容原样。 */
export function minifyXml(source: string): string {
  const doc = tokenize(String(source ?? ''));
  const out: string[] = [];
  const walk = (nodes: XmlNode[]) => {
    for (const node of nodes) {
      if (node.type === 'text') {
        const s = node.raw.trim();
        if (s) out.push(s);
      } else if (node.type === 'raw') {
        out.push(node.raw);
      } else {
        out.push(node.open);
        walk(node.children);
        if (node.close) out.push(node.close);
      }
    }
  };
  walk(doc);
  return out.join('').replace(/\n[ \t]*/g, '');
}

// ---- 设置: 默认缩进 (2 / 4 空格) ----
const INDENT_KEY = 'xml-format.indent-size';

export function getXmlIndent(): number {
  try {
    return Number(localStorage.getItem(INDENT_KEY)) === 4 ? 4 : 2;
  } catch {
    return 2;
  }
}

export function setXmlIndent(v: number): void {
  try {
    localStorage.setItem(INDENT_KEY, v === 4 ? '4' : '2');
  } catch { /* ignore */ }
}
