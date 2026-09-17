import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>生成申请 SSL / TLS 证书所需的<b>私钥</b> (<code>server.key</code>) 与 <b>CSR 证书签名请求</b> (<code>server.csr</code>): 填好主体信息 (CN / O / OU / L / ST / C / Email) 与备用名称 (SAN) 后一键生成, 私钥与 CSR 都在本机浏览器里用 WebCrypto 生成, 不会上传任何服务器。把 <code>server.csr</code> 提交给 CA (或自建 CA) 换取证书, 私钥留在自己手里配合证书部署即可。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>填写「通用名称 (CN)」: 单域名证书填完整域名 (如 <code>www.example.com</code>), 通配符证书填 <code>*.example.com</code></p></li>
<li><p>按 CA 要求填写「组织 (O)」「部门 (OU)」「城市 (L)」「省份 (ST)」「国家代码 (C)」「邮箱」: 申请 OV / EV 证书时必须与营业执照等信息一致, 域名型 (DV) 证书通常只核对 CN 与 SAN</p></li>
<li><p>填写「SAN (备用名称)」: 一行一个域名或 IP, DNS 支持最左通配符 (如 <code>*.example.com</code>); 留空时会自动把 CN 作为唯一 SAN</p></li>
<li><p>选择「密钥算法」位数与「私钥格式」, 点「生成密钥与 CSR」 (4096 位在部分设备上需要几秒, 属正常现象)</p></li>
<li><p>生成后核对「生成结果摘要」里的主体与 SAN, 然后分别点「复制」或「保存为 server.key / server.csr」</p></li>
<li><p>把 <code>server.csr</code> 提交给 CA; 拿到证书文件后, 用<b>同一把</b> <code>server.key</code> 与证书一起配置服务器 (Nginx / Apache / IIS / 宝塔等)</p></li>
</ul>

<h2>SAN 填写说明</h2>
<ul>
<li><p><b>DNS 名称</b>: <code>example.com</code>、<code>www.example.com</code>、<code>*.example.com</code> (通配符只能放在最左侧, 且只能覆盖一级子域)</p></li>
<li><p><b>IP 地址</b>: 支持 IPv4 与 IPv6 (含 <code>::</code> 压缩写法), 自动识别, 也可写成 <code>IP:192.168.1.10</code> 强制按 IP 处理</p></li>
<li><p>分隔符可以是<b>换行、逗号、分号或空格</b>, 重复项会自动去重; 无法识别的条目会在点生成时提示</p></li>
<li><p>现代浏览器与手机 App 已完全忽略 CN, 只看 SAN, 所以只填 CN 不填 SAN 时, 本工具会自动用 CN 兜底 (这也是 CA 签发时的常规做法)</p></li>
</ul>

<h2>私钥与 CSR 的关系</h2>
<ul>
<li><p><b>私钥 (<code>server.key</code>)</b>: 只在本机生成、只在本机保存, 一旦泄露证书就失去意义; 请勿通过聊天工具 / 邮件发送, 建议保存后设置 <code>chmod 600</code> 并妥善备份</p></li>
<li><p><b>CSR (<code>server.csr</code>)</b>: 只包含公钥与主体信息 (不含私钥), 可以安全地提交给 CA 或粘贴到 CA 的申请页面</p></li>
<li><p><b>CSR 指纹 (SHA-256)</b>: 按整个 CSR 的 DER 字节计算, 用于和 CA 侧收到的文件核对是否一致 (例如 <code>openssl req -in server.csr -noout -fingerprint -sha256</code>)</p></li>
<li><p><b>私钥格式</b>: PKCS#8 (<code>BEGIN PRIVATE KEY</code>) 是 OpenSSL 3.x 的默认格式; PKCS#1 (<code>BEGIN RSA PRIVATE KEY</code>) 在旧版软件里更常见。两者只是同一把密钥的不同封装, 可用 <code>openssl pkcs8 -topk8 -nocrypt</code> / <code>openssl rsa -traditional</code> 互相转换</p></li>
<li><p>换证书时若沿用同一把私钥, 直接重新生成 CSR 即可; 若怀疑私钥泄露, 请重新生成密钥并让 CA 重签证书</p></li>
</ul>

