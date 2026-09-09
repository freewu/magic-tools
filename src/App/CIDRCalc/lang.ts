// CIDRCalc 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "CIDR 計算器" },
  en: { appName: "CIDR Calculator" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '十进制': ['十進位', 'Decimal'],
  '位': ['位', 'bits'],
  'r:': ['r:', 'r:'],
  'p:': ['p:', 'p:'],
  '计算': ['計算', 'Compute'],
  '计算结果': ['計算結果', 'Result'],
  '字符': ['字元', 'Characters'],
  '全部': ['全部', 'All'],
  '私有地址 (RFC 1918, 10.0.0.0/8)': ['私有位址 (RFC 1918, 10.0.0.0/8)', 'Private (RFC 1918, 10.0.0.0/8)'],
  '私有地址 (RFC 1918, 172.16.0.0/12)': ['私有位址 (RFC 1918, 172.16.0.0/12)', 'Private (RFC 1918, 172.16.0.0/12)'],
  '私有地址 (RFC 1918, 192.168.0.0/16)': ['私有位址 (RFC 1918, 192.168.0.0/16)', 'Private (RFC 1918, 192.168.0.0/16)'],
  '环回地址 (Loopback 127.0.0.0/8)': ['環回位址 (Loopback 127.0.0.0/8)', 'Loopback (127.0.0.0/8)'],
  '链路本地地址 (Link-Local 169.254.0.0/16)': ['鏈路本地位址 (Link-Local 169.254.0.0/16)', 'Link-Local (169.254.0.0/16)'],
  '运营商级 NAT 共享地址 (CGNAT 100.64.0.0/10)': ['電信級 NAT 共享位址 (CGNAT 100.64.0.0/10)', 'Carrier-grade NAT (CGNAT 100.64.0.0/10)'],
  '文档示例 TEST-NET-1 (192.0.2.0/24, RFC 5737)': ['文件範例 TEST-NET-1 (192.0.2.0/24, RFC 5737)', 'Documentation TEST-NET-1 (192.0.2.0/24, RFC 5737)'],
  '文档示例 TEST-NET-2 (198.51.100.0/24, RFC 5737)': ['文件範例 TEST-NET-2 (198.51.100.0/24, RFC 5737)', 'Documentation TEST-NET-2 (198.51.100.0/24, RFC 5737)'],
  '文档示例 TEST-NET-3 (203.0.113.0/24, RFC 5737)': ['文件範例 TEST-NET-3 (203.0.113.0/24, RFC 5737)', 'Documentation TEST-NET-3 (203.0.113.0/24, RFC 5737)'],
  '组播地址 (Multicast 224.0.0.0/4)': ['群播位址 (Multicast 224.0.0.0/4)', 'Multicast (224.0.0.0/4)'],
  '保留地址 (Reserved 240.0.0.0/4)': ['保留位址 (Reserved 240.0.0.0/4)', 'Reserved (240.0.0.0/4)'],
  '受限广播地址 (255.255.255.255)': ['受限廣播位址 (255.255.255.255)', 'Limited broadcast (255.255.255.255)'],
  '公网地址 (Global Unicast)': ['公網位址 (Global Unicast)', 'Public (Global Unicast)'],
  'A 类': ['A 類', 'Class A'],
  'B 类': ['B 類', 'Class B'],
  'C 类': ['C 類', 'Class C'],
  '单主机': ['單一主機', 'Single host'],
  '点对点': ['點對點', 'Point-to-point'],
  'IP 地址': ['IP 位址', 'IP address'],
  '前缀长度': ['前綴長度', 'Prefix length'],
  '网络地址': ['網路位址', 'Network'],
  '广播地址': ['廣播位址', 'Broadcast'],
  '子网掩码': ['子網路遮罩', 'Subnet mask'],
  '通配符掩码': ['萬用字元遮罩', 'Wildcard mask'],
  '地址总数': ['位址總數', 'Total addresses'],
  '可用主机数': ['可用主機數', 'Usable hosts'],
  '可用地址范围': ['可用位址範圍', 'Usable range'],
  ' (自身)': [' (本身)', ' (itself)'],
  '({n} 位)': ['({n} 位)', '({n} bits)'],
  '个': ['個', ''],
  '— (无可用主机地址)': ['— (無可用主機位址)', '— (no usable host address)'],
  'CIDR 计算器': ['CIDR 計算器', 'CIDR Calculator'],
  '输入 IPv4 CIDR（如 192.168.1.0/24）或纯 IP（按 /32 单主机计算），即时给出网络地址、广播地址、掩码、通配符掩码与主机范围。可直接点下方 A 类 / B 类 / C 类 / 单主机 / 点对点快速示例。': ['輸入 IPv4 CIDR（如 192.168.1.0/24）或純 IP（依 /32 單一主機計算），即時給出網路位址、廣播位址、遮罩、萬用字元遮罩與主機範圍。可直接點下方 A 類 / B 類 / C 類 / 單一主機 / 點對點快速範例。', 'Enter an IPv4 CIDR (e.g. 192.168.1.0/24) or a bare IP (treated as /32 single host) to instantly get the network, broadcast, mask, wildcard mask and host range. Click the Class A / B / C, Single host or Point-to-point quick examples below.'],
  '例如 192.168.1.0/24 或 203.0.113.25': ['例如 192.168.1.0/24 或 203.0.113.25', 'e.g. 192.168.1.0/24 or 203.0.113.25'],
  '已按输入即时计算': ['已依輸入即時計算', 'Calculated instantly from your input'],
  '快速示例:': ['快速範例:', 'Quick examples:'],
  '{i}  →  网络 {n}  /  掩码 {m}': ['{i}  →  網路 {n}  /  遮罩 {m}', '{i}  →  Network {n} / Mask {m}'],
  '/31 网段按 RFC 3021 点对点链路计, 两个地址均可分配使用。': ['/31 網段依 RFC 3021 點對點鏈路計, 兩個位址皆可分配使用。', 'A /31 subnet counts as an RFC 3021 point-to-point link — both addresses are usable.'],
  '/32 为单主机地址 (主机路由), 无网络/广播概念, 仅该 IP 本身可用。': ['/32 為單一主機位址 (主機路由), 無網路/廣播概念, 僅該 IP 本身可用。', 'A /32 is a single-host address (host route) with no network/broadcast concept — only that IP itself is usable.'],
  '无法解析该地址, 请输入形如 192.168.1.0/24 的 CIDR (前缀 0-32), 或直接输入 IPv4 地址 (按 /32 计算)': ['無法解析該位址, 請輸入形如 192.168.1.0/24 的 CIDR (前綴 0-32), 或直接輸入 IPv4 位址 (依 /32 計算)', 'Cannot parse that address. Enter a CIDR such as 192.168.1.0/24 (prefix 0–32), or a bare IPv4 address (treated as /32).'],
  '解析': ['解析', 'Parse'],
  '分': ['分', 'm'],
  '时': ['時', 'h'],
  '或': ['或', 'OR'],
};

// 取词: 无命中回退 zh 原文 (与共享 ui-lang 行为一致)
export const u = (locale: string, zh: string): string => {
  const hit = uilangRows[zh];
  if (!hit) return zh;
  return locale === 'zh-TW' ? hit[0] : locale === 'en' ? hit[1] : zh;
};
export const uT = (locale: string, zhTpl: string, vars?: Record<string, string | number>): string => {
  let out = u(locale, zhTpl);
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
  return out;
};

