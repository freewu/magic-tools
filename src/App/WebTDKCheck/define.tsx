const AppName = '网页TDK信息检测';
const Icon = '';
const Type = 'webmaster';
// 仅桌面版可用: 应用中心展示「仅桌面版」标识, 浏览器演示版下禁用检测按钮
// (浏览器受 CORS 限制, 绝大多数站点无法抓取; 桌面版由 Rust 侧抓取无此限制)
const Desktop = true;

export {
  AppName,
  Icon,
  Type,
  Desktop,
}
