// robots.txt 生成 - 规则组装 (纯 TS)

export type RobotsRuleKind = 'allow' | 'disallow';

export type RobotsRule = {
  /** 行内唯一 id (仅用于 React key) */
  id: string;
  kind: RobotsRuleKind;
  path: string;
};

// 常用爬虫 User-agent
export const ROBOTS_USER_AGENTS: ReadonlyArray<{ value: string; label: string }> = [
  { value: '*', label: '* (所有爬虫)' },
  { value: 'Googlebot', label: 'Googlebot (谷歌)' },
  { value: 'Baiduspider', label: 'Baiduspider (百度)' },
  { value: 'Bingbot', label: 'Bingbot (必应)' },
  { value: 'Sogou web spider', label: 'Sogou (搜狗)' },
  { value: '360Spider', label: '360Spider (360)' },
  { value: 'Bytespider', label: 'Bytespider (字节跳动)' },
  { value: 'YandexBot', label: 'YandexBot (Yandex)' },
  { value: 'DuckDuckBot', label: 'DuckDuckBot' },
  { value: 'PetalBot', label: 'PetalBot (华为)' },
  { value: 'facebookexternalhit', label: 'facebookexternalhit' },
  { value: 'Twitterbot', label: 'Twitterbot' },
];

// 生成新规则行的 id
let ruleSeq = 0;
export function newRuleId(): string {
  ruleSeq += 1;
  return 'r' + Date.now().toString(36) + ruleSeq.toString(36);
}

function validateUserAgent(userAgent: string): string {
  const ua = userAgent.trim();
  if (ua === '') throw new Error('User-agent 不能为空');
  if (/[\r\n]/.test(ua)) throw new Error('User-agent 不能包含换行符');
  return ua;
}

function validatePath(kind: RobotsRuleKind, path: string): string {
  const p = path.trim();
  if (p === '') throw new Error(`${kind === 'disallow' ? '禁止 (Disallow)' : '允许 (Allow)'} 路径不能为空`);
  if (/[\r\n]/.test(p)) throw new Error('规则路径不能包含换行符');
  if (!p.startsWith('/') && p !== '*') {
    throw new Error('规则路径必须以 "/" 开头, 如 /admin/ 或 /public/');
  }
  return p;
}

function validateSitemap(url: string): string {
  const u = url.trim();
  if (!/^https?:\/\//i.test(u)) throw new Error(`Sitemap 地址需以 http(s):// 开头: ${u}`);
  return u;
}

export type RobotsBuildOptions = {
  userAgent: string;
  /** 按添加顺序输出 (先写 Disallow 还是 Allow 不影响结果, 但工具按顺序原样输出) */
  rules: Array<RobotsRule>;
  /** 0 或多个 sitemap 地址 */
  sitemaps: Array<string>;
  /** 抓取间隔秒数, null / 0 表示不输出 Crawl-delay 行 */
  crawlDelay: number | null;
};

/**
 * 组装 robots.txt 内容 (结尾带换行)
 * 结构: User-agent 行 + 规则行 + (可选 Crawl-delay) + 空行 + Sitemap 行
 */
export function buildRobotsTxt(opts: RobotsBuildOptions): string {
  const ua = validateUserAgent(opts.userAgent);
  const lines: Array<string> = [`User-agent: ${ua}`];

  for (const rule of opts.rules) {
    const p = validatePath(rule.kind, rule.path);
    lines.push(`${rule.kind === 'disallow' ? 'Disallow' : 'Allow'}: ${p}`);
  }

  if (opts.crawlDelay !== null && opts.crawlDelay !== undefined && opts.crawlDelay > 0) {
    lines.push(`Crawl-delay: ${Math.round(opts.crawlDelay)}`);
  }

  let text = lines.join('\n');
  if (opts.sitemaps.length > 0) {
    const urls = opts.sitemaps.map((u) => `Sitemap: ${validateSitemap(u)}`);
    text += '\n\n' + urls.join('\n');
  }
  return text + '\n';
}

// 常用预设
export type RobotsPreset = {
  name: string;
  userAgent: string;
  rules: Array<Omit<RobotsRule, 'id'>>;
  crawlDelay: number | null;
};

export const ROBOTS_PRESETS: ReadonlyArray<RobotsPreset> = [
  {
    name: '示例: 禁止后台目录',
    userAgent: '*',
    rules: [
      { kind: 'disallow', path: '/admin/' },
      { kind: 'disallow', path: '/wp-admin/' },
      { kind: 'allow', path: '/public/' },
    ],
    crawlDelay: null,
  },
  {
    name: '允许全部抓取',
    userAgent: '*',
    rules: [],
    crawlDelay: null,
  },
  {
    name: '禁止全站抓取',
    userAgent: '*',
    rules: [{ kind: 'disallow', path: '/' }],
    crawlDelay: null,
  },
];
