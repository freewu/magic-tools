import { useLocale } from "../../hook/locale-context";

const introZh = `
<h2>DNS 记录类型</h2>
<ul>
<li><p><b>A</b> — 域名对应的 IPv4 地址</p></li>
<li><p><b>AAAA</b> — 域名对应的 IPv6 地址</p></li>
<li><p><b>CNAME</b> — 别名记录, 把域名指向另一个域名</p></li>
<li><p><b>MX</b> — 邮件交换记录, 后面数字为优先级 (越小越优先)</p></li>
<li><p><b>TXT</b> — 文本记录, 常用于 SPF / DKIM / 域名所有权验证</p></li>
<li><p><b>SRV</b> — 服务记录, 格式为 <code>优先级 权重 端口 目标主机</code></p></li>
<li><p><b>NS</b> — 该域名的权威域名服务器</p></li>
</ul>

<h2>怎么用</h2>
<ol>
<li><p>输入域名 (可直接粘贴网址, 会自动去掉 <code>https://</code> 与路径)</p></li>
<li><p>选择记录类型; 选<b>「查询全部」</b>会一次查完上面 7 种类型</p></li>
<li><p>需要时切换 DNS 服务器 (默认使用系统配置, 也可指定阿里 / 腾讯 / Google / Cloudflare 等公共 DNS)</p></li>
</ol>

<h2>结果说明</h2>
<ul>
<li><p><b>状态</b>: 成功 / 域名不存在 (NXDOMAIN) / 该记录类型无数据 (NODATA)</p></li>
<li><p><b>TTL</b>: 记录的缓存存活时间, 单位秒 (DNS 服务器与本地缓存多久后重新查询)</p></li>
<li><p><b>名称</b>: 记录自身的名字。MX / SRV / CNAME 的应答名可能与本域名不同 (例如 MX 指向邮件服务商域名)</p></li>
<li><p>NXDOMAIN 与 NODATA 都是正常的 DNS 应答, 不等于工具出错; 查询超时才表示网络或 DNS 服务器不可用</p></li>
</ul>

<h2>说明</h2>
<ul>
<li><p>DNS 解析由桌面版内置的纯 Rust 解析器完成, <b>浏览器演示版无法发起原始 DNS 查询</b>, 因此该功能仅在桌面应用中可用</p></li>
<li><p>查询使用绝对域名 (自动补结尾点), 不受系统搜索域影响, 结果与 <code>dig</code> / <code>nslookup</code> 一致</p></li>
<li><p>系统 DNS 配置里的失效 / 重复服务器会被自动过滤, 避免等待无效服务器超时</p></li>
</ul>
`;

const introTw = `
<h2>DNS 記錄類型</h2>
<ul>
<li><p><b>A</b> — 網域對應的 IPv4 位址</p></li>
<li><p><b>AAAA</b> — 網域對應的 IPv6 位址</p></li>
<li><p><b>CNAME</b> — 別名記錄, 把網域指向另一個網域</p></li>
<li><p><b>MX</b> — 郵件交換記錄, 後面數字為優先順序 (越小越優先)</p></li>
<li><p><b>TXT</b> — 文字記錄, 常用於 SPF / DKIM / 網域所有權驗證</p></li>
<li><p><b>SRV</b> — 服務記錄, 格式為 <code>優先順序 權重 埠 目標主機</code></p></li>
<li><p><b>NS</b> — 該網域的權威名稱伺服器</p></li>
</ul>

<h2>怎麼用</h2>
<ol>
<li><p>輸入網域 (可直接貼上網址, 會自動去掉 <code>https://</code> 與路徑)</p></li>
<li><p>選擇記錄類型; 選<b>「查詢全部」</b>會一次查完上面 7 種類型</p></li>
<li><p>需要時切換 DNS 伺服器 (預設使用系統設定, 也可指定阿里 / 騰訊 / Google / Cloudflare 等公共 DNS)</p></li>
</ol>

<h2>結果說明</h2>
<ul>
<li><p><b>狀態</b>: 成功 / 網域不存在 (NXDOMAIN) / 該記錄類型無資料 (NODATA)</p></li>
<li><p><b>TTL</b>: 記錄的快取存活時間, 單位秒 (DNS 伺服器與本機快取多久後重新查詢)</p></li>
<li><p><b>名稱</b>: 記錄自身的名字。MX / SRV / CNAME 的應答名可能與本網域不同 (例如 MX 指向郵件服務商網域)</p></li>
<li><p>NXDOMAIN 與 NODATA 都是正常的 DNS 應答, 不等於工具出錯; 查詢逾時才表示網路或 DNS 伺服器不可用</p></li>
</ul>

<h2>說明</h2>
<ul>
<li><p>DNS 解析由桌面版內建的純 Rust 解析器完成, <b>瀏覽器示範版無法發起原始 DNS 查詢</b>, 因此該功能僅在桌面應用程式中可用</p></li>
<li><p>查詢使用絕對網域 (自動補結尾點), 不受系統搜尋網域影響, 結果與 <code>dig</code> / <code>nslookup</code> 一致</p></li>
<li><p>系統 DNS 設定裡的失效 / 重複伺服器會被自動過濾, 避免等待無效伺服器逾時</p></li>
</ul>
`;

const introEn = `
<h2>DNS record types</h2>
<ul>
<li><p><b>A</b> — the IPv4 address of the domain</p></li>
<li><p><b>AAAA</b> — the IPv6 address of the domain</p></li>
<li><p><b>CNAME</b> — an alias pointing the domain at another domain</p></li>
<li><p><b>MX</b> — mail exchanger; the number after it is the priority (lower wins)</p></li>
<li><p><b>TXT</b> — free-form text, widely used for SPF / DKIM / domain verification</p></li>
<li><p><b>SRV</b> — service record, formatted as <code>priority weight port target</code></p></li>
<li><p><b>NS</b> — the authoritative name servers of the domain</p></li>
</ul>

<h2>How to use</h2>
<ol>
<li><p>Enter a domain (you can paste a URL — <code>https://</code> and the path are stripped automatically)</p></li>
<li><p>Pick a record type; choosing <b>"Query all"</b> looks up all seven types above at once</p></li>
<li><p>Switch the DNS server if you like (the system configuration is used by default; AliDNS / DNSPod / Google / Cloudflare are also available)</p></li>
</ol>

<h2>Reading the result</h2>
<ul>
<li><p><b>Status</b>: succeeded / domain does not exist (NXDOMAIN) / no data for this record type (NODATA)</p></li>
<li><p><b>TTL</b>: how long the record may be cached, in seconds</p></li>
<li><p><b>Name</b>: the owner name of the record itself. MX / SRV / CNAME answers may differ from the queried domain (an MX usually points at the mail provider)</p></li>
<li><p>NXDOMAIN and NODATA are legitimate DNS answers, not tool errors; only a timeout means the network or the DNS server is unreachable</p></li>
</ul>

<h2>Notes</h2>
<ul>
<li><p>Resolution is performed by the pure-Rust resolver built into the desktop app. <b>The browser demo cannot issue raw DNS queries</b>, so this feature is only available in the desktop app</p></li>
<li><p>Queries use an absolute name (a trailing dot is appended), so the system search list cannot change the result — output matches <code>dig</code> / <code>nslookup</code></p></li>
<li><p>Stale or duplicated servers in the system DNS configuration are filtered out so queries do not wait for dead servers to time out</p></li>
</ul>
`;

const DnsQueryIntro = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? introTw : locale === 'en' ? introEn : introZh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
}
export default DnsQueryIntro;
