// WebSocketDebug 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "WebSocket 偵錯" },
  en: { appName: "WebSocket Debugger" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const rows: Record<string, [string, string]> = {
  '连接': ['連線', 'Connect'],
  '断开': ['斷開', 'Disconnect'],
  '发送': ['傳送', 'Send'],
  '发送内容': ['傳送內容', 'Message'],
  '消息内容 (Ctrl + Enter 发送)': ['訊息內容 (Ctrl + Enter 傳送)', 'Message (Ctrl + Enter to send)'],
  '日志': ['日誌', 'Log'],
  '清空日志': ['清空日誌', 'Clear log'],
  '复制日志': ['複製日誌', 'Copy log'],
  '下载日志': ['下載日誌', 'Download log'],
  '自动滚动': ['自動捲動', 'Auto scroll'],
  'JSON 美化': ['JSON 美化', 'Pretty JSON'],
  '心跳间隔 (秒)': ['心跳間隔 (秒)', 'Heartbeat interval (s)'],
  '心跳内容': ['心跳內容', 'Heartbeat payload'],
  '0 = 关闭心跳': ['0 = 關閉心跳', '0 = disabled'],
  '未连接': ['未連線', 'Idle'],
  '连接中…': ['連線中…', 'Connecting…'],
  '已连接': ['已連線', 'Open'],
  '已断开': ['已斷開', 'Closed'],
  '请先连接': ['請先連線', 'Connect first'],
  '连接已建立': ['連線已建立', 'Connection opened'],
  '连接出错': ['連線錯誤', 'Connection error'],
  '当前环境不支持 WebSocket': ['目前環境不支援 WebSocket', 'WebSocket is not supported here'],
  '正在连接 {url} …': ['正在連線 {url} …', 'Connecting to {url} …'],
  '连接已关闭 (code {code})': ['連線已關閉 (code {code})', 'Connection closed (code {code})'],
  '发送失败: {m}': ['傳送失敗: {m}', 'Send failed: {m}'],
  '地址不能为空': ['位址不能為空', 'The URL cannot be empty'],
  '地址需以 ws:// 或 wss:// 开头 (http/https 会自动转换)': ['位址需以 ws:// 或 wss:// 開頭 (http/https 會自動轉換)', 'The URL must start with ws:// or wss:// (http/https is converted automatically)'],
  '地址格式不正确': ['位址格式不正確', 'Invalid URL'],
  '发送 {n} / 接收 {m} / 合计 {b} 字节': ['傳送 {n} / 接收 {m} / 合計 {b} 位元組', '{n} sent / {m} received / {b} bytes'],
  '已复制到剪贴板': ['已複製到剪貼簿', 'Copied to clipboard'],
  '日志为空': ['日誌為空', 'The log is empty'],
  '已保存 {n}': ['已儲存 {n}', 'Saved {n}'],
  '保存 {n}': ['儲存 {n}', 'Save {n}'],
  'WebSocket 调试说明': ['WebSocket 偵錯說明', 'About the WebSocket debugger'],
};

// 取词: 无命中回退 zh 原文
export const ws = (locale: string, zh: string): string => {
  const e = rows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const wsT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = ws(locale, zh);
  if (v) for (const [k, val] of Object.entries(v)) s = s.split('{'+k+'}').join(String(val));
  return s;
};
