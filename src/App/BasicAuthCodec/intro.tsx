// HTTP Basic Authentication (RFC 7617) 简介
const BasicAuthIntro = () => {
  const td = { border: "1px solid #ccc", padding: "4px 10px" };
  return (
    <div>
      <p style={{ margin: "4px 0 8px" }}>
        HTTP Basic Authentication 是最简单的 HTTP 认证方案：
        客户端将 <b>用户名:密码</b> 拼接后做 Base64 编码，得到凭据 Token，
        再放入请求头发送：<code>Authorization: Basic {String.fromCharCode(60) + 'Token' + String.fromCharCode(62)}</code>。
        服务端解码后取首个冒号前的部分作为用户名、其余作为密码进行校验。
      </p>
      <p style={{ margin: "4px 0 8px" }}>
        本工具支持：由「用户名 + 密码」生成 Token / 完整请求头；
        反向解读请求头或 Token，还原出用户名与密码。
        由于 Basic 凭据本质只是 Base64 编码而非加密，明文在网络中传输会被窃听，
        生产环境务必配合 HTTPS 使用（密码即使含冒号也能正确还原，按首个冒号切分）。
      </p>
      <table style={{ borderCollapse: "collapse", fontSize: 12, margin: "8px 0" }}>
        <thead>
          <tr>
            <th style={ td }>组成</th>
            <th style={ td }>示例 (base64: dXNlcjpwYXNz)</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={ td }>用户名字段</td><td style={ td }>user</td></tr>
          <tr><td style={ td }>分隔符</td><td style={ td }>:</td></tr>
          <tr><td style={ td }>密码字段</td><td style={ td }>pass</td></tr>
          <tr><td style={ td }>Base64(UTF-8)</td><td style={ td }>dXNlcjpwYXNz</td></tr>
          <tr><td style={ td }>请求头</td><td style={ td }>Authorization: Basic dXNlcjpwYXNz</td></tr>
        </tbody>
      </table>
    </div>
  );
}

export default BasicAuthIntro;
