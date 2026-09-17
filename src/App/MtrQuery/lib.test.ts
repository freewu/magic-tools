import {
  DEFAULT_MTR_OPTIONS, clampInterval, clampMaxHops, clampRounds, clampTimeout, computeRoundTtls,
  formatLoss, formatRtt, hopsToText, isIpv4, isIpv6, kindText, lossColor, lossyHops, normalizeHost,
  reachedTtl, round1, runMtrTrace, stateColor, stateText, summarizeHop, validateHost,
} from './lib';
import type { MtrProbeReply, ProbeEntry } from './lib';

const reply = (ttl: number, patch: Partial<MtrProbeReply> = {}): MtrProbeReply => ({
  ttl, status: 'ttlExpired', ok: true, rttMs: 10, addr: '10.0.0.1', detail: null, reached: false, elapsedMs: 11,
  ...patch,
});

const probe = (r: MtrProbeReply | null, error: string | null = null): ProbeEntry => ({ reply: r, error });

describe('MtrQuery lib - 格式化', () => {
  test('round1 保留 1 位小数', () => {
    expect(round1(1.24)).toBe(1.2);
    expect(round1(1.25)).toBe(1.3);
    expect(round1(3)).toBe(3);
  });

  test('formatRtt 无数据显示 -', () => {
    expect(formatRtt(12.34)).toBe('12.3 ms');
    expect(formatRtt(0)).toBe('0.0 ms');
    expect(formatRtt(null)).toBe('-');
    expect(formatRtt(undefined)).toBe('-');
    expect(formatRtt(Number.NaN)).toBe('-');
  });

  test('formatLoss', () => {
    expect(formatLoss(0)).toBe('0.0%');
    expect(formatLoss(33.33)).toBe('33.3%');
  });

  test('lossColor 分档', () => {
    expect(lossColor(0)).toBe('green');
    expect(lossColor(10)).toBe('gold');
    expect(lossColor(50)).toBe('red');
  });

  test('stateColor / stateText / kindText', () => {
    expect(stateColor('reached')).toBe('green');
    expect(stateColor('ttlExpired')).toBe('blue');
    expect(stateColor('unreachable')).toBe('red');
    expect(stateColor('timeout')).toBe('default');
    expect(stateText('reached')).toBe('已到达');
    expect(stateText('timeout')).toBe('超时');
    expect(stateText('unreachable')).toBe('不可达');
    expect(stateText('error')).toBe('探测异常');
    expect(kindText('ipv4')).toBe('IPv4 地址');
    expect(kindText('ipv6')).toBe('IPv6 地址');
  });
});

describe('MtrQuery lib - 输入', () => {
  test('isIpv4 / isIpv6', () => {
    expect(isIpv4('1.1.1.1')).toBe(true);
    expect(isIpv4('256.1.1.1')).toBe(false);
    expect(isIpv6('2001:db8::1')).toBe(true);
    expect(isIpv6('1:2:3')).toBe(false);
  });

  test('normalizeHost 去掉协议头与路径', () => {
    expect(normalizeHost('  HTTPS://Example.com/a?b=1 ')).toBe('Example.com');
    expect(normalizeHost('example.com.')).toBe('example.com');
    expect(normalizeHost('1.1.1.1')).toBe('1.1.1.1');
    expect(normalizeHost('')).toBe('');
  });

  test('validateHost', () => {
    expect(validateHost('example.com')).toBe('');
    expect(validateHost('1.1.1.1')).toBe('');
    expect(validateHost('2001:db8::1')).toBe('');
    expect(validateHost('')).toBe('请输入域名或 IP 地址');
    expect(validateHost('中文.com')).toBe('暂不支持中文域名, 请使用 Punycode 形式');
    expect(validateHost('localhost')).toBe('请输入完整域名 (如 example.com)');
    expect(validateHost('-bad.com')).toBe('域名格式不正确');
    expect(validateHost(`${'a'.repeat(250)}.com`)).toBe('域名长度超出限制 (最长 253 个字符)');
  });

  test('参数裁剪', () => {
    expect(clampMaxHops(0)).toBe(1);
    expect(clampMaxHops(999)).toBe(64);
    expect(clampMaxHops(null)).toBe(DEFAULT_MTR_OPTIONS.maxHops);
    expect(clampRounds(0)).toBe(1);
    expect(clampRounds(1000)).toBe(100);
    expect(clampTimeout(10)).toBe(100);
    expect(clampTimeout(99999)).toBe(10000);
    expect(clampInterval(0)).toBe(100);
    expect(clampInterval(Number.NaN)).toBe(DEFAULT_MTR_OPTIONS.intervalMs);
  });
});

