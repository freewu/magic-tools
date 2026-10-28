const AppName = '视频提取';
const Icon = 'VideoCamera';
const Type = 'webmaster';
// 仅桌面版可用: 应用中心展示「仅桌面版」标识, 浏览器演示版下禁用提取按钮
// (浏览器受 CORS 限制, 无法请求各平台页面与 CDN; 桌面版由 Rust 侧抓取并支持带进度下载)
const Desktop = true;

export {
  AppName,
  Icon,
  Type,
  Desktop,
}
