import { useLocale } from "../../hook/locale-context";

const introZh = `
<h2>MTR 是什么</h2>
<blockquote><p>MTR (My Traceroute) = <b>traceroute + ping</b>: 先逐跳发现到目标主机的完整路径, 然后对路径上的每一跳<b>持续探测</b>, 统计丢包率与 RTT 分布 (最近 / 平均 / 最好 / 最差 / 抖动)。</p></blockquote>
<pre>Start: 2025-08-15T10:00:00+0800
HOST: dev-pc                    Loss%   Snt   Last   Avg  Best  Wrst StDev
  1.|-- 192.168.1.1              0.0%    10    1.2   1.3   1.1   2.0   0.2
  2.|-- 100.112.0.1              0.0%    10    4.5   5.1   4.2   9.9   1.4
  3.|-- ???                     60.0%    10    0.0   0.0   0.0   0.0   0.0
  4.|-- 1.1.1.1                  0.0%    10   12.3  13.0  12.1  18.8   2.2</pre>

<h2>各列含义</h2>
<ul>
<li><p><b>Loss%</b> — 丢包率: 该跳没有回应的探测比例。中间跳出现丢包不一定代表故障 (很多路由器对 TTL 超时报文限速甚至不回应)</p></li>
<li><p><b>Snt</b> — 已发出的探测次数</p></li>
<li><p><b>Last / Avg / Best / Wrst</b> — 最近一次 / 平均 / 最小 / 最大往返时延</p></li>
<li><p><b>抖动 (Jitter)</b> — 相邻两次应答 RTT 差的平均值, 反映链路稳定性</p></li>
</ul>

<h2>工作原理</h2>
<ul>
<li><p>ICMP 回显报文带 TTL: 每经过一台路由器 TTL 减 1, 减到 0 时该路由器回 <b>Time Exceeded</b>, 于是就能逐个发现路径上的节点</p></li>
<li><p>把 TTL 设为 1 得到第一跳, 设为 2 得到第二跳……直到收到目标的 <b>Echo Reply</b> 即认为到达</p></li>
<li><p>本工具<b>不需要管理员权限</b>: Windows 使用 IP Helper API (与系统 ping / tracert 相同), Linux / macOS 优先尝试原始套接字, 无权限时回退到 ping 套接字</p></li>
</ul>

<h2>常见现象</h2>
<ul>
<li><p>只有最后一跳丢包 ⇒ 通常是目标主机或服务端限速, 需要关注</p></li>
<li><p>中间某跳丢包, 但后续跳正常 ⇒ 该路由器只是不回应 TTL 超时, 链路本身没问题</p></li>
<li><p>丢包从某跳开始一路上升 ⇒ 大概率是该跳之后的链路存在拥塞或质量问题</p></li>
<li><p>抖动大 (Jitter 明显) ⇒ 链路排队严重, 常见于跨运营商 / 跨境线路</p></li>
</ul>

<h2>说明</h2>
<ul>
<li><p>ICMP 探测只能在桌面版发起: <b>浏览器不允许发送原始 ICMP 报文</b>, 因此该功能仅在桌面应用中可用</p></li>
<li><p>当前 MTR 引擎基于 ICMPv4, 目标需要具备 IPv4 地址; 输入 IPv6 地址时无法探测</p></li>
<li><p>部分网络会限制 ICMP, 出现大面积超时属正常现象, 可改用 TCP 探测工具 (如 tcping) 交叉验证</p></li>
</ul>
`;

