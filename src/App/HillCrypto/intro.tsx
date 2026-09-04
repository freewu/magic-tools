const intro = `
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

const Intro = () => {
  return <div dangerouslySetInnerHTML={ { __html: intro } } />;
}
export default Intro;
