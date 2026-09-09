import { useLocale } from "../../hook/locale-context";
const body_zh = (
  <>
<h2>说明</h2>
<ul>
<li>中文编码就是将 中文转成 unicode 编码加上 %  如:  <code>中</code> =&gt; <code>E4 B8 AD</code> =&gt; <code>%E4%B8%AD</code></li>
<li>encodeURI &amp; encodeURIComponent 对于中文 unicode 编码的 url 再编码  </li>
<li>如果是 gbk / gb2313 / big5 编码后的中文字符会出现解码失败,需要使用后端处理</li>

</ul>
<h2>encodeURIComponent </h2>
<blockquote><p>不转义的字符：A-Z a-z 0-9 - _ . ! ~ * &#39; ( )</p>
</blockquote>
<h2>encodeURI</h2>
<blockquote><p>不转义的字符：A-Z a-z 0-9 - _ . ! ~ * &#39; ( ) ; , / ? : @ &amp; = + $ # </p>
</blockquote>
<h2>encodeURIComponent 和 encodeURI 区别</h2>
<code lang="javascript">
var set1 = &quot;;,/?:@&amp;=+$&quot;;  // 保留字符 <br/>
var set2 = &quot;-_.!~*&#39;()&quot;;   // 不转义字符 <br/>
var set3 = &quot;#&quot;;           // 数字标志 <br/>
var set4 = &quot;ABC abc 123&quot;; // 字母数字字符和空格 <br/>
<br/>
console.log(encodeURI(set1)); // ;,/?:@&amp;=+$ <br/>
console.log(encodeURI(set2)); // -_.!~*&#39;() <br/>
console.log(encodeURI(set3)); // # <br/>
console.log(encodeURI(set4)); // ABC%20abc%20123 (空格被编码为 %20) <br/>
<br/>
console.log(encodeURIComponent(set1)); // %3B%2C%2F%3F%3A%40%26%3D%2B%24 <br/>
console.log(encodeURIComponent(set2)); // -_.!~*&#39;() <br/>
console.log(encodeURIComponent(set3)); // %23 <br/>
console.log(encodeURIComponent(set4)); // ABC%20abc%20123 (空格被编码为 %20) <br/>
</code>
  </>
);
const body_tw = (
  <>
<h2>說明</h2>
<ul>
<li>URL 編碼就是將非 ASCII 字元(如中文)轉成其 unicode 位元組再各加上 %, 例:  <code>中</code> =&gt; <code>E4 B8 AD</code> =&gt; <code>%E4%B8%AD</code></li>
<li>encodeURI 與 encodeURIComponent 會對已為 unicode 編碼的 URL 中的中文再次編碼</li>
<li>若是 gbk / gb2313 / big5 編碼後的中文字元, 解碼會失敗, 需由後端處理</li>

</ul>
<h2>encodeURIComponent</h2>
<blockquote><p>不會轉義的字元: A-Z a-z 0-9 - _ . ! ~ * &#39; ( )</p>
</blockquote>
<h2>encodeURI</h2>
<blockquote><p>不會轉義的字元: A-Z a-z 0-9 - _ . ! ~ * &#39; ( ) ; , / ? : @ &amp; = + $ #</p>
</blockquote>
<h2>encodeURIComponent 與 encodeURI 的區別</h2>
<code lang="javascript">
var set1 = &quot;;,/?:@&amp;=+$&quot;;  // 保留字元 <br/>
var set2 = &quot;-_.!~*&#39;()&quot;;   // 不轉義字元 <br/>
var set3 = &quot;#&quot;;           // 數字標誌 <br/>
var set4 = &quot;ABC abc 123&quot;; // 字母數字字元和空格 <br/>
<br/>
console.log(encodeURI(set1)); // ;,/?:@&amp;=+$ <br/>
console.log(encodeURI(set2)); // -_.!~*&#39;() <br/>
console.log(encodeURI(set3)); // # <br/>
console.log(encodeURI(set4)); // ABC%20abc%20123 (空格被编码为 %20) <br/>
<br/>
console.log(encodeURIComponent(set1)); // %3B%2C%2F%3F%3A%40%26%3D%2B%24 <br/>
console.log(encodeURIComponent(set2)); // -_.!~*&#39;() <br/>
console.log(encodeURIComponent(set3)); // %23 <br/>
console.log(encodeURIComponent(set4)); // ABC%20abc%20123 (空格被编码为 %20) <br/>
</code>
  </>
);
const body_en = (
  <>
<h2>Notes</h2>
<ul>
<li>URL encoding converts non-ASCII characters (e.g. Chinese) into their Unicode bytes prefixed by %, e.g. <code>中</code> =&gt; <code>E4 B8 AD</code> =&gt; <code>%E4%B8%AD</code></li>
<li>encodeURI &amp; encodeURIComponent re-encode Chinese text that is already in a URL as Unicode</li>
<li>Chinese originally encoded as gbk / gb2312 / big5 cannot be decoded here; it must be handled server-side</li>

</ul>
<h2>encodeURIComponent</h2>
<blockquote><p>Characters NOT escaped: A-Z a-z 0-9 - _ . ! ~ * &#39; ( )</p>
</blockquote>
<h2>encodeURI</h2>
<blockquote><p>Characters NOT escaped: A-Z a-z 0-9 - _ . ! ~ * &#39; ( ) ; , / ? : @ &amp; = + $ #</p>
</blockquote>
<h2>Difference between encodeURIComponent and encodeURI</h2>
<code lang="javascript">
var set1 = &quot;;,/?:@&amp;=+$&quot;;  // reserved characters <br/>
var set2 = &quot;-_.!~*&#39;()&quot;;   // unreserved characters <br/>
var set3 = &quot;#&quot;;           // number sign <br/>
var set4 = &quot;ABC abc 123&quot;; // alphanumerics and space <br/>
<br/>
console.log(encodeURI(set1)); // ;,/?:@&amp;=+$ <br/>
console.log(encodeURI(set2)); // -_.!~*&#39;() <br/>
console.log(encodeURI(set3)); // # <br/>
console.log(encodeURI(set4)); // ABC%20abc%20123 (空格被编码为 %20) <br/>
<br/>
console.log(encodeURIComponent(set1)); // %3B%2C%2F%3F%3A%40%26%3D%2B%24 <br/>
console.log(encodeURIComponent(set2)); // -_.!~*&#39;() <br/>
console.log(encodeURIComponent(set3)); // %23 <br/>
console.log(encodeURIComponent(set4)); // ABC%20abc%20123 (空格被编码为 %20) <br/>
</code>
  </>
);
const URLIntro = () => {
  const { locale } = useLocale();
  const sel = locale === 'zh-TW' ? body_tw : locale === 'en' ? body_en : body_zh;
  return (
    <div style={ { "overflowY": "scroll","height": "300px" } }>
      {sel}
    </div>
  );
}

export default URLIntro;
