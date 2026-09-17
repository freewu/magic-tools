// WhoisQuery 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "Whois 查詢" },
  en: { appName: "Whois Lookup" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const whoisquerylangRows: Record<string, [string, string]> = {
  '查询': ['查詢', 'Query'],
  '查询中': ['查詢中', 'Querying'],
  '输入域名或 IP, 如 example.com 或 8.8.8.8': ['輸入網域或 IP, 如 example.com 或 8.8.8.8', 'Enter a domain or IP, e.g. example.com or 8.8.8.8'],
  '请输入域名或 IP 地址': ['請輸入網域或 IP 位址', 'Enter a domain or IP address'],
  '暂不支持中文域名, 请使用 Punycode 形式 (如 xn--fiq228c.com)': ['暫不支援中文網域, 請使用 Punycode 形式 (如 xn--fiq228c.com)', 'Chinese domain names are not supported yet — use the Punycode form (e.g. xn--fiq228c.com)'],
  '域名长度超出限制 (最长 253 个字符)': ['網域長度超出限制 (最長 253 個字元)', 'The domain name is too long (253 characters max)'],
  '请输入完整域名 (如 example.com)': ['請輸入完整網域 (如 example.com)', 'Enter a complete domain (e.g. example.com)'],
  '域名格式不正确': ['網域格式不正確', 'Invalid domain name'],
  'IP 地址格式不正确': ['IP 位址格式不正確', 'Invalid IP address'],
  '查询失败: {msg}': ['查詢失敗: {msg}', 'Query failed: {msg}'],
  '查询完成: {query} ({kind})': ['查詢完成: {query} ({kind})', 'Done: {query} ({kind})'],
  '域名': ['網域', 'Domain'],
  'IPv4 地址': ['IPv4 位址', 'IPv4 address'],
  'IPv6 地址': ['IPv6 位址', 'IPv6 address'],
  '关键信息': ['關鍵資訊', 'Key information'],
  '未解析出关键信息, 请查看下方原始结果': ['未解析出關鍵資訊, 請查看下方原始結果', 'No key information could be parsed — see the raw result below'],
  '原始结果': ['原始結果', 'Raw result'],
  '共 {n} 跳': ['共 {n} 跳', '{n} hop(s)'],
  '查询失败 (可查看其它跳结果)': ['查詢失敗 (可查看其它跳結果)', 'Query failed (other hops may still have data)'],
  '复制': ['複製', 'Copy'],
  '复制关键信息': ['複製關鍵資訊', 'Copy key information'],
  '复制到粘贴板成功!!!': ['複製到剪貼簿成功!!!', 'Copied to clipboard!!!'],
  '注册商': ['註冊商', 'Registrar'],
  '注册商 Whois 服务器': ['註冊商 Whois 伺服器', 'Registrar WHOIS server'],
  '注册商网址': ['註冊商網址', 'Registrar URL'],
  '注册时间': ['註冊時間', 'Created'],
  '更新时间': ['更新時間', 'Updated'],
  '到期时间': ['到期時間', 'Expires'],
  '域名状态': ['網域狀態', 'Domain status'],
  '名称服务器': ['名稱伺服器', 'Name servers'],
  '地址段': ['位址段', 'Net range'],
  'CIDR': ['CIDR', 'CIDR'],
  '网络名称': ['網路名稱', 'Network name'],
  '所属机构': ['所屬機構', 'Organization'],
  '国家/地区': ['國家/地區', 'Country'],
  '描述': ['描述', 'Description'],
  '滥用举报邮箱': ['濫用檢舉信箱', 'Abuse contact email'],
  '注册人': ['註冊人', 'Registrant'],
  '该功能仅在桌面应用中可用': ['該功能僅在桌面應用程式可用', 'This feature is only available in the desktop app'],
  '下载桌面版': ['下載桌面版', 'Download desktop app'],
  '浏览器版没有应用内 Whois 查询能力 (浏览器不允许直接建立 TCP 43 连接), 请下载桌面版后使用': ['瀏覽器版沒有應用程式內 Whois 查詢能力 (瀏覽器不允許直接建立 TCP 43 連線), 請下載桌面版後使用', 'The browser build has no in-app Whois capability (browsers cannot open raw TCP port 43 connections) — please use the desktop app'],
  'Whois 查询说明': ['Whois 查詢說明', 'About Whois lookup'],
  '输入域名或 IP 后点击「查询」, 将依次查询 IANA / 注册局 / 注册商的 Whois 服务器并汇总关键信息': ['輸入網域或 IP 後點擊「查詢」, 將依序查詢 IANA / 註冊局 / 註冊商的 Whois 伺服器並彙總關鍵資訊', 'Enter a domain or IP and click "Query": the IANA / registry / registrar WHOIS servers are queried in turn and the key information is summarized'],
  'Whois 返回的是纯文本, 不同后缀的字段名与格式差异很大, 本工具会尽量归纳常见字段, 其余内容可在「原始结果」中查看': ['Whois 回傳的是純文字, 不同後綴的欄位名稱與格式差異很大, 本工具會盡量歸納常見欄位, 其餘內容可在「原始結果」中查看', 'WHOIS answers are plain text and field names differ per registry; common fields are normalized here while everything else stays available under "Raw result"'],
  '单个注册局可能通过 refer / Registrar WHOIS Server 转介到下级服务器, 工具最多跟随 3 跳, 后续跳失败不影响已取得的结果': ['單一註冊局可能透過 refer / Registrar WHOIS Server 轉介到下級伺服器, 工具最多跟隨 3 跳, 後續跳失敗不影響已取得的結果', 'A registry can refer to a downstream server via refer / Registrar WHOIS Server; up to 3 hops are followed and a failed later hop does not discard earlier results'],
};

// 取词: 无命中回退 zh 原文 (与项目其它语言包行为一致)
export const wq = (locale: string, zh: string): string => {
  const e = whoisquerylangRows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const wqT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = wq(locale, zh);
  if (v) for (const [k, val] of Object.entries(v)) s = s.split('{'+k+'}').join(String(val));
  return s;
};
