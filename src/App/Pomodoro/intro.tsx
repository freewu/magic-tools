import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>一个<b>番茄工作法计时器</b>: 专注 <b>25 分钟</b> → 短休息 <b>5 分钟</b> → 每完成 4 个番茄进入<b>长休息 15 分钟</b>, 循环提醒你保持节奏。阶段结束时播放提示音 (内置多种<b>本地合成音色</b>, 也可以<b>指定你自己的音频文件</b>), 可选<b>弹出系统通知</b>; 全程本地运行, 不联网、不上传。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>点「<b>开始</b>」即开始专注计时; 大数字显示剩余时间, 顶部的圆点表示本轮累计完成的番茄数; 想当倒计时大屏用可点右上角<b>「全屏」</b> (再按 <code>Esc</code> 退出)</p></li>
<li><p>时间到会自动播放提示音并进入下一阶段 (默认<b>自动开始</b>; 也可以关掉, 只提示不自动走)</p></li>
<li><p>随时可「<b>暂停</b> / <b>重置</b>」; 想提前结束当前阶段就点「<b>跳过当前阶段</b>」, 也可以直接用页签手动切到 <b>专注 / 短休息 / 长休息</b></p></li>
<li><p>「<b>完成提示音</b>」有 5 种内置合成音 (叮 / 钟声 / 哔哔哔 / 木鱼 / 风铃), 并支持「<b>提示次数</b>」(1~5) 重复提醒; 选「<b>自定义音频</b>」后可点「选择音频文件…」上传你喜欢的 wav / mp3 / ogg —— 文件只在本机用 <code>objectURL</code> 播放、不进任何网络, 切浏览器会话后需重新指定</p></li>
<li><p>「<b>完成时弹通知</b>」开启后在阶段结束弹窗提醒: <b>桌面版走系统原生通知</b> (tauri-plugin-notification), Web 版走浏览器 Notification (首次会请求权限); 权限被拒绝时自动降级为页面内提示, 不影响计时</p></li>
<li><p>「<b>背景颜色</b>」可换时钟大屏底色 (深/浅预置色或自定义), 「<b>专注颜色</b>」与「<b>休息颜色</b>」分别设置两种阶段的时间数字颜色; 全屏时同样生效, 调好后可一并「保存为默认设置」</p></li>
<li><p>调好的时长 / 音色 / 弹窗等参数可「<b>保存为默认设置</b>」, 下次打开自动沿用; 也可在 设置 → 其它 → 番茄时钟 里预设</p></li>
</ul>

<h2>小贴士</h2>
<ul>
<li><p>经典节奏是 25+5; 需要更自由的可以改专注 / 短休 / 长休分钟数 (1~180) 与「每几个专注后长休」(1~12)</p></li>
<li><p>计时按<b>截止时刻</b>推算而不是逐秒累加: 页面切后台或系统卡顿后回来, 剩余时间依然准确</p></li>
<li><p>自定义音频仅记住文件名、不持久化音频数据; 同一会话内切到其它音色再切回「自定义」仍会保留已选文件</p></li>
<li><p>提醒音与通知都先试听确认音量, 开会 / 自习时别忘了把「完成时弹通知」或音量调低</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>一個<b>番茄工作法計時器</b>: 專注 <b>25 分鐘</b> → 短休息 <b>5 分鐘</b> → 每完成 4 個番茄進入<b>長休息 15 分鐘</b>, 循環提醒你保持節奏。階段結束時播放提示音 (內建多種<b>本機合成音色</b>, 也可以<b>指定你自己的音訊檔</b>), 可選<b>彈出系統通知</b>; 全程本機執行, 不連網、不上傳。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>點「<b>開始</b>」即開始專注計時; 大數字顯示剩餘時間, 頂部的圓點表示本輪累計完成的番茄數; 想當倒數大螢幕用可點右上角<b>「全屏」</b> (再按 <code>Esc</code> 退出)</p></li>
<li><p>時間到會自動播放提示音並進入下一階段 (預設<b>自動開始</b>; 也可以關掉, 只提示不自動走)</p></li>
<li><p>隨時可「<b>暫停</b> / <b>重置</b>」; 想提前結束目前階段就點「<b>跳過目前階段</b>」, 也可以直接用手頁切到 <b>專注 / 短休息 / 長休息</b></p></li>
<li><p>「<b>完成提示音</b>」有 5 種內建合成音 (叮 / 鐘聲 / 嗶嗶嗶 / 木魚 / 風鈴), 並支援「<b>提示次數</b>」(1~5) 重複提醒; 選「<b>自訂音訊</b>」後可點「選擇音訊檔…」上傳你喜歡的 wav / mp3 / ogg —— 檔案只在本機用 <code>objectURL</code> 播放、不進任何網路, 切瀏覽器工作階段後需重新指定</p></li>
<li><p>「<b>完成時彈通知</b>」開啟後在階段結束彈窗提醒: <b>桌面版走系統原生通知</b> (tauri-plugin-notification), Web 版走瀏覽器 Notification (首次會請求權限); 權限被拒絕時自動降級為頁面內提示, 不影響計時</p></li>
<li><p>「<b>背景顏色</b>」可換時鐘大螢幕底色 (深/淺預設色或自訂), 「<b>專注顏色</b>」與「<b>休息顏色</b>」分別設定兩種階段的時間數字顏色; 全螢幕時同樣生效, 調好後可一併「儲存為預設設定」</p></li>
<li><p>調好的時長 / 音色 / 彈窗等參數可「<b>儲存為預設設定</b>」, 下次開啟自動沿用; 也可在 設定 → 其他 → 番茄鐘 裡預設</p></li>
</ul>

