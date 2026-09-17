// DNS 查询 - 纯逻辑 (无网络 / DOM 依赖, 便于单元测试)

/** 界面支持的记录类型 (与 Rust 侧 parse_record_type 一致) */
export const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'NS'] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

/** 记录类型下拉框的「全部」选项值 */
export const ALL_RECORD_TYPES = 'ALL';

/** 记录类型排序权重 (返回值越大越靠后, 未知类型排最后) */
const TYPE_ORDER: Record<string, number> = {
  A: 0, AAAA: 1, CNAME: 2, MX: 3, TXT: 4, SRV: 5, NS: 6, SOA: 7, PTR: 8, CAA: 9,
};

/** 一条 DNS 记录 (对应 Rust 侧 DnsRecord) */
export type DnsRecord = {
  name: string;
  recordType: string;
  ttl: number;
  value: string;
};

/** DNS 查询结果 (对应 Rust 侧 DnsQueryResult, serde camelCase) */
export type DnsQueryResult = {
  /** ok / nxdomain / nodata (前端补充 error: 该类型查询失败) */
  status: string;
  records: DnsRecord[];
  elapsedMs: number;
  server: string;
  message: string | null;
};

/** 一次查询的结果: 记录类型 + 查询结果 (Rust 返回体不含查询类型, 由前端附带) */
export type DnsTypeResult = {
  /** 本次查询的记录类型 */
  recordType: string;
  result: DnsQueryResult;
};

/** 常用公共 DNS 服务器 ('system' = 使用系统配置) */
export const DNS_SERVERS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'system', label: '系统默认' },
  { value: '223.5.5.5', label: '223.5.5.5 (阿里 DNS)' },
  { value: '119.29.29.29', label: '119.29.29.29 (腾讯 DNS)' },
  { value: '114.114.114.114', label: '114.114.114.114 (114 DNS)' },
  { value: '8.8.8.8', label: '8.8.8.8 (Google DNS)' },
  { value: '1.1.1.1', label: '1.1.1.1 (Cloudflare DNS)' },
];

/** 记录类型排序权重 */
export function typeOrder(recordType: string): number {
  return TYPE_ORDER[recordType.toUpperCase()] ?? 99;
}

/**
 * 归一化用户输入的域名
 * 支持直接粘贴网址: 去掉协议 / 路径 / 查询串 / 用户名 / 端口, 去掉结尾的点并转小写
 */
export function normalizeName(input: string): string {
  let s = (input || '').trim();
  if (s === '') return '';
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//i, ''); // 协议
  s = s.split(/[/?#]/)[0];                        // 路径 / 查询 / 锚点
  const at = s.lastIndexOf('@');                  // user@host
  if (at >= 0) s = s.slice(at + 1);
  s = s.trim().toLowerCase();
  if (!s.startsWith('[')) {
    const m = /^(.+?):(\d+)$/.exec(s);            // 端口
    if (m) s = m[1];
  }
  return s.replace(/\.+$/, '');
}

/**
 * 校验归一化后的域名
 * @returns '' 表示合法; 否则返回中文错误提示 (由调用方翻译)
 */
export function validateName(name: string): string {
  if (name === '') return '请输入要查询的域名';
  if (name.length > 253) return '域名长度不能超过 253 个字符';
  for (const label of name.split('.')) {
    if (label.length === 0) return '域名格式不正确';
    if (label.length > 63) return '域名标签长度不能超过 63 个字符';
    // 下划线 (如 _dmarc / _sip._tcp) 与通配符 * 在 DNS 里合法, 一并放行
    if (!/^[a-z0-9_*-]+$/.test(label)) return '域名格式不正确';
  }
  return '';
}

/**
 * 排序并去重记录: 先按记录类型 (A / AAAA / ...), 再按记录值;
 * 同类型同值仅保留 TTL 最小的一条 (不同服务器 / SOA 附带记录可能重复)
 */
export function sortRecords(records: readonly DnsRecord[]): DnsRecord[] {
  const map = new Map<string, DnsRecord>();
  for (const rec of records) {
    const key = `${rec.recordType.toUpperCase()}|${rec.value}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, rec);
      continue;
    }
    if (rec.ttl < prev.ttl) map.set(key, { ...prev, ttl: rec.ttl });
  }
  return [ ...map.values() ].sort((a, b) => {
    const d = typeOrder(a.recordType) - typeOrder(b.recordType);
    return d !== 0 ? d : a.value.localeCompare(b.value);
  });
}

/** TTL 紧凑展示 (300s / 10m / 1h30m / 2d3h), 与 dig 风格一致, 无需多语言 */
export function formatTtl(ttl: number): string {
  const n = Number.isFinite(ttl) ? Math.max(0, Math.floor(ttl)) : 0;
  if (n < 60) return `${n}s`;
  const d = Math.floor(n / 86400);
  const h = Math.floor((n % 86400) / 3600);
  const m = Math.floor((n % 3600) / 60);
  const s = n % 60;
  if (d > 0) return h > 0 ? `${d}d${h}h` : `${d}d`;
  if (h > 0) return m > 0 ? `${h}h${m}m` : `${h}h`;
  return s > 0 ? `${m}m${s}s` : `${m}m`;
}

/** 记录列表 -> 制表符分隔文本 (供复制) */
export function recordsToText(records: readonly DnsRecord[]): string {
  return records.map((r) => [ r.name, r.recordType, r.ttl, r.value ].join('\t')).join('\n');
}

/** 结果状态 -> 中文提示 (由调用方翻译) */
export function statusText(status: string): string {
  if (status === 'ok') return '查询成功';
  if (status === 'nxdomain') return '域名不存在 (NXDOMAIN)';
  if (status === 'error') return '查询失败';
  return '该记录类型无数据 (NODATA)';
}

/** 状态标签配色 (antd Tag color) */
export function statusColor(status: string): string {
  if (status === 'ok') return 'success';
  if (status === 'error') return 'error';
  if (status === 'nxdomain') return 'warning';
  return 'default';
}

/** 多类型查询结果汇总 */
export type DnsSummary = {
  /** 记录总数 (去重后由调用方自行 sortRecords) */
  total: number;
  /** 全部类型是否都没有数据 */
  empty: boolean;
  /** 最慢一次的耗时 (毫秒) */
  elapsedMs: number;
  /** 服务器列表 (去重) */
  servers: string[];
};

/** 汇总「查询全部」的多条结果 */
export function summarizeResults(results: readonly DnsTypeResult[]): DnsSummary {
  const servers: string[] = [];
  let total = 0;
  let elapsedMs = 0;
  let hasData = false;
  for (const item of results) {
    const r = item.result;
    total += r.records.length;
    if (r.records.length > 0) hasData = true;
    if (r.elapsedMs > elapsedMs) elapsedMs = r.elapsedMs;
    if (r.server !== '' && !servers.includes(r.server)) servers.push(r.server);
  }
  return { total, empty: !hasData, elapsedMs, servers };
}
