import { useLocale } from '../../hook/locale-context';

const zh = `
<h2>JWT 结构</h2>
<blockquote><p>JWT (JSON Web Token, RFC 7519) 由三部分组成, 以点号分隔：<code>header.payload.signature</code>, 每段都是 <b>base64url</b> (URL 安全, 不填充 = ) 编码。</p>
</blockquote>
<ul>
<li><p><b>头部 (Header)</b>：JSON, 说明签名算法, 常用字段 <code>alg</code> (如 HS256 / RS256)、<code>typ</code> (通常 JWT)、<code>kid</code> (密钥标识)</p></li>
<li><p><b>负载 (Payload)</b>：JSON, 存放声明 (claims), 如 <code>sub</code> (主题)、<code>name</code>、<code>iat</code> (签发时间, Unix 秒)、<code>exp</code> (过期时间)、<code>iss</code>/<code>aud</code> 等</p></li>
<li><p><b>签名 (Signature)</b>：对 <code>header.payload</code> 的签名值, 由头部 alg 指定的算法 (HMAC / RSA / ECDSA) 生成, 用于防篡改</p></li>
</ul>
<h2>使用说明</h2>
<ul>
<li><p>粘贴完整 JWT 后自动解码并格式化显示头部 / 负载 JSON</p></li>
<li><p>签名以 <b>HEX</b> 展示 (点击复制), base64url 原文显示于下方</p></li>
<li><p>头部/负载 JSON 文本区域<strong>双击</strong>复制</p></li>
<li><p>本工具仅做解码, <strong>不校验签名有效性</strong>；内容均为 base64url, 非加密, 请勿放入敏感凭据</p></li>
<li><p>无密钥签名算法 (alg=none) 的 token 签名为空, 属非安全用法, 请谨慎信任</p></li>
</ul>
`;

const tw = `
<h2>JWT 結構</h2>
<blockquote><p>JWT (JSON Web Token, RFC 7519) 由三個部分組成, 以點號分隔：<code>header.payload.signature</code>, 每段都是 <b>base64url</b> (URL 安全, 不填充 = ) 編碼。</p>
</blockquote>
<ul>
<li><p><b>標頭 (Header)</b>：JSON, 說明簽章演算法, 常用欄位 <code>alg</code> (如 HS256 / RS256)、<code>typ</code> (通常為 JWT)、<code>kid</code> (金鑰識別)</p></li>
<li><p><b>負載 (Payload)</b>：JSON, 存放宣告 (claims), 如 <code>sub</code> (主體)、<code>name</code>、<code>iat</code> (簽發時間, Unix 秒)、<code>exp</code> (過期時間)、<code>iss</code>/<code>aud</code> 等</p></li>
<li><p><b>簽章 (Signature)</b>：對 <code>header.payload</code> 的簽章值, 由標頭 alg 指定的演算法 (HMAC / RSA / ECDSA) 產生, 用於防止竄改</p></li>
</ul>
<h2>使用說明</h2>
<ul>
<li><p>貼上完整 JWT 後自動解碼並格式化顯示標頭 / 負載 JSON</p></li>
<li><p>簽章以 <b>HEX</b> 顯示 (點擊複製), base64url 原文顯示於下方</p></li>
<li><p>標頭/負載 JSON 文字區<strong>雙擊</strong>即可複製</p></li>
<li><p>本工具僅做解碼, <strong>不驗證簽章有效性</strong>；內容皆為 base64url, 非加密, 請勿放入敏感憑證</p></li>
<li><p>無金鑰簽章演算法 (alg=none) 的 token 簽章為空, 屬不安全用法, 請謹慎信任</p></li>
</ul>
`;

const en = `
<h2>JWT structure</h2>
<blockquote><p>A JWT (JSON Web Token, RFC 7519) has three dot-separated parts: <code>header.payload.signature</code>, each of which is <b>base64url</b> encoded (URL-safe, no padding <code>=</code>).</p>
</blockquote>
<ul>
<li><p><b>Header</b>: JSON describing the signing algorithm; common fields are <code>alg</code> (e.g. HS256 / RS256), <code>typ</code> (usually JWT) and <code>kid</code> (key ID)</p></li>
<li><p><b>Payload</b>: JSON holding the claims, e.g. <code>sub</code> (subject), <code>name</code>, <code>iat</code> (issued-at, Unix seconds), <code>exp</code> (expiry), <code>iss</code>/<code>aud</code>, etc.</p></li>
<li><p><b>Signature</b>: signature value over <code>header.payload</code>, produced by the algorithm named in the header (HMAC / RSA / ECDSA), used to detect tampering</p></li>
</ul>
<h2>How to use</h2>
<ul>
<li><p>Paste a full JWT — the header / payload JSON is decoded and pretty-printed automatically</p></li>
<li><p>The signature is shown as <b>HEX</b> (click to copy); the raw base64url text is displayed underneath</p></li>
<li><p><strong>Double-click</strong> the header / payload JSON box to copy it</p></li>
<li><p>This tool only decodes — it does <strong>not verify the signature</strong>; the parts are plain base64url, not encrypted, so never paste sensitive credentials</p></li>
<li><p>A token signed with the none algorithm (alg=none) has an empty signature and is insecure; treat it with caution</p></li>
</ul>
`;

const Intro = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
}
export default Intro;
