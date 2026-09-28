import { useLocale } from '../../hook/locale-context';

const zh = `<h2>这个工具做什么</h2>
<blockquote><p>把<b>二维码图片</b>拖进来 (或截图后直接粘贴), 自动读出里面的内容 —— 网址、WiFi 配网、名片、动态口令等还会被拆成<b>结构化字段</b>显示, 一眼看清。解析用的是纯 JS 的 <code>jsQR</code>, <b>全在本地完成, 图片不会上传</b>。</p></blockquote>

<h2>使用步骤</h2>
<ul>
<li><p>点「<b>选择二维码图片</b>」, 或把图片<b>拖拽</b>到虚线框里, 也可以对着截图按 <code>Ctrl / ⌘ + V</code> 直接粘贴</p></li>
<li><p>右侧立刻给出<b>解析结果</b>: 内容类型、正文 (可复制 / 保存为 TXT) , 命中定位点时会<b>在图上框出二维码位置</b></p></li>
<li><p>网址 / 邮件地址会多出「<b>打开链接</b>」按钮; WiFi、名片、OTP 等会列出<b>结构化字段</b> (SSID、密码、姓名、电话、密钥…)</p></li>
<li><p>「<b>编码信息</b>」显示二维码版本、数据段类型与长度、原始字节 HEX, 便于排查乱码问题</p></li>
<li><p>解析过的内容进入下方<b>历史记录</b>, 点一下即可重新查看; 条数上限可在「设置中心 → 其它 → 二维码解析」里改</p></li>
</ul>

<h2>参数怎么调</h2>
<ul>
<li><p><b>反色策略</b>: 默认「自动尝试反色」能同时处理普通二维码与<b>深底浅码</b> (暗色主题截图) ; 若一张图里混有两种码, 可指定「只按原色 / 只按反色」提高判定确定性</p></li>
<li><p><b>图片最大边长</b>: 超过该边长会<b>等比缩小</b>后再解析 (默认 1600 px) 。手机原图动辄 4000 px, 缩小既快又常常更准; 二维码极小时可选「不缩放」保留原始像素</p></li>
</ul>

<h2>能识别的内容</h2>
<ul>
<li><p><b>网址</b> (http / https / ftp) 、<b>纯文本</b>、<b>邮件</b> (mailto) 、<b>电话</b> (tel) 、<b>短信</b> (SMSTO) 、<b>坐标</b> (geo:)</p></li>
<li><p><b>WiFi 配网</b>: <code>WIFI:T:WPA;S:SSID;P:密码;;</code> —— 会拆出加密方式、SSID、密码、是否隐藏网络</p></li>
<li><p><b>名片</b>: vCard (BEGIN:VCARD) 与 MECARD, 摘出姓名、组织、职位、电话、邮箱、地址等</p></li>
<li><p><b>动态口令</b>: <code>otpauth://totp/...</code> 会列出账号、签发方与密钥 (仅展示, 本工具不生成验证码)</p></li>
</ul>

<h2>常见问题</h2>
<ul>
<li><p><b>提示「未识别到二维码」?</b> 二维码太小 / 太糊 / 被裁掉一角都会失败: 重新截图时四周多留白边, 或先用图片工具放大, 再换「反色策略」重试</p></li>
<li><p><b>内容乱码?</b> 二维码里可能存的是 GBK 等非 UTF-8 字节, 可参考「编码信息 → 原始字节」用本站的编码转换工具手工解码</p></li>
<li><p><b>能扫屏幕或摄像头里的码吗?</b> 本工具只解析<b>图片文件</b>; 需要实时扫码请用手机相机或浏览器扫码扩展</p></li>
<li><p><b>会上传图片吗?</b> 不会。整个流程 (解码像素 → 提取内容) 都在浏览器内存里完成, 断网也能用</p></li>
</ul>`;

