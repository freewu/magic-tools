// HTML 标签去除 纯逻辑层
// 功能: 去掉 HTML 标签只保留文本内容并保留换行结构;
// <select> 下拉框特殊处理: 默认把每个 <option> 提取为 "value: 文本" 行
// (普通去标签会把 option 文本粘连且丢失 value, 无法还原下拉列表内容)

/** HTML 命名实体子集 (带分号, 未收录/未知实体保留原样) */
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  nbsp: '\u00a0', copy: '©', reg: '®', trade: '™', deg: '°', plusmn: '±',
  times: '×', divide: '÷', bull: '•', middot: '·', hellip: '…', permil: '‰',
  cent: '¢', pound: '£', yen: '¥', euro: '€', sect: '§', para: '¶', curren: '¤',
  laquo: '«', raquo: '»', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  ndash: '–', mdash: '—', ensp: '\u2002', emsp: '\u2003', thinsp: '\u2009', shy: '\u00ad',
  frac12: '½', frac14: '¼', frac34: '¾', sup2: '²', sup3: '³',
  agrave: 'à', aacute: 'á', acirc: 'â', atilde: 'ã', auml: 'ä', aring: 'å', aelig: 'æ',
  ccedil: 'ç', egrave: 'è', eacute: 'é', ecirc: 'ê', euml: 'ë',
  igrave: 'ì', iacute: 'í', icirc: 'î', iuml: 'ï', ntilde: 'ñ',
  ograve: 'ò', oacute: 'ó', ocirc: 'ô', otilde: 'õ', ouml: 'ö', oslash: 'ø',
  ugrave: 'ù', uacute: 'ú', ucirc: 'û', uuml: 'ü', yacute: 'ý', yuml: 'ÿ',
  szlig: 'ß',
};

