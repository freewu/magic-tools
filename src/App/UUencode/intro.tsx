import { useLocale } from "../../hook/locale-context";

// 文档: zh-CN 为默认; TW / EN 为对应翻译
const introZh = `
<h2>UUencode 编码</h2>
<blockquote><p>UUencode (Unix-to-Unix encoding) 是一种将二进制数据转换为纯 ASCII 文本的编码方式，常用于早期邮件/新闻组传输二进制附件。</p>
</blockquote>
<ul>
<li><p>把每 3 个字节作为一组，共 3×8 = 24 个二进制位，每 6 位一组分成 4 组</p></li>
<li><p>每组值 (0~63) <b>加上 32</b> 后转为对应 ASCII 字符（32 空格 ~ 95 下划线），因此输出字符均为可打印 ASCII</p></li>
<li><p>每行最多编码 45 字节，行首用 <b>长度前缀字符</b> 标记：字符码 = 32 + 本行字节数（满行 45 字节时前缀为 'M'）</p></li>
<li><p>不足 3 字节时，末尾以 0 值补齐（编码为空格字符），解码时按行首计数丢弃补位</p></li>
<li><p>示例：<code>cat</code> → <code>#8V%T</code>（前缀 '#' = 32 + 3 字节）</p></li>
</ul>
<h2>与 Base64 的区别</h2>
<blockquote><p>Base64 编码字符集中包含 + / = 等特殊字符，而 UUencode 全部使用可打印 ASCII（32~95），更安全地适配古早的 7-bit 传输通道。</p>
</blockquote>
<h2>说明</h2>
<ul>
<li><p>解码自动跳过经典文件头 <code>begin</code> 与结尾 <code>end</code> 行</p></li>
<li><p>编码结果为文本 (UTF-8)；解码二进制内容时不可打印字节将以替换符显示</p></li>
</ul>
`;
const introTw = `<h2>UUencode 編碼</h2>
<blockquote><p>UUencode (Unix-to-Unix encoding) 是一種將二進位資料轉換為純 ASCII 文字的編碼方式, 常用於早期郵件/新聞群組傳輸二進位附件。</p>
</blockquote>
<ul>
<li><p>每 3 個位元組為一組, 共 3×8 = 24 個二進位元, 每 6 位一組分成 4 組</p></li>
<li><p>每組值 (0~63) <b>加上 32</b> 後轉為對應 ASCII 字元 (32 空格 ~ 95 底線), 因此輸出字元皆為可列印 ASCII</p></li>
<li><p>每行最多編碼 45 個位元組, 行首以 <b>長度前綴字元</b> 標記: 字元碼 = 32 + 本行位元組數 (滿行 45 位元組時前綴為 'M')</p></li>
<li><p>不足 3 位元組時, 末尾以 0 值補齊 (編碼為空格字元), 解碼時依行首計數丟棄補位</p></li>
<li><p>範例: <code>cat</code> → <code>#8V%T</code> (前綴 '#' = 32 + 3 位元組)</p></li>
</ul>
<h2>與 Base64 的區別</h2>
<blockquote><p>Base64 編碼字元集包含 + / = 等特殊字元, 而 UUencode 全部使用可列印 ASCII (32~95), 更安全地適用於早期 7-bit 傳輸通道。</p>
</blockquote>
<h2>說明</h2>
<ul>
<li><p>解碼自動跳過經典檔頭 <code>begin</code> 與結尾 <code>end</code> 行</p></li>
<li><p>編碼結果為文字 (UTF-8); 解碼二進位內容時, 不可列印位元組將以替換符號顯示</p></li>
</ul>`;
const introEn = `<h2>UUencode</h2>
<blockquote><p>UUencode (Unix-to-Unix encoding) is an encoding that turns binary data into plain ASCII text, historically used to send binary attachments over e-mail / newsgroups.</p>
</blockquote>
<ul>
<li><p>Every 3 bytes form a group: 3×8 = 24 bits, split into 4 groups of 6 bits</p></li>
<li><p>Each 6-bit value (0~63) is <b>incremented by 32</b> and mapped to an ASCII character (32 = space through 95 = underscore), so every output character is printable ASCII</p></li>
<li><p>Each line encodes at most 45 bytes and begins with a <b>length prefix character</b>: character code = 32 + bytes in that line ('M' for a full 45-byte line)</p></li>
<li><p>When fewer than 3 bytes remain, the tail is padded with zero values (encoded as spaces); the decoder drops padding based on the line prefix</p></li>
<li><p>Example: <code>cat</code> → <code>#8V%T</code> (prefix '#' = 32 + 3 bytes)</p></li>
</ul>
<h2>Difference from Base64</h2>
<blockquote><p>Base64 uses special characters such as + / = in its alphabet, while UUencode sticks to printable ASCII (32~95) only, making it safer for legacy 7-bit channels.</p>
</blockquote>
<h2>Notes</h2>
<ul>
<li><p>Decoding automatically skips the classic <code>begin</code> header and <code>end</code> trailer lines</p></li>
<li><p>The encoded output is text (UTF-8); when decoding binary content, non-printable bytes are shown as replacement characters</p></li>
</ul>`;

const Intro = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? introTw : locale === 'en' ? introEn : introZh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
}
export default Intro;
