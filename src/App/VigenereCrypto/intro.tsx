import { useLocale } from '../../hook/locale-context';

const introZh = `
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

const introTw = `
<h2>維吉尼亞密碼 (Vigenère Cipher)</h2>
<blockquote><p>文藝復興時期發明的<strong>多表替換密碼</strong>: 以一個字母金鑰 (Keyword) 循環重複, 每個明文字母依對應金鑰字母的序號向後位移, 因此同一個明文字母在不同位置可加密成不同密文, 曾被稱為「不可破譯的密碼」。</p>
</blockquote>
<h2>範例 (金鑰 LEMON)</h2>
<pre><code>明文: ATTACKATDAWN
金鑰: LEMONLEMONLE
密文: LXFOPVEFRNHR</code></pre>
<h2>使用說明</h2>
<ul>
<li><p><b>金鑰</b>: 僅允許英文字母 (大小寫均可), 例如 <code>LEMON</code>; 金鑰越長且越隨機越難破解</p></li>
<li><p>僅位移 <b>A-Z / a-z</b> 英文字母, 大小寫分別保持; 數字、符號、空格及中文等<strong>原樣保留</strong>且不消耗金鑰位</p></li>
<li><p>加密與解密使用同一金鑰互為逆運算</p></li>
</ul>
<h2>破解提示</h2>
<blockquote><p>金鑰重複週期若較短, 可先用 Kasiski 檢驗推斷金鑰長度, 再對每個位置做頻率分析還原金鑰, 進而解密全文。</p>
</blockquote>
`;

const introEn = `
<h2>Vigenère Cipher</h2>
<blockquote><p>Invented during the Renaissance, this is a <strong>polyalphabetic substitution cipher</strong>: a keyword is repeated cyclically and each plaintext letter is shifted by the position of its matching key letter, so the same plaintext letter can encrypt to different ciphertext letters in different places. It was once called "the indecipherable cipher".</p>
</blockquote>
<h2>Example (key LEMON)</h2>
<pre><code>Plaintext: ATTACKATDAWN
Key:       LEMONLEMONLE
Cipher:    LXFOPVEFRNHR</code></pre>
<h2>Usage</h2>
<ul>
<li><p><b>Key</b>: English letters only (either case), e.g. <code>LEMON</code>; a longer, more random key is harder to break</p></li>
<li><p>Only <b>A-Z / a-z</b> letters are shifted, keeping their case; digits, symbols, spaces, Chinese etc. stay <strong>unchanged</strong> and do not consume key positions</p></li>
<li><p>Encryption and decryption use the same key and are inverse operations</p></li>
</ul>
<h2>Breaking it</h2>
<blockquote><p>When the key repeats with a short period, the Kasiski examination can reveal the key length; each position can then be solved by frequency analysis, recovering the key and the whole text.</p>
</blockquote>
`;

const Intro = () => {
  const { locale } = useLocale();
  return <div dangerouslySetInnerHTML={ { __html: locale === 'zh-TW' ? introTw : locale === 'en' ? introEn : introZh } } />;
}
export default Intro;
