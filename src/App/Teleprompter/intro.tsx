import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>把讲稿粘贴进来, 让文字按设定速度自动向上滚动 —— 直播、录课、发布会、口播视频对着念就行。全部在本地完成 (不联网、不上传), 支持<strong>速度调节</strong>、<strong>逐行焦点高亮</strong> (只高亮正在念的那一行, 越远越淡)、<strong>上下边缘淡入淡出</strong>、<strong>全屏播放</strong>与<strong>空格暂停/开始</strong>。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>把讲稿粘贴到「提词脚本」里 (打开时会按当前语言随机载入一首示范诗: 中文为《沁园春·长沙》《再别康桥》, 英文为 <em>Do not go gentle into that good night</em> / <em>When You Are Old</em>; 点「载入示例」可再随机换一首), 空行会当成段落间距保留</p></li>
<li><p>按需要调「字号」「行距」「淡入淡出」与「逐行高亮」: 字号大适合站远一点看, 行距大更容易用手指跟读</p></li>
<li><p>点「全屏」进入全屏提词, 再按<strong>空格</strong>开始滚动; 滚动中随时按空格暂停, 调整语速后继续</p></li>
<li><p>底部工具条上的「速度」可以边播边调, 右侧显示进度条与剩余时间; 「回到开头」可重新开始</p></li>
<li><p>调好一套顺手的速度 / 字号 / 行距后, 点「保存为默认设置」即可存为默认值, 下次打开自动沿用; 也可以直接到 <strong>设置 → 其它 → 提词器</strong> 里预设</p></li>
</ul>

<h2>键盘快捷键</h2>
<ul>
<li><p><code>空格</code>: 开始 / 暂停 (焦点在输入框内时, 空格仍是正常输入, 不会误触播放)</p></li>
<li><p><code>↑</code> / <code>↓</code>: 速度加减 5 px/s</p></li>
<li><p><code>Esc</code>: 退出全屏 (原生全屏由浏览器接管, 同样是 Esc)</p></li>
</ul>

<h2>小贴士</h2>
<ul>
<li><p>速度就是字面意义上的"每秒滚动多少像素", 所以改完字号后建议重新试一遍速度: 一般 40 ~ 80 px/s 比较接近日常语速</p></li>
<li><p>「淡入淡出」让文字在上下边缘渐隐, 「逐行高亮」则只把视线所在的那一行点亮、越远的行越透明颜色越淡, 两者叠加后视线几乎只能落在当前行; 关掉「逐行高亮」所有行会同样清晰, 适合快速通读</p></li>
<li><p>全屏时只保留底部工具条, 脚本编辑区会隐藏在背后, 退出全屏即可继续改稿; 速度 / 字号 / 行距 / 淡入淡出 / 逐行高亮 以「默认设置」为准, 想在本次会话里试参数不会影响下次打开</p></li>
<li><p>只按逻辑行渲染, 不做自动换行排版限制: 一行太长时会在视口内自动折行, 想控制断句就自己在合适的位置换行</p></li>
<li><p>建议用深色底配浅色字时把屏幕亮度调低一点, 长时间对着念眼睛更舒服</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>把講稿貼進來, 讓文字按設定速度自動向上捲動 —— 直播、錄課、發表會、口播影片對著念就行。全部在本機完成 (不連網、不上傳), 支援<strong>速度調節</strong>、<strong>逐行焦點高亮</strong> (只高亮正在念的那一行, 越遠越淡)、<strong>上下邊緣淡入淡出</strong>、<strong>全螢幕播放</strong>與<strong>空格暫停/開始</strong>。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>把講稿貼到「提詞腳本」裡 (打開時會按目前語言隨機載入一首示範詩: 中文為《沁園春·長沙》《再別康橋》, 英文為 <em>Do not go gentle into that good night</em> / <em>When You Are Old</em>; 點「載入範例」可再隨機換一首), 空行會當成段落間距保留</p></li>
<li><p>按需要調「字號」「行距」「淡入淡出」與「逐行高亮」: 字號大適合站遠一點看, 行距大更容易用手指跟讀</p></li>
<li><p>點「全屏」進入全螢幕提詞, 再按<strong>空格</strong>開始捲動; 捲動中隨時按空格暫停, 調整語速後繼續</p></li>
<li><p>底部工具條上的「速度」可以邊播邊調, 右側顯示進度條與剩餘時間; 「回到開頭」可重新開始</p></li>
<li><p>調好一套順手的速度 / 字號 / 行距後, 點「儲存為預設設定」即可存為預設值, 下次開啟自動沿用; 也可以直接到 <strong>設定 → 其他 → 提詞器</strong> 裡預設</p></li>
</ul>

