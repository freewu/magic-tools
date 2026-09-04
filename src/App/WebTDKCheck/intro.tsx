const intro = `
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

const Intro = () => {
  return <div dangerouslySetInnerHTML={ { __html: intro } } />;
}
export default Intro;
