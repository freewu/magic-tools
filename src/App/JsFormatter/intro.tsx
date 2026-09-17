import { useLocale } from '../../hook/locale-context';

const zh = `
<h2>JavaScript 格式化 / 压缩 / 混淆 / 解密</h2>
<blockquote><p>纯本地处理的 JavaScript 工具箱: <b>美化</b>、<b>压缩</b>、<b>混淆加密</b>、<b>解密还原</b> 四种模式共用一个输入框, 结果统一显示在下方并可一键复制或保存为 <code>.js</code> 文件。</p>
</blockquote>
<ul>
<li><p><b>代码美化</b>: 按缩进重排代码 (花括号换行、逗号换行、对象字面量每项一行), 自动补齐运算符两侧空格, 支持 2 空格 / 4 空格 / Tab 缩进与「保留空行」开关</p></li>
<li><p><b>代码压缩</b>: 去掉注释与多余空白, 压成最短形式; 会自动保留必要的换行 (比如 <code>return</code> 换行、对象字面量 <code>}</code> 后的换行), 不会改变代码含义</p></li>
<li><p><b>混淆加密</b>: 词表打包 (标识符换成词表下标 + 包进 <code>eval</code>) 或仅字符串转义 (<code>\\xNN</code> / <code>\\uNNNN</code>), 三种方式都可一键还原</p></li>
<li><p><b>解密还原</b>: 自动识别混淆特征并逐层还原, 支持本工具的词表打包、经典 Dean Edwards packer、<code>eval(&quot;...&quot;)</code> 包裹与字符串转义; <b>全程只做字符串解析, 绝不执行被还原的代码</b></p></li>
<li><p>美化 / 压缩完成后会用 token 指纹对比输入与输出, 一致时显示 ✅「语义未变」; 不一致会给出提示, 方便自查</p></li>
<li><p>顶部工具栏: 打开 <code>.js</code> 文件、保存结果、复制结果、载入示例、清除; 输入框也支持直接拖入文件</p></li>
</ul>
<h2>使用小贴士</h2>
<ul>
<li><p>想同时压缩 + 混淆? 先压缩得到最简代码, 再切到「混淆加密」标签执行即可</p></li>
<li><p>美化 / 压缩会保留行注释与块注释的位置, 需要精简时打开压缩标签里的「移除注释」</p></li>
<li><p>混淆只做转义与词表替换, <b>不是加密</b>, 任何人都能用本工具的「解密还原」还原, 请勿用于真实敏感信息</p></li>
</ul>
`;

const tw = `
<h2>JavaScript 格式化 / 壓縮 / 混淆 / 解密</h2>
<blockquote><p>純本機處理的 JavaScript 工具箱: <b>美化</b>、<b>壓縮</b>、<b>混淆加密</b>、<b>解密還原</b> 四種模式共用一個輸入框，結果統一顯示在下方並可一鍵複製或儲存為 <code>.js</code> 檔案。</p>
</blockquote>
<ul>
<li><p><b>程式碼美化</b>: 依縮排重排程式碼 (大括號換行、逗號換行、物件實體每項一行)，自動補齊運算子兩側空白，支援 2 空格 / 4 空格 / Tab 縮排與「保留空行」開關</p></li>
<li><p><b>程式碼壓縮</b>: 移除註解與多餘空白，壓成最短形式；會自動保留必要的換行 (例如 <code>return</code> 換行、物件實體 <code>}</code> 之後的換行)，不會改變程式碼語意</p></li>
<li><p><b>混淆加密</b>: 詞表打包 (識別字換成詞表下標 + 包進 <code>eval</code>) 或僅字串轉義 (<code>\\xNN</code> / <code>\\uNNNN</code>)，三種方式都可一鍵還原</p></li>
<li><p><b>解密還原</b>: 自動識別混淆特徵並逐層還原，支援本工具的詞表打包、經典 Dean Edwards packer、<code>eval(&quot;...&quot;)</code> 包裹與字串轉義；<b>全程只做字串解析，絕不執行被還原的程式碼</b></p></li>
<li><p>美化 / 壓縮完成後會用 token 指紋比對輸入與輸出，一致時顯示 ✅「語意未變」；不一致會給出提示，方便自查</p></li>
<li><p>頂部工具列: 開啟 <code>.js</code> 檔案、儲存結果、複製結果、載入範例、清除；輸入框也支援直接拖入檔案</p></li>
</ul>
<h2>使用小提示</h2>
<ul>
<li><p>想同時壓縮 + 混淆? 先壓縮得到最簡程式碼，再切到「混淆加密」頁籤執行即可</p></li>
<li><p>美化 / 壓縮會保留單行與區塊註解的位置，需要精簡時打開壓縮頁籤裡的「移除註解」</p></li>
<li><p>混淆只做轉義與詞表替換，<b>不是加密</b>，任何人都能用本工具的「解密還原」還原，請勿用於真實敏感資訊</p></li>
</ul>
`;

const en = `
<h2>JavaScript formatting, minifying, obfuscation and deobfuscation</h2>
<blockquote><p>A fully local JavaScript toolbox: <b>beautify</b>, <b>minify</b>, <b>obfuscate</b> and <b>deobfuscate</b> share one input box, and the result is shown below for one-click copy or saving as a <code>.js</code> file.</p>
</blockquote>
<ul>
<li><p><b>Beautify</b>: re-indents the code (braces and commas break lines, one object property per line) and pads operators with spaces. Choose 2 spaces / 4 spaces / Tab and toggle &quot;keep blank lines&quot;</p></li>
<li><p><b>Minify</b>: strips comments and redundant whitespace into the shortest form while keeping the newlines that matter (such as after <code>return</code> or after an object literal <code>}</code>), so the code still means the same</p></li>
<li><p><b>Obfuscate</b>: dictionary packing (identifiers become dictionary indexes wrapped in <code>eval</code>) or string escaping only (<code>\\xNN</code> / <code>\\uNNNN</code>) — all three are one-click reversible</p></li>
<li><p><b>Deobfuscate</b>: detects obfuscation signatures and unwraps them layer by layer — this tool's dictionary packing, the classic Dean Edwards packer, an <code>eval(&quot;...&quot;)</code> wrapper and string escaping. <b>It only parses strings; the code is never executed</b></p></li>
<li><p>After beautifying/minifying, the input and output token fingerprints are compared: a ✅ &quot;semantics unchanged&quot; badge appears when they match, and a warning when they do not</p></li>
<li><p>Toolbar: open a <code>.js</code> file, save the result, copy the result, load a sample, clear; you can also drop a file straight into the input box</p></li>
</ul>
<h2>Tips</h2>
<ul>
<li><p>Want minify + obfuscate together? Minify first to get the shortest code, then switch to the Obfuscate tab</p></li>
<li><p>Beautify/minify keep line and block comments in place; turn on &quot;remove comments&quot; in the Minify tab to drop them</p></li>
<li><p>Obfuscation is escaping and dictionary substitution, <b>not encryption</b> — anyone can restore it with this tool's Deobfuscate tab, so do not use it for real secrets</p></li>
</ul>
`;

const Intro = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
}
export default Intro;
