import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>一个<b>练习用的节拍器</b>: 按设定的速度 (BPM) 与拍号打点, 首拍重音, 支持每拍细分 (2/3/4 连音)。声音用 Web Audio 在本地合成 (不加载任何音频文件、不联网), 视觉上有一颗<b>跟着节拍闪烁的大圆点</b>, 可一键进入<b>全屏</b>当指挥灯用。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>点「<b>开始</b>」即开始打点 (浏览器要求用户手势后才能出声, 所以必须点一下) ; 再点「停止」结束并归零</p></li>
<li><p>拖动<b>速度</b>滑块、直接输入数字, 或用 <code>−</code> / <code>+</code> 微调; 也可以按键盘 <code>↑</code> <code>↓</code> 调速 (按住 <code>Shift</code> 一次 ±10)</p></li>
<li><p>不知道速度? 用「<b>连击测速</b>」: 跟着感觉连续点按钮 (至少 2 次), 取最近几次点击的平均值自动填进速度; 停顿超过约 2.5 秒会重新开始测</p></li>
<li><p><b>拍号</b>决定每小节几拍 (1~12, 也可直接点 4/4、6/8 等常用拍号按钮) ; 「<b>细分</b>」把每拍再等分成 2 / 3 / 4 下 (细分的打点音更轻更暗)</p></li>
<li><p>「<b>音色</b>」是三种本地合成音 (电子嘀嗒 / 正弦蜂鸣 / 木鱼) , 「<b>音量</b>」拉到 0 即静音; 关掉「首拍重音」后每拍音量相同</p></li>
<li><p>点「<b>全屏</b>」把圆点铺满整屏 (背景也会跟着轻微染色) ; 关掉「背景闪烁」则只闪圆点。全屏下按 <code>Esc</code> 退出</p></li>
<li><p>把调好的参数点「<b>保存为默认设置</b>」记下来, 下次打开或刷新后依然生效; 也可以在「设置中心 → 其它 → 节拍器」里改</p></li>
</ul>

<h2>怎么用更稳</h2>
<ul>
<li><p>打点音是<b>提前 120ms 排进音频时钟</b>再播放的 (lookahead 调度) , 所以节奏不会被界面卡顿带偏; 中途变速、改音量、切音色都是立刻生效、无需停止</p></li>
<li><p>练习时建议<b>先慢后快</b>: 用能打准的速度 (常用 60~80) 打稳, 再每次 +4 提速; 速度名 (Largo / Andante / Allegro…) 只是档位提示</p></li>
<li><p>圆点可以直接<b>点击</b>开始 / 停止, 所以全屏时不必退出也能暂停</p></li>
<li><p>睡眠不足或光敏感人群建议关闭「背景闪烁」, 只用圆点做视觉提示</p></li>
</ul>

<h2>常见问题</h2>
<ul>
<li><p><b>点了开始没声音?</b> 浏览器/系统把音频挂起了 (常见于首次访问或标签页被静音) —— 再点一次「开始」, 并检查系统音量与标签页是否静音</p></li>
<li><p><b>节奏和别的设备对不上?</b> 本工具用本机音频时钟调度, 与手机 App / 硬件节拍器之间会有毫秒级差异, 合奏请统一用一个节拍源</p></li>
<li><p><b>全屏按钮没反应?</b> 部分内嵌浏览器窗口不允许原生全屏, 此时会退化为「窗口内全屏」(圆点同样铺满可用区域)</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>一個<b>練習用的節拍器</b>: 依設定的速度 (BPM) 與拍號打點, 首拍重音, 支援每拍細分 (2/3/4 連音)。聲音用 Web Audio 在本機合成 (不載入任何音訊檔、不連網), 視覺上有一顆<b>跟著節拍閃爍的大圓點</b>, 可一鍵進入<b>全螢幕</b>當指揮燈用。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>點「<b>開始</b>」即開始打點 (瀏覽器要求使用者手勢後才能出聲, 所以必須點一下) ; 再點「停止」結束並歸零</p></li>
<li><p>拖曳<b>速度</b>滑桿、直接輸入數字, 或用 <code>−</code> / <code>+</code> 微調; 也可以按鍵盤 <code>↑</code> <code>↓</code> 調速 (按住 <code>Shift</code> 一次 ±10)</p></li>
<li><p>不知道速度? 用「<b>連擊測速</b>」: 跟著感覺連續點按鈕 (至少 2 次), 取最近幾次點擊的平均值自動填入速度; 停頓超過約 2.5 秒會重新開始測</p></li>
<li><p><b>拍號</b>決定每小節幾拍 (1~12, 也可直接點 4/4、6/8 等常用拍號按鈕) ; 「<b>細分</b>」把每拍再等分成 2 / 3 / 4 下 (細分的打點音更輕更暗)</p></li>
<li><p>「<b>音色</b>」是三種本機合成音 (電子嘀嗒 / 正弦蜂鳴 / 木魚) , 「<b>音量</b>」拉到 0 即靜音; 關掉「首拍重音」後每拍音量相同</p></li>
<li><p>點「<b>全螢幕</b>」把圓點鋪滿整個畫面 (背景也會跟著輕微染色) ; 關掉「背景閃爍」則只閃圓點。全螢幕下按 <code>Esc</code> 退出</p></li>
<li><p>把調好的參數點「<b>儲存為預設設定</b>」記下來, 下次打開或重新整理後依然生效; 也可以在「設定中心 → 其他 → 節拍器」裡改</p></li>
</ul>

