import { useLocale } from '../../hook/locale-context';

const zh = `<h2>什么是 WebSocket 调试</h2>
<blockquote><p>基于浏览器原生 <b>WebSocket</b> 的在线调试工具: 连接 <code>ws://</code> / <code>wss://</code> 服务, 手动收发消息并查看日志, 可开启定时心跳。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>在地址栏填入服务地址, 例如 <code>ws://localhost:8080</code>; 填入 <code>http://</code> / <code>https://</code> 时会自动转换为 <code>ws://</code> / <code>wss://</code></p></li>
<li><p>点击「连接」, 状态标签会依次变为 连接中 → 已连接 (失败时显示连接出错并记录到日志)</p></li>
<li><p>在消息框输入内容, 点击「发送」或按 <b>Ctrl + Enter</b> 发送</p></li>
<li><p>收到的消息会追加到日志区, 可勾选「自动滚动」跟随最新消息</p></li>
</ul>

<h2>日志与统计</h2>
<ul>
<li><p>日志按时间排序, 每行标注方向: <code>↑</code> 发送 / <code>↓</code> 接收 / <code>·</code> 系统 / <code>!</code> 错误</p></li>
<li><p>顶部统计显示发送 / 接收条数与总字节数 (UTF-8 计算)</p></li>
<li><p>支持一键复制日志与导出为 <code>.txt</code> 文本文件</p></li>
<li><p>勾选「JSON 美化」后, 合法的 JSON 消息会缩进显示, 便于阅读; 仅影响显示与导出, 不影响实际收发的字节</p></li>
</ul>

<h2>心跳</h2>
<ul>
<li><p>填写心跳间隔 (秒) 与心跳内容后, 连接建立期间会按间隔自动发送该内容</p></li>
<li><p>间隔为 0 表示关闭心跳; 最大 600 秒</p></li>
</ul>

<h2>说明</h2>
<ul>
<li><p>WebSocket 是浏览器原生能力, 无需后端即可直连测试服务 (如 <code>ws://echo.websocket.events</code> 之类的回声服务)</p></li>
<li><p>在 <code>https</code> 页面下浏览器会拦截未加密的 <code>ws://</code> 连接, 此时请使用 <code>wss://</code></p></li>
<li><p>页面切换 (其它工具 ↔ 本工具) 时连接保持; 点击「断开」或关闭应用后连接释放</p></li>
</ul>`;

const tw = `<h2>什麼是 WebSocket 偵錯</h2>
<blockquote><p>基於瀏覽器原生 <b>WebSocket</b> 的線上偵錯工具: 連線 <code>ws://</code> / <code>wss://</code> 服務, 手動收發訊息並檢視日誌, 可開啟定時心跳。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>在位址欄填入服務位址, 例如 <code>ws://localhost:8080</code>; 填入 <code>http://</code> / <code>https://</code> 時會自動轉換為 <code>ws://</code> / <code>wss://</code></p></li>
<li><p>點擊「連線」, 狀態標籤會依序變為 連線中 → 已連線 (失敗時顯示連線錯誤並記錄到日誌)</p></li>
<li><p>在訊息框輸入內容, 點擊「傳送」或按 <b>Ctrl + Enter</b> 傳送</p></li>
<li><p>收到的訊息會追加到日誌區, 可勾選「自動捲動」跟隨最新訊息</p></li>
</ul>

<h2>日誌與統計</h2>
<ul>
<li><p>日誌依時間排序, 每列標註方向: <code>↑</code> 傳送 / <code>↓</code> 接收 / <code>·</code> 系統 / <code>!</code> 錯誤</p></li>
<li><p>頂部統計顯示傳送 / 接收筆數與總位元組數 (UTF-8 計算)</p></li>
<li><p>支援一鍵複製日誌與匯出為 <code>.txt</code> 文字檔</p></li>
<li><p>勾選「JSON 美化」後, 合法的 JSON 訊息會縮排顯示, 便於閱讀; 僅影響顯示與匯出, 不影響實際收發的位元組</p></li>
</ul>

<h2>心跳</h2>
<ul>
<li><p>填寫心跳間隔 (秒) 與心跳內容後, 連線建立期間會依間隔自動傳送該內容</p></li>
<li><p>間隔為 0 表示關閉心跳; 最大 600 秒</p></li>
</ul>

<h2>說明</h2>
<ul>
<li><p>WebSocket 是瀏覽器原生能力, 無需後端即可直連測試服務 (如 <code>ws://echo.websocket.events</code> 之類的回聲服務)</p></li>
<li><p>在 <code>https</code> 頁面下瀏覽器會攔截未加密的 <code>ws://</code> 連線, 此時請使用 <code>wss://</code></p></li>
<li><p>頁面切換 (其他工具 ↔ 本工具) 時連線保持; 點擊「斷開」或關閉應用程式後連線釋放</p></li>
</ul>`;

const en = `<h2>What is the WebSocket debugger</h2>
<blockquote><p>An online debugging tool built on the native browser <b>WebSocket</b>: connect to <code>ws://</code> / <code>wss://</code> endpoints, send and receive messages manually, inspect the log and optionally run a timed heartbeat.</p></blockquote>

<h2>Steps</h2>
<ul>
<li><p>Enter the endpoint URL, e.g. <code>ws://localhost:8080</code>; <code>http://</code> / <code>https://</code> is converted to <code>ws://</code> / <code>wss://</code> automatically</p></li>
<li><p>Click Connect — the status tag goes Connecting → Open (on failure it shows a connection error and logs it)</p></li>
<li><p>Type a message and click Send, or press <b>Ctrl + Enter</b></p></li>
<li><p>Incoming messages are appended to the log; enable Auto scroll to follow the newest entries</p></li>
</ul>

<h2>Log &amp; statistics</h2>
<ul>
<li><p>Entries are ordered by time and tagged by direction: <code>↑</code> send / <code>↓</code> receive / <code>·</code> system / <code>!</code> error</p></li>
<li><p>The header shows sent/received counts and total bytes (computed as UTF-8)</p></li>
<li><p>Copy the whole log or export it as a <code>.txt</code> file in one click</p></li>
<li><p>With Pretty JSON enabled, valid JSON messages are indented for readability — this only affects display and export, never the bytes actually transferred</p></li>
</ul>

<h2>Heartbeat</h2>
<ul>
<li><p>Set an interval (seconds) and a payload and the tool sends that payload repeatedly while connected</p></li>
<li><p>An interval of 0 disables the heartbeat; the maximum is 600 seconds</p></li>
</ul>

<h2>Notes</h2>
<ul>
<li><p>WebSocket is a native browser capability, so echo services such as <code>ws://echo.websocket.events</code> can be tested without any backend</p></li>
<li><p>On <code>https</code> pages the browser blocks unencrypted <code>ws://</code> connections — use <code>wss://</code> there</p></li>
<li><p>The connection survives page switches (other tools ↔ this tool) and is released when you click Disconnect or close the app</p></li>
</ul>`;

const Intro = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
}

export default Intro;
