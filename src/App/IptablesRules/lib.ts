// iptables 规则: 解析 (iptables 命令 / iptables-save) + 生成 (命令 + 删除 + 保存)

export type IpOp = 'A' | 'I' | 'D' | 'P' | 'N' | 'F' | 'X' | 'Z';

/** 一条解析出来的规则 */
export interface IpRule {
  index: number;            // 序号 (从 1 开始)
  table: string;            // 表
  op: IpOp;                 // 操作
  chain: string;            // 链
  position?: number;        // -I / -D 的序号
  protocol: string;         // 协议 (空 = 未指定)
  source: string;
  destination: string;
  inIface: string;
  outIface: string;
  sport: string;
  dport: string;
  states: string[];
  target: string;           // -j 的值 (动作 / 自定义链)
  policy: string;           // -P 的策略
  args: Record<string, string>; // 动作附加参数 (toDestination / logPrefix ...)
  comment: string;
  limit: string;
  limitBurst: string;
  icmpType: string;
  unknown: string[];        // 未识别的参数
  raw: string;              // 原始文本
}

export interface ParseResult {
  rules: IpRule[];
  errors: string[];         // 无法识别的行 (原文)
}

/** 拆分参数: 支持 "双引号" / '单引号' (用于 --log-prefix "--DROP-- ") */
export const tokenizeArgs = (line: string): string[] => {
  const out: string[] = [];
  let cur = '';
  let quote = '';
  let has = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === quote) quote = '';
      else if (ch === '\\' && quote === '"' && i + 1 < line.length) { cur += line[++i]; }
      else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; has = true; continue; }
    if (/\s/.test(ch)) {
      if (has) { out.push(cur); cur = ''; has = false; }
      continue;
    }
    has = true;
    cur += ch;
  }
  if (has) out.push(cur);
  return out;
};

/** 长选项 -> 短选项 */
const LONG_OPTS: Record<string, string> = {
  '--append': '-A', '--insert': '-I', '--delete': '-D', '--policy': '-P', '--new-chain': '-N',
  '--flush': '-F', '--delete-chain': '-X', '--zero': '-Z', '--list': '-L',
  '--table': '-t', '--protocol': '-p', '--source': '-s', '--src': '-s',
  '--destination': '-d', '--dst': '-d', '--in-interface': '-i', '--out-interface': '-o',
  '--jump': '-j', '--goto': '-g', '--match': '-m',
  '--source-port': '--sport', '--destination-port': '--dport',
  '--source-ports': '--sports', '--destination-ports': '--dports',
  '--state': '--state', '--ctstate': '--ctstate',
};

/** 动作附加参数 -> 配置字段名 */
const ARG_KEYS: Record<string, string> = {
  '--to-destination': 'toDestination', '--to-source': 'toSource', '--to-ports': 'toPorts',
  '--set-mark': 'setMark', '--log-prefix': 'logPrefix', '--log-level': 'logLevel',
  '--reject-with': 'rejectWith',
};

const OP_TAKES_CHAIN = new Set([ 'A', 'I', 'D', 'P', 'N' ]);
const OP_OPTIONAL_CHAIN = new Set([ 'F', 'X', 'Z' ]);

/** iptables-save 的链策略行: :INPUT DROP [0:0] */
const SAVE_POLICY = /^:\s*(\S+)\s+(\S+)\s*(\[\d+:\d+\])?$/;

/**
 * 解析 iptables 规则文本 (可混用命令形式与 iptables-save 形式)
 */
export const parseIptables = (text: string): ParseResult => {
  const rules: IpRule[] = [];
  const errors: string[] = [];
  let table = 'filter';
  const lines = text.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) continue;
    if (line.startsWith('*')) { table = line.slice(1).trim() || 'filter'; continue; }
    if (/^COMMIT\b/i.test(line)) continue;
    // iptables-save 的链策略行
    const pol = SAVE_POLICY.exec(line);
    if (pol) {
      rules.push(makeRule(rules.length + 1, {
        table, op: 'P', chain: pol[1], policy: pol[2].toUpperCase(), raw: line,
      }));
      continue;
    }
    // 命令形式: 取 iptables 之后的参数
    let toks = tokenizeArgs(line);
    if (toks[0] === 'sudo') toks = toks.slice(1);
    if (/^(ip6tables|iptables)$/.test(toks[0] ?? '')) toks = toks.slice(1);
    else if (toks.length > 1 && toks[0].includes('iptables') && toks[0].startsWith('/')) toks = toks.slice(1);

    const parsed = parseTokens(toks, table, line);
    if (!parsed) { errors.push(line); continue; }
    rules.push(makeRule(rules.length + 1, parsed));
  }
  return { rules, errors };
};

