import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>一个<b>浏览器里的屏幕录制器</b>: 用系统原生的屏幕共享能力 (getDisplayMedia) 采集画面, 用 MediaRecorder 编码, 可选录系统声音 / 麦克风, 录完直接<b>下载成视频文件</b>。全程在本机完成, <b>画面与声音都不会上传</b>。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>先设置「<b>帧率</b>」(演示 / 讲课 30 fps 够用, 录游戏或动画用 60)、「<b>画质 (码率)</b>」(8 Mbps 是清晰与体积的平衡点)、「<b>声音</b>」与「<b>分辨率上限</b>」</p></li>
<li><p>点「<b>开始录制</b>」—— 浏览器会弹出共享选择器, 可选<b>整个屏幕 / 应用窗口 / 浏览器标签页</b>; 想录到声音必须在选择器里勾选「分享标签页音频」或「分享系统音频」</p></li>
<li><p>录制中可随时「<b>暂停 / 继续</b>」(暂停的时间不计入时长) , 点「<b>停止</b>」或浏览器提示条上的「停止共享」都会结束录制</p></li>
<li><p>结束后下方出现<b>预览播放器</b>, 点「下载视频」保存为 WebM (Chromium / Firefox) 或 MP4 (Safari / 部分 Chromium) ; 「重新录制」清掉结果重来</p></li>
<li><p>常用参数可点「<b>保存为默认设置</b>」记住, 也可在「设置中心 → 其它 → 屏幕录制」里改 (含文件名前缀)</p></li>
</ul>

<h2>参数怎么选</h2>
<ul>
<li><p><b>帧率</b>: 15 fps 文字演示最小体积, 30 fps 通用, 60 fps 才需要流畅动作 (游戏 / 动画 / 滚动网页)</p></li>
<li><p><b>码率</b>: 2 Mbps 只要能看清文字, 4 Mbps 均衡, 8 Mbps 推荐, 16 Mbps 适合后期再剪辑</p></li>
<li><p><b>分辨率</b>: 「原始分辨率」不缩放 (最清晰) ; 选 1080p / 720p 只会<b>限制上限</b>不会放大, 主要用于减小体积</p></li>
<li><p><b>声音</b>: 「系统声音」录屏幕 / 标签页里的声音; 「系统声音 + 麦克风」会先把两条音轨合并 (需要额外授权麦克风, 麦克风权限被拒时会自动退化为只录系统声音)</p></li>
<li><p>文件名默认形如 <code>screen-recording-20260926-153012.webm</code> (前缀 + 时间戳) , 连续录制不会互相覆盖</p></li>
</ul>

<h2>为什么是「浏览器专享」</h2>
<ul>
<li><p>屏幕共享选择器是<b>浏览器提供的系统级 UI</b>; 桌面版内嵌的 WebView 里没有它, 因此本工具只在<b>浏览器 (Web 版)</b>可用, 桌面版会提示改用系统自带录屏工具</p></li>
<li><p>如果打开后提示「当前浏览器不支持屏幕录制」, 请升级到最新版 Chrome / Edge / Firefox; 若本页被嵌在 iframe 中, 还需要 iframe 带 <code>allow="display-capture"</code></p></li>
<li><p>录制 WebM 后如果想要 MP4, 可用本站「格式转换」类工具或 ffmpeg 转码; 浏览器只提供编码能力, 不做转封装</p></li>
</ul>