<h2>小提示</h2>
<ul>
<li><p>經典節奏是 25+5; 需要更自由的可以改專注 / 短休 / 長休分鐘數 (1~180) 與「每幾個專注後長休」(1~12)</p></li>
<li><p>計時依<b>截止時刻</b>推算而不是逐秒累加: 頁面切背景或系統卡頓後回來, 剩餘時間依然準確</p></li>
<li><p>自訂音訊只記住檔名、不保留音訊資料; 同一工作階段內切到其它音色再切回「自訂」仍會保留已選檔案</p></li>
<li><p>提醒音與通知都先試聽確認音量, 開會 / 自習時別忘了把「完成時彈通知」或音量調低</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>A <b>Pomodoro timer</b>: <b>25 min focus</b> → <b>5 min short break</b> → and after every 4 pomodoros a <b>15 min long break</b>, circling to keep you on pace. A sound plays when a phase ends (several <b>locally synthesised timbres</b>, or <b>your own audio file</b>), with an optional <b>system notification</b>. Everything runs locally — no network, nothing uploaded.</p></blockquote>

<h2>How to use</h2>
<ul>
<li><p>Press <b>Start</b> to begin a focus session; the big digits show the time left and the dots above mark the pomodoros completed in this cycle. Use <b>Fullscreen</b> at the top-right for a big countdown screen (<code>Esc</code> to leave)</p></li>
<li><p>When time is up the alert sound plays and the next phase begins (auto-start is on by default; turn it off to only be alerted)</p></li>
<li><p><b>Pause</b> / <b>Reset</b> are always available; <b>Skip phase</b> ends the current one early and the tabs switch between <b>Focus / Short break / Long break</b> manually</p></li>
<li><p><b>Alert sound</b> offers 5 built-in synth timbres (ding / bell / beep / wood block / chime) plus a <b>Repeat count</b> (1–5); pick <b>Custom audio</b> and a “Choose audio…” button appears to load your own wav / mp3 / ogg — the file is played locally via <code>objectURL</code> and never uploaded (re-pick it in a new browser session)</p></li>
<li><p>With <b>Notify on finish</b> on, a notification pops up when a phase ends — the <b>desktop build uses a native system notification</b> (tauri-plugin-notification), while the Web build uses the browser Notification API (permission is requested once); if blocked it falls back to an on-page notice without affecting the timer</p></li>
<li><p><b>Background color</b> changes the clock backdrop (dark / light presets or any custom colour), while <b>Focus color</b> and <b>Break color</b> set the digits for each phase; both apply in fullscreen too and are saved with the other defaults</p></li>
<li><p>Save the tuned durations / sound / notification options as defaults; they can also be preset in Settings → Utilities → Pomodoro timer</p></li>
</ul>

<h2>Tips</h2>
<ul>
<li><p>The classic rhythm is 25+5; make it yours with the focus / short / long minute fields (1–180) and “Long break after N pomodoros” (1–12)</p></li>
<li><p>Timing is derived from a <b>deadline timestamp</b> rather than accumulated ticks, so it stays accurate even after the tab goes to background or the UI stalls</p></li>
<li><p>Custom audio remembers only the file name — the audio data is never persisted; switching to another timbre and back within the same session keeps your chosen file</p></li>
<li><p>Listen to the alert and check the volume first; at meetings or in a library you may want to lower the volume or turn the notification off</p></li>
</ul>`;

const PomodoroIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default PomodoroIntro;