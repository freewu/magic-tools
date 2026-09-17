// DnsQuery 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "DNS 查詢" },
  en: { appName: "DNS Lookup" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const dnsquerylangRows: Record<string, [string, string]> = {
  '域名': ['網域', 'Domain'],
  '记录类型': ['記錄類型', 'Record type'],
  'DNS 服务器': ['DNS 伺服器', 'DNS server'],
  '系统默认': ['系統預設', 'System default'],
  '查询': ['查詢', 'Query'],
  '全部': ['全部', 'All'],
  '查询全部': ['查詢全部', 'Query all'],
  '查询中': ['查詢中', 'Querying'],
  '查询成功': ['查詢成功', 'Query succeeded'],
  '查询失败': ['查詢失敗', 'Query failed'],
  '域名不存在 (NXDOMAIN)': ['網域不存在 (NXDOMAIN)', 'Domain does not exist (NXDOMAIN)'],
  '该记录类型无数据 (NODATA)': ['該記錄類型無資料 (NODATA)', 'No data for this record type (NODATA)'],
  '输入域名, 如 example.com': ['輸入網域, 如 example.com', 'Enter a domain, e.g. example.com'],
  '请输入要查询的域名': ['請輸入要查詢的網域', 'Enter a domain to query'],
  '域名格式不正确': ['網域格式不正確', 'Invalid domain name'],
  '域名长度不能超过 253 个字符': ['網域長度不能超過 253 個字元', 'The domain name cannot exceed 253 characters'],
  '域名标签长度不能超过 63 个字符': ['網域標籤長度不能超過 63 個字元', 'A domain label cannot exceed 63 characters'],
  '查询失败: {msg}': ['查詢失敗: {msg}', 'Query failed: {msg}'],
  '服务器: {server}': ['伺服器: {server}', 'Server: {server}'],
  '耗时: {ms} ms': ['耗時: {ms} ms', 'Elapsed: {ms} ms'],
  '共 {n} 条记录': ['共 {n} 筆記錄', '{n} record(s)'],
  '共 {n} 条': ['共 {n} 筆', '{n}'],
  '类型': ['類型', 'Type'],
  '值': ['值', 'Value'],
  '名称': ['名稱', 'Name'],
  'TTL': ['TTL', 'TTL'],
  '自动刷新': ['自動重新整理', 'Auto refresh'],
  '复制': ['複製', 'Copy'],
  '复制结果': ['複製結果', 'Copy results'],
  '复制到粘贴板成功!!!': ['複製到剪貼簿成功!!!', 'Copied to clipboard!!!'],
  '双击复制内容': ['雙擊複製內容', 'Double-click to copy'],
  '该功能仅在桌面应用中可用': ['該功能僅在桌面應用程式可用', 'This feature is only available in the desktop app'],
  '下载桌面版': ['下載桌面版', 'Download desktop app'],
  '浏览器版没有应用内 DNS 解析能力 (且受同源策略限制), 请下载桌面版后使用': ['瀏覽器版沒有應用程式內 DNS 解析能力 (且受同源策略限制), 請下載桌面版後使用', 'The browser build has no in-app DNS resolution (and is limited by the same-origin policy) — please use the desktop app'],
  'DNS 查询说明': ['DNS 查詢說明', 'About DNS lookup'],
  '输入域名后点击「查询」, 将向指定 DNS 服务器查询 A / AAAA / CNAME / MX / TXT / SRV / NS 记录': ['輸入網域後點擊「查詢」, 將向指定 DNS 伺服器查詢 A / AAAA / CNAME / MX / TXT / SRV / NS 記錄', 'Enter a domain and click "Query" to look up A / AAAA / CNAME / MX / TXT / SRV / NS records against the selected DNS server'],
  '查询全部时将依次查询以上 7 种记录类型, 便于一次性查看域名的全部解析情况': ['查詢全部時將依序查詢以上 7 種記錄類型, 便於一次性查看網域的全部解析情況', 'With "Query all", the seven record types above are queried so you can inspect the whole DNS setup at once'],
  '记录类型无数据时通常表示该域名未配置此类记录, 并非错误': ['記錄類型無資料時通常表示該網域未配置此類記錄, 並非錯誤', 'No data for a record type usually just means the domain has no such record — it is not an error'],
  '例如 MX / SRV 记录的应答域名可能与本域名不同, 「名称」列展示的是记录自身的名字': ['例如 MX / SRV 記錄的應答網域可能與本網域不同, 「名稱」欄展示的是記錄自身的名字', 'For MX / SRV records the answering name may differ from the queried domain; the "Name" column shows the record owner name'],
};

// 取词: 无命中回退 zh 原文 (与项目其它语言包行为一致)
export const dq = (locale: string, zh: string): string => {
  const e = dnsquerylangRows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const dqT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = dq(locale, zh);
  if (v) for (const [k, val] of Object.entries(v)) s = s.split('{'+k+'}').join(String(val));
  return s;
};
