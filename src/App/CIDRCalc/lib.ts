// CIDR 计算器 纯逻辑层: IPv4/CIDR 解析与网段计算

/** IPv4 解析结果: 4 段 [a, b, c, d], 非法返回 null */
export function parseIpv4(s: string): number[] | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s.trim());
  if (!m) return null;
  const parts = [1, 2, 3, 4].map((idx) => Number(m[idx]));
  if (parts.some((p) => p < 0 || p > 255)) return null;
  return parts;
}

export function ipToU32(parts: number[]): number {
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

export function u32ToIp(u: number): string {
  return [
    (u >>> 24) & 0xff,
    (u >>> 16) & 0xff,
    (u >>> 8) & 0xff,
    u & 0xff,
  ].join('.');
}

export interface ParsedCidr {
  ip: number[];
  prefix: number;
}

/** 解析 CIDR 或纯 IP (无 / 前缀时按 /32 处理); 非法返回 null */
export function parseCidr(input: string): ParsedCidr | null {
  const s = input.trim();
  if (!s) return null;
  let ipPart = s;
  let prefix = 32;
  const slash = s.indexOf('/');
  if (slash >= 0) {
    ipPart = s.slice(0, slash);
    const pStr = s.slice(slash + 1).trim();
    if (!/^\d{1,2}$/.test(pStr)) return null;
    prefix = Number(pStr);
    if (prefix < 0 || prefix > 32) return null;
  }
  const ip = parseIpv4(ipPart);
  if (!ip) return null;
  return { ip, prefix };
}

export interface CIDRResult {
  input: string;
  ip: string;
  prefix: number;
  mask: string; // 点分十进制掩码
  wildcard: string; // 通配符掩码
  network: string;
  broadcast: string;
  totalHosts: number;
  usableHosts: number;
  firstHost: string | null;
  lastHost: string | null;
  /** 网段性质说明列表 (私网/环回/公网等) */
  nature: string[];
}

/** 网段分类 (基于网段起始地址, 返回中文说明) */
export function classifyNetwork(networkU: number): string[] {
  const inNet = (u: number, bits: number) =>
    (networkU >>> (32 - bits)) === (u >>> (32 - bits));
  const list: string[] = [];
  if (inNet(0x0a000000, 8)) list.push('私有地址 (RFC 1918, 10.0.0.0/8)');
  else if (inNet(0xac100000, 12)) list.push('私有地址 (RFC 1918, 172.16.0.0/12)');
  else if (inNet(0xc0a80000, 16)) list.push('私有地址 (RFC 1918, 192.168.0.0/16)');
  if (inNet(0x7f000000, 8)) list.push('环回地址 (Loopback 127.0.0.0/8)');
  if (inNet(0xa9fe0000, 16)) list.push('链路本地地址 (Link-Local 169.254.0.0/16)');
  if (inNet(0x64400000, 10)) list.push('运营商级 NAT 共享地址 (CGNAT 100.64.0.0/10)');
  if (inNet(0xc0000200, 24)) list.push('文档示例 TEST-NET-1 (192.0.2.0/24, RFC 5737)');
  if (inNet(0xc6336400, 24)) list.push('文档示例 TEST-NET-2 (198.51.100.0/24, RFC 5737)');
  if (inNet(0xcb007100, 24)) list.push('文档示例 TEST-NET-3 (203.0.113.0/24, RFC 5737)');
  if (inNet(0xe0000000, 4)) list.push('组播地址 (Multicast 224.0.0.0/4)');
  if (inNet(0xf0000000, 4)) list.push('保留地址 (Reserved 240.0.0.0/4)');
  if (networkU === 0xffffffff) list.push('受限广播地址 (255.255.255.255)');
  if (list.length === 0) list.push('公网地址 (Global Unicast)');
  return list;
}

/** 计算 CIDR 网段信息; 非法输入返回 null */
export function calcCidr(input: string): CIDRResult | null {
  const parsed = parseCidr(input);
  if (!parsed) return null;
  const { ip, prefix } = parsed;
  const ipU = ipToU32(ip);
  const hostBits = 32 - prefix;
  let mask: number;
  if (prefix === 0) mask = 0;
  else mask = (0xffffffff << hostBits) >>> 0; // prefix=32 时 hostBits=0, <<0 保留全 1
  const networkU = (ipU & mask) >>> 0;
  const broadcastU =
    prefix === 32 ? networkU : (networkU | (~mask >>> 0)) >>> 0;
  const totalHosts = Math.pow(2, hostBits);
  // 可用主机数: /31 点对点 (RFC 3021) 与 /32 单主机按全部地址可用; 其余扣除网络与广播地址
  const usableHosts = prefix <= 30 ? totalHosts - 2 : totalHosts;
  // 首/末可用地址: /31 两个地址均可用 (范围即 network~broadcast); /32 无可用范围
  let firstHost: string | null = null;
  let lastHost: string | null = null;
  if (hostBits >= 1) {
    if (prefix === 31) {
      firstHost = u32ToIp(broadcastU - 1);
      lastHost = u32ToIp(networkU + 1);
    } else {
      firstHost = u32ToIp(networkU + 1);
      lastHost = u32ToIp(broadcastU - 1);
    }
  }

  return {
    input: `${u32ToIp(ipU)}/${prefix}`,
    ip: u32ToIp(ipU),
    prefix,
    mask: u32ToIp(mask),
    wildcard: u32ToIp(~mask >>> 0),
    network: u32ToIp(networkU),
    broadcast: u32ToIp(broadcastU),
    totalHosts,
    usableHosts,
    firstHost,
    lastHost,
    nature: classifyNetwork(networkU),
  };
}

/** 常见网段预设 (快速示例) */
export const CIDR_PRESETS: Array<{ label: string; cidr: string; desc: string }> = [
  { label: 'A 类', cidr: '10.0.0.0/8', desc: 'A 类私网 (超网 10.0.0.0/8)' },
  { label: 'B 类', cidr: '172.16.0.0/16', desc: 'B 类私网 (172.16.0.0/16)' },
  { label: 'C 类', cidr: '192.168.1.0/24', desc: 'C 类私网 (192.168.1.0/24)' },
  { label: '单主机', cidr: '203.0.113.25/32', desc: '单主机地址 (203.0.113.25/32)' },
  { label: '点对点', cidr: '198.51.100.4/30', desc: '点对点链路 (198.51.100.4/30)' },
];
