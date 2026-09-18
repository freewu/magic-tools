// tc 流量控制规则: 由配置生成 tc 指令 + 对应的查看 / 清除指令

export type TcMode = 'htb' | 'tbf' | 'netem';
export type TcDirection = 'egress' | 'ingress';
export type TcRateUnit = 'kbit' | 'mbit' | 'gbit';
export type TcFilterKind = 'none' | 'port' | 'ip' | 'proto';

export interface TcConfig {
  dev: string;                 // 网卡
  mode: TcMode;                // 限速方式
  direction: TcDirection;      // 出口 / 入口
  ifbDev: string;              // 入口重定向用的 ifb 设备
  rate: string;                // 限速值
  rateUnit: TcRateUnit;
  total: string;               // 网卡总带宽 (htb 根类 / 默认类用)
  totalUnit: TcRateUnit;
  ceil: string;                // 峰值 (空 = 等于 rate)
  ceilUnit: TcRateUnit;
  burstKb: string;             // tbf 突发
  latencyMs: string;           // tbf 延迟
  delayMs: string;             // netem 延迟
  jitterMs: string;            // netem 抖动
  lossPct: string;             // 丢包 %
  duplicate: string;           // 重复 %
  corrupt: string;             // 损坏 %
  reorder: string;             // 乱序 %
  gap: string;                 // 乱序间隔
  netemLimit: string;          // netem 队列包数
  filterKind: TcFilterKind;    // 分流条件
  filterPort: string;
  filterIp: string;
  filterProto: string;
  classId: string;             // 限速类的编号 (1:<classId>)
  defaultClass: string;        // htb default 类
  prio: string;                // filter 优先级
  handle: string;              // 根 qdisc handle
  sfq: boolean;                // 每个叶子类挂 sfq
}

/** 生成结果 */
export interface TcPlan {
  errors: string[];    // 校验错误码
  warnings: string[];  // 提示码
  add: string[];       // 添加 / 生效指令
  view: string[];      // 查看指令
  clear: string[];     // 清除指令
  script: string;      // 完整 shell 脚本
}

const UNITS: Record<TcRateUnit, number> = { kbit: 1, mbit: 1000, gbit: 1_000_000 };

/** 速率换算为 kbit */
export const toKbit = (value: string, unit: TcRateUnit): number => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return n * (UNITS[unit] ?? 1);
};

/** kbit 按指定单位格式化 (最多 3 位小数, 去掉多余 0) */
export const formatKbit = (kbit: number, unit: TcRateUnit): string => {
  const v = kbit / (UNITS[unit] ?? 1);
  const s = (Math.round(v * 1000) / 1000).toString();
  return `${s}${unit}`;
};

const isNum = (v: string): boolean => v !== '' && /^\d+(\.\d+)?$/.test(v.trim());
const num = (v: string): number => Number(v.trim());

/** 数字字符串校验 (0-100 的百分比) */
const isPct = (v: string): boolean => v === '' || (isNum(v) && num(v) >= 0 && num(v) <= 100);

const isIpv4 = (v: string): boolean => {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\/(\d{1,2}))?$/.exec(v);
  if (!m) return false;
  if (m.slice(1, 5).some((o) => Number(o) > 255)) return false;
  return m[5] === undefined || Number(m[5]) <= 32;
};

const isPort = (v: string): boolean => /^\d{1,5}$/.test(v) && Number(v) >= 1 && Number(v) <= 65535;

