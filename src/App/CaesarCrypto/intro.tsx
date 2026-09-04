const intro = `
<h2>凯撒密码 (Caesar Cipher)</h2>
<blockquote><p>最古老的替换密码之一, 以古罗马统帅凯撒命名: 将明文中的每个字母在字母表中<strong>向后移动固定位数</strong>得到密文。位移 3 即凯撒本人使用的经典形式 (<code>a→d, b→e …</code>)。</p>
</blockquote>
<h2>使用说明</h2>
<ul>
<li><p><b>位移量</b>: 1-25 为常见取值; 负数表示向左移动; 任意整数会自动按 26 取模</p></li>
<li><p>仅对 <b>A-Z / a-z</b> 英文字母位移, 大小写分别保持; 数字、符号、空格及中文等其它字符<strong>原样保留</strong></p></li>
<li><p>加密与解密互为逆运算: 同一位移量下, 「解密」即为反向位移</p></li>
</ul>
<h2>破解提示</h2>
<blockquote><p>凯撒密码总共只有 25 种位移, 可暴力穷举或借助字母频率分析轻易破解, 仅适合教学与简单混淆, 不应作为真实加密手段。</p>
</blockquote>
`;

const Intro = () => {
  return <div dangerouslySetInnerHTML={ { __html: intro } } />;
}
export default Intro;
