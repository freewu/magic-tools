// MTR 查询 - 纯逻辑 (探测编排 / 统计计算), 网络能力由注入的 probe 提供, 便于单元测试

/** 单次探测结果 (对应 Rust 侧 MtrProbeReply, serde camelCase) */
export type MtrProbeReply = {
  ttl: number;
  /** reply / ttlExpired / unreachable / timeout */
  status: string;
  ok: boolean;
  rttMs: number | null;
  addr: string | null;
  detail: string | null;
  reached: boolean;
  elapsedMs: number;
};

/** 目标解析结果 (对应 Rust 侧 MtrResolvedTarget) */
export type MtrResolvedTarget = {
  input: string;
  address: string;
  /** ipv4 / ipv6 / literal */
  kind: string;
  hasIpv4: boolean;
  isLiteral: boolean;
};

/** 一次探测的完整记录 (reply 为 null 表示探测过程本身出错) */
export type ProbeEntry = {
  reply: MtrProbeReply | null;
  error: string | null;
};

/** 逐跳统计行 */
export type MtrHop = {
  ttl: number;
  /** 反向解析名称 (未开启或解析失败时等于 addr) */
  host: string | null;
  addr: string | null;
  /** reached / ttlExpired / unreachable / timeout / error */
  state: string;
  detail: string | null;
  reached: boolean;
  /** 发包数 */
  snt: number;
  /** 收到应答数 */
  recv: number;
  /** 丢包率 (0-100, 保留 1 位小数) */
  loss: number;
  last: number | null;
  avg: number | null;
  best: number | null;
  worst: number | null;
  /** 网络抖动: 相邻收到应答的 RTT 差的平均值 */
  jitter: number | null;
};

export const MIN_HOPS = 1;
export const MAX_HOPS_LIMIT = 64;

/** 默认参数 (与 mtr 常用默认值对齐) */
export const DEFAULT_MTR_OPTIONS = {
  maxHops: 30,
  rounds: 10,
  timeoutMs: 1000,
  intervalMs: 1000,
  resolveNames: true,
};

export const TIMEOUT_OPTIONS = [ 200, 500, 1000, 2000, 5000 ];
export const INTERVAL_OPTIONS = [ 200, 500, 1000, 2000 ];

// ---------------------------------------------------------------------------
// 数值格式化
// ---------------------------------------------------------------------------
/** 保留 1 位小数 */
export function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

/** RTT 展示: 无数据为 '-' */
export function formatRtt(v: number | null | undefined): string {
  return v === null || v === undefined || !Number.isFinite(v) ? '-' : `${v.toFixed(1)} ms`;
}

/** 丢包率展示 */
export function formatLoss(loss: number): string {
  return `${loss.toFixed(1)}%`;
}

/** 丢包率 -> antd Tag 颜色 */
export function lossColor(loss: number): string {
  if (loss <= 0) return 'green';
  if (loss < 50) return 'gold';
  return 'red';
}

/** 跳状态 -> 颜色 */
export function stateColor(state: string): string {
  switch (state) {
    case 'reached': return 'green';
    case 'ttlExpired': return 'blue';
    case 'unreachable': return 'red';
    case 'error': return 'red';
    default: return 'default';
  }
}

/** 跳状态 -> 中文文案 (由调用方翻译) */
export function stateText(state: string): string {
  switch (state) {
    case 'reached': return '已到达';
    case 'ttlExpired': return '转发中';
    case 'unreachable': return '不可达';
    case 'error': return '探测异常';
    default: return '超时';
  }
}

/** 目标类型 -> 中文文案 */
export function kindText(kind: string): string {
  if (kind === 'ipv4') return 'IPv4 地址';
  if (kind === 'ipv6') return 'IPv6 地址';
  return 'IP 地址';
}

// ---------------------------------------------------------------------------
// 输入归一化 / 校验
// ---------------------------------------------------------------------------
const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

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
  if (!groups.every((g) => /^[0-9a-fA-F]{1,4}$/.test(g) || isIpv4(g))) return false;
  return t.includes('::') || parts.length === 8;
}

