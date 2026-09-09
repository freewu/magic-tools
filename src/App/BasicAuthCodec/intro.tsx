import { useLocale } from '../../hook/locale-context';

// HTTP Basic Authentication (RFC 7617) 简介
const zh = `<p style="margin:4px 0 8px">
HTTP Basic Authentication 是最简单的 HTTP 认证方案：
客户端将 <b>用户名:密码</b> 拼接后做 Base64 编码，得到凭据 Token，
再放入请求头发送：<code>Authorization: Basic &lt;Token&gt;</code>。
服务端解码后取首个冒号前的部分作为用户名、其余作为密码进行校验。
</p>
<p style="margin:4px 0 8px">
本工具支持：由「用户名 + 密码」生成 Token / 完整请求头；
反向解读请求头或 Token，还原出用户名与密码。
由于 Basic 凭据本质只是 Base64 编码而非加密，明文在网络中传输会被窃听，
生产环境务必配合 HTTPS 使用（密码即使含冒号也能正确还原，按首个冒号切分）。
</p>
<table style="border-collapse:collapse;font-size:12px;margin:8px 0">
<thead><tr>
<th style="border:1px solid #ccc;padding:4px 10px">组成</th>
<th style="border:1px solid #ccc;padding:4px 10px">示例 (base64: dXNlcjpwYXNz)</th>
</tr></thead>
<tbody>
<tr><td style="border:1px solid #ccc;padding:4px 10px">用户名字段</td><td style="border:1px solid #ccc;padding:4px 10px">user</td></tr>
<tr><td style="border:1px solid #ccc;padding:4px 10px">分隔符</td><td style="border:1px solid #ccc;padding:4px 10px">:</td></tr>
<tr><td style="border:1px solid #ccc;padding:4px 10px">密码字段</td><td style="border:1px solid #ccc;padding:4px 10px">pass</td></tr>
<tr><td style="border:1px solid #ccc;padding:4px 10px">Base64(UTF-8)</td><td style="border:1px solid #ccc;padding:4px 10px">dXNlcjpwYXNz</td></tr>
<tr><td style="border:1px solid #ccc;padding:4px 10px">请求头</td><td style="border:1px solid #ccc;padding:4px 10px">Authorization: Basic dXNlcjpwYXNz</td></tr>
</tbody>
</table>`;

const tw = `<p style="margin:4px 0 8px">
HTTP Basic Authentication 是最簡單的 HTTP 認證方案：
用戶端將 <b>使用者名稱:密碼</b> 串接後做 Base64 編碼，得到憑證 Token，
再放入請求標頭送出：<code>Authorization: Basic &lt;Token&gt;</code>。
伺服端解碼後取第一個冒號前的部分作為使用者名稱、其餘作為密碼進行驗證。
</p>
<p style="margin:4px 0 8px">
本工具支援：由「使用者名稱 + 密碼」產生 Token / 完整請求標頭；
反向解讀請求標頭或 Token，還原出使用者名稱與密碼。
由於 Basic 憑證本質只是 Base64 編碼而非加密，明文在網路上傳輸會被竊聽，
正式環境請務必搭配 HTTPS 使用（密碼即使含冒號也能正確還原，依第一個冒號切分）。
</p>
<table style="border-collapse:collapse;font-size:12px;margin:8px 0">
<thead><tr>
<th style="border:1px solid #ccc;padding:4px 10px">組成</th>
<th style="border:1px solid #ccc;padding:4px 10px">範例 (base64: dXNlcjpwYXNz)</th>
</tr></thead>
<tbody>
<tr><td style="border:1px solid #ccc;padding:4px 10px">使用者名稱欄位</td><td style="border:1px solid #ccc;padding:4px 10px">user</td></tr>
<tr><td style="border:1px solid #ccc;padding:4px 10px">分隔符號</td><td style="border:1px solid #ccc;padding:4px 10px">:</td></tr>
<tr><td style="border:1px solid #ccc;padding:4px 10px">密碼欄位</td><td style="border:1px solid #ccc;padding:4px 10px">pass</td></tr>
<tr><td style="border:1px solid #ccc;padding:4px 10px">Base64(UTF-8)</td><td style="border:1px solid #ccc;padding:4px 10px">dXNlcjpwYXNz</td></tr>
<tr><td style="border:1px solid #ccc;padding:4px 10px">請求標頭</td><td style="border:1px solid #ccc;padding:4px 10px">Authorization: Basic dXNlcjpwYXNz</td></tr>
</tbody>
</table>`;

const en = `<p style="margin:4px 0 8px">
HTTP Basic Authentication is the simplest HTTP authentication scheme:
the client concatenates <b>username:password</b>, Base64-encodes it into a credential Token,
and sends it in a request header: <code>Authorization: Basic &lt;Token&gt;</code>.
The server decodes it and treats everything before the first colon as the username, the rest as the password.
</p>
<p style="margin:4px 0 8px">
This tool can generate a Token / a full request header from a username and password,
and can reverse a header or Token back into the username and password.
Basic credentials are only Base64, not encryption, so plaintext sent over the network can be eavesdropped —
always use HTTPS in production (a password containing colons is still restored correctly, split at the first colon).
</p>
<table style="border-collapse:collapse;font-size:12px;margin:8px 0">
<thead><tr>
<th style="border:1px solid #ccc;padding:4px 10px">Part</th>
<th style="border:1px solid #ccc;padding:4px 10px">Example (base64: dXNlcjpwYXNz)</th>
</tr></thead>
<tbody>
<tr><td style="border:1px solid #ccc;padding:4px 10px">Username field</td><td style="border:1px solid #ccc;padding:4px 10px">user</td></tr>
<tr><td style="border:1px solid #ccc;padding:4px 10px">Separator</td><td style="border:1px solid #ccc;padding:4px 10px">:</td></tr>
<tr><td style="border:1px solid #ccc;padding:4px 10px">Password field</td><td style="border:1px solid #ccc;padding:4px 10px">pass</td></tr>
<tr><td style="border:1px solid #ccc;padding:4px 10px">Base64(UTF-8)</td><td style="border:1px solid #ccc;padding:4px 10px">dXNlcjpwYXNz</td></tr>
<tr><td style="border:1px solid #ccc;padding:4px 10px">Request header</td><td style="border:1px solid #ccc;padding:4px 10px">Authorization: Basic dXNlcjpwYXNz</td></tr>
</tbody>
</table>`;

const BasicAuthIntro = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
}

export default BasicAuthIntro;
