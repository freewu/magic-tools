import { useLocale } from "../../hook/locale-context";

// 文档: zh-CN 为默认; TW / EN 为对应翻译
const introZh = `
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
const introTw = `<pre>
## Punycode 說明
\`\`\`
Punycode 是 RFC 3492 定義的一種編碼, 用於將任意 Unicode 文字(如中文域名)轉換為
僅含 ASCII 字母/數字/連字符(-)的表示形式, 以便在 DNS / URL / 電子郵件等只接受
ASCII 的協定中傳輸國際化域名(IDN, Internationalized Domain Name)

例如: 中文 的 Punycode 編碼是  fiq228c
     中文.中國  =>  xn--fiq228c.xn--fiqs8s
     bücher.de  =>  xn--bcher-kva.de
\`\`\`

## xn-- 前綴 (ACE)
\`\`\`
實際使用時, 非 ASCII 的域名段會在 Punycode 編碼前加上固定前綴 xn-- (ASCII
Compatible Encoding), 這樣解析器能識別出該段是國際化域名而不是普通文字

所以瀏覽器網址列輸入 中文.中國 時, 真正發往 DNS 的是 xn--fiq228c.xn--fiqs8s
\`\`\`

## 使用說明
\`\`\`
1 編碼: 輸入 Unicode 文字(可含中文/日文/emoji 等), 點擊「編碼」
  - 整段域名/單一標籤均可, 依 '.' 分段, 只有含非 ASCII 的段才會被轉換並加上 xn-- 前綴
  - 純 ASCII 文字不會被改變
2 解碼: 輸入帶/不帶 xn-- 前綴的 Punycode 文字, 點擊「解碼」還原為 Unicode
  - 支援整段域名, 如 xn--fiq228c.xn--fiqs8s
  - 大小寫均可辨識 (規範要求域名在 IDNA 層統一為小寫後才編碼)

注意: 本工具依 IDNA 慣例輸出帶 xn-- 前綴的完整標籤; 若只需要 Punycode.js 那種
不帶前綴的原始編碼, 去掉 xn-- 前綴即可 (例如 fiq228c)
\`\`\`
</pre>`;
const introEn = `<pre>
## About Punycode
\`\`\`
Punycode is an encoding defined by RFC 3492 that turns any Unicode text (such as
Chinese domain names) into a representation using only ASCII letters / digits /
hyphens (-), so that internationalized domain names (IDN) can travel through
ASCII-only protocols such as DNS / URL / e-mail.

For example: 中文 is encoded as fiq228c
     中文.中国  =>  xn--fiq228c.xn--fiqs8s
     bücher.de  =>  xn--bcher-kva.de
\`\`\`

## The xn-- prefix (ACE)
\`\`\`
In practice a fixed prefix xn-- (ASCII Compatible Encoding) is added before the
Punycode of every non-ASCII label, so resolvers can tell the label is an IDN
instead of plain text.

That is why, when you type 中文.中国 in the address bar, what is actually sent
to DNS is xn--fiq228c.xn--fiqs8s
\`\`\`

## Usage
\`\`\`
1 Encode: type Unicode text (Chinese / Japanese / emoji, etc.), click "Encode"
  - Whole domains or single labels are fine; the input is split on '.', and only
    non-ASCII labels are converted and prefixed with xn--
  - Pure ASCII text is left unchanged
2 Decode: type Punycode with or without the xn-- prefix, click "Decode"
  - Whole domains are supported, e.g. xn--fiq228c.xn--fiqs8s
  - Both cases are accepted (the spec lowercases labels at the IDNA layer first)

Note: this tool follows IDNA practice and outputs full labels with the xn--
prefix; if you need the bare encoding without it (like Punycode.js), just strip
the xn-- prefix (e.g. fiq228c)
\`\`\`
</pre>`;

const PunycodeIntro = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? introTw : locale === 'en' ? introEn : introZh;
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: html }}
      style={ { "overflowY": "scroll","height": "300px" }}>
    </div>
  );
}

export default PunycodeIntro;
