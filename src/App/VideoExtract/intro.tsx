import { useLocale } from "../../hook/locale-context";

const introZh = `
<h2>这个工具做什么</h2>
<blockquote><p>把视频分享链接变成「可直接保存的直链」: 粘贴分享文案 → 识别平台 → 解析出标题 / 封面 / 媒体直链 → 带进度下载到本地。</p></blockquote>
<p>实现思路参考开源项目 <a href="https://github.com/joeseesun/qiaomu-download" target="_blank" rel="noreferrer">qiaomu-download</a> (基于 yt-dlp 的通用视频下载 Skill)。本工具不依赖 yt-dlp, 而是直接读取各平台分享页里内嵌的播放数据, 因此:</p>
<ul>
<li><p>不需要安装额外组件, 双击即用</p></li>
<li><p>只覆盖<b>公开可访问</b>的内容</p></li>
<li><p>平台改版后可能解析失败, 会给出明确提示与替代方案</p></li>
</ul>

<h2>支持的平台</h2>
<ul>
<li><p><b>哔哩哔哩</b> (含 b23.tv 短链): 读取页面里的 __playinfo__, 给出 DASH 视频轨 / 音轨与合流 mp4</p></li>
<li><p><b>抖音</b> (含 v.douyin.com 短链)、<b>TikTok</b>、<b>小红书</b>: 读取分享页内嵌 JSON 里的播放地址</p></li>
<li><p><b>微博</b>: 提取页面里的 mp4 直链</p></li>
<li><p><b>X / Twitter</b>: 走公开的 syndication 接口, 拿到 mp4 / HLS 变体</p></li>
<li><p><b>Vimeo</b>、<b>YouTube</b>: 读取页面播放配置 (YouTube 多数地址需要签名, 会提示改用 yt-dlp)</p></li>
<li><p><b>通用网页</b>: 兜底识别 og:video / &lt;video src&gt; / JSON-LD contentUrl</p></li>
</ul>
<blockquote><p>暂不支持快手、微信视频号 (平台接口不公开)。这类内容建议使用 yt-dlp。</p></blockquote>

<h2>下载与合并</h2>
<ul>
<li><p>「下载」会弹出系统保存对话框, 你可以自己选目录与文件名, 下载过程中显示进度并可随时取消</p></li>
<li><p>统一下载失败时只会删除本次产生的半成品文件, 不会动你已有的文件</p></li>
<li><p>B 站高清画质是<b>音视频分离</b>的 DASH 流: 分别下载视频轨与音轨后, 用 ffmpeg 合并 (界面里会标注「DASH 视频轨 / 音轨」)</p></li>
</ul>
<pre>ffmpeg -i video.m4s -i audio.m4a -c copy out.mp4</pre>

<h2>边界与隐私</h2>
<ul>
<li><p>请求由应用自身发起 (桌面版绕过浏览器 CORS 限制), <b>不带任何 Cookie / 登录态</b></p></li>
<li><p>不绕过登录、付费、会员权限、DRM 与地区限制</p></li>
<li><p>请只下载你有权保存的内容, 并遵守目标平台的条款与当地法律</p></li>
</ul>
`;

