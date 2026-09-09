import { useLocale } from '../../hook/locale-context';

const introZh = `
<h2>希尔密码 (Hill Cipher)</h2>
<blockquote><p>由数学家 Lester S. Hill 于 1929 年提出的<strong>矩阵分组密码</strong>: 密钥是一个 n×n 字母矩阵, 把明文每 n 个字母组成一组列向量, 与密钥矩阵在 <b>mod 26</b> 下相乘得到密文组。由于同时扩散了多个字母, 它比单表替换密码更难用频率分析破解。</p>
</blockquote>
<h2>密钥示例</h2>
<pre><code>密钥 HILL (2×2): [ 7  8 ]    密钥 GYBNQKURP (3×3):
                    [ 11 11 ]     [ 6 24  1 ]   G Y B
                                 [ 13 16 10 ]   N Q K
                                 [ 20 17 15 ]   U R P</code></pre>
<h2>使用说明</h2>
<ul>
<li><p><b>密钥</b>必须为 4 个字母 (2×2) 或 9 个字母 (3×3), 按行填入矩阵; 建议避免全零行/列或行列式与 26 不互质的矩阵</p></li>
<li><p>仅处理 <b>A-Z</b> 字母: 空格、标点、数字、中文等会被自动移除, 输入前请留意</p></li>
<li><p>明文字母数不是矩阵阶数的倍数时, 末尾自动补 <b>X</b>; 因此解密结果末尾可能出现补齐的 X</p></li>
<li><p><b>解密前提</b>: 密钥矩阵的行列式必须与 26 互质 (即存在模逆), 否则报错无法解密——生成密钥时建议先用本工具自测一次往返</p></li>
</ul>
<h2>破解提示</h2>
<blockquote><p>已知明密文对时可通过线性方程组反解密钥矩阵 (Known-plaintext attack), 且矩阵阶数越小越容易破解。</p>
</blockquote>
`;

const introTw = `
<h2>希爾密碼 (Hill Cipher)</h2>
<blockquote><p>由數學家 Lester S. Hill 於 1929 年提出的<strong>矩陣分組密碼</strong>: 金鑰是一個 n×n 字母矩陣, 把明文每 n 個字母組成一個群組行向量, 與金鑰矩陣在 <b>mod 26</b> 下相乘得到密文群組。由於同時擴散了多個字母, 它比單表替換密碼更難用頻率分析破解。</p>
</blockquote>
<h2>金鑰範例</h2>
<pre><code>金鑰 HILL (2×2): [ 7  8 ]    金鑰 GYBNQKURP (3×3):
                    [ 11 11 ]     [ 6 24  1 ]   G Y B
                                 [ 13 16 10 ]   N Q K
                                 [ 20 17 15 ]   U R P</code></pre>
<h2>使用說明</h2>
<ul>
<li><p><b>金鑰</b>必須為 4 個字母 (2×2) 或 9 個字母 (3×3), 依列填入矩陣; 建議避免全零列/行或行列式與 26 不互質的矩陣</p></li>
<li><p>僅處理 <b>A-Z</b> 字母: 空格、標點、數字、中文等會被自動移除, 輸入前請留意</p></li>
<li><p>明文長度不是矩陣階數的倍數時, 末尾自動補 <b>X</b>; 因此解密結果末尾可能出現補齊的 X</p></li>
<li><p><b>解密前提</b>: 金鑰矩陣的行列式必須與 26 互質 (即存在模逆), 否則報錯無法解密——產生金鑰時建議先用本工具自測一次往返</p></li>
</ul>
<h2>破解提示</h2>
<blockquote><p>已知明密文對時可透過線性方程組反解金鑰矩陣 (Known-plaintext attack), 且矩陣階數越小越容易破解。</p>
</blockquote>
`;

const introEn = `
<h2>Hill Cipher</h2>
<blockquote><p>Proposed by the mathematician Lester S. Hill in 1929, this is a <strong>matrix block cipher</strong>: the key is an n×n letter matrix, plaintext letters are grouped into column vectors of n, and each group is multiplied by the key matrix <b>mod 26</b> to produce a ciphertext group. Because several letters are mixed at once, it resists frequency analysis far better than monoalphabetic substitution.</p>
</blockquote>
<h2>Key examples</h2>
<pre><code>Key HILL (2×2): [ 7  8 ]    Key GYBNQKURP (3×3):
                 [ 11 11 ]     [ 6 24  1 ]   G Y B
                               [ 13 16 10 ]   N Q K
                               [ 20 17 15 ]   U R P</code></pre>
<h2>Usage</h2>
<ul>
<li><p>The <b>key</b> must be 4 letters (2×2) or 9 letters (3×3), filled into the matrix row by row; avoid all-zero rows/columns or matrices whose determinant is not coprime with 26</p></li>
<li><p>Only <b>A-Z</b> letters are processed: spaces, punctuation, digits, Chinese etc. are removed automatically, so keep that in mind before pasting</p></li>
<li><p>If the plaintext length is not a multiple of the matrix order, trailing <b>X</b> characters are added automatically; decryption may therefore end with such padding X's</p></li>
<li><p><b>Decryption requires</b> the key matrix determinant to be coprime with 26 (i.e. invertible mod 26); otherwise it errors out — test a round trip in this tool before relying on a generated key</p></li>
</ul>
<h2>Breaking it</h2>
<blockquote><p>With a known plaintext–ciphertext pair the key matrix can be solved from linear equations (known-plaintext attack), and smaller matrices are easier to break.</p>
</blockquote>
`;

const Intro = () => {
  const { locale } = useLocale();
  return <div dangerouslySetInnerHTML={ { __html: locale === 'zh-TW' ? introTw : locale === 'en' ? introEn : introZh } } />;
}
export default Intro;
