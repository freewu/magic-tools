// Markdown 编辑器 纯逻辑层
// 自研 Markdown 子集渲染器 (无第三方依赖):
// 标题/段落/粗斜体删除线/行内代码/围栏代码块/无序有序列表(支持嵌套缩进)/
// 表格/引用/分隔线/图片链接, 以及行内 $x$ 与块级 $$..$$ LaTeX 子集渲染。
// 输入在解析前统一 HTML 转义 (含引号), 代码与公式块独立处理, 可安全用于 innerHTML。

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// ---------------- LaTeX 子集渲染 ----------------

const GREEK: Record<string, string> = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε',
  zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'ϑ', iota: 'ι', kappa: 'κ',
  lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', omicron: 'ο', pi: 'π', varpi: 'ϖ',
  rho: 'ρ', varrho: 'ϱ', sigma: 'σ', varsigma: 'ς', tau: 'τ', upsilon: 'υ',
  phi: 'φ', varphi: 'ϕ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π',
  Sigma: 'Σ', Upsilon: 'Υ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
  Alpha: 'Α', Beta: 'Β', Epsilon: 'Ε', Zeta: 'Ζ', Eta: 'Η', Iota: 'Ι',
  Kappa: 'Κ', Mu: 'Μ', Nu: 'Ν', Omicron: 'Ο', Rho: 'Ρ', Tau: 'Τ', Chi: 'Χ',
};

const SYMBOLS: Array<[string, string]> = [
  ['\\cdot', '·'], ['\\times', '×'], ['\\div', '÷'], ['\\pm', '±'], ['\\mp', '∓'],
  ['\\leq', '≤'], ['\\geq', '≥'], ['\\le', '≤'], ['\\ge', '≥'], ['\\neq', '≠'],
  ['\\ne', '≠'], ['\\approx', '≈'], ['\\equiv', '≡'], ['\\propto', '∝'],
  ['\\infty', '∞'], ['\\ldots', '…'], ['\\cdots', '⋯'],
  ['\\rightarrow', '→'], ['\\Rightarrow', '⇒'], ['\\leftarrow', '←'], ['\\Leftarrow', '⇐'],
  ['\\leftrightarrow', '↔'], ['\\Leftrightarrow', '⇔'], ['\\to', '→'], ['\\mapsto', '↦'],
  ['\\sum', '∑'], ['\\prod', '∏'], ['\\int', '∫'], ['\\iint', '∬'], ['\\iiint', '∭'],
  ['\\oint', '∮'], ['\\partial', '∂'], ['\\nabla', '∇'], ['\\triangle', '△'],
  ['\\in', '∈'], ['\\notin', '∉'], ['\\ni', '∋'], ['\\subset', '⊂'], ['\\supset', '⊃'],
  ['\\subseteq', '⊆'], ['\\supseteq', '⊇'], ['\\cup', '∪'], ['\\cap', '∩'],
  ['\\emptyset', '∅'], ['\\varnothing', '∅'], ['\\forall', '∀'], ['\\exists', '∃'],
  ['\\nexists', '∄'], ['\\neg', '¬'], ['\\land', '∧'], ['\\lor', '∨'],
  ['\\oplus', '⊕'], ['\\otimes', '⊗'], ['\\star', '⋆'], ['\\circ', '∘'],
  ['\\left(', '('], ['\\right)', ')'], ['\\left[', '['], ['\\right]', ']'],
  ['\\left\\{', '{'], ['\\right\\}', '}'], ['\\{', '{'], ['\\}', '}'],
  ['\\%', '%'], ['\\&', '&'], ['\\#', '#'], ['\\_', '_'],
];

function texCore(s: string): string {
  let t = s;
  t = t.replace(/\\text\{([^{}]*)\}/g, '<span class="tt">$1</span>');
  // \frac / \sqrt (内容允许已渲染的 span, 嵌套花括号场景有限支持)
  for (let i = 0; i < 8; i += 1) {
    const next = t
      .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '<span class="tf"><span class="tn">$1</span><span class="td">$2</span></span>')
      .replace(/\\sqrt(?:\[[^{}]*\])?\{([^{}]*)\}/g, '<span class="tsq"><span class="trad">√</span><span class="tsi">$1</span></span>');
    if (next === t) break;
    t = next;
  }
  t = t.replace(/\^\{([^{}]*)\}/g, '<sup>$1</sup>');
  t = t.replace(/_\{([^{}]*)\}/g, '<sub>$1</sub>');
  t = t.replace(/\^([0-9A-Za-z()+\-*/=<>.,;:])/g, '<sup>$1</sup>');
  t = t.replace(/_([0-9A-Za-z()+\-*/=<>.,;:])/g, '<sub>$1</sub>');
  t = t.replace(/\\binom\{([^{}]*)\}\{([^{}]*)\}/g, '<span class="tb"><span class="tbn">$1</span><span class="tbd">$2</span></span>');
  for (const [k, v] of SYMBOLS) t = t.split(k).join(v);
  t = t.replace(/\\([A-Za-z]+)/g, (_m, name: string) => GREEK[name] ?? name);
  return t.trim();
}