/** 归一化目标输入: 去掉协议头与路径 */
export function normalizeHost(input: string): string {
  let text = (input || '').trim();
  if (text === '') return '';
  if (isIpv4(text) || isIpv6(text)) return text;
  text = text.replace(/^(https?|tcp|udp):\/\//i, '');
  const cut = text.search(/[/?#]/);
  if (cut >= 0) text = text.slice(0, cut);
  return text.trim().replace(/\.+$/, '');
}

/**
 * 校验目标输入
 * @returns '' 表示合法, 否则返回中文提示
 */
export function validateHost(input: string): string {
  const text = normalizeHost(input);
  if (text === '') return '请输入域名或 IP 地址';
  if (isIpv4(text) || isIpv6(text)) return '';
  if (!/^[\x20-\x7e]+$/.test(text)) return '暂不支持中文域名, 请使用 Punycode 形式';
  if (text.length > 253) return '域名长度超出限制 (最长 253 个字符)';
  if (!text.includes('.')) return '请输入完整域名 (如 example.com)';
  for (const label of text.split('.')) {
    if (label.length === 0 || label.length > 63) return '域名格式不正确';
    if (!/^[a-z0-9_-]+$/i.test(label) || label.startsWith('-') || label.endsWith('-')) return '域名格式不正确';
  }
  return '';
}

// ---------------------------------------------------------------------------
// 参数裁剪
// ---------------------------------------------------------------------------
/** 统一裁剪: 空值 / 非法值回退默认值, 否则夹到 [min, max] */
function clampNumber(v: number | null | undefined, min: number, max: number, fallback: number): number {
  if (v === null || v === undefined || (typeof v === 'number' && !Number.isFinite(v))) return fallback;
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** 最大跳数裁剪到 1-64 */
export function clampMaxHops(v: number | null | undefined): number {
  return clampNumber(v, MIN_HOPS, MAX_HOPS_LIMIT, DEFAULT_MTR_OPTIONS.maxHops);
}

/** 轮次裁剪到 1-100 */
export function clampRounds(v: number | null | undefined): number {
  return clampNumber(v, 1, 100, DEFAULT_MTR_OPTIONS.rounds);
}

/** 超时裁剪到 100-10000ms (与后端 MIN/MAX_TIMEOUT_MS 一致) */
export function clampTimeout(v: number | null | undefined): number {
  return clampNumber(v, 100, 10000, DEFAULT_MTR_OPTIONS.timeoutMs);
}

/** 间隔裁剪到 100-10000ms */
export function clampInterval(v: number | null | undefined): number {
  return clampNumber(v, 100, 10000, DEFAULT_MTR_OPTIONS.intervalMs);
}

// ---------------------------------------------------------------------------
// 统计
// ---------------------------------------------------------------------------
/**
 * 汇总某一跳的全部探测记录
 * @param ttl 跳数
 * @param probes 按时间顺序的探测记录
 * @param names 地址 -> 反向解析名称
 */
export function summarizeHop(
  ttl: number,
  probes: readonly ProbeEntry[],
  names?: ReadonlyMap<string, string>,
): MtrHop {
  const replies = probes
    .map((p) => p.reply)
    .filter((r): r is MtrProbeReply => r !== null);

  const rtts: number[] = [];
  let addr: string | null = null;
  let last: number | null = null;
  let detail: string | null = null;
  let reached = false;
  for (const r of replies) {
    if (r.addr) addr = r.addr;
    if (r.rttMs !== null && Number.isFinite(r.rttMs)) {
      rtts.push(r.rttMs);
      last = r.rttMs;
    }
    if (r.reached) reached = true;
    if (r.detail) detail = r.detail;
  }

  const snt = probes.length;
  const recv = rtts.length;
  const loss = snt === 0 ? 0 : round1(((snt - recv) / snt) * 100);
  const avg = recv === 0 ? null : round1(rtts.reduce((a, b) => a + b, 0) / recv);
  const best = recv === 0 ? null : round1(Math.min(...rtts));
  const worst = recv === 0 ? null : round1(Math.max(...rtts));

  // 抖动: 相邻两次收到应答的 RTT 差的绝对值平均
  let jitter: number | null = null;
  if (rtts.length >= 2) {
    let sum = 0;
    for (let i = 1; i < rtts.length; i++) sum += Math.abs(rtts[i] - rtts[i - 1]);
    jitter = round1(sum / (rtts.length - 1));
  }

  const lastReply = replies.length > 0 ? replies[replies.length - 1] : null;
  const firstError = probes.find((p) => p.error !== null)?.error ?? null;
  const state = reached
    ? 'reached'
    : lastReply
      ? lastReply.status
      : 'error';

  return {
    ttl,
    host: addr ? (names?.get(addr) ?? addr) : null,
    addr,
    state,
    detail: reached ? null : (lastReply?.detail ?? firstError),
    reached,
    snt,
    recv,
    loss,
    last,
    avg,
    best,
    worst,
    jitter,
  };
}

/** 目标是否已在本轮/历史中被到达 */
export function reachedTtl(hops: readonly MtrHop[]): number | null {
  const hit = hops.find((h) => h.reached);
  return hit ? hit.ttl : null;
}

/** 存在丢包的跳 (用于汇总提示) */
export function lossyHops(hops: readonly MtrHop[]): MtrHop[] {
  return hops.filter((h) => h.loss > 0);
}

/** 结果导出为制表符分隔文本 */
export function hopsToText(hops: readonly MtrHop[]): string {
  const head = [ '跳数', '主机', '地址', '丢包率', '发包', '应答', '最近', '平均', '最好', '最差', '抖动', '状态' ];
  const rows = hops.map((h) => [
    String(h.ttl),
    h.host ?? '-',
    h.addr ?? '-',
    formatLoss(h.loss),
    String(h.snt),
    String(h.recv),
    formatRtt(h.last),
    formatRtt(h.avg),
    formatRtt(h.best),
    formatRtt(h.worst),
    formatRtt(h.jitter),
    stateText(h.state),
  ]);
  return [ head, ...rows ].map((r) => r.join('\t')).join('\n');
}

/**
 * 计算本轮需要探测的 TTL 列表
 * 首轮从 1 探测到 maxHops (以便完整发现路径), 之后只探测到已知的到达跳
 */
export function computeRoundTtls(round: number, maxHops: number, found: number | null): number[] {
  const top = round === 0 || found === null ? maxHops : found;
  const out: number[] = [];
  for (let ttl = 1; ttl <= top; ttl++) out.push(ttl);
  return out;
}

// ---------------------------------------------------------------------------
// 探测编排 (网络能力由外部注入)
// ---------------------------------------------------------------------------
export type MtrProbeFn = (address: string, ttl: number, timeoutMs: number) => Promise<MtrProbeReply>;
export type MtrReverseFn = (address: string) => Promise<string>;

export type MtrTraceOptions = {
  target: MtrResolvedTarget;
  maxHops: number;
  rounds: number;
  timeoutMs: number;
  intervalMs: number;
  /** 是否对跳地址做反向解析 */
  resolveNames: boolean;
  probe: MtrProbeFn;
  reverse: MtrReverseFn;
  /** 返回 true 时停止后续轮次 (页面「停止」按钮) */
  shouldStop?: () => boolean;
  /** 单轮结束回调 (用于实时刷新表格) */
  onRound?: (round: number, hops: MtrHop[], names: ReadonlyMap<string, string>) => void;
  /** 轮次间隔 (默认 setTimeout) */
  sleep?: (ms: number) => Promise<void>;
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => { setTimeout(resolve, ms); });

/**
 * 执行 MTR 探测: 每轮并发探测各跳, 统计后回调, 直到
 *
 * - 轮次用尽, 或
 * - shouldStop() 返回 true, 或
 * - 到达目标且轮次用尽 (到达跳固定后不再扩大范围)
 */
export async function runMtrTrace(options: MtrTraceOptions): Promise<MtrHop[]> {
  const {
    target, maxHops, rounds, timeoutMs, intervalMs, resolveNames,
    probe, reverse, shouldStop, onRound, sleep = defaultSleep,
  } = options;

  const maxTtl = clampMaxHops(maxHops);
  const totalRounds = clampRounds(rounds);
  const names = new Map<string, string>();
  const byTtl = new Map<number, ProbeEntry[]>();
  let found: number | null = null;
  let hops: MtrHop[] = [];

  for (let round = 0; round < totalRounds; round++) {
    if (shouldStop?.()) break;

    const ttls = computeRoundTtls(round, maxTtl, found);
    const settled = await Promise.all(ttls.map(async (ttl) => {
      try {
        return { ttl, entry: { reply: await probe(target.address, ttl, timeoutMs), error: null } as ProbeEntry };
      } catch (err) {
        return { ttl, entry: { reply: null, error: (err as Error).message } as ProbeEntry };
      }
    }));
    if (shouldStop?.()) break;

    for (const { ttl, entry } of settled) {
      const list = byTtl.get(ttl) ?? [];
      list.push(entry);
      byTtl.set(ttl, list);
    }

    // 反向解析本轮新出现的地址 (失败静默降级为 IP)
    if (resolveNames) {
      const fresh = new Set<string>();
      for (const { entry } of settled) {
        const addr = entry.reply?.addr;
        if (addr && !names.has(addr)) fresh.add(addr);
      }
      await Promise.all([ ...fresh ].map(async (addr) => {
        try {
          const name = await reverse(addr);
          if (name) names.set(addr, name);
        } catch {
          // 反解失败不影响主流程
        }
      }));
    }

    // 到达目标的跳之后的跳不再展示 (与 mtr 一致)
    const hit = settled.find((s) => s.entry.reply?.reached);
    if (hit) {
      found = hit.ttl;
      for (const ttl of [ ...byTtl.keys() ]) {
        if (ttl > found) byTtl.delete(ttl);
      }
    }

    hops = [ ...byTtl.entries() ]
      .sort((a, b) => a[0] - b[0])
      .map(([ ttl, list ]) => summarizeHop(ttl, list, names));
    if (found === null) found = reachedTtl(hops);
    onRound?.(round + 1, hops, names);

    if (round + 1 < totalRounds && !shouldStop?.()) await sleep(clampInterval(intervalMs));
  }

  return hops;
}