const introTw = `
<h2>MTR 是什麼</h2>
<blockquote><p>MTR (My Traceroute) = <b>traceroute + ping</b>: 先逐跳發現到目標主機的完整路徑, 然後對路徑上的每一跳<b>持續探測</b>, 統計丟包率與 RTT 分布 (最近 / 平均 / 最好 / 最差 / 抖動)。</p></blockquote>
<pre>Start: 2025-08-15T10:00:00+0800
HOST: dev-pc                    Loss%   Snt   Last   Avg  Best  Wrst StDev
  1.|-- 192.168.1.1              0.0%    10    1.2   1.3   1.1   2.0   0.2
  2.|-- 100.112.0.1              0.0%    10    4.5   5.1   4.2   9.9   1.4
  3.|-- ???                     60.0%    10    0.0   0.0   0.0   0.0   0.0
  4.|-- 1.1.1.1                  0.0%    10   12.3  13.0  12.1  18.8   2.2</pre>

<h2>各欄位含義</h2>
<ul>
<li><p><b>Loss%</b> — 丟包率: 該跳沒有回應的探測比例。中間跳出現丟包不一定代表故障 (很多路由器對 TTL 逾時報文限速甚至不回應)</p></li>
<li><p><b>Snt</b> — 已發出的探測次數</p></li>
<li><p><b>Last / Avg / Best / Wrst</b> — 最近一次 / 平均 / 最小 / 最大往返時延</p></li>
<li><p><b>抖動 (Jitter)</b> — 相鄰兩次回應 RTT 差的平均值, 反映鏈路穩定性</p></li>
</ul>

<h2>工作原理</h2>
<ul>
<li><p>ICMP 回顯報文帶 TTL: 每經過一台路由器 TTL 減 1, 減到 0 時該路由器回 <b>Time Exceeded</b>, 於是就能逐個發現路徑上的節點</p></li>
<li><p>把 TTL 設為 1 得到第一跳, 設為 2 得到第二跳……直到收到目標的 <b>Echo Reply</b> 即認為到達</p></li>
<li><p>本工具<b>不需要管理員權限</b>: Windows 使用 IP Helper API (與系統 ping / tracert 相同), Linux / macOS 優先嘗試原始套接字, 無權限時回退到 ping 套接字</p></li>
</ul>

<h2>常見現象</h2>
<ul>
<li><p>只有最後一跳丟包 ⇒ 通常是目標主機或伺服端限速, 需要關注</p></li>
<li><p>中間某一跳丟包, 但後續跳正常 ⇒ 該路由器只是不回應 TTL 逾時, 鏈路本身沒問題</p></li>
<li><p>丟包從某一跳開始一路上升 ⇒ 大概率是該跳之後的鏈路存在壅塞或品質問題</p></li>
<li><p>抖動大 (Jitter 明顯) ⇒ 鏈路排隊嚴重, 常見於跨業者 / 跨境線路</p></li>
</ul>

<h2>說明</h2>
<ul>
<li><p>ICMP 探測只能在桌面版發起: <b>瀏覽器不允許傳送原始 ICMP 封包</b>, 因此該功能僅在桌面應用程式中可用</p></li>
<li><p>目前 MTR 引擎基於 ICMPv4, 目標需要具備 IPv4 位址; 輸入 IPv6 位址時無法探測</p></li>
<li><p>部分網路會限制 ICMP, 出現大面積逾時屬正常現象, 可改用 TCP 探測工具 (如 tcping) 交叉驗證</p></li>
</ul>
`;

const introEn = `
<h2>What is MTR?</h2>
<blockquote><p>MTR (My Traceroute) = <b>traceroute + ping</b>: it first discovers the full path to the target hop by hop, then <b>continuously probes</b> every hop to report packet loss and the RTT distribution (last / average / best / worst / jitter).</p></blockquote>
<pre>Start: 2025-08-15T10:00:00+0800
HOST: dev-pc                    Loss%   Snt   Last   Avg  Best  Wrst StDev
  1.|-- 192.168.1.1              0.0%    10    1.2   1.3   1.1   2.0   0.2
  2.|-- 100.112.0.1              0.0%    10    4.5   5.1   4.2   9.9   1.4
  3.|-- ???                     60.0%    10    0.0   0.0   0.0   0.0   0.0
  4.|-- 1.1.1.1                  0.0%    10   12.3  13.0  12.1  18.8   2.2</pre>

<h2>Columns</h2>
<ul>
<li><p><b>Loss%</b> — share of probes that got no answer on this hop. Loss on intermediate hops is not necessarily a problem (many routers rate-limit or ignore TTL-expired messages)</p></li>
<li><p><b>Snt</b> — probes sent so far</p></li>
<li><p><b>Last / Avg / Best / Wrst</b> — most recent / mean / minimum / maximum round-trip time</p></li>
<li><p><b>Jitter</b> — mean absolute difference between consecutive RTT samples, a stability indicator</p></li>
</ul>

<h2>How it works</h2>
<ul>
<li><p>ICMP echo packets carry a TTL: every router decrements it, and the router that reaches zero returns <b>Time Exceeded</b>, which is how each node on the path is discovered</p></li>
<li><p>TTL 1 gives the first hop, TTL 2 the second, and so on until the target's <b>Echo Reply</b> marks the destination</p></li>
<li><p>No administrator rights are required: Windows uses the IP Helper API (the same mechanism as ping / tracert), while Linux / macOS try a raw socket first and fall back to a ping socket when unprivileged</p></li>
</ul>

<h2>Interpreting the output</h2>
<ul>
<li><p>Loss only on the final hop ⇒ usually the target (or its service) is rate-limiting; worth investigating</p></li>
<li><p>Loss on a middle hop with healthy later hops ⇒ that router simply does not answer TTL-expired packets; the path itself is fine</p></li>
<li><p>Loss starting at some hop and growing afterwards ⇒ likely congestion or a quality problem beyond that hop</p></li>
<li><p>High jitter ⇒ heavy queuing, common on cross-carrier or cross-border links</p></li>
</ul>

<h2>Notes</h2>
<ul>
<li><p>ICMP probing can only be issued by the desktop app: <b>browsers cannot send raw ICMP packets</b>, so this feature is only available in the desktop app</p></li>
<li><p>The engine is ICMPv4 based, so the target needs an IPv4 address; IPv6 literals cannot be probed</p></li>
<li><p>Some networks block ICMP — large amounts of timeouts are expected there; cross-check with a TCP probe (e.g. tcping)</p></li>
</ul>
`;

const MtrQueryIntro = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? introTw : locale === 'en' ? introEn : introZh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
}
export default MtrQueryIntro;