/**
 * LaTeX 公式子集 → HTML:
 * \frac{}{} \sqrt{} 上下标 ^{} _{} 希腊字母/常用符号(见上表), \text{} 保留普通文本。
 */
export function texToHtml(expr: string): string {
  return texCore(escapeHtml(String(expr ?? '')));
}

// ---------------- Markdown 子集渲染 ----------------

/** 仅允许 http/https/mailto/tel 协议与相对路径链接, 其余 (如 javascript:) 按纯文本原样输出 */
function isSafeLink(url: string): boolean {
  const u = url.trim();
  const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(u);
  if (!scheme) return true;
  return /^(https?|mailto|tel)$/i.test(scheme[1]);
}

function inline(src: string): string {
  let s = src;
  const codes: string[] = [];
  s = s.replace(/`([^`\n]+)`/g, (_m, c: string) => { codes.push(c); return `\u0000C${codes.length - 1}\u0000`; });
  s = s.replace(/\$([^$\n]+)\$/g, (_m, tex: string) => `<span class="math">${texCore(tex)}</span>`);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, alt: string, url: string) => `<img src="${url}" alt="${alt}" loading="lazy" />`);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, txt: string, url: string) => {
    return isSafeLink(url)
      ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${txt}</a>`
      : `[${txt}](${url})`;
  });
  s = s.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  s = s.replace(/\u0000C(\d+)\u0000/g, (_m, i: string) => `<code>${codes[Number(i)]}</code>`);
  return s;
}

interface LRow { indent: number; ol: boolean; text: string }

function renderListRows(rows: LRow[]): string {
  const base = rows[0].indent;
  let html = '';
  const open: string[] = [];
  const ensure = (depth: number, tag: 'ul' | 'ol') => {
    while (open.length > depth + 1) html += `</${open.pop()}>`;
    if (open.length < depth + 1) { html += `<${tag}>`; open.push(tag); return; }
    if (open[open.length - 1] !== tag) { html += `</${open.pop()}>`; html += `<${tag}>`; open.push(tag); }
  };
  for (const r of rows) {
    const depth = Math.max(0, Math.round((r.indent - base) / 2));
    ensure(depth, r.ol ? 'ol' : 'ul');
    html += `<li>${inline(r.text)}</li>`;
  }
  while (open.length) html += `</${open.pop()}>`;
  return html;
}

function renderTable(rows: string[]): string {
  const cells = (row: string) => {
    const arr = row.split('|').map((c) => c.trim());
    if (arr[0] === '') arr.shift();
    if (arr[arr.length - 1] === '') arr.pop();
    return arr;
  };
  const alignCell = /^:?-{2,}:?$/;
  if (rows.length < 2 || !cells(rows[1]).every((c) => alignCell.test(c))) return '';
  const head = cells(rows[0]);
  const body: string[][] = rows.slice(2).map((r) => cells(r));
  const colCount = head.length;
  const thead = `<thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead>`;
  const tbody = `<tbody>${body.map((r) => {
    const tds = r.slice(0, colCount);
    while (tds.length < colCount) tds.push('');
    return `<tr>${tds.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`;
  }).join('')}</tbody>`;
  return `<table>${thead}${tbody}</table>`;
}

/** Markdown 文本 → HTML 字符串 (安全: 全部输入经 HTML 转义) */
export function renderMarkdown(mdText: string): string {
  const src = String(mdText ?? '').replace(/\r\n/g, '\n');
  // 1. 围栏代码块 (内容原样转义, 不参与后续解析)
  const fences: string[] = [];
  const fenced = src.replace(/```([\w+-]*)[ \t]*\n?([\s\S]*?)(?:```|$)/g, (_m, lang: string, code: string) => {
    const html = `<pre class="md-code${lang ? ` lang-${escapeHtml(lang)}` : ''}"><code class="language-${escapeHtml(lang || 'plaintext')}">${escapeHtml(code.replace(/\n$/, ''))}</code></pre>`;
    fences.push(html);
    return `\n\u0000F${fences.length - 1}\u0000\n`;
  });
  // 2. 块级公式 $$..$$
  const blocks: string[] = [];
  const work = fenced.replace(/\$\$([\s\S]+?)\$\$/g, (_m, tex: string) => {
    blocks.push(`<div class="math-block">${texToHtml(tex)}</div>`);
    return `\u0000B${blocks.length - 1}\u0000`;
  });
  // 3. 整体转义 (marker 占位字符不受影响)
  const safe = escapeHtml(work);
  const lines = safe.split('\n');

  const out: string[] = [];
  const flushParagraph = (buf: string[]) => {
    if (!buf.length) return;
    out.push(`<p>${inline(buf.join(' '))}</p>`);
    buf.length = 0;
  };
  let para: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*$/.test(line)) { flushParagraph(para); i += 1; continue; }
    const fenceM = /^\u0000F(\d+)\u0000$/.exec(line);
    if (fenceM) { flushParagraph(para); out.push(fences[Number(fenceM[1])]); i += 1; continue; }
    const blockM = /^\u0000B(\d+)\u0000$/.exec(line);
    if (blockM) { flushParagraph(para); out.push(blocks[Number(blockM[1])]); i += 1; continue; }
    // 标题
    const headM = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headM) {
      flushParagraph(para);
      const level = headM[1].length;
      out.push(`<h${level}>${inline(headM[2])}</h${level}>`);
      i += 1; continue;
    }
    // 分隔线
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { flushParagraph(para); out.push('<hr />'); i += 1; continue; }
    // 引用块
    if (/^&gt;\s?/.test(line)) {
      flushParagraph(para);
      const q: string[] = [];
      while (i < lines.length && /^&gt;\s?/.test(lines[i])) {
        q.push(lines[i].replace(/^&gt;\s?/, ''));
        i += 1;
      }
      out.push(`<blockquote>${inline(q.join(' '))}</blockquote>`);
      continue;
    }
    // 表格: 当前行是表头, 下一行是 :---: 分隔行
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].includes('-')) {
      flushParagraph(para);
      const tbl: string[] = [line];
      i += 1;
      while (i < lines.length && lines[i].includes('|')) { tbl.push(lines[i]); i += 1; }
      const html = renderTable(tbl);
      if (html) out.push(html);
      else para.push(tbl.join(' '));
      continue;
    }
    // 列表
    const listRe = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
    const lm = listRe.exec(line);
    if (lm) {
      flushParagraph(para);
      const rows: LRow[] = [];
      while (i < lines.length) {
        const m = listRe.exec(lines[i]);
        if (!m) break;
        const indent = m[1].replace(/\t/g, '  ').length;
        rows.push({ indent, ol: /\d/.test(m[2]), text: m[3] });
        i += 1;
      }
      out.push(renderListRows(rows));
      continue;
    }
    para.push(line);
    i += 1;
  }
  flushParagraph(para);
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ---------------- 导出 .html 的样式与包装 ----------------