/** 校验配置 */
export const validateTc = (c: TcConfig): string[] => {
  const errs: string[] = [];
  if (!c.dev.trim()) errs.push('dev');
  else if (!/^[A-Za-z0-9_.:@-]+$/.test(c.dev.trim())) errs.push('dev-format');
  if (c.direction === 'ingress' && !c.ifbDev.trim()) errs.push('ifb');
  if (![ 'htb', 'tbf', 'netem' ].includes(c.mode)) errs.push('mode');
  if (c.mode !== 'netem') {
    if (!isNum(c.rate) || num(c.rate) <= 0) errs.push('rate');
    if (c.ceil !== '' && (!isNum(c.ceil) || num(c.ceil) <= 0)) errs.push('ceil');
    if (c.total !== '' && (!isNum(c.total) || num(c.total) <= 0)) errs.push('total');
    if (c.mode === 'htb' && isNum(c.rate) && c.total !== '' && isNum(c.total) &&
      toKbit(c.rate, c.rateUnit) > toKbit(c.total, c.totalUnit)) errs.push('rate-total');
  }
  if (c.mode === 'tbf') {
    if (c.burstKb !== '' && (!isNum(c.burstKb) || num(c.burstKb) <= 0)) errs.push('burst');
    if (c.latencyMs !== '' && (!isNum(c.latencyMs) || num(c.latencyMs) <= 0)) errs.push('latency');
  }
  if (c.mode === 'netem') {
    const hasAny = [ c.delayMs, c.lossPct, c.duplicate, c.corrupt, c.reorder ].some((v) => v !== '');
    if (!hasAny) errs.push('netem-empty');
    if (c.delayMs !== '' && (!isNum(c.delayMs) || num(c.delayMs) <= 0)) errs.push('delay');
    if (c.jitterMs !== '' && c.delayMs === '') errs.push('jitter-needs-delay');
    else if (c.jitterMs !== '' && !isNum(c.jitterMs)) errs.push('jitter');
    if (!isPct(c.lossPct)) errs.push('loss');
    if (!isPct(c.duplicate)) errs.push('duplicate');
    if (!isPct(c.corrupt)) errs.push('corrupt');
    if (!isPct(c.reorder)) errs.push('reorder');
    if (c.netemLimit !== '' && !isNum(c.netemLimit)) errs.push('netem-limit');
    if (c.gap !== '' && !isNum(c.gap)) errs.push('gap');
  }
  if (c.mode === 'htb') {
    if (!/^\d+$/.test(c.classId.trim()) || Number(c.classId) === 1 || Number(c.classId) > 9999) errs.push('class-id');
    if (c.defaultClass !== '' && (!/^\d+$/.test(c.defaultClass.trim()) || Number(c.defaultClass) === 1)) errs.push('default-class');
    if (c.filterKind !== 'none' && c.defaultClass.trim() === c.classId.trim()) errs.push('default-equals-class');
  }
  if (c.mode === 'htb' && c.filterKind === 'port') {
    if (!isPort(c.filterPort.trim())) errs.push('filter-port');
    if (![ 'tcp', 'udp', 'ip' ].includes(c.filterProto)) errs.push('filter-proto');
  }
  if (c.mode === 'htb' && c.filterKind === 'ip' && !isIpv4(c.filterIp.trim())) errs.push('filter-ip');
  if (c.mode === 'htb' && c.filterKind === 'proto' && ![ 'tcp', 'udp', 'icmp' ].includes(c.filterProto)) errs.push('filter-proto');
  if (c.prio !== '' && !/^\d+$/.test(c.prio.trim())) errs.push('prio');
  return errs;
};

const rateText = (v: string, u: TcRateUnit): string => `${v.trim()}${u}`;

/** 数字字符串的整数化 (容量参数必须为整数) */
const intOf = (v: string): number => Math.max(1, Math.round(num(v)));

/**
 * 由配置生成 tc 指令计划
 */
