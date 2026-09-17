// MtrQuery 语言包 (zh 短语即 key, 缺省回退原文)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "MTR 查詢" },
  en: { appName: "MTR Trace" },
} as const;

const mtrquerylangRows: Record<string, [string, string]> = {
  '查询': ['查詢', 'Query'],
  '查询中': ['查詢中', 'Querying'],
  '查询失败: {msg}': ['查詢失敗: {msg}', 'Query failed: {msg}'],
  '输入域名或 IP, 如 example.com 或 1.1.1.1': ['輸入網域或 IP, 如 example.com 或 1.1.1.1', 'Enter a domain or IP, e.g. example.com or 1.1.1.1'],
  '请输入域名或 IP 地址': ['請輸入網域或 IP 位址', 'Enter a domain or IP address'],
  '暂不支持中文域名, 请使用 Punycode 形式': ['暫不支援中文網域, 請使用 Punycode 形式', 'Chinese domain names are not supported yet — use the Punycode form'],
  '域名长度超出限制 (最长 253 个字符)': ['網域長度超出限制 (最長 253 個字元)', 'The domain name is too long (253 characters max)'],
  '请输入完整域名 (如 example.com)': ['請輸入完整網域 (如 example.com)', 'Enter a complete domain (e.g. example.com)'],
  '域名格式不正确': ['網域格式不正確', 'Invalid domain name'],
  '参数': ['參數', 'Options'],
  '最大跳数': ['最大跳數', 'Max hops'],
  '轮次': ['輪次', 'Rounds'],
  '超时 (ms)': ['逾時 (ms)', 'Timeout (ms)'],
  '间隔 (ms)': ['間隔 (ms)', 'Interval (ms)'],
  '反解主机名': ['反解主機名', 'Resolve host names'],
  '停止': ['停止', 'Stop'],
  '继续': ['繼續', 'Resume'],
  '清空': ['清空', 'Clear'],
  '目标': ['目標', 'Target'],
  '共 {n} 跳': ['共 {n} 跳', '{n} hop(s)'],
  '第 {n} 轮': ['第 {n} 輪', 'round {n}'],
  '已到达': ['已到達', 'Reached'],
  '转发中': ['轉發中', 'Forwarding'],
  '不可达': ['不可達', 'Unreachable'],
  '超时': ['逾時', 'Timeout'],
  '探测异常': ['探測異常', 'Probe error'],
  'IPv4 地址': ['IPv4 位址', 'IPv4 address'],
  'IPv6 地址': ['IPv6 位址', 'IPv6 address'],
  'IP 地址': ['IP 位址', 'IP address'],
  '该域名没有 IPv4 地址, ICMP 探测暂只支持 IPv4 目标': ['該網域沒有 IPv4 位址, ICMP 探測暫只支援 IPv4 目標', 'This domain has no IPv4 address — ICMP probing only supports IPv4 targets for now'],
  '跳数': ['跳數', 'Hop'],
  '主机': ['主機', 'Host'],
  '丢包率': ['丟包率', 'Loss'],
  '发包': ['發包', 'Snt'],
  '最近': ['最近', 'Last'],
  '平均': ['平均', 'Avg'],
  '最好': ['最好', 'Best'],
  '最差': ['最差', 'Worst'],
  '抖动': ['抖動', 'Jitter'],
  '状态': ['狀態', 'State'],
  '复制到粘贴板成功!!!': ['複製到剪貼簿成功!!!', 'Copied to clipboard!!!'],
  '复制结果': ['複製結果', 'Copy result'],
  '双击复制内容': ['雙擊複製內容', 'Double-click to copy'],
  '已停止': ['已停止', 'Stopped'],
  '探测完成: {addr} 共 {n} 跳': ['探測完成: {addr} 共 {n} 跳', 'Done: {addr}, {n} hop(s)'],
  '该功能仅在桌面应用中可用': ['該功能僅在桌面應用程式可用', 'This feature is only available in the desktop app'],
  '下载桌面版': ['下載桌面版', 'Download desktop app'],
  '浏览器版没有应用内 ICMP 探测能力 (浏览器不允许发送原始 ICMP 包), 请下载桌面版后使用': ['瀏覽器版沒有應用程式內 ICMP 探測能力 (瀏覽器不允許傳送原始 ICMP 封包), 請下載桌面版後使用', 'The browser build has no in-app ICMP capability (browsers cannot send raw ICMP packets) — please use the desktop app'],
  '输入域名或 IP 后点击「查询」, 工具会先完整发现到目标的路径, 再对每一跳持续探测, 统计丢包率与 RTT 抖动': ['輸入網域或 IP 後點擊「查詢」, 工具會先完整發現到目標的路徑, 再對每一跳持續探測, 統計丟包率與 RTT 抖動', 'Enter a domain or IP and click "Query": the full path to the target is discovered first, then every hop is probed continuously to report packet loss and RTT jitter'],
  'MTR 查询说明': ['MTR 查詢說明', 'About MTR trace'],
  '说明: 首轮会从第 1 跳探测到最大跳数 (完整发现路径), 之后的轮次只探测到已到达目标的那一跳': ['說明: 首輪會從第 1 跳探測到最大跳數 (完整發現路徑), 之後的輪次只探測到已到達目標的那一跳', 'Note: the first round probes from hop 1 up to the max hop count to discover the whole path; later rounds only probe up to the hop that reached the target'],
};

// 取词: 无命中回退 zh 原文
export const mq = (locale: string, zh: string): string => {
  const e = mtrquerylangRows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const mqT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = mq(locale, zh);
  if (v) for (const [k, val] of Object.entries(v)) s = s.split('{'+k+'}').join(String(val));
  return s;
};