const ENTITY_RE = /&(?:#x([0-9a-fA-F]+)|#(\d+)|([a-zA-Z][a-zA-Z0-9]{1,31}));?/g;

/** HTML 实体解码 (命名子集 + 十进制/十六进制数字实体) */
export function decodeEntities(s: string): string {
  return s.replace(ENTITY_RE, (whole, hex: string, dec: string, named: string) => {
    if (hex !== undefined) return codePointToString(parseInt(hex, 16));
    if (dec !== undefined) return codePointToString(parseInt(dec, 10));
    const v = NAMED_ENTITIES[named.toLowerCase()];
    return v ?? whole;
  });
}

function codePointToString(cp: number): string {
  if (cp === 0 || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) return '\ufffd';
  try {
    return String.fromCodePoint(cp);
  } catch {
    return '\ufffd';
  }
}

/** 块级标签: 边界处插入换行, 保证段落/列表/表格结构分行保留 */
const BLOCK_TAGS = new Set([
  'address', 'article', 'aside', 'blockquote', 'body', 'caption', 'dd', 'details',
  'dialog', 'dir', 'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer',
  'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'html',
  'legend', 'li', 'main', 'menu', 'nav', 'ol', 'p', 'section', 'summary', 'table',
  'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'ul',
]);

/** 行内紧凑块: 仅开始标签产生换行 (列表项等, 逐项紧挨分行) */
const COMPACT_BLOCK_TAGS = new Set(['li', 'dt', 'dd', 'option']);

/** 内容整体丢弃的标签 (非页面可见文本) */
const SKIP_TAGS = new Set([
  'script', 'style', 'noscript', 'template', 'iframe', 'object', 'embed',
  'canvas', 'svg', 'math', 'map', 'audio', 'video', 'source', 'track',
  'head', 'title', 'meta', 'link', 'base', 'wbr',
]);

/** 行内文本原样保留的标签 (textarea/pre 内容保留内部换行与空白) */
const RAW_TEXT_TAGS = new Set(['textarea', 'pre']);

export interface StripOptions {
  /** select/option 是否显示为 "value: 文本"; false 时仅输出选项文本 */
  selectValue?: boolean;
}

const OPEN_TAG_END_RE = /<option\b[^>]*>/i;
const NEXT_OPTION_BOUND_RE = /<\/?(?:option|optgroup|select)\b[^>]*>/i;
const VALUE_ATTR_RE = /value\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;

/** 从 option 开标签中取 value 属性值; 无属性返回 null */
function optionValue(tag: string): string | null {
  const m = VALUE_ATTR_RE.exec(tag);
  if (!m) return null;
  const raw = m[1] ?? m[2] ?? m[3] ?? '';
  const v = decodeEntities(raw);
  return v === '' ? null : v;
}

/** 剥除行内残留标签 + 实体解码 + 空白折叠 */
function cleanInline(s: string): string {
  return decodeEntities(s.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
}

/** 提取 select 内部全部 option 为行 (支持 option 未闭合的写法) */
function extractSelectOptions(seg: string, withValue: boolean): string[] {
  const lines: string[] = [];
  let pos = 0;
  for (;;) {
    const open = OPEN_TAG_END_RE.exec(seg.slice(pos));
    if (!open) break;
    const openStart = pos + open.index;
    const tag = open[0];
    const textStart = openStart + tag.length;
    const rest = seg.slice(textStart);
    const close = NEXT_OPTION_BOUND_RE.exec(rest);
    const inner = close ? rest.slice(0, close.index) : rest;
    const text = cleanInline(inner);
    const value = withValue ? optionValue(tag) : null;
    if (text !== '' || value !== null) {
      lines.push(value !== null && text !== '' ? `${value}: ${text}` : text !== '' ? text : String(value));
    }
    if (!close) break;
    if (close[0][1] === '/') {
      // </option>/</optgroup>/</select>: 本 option 结束, 继续向后找
      pos = textStart + close.index + close[0].length;
    } else {
      // 下一个 <option> 开标签 (隐式闭合写法): 回退到该开标签起点, 由下一轮处理
      pos = textStart + close.index;
    }
  }
  return lines;
}

/** HTML → 纯文本 */
export function htmlToPlainText(input: string, opts: StripOptions = {}): string {
  const withValue = opts.selectValue ?? true;
  const html = String(input ?? '');
  if (!html) return '';
  const lower = html.toLowerCase();
  const len = html.length;
  const tokens: string[] = [];
  let i = 0;

  const pushText = (s: string) => {
    tokens.push(decodeEntities(s).replace(/\s+/g, ' '));
  };

  while (i < len) {
    const lt = html.indexOf('<', i);
    if (lt === -1) {
      pushText(html.slice(i));
      break;
    }
    if (lt > i) pushText(html.slice(i, lt));

    if (html.startsWith('<!--', lt)) {
      const e = html.indexOf('-->', lt + 4);
      i = e === -1 ? len : e + 3;
      continue;
    }
    if (html.startsWith('<![CDATA[', lt)) {
      const e = html.indexOf(']]>', lt + 9);
      i = e === -1 ? len : e + 3;
      continue;
    }
    if (html[lt + 1] === '!' || html[lt + 1] === '?') {
      const e = html.indexOf('>', lt);
      i = e === -1 ? len : e + 1;
      continue;
    }

    const isClose = html[lt + 1] === '/';
    let ns = lt + (isClose ? 2 : 1);
    let ne = ns;
    while (ne < len && /[a-zA-Z0-9]/.test(html[ne])) ne += 1;
    const name = html.slice(ns, ne).toLowerCase();
    if (!name) {
      i = lt + 1;
      continue;
    }

    // select: 提取 option 行; script/style 等: 内容整体丢弃
    if (!isClose && (name === 'select' || SKIP_TAGS.has(name))) {
      const gt = html.indexOf('>', ne);
      if (name === 'select') {
        const bodyStart = gt === -1 ? ne : gt + 1;
        const segEndIdx = lower.indexOf('</select', bodyStart);
        const seg = html.slice(bodyStart, segEndIdx === -1 ? len : segEndIdx);
        const optionLines = extractSelectOptions(seg, withValue);
        if (optionLines.length > 0) tokens.push('\n', optionLines.join('\n'), '\n');
        if (segEndIdx === -1) {
          i = len;
        } else {
          const closeGt = html.indexOf('>', segEndIdx);
          i = closeGt === -1 ? len : closeGt + 1;
        }
      } else {
        const closeTag = `</${name}`;
        const ce = lower.indexOf(closeTag, gt === -1 ? ne : gt + 1);
        if (ce === -1) {
          i = len;
        } else {
          const closeGt = html.indexOf('>', ce);
          i = closeGt === -1 ? len : closeGt + 1;
        }
      }
      continue;
    }

    // textarea/pre: 内容作为文本保留
    if (!isClose && RAW_TEXT_TAGS.has(name)) {
      const gt = html.indexOf('>', ne);
      const bodyStart = gt === -1 ? ne : gt + 1;
      const ce = lower.indexOf(`</${name}`, bodyStart);
      const content = decodeEntities(html.slice(bodyStart, ce === -1 ? len : ce)).trim();
      if (content) tokens.push('\n', content, '\n');
      if (ce === -1) {
        i = len;
      } else {
        const closeGt = html.indexOf('>', ce);
        i = closeGt === -1 ? len : closeGt + 1;
      }
      continue;
    }

    if (!isClose && name === 'br') {
      tokens.push('\n');
    } else if (BLOCK_TAGS.has(name)) {
      if (isClose && COMPACT_BLOCK_TAGS.has(name)) {
        // 紧凑块结束不额外换行 (避免 li/li 之间出现空行)
      } else {
        tokens.push('\n');
      }
    }
    // 其它行内标签直接忽略
    const gt = html.indexOf('>', ne);
    i = gt === -1 ? len : gt + 1;
  }

  // 后处理: 行 trim、连续空行压成至多 1 个、首尾去空行 (保留段落结构换行)
  const lines: string[] = [];
  for (const rawLine of tokens.join('').split('\n')) {
    const t = rawLine.trim();
    if (t === '') {
      if (lines.length > 0 && lines[lines.length - 1] !== '') lines.push('');
      continue;
    }
    lines.push(t);
  }
  while (lines[0] === '') lines.shift();
  while (lines[lines.length - 1] === '') lines.pop();
  return lines.join('\n');
}
