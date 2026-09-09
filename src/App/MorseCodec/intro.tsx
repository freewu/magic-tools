import { useLocale } from '../../hook/locale-context';

const zh = `
<h2>摩斯码 (Morse Code)</h2>
<blockquote><p>摩斯码是 1830 年代由 萨缪尔·摩斯 (Samuel Morse) 与 艾尔菲德·维尔 (Alfred Vail) 发明的信号编码，把字母、数字、标点编码为「点 (.) 与 划 (-)」的序列，是最早的电报编码之一。</p>
</blockquote>
<ul>
<li><p>「点」时长 1 个单位，「划」时长 3 个单位</p></li>
<li><p>字母内部符号间隔 1 个单位，字母之间间隔 3 个单位，单词之间间隔 7 个单位 (本工具用 <code>/</code> 表示单词间隔)</p></li>
<li><p>本工具支持 A~Z、0~9 及常用标点（<code>.,?!'()&:;=+_-"$@</code> 等），均为 ITU 国际摩斯电码标准表</p></li>
<li><p>最著名的信号 <b>SOS</b> = <code>... --- ...</code>，不是缩写，而是便于发送/识别的顺口信号</p></li>
</ul>
<h2>使用提示</h2>
<ul>
<li><p>「文本 → 摩斯码」：把上方明文编码到下方；「摩斯码 → 文本」：把下方摩斯码解码回上方</p></li>
<li><p>编码时单词之间自动用 <code>/</code> 分隔；解码同样支持 <code>/</code> 分隔，多余的连续空格会被忽略</p></li>
<li><p><b>播放摩斯码</b>：优先播放下方摩斯码；下方为空时若上方是摩斯码则直接播放，否则自动把上方明文编码后播放。可调「播放速度」与「频率」，播放中可随时「停止」</p></li>
<li><p>「音效」可选：<b>电报音 (默认, 经典等幅报正弦音)</b> / 蜂鸣音 / 柔和音 / 电子音，播放时会按所选音色发声，并同步红色高亮当前码值</p></li>
<li><p><b>常用编码</b>：下拉提供 呼叫/通用 (CQ、SOS、K、KN、SK…)、高频 Q 简语 (QRZ、QTH、QSL…)、数字祝词 (73、88)、单词简写 (TU、OK、R…) 速查，选中即自动填入明文与摩斯码区；还可在「设置 → 其它 → 摩斯码常用编码」维护自己的常用编码</p></li>
<li><p><b>保存音频 (WAV)</b>：一键把当前摩斯码按所选 音效/速度/频率 离线合成为 .wav 文件 (16bit 单声道 PCM, 带 2ms 起音/6ms 释音包络防爆音), 便于保存与分享</p></li>
<li><p>不支持中文字符，遇到会提示具体是哪个字符；双击任意输入框可复制内容</p></li>
</ul>
`;

