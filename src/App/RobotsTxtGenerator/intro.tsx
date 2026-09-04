const intro = `
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

const Intro = () => {
  return <div dangerouslySetInnerHTML={ { __html: intro } } />;
}
export default Intro;