export const buildTcPlan = (c: TcConfig): TcPlan => {
  const errors = validateTc(c);
  const warnings: string[] = [];
  if (errors.length > 0) {
    return { errors, warnings, add: [], view: [], clear: [], script: '' };
  }
  const dev = c.dev.trim();
  const ifb = c.ifbDev.trim();
  const ingress = c.direction === 'ingress';
  const target = ingress ? ifb : dev;      // 真正挂 qdisc 的设备
  const handle = (c.handle.trim() || '1') + ':';
  const add: string[] = [];
  const view: string[] = [];
  const clear: string[] = [];

  warnings.push('need-root');
  if (c.mode !== 'htb') warnings.push('whole-dev');
  if (ingress) warnings.push('ifb-note');
  if (c.mode === 'htb' && c.filterKind !== 'none') warnings.push('htb-class-only');
  warnings.push('not-persist');

  // ---- 入口: ifb 准备 + 重定向 ----
  if (ingress) {
    add.push(`ip link show ${ifb} >/dev/null 2>&1 || modprobe ifb numifbs=1`);
    add.push(`ip link set dev ${ifb} up`);
    add.push(`tc qdisc del dev ${dev} ingress 2>/dev/null || true`);
    add.push(`tc qdisc add dev ${dev} handle ffff: ingress`);
    add.push(`tc filter add dev ${dev} parent ffff: protocol ip u32 match u32 0 0 action mirred egress redirect dev ${ifb}`);
    clear.push(`tc qdisc del dev ${dev} ingress 2>/dev/null || true`);
  }

  if (c.mode === 'netem') {
    const parts: string[] = [];
    if (c.delayMs !== '') {
      parts.push('delay', `${intOf(c.delayMs)}ms`);
      if (c.jitterMs !== '') parts.push(`${intOf(c.jitterMs)}ms`);
    }
    if (c.lossPct !== '') parts.push('loss', `${c.lossPct.trim()}%`);
    if (c.duplicate !== '') parts.push('duplicate', `${c.duplicate.trim()}%`);
    if (c.corrupt !== '') parts.push('corrupt', `${c.corrupt.trim()}%`);
    if (c.reorder !== '') {
      parts.push('reorder', `${c.reorder.trim()}%`);
      if (c.gap !== '') parts.push(`${intOf(c.gap)}`);
    }
    if (c.netemLimit !== '') parts.push('limit', String(intOf(c.netemLimit)));
    add.push(`tc qdisc add dev ${target} root netem ${parts.join(' ')}`);
    add.push(`tc qdisc change dev ${target} root netem ${parts.join(' ')}    # 参数微调时用 change`);
  } else if (c.mode === 'tbf') {
    const burstKbit = c.burstKb !== '' ? num(c.burstKb) : Math.max(10, Math.round(toKbit(c.rate, c.rateUnit) / 100));
    const latency = c.latencyMs !== '' ? intOf(c.latencyMs) : 400;
    add.push(`tc qdisc add dev ${target} root tbf rate ${rateText(c.rate, c.rateUnit)} burst ${burstKbit}kbit latency ${latency}ms`);
  } else {
    // HTB: 根类 1:1 + 限速类 1:classId (+ 默认类)
    const rootRate = c.total !== '' ? c.total : c.rate;
    const rootUnit = c.total !== '' ? c.totalUnit : c.rateUnit;
    const ceilText = c.ceil !== '' ? rateText(c.ceil, c.ceilUnit) : rateText(c.rate, c.rateUnit);
    const filtered = c.filterKind !== 'none';
    const defaultClass = filtered ? (c.defaultClass.trim() || c.classId.trim()) : c.classId.trim();
    add.push(`tc qdisc add dev ${target} root handle ${handle} htb default ${defaultClass}`);
    add.push(`tc class add dev ${target} parent ${handle} classid ${handle}1 htb rate ${rateText(rootRate, rootUnit)} ceil ${rateText(rootRate, rootUnit)}`);
    add.push(`tc class add dev ${target} parent ${handle}1 classid ${handle}${c.classId.trim()} htb rate ${rateText(c.rate, c.rateUnit)} ceil ${ceilText}${c.prio !== '' ? ` prio ${c.prio.trim()}` : ''}`);
    if (c.sfq) add.push(`tc qdisc add dev ${target} parent ${handle}${c.classId.trim()} handle ${c.classId.trim()}0: sfq perturb 10`);
    if (filtered) {
      // 默认类 (其余流量)
      const limited = toKbit(c.rate, c.rateUnit);
      const rest = Math.max(0, toKbit(rootRate, rootUnit) - limited);
      add.push(`tc class add dev ${target} parent ${handle}1 classid ${handle}${defaultClass} htb rate ${formatKbit(rest > 0 ? rest : toKbit(rootRate, rootUnit), rootUnit)} ceil ${rateText(rootRate, rootUnit)}`);
      if (c.sfq) add.push(`tc qdisc add dev ${target} parent ${handle}${defaultClass} handle ${defaultClass}0: sfq perturb 10`);
      const prio = c.prio !== '' ? c.prio.trim() : '1';
      if (c.filterKind === 'port') {
        const m = c.filterProto === 'ip' ? `match ip dport ${c.filterPort.trim()} 0xffff` : `match ip protocol ${c.filterProto === 'tcp' ? '6' : '17'} 0xff match ip dport ${c.filterPort.trim()} 0xffff`;
        add.push(`tc filter add dev ${target} protocol ip parent ${handle}0 prio ${prio} u32 ${m} flowid ${handle}${c.classId.trim()}`);
      } else if (c.filterKind === 'ip') {
        add.push(`tc filter add dev ${target} protocol ip parent ${handle}0 prio ${prio} u32 match ip dst ${c.filterIp.trim()} flowid ${handle}${c.classId.trim()}`);
      } else {
        add.push(`tc filter add dev ${target} protocol ip parent ${handle}0 prio ${prio} u32 match ip protocol ${c.filterProto === 'tcp' ? '6' : c.filterProto === 'udp' ? '17' : '1'} 0xff flowid ${handle}${c.classId.trim()}`);
      }
    }
    clear.push(`tc qdisc del dev ${target} root 2>/dev/null || true`);
    clear.push(`tc filter del dev ${target} parent ${handle}0 2>/dev/null || true    # 也可只删分流规则`);
    clear.push(`tc class del dev ${target} parent ${handle}1 classid ${handle}${c.classId.trim()} 2>/dev/null || true    # 也可只删限速类`);
  }

  if (c.mode !== 'htb') clear.push(`tc qdisc del dev ${target} root 2>/dev/null || true`);
  if (ingress) {
    clear.push(`ip link set dev ${ifb} down`);
    clear.push(`tc -s qdisc show dev ${ifb}    # 确认已清空 (无输出即成功)`);
  }

  view.push(`tc -s qdisc show dev ${target}`);
  view.push(`tc -s class show dev ${target}`);
  view.push(`tc filter show dev ${target}`);
  if (ingress) view.push(`tc -s qdisc show dev ${dev}`);

  const script = [
    '#!/bin/bash',
    '# tc 流量控制脚本 (由 MagicTools「tc 规则」生成, 请用 root 执行)',
    'set -e',
    '',
    ...add,
    '',
    '# ---- 查看 ----',
    ...view,
    '',
    '# ---- 清除 ----',
    ...clear,
    '',
  ].join('\n');

  return { errors, warnings, add, view, clear, script };
};

/** 场景示例 -> 完整配置 */
export const applyPreset = (base: TcConfig, preset: Record<string, string | boolean>): TcConfig => {
  const next: TcConfig = { ...base };
  for (const [ k, v ] of Object.entries(preset)) {
    if (k in next) (next as unknown as Record<string, string | boolean>)[k] = v;
  }
  return next;
};