const tw = `<h2>這個工具做什麼</h2>
<blockquote><p>把<b>二維碼圖片</b>拖進來 (或截圖後直接貼上), 自動讀出裡面的內容 —— 網址、WiFi 配網、名片、動態密碼等還會被拆成<b>結構化欄位</b>顯示, 一眼看清。解析用的是純 JS 的 <code>jsQR</code>, <b>全在本機完成, 圖片不會上傳</b>。</p></blockquote>

<h2>使用步驟</h2>
<ul>
<li><p>點「<b>選擇二維碼圖片</b>」, 或把圖片<b>拖曳</b>到虛線框裡, 也可以對著截圖按 <code>Ctrl / ⌘ + V</code> 直接貼上</p></li>
<li><p>右側立刻給出<b>解析結果</b>: 內容類型、內文 (可複製 / 儲存為 TXT) , 命中定位點時會<b>在圖上框出二維碼位置</b></p></li>
<li><p>網址 / 郵件地址會多出「<b>開啟連結</b>」按鈕; WiFi、名片、OTP 等會列出<b>結構化欄位</b> (SSID、密碼、姓名、電話、密鑰…)</p></li>
<li><p>「<b>編碼資訊</b>」顯示二維碼版本、資料段類型與長度、原始位元組 HEX, 便於排查亂碼問題</p></li>
<li><p>解析過的內容進入下方<b>歷史記錄</b>, 點一下即可重新查看; 條數上限可在「設定中心 → 其他 → 二維碼解析」裡改</p></li>
</ul>

<h2>參數怎麼調</h2>
<ul>
<li><p><b>反色策略</b>: 預設「自動嘗試反色」能同時處理一般二維碼與<b>深底淺碼</b> (暗色主題截圖) ; 若一張圖裡混有兩種碼, 可指定「只按原色 / 只按反色」提高判定確定性</p></li>
<li><p><b>圖片最大邊長</b>: 超過該邊長會<b>等比縮小</b>後再解析 (預設 1600 px) 。手機原圖動輒 4000 px, 縮小既快又常常更準; 二維碼極小時可選「不縮放」保留原始像素</p></li>
</ul>

<h2>能識別的內容</h2>
<ul>
<li><p><b>網址</b> (http / https / ftp) 、<b>純文字</b>、<b>郵件</b> (mailto) 、<b>電話</b> (tel) 、<b>簡訊</b> (SMSTO) 、<b>座標</b> (geo:)</p></li>
<li><p><b>WiFi 配網</b>: <code>WIFI:T:WPA;S:SSID;P:密碼;;</code> —— 會拆出加密方式、SSID、密碼、是否隱藏網路</p></li>
<li><p><b>名片</b>: vCard (BEGIN:VCARD) 與 MECARD, 摘出姓名、組織、職稱、電話、Email、地址等</p></li>
<li><p><b>動態密碼</b>: <code>otpauth://totp/...</code> 會列出帳號、簽發方與密鑰 (僅展示, 本工具不產生驗證碼)</p></li>
</ul>

<h2>常見問題</h2>
<ul>
<li><p><b>提示「未識別到二維碼」?</b> 二維碼太小 / 太糊 / 被裁掉一角都會失敗: 重新截圖時四周多留白邊, 或先用圖片工具放大, 再換「反色策略」重試</p></li>
<li><p><b>內容亂碼?</b> 二維碼裡可能存的是 GBK 等非 UTF-8 位元組, 可參考「編碼資訊 → 原始位元組」用本站的編碼轉換工具手工解碼</p></li>
<li><p><b>能掃螢幕或鏡頭裡的碼嗎?</b> 本工具只解析<b>圖片檔案</b>; 需要即時掃碼請用手機相機或瀏覽器掃碼擴充功能</p></li>
<li><p><b>會上傳圖片嗎?</b> 不會。整個流程 (解碼像素 → 提取內容) 都在瀏覽器記憶體裡完成, 斷網也能用</p></li>
</ul>`;

const en = `<h2>What this tool does</h2>
<blockquote><p>Drop a <b>QR code image</b> in (or paste a screenshot) and it reads the payload back out — URLs, WiFi credentials, contact cards and OTP secrets are even split into <b>structured fields</b>. Decoding uses the pure-JS <code>jsQR</code> library and <b>never leaves your machine</b>.</p></blockquote>

<h2>How to use</h2>
<ul>
<li><p>Click <b>Choose a QR image</b>, drag an image onto the dashed box, or paste a screenshot with <code>Ctrl / ⌘ + V</code></p></li>
<li><p>The result panel shows the content type and the decoded text (copy it or save it as TXT); when the locator succeeds the code is <b>outlined in the preview</b></p></li>
<li><p>URLs and mail addresses get an <b>Open link</b> button; WiFi, contact cards and OTP codes are listed as <b>structured fields</b> (SSID, password, name, phone, secret…)</p></li>
<li><p><b>Encoding info</b> lists the QR version, segment types/lengths and the raw bytes in HEX — handy when the text looks garbled</p></li>
<li><p>Every decode lands in the <b>history</b> below; click an entry to view it again. The history size is configurable in <i>Settings → Misc → QR code decoder</i></p></li>
</ul>

<h2>Tuning the parameters</h2>
<ul>
<li><p><b>Inversion</b>: the default “Try both” handles normal codes and <b>light-on-dark</b> codes (dark-theme screenshots). Use “Non-inverted only” / “Inverted only” when an image mixes both kinds and you want a deterministic match</p></li>
<li><p><b>Max image edge</b>: images larger than this are scaled down before decoding (default 1600 px). Phone photos are often 4000 px wide — downscaling is faster and frequently more accurate; pick “No scaling” for very small codes</p></li>
</ul>

<h2>Recognised payloads</h2>
<ul>
<li><p><b>URLs</b> (http / https / ftp), <b>plain text</b>, <b>email</b> (mailto), <b>phone</b> (tel), <b>SMS</b> (SMSTO) and <b>geo</b> coordinates</p></li>
<li><p><b>WiFi credentials</b>: <code>WIFI:T:WPA;S:SSID;P:password;;</code> — security type, SSID, password and the hidden-network flag are extracted</p></li>
<li><p><b>Contact cards</b>: vCard (BEGIN:VCARD) and MECARD — name, organisation, title, phone, email, address…</p></li>
<li><p><b>One-time passwords</b>: <code>otpauth://totp/...</code> — account, issuer and secret are shown (display only, no codes are generated)</p></li>
</ul>

<h2>Troubleshooting</h2>
<ul>
<li><p><b>“No QR code found”?</b> Tiny, blurry or cropped codes fail: leave a white margin when capturing, enlarge small codes first with an image tool, and retry with a different inversion mode</p></li>
<li><p><b>Garbled text?</b> The code may hold non-UTF-8 bytes (GBK, Big5…). Check <b>Encoding info → raw bytes</b> and decode them with the encoding tools on this site</p></li>
<li><p><b>Can it scan a live screen or camera?</b> This tool only decodes <b>image files</b>; use your phone camera or a browser scanning extension for live scanning</p></li>
<li><p><b>Are images uploaded?</b> No. Pixel decoding and payload extraction happen entirely in browser memory, so it even works offline</p></li>
</ul>`;

const QrDecodeIntro: React.FC = () => {
  const { locale } = useLocale();
  const html = locale === 'zh-TW' ? tw : locale === 'en' ? en : zh;
  return <div className="intro" dangerouslySetInnerHTML={ { __html: html } } />;
};

export default QrDecodeIntro;
