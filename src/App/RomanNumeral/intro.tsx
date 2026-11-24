import { useLocale } from "../../hook/locale-context";

// 罗马数字说明 (三语); 结构与 Base64 编解码一致: 说明表格 + 规则 + 示例
const introZh = `
<h2>基本符号</h2>
<blockquote><p>罗马数字由 7 个基本符号组合而成, 按「大数在左, 小数在右」相加、小数在左则相减。</p>
</blockquote>
<figure><table>
<thead><tr><th>符号</th><th>数值</th><th>说明</th></tr></thead>
<tbody>
<tr><td>I</td><td>1</td><td>最常用, 最多连写三次 (III = 3)</td></tr>
<tr><td>V</td><td>5</td><td>不重复书写</td></tr>
<tr><td>X</td><td>10</td><td>最多连写三次 (XXX = 30)</td></tr>
<tr><td>L</td><td>50</td><td>不重复书写</td></tr>
<tr><td>C</td><td>100</td><td>最多连写三次 (CCC = 300)</td></tr>
<tr><td>D</td><td>500</td><td>不重复书写</td></tr>
<tr><td>M</td><td>1000</td><td>最多连写三次 (MMM = 3000)</td></tr>
</tbody>
</table></figure>
<h2>减法组合</h2>
<blockquote><p>小数写在大数左侧表示相减, 标准写法只有以下 6 种组合:</p>
</blockquote>
<figure><table>
<thead><tr><th>组合</th><th>数值</th><th>组合</th><th>数值</th><th>组合</th><th>数值</th></tr></thead>
<tbody>
<tr><td>IV</td><td>4</td><td>IX</td><td>9</td><td>XL</td><td>40</td></tr>
<tr><td>XC</td><td>90</td><td>CD</td><td>400</td><td>CM</td><td>900</td></tr>
</tbody>
</table></figure>
<h2>转换规则</h2>
<ol>
<li>把数值从大到小拆解: 1000 → 900 → 500 → 400 → 100 → 90 → 50 → 40 → 10 → 9 → 5 → 4 → 1, 依次贪心拼接</li>
<li>同一符号最多连续出现 3 次; V (5)、L (50)、D (500) 永不重复</li>
<li>只能对「紧随其后的大数」做减法, 因此 IIII (4)、IC (99)、VX (5) 等都是非标准写法 (应写作 IV、XCIX、V)</li>
</ol>
<h2>转换示例</h2>
<pre><code>1     =&gt; I
4     =&gt; IV
9     =&gt; IX
14    =&gt; XIV
40    =&gt; XL
90    =&gt; XC
400   =&gt; CD
1994  =&gt; MCMXCIV
2024  =&gt; MMXXIV
3999  =&gt; MMMCMXCIX
</code></pre>
<h2>表示范围</h2>
<blockquote><p>罗马数字没有 0, 不加上划线 (乘 1000 记法) 时最大只能表示 <b>3999 (MMMCMXCIX)</b>, 因此本工具支持 <b>1 - 3999</b> 的双向转换。</p>
</blockquote>
`;