type PartialRule = Partial<IpRule> & { table: string; op: IpOp; raw: string };

const makeRule = (index: number, r: PartialRule): IpRule => ({
  index,
  table: r.table,
  op: r.op,
  chain: r.chain ?? '',
  position: r.position,
  protocol: r.protocol ?? '',
  source: r.source ?? '',
  destination: r.destination ?? '',
  inIface: r.inIface ?? '',
  outIface: r.outIface ?? '',
  sport: r.sport ?? '',
  dport: r.dport ?? '',
  states: r.states ?? [],
  target: r.target ?? '',
  policy: r.policy ?? '',
  args: r.args ?? {},
  comment: r.comment ?? '',
  limit: r.limit ?? '',
  limitBurst: r.limitBurst ?? '',
  icmpType: r.icmpType ?? '',
  unknown: r.unknown ?? [],
  raw: r.raw,
});

/** 解析一行参数 (不含 iptables 前缀) */
const parseTokens = (toks: string[], defaultTable: string, raw: string): PartialRule | null => {
  if (toks.length === 0) return null;
  const r: PartialRule = {
    table: defaultTable, op: 'A', raw, args: {}, states: [], unknown: [],
  };
  let hasOp = false;
  const next = (i: number): string => toks[i + 1] ?? '';

  for (let i = 0; i < toks.length; i++) {
    const tk = LONG_OPTS[toks[i]] ?? toks[i];
    const val = next(i);
    switch (tk) {
      case '-t': r.table = val || 'filter'; i++; break;
      case '-A': case '-I': case '-D': case '-P': case '-N': case '-F': case '-X': case '-Z': {
        hasOp = true;
        r.op = tk.slice(1) as IpOp;
        if (OP_TAKES_CHAIN.has(r.op) && val && !val.startsWith('-')) { r.chain = val; i++; }
        else if (OP_OPTIONAL_CHAIN.has(r.op) && val && !val.startsWith('-')) { r.chain = val; i++; }
        // -P 后面的取值是默认策略
        if (r.op === 'P' && next(i) && !next(i).startsWith('-')) {
          const pol = next(i).toUpperCase();
          r.policy = pol;
          r.target = pol;
          i++;
        }
        // -I/-D 的序号
        if ((r.op === 'I' || r.op === 'D') && /^\d+$/.test(next(i))) { r.position = Number(next(i)); i++; }
        break;
      }
      case '-p': r.protocol = val; i++; break;
      case '-s': r.source = val; i++; break;
      case '-d': r.destination = val; i++; break;
      case '-i': r.inIface = val; i++; break;
      case '-o': r.outIface = val; i++; break;
      case '-m': {
        // 由匹配模块推断协议 (如 -m tcp --dport 22)
        const mod = val;
        if (!r.protocol && /^(tcp|udp|sctp|icmp)$/.test(mod)) r.protocol = mod;
        i++;
        break;
      }
      case '-j': case '-g': r.target = val; i++; break;
      case '--sport': case '--sports': r.sport = val; i++; break;
      case '--dport': case '--dports': r.dport = val; i++; break;
      case '--state': case '--ctstate': r.states = val ? val.split(',').map((s) => s.trim()).filter(Boolean) : []; i++; break;
      case '--icmp-type': r.icmpType = val; i++; break;
      case '--limit': r.limit = val; i++; break;
      case '--limit-burst': r.limitBurst = val; i++; break;
      case '--comment': r.comment = val; i++; break;
      case '!': break; // 取反, 忽略 (保留在 raw 里)
      default: {
        const key = ARG_KEYS[tk];
        if (key) { r.args![key] = val; i++; }
        else if (tk.startsWith('-')) r.unknown!.push(tk);
        break;
      }
    }
  }
  if (!hasOp) return null;
  return r;
};

/** 依据链名推断所属表 (自定义链返回空) */
export const chainTable = (chain: string): string => {
  const up = chain.toUpperCase();
  if ([ 'PREROUTING', 'POSTROUTING' ].includes(up)) return 'nat';
  return 'filter';
};

// ---------------------------- 生成 ----------------------------

/** 生成配置 */
export interface RuleConfig {
  table: string;
  op: IpOp;
  chain: string;
  position: string;
  protocol: string;
  source: string;
  destination: string;
  inIface: string;
  outIface: string;
  sport: string;
  dport: string;
  states: string[];
  target: string;
  args: Record<string, string>;
  limit: string;
  limitBurst: string;
  icmpType: string;
  comment: string;
  extra: string;        // 追加的原始参数
}

