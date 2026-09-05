const intro = `
<h2>正则表达式 (Regex) 逐行测试</h2>
<blockquote><p>在下方多行内容里, 每行独立与正则表达式匹配: <b>匹配行显示绿色背景, 不匹配行显示红色背景</b>, 一眼看出哪些内容符合规则。</p>
</blockquote>
<ul>
<li><p>常用正则: 点击下拉框即可套用内置正则 (邮箱 / URL / IPv4 / 手机号 / 日期等), 列表可在「设置 → 其它 → 正则表达式」里增删改</p></li>
<li><p>行匹配采用「整行」语义, 因此内置预设大多带 <code>^…$</code> 锚点; 若只想找「包含」的内容, 把 <code>^</code> 与 <code>$</code> 去掉即可</p></li>
<li><p>标志位: <code>i</code> 忽略大小写 / <code>g</code> 全局(同时显示全文匹配次数) / <code>m</code> 多行 / <code>s</code> 让 <code>.</code> 匹配换行</p></li>
<li><p>「复制匹配行」可把绿色行原样复制出来; 双击正则或内容输入框也可复制内容</p></li>
</ul>
<h2>常用元字符速查</h2>
<ul>
<li><p><code>^</code> 行首 &nbsp; <code>$</code> 行尾 &nbsp; <code>.</code> 任意字符(换行除外) &nbsp; <code>|</code> 或</p></li>
<li><p><code>\\d</code> 数字 &nbsp; <code>\\w</code> 字母数字下划线 &nbsp; <code>\\s</code> 空白 &nbsp; <code>\\b</code> 单词边界</p></li>
<li><p><code>*</code> 0次或多次 &nbsp; <code>+</code> 1次或多次 &nbsp; <code>?</code> 0次或1次 &nbsp; <code>{n,m}</code> n到m次</p></li>
<li><p><code>[...]</code> 字符集合 &nbsp; <code>[^...]</code> 排除 &nbsp; <code>(...)</code> 分组 &nbsp; <code>(?:...)</code> 非捕获分组</p></li>
</ul>
`;

const Intro = () => {
  return <div dangerouslySetInnerHTML={ { __html: intro } } />;
}
export default Intro;
