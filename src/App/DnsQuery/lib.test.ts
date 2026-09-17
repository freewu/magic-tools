import {
  ALL_RECORD_TYPES, DNS_SERVERS, RECORD_TYPES, formatTtl, normalizeName,
  recordsToText, sortRecords, statusColor, statusText, summarizeResults, typeOrder, validateName,
} from './lib';
import type { DnsQueryResult, DnsRecord } from './lib';
import { isAllTypes } from './net';

const rec = (recordType: string, value: string, ttl = 300, name = 'example.com.'): DnsRecord =>
  ({ name, recordType, ttl, value });

const result = (over: Partial<DnsQueryResult> = {}): DnsQueryResult => ({
  status: 'ok', records: [], elapsedMs: 12, server: '192.168.1.1', message: null, ...over,
});

describe('DnsQuery lib - 常量', () => {
  test('记录类型与后端保持一致', () => {
    expect(RECORD_TYPES).toEqual([ 'A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'NS' ]);
    expect(ALL_RECORD_TYPES).toBe('ALL');
  });

  test('DNS 服务器列表以系统默认为首项', () => {
    expect(DNS_SERVERS[0]).toEqual({ value: 'system', label: '系统默认' });
    expect(DNS_SERVERS.length).toBeGreaterThanOrEqual(5);
    expect(new Set(DNS_SERVERS.map((s) => s.value)).size).toBe(DNS_SERVERS.length);
  });

  test('isAllTypes 只对 ALL 成立', () => {
    expect(isAllTypes('ALL')).toBe(true);
    expect(isAllTypes('A')).toBe(false);
  });});

describe('DnsQuery lib - normalizeName', () => {
  test('去掉协议 / 路径 / 查询串 / 端口 / 结尾点并转小写', () => {
    expect(normalizeName('  HTTPS://Example.COM/path?q=1#h  ')).toBe('example.com');
    expect(normalizeName('http://user@Example.com:8080/')).toBe('example.com');
    expect(normalizeName('example.com.')).toBe('example.com');
    expect(normalizeName('EXAMPLE.com')).toBe('example.com');
  });

  test('保留下划线前缀 (SRV / TXT 场景) 与裸主机名', () => {
    expect(normalizeName('_sip._tcp.example.com')).toBe('_sip._tcp.example.com');
    expect(normalizeName('localhost')).toBe('localhost');
  });

  test('IPv6 字面量不做端口裁剪', () => {
    expect(normalizeName('[2400:3200::1]')).toBe('[2400:3200::1]');
  });

  test('空输入与空串', () => {
    expect(normalizeName('')).toBe('');
    expect(normalizeName('   ')).toBe('');
  });
});

describe('DnsQuery lib - validateName', () => {
  test('合法域名', () => {
    expect(validateName('example.com')).toBe('');
    expect(validateName('_dmarc.example.co.uk')).toBe('');
    expect(validateName('localhost')).toBe('');
    expect(validateName('*.example.com')).toBe('');
  });

  test('空 / 非法 / 超长', () => {
    expect(validateName('')).toBe('请输入要查询的域名');
    expect(validateName('exa mple.com')).toBe('域名格式不正确');
    expect(validateName('example..com')).toBe('域名格式不正确');
    expect(validateName('例.com')).toBe('域名格式不正确');
    expect(validateName(`${'a'.repeat(64)}.com`)).toBe('域名标签长度不能超过 63 个字符');
    expect(validateName(`${'a.'.repeat(127)}com`)).toBe('域名长度不能超过 253 个字符');
  });
});

describe('DnsQuery lib - 排序 / 去重', () => {
  test('按类型顺序再按值排序', () => {
    const out = sortRecords([
      rec('NS', 'ns2.example.com.'),
      rec('A', '1.2.3.4'),
      rec('AAAA', '2400:3200::1'),
      rec('MX', '10 mail.example.com.'),
      rec('A', '1.1.1.1'),
      rec('NS', 'ns1.example.com.'),
    ]);
    expect(out.map((r) => r.recordType)).toEqual([ 'A', 'A', 'AAAA', 'MX', 'NS', 'NS' ]);
    expect(out[0].value).toBe('1.1.1.1');
    expect(out[1].value).toBe('1.2.3.4');
  });

  test('同类型同值去重并保留最小 TTL', () => {
    const out = sortRecords([
      rec('A', '1.1.1.1', 300),
      rec('A', '1.1.1.1', 60),
      rec('A', '1.1.1.1', 120),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].ttl).toBe(60);
  });

  test('类型大小写不影响排序与去重', () => {
    const out = sortRecords([ rec('a', '1.1.1.1'), rec('A', '1.1.1.1') ]);
    expect(out).toHaveLength(1);
  });

  test('未知类型排在已知类型之后', () => {
    expect(typeOrder('A')).toBeLessThan(typeOrder('NS'));
    expect(typeOrder('CAA')).toBeLessThan(typeOrder('WEIRD'));
    expect(typeOrder('weird')).toBe(99);
  });

  test('空列表', () => {
    expect(sortRecords([])).toEqual([]);
  });
});

describe('DnsQuery lib - TTL 展示', () => {
  test('按量级给出紧凑单位', () => {
    expect(formatTtl(0)).toBe('0s');
    expect(formatTtl(45)).toBe('45s');
    expect(formatTtl(60)).toBe('1m');
    expect(formatTtl(90)).toBe('1m30s');
    expect(formatTtl(600)).toBe('10m');
    expect(formatTtl(3600)).toBe('1h');
    expect(formatTtl(5400)).toBe('1h30m');
    expect(formatTtl(86400)).toBe('1d');
    expect(formatTtl(90000)).toBe('1d1h');
  });

  test('非法值按 0 处理', () => {
    expect(formatTtl(NaN)).toBe('0s');
    expect(formatTtl(-5)).toBe('0s');
  });
});

describe('DnsQuery lib - 复制文本', () => {
  test('制表符分隔, 一行一条', () => {
    const text = recordsToText([ rec('A', '1.1.1.1', 300), rec('MX', '10 mail.example.com.', 60) ]);
    expect(text).toBe('example.com.\tA\t300\t1.1.1.1\nexample.com.\tMX\t60\t10 mail.example.com.');
  });

  test('空列表 -> 空串', () => {
    expect(recordsToText([])).toBe('');
  });
});

describe('DnsQuery lib - 状态展示', () => {
  test('状态文案', () => {
    expect(statusText('ok')).toBe('查询成功');
    expect(statusText('nxdomain')).toBe('域名不存在 (NXDOMAIN)');
    expect(statusText('nodata')).toBe('该记录类型无数据 (NODATA)');
    expect(statusText('error')).toBe('查询失败');
    expect(statusText('unknown')).toBe('该记录类型无数据 (NODATA)');
  });

  test('状态配色', () => {
    expect(statusColor('ok')).toBe('success');
    expect(statusColor('nxdomain')).toBe('warning');
    expect(statusColor('error')).toBe('error');
    expect(statusColor('nodata')).toBe('default');
  });
});

describe('DnsQuery lib - 汇总', () => {
  test('统计记录数 / 最大耗时 / 服务器去重', () => {
    const s = summarizeResults([
      { recordType: 'A', result: result({ records: [ rec('A', '1.1.1.1') ], elapsedMs: 30 }) },
      { recordType: 'NS', result: result({ records: [], elapsedMs: 90, server: '8.8.8.8', status: 'nodata' }) },
      { recordType: 'MX', result: result({ records: [ rec('MX', '10 mail.example.com.') ], elapsedMs: 10, server: '8.8.8.8' }) },
    ]);
    expect(s.total).toBe(2);
    expect(s.elapsedMs).toBe(90);
    expect(s.servers).toEqual([ '192.168.1.1', '8.8.8.8' ]);
    expect(s.empty).toBe(false);
  });

  test('全部为空时 empty 为 true', () => {
    expect(summarizeResults([ { recordType: 'A', result: result({ status: 'nxdomain' }) } ]).empty).toBe(true);
    expect(summarizeResults([]).empty).toBe(true);
    expect(summarizeResults([]).servers).toEqual([]);
  });
});