<h2>鍵盤快捷鍵</h2>
<ul>
<li><p><code>空格</code>: 開始 / 暫停 (焦點在輸入框內時, 空格仍是正常輸入, 不會誤觸播放)</p></li>
<li><p><code>↑</code> / <code>↓</code>: 速度加減 5 px/s</p></li>
<li><p><code>Esc</code>: 退出全螢幕 (原生全螢幕由瀏覽器接管, 同樣是 Esc)</p></li>
</ul>

<h2>小提示</h2>
<ul>
<li><p>速度就是字面上的"每秒捲動多少像素", 所以改完字號後建議重新試一遍速度: 一般 40 ~ 80 px/s 比較接近日常語速</p></li>
<li><p>「淡入淡出」讓文字在上下邊緣漸隱, 「逐行高亮」則只把視線所在的那一行點亮、越遠的行越透明顏色越淡, 兩者疊加後視線幾乎只能落在目前行; 關掉「逐行高亮」所有行會同樣清晰, 適合快速通讀</p></li>
<li><p>全螢幕時只保留底部工具條, 腳本編輯區會隱藏在背後, 退出全螢幕即可繼續改稿; 速度 / 字號 / 行距 / 淡入淡出 / 逐行高亮 以「預設設定」為準, 想在本工作階段裡試參數不會影響下次開啟</p></li>
<li><p>只按邏輯行渲染, 不做自動換行排版限制: 一行太長時會在視口內自動折行, 想控制斷句就自己在合適的位置換行</p></li>
<li><p>建議用深色底配淺色字時把螢幕亮度調低一點, 長時間對著念眼睛更舒服</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Paste your script and let it scroll upwards at the speed you choose — handy for live streams, recorded lessons, launches and talking-head videos. Everything runs locally (offline, nothing uploaded) with <strong>speed control</strong>, <strong>line focus</strong> (only the line you are reading stays bright, the rest fade out), <strong>fade-in / fade-out edges</strong>, <strong>fullscreen playback</strong> and <strong>space to pause / resume</strong>.</p></blockquote>

<h2>How to use</h2>
<ul>
<li><p>Paste the script into “Script”. A demo poem is picked at random for the current language on open (Chinese: 《沁園春·長沙》/《再別康橋》; English: <em>Do not go gentle into that good night</em> / <em>When You Are Old</em>) — hit “Load sample” to shuffle to the other one. Blank lines are kept as paragraph spacing</p></li>
<li><p>Tune “Font size”, “Line height”, “Fade edges” and “Line focus”: a bigger font helps when you stand further away, more line height makes it easier to track the text with a finger</p></li>
<li><p>Click “Fullscreen”, then press <strong>Space</strong> to start scrolling. Press Space again any time to pause, adjust your pace and carry on</p></li>
<li><p>The “Speed” slider in the bottom bar can be changed while playing; the bar also shows a progress bar and time left, and “Back to start” rewinds to the beginning</p></li>
<li><p>Once the speed / font size / line height feel right, hit “Save as defaults” to keep them for next time — or preset them under <strong>Settings → Utilities → Teleprompter</strong></p></li>
</ul>

<h2>Keyboard shortcuts</h2>
<ul>
<li><p><code>Space</code>: start / pause (while the caret is inside a text box, Space still types a space instead of toggling playback)</p></li>
<li><p><code>↑</code> / <code>↓</code>: speed ±5 px/s</p></li>
<li><p><code>Esc</code>: leave fullscreen (native fullscreen is handled by the browser, also with Esc)</p></li>
</ul>

<h2>Tips</h2>
<ul>
<li><p>Speed literally means “pixels scrolled per second”, so re-check it after changing the font size: 40 – 80 px/s usually matches a natural speaking pace</p></li>
<li><p>“Fade edges” dissolves lines in at the bottom and out at the top, while “Line focus” brightens only the line at the reading point and dims the rest the further away they are — together your eyes can hardly drift off the current line. Turn “Line focus” off and every line stays equally readable, which suits a quick read-through</p></li>
<li><p>In fullscreen only the bottom bar stays — the editor sits behind it, so leave fullscreen to keep editing. Speed, font size, line height, fade and line focus follow the saved defaults, so experimenting during a session never changes what you get next time</p></li>
<li><p>Only logical lines are rendered and long lines wrap automatically inside the viewport; insert line breaks yourself if you want to control the phrasing</p></li>
<li><p>With light text on a dark background, dimming the screen a little is easier on the eyes for long sessions</p></li>
</ul>`;

const TeleprompterIntro :React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default TeleprompterIntro;
