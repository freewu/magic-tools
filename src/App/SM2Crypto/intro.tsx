const intro = `
<h2>SM2 国密算法</h2>
<blockquote><p>SM2 是国家密码管理局发布的椭圆曲线公钥密码算法 (GB/T 32918-2016), 基于 <b>256 位素域椭圆曲线</b>。本工具为纯前端 BigInt + SM3 实现, 公钥加密、私钥解密, 密文按 <b>C1C3C2</b> 格式输出。</p>
</blockquote>
<h2>密钥说明</h2>
<ul>
<li><p><b>私钥</b>：256 位随机整数 d (1 &lt; d &lt; n), 以 <b>64 位 HEX</b> 表示, 必须保密, 用于<strong>解密</strong></p></li>
<li><p><b>公钥</b>：曲线点 dG, 以 <b>04 || X(64) || Y(64)</b> 未压缩 HEX 表示, 用于<strong>加密</strong></p></li>
<li><p>可用「从私钥推导公钥」由私钥还原公钥; 生成后支持导出为文件</p></li>
<li><p>格式与 <b>sm-crypto</b> (npm) 完全互通, 也兼容带 / 不带 04 前缀的 C1 密文</p></li>
</ul>
<h2>加密说明</h2>
<ul>
<li><p>SM2 加密流程: 取随机数 k → C1 = kG; 共享点 kP = (x2,y2) → KDF 派生密钥流 → C2 = 明文 ⊕ 密钥流; C3 = SM3(x2‖M‖y2) 校验</p></li>
<li><p>密文 = <b>C1 (64B) ‖ C3 (32B) ‖ C2 (与明文等长)</b>, 每字节转两位 HEX, 与 sm-crypto <code>cipherMode = 1</code> 输出一致</p></li>
<li><p>每次加密随机数 k 不同, 同一明文密文不同, 属正常现象</p></li>
<li><p>任意长度明文均可加密 (无 RSA 式块长限制)</p></li>
</ul>
<h2>安全提醒</h2>
<blockquote><p>私钥请妥善保管, 切勿泄露; 计算完全在本地前端完成, 密钥不会上传。SM2 的密钥对与 SM4 分组加密常组合用于国密 HTTPS (TLCP)。</p>
</blockquote>
`;
const Intro = () => {
  return <div dangerouslySetInnerHTML={ { __html: intro } } />;
}
export default Intro;
