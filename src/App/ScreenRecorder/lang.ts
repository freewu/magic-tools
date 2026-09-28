// ScreenRecorder 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '螢幕錄製' },
  en: { appName: 'Screen recorder' },
} as const;

// 界面文案词条 (zh 短语即 key; 无命中回退 zh 原文)
const uilangRows: Record<string, [string, string]> = {
  // 操作
  '开始录制': ['開始錄製', 'Start recording'],
  '暂停': ['暫停', 'Pause'],
  '继续': ['繼續', 'Resume'],
  '停止': ['停止', 'Stop'],
  '重新录制': ['重新錄製', 'Record again'],
  '下载视频': ['下載影片', 'Download video'],
  '保存为默认设置': ['儲存為預設設定', 'Save as defaults'],
  '已保存为默认设置': ['已儲存為預設設定', 'Saved as defaults'],
  '已保存 {file}': ['已儲存 {file}', 'Saved {file}'],
  '保存失败: {msg}': ['儲存失敗: {msg}', 'Save failed: {msg}'],
  '键盘: 空格 开始 / 停止': ['鍵盤: 空白鍵 開始 / 停止', 'Keys: Space start/stop'],

  // 参数
  '帧率': ['影格率', 'Frame rate'],
  '画质 (码率)': ['畫質 (位元率)', 'Quality (bitrate)'],
  '声音': ['聲音', 'Audio'],
  '分辨率': ['解析度', 'Resolution'],
  '2 Mbps · 省空间': ['2 Mbps · 省空間', '2 Mbps · small files'],
  '4 Mbps · 均衡': ['4 Mbps · 均衡', '4 Mbps · balanced'],
  '8 Mbps · 清晰': ['8 Mbps · 清晰', '8 Mbps · sharp'],
  '16 Mbps · 极清 (文件大)': ['16 Mbps · 極清 (檔案大)', '16 Mbps · very sharp (large files)'],
  '不录声音': ['不錄聲音', 'No audio'],
  '系统声音 (屏幕 / 标签页)': ['系統聲音 (螢幕 / 分頁)', 'System audio (screen / tab)'],
  '系统声音 + 麦克风': ['系統聲音 + 麥克風', 'System audio + microphone'],
  '原始分辨率': ['原始解析度', 'Source resolution'],
  '最高 1080p': ['最高 1080p', 'Up to 1080p'],
  '最高 720p': ['最高 720p', 'Up to 720p'],
  '当前编码格式: {mime}': ['目前編碼格式: {mime}', 'Encoding: {mime}'],
  '浏览器默认格式': ['瀏覽器預設格式', 'Browser default'],
  '预计约 {s}/分钟': ['預計約 {s}/分鐘', 'About {s} per minute'],

  // 状态
  '录制中': ['錄製中', 'Recording'],
  '已暂停': ['已暫停', 'Paused'],
  '已写入 {s}': ['已寫入 {s}', 'Written {s}'],
  '含声音': ['含聲音', 'with audio'],
  '无声音': ['無聲音', 'silent'],
  '时长 {d} · 大小 {s}': ['時長 {d} · 大小 {s}', 'Duration {d} · size {s}'],
  '点「开始录制」后这里会显示录制状态与结果': ['點「開始錄製」後這裡會顯示錄製狀態與結果', 'Recording status and the result appear here'],
  '录制结果': ['錄製結果', 'Result'],

  // 提示 / 异常
  '屏幕录制是浏览器专享功能': ['螢幕錄製是瀏覽器專享功能', 'Screen recording is browser-only'],
  '桌面版内嵌的 WebView 没有系统共享选择器, 请改用系统自带录屏工具 (Win+G / QuickTime / GNOME 截屏录制), 或打开 Web 版使用本工具': [
    '桌面版內嵌的 WebView 沒有系統共享選擇器, 請改用系統自帶錄屏工具 (Win+G / QuickTime / GNOME 截圖錄影), 或打開 Web 版使用本工具',
    'The desktop app’s embedded WebView has no system share picker — use the built-in recorder of your OS (Win+G / QuickTime / GNOME) or open the Web version',
  ],
  '打开 Web 版': ['開啟 Web 版', 'Open Web version'],
  '当前浏览器不支持屏幕录制': ['目前瀏覽器不支援螢幕錄製', 'This browser cannot record the screen'],
  '需要同时支持屏幕采集 (getDisplayMedia) 与 MediaRecorder; 建议使用最新版 Chrome / Edge / Firefox。若页面嵌在 iframe 里, 还需要 iframe 带 allow="display-capture" 属性': [
    '需要同時支援螢幕擷取 (getDisplayMedia) 與 MediaRecorder; 建議使用最新版 Chrome / Edge / Firefox。若頁面嵌在 iframe 裡, 還需要 iframe 帶 allow="display-capture" 屬性',
    'Both getDisplayMedia and MediaRecorder are required — use a recent Chrome / Edge / Firefox. Inside an iframe the frame also needs allow="display-capture"',
  ],
  '点击「开始录制」后浏览器会弹出共享选择器: 可选整个屏幕 / 应用窗口 / 浏览器标签页; 想录到声音, 请把「声音」设为系统声音并在选择器里勾选「分享标签页音频」或「分享系统音频」': [
    '點擊「開始錄製」後瀏覽器會彈出共享選擇器: 可選整個螢幕 / 應用程式視窗 / 瀏覽器分頁; 想錄到聲音, 請把「聲音」設為系統聲音並在選擇器裡勾選「分享分頁音訊」或「分享系統音訊」',
    'The browser shows a share picker (whole screen / window / tab). To capture sound, set Audio to system audio and tick “Share tab audio” / “Share system audio” in that picker',
  ],
  '录制中浏览器会常驻「正在共享」提示条, 在它上面点「停止共享」也能结束录制 (结果会自动出现在下方)': [
    '錄製中瀏覽器會常駐「正在共用」提示列, 在它上面點「停止共用」也能結束錄製 (結果會自動出現在下方)',
    'While recording, the browser keeps a “sharing” bar — stopping the share there also ends the recording (the result appears below)',
  ],
  '所有处理都在本机完成: 屏幕画面、声音都不会上传到任何服务器': [
    '所有處理都在本機完成: 螢幕畫面、聲音都不會上傳到任何伺服器',
    'Everything happens locally — neither the picture nor the sound leaves your machine',
  ],
  '开始录制失败: {msg}': ['開始錄製失敗: {msg}', 'Could not start recording: {msg}'],
  '没有录到内容, 请确认共享时没有立即停止': ['沒有錄到內容, 請確認共用時沒有立即停止', 'Nothing was captured — make sure the share was not stopped immediately'],
  '未获得麦克风权限, 本次只录制系统声音': ['未取得麥克風權限, 本次只錄製系統聲音', 'Microphone permission denied — recording system audio only'],
  '录制过程中出现错误, 已停止': ['錄製過程中出現錯誤, 已停止', 'A recording error occurred — stopped'],

  // 说明区标题
  ' 屏幕录制说明 ': [' 螢幕錄製說明 ', ' About screen recording '],
};

// 取词: 无命中回退 zh 原文
export const u = (locale: string, zh: string): string => {
  const hit = uilangRows[zh];
  if (!hit) return zh;
  return locale === 'zh-TW' ? hit[0] : locale === 'en' ? hit[1] : zh;
};
export const uT = (locale: string, zhTpl: string, vars?: Record<string, string | number>): string => {
  let out = u(locale, zhTpl);
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
  return out;
};