<h2>验证与说明</h2>
<ul>
<li><p>可用 OpenSSL 复核生成结果: <code>openssl req -in server.csr -noout -verify -text</code> (校验签名并查看主体 / SAN)、<code>openssl rsa -in server.key -check -noout</code> (校验私钥)</p></li>
<li><p>自签名证书 (测试用) 可以一条命令直接从私钥与 CSR 生成: <code>openssl x509 -req -in server.csr -signkey server.key -days 3650 -out server.crt</code></p></li>
<li><p>签名算法固定为 SHA-256 + RSA (sha256WithRSAEncryption), 兼容所有主流 CA 与服务器</p></li>
<li><p>全部计算都在本地浏览器 (或桌面端 WebView) 内完成, 不联网、不缓存、不上传</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>產生申請 SSL / TLS 憑證所需的<b>私鑰</b> (<code>server.key</code>) 與 <b>CSR 憑證簽名請求</b> (<code>server.csr</code>): 填好主體資訊 (CN / O / OU / L / ST / C / Email) 與備用名稱 (SAN) 後一鍵產生, 私鑰與 CSR 都在本機瀏覽器裡用 WebCrypto 產生, 不會上傳任何伺服器。把 <code>server.csr</code> 提交給 CA (或自建 CA) 換取憑證, 私鑰留在自己手裡配合憑證部署即可。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>填寫「通用名稱 (CN)」: 單網域憑證填完整網域 (如 <code>www.example.com</code>), 萬用字元憑證填 <code>*.example.com</code></p></li>
<li><p>依 CA 要求填寫「組織 (O)」「部門 (OU)」「城市 (L)」「省份 (ST)」「國家代碼 (C)」「電子郵件」: 申請 OV / EV 憑證時必須與營業登記等資訊一致, 網域型 (DV) 憑證通常只核對 CN 與 SAN</p></li>
<li><p>填寫「SAN (備用名稱)」: 一列一個網域或 IP, DNS 支援最左側萬用字元 (如 <code>*.example.com</code>); 留空時會自動把 CN 當作唯一 SAN</p></li>
<li><p>選擇「金鑰演算法」位數與「私鑰格式」, 點「產生金鑰與 CSR」 (4096 位元在部分裝置上需要幾秒, 屬正常現象)</p></li>
<li><p>產生後核對「產生結果摘要」裡的主體與 SAN, 然後分別點「複製」或「儲存為 server.key / server.csr」</p></li>
<li><p>把 <code>server.csr</code> 提交給 CA; 拿到憑證檔案後, 用<b>同一把</b> <code>server.key</code> 與憑證一起設定伺服器 (Nginx / Apache / IIS / 寶塔等)</p></li>
</ul>

<h2>SAN 填寫說明</h2>
<ul>
<li><p><b>DNS 名稱</b>: <code>example.com</code>、<code>www.example.com</code>、<code>*.example.com</code> (萬用字元只能放最左側, 且只能涵蓋一層子網域)</p></li>
<li><p><b>IP 位址</b>: 支援 IPv4 與 IPv6 (含 <code>::</code> 壓縮寫法), 自動識別, 也可寫成 <code>IP:192.168.1.10</code> 強制以 IP 處理</p></li>
<li><p>分隔符可以是<b>換行、逗號、分號或空格</b>, 重複項會自動去重; 無法識別的項目會在點產生時提示</p></li>
<li><p>現代瀏覽器與手機 App 已完全忽略 CN, 只看 SAN, 所以只填 CN 不填 SAN 時, 本工具會自動用 CN 打包 (這也是 CA 簽發時的常規做法)</p></li>
</ul>

<h2>私鑰與 CSR 的關係</h2>
<ul>
<li><p><b>私鑰 (<code>server.key</code>)</b>: 只在本機產生、只在本機儲存, 一旦洩露憑證就失去意義; 請勿透過聊天工具 / 郵件傳送, 建議儲存後設定 <code>chmod 600</code> 並妥善備份</p></li>
<li><p><b>CSR (<code>server.csr</code>)</b>: 只包含公鑰與主體資訊 (不含私鑰), 可以安全地提交給 CA 或貼到 CA 的申請頁面</p></li>
<li><p><b>CSR 指紋 (SHA-256)</b>: 依整個 CSR 的 DER 位元組計算, 用於和 CA 側收到的檔案核對是否一致 (例如 <code>openssl req -in server.csr -noout -fingerprint -sha256</code>)</p></li>
<li><p><b>私鑰格式</b>: PKCS#8 (<code>BEGIN PRIVATE KEY</code>) 是 OpenSSL 3.x 的預設格式; PKCS#1 (<code>BEGIN RSA PRIVATE KEY</code>) 在舊版軟體裡更常見。兩者只是同一把金鑰的不同封裝, 可用 <code>openssl pkcs8 -topk8 -nocrypt</code> / <code>openssl rsa -traditional</code> 互相轉換</p></li>
<li><p>換憑證時若沿用同一把私鑰, 直接重新產生 CSR 即可; 若懷疑私鑰洩露, 請重新產生金鑰並請 CA 重簽憑證</p></li>
</ul>