export const emptyRuleConfig = (): RuleConfig => ({
  table: 'filter', op: 'A', chain: 'INPUT', position: '1',
  protocol: '', source: '', destination: '', inIface: '', outIface: '',
  sport: '', dport: '', states: [], target: 'ACCEPT', args: {},
  limit: '', limitBurst: '', icmpType: '', comment: '', extra: '',
});

/** 由解析结果回填生成配置 */
export const ruleToConfig = (r: IpRule): RuleConfig => ({
  ...emptyRuleConfig(),
  table: r.table, op: r.op, chain: r.chain, position: String(r.position ?? 1),
  protocol: r.protocol, source: r.source, destination: r.destination,
  inIface: r.inIface, outIface: r.outIface, sport: r.sport, dport: r.dport,
  states: r.states.slice(), target: r.target, args: { ...r.args },
  limit: r.limit, limitBurst: r.limitBurst, icmpType: r.icmpType, comment: r.comment,
});

export const OP_SHORT: Record<IpOp, string> = {
  A: '-A', I: '-I', D: '-D', P: '-P', N: '-N', F: '-F', X: '-X', Z: '-Z',
};

const isIpv4 = (v: string): boolean => {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\/(\d{1,2}))?$/.exec(v);
  if (!m) return false;
  if (m.slice(1, 5).some((o) => Number(o) > 255)) return false;
  return m[5] === undefined || Number(m[5]) <= 32;
};
const isIpv6 = (v: string): boolean => /^[0-9a-fA-F:]+(?:\/\d{1,3})?$/.test(v) && v.includes(':');

const isHostname = (v: string): boolean =>
  /^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)*$/.test(v) && /[A-Za-z]/.test(v);

/** 地址是否合法 (IPv4 / IPv4 CIDR / IPv6 / 主机名) */
export const isValidAddress = (v: string): boolean => v === '' || isIpv4(v) || isIpv6(v) || isHostname(v);

/** 带端口的地址是否合法 (1.2.3.4:80 / [::1]:80 / host:80) */
export const isValidAddressPort = (v: string): boolean => {
  if (v === '') return true;
  const br = /^\[([^\]]+)\](?::(\d+))?$/.exec(v);
  if (br) return isValidAddress(br[1]) && (br[2] === undefined || isValidPort(br[2]));
  if (isIpv4(v) || isIpv6(v)) return true;
  const i = v.lastIndexOf(':');
  if (i > 0 && /^\d+$/.test(v.slice(i + 1)) && isValidAddress(v.slice(0, i))) return true;
  return isValidAddress(v);
};

/** 端口 (支持 80 / 80:90 / :80 / 80: / 80,443 列表) */
export const isValidPort = (v: string): boolean => {
  if (v === '') return true;
  return v.split(',').every((piece) => {
    const p = piece.trim();
    if (/^\d{1,5}$/.test(p)) return Number(p) >= 1 && Number(p) <= 65535;
    const m = /^(\d{1,5})?:(\d{1,5})?$/.exec(p);
    if (!m || (m[1] === undefined && m[2] === undefined)) return false;
    const lo = m[1] === undefined ? 1 : Number(m[1]);
    const hi = m[2] === undefined ? 65535 : Number(m[2]);
    return lo >= 1 && hi <= 65535 && lo <= hi;
  });
};

/** 校验生成配置, 返回错误码 (由界面翻译) */
export const validateRule = (c: RuleConfig): string[] => {
  const errs: string[] = [];
  if (!c.table.trim()) errs.push('table');
  if (!c.chain.trim() && c.op !== 'F') errs.push('chain');
  if ((c.op === 'I' || c.op === 'D') && c.position !== '' && !/^\d+$/.test(c.position.trim())) errs.push('position');
  if (!isValidAddress(c.source.trim())) errs.push('source');
  if (!isValidAddress(c.destination.trim())) errs.push('destination');
  if (!isValidPort(c.sport.trim())) errs.push('sport');
  if (!isValidPort(c.dport.trim())) errs.push('dport');
  const needPortProto = (c.sport.trim() !== '' || c.dport.trim() !== '') ? c.protocol : '';
  if (needPortProto && !/^(tcp|udp|sctp|dccp)$/.test(needPortProto) && !hasMultiPort(c)) errs.push('port-proto');
  if ([ 'A', 'I', 'D' ].includes(c.op) && !hasPositionOnly(c) && !c.target.trim()) errs.push('target');
  if (c.op === 'P' && !/^(ACCEPT|DROP)$/.test(c.target.trim().toUpperCase())) errs.push('policy');
  if (c.args.rejectWith && !/^(icmp-[\w-]+|tcp-reset|icmp6-[\w-]+)$/.test(c.args.rejectWith)) errs.push('reject-with');
  if (c.args.logLevel && !/^[0-7]$/.test(c.args.logLevel)) errs.push('log-level');
  if (c.args.setMark && !/^(0x[0-9a-fA-F]+|\d+)(\/0x[0-9a-fA-F]+)?$/.test(c.args.setMark)) errs.push('set-mark');
  if (c.args.toDestination && !isValidAddressPort(c.args.toDestination)) errs.push('to-destination');
  if (c.args.toSource && !isValidAddressPort(c.args.toSource)) errs.push('to-source');
  if (c.args.toPorts && !/^\d{1,5}([-,:]\d{1,5})?$/.test(c.args.toPorts)) errs.push('to-ports');
  if (c.limit && !/^\d+(\/(sec|second|min|minute|hour|day))?$/.test(c.limit)) errs.push('limit');
  if (c.limitBurst && !/^\d+$/.test(c.limitBurst)) errs.push('limit-burst');
  if (c.comment.length > 256) errs.push('comment');
  if ((c.args.logPrefix ?? '').length > 29) errs.push('log-prefix');
  return errs;
};