<h2>常见问题</h2>
<ul>
<li><p><b>录出来没有声音?</b> 共享选择器里没勾「分享音频」, 或「声音」选项设成了「不录声音」(系统不允许事后补录)</p></li>
<li><p><b>录到一半停了?</b> 点了浏览器提示条的「停止共享」, 或分辨率 / 帧率过高导致系统资源不足; 降低帧率与码率再试</p></li>
<li><p><b>文件很大?</b> 降低码率与帧率, 或把分辨率限制到 1080p / 720p; 也可录完后用视频压缩工具再处理</p></li>
<li><p><b>切到别的窗口有黑屏?</b> 这是操作系统的隐私保护 (macOS 需在「屏幕录制」权限里授权) ; 播放受版权保护的视频也可能黑屏</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>一個<b>瀏覽器裡的螢幕錄製器</b>: 用系統原生的螢幕共用能力 (getDisplayMedia) 擷取畫面, 用 MediaRecorder 編碼, 可選錄系統聲音 / 麥克風, 錄完直接<b>下載成影片檔</b>。全程在本機完成, <b>畫面與聲音都不會上傳</b>。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>先設定「<b>影格率</b>」(簡報 / 講課 30 fps 夠用, 錄遊戲或動畫用 60)、「<b>畫質 (位元率)</b>」(8 Mbps 是清晰與體積的平衡點)、「<b>聲音</b>」與「<b>解析度上限</b>」</p></li>
<li><p>點「<b>開始錄製</b>」—— 瀏覽器會彈出共用選擇器, 可選<b>整個螢幕 / 應用程式視窗 / 瀏覽器分頁</b>; 想錄到聲音必須在選擇器裡勾選「分享分頁音訊」或「分享系統音訊」</p></li>
<li><p>錄製中可隨時「<b>暫停 / 繼續</b>」(暫停的時間不計入時長) , 點「<b>停止</b>」或瀏覽器提示列上的「停止共用」都會結束錄製</p></li>
<li><p>結束後下方出現<b>預覽播放器</b>, 點「下載影片」存成 WebM (Chromium / Firefox) 或 MP4 (Safari / 部分 Chromium) ; 「重新錄製」清掉結果重來</p></li>
<li><p>常用參數可點「<b>儲存為預設設定</b>」記住, 也可在「設定中心 → 其他 → 螢幕錄製」裡改 (含檔名前綴)</p></li>
</ul>

<h2>參數怎麼選</h2>
<ul>
<li><p><b>影格率</b>: 15 fps 文字簡報最小體積, 30 fps 通用, 60 fps 才需要流暢動作 (遊戲 / 動畫 / 捲動網頁)</p></li>
<li><p><b>位元率</b>: 2 Mbps 只要能看清文字, 4 Mbps 均衡, 8 Mbps 推薦, 16 Mbps 適合後期再剪輯</p></li>
<li><p><b>解析度</b>: 「原始解析度」不縮放 (最清晰) ; 選 1080p / 720p 只會<b>限制上限</b>不會放大, 主要用於減小體積</p></li>
<li><p><b>聲音</b>: 「系統聲音」錄螢幕 / 分頁裡的聲音; 「系統聲音 + 麥克風」會先把兩條音軌合併 (需要額外授權麥克風, 麥克風權限被拒時會自動退化為只錄系統聲音)</p></li>
<li><p>檔名預設形如 <code>screen-recording-20260926-153012.webm</code> (前綴 + 時間戳) , 連續錄製不會互相覆蓋</p></li>
</ul>

<h2>為什麼是「瀏覽器專享」</h2>
<ul>
<li><p>螢幕共用選擇器是<b>瀏覽器提供的系統級 UI</b>; 桌面版內嵌的 WebView 裡沒有它, 因此本工具只在<b>瀏覽器 (Web 版)</b>可用, 桌面版會提示改用系統自帶錄屏工具</p></li>
<li><p>如果打開後提示「目前瀏覽器不支援螢幕錄製」, 請升級到最新版 Chrome / Edge / Firefox; 若本頁被嵌在 iframe 中, 還需要 iframe 帶 <code>allow="display-capture"</code></p></li>
<li><p>錄製 WebM 後如果想要 MP4, 可用本站「格式轉換」類工具或 ffmpeg 轉碼; 瀏覽器只提供編碼能力, 不做轉封裝</p></li>
</ul>

