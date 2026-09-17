import { useLocale } from "../../hook/locale-context";

const introZh = `
<h2>什么是 Whois</h2>
<blockquote><p>Whois 是查询域名与 IP 地址注册信息的协议 (TCP 43 端口): 域名可查到注册商、注册 / 到期时间、名称服务器、域名状态等; IP 可查到所属机构、地址段、滥用举报邮箱等。</p></blockquote>
<p>Whois 返回的是<b>纯文本</b>, 由各注册局自行定义格式, 因此字段名差异很大:</p>
<pre>Domain Name: EXAMPLE.COM
Registrar: RESERVED-Internet Assigned Numbers Authority
Creation Date: 1995-08-14T04:00:00Z
Registry Expiry Date: 2025-08-13T04:00:00Z
Name Server: A.IANA-SERVERS.NET
Domain Status: clientDeleteProhibited https://icann.org/epp#clientDeleteProhibited</pre>

<h2>转介 (referral)</h2>
<ul>
<li><p>注册局的响应里常带 <code>ReferralServer</code> / <code>Registrar WHOIS Server</code> / <code>refer:</code> 等字段, 指向真正保存详细信息的下级服务器 (例如注册商自己的 Whois)</p></li>
<li><p>本工具会自动跟随这类转介, <b>最多 3 跳</b>; 已成功的结果会保留, 某跳失败不影响其它跳</p></li>
<li><p>IP 地址先问 IANA, 由它转介到对应的地区互联网注册管理机构 (RIR: ARIN / RIPE / APNIC / LACNIC / AFRINIC)</p></li>
</ul>

<h2>常见域名状态 (EPP status)</h2>
<ul>
<li><p><b>clientTransferProhibited</b> — 禁止转移注册商 (防止域名被恶意转走, 属正常锁定)</p></li>
<li><p><b>clientDeleteProhibited / clientUpdateProhibited</b> — 禁止删除 / 修改</p></li>
<li><p><b>clientHold</b> — 暂停解析 (域名可能已欠费或被投诉)</p></li>
<li><p><b>pendingDelete / redemptionPeriod</b> — 已过期进入赎回期或待删除</p></li>
<li><p><b>ok / active</b> — 正常状态</p></li>
</ul>

<h2>说明</h2>
<ul>
<li><p>Whois 由桌面版内置的 TCP 客户端查询, <b>浏览器演示版无法建立 TCP 43 连接</b>, 因此该功能仅在桌面应用中可用</p></li>
<li><p>部分后缀 (如 .com / .net 的注册局) 出于反垃圾考虑会隐藏注册人姓名与邮箱, 属于正常现象</p></li>
<li><p>出于隐私合规, 越来越多注册局只提供精简结果; 需要精确联系方式时请以注册商页面为准</p></li>
<li><p>查询有频率限制, 请勿短时间内高频查询同一对象</p></li>
</ul>
`;