<h2>怎麼用更穩</h2>
<ul>
<li><p>打點音是<b>提前 120ms 排進音訊時鐘</b>再播放的 (lookahead 排程) , 所以節奏不會被介面卡頓帶偏; 中途變速、改音量、換音色都立即生效、無需停止</p></li>
<li><p>練習時建議<b>先慢後快</b>: 用能打準的速度 (常用 60~80) 打穩, 再每次 +4 提速; 速度名 (Largo / Andante / Allegro…) 只是檔位提示</p></li>
<li><p>圓點可以直接<b>點擊</b>開始 / 停止, 所以全螢幕時不必退出也能暫停</p></li>
<li><p>睡眠不足或光敏感族群建議關閉「背景閃爍」, 只用圓點做視覺提示</p></li>
</ul>

<h2>常見問題</h2>
<ul>
<li><p><b>點了開始沒聲音?</b> 瀏覽器/系統把音訊掛起了 (常見於首次訪問或分頁被靜音) —— 再點一次「開始」, 並檢查系統音量與分頁是否靜音</p></li>
<li><p><b>節奏和別的裝置對不上?</b> 本工具用本機音訊時鐘排程, 與手機 App / 硬體節拍器之間會有毫秒級差異, 合奏請統一用一個節拍源</p></li>
<li><p><b>全螢幕按鈕沒反應?</b> 部分內嵌瀏覽器視窗不允許原生全螢幕, 此時會退化為「視窗內全螢幕」(圓點同樣鋪滿可用區域)</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>A <b>practice metronome</b>: it clicks at the tempo (BPM) and time signature you set, accents the first beat and can subdivide each beat (2/3/4 per beat). All sound is synthesised locally with Web Audio (no audio files, no network), and a <b>big dot pulses with the beat</b> — go <b>fullscreen</b> and use it as a visual baton.</p></blockquote>

<h2>How to use</h2>
<ul>
<li><p>Press <b>Start</b> to begin (browsers only allow audio after a user gesture, so one click is required); press <b>Stop</b> to end and reset the counters</p></li>
<li><p>Drag the <b>tempo</b> slider, type a value, or nudge with <code>−</code> / <code>+</code>; the <code>↑</code> <code>↓</code> keys also work (hold <code>Shift</code> for ±10)</p></li>
<li><p>Don't know the tempo? Use <b>Tap tempo</b>: tap the button at least twice and the average of your recent taps is applied. A pause longer than ~2.5 s restarts the measurement</p></li>
<li><p><b>Time signature</b> sets beats per bar (1–12, or use the 4/4, 6/8 … shortcuts); <b>Subdivision</b> splits each beat into 2 / 3 / 4 clicks (subdivisions are quieter and dimmer)</p></li>
<li><p><b>Timbre</b> offers three locally synthesised sounds (click / beep / wood block) and <b>Volume</b> goes down to silence; turn off <i>Accent first beat</i> for an even click</p></li>
<li><p><b>Fullscreen</b> blows the dot up to fill the screen (with a subtle background tint); turn off <i>Flash background</i> to flash the dot only. Press <code>Esc</code> to leave fullscreen</p></li>
<li><p>Hit <b>Save as defaults</b> to remember your settings for the next visit, or change them in <i>Settings → Misc → Metronome</i></p></li>
</ul>

<h2>Notes</h2>
<ul>
<li><p>Clicks are scheduled <b>120 ms ahead into the audio clock</b> (lookahead scheduling), so the timing never drifts with UI hiccups; tempo, volume and timbre changes apply instantly while running</p></li>
<li><p>Practise <b>slow first</b>: pick a tempo you can hit accurately (60–80 works well), then raise it by 4 at a time. Tempo names (Largo / Andante / Allegro …) are just range hints</p></li>
<li><p>The dot itself is clickable to start/stop, so you can pause without leaving fullscreen</p></li>
<li><p>If you are photosensitive, turn off <i>Flash background</i> and use the dot alone</p></li>
</ul>

<h2>Troubleshooting</h2>
<ul>
<li><p><b>No sound after pressing Start?</b> The browser suspended audio (common on first visit, or when the tab is muted) — press Start again and check the system volume / tab mute state</p></li>
<li><p><b>It doesn't match another device?</b> Timing uses this machine's audio clock, so there can be millisecond-level differences from phone apps or hardware metronomes — in an ensemble, use a single source</p></li>
<li><p><b>Fullscreen does nothing?</b> Some embedded webview windows refuse native fullscreen; the tool then falls back to in-window fullscreen (the dot still fills the available area)</p></li>
</ul>`;

const MetronomeIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default MetronomeIntro;