<h2>驗證與說明</h2>
<ul>
<li><p>可用 OpenSSL 複核產生結果: <code>openssl req -in server.csr -noout -verify -text</code> (驗證簽名並查看主體 / SAN)、<code>openssl rsa -in server.key -check -noout</code> (驗證私鑰)</p></li>
<li><p>自簽憑證 (測試用) 可以一行指令直接從私鑰與 CSR 產生: <code>openssl x509 -req -in server.csr -signkey server.key -days 3650 -out server.crt</code></p></li>
<li><p>簽名演算法固定為 SHA-256 + RSA (sha256WithRSAEncryption), 相容所有主流 CA 與伺服器</p></li>
<li><p>全部計算都在本機瀏覽器 (或桌面端 WebView) 內完成, 不連網、不快取、不上傳</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Generates the <b>private key</b> (<code>server.key</code>) and the <b>CSR</b> (<code>server.csr</code>) you need to apply for an SSL / TLS certificate. Fill in the subject (CN / O / OU / L / ST / C / Email) and the SAN list, click once, and both files are produced locally with WebCrypto — nothing is uploaded. Submit the CSR to your CA (or your own CA) to obtain the certificate and keep the private key on your own machine.</p></blockquote>

<h2>Steps</h2>
<ul>
<li><p>Fill in <b>Common Name (CN)</b>: use the full host name for a single-domain certificate (<code>www.example.com</code>) or <code>*.example.com</code> for a wildcard</p></li>
<li><p>Fill in <b>Organization (O)</b>, <b>OU</b>, <b>Locality (L)</b>, <b>State (ST)</b>, <b>Country (C)</b> and <b>Email</b> as your CA requires: OV / EV certificates must match your business registration, while domain-validated (DV) certificates only check the CN and SAN</p></li>
<li><p>Fill in the <b>SAN</b> list: one domain or IP per line; DNS entries may use a leftmost wildcard (<code>*.example.com</code>). When left empty the CN is used as the only SAN</p></li>
<li><p>Pick the <b>key algorithm</b> size and the <b>private key format</b>, then click "Generate key &amp; CSR" (4096-bit keys take a few seconds on some devices)</p></li>
<li><p>Check the subject and SANs in the <b>result summary</b>, then copy or save <code>server.key</code> / <code>server.csr</code></p></li>
<li><p>Submit <code>server.csr</code> to your CA; once the certificate arrives, deploy it together with <b>the same</b> <code>server.key</code> (Nginx / Apache / IIS / cPanel, …)</p></li>
</ul>

<h2>About the SAN list</h2>
<ul>
<li><p><b>DNS names</b>: <code>example.com</code>, <code>www.example.com</code>, <code>*.example.com</code> (a wildcard is only allowed leftmost and covers exactly one label)</p></li>
<li><p><b>IP addresses</b>: IPv4 and IPv6 (including <code>::</code> compression) are detected automatically; write <code>IP:192.168.1.10</code> to force IP handling</p></li>
<li><p>Separators may be <b>newlines, commas, semicolons or spaces</b>; duplicates are removed and unrecognized entries are reported when you generate</p></li>
<li><p>Modern browsers and mobile apps ignore the CN completely and only look at the SAN, so when the SAN list is empty this tool falls back to the CN — exactly what a CA does</p></li>
</ul>

<h2>Private key vs. CSR</h2>
<ul>
<li><p><b>Private key (<code>server.key</code>)</b>: generated and stored only on your machine. If it leaks, the certificate is worthless — never send it through chat or email, and use <code>chmod 600</code> plus a safe backup</p></li>
<li><p><b>CSR (<code>server.csr</code>)</b>: contains only the public key and the subject (no private key), so it is safe to send to a CA or paste into an order form</p></li>
<li><p><b>CSR fingerprint (SHA-256)</b>: computed over the complete DER encoding of the CSR, handy to confirm that the CA received exactly the same file (e.g. <code>openssl req -in server.csr -noout -fingerprint -sha256</code>)</p></li>
<li><p><b>Key format</b>: PKCS#8 (<code>BEGIN PRIVATE KEY</code>) is the OpenSSL 3.x default; PKCS#1 (<code>BEGIN RSA PRIVATE KEY</code>) is more common in older software. They are just two wrappers around the same key — convert with <code>openssl pkcs8 -topk8 -nocrypt</code> or <code>openssl rsa -traditional</code></p></li>
<li><p>To renew with the same key, simply generate a new CSR; if you suspect the key has leaked, generate a new key pair and have the CA re-issue</p></li>
</ul>

<h2>Verification &amp; notes</h2>
<ul>
<li><p>Verify the result with OpenSSL: <code>openssl req -in server.csr -noout -verify -text</code> (checks the signature and prints subject / SAN) and <code>openssl rsa -in server.key -check -noout</code></p></li>
<li><p>A self-signed certificate (for testing) can be produced in one command: <code>openssl x509 -req -in server.csr -signkey server.key -days 3650 -out server.crt</code></p></li>
<li><p>The signature algorithm is always SHA-256 with RSA (sha256WithRSAEncryption), accepted by every mainstream CA and server</p></li>
<li><p>All computation happens inside your local browser (or desktop WebView): no network, no cache, no upload</p></li>
</ul>`;

const CSRIntro :React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default CSRIntro;