describe('MtrQuery lib - summarizeHop', () => {
  test('统计丢包 / RTT / 抖动 / 反向名称', () => {
    const names = new Map([ [ '10.0.0.1', 'gw.local' ] ]);
    const hop = summarizeHop(2, [
      probe(reply(2, { rttMs: 10 })),
      probe(reply(2, { rttMs: 14 })),
      probe(null, '探测超时'),
    ], names);
    expect(hop.ttl).toBe(2);
    expect(hop.host).toBe('gw.local');
    expect(hop.addr).toBe('10.0.0.1');
    expect(hop.snt).toBe(3);
    expect(hop.recv).toBe(2);
    expect(hop.loss).toBe(33.3);
    expect(hop.last).toBe(14);
    expect(hop.avg).toBe(12);
    expect(hop.best).toBe(10);
    expect(hop.worst).toBe(14);
    expect(hop.jitter).toBe(4);
    expect(hop.state).toBe('ttlExpired');
  });

  test('全部超时时丢包 100% 且 RTT 为空', () => {
    const hop = summarizeHop(3, [
      probe(reply(3, { status: 'timeout', ok: false, rttMs: null, addr: null }), '请求超时'),
      probe(reply(3, { status: 'timeout', ok: false, rttMs: null, addr: null }), '请求超时'),
    ]);
    expect(hop.loss).toBe(100);
    expect(hop.recv).toBe(0);
    expect([ hop.last, hop.avg, hop.best, hop.worst, hop.jitter ]).toEqual([ null, null, null, null, null ]);
    expect(hop.state).toBe('timeout');
    expect(hop.host).toBeNull();
  });

  test('到达目标时状态为 reached 且不展示差错说明', () => {
    const hop = summarizeHop(4, [
      probe(reply(4, { rttMs: 5 }), '请求超时'),
      probe(reply(4, { rttMs: 6, reached: true, status: 'reply', addr: '1.1.1.1', detail: '目标可达' })),
    ]);
    expect(hop.state).toBe('reached');
    expect(hop.reached).toBe(true);
    expect(hop.detail).toBeNull();
    expect(hop.host).toBe('1.1.1.1');
  });

  test('探测异常 (无应答) 记为 status=error', () => {
    const hop = summarizeHop(5, [ probe(null, '连接失败'), probe(null, '连接失败') ]);
    expect(hop.snt).toBe(2);
    expect(hop.recv).toBe(0);
    expect(hop.state).toBe('error');
    expect(hop.detail).toBe('连接失败');
  });

  test('不可达状态与说明保留', () => {
    const hop = summarizeHop(6, [ probe(reply(6, { status: 'unreachable', ok: true, rttMs: null, addr: '10.0.0.9', detail: '目标主机不可达' })) ]);
    expect(hop.state).toBe('unreachable');
    expect(hop.detail).toBe('目标主机不可达');
    expect(hop.addr).toBe('10.0.0.9');
  });

  test('没有探测记录时不报错', () => {
    const hop = summarizeHop(1, []);
    expect(hop.snt).toBe(0);
    expect(hop.loss).toBe(0);
    expect(hop.state).toBe('error');
  });
});

describe('MtrQuery lib - 汇总与导出', () => {
  const hops = [
    summarizeHop(1, [ probe(reply(1, { addr: '192.168.1.1', rttMs: 1.2 })) ]),
    summarizeHop(2, [ probe(reply(2, { addr: '1.1.1.1', rttMs: 12, reached: true, status: 'reply' })) ]),
    summarizeHop(3, [
      probe(reply(3, { addr: '10.0.0.5', rttMs: null, status: 'timeout', ok: false })),
      probe(reply(3, { addr: '10.0.0.5', rttMs: 20 })),
    ]),
  ];

  test('reachedTtl / lossyHops', () => {
    expect(reachedTtl(hops)).toBe(2);
    expect(reachedTtl([])).toBeNull();
    expect(lossyHops(hops).map((h) => h.ttl)).toEqual([ 3 ]);
  });

  test('hopsToText 输出制表符表头与内容', () => {
    const lines = hopsToText(hops).split('\n');
    expect(lines).toHaveLength(4);
    expect(lines[0]).toBe('跳数\t主机\t地址\t丢包率\t发包\t应答\t最近\t平均\t最好\t最差\t抖动\t状态');
    expect(lines[1]).toBe('1\t192.168.1.1\t192.168.1.1\t0.0%\t1\t1\t1.2 ms\t1.2 ms\t1.2 ms\t1.2 ms\t-\t转发中');
    expect(lines[2]).toContain('已到达');
    expect(lines[3]).toContain('50.0%');
  });
});

describe('MtrQuery lib - computeRoundTtls', () => {
  test('首轮探测到最大跳数', () => {
    expect(computeRoundTtls(0, 3, null)).toEqual([ 1, 2, 3 ]);
  });

  test('已知到达跳后只探测到该跳', () => {
    expect(computeRoundTtls(1, 5, 3)).toEqual([ 1, 2, 3 ]);
  });

  test('未发现目标时仍探测全部', () => {
    expect(computeRoundTtls(2, 3, null)).toEqual([ 1, 2, 3 ]);
  });
});

