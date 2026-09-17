// Whois 查询 - 纯逻辑 (无网络 / DOM 依赖, 便于单元测试)

/** 一跳 Whois 响应 (对应 Rust 侧 WhoisSection) */
export type WhoisSection = {
  server: string;
  text: string;
  note: string | null;
};

/** Whois 查询结果 (对应 Rust 侧 WhoisResult, serde camelCase) */
export type WhoisResult = {
  query: string;
  /** domain / ipv4 / ipv6 */
  kind: string;
  sections: WhoisSection[];
};

/** 一条 Whois 字段 (键原样保留, 比较时忽略大小写) */
export type WhoisField = {
  key: string;
  value: string;
};

/** 关键信息行的展示形态: tags = 逐条标签展示 (名称服务器 / 域名状态) */
export type WhoisSummaryItem = {
  label: string;
  values: string[];
  kind: 'text' | 'tags';
};

/**
 * 关键字段表: label 为展示名 (可翻译), keys 为各注册局的常见键名 (小写比较)
 * 同一个 label 下的多个键会依次匹配 (如 expires / expiry date / paid-till 表示同一含义)
 */
export const WHOIS_KEY_FIELDS: ReadonlyArray<{
  label: string;
  keys: readonly string[];
  kind?: 'text' | 'tags';
}> = [
  { label: '域名', keys: [ 'domain name', 'domain' ] },
  { label: '注册商', keys: [ 'registrar', 'sponsoring registrar' ] },
  { label: '注册商 Whois 服务器', keys: [ 'registrar whois server', 'whois server' ] },
  { label: '注册商网址', keys: [ 'registrar url', 'registrar url (http)' ] },
  { label: '注册时间', keys: [ 'creation date', 'created', 'created on', 'registered on', 'registered', 'registration time', 'domain registration date' ] },
  { label: '更新时间', keys: [ 'updated date', 'last updated', 'last modified', 'changed', 'modified' ] },
  { label: '到期时间', keys: [ 'registry expiry date', 'expiration date', 'expiry date', 'expires', 'expire date', 'paid-till', 'registrar registration expiration date' ] },
  { label: '域名状态', keys: [ 'domain status', 'status' ], kind: 'tags' },
  { label: '名称服务器', keys: [ 'name server', 'nserver', 'nameserver' ], kind: 'tags' },
  { label: 'DNSSEC', keys: [ 'dnssec' ] },
  // IP / ASN (RIR 返回)
  { label: '地址段', keys: [ 'netrange', 'inetnum', 'inet6num' ] },
  { label: 'CIDR', keys: [ 'cidr', 'route' ] },
  { label: '网络名称', keys: [ 'netname', 'net name' ] },
  { label: '所属机构', keys: [ 'orgname', 'org-name', 'org', 'organisation', 'organization', 'owner' ] },
  { label: '国家/地区', keys: [ 'country' ] },
  { label: '描述', keys: [ 'descr', 'description' ] },
  { label: '滥用举报邮箱', keys: [ 'orgabuseemail', 'abuse-mailbox', 'abuse contact email', 'org abuse email' ] },
  { label: '注册人', keys: [ 'registrant name', 'registrant organization', 'registrant country', 'registrant email' ] },
];

// ---------------------------------------------------------------------------
// 输入归一化 / 校验 (与 Rust 侧 normalize_query 保持一致的口径)
// ---------------------------------------------------------------------------
const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/** 判断查询对象类型 */
export function guessKind(input: string): 'domain' | 'ipv4' | 'ipv6' {
  const text = input.trim();
  if (isIpv4(text)) return 'ipv4';
  if (isIpv6(text)) return 'ipv6';
  return 'domain';
}

/** 宽松的 IPv4 判断 (每段 0-255) */
export function isIpv4(text: string): boolean {
  const m = IPV4.exec(text.trim());
  if (!m) return false;
  for (let i = 1; i <= 4; i++) {
    const n = Number(m[i]);
    if (!Number.isInteger(n) || n < 0 || n > 255) return false;
  }
  return true;
}

/** 宽松的 IPv6 判断 (支持 :: 缩写与内嵌 IPv4) */
export function isIpv6(text: string): boolean {
  const t = text.trim();
  if (!t.includes(':') || !/^[0-9a-fA-F:.]+$/.test(t)) return false;
  if ((t.match(/::/g) ?? []).length > 1) return false;
  const parts = t.split(':');
  const groups = parts.filter((p) => p !== '');
  const groupsOk = groups.every((g) => /^[0-9a-fA-F]{1,4}$/.test(g) || isIpv4(g));
  if (!groupsOk) return false;
  // 未使用 :: 缩写时必须正好 8 段
  return t.includes('::') || parts.length === 8;
}

/**
 * 归一化查询输入: 去掉协议头 / 路径 / 端口 / 结尾点并转小写
 * (IP 地址原样返回, 不做小写处理以外的改动)
 */