/** 是否使用 multiport (端口里含逗号) */
const hasMultiPort = (c: RuleConfig): boolean =>
  c.sport.includes(',') || c.dport.includes(',') ||
  (c.extra.includes('-m multiport') || c.extra.includes('--dports') || c.extra.includes('--sports'));

/** 仅按位置删除 (-D CHAIN 3), 不需要 -j */
const hasPositionOnly = (c: RuleConfig): boolean =>
  c.op === 'D' && c.position.trim() !== '' &&
  c.protocol === '' && !c.source && !c.destination && !c.inIface && !c.outIface &&
  c.sport === '' && c.dport === '' && c.states.length === 0;

const quote = (v: string): string => (/[\s"'|&;<>\\)(]/.test(v) ? `"${v.replace(/(["\\])/g, '\\$1')}"` : v);

/** 拼接匹配段 + 动作 (不含 iptables 前缀与操作符) */
const buildBody = (c: RuleConfig): string => {
  const body: string[] = [];
  const multi = hasMultiPort(c);
  if (c.op === 'P') return `${c.chain} ${c.target.trim().toUpperCase()}`;
  if (c.op === 'N' || c.op === 'X' || c.op === 'Z' || c.op === 'F') return c.chain;
  if (c.op === 'D' && hasPositionOnly(c)) return `${c.chain} ${c.position.trim()}`;

  const proto = c.protocol.trim() || (multi ? 'tcp' : '');
  body.push(c.chain.trim());
  if (c.op === 'I' && c.position.trim() !== '') body.push(c.position.trim());
  if (c.inIface.trim()) body.push('-i', c.inIface.trim());
  if (c.outIface.trim()) body.push('-o', c.outIface.trim());
  if (proto) body.push('-p', proto);
  if (c.source.trim()) body.push('-s', c.source.trim());
  if (c.destination.trim()) body.push('-d', c.destination.trim());
  if (c.icmpType.trim()) body.push('--icmp-type', c.icmpType.trim());
  if (multi) {
    body.push('-m', 'multiport');
    if (c.sport.trim()) body.push('--sports', c.sport.trim());
    if (c.dport.trim()) body.push('--dports', c.dport.trim());
  } else {
    if (c.sport.trim()) body.push('--sport', c.sport.trim());
    if (c.dport.trim()) body.push('--dport', c.dport.trim());
  }
  if (c.states.length > 0) body.push('-m', 'state', '--state', c.states.join(','));
  if (c.limit.trim()) {
    body.push('-m', 'limit', '--limit', c.limit.trim());
    if (c.limitBurst.trim()) body.push('--limit-burst', c.limitBurst.trim());
  }
  if (c.extra.trim()) body.push(c.extra.trim());
  if (c.comment.trim()) body.push('-m', 'comment', '--comment', quote(c.comment.trim()));
  if (c.op !== 'D' || !hasPositionOnly(c)) {
    body.push('-j', c.target.trim());
    const spec = TARGET_ARG_ORDER[c.target.trim()];
    if (spec) {
      for (const key of spec) {
        const raw = c.args[key] ?? '';
        const v = key === 'logPrefix' ? raw : raw.trim();
        if (v === '') continue;
        body.push(TARGET_ARG_FLAGS[key], quote(v));
      }
    }
  }
  return body.join(' ');
};

/** 动作参数顺序 (与 TARGET_ARGS 的键名一致) */
const TARGET_ARG_ORDER: Record<string, string[]> = {
  DNAT: [ 'toDestination' ], SNAT: [ 'toSource' ], REDIRECT: [ 'toPorts' ],
  MASQUERADE: [ 'toPorts' ], LOG: [ 'logPrefix', 'logLevel' ],
  REJECT: [ 'rejectWith' ], MARK: [ 'setMark' ],
};

/** 动作参数键 -> iptables 参数名 (界面展示复用) */
export const TARGET_ARG_FLAGS: Record<string, string> = {
  toDestination: '--to-destination', toSource: '--to-source', toPorts: '--to-ports',
  setMark: '--set-mark', logPrefix: '--log-prefix', logLevel: '--log-level', rejectWith: '--reject-with',
};

/** 生成完整 iptables 命令 */
export const buildIptablesCommand = (c: RuleConfig): string => {
  const table = c.table.trim() || 'filter';
  return `iptables -t ${table} ${OP_SHORT[c.op]} ${buildBody(c)}`.trim();
};

/** 生成 iptables-save / iptables-restore 风格的一行 (仅追加/插入/删除可用) */
export const buildRestoreLine = (c: RuleConfig): string => {
  if (![ 'A', 'I', 'D' ].includes(c.op)) return '';
  if (c.op === 'D' && !hasPositionOnly(c) && !c.target.trim()) return '';
  if (c.op === 'I') return `-A ${buildBody({ ...c, op: 'A', position: '1' })}`;
  return `-${c.op} ${buildBody(c)}`;
};

/** 生成结果: 主命令 + 查看 + 删除 + 保存 */
export interface RulePlan {
  errors: string[];
  warnings: string[];
  command: string;
  restoreLine: string;
  view: string[];
  remove: string[];
  persist: string[];
}

const hasMatch = (c: RuleConfig): boolean =>
  Boolean(c.protocol || c.source || c.destination || c.inIface || c.outIface ||
    c.sport || c.dport || c.states.length || c.limit || c.extra || c.comment || c.icmpType);

/** 生成计划 (校验失败时 command 为空) */
export const buildRulePlan = (c: RuleConfig): RulePlan => {
  const errors = validateRule(c);
  const warnings: string[] = [];
  const table = c.table.trim() || 'filter';
  const chain = c.chain.trim() || 'INPUT';
  if (errors.length > 0) {
    return { errors, warnings, command: '', restoreLine: '', view: [], remove: [], persist: [] };
  }
  const command = buildIptablesCommand(c);
  const restoreLine = buildRestoreLine(c);
  if (c.op === 'I' && c.position.trim() === '') warnings.push('insert-first');
  if (c.op === 'A') warnings.push('append-last');
  if ([ 'DNAT', 'SNAT', 'MASQUERADE' ].includes(c.target.trim()) && table === 'nat') warnings.push('forward');
  if (table !== 'filter' && [ 'F', 'X' ].includes(c.op)) warnings.push('custom-chain-table');

  const view = [
    `iptables -t ${table} -nL ${chain} --line-numbers`,
    `iptables -t ${table} -S ${chain}`,
    `iptables -t ${table} -nL -v`,
  ];
  const remove: string[] = [];
  if ([ 'A', 'I' ].includes(c.op) && c.target.trim()) {
    remove.push(buildIptablesCommand({ ...c, op: 'D', position: '' }));
  }
  remove.push(`iptables -t ${table} -D ${chain} 1    # 1 换成上面查到的规则行号`);
  if (c.op === 'N') remove.push(`iptables -t ${table} -X ${chain}`);
  if (c.op === 'A' || c.op === 'I' || c.op === 'D') remove.push(`iptables -t ${table} -F ${chain}    # 清空整条链 (慎用)`);
  const persist = [
    'iptables-save > /etc/iptables/rules.v4    # Debian/Ubuntu (需 iptables-persistent)',
    'netfilter-persistent save',
    'service iptables save    # CentOS 6 / RHEL 7 之前',
    'iptables-save | tee /tmp/rules.v4',
  ];
  return { errors, warnings, command, restoreLine, view, remove, persist };
};

/** 生成可直接执行的 shell 脚本 (生效 + 查看 + 删除 + 保存) */
export const buildIptablesScript = (plan: RulePlan): string => {
  if (plan.command === '') return '';
  return [
    '#!/bin/bash',
    '# iptables 规则脚本 (由 MagicTools「iptables 规则」生成, 请用 root 执行)',
    'set -e',
    '',
    plan.command,
    '',
    '# ---- 查看 ----',
    ...plan.view,
    '',
    '# ---- 删除 ----',
    ...plan.remove,
    '',
    '# ---- 保存 ----',
    ...plan.persist,
    '',
  ].join('\n');
};
