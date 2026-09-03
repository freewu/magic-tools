const intro = `
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

const Intro = () => {
  return <div dangerouslySetInnerHTML={ { __html: intro } } />;
}
export default Intro;
