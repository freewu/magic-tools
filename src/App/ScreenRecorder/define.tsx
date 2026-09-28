const AppName = '屏幕录制';
const Icon = '';
const Type = 'misc';
// 屏幕录制依赖浏览器 getDisplayMedia / MediaRecorder, 桌面版内嵌 WebView 不支持 -> 仅 Web 版可用
const Web = true;

export {
  AppName,
  Icon,
  Type,
  Web,
}