describe('MtrQuery lib - runMtrTrace', () => {
  const target = { input: 'example.com', address: '1.1.1.1', kind: 'ipv4', hasIpv4: true, isLiteral: false };

  /** 伪造探测: ttl 1/2 转发, ttl 3 到达, 其余超时 */
  const fakeProbe = jest.fn(async (_addr: string, ttl: number) => {
    if (ttl === 3) return reply(3, { addr: '1.1.1.1', rttMs: 12, reached: true, status: 'reply' });
    if (ttl < 3) return reply(ttl, { addr: `10.0.0.${ttl}`, rttMs: ttl });
    return reply(ttl, { status: 'timeout', ok: false, rttMs: null, addr: null });
  });

  beforeEach(() => fakeProbe.mockClear());

  test('首轮全量探测, 后续轮只探测到目标跳', async () => {
    const rounds: number[] = [];
    const sleeps: number[] = [];
    const result = await runMtrTrace({
      target, maxHops: 5, rounds: 2, timeoutMs: 1000, intervalMs: 300, resolveNames: false,
      probe: fakeProbe,
      reverse: jest.fn(),
      onRound: (no) => rounds.push(no),
      sleep: async (ms) => { sleeps.push(ms); },
    });
    // 首轮 5 次 (1..5), 第二轮 3 次 (1..3)
    expect(fakeProbe).toHaveBeenCalledTimes(8);
    expect(rounds).toEqual([ 1, 2 ]);
    expect(sleeps).toEqual([ 300 ]);
    // 到达目标之后的跳被裁剪
    expect(result.map((h) => h.ttl)).toEqual([ 1, 2, 3 ]);
    expect(result[2].state).toBe('reached');
    expect(result[2].snt).toBe(2);
    expect(result[0].avg).toBe(1);
  });

  test('轮次为 1 时不进入间隔等待', async () => {
    const sleep = jest.fn();
    await runMtrTrace({
      target, maxHops: 3, rounds: 1, timeoutMs: 1000, intervalMs: 300, resolveNames: false,
      probe: fakeProbe, reverse: jest.fn(), sleep,
    });
    expect(sleep).not.toHaveBeenCalled();
    expect(fakeProbe).toHaveBeenCalledTimes(3);
  });

  test('shouldStop 为真时停止后续轮次', async () => {
    const rounds: number[] = [];
    await runMtrTrace({
      target, maxHops: 5, rounds: 5, timeoutMs: 1000, intervalMs: 0, resolveNames: false,
      probe: fakeProbe,
      reverse: jest.fn(),
      shouldStop: () => rounds.length >= 1,
      onRound: (no) => rounds.push(no),
      sleep: jest.fn(),
    });
    expect(rounds).toEqual([ 1 ]);
    expect(fakeProbe).toHaveBeenCalledTimes(5);
  });

  test('开启反解时每个地址只查询一次并写入主机名', async () => {
    const reverse = jest.fn(async (addr: string) => `host-${addr}`);
    const result = await runMtrTrace({
      target, maxHops: 3, rounds: 2, timeoutMs: 1000, intervalMs: 0, resolveNames: true,
      probe: fakeProbe, reverse, sleep: jest.fn(),
    });
    // 三个地址各解析一次 (第二轮命中缓存)
    expect(reverse).toHaveBeenCalledTimes(3);
    expect(result[0].host).toBe('host-10.0.0.1');
  });

  test('反解失败时回退为 IP', async () => {
    const result = await runMtrTrace({
      target, maxHops: 2, rounds: 1, timeoutMs: 1000, intervalMs: 0, resolveNames: true,
      probe: fakeProbe, reverse: jest.fn(async () => { throw new Error('NXDOMAIN'); }), sleep: jest.fn(),
    });
    expect(result[0].host).toBe('10.0.0.1');
  });

  test('探测抛错不影响其它跳', async () => {
    const failing = jest.fn(async (_addr: string, ttl: number) => {
      if (ttl === 2) throw new Error('探测通道不可用');
      return reply(ttl, { addr: '10.0.0.1' });
    });
    const result = await runMtrTrace({
      target, maxHops: 2, rounds: 1, timeoutMs: 1000, intervalMs: 0, resolveNames: false,
      probe: failing, reverse: jest.fn(), sleep: jest.fn(),
    });
    expect(result[1].state).toBe('error');
    expect(result[1].detail).toBe('探测通道不可用');
    expect(result[0].state).toBe('ttlExpired');
  });

  test('onRound 收到实时统计结果', async () => {
    const seen: number[][] = [];
    await runMtrTrace({
      target, maxHops: 2, rounds: 1, timeoutMs: 1000, intervalMs: 0, resolveNames: false,
      probe: fakeProbe, reverse: jest.fn(), sleep: jest.fn(),
      onRound: (_no, hops) => seen.push(hops.map((h) => h.ttl)),
    });
    expect(seen).toEqual([ [ 1, 2 ] ]);
  });
});