const introTw = `
<h2>什麼是 Whois</h2>
<blockquote><p>Whois 是查詢網域與 IP 位址註冊資訊的協定 (TCP 43 埠): 網域可查到註冊商、註冊 / 到期時間、名稱伺服器、網域狀態等; IP 可查到所屬機構、位址段、濫用檢舉信箱等。</p></blockquote>
<p>Whois 回傳的是<b>純文字</b>, 由各註冊局自行定義格式, 因此欄位名稱差異很大:</p>
<pre>Domain Name: EXAMPLE.COM
Registrar: RESERVED-Internet Assigned Numbers Authority
Creation Date: 1995-08-14T04:00:00Z
Registry Expiry Date: 2025-08-13T04:00:00Z
Name Server: A.IANA-SERVERS.NET
Domain Status: clientDeleteProhibited https://icann.org/epp#clientDeleteProhibited</pre>

<h2>轉介 (referral)</h2>
<ul>
<li><p>註冊局的回應裡常帶 <code>ReferralServer</code> / <code>Registrar WHOIS Server</code> / <code>refer:</code> 等欄位, 指向真正保存詳細資訊的下級伺服器 (例如註冊商自己的 Whois)</p></li>
<li><p>本工具會自動跟隨這類轉介, <b>最多 3 跳</b>; 已成功的結果會保留, 某一跳失敗不影響其它跳</p></li>
<li><p>IP 位址先問 IANA, 由它轉介到對應的地區網際網路註冊管理機構 (RIR: ARIN / RIPE / APNIC / LACNIC / AFRINIC)</p></li>
</ul>

<h2>常見網域狀態 (EPP status)</h2>
<ul>
<li><p><b>clientTransferProhibited</b> — 禁止轉移註冊商 (防止網域被惡意轉走, 屬正常鎖定)</p></li>
<li><p><b>clientDeleteProhibited / clientUpdateProhibited</b> — 禁止刪除 / 修改</p></li>
<li><p><b>clientHold</b> — 暫停解析 (網域可能已欠費或被檢舉)</p></li>
<li><p><b>pendingDelete / redemptionPeriod</b> — 已過期進入贖回期或待刪除</p></li>
<li><p><b>ok / active</b> — 正常狀態</p></li>
</ul>

<h2>說明</h2>
<ul>
<li><p>Whois 由桌面版內建的 TCP 客戶端查詢, <b>瀏覽器示範版無法建立 TCP 43 連線</b>, 因此該功能僅在桌面應用程式中可用</p></li>
<li><p>部分後綴 (如 .com / .net 的註冊局) 出於反垃圾考量會隱藏註冊人姓名與信箱, 屬於正常現象</p></li>
<li><p>出於隱私合規, 越來越多註冊局只提供精簡結果; 需要精確聯絡方式時請以註冊商頁面為準</p></li>
<li><p>查詢有頻率限制, 請勿短時間內高頻查詢同一對象</p></li>
</ul>
`;

const introEn = `
<h2>What is Whois?</h2>
<blockquote><p>Whois is the protocol (TCP port 43) used to look up registration information for domains and IP addresses: for a domain you get the registrar, creation / expiry dates, name servers and domain status; for an IP you get the organization, net range and abuse contact.</p></blockquote>
<p>WHOIS replies are <b>plain text</b> defined by each registry, so field names vary a lot:</p>
<pre>Domain Name: EXAMPLE.COM
Registrar: RESERVED-Internet Assigned Numbers Authority
Creation Date: 1995-08-14T04:00:00Z
Registry Expiry Date: 2025-08-13T04:00:00Z
Name Server: A.IANA-SERVERS.NET
Domain Status: clientDeleteProhibited https://icann.org/epp#clientDeleteProhibited</pre>

<h2>Referrals</h2>
<ul>
<li><p>Registry answers often contain <code>ReferralServer</code> / <code>Registrar WHOIS Server</code> / <code>refer:</code> fields pointing at the downstream server that holds the details (the registrar's own WHOIS, for example)</p></li>
<li><p>Referrals are followed automatically for <b>up to 3 hops</b>; results already obtained are kept even if a later hop fails</p></li>
<li><p>IP addresses are first sent to IANA, which refers them to the responsible Regional Internet Registry (ARIN / RIPE / APNIC / LACNIC / AFRINIC)</p></li>
</ul>

<h2>Common domain statuses (EPP)</h2>
<ul>
<li><p><b>clientTransferProhibited</b> — transfers locked (anti-hijacking protection; this is normal)</p></li>
<li><p><b>clientDeleteProhibited / clientUpdateProhibited</b> — deletion / updates locked</p></li>
<li><p><b>clientHold</b> — resolution suspended (the domain may be unpaid or reported)</p></li>
<li><p><b>pendingDelete / redemptionPeriod</b> — expired, in the redemption period or awaiting deletion</p></li>
<li><p><b>ok / active</b> — normal</p></li>
</ul>

<h2>Notes</h2>
<ul>
<li><p>WHOIS is queried by the TCP client built into the desktop app. <b>The browser demo cannot open TCP port 43 connections</b>, so this feature is only available in the desktop app</p></li>
<li><p>Some registries (.com / .net for instance) redact registrant names and e-mail addresses for anti-spam reasons — that is expected</p></li>
<li><p>More and more registries return a trimmed answer for privacy compliance; check the registrar's site when you need exact contact details</p></li>
<li><p>WHOIS servers rate-limit queries — please do not hammer the same object</p></li>
</ul>
`;

const WhoisQueryIntro = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? introTw : locale === 'en' ? introEn : introZh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
}
export default WhoisQueryIntro;
