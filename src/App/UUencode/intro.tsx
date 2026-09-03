const intro = `
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

const Intro = () => {
  return <div dangerouslySetInnerHTML={ { __html: intro } } />;
}
export default Intro;