export const MD_EXPORT_CSS = `.md-preview{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;line-height:1.75;color:#24292f;max-width:860px;margin:0 auto;padding:24px;font-size:15px}
.md-preview h1,.md-preview h2,.md-preview h3,.md-preview h4{margin:1.4em 0 .6em;line-height:1.3}
.md-preview h1{border-bottom:1px solid #eaecef;padding-bottom:.3em;font-size:1.9em}
.md-preview h2{border-bottom:1px solid #eaecef;padding-bottom:.3em;font-size:1.5em}
.md-preview h3{font-size:1.2em}.md-preview h4{font-size:1.05em}
.md-preview p{margin:.6em 0}
.md-preview a{color:#0969da;text-decoration:none}.md-preview a:hover{text-decoration:underline}
.md-preview strong{font-weight:600}
.md-preview code{background:#f6f8fa;border-radius:4px;padding:.15em .4em;font-family:ui-monospace,SFMono-Regular,Consolas,Menlo,monospace;font-size:.9em}
.md-preview pre.md-code{background:#f6f8fa;border:1px solid #eaecef;border-radius:6px;padding:12px 14px;overflow:auto;line-height:1.5}
.md-preview pre.md-code code{background:transparent;padding:0;font-size:13px}
.md-preview blockquote{margin:1em 0;padding:.1em 1em;color:#57606a;border-left:4px solid #d0d7de;background:#f6f8fa55}
.md-preview ul,.md-preview ol{padding-left:2em;margin:.5em 0}
.md-preview li{margin:.2em 0}
.md-preview table{border-collapse:collapse;margin:1em 0;display:block;overflow-x:auto;max-width:100%}
.md-preview th,.md-preview td{border:1px solid #d0d7de;padding:6px 12px}
.md-preview th{background:#f6f8fa;font-weight:600}
.md-preview hr{border:none;border-top:2px solid #eaecef;margin:1.6em 0}
.md-preview img{max-width:100%}
.md-preview del{color:#6e7781}
.md-preview .math{white-space:nowrap}
.md-preview .math-block{margin:1em 0;text-align:center;font-size:1.15em;background:#fbfbff;border:1px solid #eef;border-radius:6px;padding:10px 8px;overflow-x:auto}
.md-preview .math-block .tf,.md-preview .math .tf{display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;margin:0 2px;line-height:1.15}
.md-preview .math-block .tn,.md-preview .math .tn{border-bottom:1px solid currentColor;padding:0 2px}
.md-preview .math-block .td,.md-preview .math .td{padding:0 2px}
.md-preview .tsq .trad{margin-right:2px}
.md-preview sup,.md-preview sub{font-size:.72em}
.md-preview .tt{font-style:normal}`;

/** 把渲染后的正文包装成可独立打开的 HTML 文档 */
export function wrapExportHtml(bodyHtml: string, title = 'Markdown 预览'): string {
  return [
    '<!DOCTYPE html>',
    '<html lang="zh-CN">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width,initial-scale=1" />',
    `<title>${escapeHtml(title)}</title>`,
    `<style>${MD_EXPORT_CSS}</style>`,
    '</head>',
    `<body class="md-preview">${bodyHtml}</body>`,
    '</html>',
  ].join('\n');
}
