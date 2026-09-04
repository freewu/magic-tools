// 网页 TDK 信息检测 - HTML 解析 (纯 TS, 无 DOM 依赖, 便于单元测试)

// TDK 建议长度上限 (字符数): 超过上限提示过长
export const TDK_LIMITS = {
  title: 80,        // 标题 (Title) 一般不超过 80 个字符
  keywords: 100,    // 关键词 (Keywords) 一般不超过 100 个字符
  description: 200, // 描述 (Description) 一般不超过 200 个字符
} as const;

export type TdkField = 'title' | 'keywords' | 'description';

// 字段展示配置
export const TDK_FIELDS: ReadonlyArray<{
  field: TdkField;
  label: string;
  limit: number;
  emptyTip: string;
}> = [
  {
    field: 'title',
    label: '标题 Title',
    limit: TDK_LIMITS.title,
    emptyTip: '缺少 <title> 标签, 建议补充, 有助于搜索引擎确定页面主题',
  },
  {
    field: 'keywords',
    label: '关键词 KeyWords',
    limit: TDK_LIMITS.keywords,
    emptyTip: '缺少 <meta name="keywords">, 部分搜索引擎仍会参考',
  },
  {
    field: 'description',
    label: '描述 Description',
    limit: TDK_LIMITS.description,
    emptyTip: '缺少 <meta name="description">, 建议补充以提升搜索结果摘要展示',
  },
];

// ---------------------------------------------------------------------------
// HTML 实体解码
// ---------------------------------------------------------------------------
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0',
  copy: '\u00a9', reg: '\u00ae', trade: '\u2122', hellip: '\u2026',
  mdash: '\u2014', ndash: '\u2013', ldquo: '\u201c', rdquo: '\u201d',
  lsquo: '\u2018', rsquo: '\u2019', middot: '\u00b7', bull: '\u2022',
  times: '\u00d7', divide: '\u00f7', plusmn: '\u00b1', deg: '\u00b0',
  eacute: '\u00e9', egrave: '\u00e8', aacute: '\u00e1', agrave: '\u00e0',
  uuml: '\u00fc', ouml: '\u00f6', auml: '\u00e4', szlig: '\u00df',
  iexcl: '\u00a1', iquest: '\u00bf', laquo: '\u00ab', raquo: '\u00bb',
  sect: '\u00a7', para: '\u00b6', cent: '\u00a2', pound: '\u00a3',
  yen: '\u00a5', euro: '\u20ac',
};

// 解码 HTML 实体 (&amp; / &lt; / &#39; / &#x4e2d; 等)
export function decodeHtmlEntities(text: string): string {
  if (!text.includes('&')) return text;
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (raw, body: string) => {
    if (body[0] === '#') {
      const hex = body[1] === 'x' || body[1] === 'X';
      const code = parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
      if (Number.isNaN(code) || code < 0 || code > 0x10ffff) return raw;
      try {
        return String.fromCodePoint(code);
      } catch {
        return raw;
      }
    }
    const named = NAMED_ENTITIES[body.toLowerCase()];
    return named === undefined ? raw : named;
  });
}

// ---------------------------------------------------------------------------
// 标签属性提取
// ---------------------------------------------------------------------------
// 读取标签中某个属性的值 (兼容双引号 / 单引号 / 无引号)
function readAttr(tag: string, attr: string): string {
  const re = new RegExp(`\\b${attr}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`, 'i');
  const m = re.exec(tag);
  if (!m) return '';
  return m[1] ?? m[2] ?? m[3] ?? '';
}

// 提取 <title> 内容 (取第一个, 折叠内部空白并解码实体)
export function extractTitle(html: string): string {
  const m = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(html);
  if (!m) return '';
  return decodeHtmlEntities(m[1]).replace(/\s+/g, ' ').trim();
}

// 提取第一个 name=xxx 的 meta 标签的 content 内容
export function extractMetaContent(html: string, name: string): string {
  const tagRe = /<meta\b[^>]*>/gi;
  const target = name.toLowerCase();
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(html)) !== null) {
    const tag = m[0];
    if (readAttr(tag, 'name').toLowerCase() === target) {
      return decodeHtmlEntities(readAttr(tag, 'content')).replace(/\s+/g, ' ').trim();
    }
  }
  return '';
}

// 解析整个页面的 TDK 信息
export type TdkResult = {
  title: string;
  keywords: string;
  description: string;
};

export function parseTdk(html: string): TdkResult {
  return {
    title: extractTitle(html),
    keywords: extractMetaContent(html, 'keywords'),
    description: extractMetaContent(html, 'description'),
  };
}

// ---------------------------------------------------------------------------
// 长度检测 (按字符计数, 中文/英文均计 1 个字符)
// ---------------------------------------------------------------------------
// 字符数: 按 Unicode 码点计数 (代理对如 emoji 算 1 个字符)
export function countChars(text: string): number {
  return Array.from(text).length;
}

export type TdkCheckStatus = 'empty' | 'ok' | 'over';

export type TdkFieldCheck = {
  length: number;
  limit: number;
  status: TdkCheckStatus;
  /** 相对上限的进度百分比 (0-100, 超过上限封顶 100) */
  percent: number;
};

// 检测单字段长度
export function checkTdkField(text: string, limit: number): TdkFieldCheck {
  const length = countChars(text);
  let status: TdkCheckStatus;
  if (length === 0) status = 'empty';
  else if (length > limit) status = 'over';
  else status = 'ok';
  return { length, limit, status, percent: Math.min(100, Math.round((length / limit) * 100)) };
}