const tw = `
<h2>摩斯電碼 (Morse Code)</h2>
<blockquote><p>摩斯電碼是 1830 年代由 山繆·摩斯 (Samuel Morse) 與 艾爾菲德·維爾 (Alfred Vail) 發明的信號編碼，把字母、數字、標點編碼為「點 (.) 與 劃 (-)」的序列，是最早的電報編碼之一。</p>
</blockquote>
<ul>
<li><p>「點」長度 1 個單位，「劃」長度 3 個單位</p></li>
<li><p>字母內部符號間隔 1 個單位，字母之間間隔 3 個單位，單詞之間間隔 7 個單位 (本工具以 <code>/</code> 表示單詞間隔)</p></li>
<li><p>本工具支援 A~Z、0~9 及常用標點（<code>.,?!'()&:;=+_-"$@</code> 等），皆為 ITU 國際摩斯電碼標準表</p></li>
<li><p>最著名的訊號 <b>SOS</b> = <code>... --- ...</code>，並非縮寫，而是便於發送/識別的順口訊號</p></li>
</ul>
<h2>使用提示</h2>
<ul>
<li><p>「文字 → 摩斯電碼」：把上方明文編碼到下方；「摩斯電碼 → 文字」：把下方摩斯電碼解碼回上方</p></li>
<li><p>編碼時單詞之間自動以 <code>/</code> 分隔；解碼同樣支援 <code>/</code> 分隔，多餘的連續空格會被忽略</p></li>
<li><p><b>播放摩斯電碼</b>：優先播放下方摩斯電碼；下方為空時若上方是摩斯電碼則直接播放，否則自動把上方明文編碼後播放。可調整「播放速度」與「頻率」，播放中可隨時「停止」</p></li>
<li><p>「音效」可選：<b>電報音 (預設, 經典等幅報正弦音)</b> / 蜂鳴音 / 柔和音 / 電子音，播放時會依所選音色發聲，並同步以紅色高亮目前碼值</p></li>
<li><p><b>常用編碼</b>：下拉提供 呼叫/通用 (CQ、SOS、K、KN、SK…)、高頻 Q 簡語 (QRZ、QTH、QSL…)、數字祝賀語 (73、88)、單詞簡寫 (TU、OK、R…) 速查，選中即自動填入明文與摩斯電碼區；也可在「設定 → 其他 → 摩斯電碼常用編碼」維護自己的常用編碼</p></li>
<li><p><b>儲存音訊 (WAV)</b>：一鍵把目前摩斯電碼依所選 音效/速度/頻率 離線合成為 .wav 檔 (16bit 單聲道 PCM, 帶 2ms 起音/6ms 收尾包絡防止爆音), 方便儲存與分享</p></li>
<li><p>不支援中文字元，遇到會提示具體是哪個字元；雙擊任一輸入框可複製內容</p></li>
</ul>
`;

const en = `
<h2>Morse Code</h2>
<blockquote><p>Morse code is a signaling code invented in the 1830s by Samuel Morse and Alfred Vail that encodes letters, digits and punctuation as sequences of “dots (.) and dashes (-)”, and was one of the earliest telegraph codes.</p>
</blockquote>
<ul>
<li><p>A “dot” lasts 1 unit, a “dash” 3 units</p></li>
<li><p>Within a letter, symbols are 1 unit apart; letters are 3 units apart; words are 7 units apart (this tool uses <code>/</code> as the word separator)</p></li>
<li><p>Supported: A~Z, 0~9 and common punctuation (<code>.,?!'()&:;=+_-"$@</code> …), all per the ITU international Morse standard</p></li>
<li><p>The most famous signal, <b>SOS</b> = <code>... --- ...</code>, is not an abbreviation — it was chosen for being easy to send and recognize</p></li>
</ul>
<h2>Usage tips</h2>
<ul>
<li><p>“Text → Morse” encodes the plaintext above into the box below; “Morse → Text” decodes the Morse below back into the box above</p></li>
<li><p>Words are automatically separated by <code>/</code> when encoding; decoding also accepts <code>/</code> separators, and extra runs of spaces are ignored</p></li>
<li><p><b>Play Morse</b>: plays the Morse box below first; if it is empty but the box above holds Morse it is played directly, otherwise the plaintext above is encoded and played. You can adjust speed and frequency, and hit “Stop” any time</p></li>
<li><p>“Sound” choices: <b>Telegraph tone (default, classic CW sine)</b> / beep / soft / electronic. The chosen timbre is used during playback with the current code value highlighted in red</p></li>
<li><p><b>Common codes</b>: the dropdown offers quick picks — calling/general (CQ, SOS, K, KN, SK…), high-frequency Q-codes (QRZ, QTH, QSL…), numeric greetings (73, 88) and abbreviations (TU, OK, R…) — selecting one fills the text and Morse boxes automatically. Your own list can be maintained in Settings → Other → Morse common codes</p></li>
<li><p><b>Save audio (WAV)</b>: one click renders the current Morse offline into a .wav file with the chosen sound / speed / frequency (16-bit mono PCM, 2 ms attack / 6 ms release envelope to avoid clicks), ready to save and share</p></li>
<li><p>Chinese characters are not supported — you will be told exactly which character is unsupported; double-click any input box to copy its content</p></li>
</ul>
`;

const Intro = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
}
export default Intro;
