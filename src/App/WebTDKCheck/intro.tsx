import { useLocale } from "../../hook/locale-context";

const introZh = `
<h2>什么是 TDK</h2>
<blockquote><p>TDK 是网页 SEO 优化中最基础的三个标签, 指:</p></blockquote>
<ul>
<li><p><b>T (Title)</b> — &lt;title&gt; 网页标题, 显示在浏览器标签与搜索结果标题中</p></li>
<li><p><b>D (Description)</b> — &lt;meta name="description"&gt; 页面描述, 常用于搜索结果摘要</p></li>
<li><p><b>K (KeyWords)</b> — &lt;meta name="keywords"&gt; 页面关键词 (目前主要搜索引擎参考权重已很低)</p></li>
</ul>
<p>源码示例:</p>
<pre>&lt;title&gt;某某网站 - 开发者工具集&lt;/title&gt;
&lt;meta name="keywords" content="开发者工具, 编码解码, 加解密"&gt;
&lt;meta name="description" content="一个集合了编码解码、加解密、格式转换的在线工具箱"&gt;</pre>

<h2>长度建议 (本工具检测口径)</h2>
<ul>
<li><p>标题 (Title): 一般不超过 <b>80 个字符</b></p></li>
<li><p>关键词 (KeyWords): 一般不超过 <b>100 个字符</b></p></li>
<li><p>描述 (Description): 一般不超过 <b>200 个字符</b></p></li>
<li><p>按<b>字符</b>计数 (中文 / 英文各算 1 个字符), 不含标签本身</p></li>
</ul>
<blockquote><p>说明: 各搜索引擎「实际展示长度」通常远小于上述上限 (如移动端标题约 30 字左右就会截断), 建议把核心信息放在标题与描述开头。</p></blockquote>

<h2>说明</h2>
<ul>
<li><p>桌面版 (Tauri) 通过应用内请求抓取网页, <b>不受浏览器跨域 (CORS) 限制</b>; 浏览器演示版仅对允许跨域的站点有效</p></li>
<li><p>自动识别页面字符集 (UTF-8 / GBK 等), 中文内容不会乱码</p></li>
<li><p>title 取第一个 &lt;title&gt;; keywords / description 只匹配 name 属性, 不误认 og:description 等社交标签</p></li>
</ul>
`;

const introTw = `
<h2>什麼是 TDK</h2>
<blockquote><p>TDK 是網頁 SEO 優化中最基礎的三個標籤, 指的是:</p></blockquote>
<ul>
<li><p><b>T (Title)</b> — &lt;title&gt; 網頁標題, 顯示在瀏覽器分頁與搜尋結果標題中</p></li>
<li><p><b>D (Description)</b> — &lt;meta name="description"&gt; 頁面描述, 常用於搜尋結果摘要</p></li>
<li><p><b>K (KeyWords)</b> — &lt;meta name="keywords"&gt; 頁面關鍵詞 (目前主要搜尋引擎參考權重已很低)</p></li>
</ul>
<p>原始碼範例:</p>
<pre>&lt;title&gt;某某網站 - 開發者工具集&lt;/title&gt;
&lt;meta name="keywords" content="開發者工具, 編碼解碼, 加解密"&gt;
&lt;meta name="description" content="一個集合了編碼解碼、加解密、格式轉換的線上工具箱"&gt;</pre>

<h2>長度建議 (本工具檢測口徑)</h2>
<ul>
<li><p>標題 (Title): 一般不超過 <b>80 個字元</b></p></li>
<li><p>關鍵詞 (KeyWords): 一般不超過 <b>100 個字元</b></p></li>
<li><p>描述 (Description): 一般不超過 <b>200 個字元</b></p></li>
<li><p>按<b>字元</b>計數 (中文 / 英文各算 1 個字元), 不含標籤本身</p></li>
</ul>
<blockquote><p>說明: 各搜尋引擎「實際顯示長度」通常遠小於上述上限 (如行動端標題約 30 字左右就會截斷), 建議把核心資訊放在標題與描述開頭。</p></blockquote>

<h2>說明</h2>
<ul>
<li><p>桌面版 (Tauri) 透過應用程式內請求抓取網頁, <b>不受瀏覽器跨域 (CORS) 限制</b>; 瀏覽器示範版僅對允許跨域的站點有效</p></li>
<li><p>自動辨識頁面字元集 (UTF-8 / GBK 等), 中文內容不會亂碼</p></li>
<li><p>title 取第一個 &lt;title&gt;; keywords / description 只比對 name 屬性, 不會誤認 og:description 等社群標籤</p></li>
</ul>
`;

const introEn = `
<h2>What is TDK?</h2>
<blockquote><p>TDK refers to the three most basic meta tags in on-page SEO:</p></blockquote>
<ul>
<li><p><b>T (Title)</b> — the &lt;title&gt; page heading shown in the browser tab and search-result titles</p></li>
<li><p><b>D (Description)</b> — the &lt;meta name="description"&gt; page summary, often used for the search-result snippet</p></li>
<li><p><b>K (KeyWords)</b> — the &lt;meta name="keywords"&gt; page keywords (major search engines now give it very little weight)</p></li>
</ul>
<p>Source example:</p>
<pre>&lt;title&gt;Example site - Developer Toolbox&lt;/title&gt;
&lt;meta name="keywords" content="dev tools, encode, decode, encrypt"&gt;
&lt;meta name="description" content="An online toolbox for encoding, encryption and format conversion"&gt;</pre>

<h2>Length suggestions (what this tool checks)</h2>
<ul>
<li><p>Title: usually no more than <b>80 characters</b></p></li>
<li><p>Keywords: usually no more than <b>100 characters</b></p></li>
<li><p>Description: usually no more than <b>200 characters</b></p></li>
<li><p>Counted by <b>character</b> (Chinese and English letters each count as one), tags themselves excluded</p></li>
</ul>
<blockquote><p>Note: the length actually <i>displayed</i> by search engines is usually far shorter than these limits (e.g. mobile titles are truncated at about 30 characters). Put the key information at the start of the title and description.</p></blockquote>

<h2>Notes</h2>
<ul>
<li><p>The desktop (Tauri) build fetches pages through in-app requests and is <b>not subject to browser CORS limits</b>; the browser demo only works for sites that allow cross-origin access</p></li>
<li><p>The page charset is detected automatically (UTF-8 / GBK etc.), so Chinese content is never garbled</p></li>
<li><p>title takes the first &lt;title&gt;; keywords / description only match the name attribute, so social tags such as og:description are not mistaken for them</p></li>
</ul>
`;

const WebTDKIntro = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? introTw : locale === 'en' ? introEn : introZh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
}
export default WebTDKIntro;