const introTw = `
<h2>這個工具做什麼</h2>
<blockquote><p>把影片分享連結變成「可直接儲存的直鏈」: 貼上分享文案 → 識別平台 → 解析出標題 / 封面 / 媒體直鏈 → 帶進度下載到本機。</p></blockquote>
<p>實作思路參考開源專案 <a href="https://github.com/joeseesun/qiaomu-download" target="_blank" rel="noreferrer">qiaomu-download</a> (以 yt-dlp 為基礎的通用影片下載 Skill)。本工具不依賴 yt-dlp, 而是直接讀取各平台分享頁裡內嵌的播放資料, 因此:</p>
<ul>
<li><p>不需要安裝額外元件, 開箱即用</p></li>
<li><p>只涵蓋<b>公開可存取</b>的內容</p></li>
<li><p>平台改版後可能解析失敗, 會給出明確提示與替代方案</p></li>
</ul>

<h2>支援的平台</h2>
<ul>
<li><p><b>嗶哩嗶哩</b> (含 b23.tv 短鏈): 讀取頁面裡的 __playinfo__, 提供 DASH 視訊軌 / 音訊軌與合流 mp4</p></li>
<li><p><b>抖音</b> (含 v.douyin.com 短鏈)、<b>TikTok</b>、<b>小紅書</b>: 讀取分享頁內嵌 JSON 裡的播放位址</p></li>
<li><p><b>微博</b>: 提取頁面裡的 mp4 直鏈</p></li>
<li><p><b>X / Twitter</b>: 走公開的 syndication 介面, 取得 mp4 / HLS 變體</p></li>
<li><p><b>Vimeo</b>、<b>YouTube</b>: 讀取頁面播放設定 (YouTube 多數位址需要簽章, 會提示改用 yt-dlp)</p></li>
<li><p><b>一般網頁</b>: 兜底識別 og:video / &lt;video src&gt; / JSON-LD contentUrl</p></li>
</ul>
<blockquote><p>暫不支援快手、微信影音號 (平台介面不公開)。這類內容建議使用 yt-dlp。</p></blockquote>

<h2>下載與合併</h2>
<ul>
<li><p>「下載」會跳出系統儲存對話框, 可自行選擇目錄與檔名, 下載過程顯示進度並可隨時取消</p></li>
<li><p>下載失敗時只會刪除本次產生的半成品檔案, 不會動到既有檔案</p></li>
<li><p>B 站高畫質是<b>影音分離</b>的 DASH 流: 分別下載視訊軌與音訊軌後, 用 ffmpeg 合併 (介面會標註「DASH 視訊軌 / 音訊軌」)</p></li>
</ul>
<pre>ffmpeg -i video.m4s -i audio.m4a -c copy out.mp4</pre>

<h2>邊界與隱私</h2>
<ul>
<li><p>請求由應用程式自行發起 (桌面版繞過瀏覽器 CORS 限制), <b>不帶任何 Cookie / 登入態</b></p></li>
<li><p>不繞過登入、付費、會員權限、DRM 與地區限制</p></li>
<li><p>請只下載你有權儲存的內容, 並遵守目標平台的條款與當地法律</p></li>
</ul>
`;

const introEn = `
<h2>What this tool does</h2>
<blockquote><p>Turns a video share link into directly saveable media URLs: paste the share text → the platform is detected → title, cover and media URLs are parsed → download to disk with live progress.</p></blockquote>
<p>The approach follows the open-source project <a href="https://github.com/joeseesun/qiaomu-download" target="_blank" rel="noreferrer">qiaomu-download</a> (a yt-dlp based universal video downloader skill). This tool does not depend on yt-dlp: it reads the playback data embedded in each platform's share page, so:</p>
<ul>
<li><p>no extra components to install — it works out of the box</p></li>
<li><p>only <b>publicly accessible</b> content is covered</p></li>
<li><p>when a platform changes its markup parsing may fail, and a clear hint plus an alternative is shown</p></li>
</ul>

<h2>Supported platforms</h2>
<ul>
<li><p><b>Bilibili</b> (including b23.tv short links): reads __playinfo__ from the page and lists DASH video/audio tracks plus muxed mp4</p></li>
<li><p><b>Douyin</b> (including v.douyin.com short links), <b>TikTok</b>, <b>Xiaohongshu</b>: reads the playback address from the JSON embedded in the share page</p></li>
<li><p><b>Weibo</b>: extracts the mp4 URL from the page</p></li>
<li><p><b>X / Twitter</b>: uses the public syndication endpoint to get mp4 / HLS variants</p></li>
<li><p><b>Vimeo</b>, <b>YouTube</b>: reads the player config from the page (most YouTube URLs need signature deciphering, so yt-dlp is suggested)</p></li>
<li><p><b>Generic pages</b>: falls back to og:video / &lt;video src&gt; / JSON-LD contentUrl</p></li>
</ul>
<blockquote><p>Kuaishou and WeChat Channels are not supported (their APIs are not public). Use yt-dlp for those.</p></blockquote>

<h2>Downloading and merging</h2>
<ul>
<li><p>"Download" opens the system save dialog so you can choose the directory and filename; progress is shown and the task can be cancelled at any time</p></li>
<li><p>On failure only the partially written file of this run is removed — your existing files are never touched</p></li>
<li><p>Bilibili HD is delivered as <b>separate</b> DASH video/audio tracks: download both and merge with ffmpeg (the UI labels them "DASH video track / DASH audio track")</p></li>
</ul>
<pre>ffmpeg -i video.m4s -i audio.m4a -c copy out.mp4</pre>

<h2>Boundaries and privacy</h2>
<ul>
<li><p>Requests are made by the app itself (the desktop build bypasses the browser CORS limit) and carry <b>no cookies or login state</b></p></li>
<li><p>Logins, paywalls, membership permissions, DRM and region locks are never bypassed</p></li>
<li><p>Only download content you are allowed to keep, and respect the target platform's terms and your local laws</p></li>
</ul>
`;

const VideoExtractIntro = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? introTw : locale === 'en' ? introEn : introZh;
  return <div dangerouslySetInnerHTML={ { __html: html } } />;
};

export default VideoExtractIntro;
