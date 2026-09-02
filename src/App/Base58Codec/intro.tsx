let intro = `
<p>&nbsp;</p>
<ul>
<li><p>Bitcoin 中使用的一种独特的编码方式，主要用于产生 Bitcoin 的钱包地址</p></li>
<li><p>采用数字(123456789)、大写字母(ABCDEFGHJKLMNUVWXYZ)、小写字母(abcdefghijkmnopqrstuvwxyz)</p></li>
<li><p>去除歧义字符 0（零）、O（大写字母 O）、I（大写字母i）、l（小写字母L），总计58个字符作为编码的字母表</p></li>
</ul>
<p>&nbsp;</p>
<h2>设计目的</h2>
<ul>
<li><p>避免混淆。在某些字体下，数字0和字母大写O，以及字母大写I和字母小写l会非常相似</p></li>
<li><p>不使用 &quot;+&quot; 和 &quot;/&quot; 的原因是非字母或数字的字符串作为帐号较难被接受</p></li>
<li><p>没有标点符号，通常不会被从中间分行</p></li>
<li><p>大部分的软件支持双击选择整个字符串</p></li>
</ul>
<p>&nbsp;</p>
<h2>编码表</h2>
<pre>
<code>123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz 
</pre>
<p>&nbsp;</p>
`;
const Base58Intro = () => {

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: intro.replace("\n","<br/>") }}
      style={ { "overflowY": "scroll","height": "300px" }}>
    </div>
  );
}

export default Base58Intro;