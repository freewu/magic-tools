import { useLocale } from '../../hook/locale-context';

const zh = `
<h2>正则表达式 (Regex) 逐行测试</h2>
<blockquote><p>在下方多行内容里, 每行独立与正则表达式匹配: <b>匹配行显示绿色背景, 不匹配行显示红色背景</b>, 一眼看出哪些内容符合规则。</p>
</blockquote>
<ul>
<li><p>常用正则: 点击下拉框即可套用内置正则 (邮箱 / URL / IPv4 / 手机号 / 日期等), 悬停某条时点右侧复制图标即可<b>一键复制规则</b> (只复制不套用); 列表可在「设置 → 其它 → 正则表达式」里增删改</p></li>
<li><p>点击「复制规则」可一键复制当前正在使用的正则表达式 (含 i/g/m/s 标志位请自行留意)</p></li>
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

const tw = `
<h2>正則表達式 (Regex) 逐行測試</h2>
<blockquote><p>在下方多行內容裡, 每行獨立與正則表達式比對: <b>符合的行顯示綠色背景, 不符合的行顯示紅色背景</b>, 一眼看出哪些內容符合規則。</p>
</blockquote>
<ul>
<li><p>常用正則: 點擊下拉框即可套用內建正則 (Email / URL / IPv4 / 手機號碼 / 日期等), 游標懸停某一筆時點右側複製圖示即可<b>一鍵複製規則</b> (僅複製不套用); 清單可在「設定 → 其他 → 正則表達式」裡新增、刪除或修改</p></li>
<li><p>點擊「複製規則」可一鍵複製目前正在使用的正則表達式 (含 i/g/m/s 旗標, 請自行留意)</p></li>
<li><p>行比對採用「整行」語意, 因此內建預設大多帶 <code>^…$</code> 錨點; 若只想找「包含」的內容, 把 <code>^</code> 與 <code>$</code> 去掉即可</p></li>
<li><p>旗標: <code>i</code> 忽略大小寫 / <code>g</code> 全域(同時顯示全文比對次數) / <code>m</code> 多行 / <code>s</code> 讓 <code>.</code> 比對換行</p></li>
<li><p>「複製符合行」可把綠色行原樣複製出來; 雙擊正則或內容輸入框也可複製內容</p></li>
</ul>
<h2>常用元字元速查</h2>
<ul>
<li><p><code>^</code> 行首 &nbsp; <code>$</code> 行尾 &nbsp; <code>.</code> 任意字元(換行除外) &nbsp; <code>|</code> 或</p></li>
<li><p><code>\\d</code> 數字 &nbsp; <code>\\w</code> 字母數字底線 &nbsp; <code>\\s</code> 空白 &nbsp; <code>\\b</code> 單字邊界</p></li>
<li><p><code>*</code> 0次或多次 &nbsp; <code>+</code> 1次或多次 &nbsp; <code>?</code> 0次或1次 &nbsp; <code>{n,m}</code> n到m次</p></li>
<li><p><code>[...]</code> 字元集合 &nbsp; <code>[^...]</code> 排除 &nbsp; <code>(...)</code> 分組 &nbsp; <code>(?:...)</code> 非捕獲群組</p></li>
</ul>
`;

const en = `
<h2>Regex (Regular Expression) line-by-line testing</h2>
<blockquote><p>Each line in the multiline content below is matched against the pattern independently: <b>matching lines get a green background, non-matching lines a red one</b>, so you can see at a glance which content fits the rule.</p>
</blockquote>
<ul>
<li><p>Presets: open the dropdown to apply a built-in pattern (email / URL / IPv4 / phone number / date, etc.); hover an item and click the copy icon to <b>copy that rule</b> (copy only, no apply). The list can be edited in Settings → Other → Regex Tester</p></li>
<li><p>“Copy pattern” copies the pattern currently in use (mind the i/g/m/s flags)</p></li>
<li><p>Matching is line-based (“whole line”), so most presets carry <code>^…$</code> anchors; to search for “contains” instead, simply drop the <code>^</code> and <code>$</code></p></li>
<li><p>Flags: <code>i</code> case-insensitive / <code>g</code> global (also shows the total match count) / <code>m</code> multiline / <code>s</code> makes <code>.</code> match newlines</p></li>
<li><p>“Copy matching lines” copies the green lines verbatim; double-clicking the pattern or content box copies its text as well</p></li>
</ul>
<h2>Common metacharacters</h2>
<ul>
<li><p><code>^</code> start of line &nbsp; <code>$</code> end of line &nbsp; <code>.</code> any character (except newline) &nbsp; <code>|</code> or</p></li>
<li><p><code>\\d</code> digit &nbsp; <code>\\w</code> word char (letter/digit/underscore) &nbsp; <code>\\s</code> whitespace &nbsp; <code>\\b</code> word boundary</p></li>
<li><p><code>*</code> 0 or more &nbsp; <code>+</code> 1 or more &nbsp; <code>?</code> 0 or 1 &nbsp; <code>{n,m}</code> between n and m</p></li>
<li><p><code>[...]</code> character class &nbsp; <code>[^...]</code> negated class &nbsp; <code>(...)</code> group &nbsp; <code>(?:...)</code> non-capturing group</p></li>
</ul>
`;

const Intro = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
}
export default Intro;