export function normalizeQuery(input: string): string {
  let text = (input || '').trim();
  if (text === '') return '';
  if (isIpv4(text) || isIpv6(text)) return text;

  text = text.replace(/^(whois|https?):\/\//i, '');
  const cut = text.search(/[/?#]/);
  if (cut >= 0) text = text.slice(0, cut);
  // 只在结尾是纯数字端口时截断, 避免误伤 (IPv6 已在上面提前返回)
  text = text.replace(/:\d+$/, '');
  return text.trim().replace(/\.+$/, '').toLowerCase();
}

/**
 * 校验查询输入 (先归一化)
 * @returns '' 表示合法, 否则返回中文提示 (由调用方翻译)
 */
export function validateQuery(input: string): string {
  const text = normalizeQuery(input);
  if (text === '') return '请输入域名或 IP 地址';
  if (isIpv4(text)) return '';
  if (guessKind(text) === 'ipv6') {
    return isIpv6(text) ? '' : 'IP 地址格式不正确';
  }
  if (!/^[\x20-\x7e]+$/.test(text)) return '暂不支持中文域名, 请使用 Punycode 形式 (如 xn--fiq228c.com)';
  if (text.length > 253) return '域名长度超出限制 (最长 253 个字符)';
  if (!text.includes('.')) return '请输入完整域名 (如 example.com)';
  for (const label of text.split('.')) {
    if (label.length === 0 || label.length > 63) return '域名格式不正确';
    if (label.startsWith('-') || label.endsWith('-')) return '域名格式不正确';
    if (!/^[a-z0-9_-]+$/.test(label)) return '域名格式不正确';
  }
  return '';
}

// ---------------------------------------------------------------------------
// 响应文本解析
// ---------------------------------------------------------------------------
/** 是否为注释 / 提示行 (% = RIPE, # = ARIN, >>> = Verisign 声明) */
function isCommentLine(line: string): boolean {
  const t = line.trimStart();
  return t.startsWith('%') || t.startsWith('#') || t.startsWith('>>>') || t.startsWith('--');
}

/**
 * 解析 Whois 响应为字段列表
 * - 忽略注释行 (% = RIPE, # = ARIN, >>> = Verisign 声明) 与免责声明行
 * - 注册局输出普遍带缩进 (如 Verisign 三个空格), 因此只以「键: 值」形式判定字段;
 *   无冒号的缩进续行 / 说明行会被自动忽略 (原文可在原始结果中查看)
 * - 键名保留原样, 值做首尾裁剪
 */
export function parseWhoisFields(text: string): WhoisField[] {
  const out: WhoisField[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, '');
    if (line.trim() === '' || isCommentLine(line)) continue;
    const m = /^\s*([A-Za-z][A-Za-z0-9 ._/-]{0,48}?)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = m[1].trim();
    const value = m[2].trim();
    if (key === '' || value === '') continue;
    out.push({ key, value });
  }
  return out;
}

/** 按键名取全部值 (忽略大小写, 保持出现顺序, 去重) */
export function fieldValues(fields: readonly WhoisField[], keys: readonly string[]): string[] {
  const wanted = keys.map((k) => k.toLowerCase());
  const values: string[] = [];
  for (const f of fields) {
    if (!wanted.includes(f.key.toLowerCase())) continue;
    if (!values.includes(f.value)) values.push(f.value);
  }
  return values;
}

/** 按关键字段表生成关键信息 (无值的字段跳过) */
export function summarizeWhois(fields: readonly WhoisField[]): WhoisSummaryItem[] {
  const items: WhoisSummaryItem[] = [];
  for (const def of WHOIS_KEY_FIELDS) {
    const values = fieldValues(fields, def.keys);
    if (values.length === 0) continue;
    items.push({ label: def.label, values, kind: def.kind ?? 'text' });
  }
  return items;
}

/** 名称服务器列表 (去掉结尾点并转大写去重) */
export function nameServers(fields: readonly WhoisField[]): string[] {
  const out: string[] = [];
  for (const v of fieldValues(fields, [ 'name server', 'nserver', 'nameserver' ])) {
    const name = v.replace(/\.+$/, '').toUpperCase();
    if (name !== '' && !out.includes(name)) out.push(name);
  }
  return out;
}

/** 域名状态列表 (去掉来源网址等多余空格) */
export function domainStatuses(fields: readonly WhoisField[]): string[] {
  return fieldValues(fields, [ 'domain status', 'status' ]).map((s) => s.replace(/\s+/g, ' ').trim());
}

/** 关键信息 -> 文本 (供复制) */
export function summaryToText(items: readonly WhoisSummaryItem[]): string {
  return items.map((it) => `${it.label}: ${it.values.join('; ')}`).join('\n');
}

/** 汇总所有分段的字段 (跳数失败的分段文本为空) */
export function allFields(sections: readonly WhoisSection[]): WhoisField[] {
  return sections.flatMap((s) => parseWhoisFields(s.text));
}

/** 结果类型 -> 中文说明 (由调用方翻译) */
export function kindText(kind: string): string {
  if (kind === 'ipv4') return 'IPv4 地址';
  if (kind === 'ipv6') return 'IPv6 地址';
  return '域名';
}
