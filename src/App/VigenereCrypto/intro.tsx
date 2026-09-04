const intro = `
<h2>维吉尼亚密码 (Vigenère Cipher)</h2>
<blockquote><p>文艺复兴时期发明的<strong>多表替换密码</strong>: 用一个字母密钥 (Keyword) 循环重复, 每个明文字母按对应密钥字母的序号向后位移, 因此同一个明文字母在不同位置可加密成不同密文, 曾被称为「不可破译的密码」。</p>
</blockquote>
<h2>示例 (密钥 LEMON)</h2>
<pre><code>明文: ATTACKATDAWN
密钥: LEMONLEMONLE
密文: LXFOPVEFRNHR</code></pre>
<h2>使用说明</h2>
<ul>
<li><p><b>密钥</b>: 仅允许英文字母 (大小写均可), 例如 <code>LEMON</code>; 密钥越长且越随机越难破解</p></li>
<li><p>仅位移 <b>A-Z / a-z</b> 英文字母, 大小写分别保持; 数字、符号、空格及中文等<strong>原样保留</strong>且不消耗密钥位</p></li>
<li><p>加密与解密使用同一密钥互为逆运算</p></li>
</ul>
<h2>破解提示</h2>
<blockquote><p>密钥重复周期若较短, 可先用 Kasiski 检验推断密钥长度, 再对每个位置做频率分析还原密钥, 进而解密全文。</p>
</blockquote>
`;

const Intro = () => {
  return <div dangerouslySetInnerHTML={ { __html: intro } } />;
}
export default Intro;
