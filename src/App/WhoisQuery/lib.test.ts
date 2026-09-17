import {
  allFields, domainStatuses, fieldValues, guessKind, isIpv4, isIpv6, kindText, nameServers,
  normalizeQuery, parseWhoisFields, summarizeWhois, summaryToText, validateQuery,
} from './lib';
import type { WhoisField } from './lib';

const VERISIGN = `   Domain Name: EXAMPLE.COM
   Registry Domain ID: 2336799_DOMAIN_COM-VRSN
   Registrar WHOIS Server: whois.iana.org
   Registrar URL: http://res-dom.iana.org
   Updated Date: 2025-08-14T07:01:36Z
   Creation Date: 1995-08-14T04:00:00Z
   Registry Expiry Date: 2025-08-14T04:00:00Z
   Registrar: RESERVED-Internet Assigned Numbers Authority
   Domain Status: clientDeleteProhibited https://icann.org/epp#clientDeleteProhibited
   Domain Status: clientTransferProhibited https://icann.org/epp#clientTransferProhibited
   Name Server: A.IANA-SERVERS.NET
   Name Server: B.IANA-SERVERS.NET
   DNSSEC: signedDelegation
>>> Last update of whois database: 2025-08-15T00:00:00Z <<<

For more information on Whois status codes, please visit https://icann.org/epp`;

const RIPE = `% This is the RIPE Database query service.
% The objects are in RPSL format.

inetnum:        1.1.1.0 - 1.1.1.255
netname:        APNIC-LABS
descr:          APNIC and Cloudflare DNS Resolver project
country:        AU
org:            ORG-AR2-APNIC
admin-c:        AR302-AP
status:         ASSIGNED PORTABLE
mnt-by:         APNIC-HM
abuse-mailbox:  helpdesk@apnic.net
changed:        hm-changed@apnic.net 20200101
source:         APNIC
remarks:        ----------
remarks:        spam and abuse
remarks:        ----------`;

const ARIN = `# ARIN WHOIS data and services are subject to the Terms of Use
NetRange:       8.8.8.0 - 8.8.8.255
CIDR:           8.8.8.0/24
NetName:        GOOGLE-DNS
Organization:   Google LLC (GOGL)
Country:        US
Comment:        Please note that the recommended way to file abuse complaints
                is to use the email address listed below.
OrgAbuseEmail:  network-abuse@google.com
`;

describe('WhoisQuery lib - 输入判断', () => {
  test('guessKind', () => {
    expect(guessKind('example.com')).toBe('domain');
    expect(guessKind(' 8.8.8.8 ')).toBe('ipv4');
    expect(guessKind('2001:db8::1')).toBe('ipv6');
    expect(guessKind('not-an-ip')).toBe('domain');
  });

  test('isIpv4 校验每段范围', () => {
    expect(isIpv4('8.8.8.8')).toBe(true);
    expect(isIpv4('255.255.255.255')).toBe(true);
    expect(isIpv4('256.1.1.1')).toBe(false);
    expect(isIpv4('1.1.1')).toBe(false);
    expect(isIpv4('1.1.1.a')).toBe(false);
  });

  test('isIpv6 支持 :: 缩写与内嵌 IPv4', () => {
    expect(isIpv6('2001:db8::1')).toBe(true);
    expect(isIpv6('::1')).toBe(true);
    expect(isIpv6('1:2:3:4:5:6:7:8')).toBe(true);
    expect(isIpv6('::ffff:8.8.8.8')).toBe(true);
    expect(isIpv6('1:2:3')).toBe(false);
    expect(isIpv6('2001::db8::1')).toBe(false);
    expect(isIpv6('example.com')).toBe(false);
  });

  test('kindText 返回中文说明', () => {
    expect(kindText('domain')).toBe('域名');
    expect(kindText('ipv4')).toBe('IPv4 地址');
    expect(kindText('ipv6')).toBe('IPv6 地址');
  });
});

