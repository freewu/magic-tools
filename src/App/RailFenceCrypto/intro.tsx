import { useLocale } from '../../hook/locale-context';

const introZh = `
<h2>栅栏密码 (Rail Fence Cipher)</h2>
<blockquote><p>一种经典<strong>换位密码</strong>: 把明文按锯齿形 (Zigzag) 从上到下依次写入 N 条「栏」, 写满后再<strong>逐栏从上到下</strong>读出, 得到看似打乱的密文。解密时按相同栏数把密文回填各栏即可还原。</p>
</blockquote>
<h2>示例 (3 栏)</h2>
<pre><code>明文: WEAREDISCOVEREDFLEEATONCE
锯齿: W . . . E . . . C ...
      . E . R . D . S . O ...
      . . A . . . I . . . V ...
密文: WECRLTEERDSOEEFEAOCAIVDEN</code></pre>
<h2>使用说明</h2>
<ul>
<li><p><b>栏数</b> N 决定锯齿的起伏周期 (2N-2); 2 栏时等价于把奇偶位拆分</p></li>
<li><p>本工具基于 Unicode 码点做换位, <strong>中文、emoji、符号等任意字符</strong>均可参与, 且不改变内容本身 (仅打乱顺序)</p></li>
<li><p>加密与解密互为逆运算: 同一栏数下密文「解密」即还原原文; 栏数不同则无法还原</p></li>
</ul>
<h2>破解提示</h2>
<blockquote><p>栏数即密钥空间, 穷举 2~几十种栏数即可验证出明文, 仅适合教学与简单混淆。</p>
</blockquote>
`;

const introTw = `
<h2>柵欄密碼 (Rail Fence Cipher)</h2>
<blockquote><p>一種經典<strong>換位密碼</strong>: 把明文依鋸齒形 (Zigzag) 從上到下依序寫入 N 條「欄」, 寫滿後再<strong>逐欄從上到下</strong>讀出, 得到看似打亂的密文。解密時以相同欄數把密文回填各欄即可還原。</p>
</blockquote>
<h2>範例 (3 欄)</h2>
<pre><code>明文: WEAREDISCOVEREDFLEEATONCE
鋸齒: W . . . E . . . C ...
      . E . R . D . S . O ...
      . . A . . . I . . . V ...
密文: WECRLTEERDSOEEFEAOCAIVDEN</code></pre>
<h2>使用說明</h2>
<ul>
<li><p><b>欄數</b> N 決定鋸齒的起伏週期 (2N-2); 2 欄時等價於把奇偶位拆分</p></li>
<li><p>本工具以 Unicode 碼點做換位, <strong>中文、emoji、符號等任意字元</strong>均可參與, 且不改變內容本身 (僅打亂順序)</p></li>
<li><p>加密與解密互為逆運算: 同一欄數下密文「解密」即還原原文; 欄數不同則無法還原</p></li>
</ul>
<h2>破解提示</h2>
<blockquote><p>欄數即金鑰空間, 窮舉 2~數十種欄數即可驗證出明文, 僅適合教學與簡單混淆。</p>
</blockquote>
`;

const introEn = `
<h2>Rail Fence Cipher</h2>
<blockquote><p>A classic <strong>transposition cipher</strong>: the plaintext is written in a zigzag from top to bottom across N "rails", then read off <strong>rail by rail from top to bottom</strong> to produce seemingly scrambled ciphertext. To decrypt, refill the rails with the ciphertext using the same number of rails.</p>
</blockquote>
<h2>Example (3 rails)</h2>
<pre><code>Plaintext: WEAREDISCOVEREDFLEEATONCE
Zigzag:    W . . . E . . . C ...
           . E . R . D . S . O ...
           . . A . . . I . . . V ...
Cipher:    WECRLTEERDSOEEFEAOCAIVDEN</code></pre>
<h2>Usage</h2>
<ul>
<li><p>The number of <b>rails</b> N sets the zigzag period (2N-2); with 2 rails it is equivalent to splitting odd/even positions</p></li>
<li><p>Transposition works on Unicode code points, so <strong>any characters — Chinese, emoji, symbols</strong> — participate, and the content itself is unchanged (only reordered)</p></li>
<li><p>Encryption and decryption are inverse operations: with the same rail count, Decrypt restores the text; a different rail count cannot recover it</p></li>
</ul>
<h2>Breaking it</h2>
<blockquote><p>The rail count is the whole keyspace — trying 2 up to a few dozen rails quickly reveals the plaintext. Fine for teaching or light obfuscation only.</p>
</blockquote>
`;

const Intro = () => {
  const { locale } = useLocale();
  return <div dangerouslySetInnerHTML={ { __html: locale === 'zh-TW' ? introTw : locale === 'en' ? introEn : introZh } } />;
}
export default Intro;
