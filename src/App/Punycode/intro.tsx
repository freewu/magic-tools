const intro = 
`
<pre>
## Punycode 说明
\`\`\`
Punycode 是 RFC 3492 定义的一种编码, 用于将任意 Unicode 文本(如中文域名)转换为
仅含 ASCII 字母/数字/连字符(-)的表示形式, 以便在 DNS / URL / 电子邮件等只接受
ASCII 的协议中传输国际化域名(IDN, Internationalized Domain Name)

例如: 中文 的 Punycode 编码是  fiq228c
     中文.中国  =>  xn--fiq228c.xn--fiqs8s
     bücher.de  =>  xn--bcher-kva.de
\`\`\`

## xn-- 前缀 (ACE)
\`\`\`
实际使用时, 非 ASCII 的域名段会在 Punycode 编码前加上固定前缀 xn-- (ASCII
Compatible Encoding), 这样解析器能识别出该段是国际化域名而不是普通文本

所以浏览器地址栏输入 中文.中国 时, 真正发往 DNS 的是 xn--fiq228c.xn--fiqs8s
\`\`\`

## 使用说明
\`\`\`
1 编码: 输入 Unicode 文本(可含中文/日文/emoji 等), 点击「编码」
  - 整段域名/单标签均可, 按 '.' 分段, 只有含非 ASCII 的段才会被转换并加 xn-- 前缀
  - 纯 ASCII 文本不会被改变
2 解码: 输入带/不带 xn-- 前缀的 Punycode 文本, 点击「解码」还原为 Unicode
  - 支持整段域名, 如 xn--fiq228c.xn--fiqs8s
  - 大小写均可识别 (规范要求域名在 IDNA 层统一小写后编码)

注意: 本工具按 IDNA 惯例输出带 xn-- 前缀的完整标签; 若只需要 Punycode.js 那种
不带前缀的原始编码, 去掉 xn-- 前缀即可 (例如 fiq228c)
\`\`\`
</pre>
`;
const PunycodeIntro = () => {

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: intro }}
      style={ { "overflowY": "scroll","height": "300px" }}>
    </div>
  );
}

export default PunycodeIntro;