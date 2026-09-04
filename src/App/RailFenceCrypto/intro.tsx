const intro = `
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

const Intro = () => {
  return <div dangerouslySetInnerHTML={ { __html: intro } } />;
}
export default Intro;