describe('WhoisQuery lib - normalizeQuery', () => {
  test('去掉协议头 / 路径 / 端口 / 结尾点并转小写', () => {
    expect(normalizeQuery('  HTTPS://Example.COM/path ')).toBe('example.com');
    expect(normalizeQuery('http://example.com:8080/a?b=1')).toBe('example.com');
    expect(normalizeQuery('whois://example.com.')).toBe('example.com');
    expect(normalizeQuery('Example.COM')).toBe('example.com');
  });

  test('IP 地址原样保留', () => {
    expect(normalizeQuery(' 8.8.8.8 ')).toBe('8.8.8.8');
    expect(normalizeQuery('2001:DB8::1')).toBe('2001:DB8::1');
  });

  test('空输入返回空串', () => {
    expect(normalizeQuery('   ')).toBe('');
    expect(normalizeQuery('')).toBe('');
  });
});

describe('WhoisQuery lib - validateQuery', () => {
  test('合法输入返回空串', () => {
    expect(validateQuery('example.com')).toBe('');
    expect(validateQuery('https://www.example.co.uk/x')).toBe('');
    expect(validateQuery('8.8.8.8')).toBe('');
    expect(validateQuery('2001:db8::1')).toBe('');
    expect(validateQuery('my_host.example.com')).toBe('');
  });

  test('空输入提示填写', () => {
    expect(validateQuery('  ')).toBe('请输入域名或 IP 地址');
  });

  test('中文域名提示使用 Punycode', () => {
    expect(validateQuery('中文.com')).toBe('暂不支持中文域名, 请使用 Punycode 形式 (如 xn--fiq228c.com)');
  });

  test('超长域名 / 缺少后缀 / 非法标签', () => {
    expect(validateQuery(`${'a'.repeat(250)}.com`)).toBe('域名长度超出限制 (最长 253 个字符)');
    expect(validateQuery('localhost')).toBe('请输入完整域名 (如 example.com)');
    expect(validateQuery('exa mple.com')).toBe('域名格式不正确');
    expect(validateQuery('-bad.example.com')).toBe('域名格式不正确');
    expect(validateQuery('bad-.example.com')).toBe('域名格式不正确');
    expect(validateQuery(`${'a'.repeat(64)}.com`)).toBe('域名格式不正确');
  });

  test('纯数字标签会被当作域名, 非法 IP 片段提示域名不完整', () => {
    // 999.1.1.1 不符合 IPv4 规则, 但作为域名标签是合法的 (仍会去问 Whois, 由服务器返回未注册)
    expect(validateQuery('999.1.1.1')).toBe('');
    expect(validateQuery('1:2:3')).toBe('请输入完整域名 (如 example.com)');
  });
});

describe('WhoisQuery lib - parseWhoisFields', () => {
  test('解析 Verisign 风格 (跳过 >>> 声明与缩进行)', () => {
    const fields = parseWhoisFields(VERISIGN);
    const keys = fields.map((f) => f.key);
    expect(keys).toContain('Domain Name');
    expect(keys).toContain('Domain Status');
    expect(keys).not.toContain('Last update of whois database');
    // Domain Status 出现两次
    expect(keys.filter((k) => k === 'Domain Status')).toHaveLength(2);
    expect(fields[0]).toEqual({ key: 'Domain Name', value: 'EXAMPLE.COM' });
  });

  test('解析 RIPE 风格 (跳过 % 注释)', () => {
    const fields = parseWhoisFields(RIPE);
    expect(fields.map((f) => f.key)).not.toContain('This is the RIPE Database query service.');
    expect(fieldValues(fields, [ 'inetnum' ])).toEqual([ '1.1.1.0 - 1.1.1.255' ]);
    expect(fieldValues(fields, [ 'country' ])).toEqual([ 'AU' ]);
    expect(fieldValues(fields, [ 'abuse-mailbox' ])).toEqual([ 'helpdesk@apnic.net' ]);
  });

  test('解析 ARIN 风格 (# 注释 + 缩进续行忽略)', () => {
    const fields = parseWhoisFields(ARIN);
    expect(fieldValues(fields, [ 'netrange' ])).toEqual([ '8.8.8.0 - 8.8.8.255' ]);
    expect(fieldValues(fields, [ 'orgabuseemail' ])).toEqual([ 'network-abuse@google.com' ]);
    expect(fields.some((f) => f.value.includes('is to use the email'))).toBe(false);
  });

  test('值中可含冒号, 空值行忽略', () => {
    const fields = parseWhoisFields('Registrar URL: http://example.com\nEmpty:\nNoColonLine\n');
    expect(fields).toEqual([ { key: 'Registrar URL', value: 'http://example.com' } ]);
  });

  test('空文本返回空数组', () => {
    expect(parseWhoisFields('')).toEqual([]);
  });
});