const introTw = `<h2>基本符號</h2>
<blockquote><p>羅馬數字由 7 個基本符號組合而成, 依「大數在左, 小數在右」相加、小數在左則相減。</p>
</blockquote>
<figure><table>
<thead><tr><th>符號</th><th>數值</th><th>說明</th></tr></thead>
<tbody>
<tr><td>I</td><td>1</td><td>最常用, 最多連寫三次 (III = 3)</td></tr>
<tr><td>V</td><td>5</td><td>不重複書寫</td></tr>
<tr><td>X</td><td>10</td><td>最多連寫三次 (XXX = 30)</td></tr>
<tr><td>L</td><td>50</td><td>不重複書寫</td></tr>
<tr><td>C</td><td>100</td><td>最多連寫三次 (CCC = 300)</td></tr>
<tr><td>D</td><td>500</td><td>不重複書寫</td></tr>
<tr><td>M</td><td>1000</td><td>最多連寫三次 (MMM = 3000)</td></tr>
</tbody>
</table></figure>
<h2>減法組合</h2>
<blockquote><p>小數寫在大數左側表示相減, 標準寫法只有以下 6 種組合:</p>
</blockquote>
<figure><table>
<thead><tr><th>組合</th><th>數值</th><th>組合</th><th>數值</th><th>組合</th><th>數值</th></tr></thead>
<tbody>
<tr><td>IV</td><td>4</td><td>IX</td><td>9</td><td>XL</td><td>40</td></tr>
<tr><td>XC</td><td>90</td><td>CD</td><td>400</td><td>CM</td><td>900</td></tr>
</tbody>
</table></figure>
<h2>轉換規則</h2>
<ol>
<li>把數值從大到小拆解: 1000 → 900 → 500 → 400 → 100 → 90 → 50 → 40 → 10 → 9 → 5 → 4 → 1, 依序貪心拼接</li>
<li>同一符號最多連續出現 3 次; V (5)、L (50)、D (500) 永不重複</li>
<li>只能對「緊隨其後的大數」做減法, 因此 IIII (4)、IC (99)、VX (5) 等都是非標準寫法 (應寫作 IV、XCIX、V)</li>
</ol>
<h2>轉換範例</h2>
<pre><code>1     =&gt; I
4     =&gt; IV
9     =&gt; IX
14    =&gt; XIV
40    =&gt; XL
90    =&gt; XC
400   =&gt; CD
1994  =&gt; MCMXCIV
2024  =&gt; MMXXIV
3999  =&gt; MMMCMXCIX
</code></pre>
<h2>表示範圍</h2>
<blockquote><p>羅馬數字沒有 0, 不加上劃線 (乘 1000 記法) 時最大只能表示 <b>3999 (MMMCMXCIX)</b>, 因此本工具支援 <b>1 - 3999</b> 的雙向轉換。</p>
</blockquote>
`;

const introEn = `<h2>Basic symbols</h2>
<blockquote><p>Roman numerals are built from 7 basic symbols. Values are added when the larger symbol comes first and subtracted when a smaller symbol precedes a larger one.</p>
</blockquote>
<figure><table>
<thead><tr><th>Symbol</th><th>Value</th><th>Notes</th></tr></thead>
<tbody>
<tr><td>I</td><td>1</td><td>May appear up to three times in a row (III = 3)</td></tr>
<tr><td>V</td><td>5</td><td>Never repeated</td></tr>
<tr><td>X</td><td>10</td><td>May appear up to three times (XXX = 30)</td></tr>
<tr><td>L</td><td>50</td><td>Never repeated</td></tr>
<tr><td>C</td><td>100</td><td>May appear up to three times (CCC = 300)</td></tr>
<tr><td>D</td><td>500</td><td>Never repeated</td></tr>
<tr><td>M</td><td>1000</td><td>May appear up to three times (MMM = 3000)</td></tr>
</tbody>
</table></figure>
<h2>Subtractive pairs</h2>
<blockquote><p>A smaller symbol before a larger one means subtraction. There are only six standard pairs:</p>
</blockquote>
<figure><table>
<thead><tr><th>Pair</th><th>Value</th><th>Pair</th><th>Value</th><th>Pair</th><th>Value</th></tr></thead>
<tbody>
<tr><td>IV</td><td>4</td><td>IX</td><td>9</td><td>XL</td><td>40</td></tr>
<tr><td>XC</td><td>90</td><td>CD</td><td>400</td><td>CM</td><td>900</td></tr>
</tbody>
</table></figure>
<h2>Conversion rules</h2>
<ol>
<li>Break the number down in descending order — 1000 → 900 → 500 → 400 → 100 → 90 → 50 → 40 → 10 → 9 → 5 → 4 → 1 — and concatenate greedily</li>
<li>A symbol may repeat at most three times; V (5), L (50) and D (500) are never repeated</li>
<li>Subtraction is only allowed against the next larger symbol, so IIII (4), IC (99) and VX (5) are non-standard (write IV, XCIX, V)</li>
</ol>
<h2>Examples</h2>
<pre><code>1     =&gt; I
4     =&gt; IV
9     =&gt; IX
14    =&gt; XIV
40    =&gt; XL
90    =&gt; XC
400   =&gt; CD
1994  =&gt; MCMXCIV
2024  =&gt; MMXXIV
3999  =&gt; MMMCMXCIX
</code></pre>
<h2>Range</h2>
<blockquote><p>Roman numerals have no zero, and without an overline (multiply-by-1000 notation) the largest value is <b>3999 (MMMCMXCIX)</b>, so this tool converts both ways within <b>1 - 3999</b>.</p>
</blockquote>
`;

const RomanNumeralIntro = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? introTw : locale === 'en' ? introEn : introZh;
  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      style={ { "overflowY": "scroll","height": "300px" }}>
    </div>
  );
}

export default RomanNumeralIntro;
