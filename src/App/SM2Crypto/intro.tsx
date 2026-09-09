import { useLocale } from '../../hook/locale-context';

const introZh = `
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

const introTw = `
<h2>SM2 國密演算法</h2>
<blockquote><p>SM2 是中國國家密碼管理局發布的橢圓曲線公鑰密碼演算法 (GB/T 32918-2016), 基於 <b>256 位元素域橢圓曲線</b>。本工具為純前端 BigInt + SM3 實作, 公鑰加密、私鑰解密, 密文以 <b>C1C3C2</b> 格式輸出。</p>
</blockquote>
<h2>金鑰說明</h2>
<ul>
<li><p><b>私鑰</b>：256 位元隨機整數 d (1 &lt; d &lt; n), 以 <b>64 位 HEX</b> 表示, 必須保密, 用於<strong>解密</strong></p></li>
<li><p><b>公鑰</b>：曲線點 dG, 以 <b>04 || X(64) || Y(64)</b> 未壓縮 HEX 表示, 用於<strong>加密</strong></p></li>
<li><p>可用「從私鑰推導公鑰」由私鑰還原公鑰; 產生後支援匯出為檔案</p></li>
<li><p>格式與 <b>sm-crypto</b> (npm) 完全互通, 也相容帶 / 不帶 04 前綴的 C1 密文</p></li>
</ul>
<h2>加密說明</h2>
<ul>
<li><p>SM2 加密流程: 取隨機數 k → C1 = kG; 共用點 kP = (x2,y2) → KDF 派生金鑰流 → C2 = 明文 ⊕ 金鑰流; C3 = SM3(x2‖M‖y2) 校驗</p></li>
<li><p>密文 = <b>C1 (64B) ‖ C3 (32B) ‖ C2 (與明文等長)</b>, 每位元組轉兩位 HEX, 與 sm-crypto <code>cipherMode = 1</code> 輸出一致</p></li>
<li><p>每次加密隨機數 k 不同, 同一明文密文不同, 屬正常現象</p></li>
<li><p>任意長度明文均可加密 (無 RSA 式區塊長度限制)</p></li>
</ul>
<h2>安全提醒</h2>
<blockquote><p>私鑰請妥善保管, 切勿洩漏; 計算完全在本機前端完成, 金鑰不會上傳。SM2 的金鑰對與 SM4 區塊加密常組合用於國密 HTTPS (TLCP)。</p>
</blockquote>
`;

const introEn = `
<h2>SM2 (Chinese national-standard cryptography)</h2>
<blockquote><p>SM2 is the elliptic-curve public-key algorithm published by the Chinese National Cryptography Administration (GB/T 32918-2016), based on a <b>256-bit prime-field elliptic curve</b>. This tool is a pure-frontend implementation using BigInt + SM3: the public key encrypts and the private key decrypts, with ciphertext in <b>C1C3C2</b> layout.</p>
</blockquote>
<h2>Keys</h2>
<ul>
<li><p><b>Private key</b>: a 256-bit random integer d (1 &lt; d &lt; n), shown as <b>64 HEX digits</b>; keep it secret — it is used for <strong>decryption</strong></p></li>
<li><p><b>Public key</b>: the curve point dG, shown as uncompressed <b>04 || X(64) || Y(64)</b> HEX; it is used for <strong>encryption</strong></p></li>
<li><p>"Derive public key from private key" recovers the public key from the private one; generated keys can be exported to a file</p></li>
<li><p>The format is fully interoperable with <b>sm-crypto</b> (npm); C1 ciphertext with or without the 04 prefix is accepted</p></li>
</ul>
<h2>Encryption notes</h2>
<ul>
<li><p>SM2 flow: pick random k → C1 = kG; shared point kP = (x2,y2) → derive a keystream with KDF → C2 = plaintext ⊕ keystream; C3 = SM3(x2‖M‖y2) for integrity</p></li>
<li><p>Ciphertext = <b>C1 (64B) ‖ C3 (32B) ‖ C2 (same length as plaintext)</b>, each byte as two HEX digits — matching sm-crypto's <code>cipherMode = 1</code> output</p></li>
<li><p>k differs on every encryption, so the same plaintext yields different ciphertext; this is normal</p></li>
<li><p>Plaintext of any length can be encrypted (no RSA-style block limit)</p></li>
</ul>
<h2>Security note</h2>
<blockquote><p>Keep the private key safe and never leak it. All computation happens locally in your browser; keys are never uploaded. SM2 key pairs are often combined with the SM4 block cipher in national-standard HTTPS (TLCP).</p>
</blockquote>
`;

const Intro = () => {
  const { locale } = useLocale();
  return <div dangerouslySetInnerHTML={ { __html: locale === 'zh-TW' ? introTw : locale === 'en' ? introEn : introZh } } />;
}
export default Intro;