describe('WhoisQuery lib - 字段归纳', () => {
  const fields = parseWhoisFields(VERISIGN);

  test('fieldValues 忽略大小写并去重', () => {
    const src: WhoisField[] = [
      { key: 'Country', value: 'US' },
      { key: 'country', value: 'US' },
      { key: 'Country', value: 'CN' },
    ];
    expect(fieldValues(src, [ 'country' ])).toEqual([ 'US', 'CN' ]);
    expect(fieldValues(src, [ 'missing' ])).toEqual([]);
  });

  test('summarizeWhois 按关键字段表顺序输出', () => {
    const items = summarizeWhois(fields);
    expect(items.map((i) => i.label)).toEqual([
      '域名', '注册商', '注册商 Whois 服务器', '注册商网址', '注册时间', '更新时间',
      '到期时间', '域名状态', '名称服务器', 'DNSSEC',
    ]);
    expect(items[0].values).toEqual([ 'EXAMPLE.COM' ]);
    expect(items[7]).toMatchObject({ label: '域名状态', kind: 'tags' });
    expect(items[7].values).toHaveLength(2);
    expect(items[8].kind).toBe('tags');
  });

  test('缺失字段不产生空行', () => {
    const items = summarizeWhois(parseWhoisFields('Domain Name: EXAMPLE.COM\n'));
    expect(items).toEqual([ { label: '域名', values: [ 'EXAMPLE.COM' ], kind: 'text' } ]);
  });

  test('nameServers 去尾点 / 大写 / 去重', () => {
    const src: WhoisField[] = [
      { key: 'Name Server', value: 'a.iana-servers.net.' },
      { key: 'nserver', value: 'A.IANA-SERVERS.NET' },
      { key: 'Name Server', value: 'b.iana-servers.net' },
    ];
    expect(nameServers(src)).toEqual([ 'A.IANA-SERVERS.NET', 'B.IANA-SERVERS.NET' ]);
  });

  test('domainStatuses 压缩多余空白', () => {
    const src: WhoisField[] = [ { key: 'Domain Status', value: 'clientHold   https://icann.org/epp' } ];
    expect(domainStatuses(src)).toEqual([ 'clientHold https://icann.org/epp' ]);
  });

  test('summaryToText 逐行拼接', () => {
    expect(summaryToText([
      { label: '域名', values: [ 'EXAMPLE.COM' ], kind: 'text' },
      { label: '名称服务器', values: [ 'A.X', 'B.X' ], kind: 'tags' },
    ])).toBe('域名: EXAMPLE.COM\n名称服务器: A.X; B.X');
  });

  test('allFields 合并多个分段 (失败分段文本为空)', () => {
    const merged = allFields([
      { server: 'whois.verisign-grs.com', text: 'Domain Name: EXAMPLE.COM', note: null },
      { server: 'whois.iana.org', text: '', note: '连接超时' },
    ]);
    expect(merged).toEqual([ { key: 'Domain Name', value: 'EXAMPLE.COM' } ]);
  });

  test('IP 查询可提取 RIR 字段', () => {
    const items = summarizeWhois(allFields([ { server: 'whois.apnic.net', text: RIPE, note: null } ]));
    const labels = items.map((i) => i.label);
    expect(labels).toContain('地址段');
    expect(labels).toContain('网络名称');
    expect(labels).toContain('所属机构');
    expect(labels).toContain('国家/地区');
    expect(labels).toContain('滥用举报邮箱');
  });
});
