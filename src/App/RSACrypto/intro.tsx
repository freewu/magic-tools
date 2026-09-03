const intro = `
<h2>RSA 加密算法</h2>
<blockquote><p>RSA 是最经典的非对称加密算法 (1977), 基于大整数分解难题。本工具使用 WebCrypto 标准实现 <b>RSA-OAEP</b> 填充 (SHA-256), 公钥加密、私钥解密。</p>
</blockquote>
<h2>密钥说明</h2>
<ul>
<li><p><b>公钥 (SPKI PEM)</b>：<code>-----BEGIN PUBLIC KEY-----</code>, 可公开分发, 用于<strong>加密</strong></p></li>
<li><p><b>私钥 (PKCS#8 PEM)</b>：<code>-----BEGIN PRIVATE KEY-----</code>, 必须保密, 用于<strong>解密</strong></p></li>
<li><p>支持 2048 / 3072 / 4096 位密钥长度, 生成后可用「导出文件」保存为 .pem / .key</p></li>
<li><p>也可直接粘贴其他工具生成的 PKCS#8 / SPKI PEM (openssl genpkey 默认输出 PKCS#8)</p></li>
</ul>
<h2>加密说明</h2>
<ul>
<li><p>2048 位密钥 + OAEP(SHA-256) 单块明文上限为 <b>190 字节</b>, 超过会自动分段加密 (每段密文 = 模长 256 字节), 密文按 Base64 输出</p></li>
<li><p>OAEP 填充带随机性: 同一明文每次加密结果不同, 属正常现象</p></li>
<li><p>OpenSSL 互操作示例:</p>
<pre><code>openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out pri.pem
openssl pkey -in pri.pem -pubout -out pub.pem
echo -n hello | openssl pkeyutl -encrypt -pubin -inkey pub.pem -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 | base64</code></pre>
</li>
</ul>
<h2>安全提醒</h2>
<blockquote><p>私钥请妥善保管, 切勿泄露; 网页工具仅在前端本地计算, 密钥不会上传。</p>
</blockquote>
`;

const Intro = () => {
  return <div dangerouslySetInnerHTML={ { __html: intro } } />;
}
export default Intro;
