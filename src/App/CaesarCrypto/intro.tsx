import { useLocale } from '../../hook/locale-context';

const introZh = `
<h2>凯撒密码 (Caesar Cipher)</h2>
<blockquote><p>最古老的替换密码之一, 以古罗马统帅凯撒命名: 将明文中的每个字母在字母表中<strong>向后移动固定位数</strong>得到密文。位移 3 即凯撒本人使用的经典形式 (<code>a→d, b→e …</code>)。</p>
</blockquote>
<h2>使用说明</h2>
<ul>
<li><p><b>位移量</b>: 1-25 为常见取值; 负数表示向左移动; 任意整数会自动按 26 取模</p></li>
<li><p>仅对 <b>A-Z / a-z</b> 英文字母位移, 大小写分别保持; 数字、符号、空格及中文等其它字符<strong>原样保留</strong></p></li>
<li><p>加密与解密互为逆运算: 同一位移量下, 「解密」即为反向位移</p></li>
</ul>
<h2>破解提示</h2>
<blockquote><p>凯撒密码总共只有 25 种位移, 可暴力穷举或借助字母频率分析轻易破解, 仅适合教学与简单混淆, 不应作为真实加密手段。</p>
</blockquote>
`;

const introTw = `
<h2>凱撒密碼 (Caesar Cipher)</h2>
<blockquote><p>最古老的替換密碼之一, 以古羅馬統帥凱撒命名: 將明文中的每個字母在字母表中<strong>向後移動固定位數</strong>得到密文。位移 3 即凱撒本人使用的經典形式 (<code>a→d, b→e …</code>)。</p>
</blockquote>
<h2>使用說明</h2>
<ul>
<li><p><b>位移量</b>: 1-25 為常見取值; 負數表示向左移動; 任意整數會自動依 26 取模</p></li>
<li><p>僅對 <b>A-Z / a-z</b> 英文字母位移, 大小寫分別保持; 數字、符號、空格及中文等其它字元<strong>原樣保留</strong></p></li>
<li><p>加密與解密互為逆運算: 同一位移量下, 「解密」即為反向位移</p></li>
</ul>
<h2>破解提示</h2>
<blockquote><p>凱撒密碼總共只有 25 種位移, 可暴力窮舉或藉助字母頻率分析輕易破解, 僅適合教學與簡單混淆, 不應作為真實加密手段。</p>
</blockquote>
`;

const introEn = `
<h2>Caesar Cipher</h2>
<blockquote><p>One of the oldest substitution ciphers, named after the Roman general Julius Caesar: each letter in the plaintext is <strong>shifted a fixed number of places</strong> through the alphabet to produce the ciphertext. A shift of 3 is the classic form Caesar himself used (<code>a→d, b→e …</code>).</p>
</blockquote>
<h2>Usage</h2>
<ul>
<li><p><b>Shift</b>: 1-25 are the common values; a negative number shifts left; any integer is reduced modulo 26 automatically</p></li>
<li><p>Only <b>A-Z / a-z</b> letters are shifted, keeping their case; digits, symbols, spaces, Chinese and any other characters stay <strong>unchanged</strong></p></li>
<li><p>Encryption and decryption are inverse operations: with the same shift, Decrypt is simply the reverse shift</p></li>
</ul>
<h2>Breaking it</h2>
<blockquote><p>A Caesar cipher has only 25 possible shifts, so brute force or letter-frequency analysis breaks it in moments. It is fine for teaching or light obfuscation only — never use it for real encryption.</p>
</blockquote>
`;

const Intro = () => {
  const { locale } = useLocale();
  return <div dangerouslySetInnerHTML={ { __html: locale === 'zh-TW' ? introTw : locale === 'en' ? introEn : introZh } } />;
}
export default Intro;