<h2>常見問題</h2>
<ul>
<li><p><b>錄出來沒有聲音?</b> 共用選擇器裡沒勾「分享音訊」, 或「聲音」選項設成了「不錄聲音」(系統不允許事後補錄)</p></li>
<li><p><b>錄到一半停了?</b> 點了瀏覽器提示列的「停止共用」, 或解析度 / 影格率過高導致系統資源不足; 降低影格率與位元率再試</p></li>
<li><p><b>檔案很大?</b> 降低位元率與影格率, 或把解析度限制到 1080p / 720p; 也可錄完後用影片壓縮工具再處理</p></li>
<li><p><b>切到別的視窗有黑畫面?</b> 這是作業系統的隱私保護 (macOS 需在「螢幕錄製」權限裡授權) ; 播放受版權保護的影片也可能黑畫面</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>A <b>screen recorder that runs in your browser</b>: it captures with the native screen-share API (getDisplayMedia), encodes with MediaRecorder, can mix in system audio and/or your microphone, and lets you <b>download the video</b> when you are done. Everything happens locally — <b>nothing is uploaded</b>.</p></blockquote>

<h2>How to use</h2>
<ul>
<li><p>Pick a <b>frame rate</b> (30 fps is fine for demos and lectures, 60 for games/animation), a <b>quality (bitrate)</b> (8 Mbps balances sharpness and size), the <b>audio</b> source and a <b>resolution cap</b></p></li>
<li><p>Press <b>Start recording</b> — the browser shows a share picker where you choose <b>entire screen / a window / a tab</b>. To capture sound you must tick “Share tab audio” or “Share system audio” in that picker</p></li>
<li><p>You can <b>Pause / Resume</b> at any time (paused time is not counted); pressing <b>Stop</b> or hitting “Stop sharing” in the browser bar ends the recording</p></li>
<li><p>A <b>preview player</b> appears below: click <b>Download video</b> to save a WebM (Chromium / Firefox) or MP4 (Safari / some Chromium builds); <b>Record again</b> clears the result</p></li>
<li><p>Use <b>Save as defaults</b> to remember your settings, or edit them in <i>Settings → Misc → Screen recorder</i> (including the filename prefix)</p></li>
</ul>

<h2>Choosing parameters</h2>
<ul>
<li><p><b>Frame rate</b>: 15 fps for text-only slides, 30 fps in general, 60 fps only when motion matters (games, animation, scrolling pages)</p></li>
<li><p><b>Bitrate</b>: 2 Mbps if legible text is enough, 4 Mbps balanced, 8 Mbps recommended, 16 Mbps if you plan to re-edit</p></li>
<li><p><b>Resolution</b>: “Source resolution” never scales; 1080p / 720p only <b>cap</b> the capture (they never upscale) and are meant to shrink the file</p></li>
<li><p><b>Audio</b>: “System audio” records what the screen/tab plays; “System audio + microphone” merges both tracks (an extra microphone prompt appears, and a denial simply falls back to system audio)</p></li>
<li><p>Files are named like <code>screen-recording-20260926-153012.webm</code> (prefix + timestamp), so consecutive recordings never overwrite each other</p></li>
</ul>

<h2>Why “browser only”</h2>
<ul>
<li><p>The share picker is <b>system UI provided by the browser</b>; the WebView embedded in the desktop app does not have it, so this tool is available in the <b>browser (Web) version</b> only — the desktop build points you at your OS recorder instead</p></li>
<li><p>If you see “This browser cannot record the screen”, update to a recent Chrome / Edge / Firefox. Inside an iframe the frame also needs <code>allow="display-capture"</code></p></li>
<li><p>Want MP4 from a WebM recording? Transcode with the converter tools here or with ffmpeg — browsers only encode, they do not remux</p></li>
</ul>

<h2>Troubleshooting</h2>
<ul>
<li><p><b>No sound in the file?</b> “Share audio” was not ticked in the picker, or Audio is set to “No audio” (audio cannot be added afterwards)</p></li>
<li><p><b>Recording stopped early?</b> Someone hit “Stop sharing”, or the resolution/frame rate exhausted the machine — lower both and retry</p></li>
<li><p><b>Huge file?</b> Lower bitrate and frame rate, or cap the resolution at 1080p / 720p, then compress afterwards</p></li>
<li><p><b>Black frames when switching windows?</b> That is OS privacy protection (on macOS grant the “Screen Recording” permission); DRM-protected video can also appear black</p></li>
</ul>`;

const ScreenRecorderIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default ScreenRecorderIntro;
