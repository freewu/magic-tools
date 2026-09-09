import { useLocale } from "../../hook/locale-context";

const introZh = `
<h2>robots.txt 是什么</h2>
<p>robots.txt 是网站根目录下 (如 <code>https://example.com/robots.txt</code>) 的一个纯文本文件,
用 <b>robots 协议 (Robots Exclusion Protocol)</b> 告诉搜索引擎爬虫: 哪些页面允许抓取、哪些不允许。</p>

<h2>指令说明</h2>
<ul>
<li><p><b>User-agent</b> — 指令作用于哪个爬虫, <code>*</code> 表示所有爬虫 (通配)</p></li>
<li><p><b>Disallow</b> — 禁止抓取的路径, 值需以 <code>/</code> 开头 (如 <code>/admin/</code>)</p></li>
<li><p><b>Allow</b> — 明确允许的路径, 可覆盖同组内更宽泛的 Disallow</p></li>
<li><p><b>Crawl-delay</b> — 抓取间隔秒数 (非标准指令, Yandex / 百度等部分爬虫支持)</p></li>
<li><p><b>Sitemap</b> — Sitemap 地址, 不归属于某个 User-agent, 建议用空行与规则组分隔</p></li>
</ul>
<p>示例:</p>
<pre>User-agent: *
Disallow: /admin/
Allow: /public/
Crawl-delay: 10

Sitemap: https://example.com/sitemap.xml</pre>

<h2>注意</h2>
<ul>
<li><p>规则行 <b>不区分大小写</b> (路径匹配时爬虫一般按不区分大小写处理), 目录结尾建议加 <code>/</code></p></li>
<li><p>robots.txt 只能约束<b>守规矩的爬虫</b>, 不能作为安全防护手段 (敏感内容请配合权限控制)</p></li>
<li><p>文件需以 UTF-8 文本上传到网站根目录; 修改后一般几分钟内生效, 可用
<a href="https://www.google.com/webmasters/tools/robots-testing-tool" target="_blank" rel="noreferrer">Google Robots 测试工具</a>
或直接访问 <code>/robots.txt</code> 验证</p></li>
<li><p>不同爬虫需不同规则时, 请按爬虫分组生成多份再合并 (每个 User-agent 一组)</p></li>
</ul>
`;

const introTw = `
<h2>robots.txt 是什麼</h2>
<p>robots.txt 是放在網站根目錄下 (如 <code>https://example.com/robots.txt</code>) 的純文字檔,
用 <b>robots 協定 (Robots Exclusion Protocol)</b> 告訴搜尋引擎爬蟲: 哪些頁面允許抓取、哪些不允許。</p>

<h2>指令說明</h2>
<ul>
<li><p><b>User-agent</b> — 指令作用於哪個爬蟲, <code>*</code> 表示所有爬蟲 (萬用)</p></li>
<li><p><b>Disallow</b> — 禁止抓取的路徑, 值需以 <code>/</code> 開頭 (如 <code>/admin/</code>)</p></li>
<li><p><b>Allow</b> — 明確允許的路徑, 可覆蓋同組內較寬泛的 Disallow</p></li>
<li><p><b>Crawl-delay</b> — 抓取間隔秒數 (非標準指令, Yandex / 百度等部分爬蟲支援)</p></li>
<li><p><b>Sitemap</b> — Sitemap 位址, 不歸屬於某個 User-agent, 建議用空行與規則組分隔</p></li>
</ul>
<p>範例:</p>
<pre>User-agent: *
Disallow: /admin/
Allow: /public/
Crawl-delay: 10

Sitemap: https://example.com/sitemap.xml</pre>

<h2>注意</h2>
<ul>
<li><p>規則行<b>不分大小寫</b> (路徑比對時爬蟲通常不分大小寫處理), 目錄結尾建議加 <code>/</code></p></li>
<li><p>robots.txt 只能約束<b>守規矩的爬蟲</b>, 不能當作安全防護手段 (敏感內容請搭配權限控制)</p></li>
<li><p>檔案需以 UTF-8 文字上傳到網站根目錄; 修改後通常幾分鐘內生效, 可用
<a href="https://www.google.com/webmasters/tools/robots-testing-tool" target="_blank" rel="noreferrer">Google Robots 測試工具</a>
或直接訪問 <code>/robots.txt</code> 驗證</p></li>
<li><p>不同爬蟲需要不同規則時, 請依爬蟲分組產生多份再合併 (每個 User-agent 一組)</p></li>
</ul>
`;

const introEn = `
<h2>What is robots.txt?</h2>
<p>robots.txt is a plain-text file at the root of a website (e.g. <code>https://example.com/robots.txt</code>).
It uses the <b>Robots Exclusion Protocol</b> to tell search-engine crawlers which pages they may fetch and which they may not.</p>

<h2>Directives</h2>
<ul>
<li><p><b>User-agent</b> — which crawler the rules apply to; <code>*</code> matches every crawler (wildcard)</p></li>
<li><p><b>Disallow</b> — paths that must not be crawled; the value must start with <code>/</code> (e.g. <code>/admin/</code>)</p></li>
<li><p><b>Allow</b> — paths that are explicitly allowed; it can override a broader Disallow in the same group</p></li>
<li><p><b>Crawl-delay</b> — seconds to wait between fetches (a non-standard directive supported by Yandex, Baidu and some others)</p></li>
<li><p><b>Sitemap</b> — the Sitemap URL; it belongs to no User-agent group, so keep it separated by a blank line</p></li>
</ul>
<p>Example:</p>
<pre>User-agent: *
Disallow: /admin/
Allow: /public/
Crawl-delay: 10

Sitemap: https://example.com/sitemap.xml</pre>

<h2>Notes</h2>
<ul>
<li><p>Directive matching is <b>case-insensitive</b> for most crawlers; append a trailing <code>/</code> to directory rules</p></li>
<li><p>robots.txt only constrains <b>well-behaved crawlers</b>; never rely on it for security (protect sensitive content with access control instead)</p></li>
<li><p>Upload the file as UTF-8 text to the site root; changes usually take effect within minutes. Verify with the
<a href="https://www.google.com/webmasters/tools/robots-testing-tool" target="_blank" rel="noreferrer">Google robots.txt tester</a>
or by visiting <code>/robots.txt</code> directly</p></li>
<li><p>When different crawlers need different rules, generate one block per crawler group and merge them (a group per User-agent)</p></li>
</ul>
`;

const RobotsIntro = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? introTw : locale === 'en' ? introEn : introZh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
}
export default RobotsIntro;
