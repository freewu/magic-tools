// nginx 配置 工具静态数据
import type { NginxConfig } from './lib';

/** 站点类型 */
export const NGINX_MODES: { value: string; label: string; hint: string }[] = [
  { value: 'static', label: '静态网站', hint: '纯静态 HTML / 资源, try_files 找不到返回 404' },
  { value: 'spa', label: 'SPA 单页应用', hint: 'Vue / React 等前端路由, 找不到的路径回退到 index.html' },
  { value: 'php', label: 'PHP 网站', hint: 'WordPress / 宝塔等, 通过 fastcgi_pass 转发到 PHP-FPM' },
  { value: 'proxy', label: '反向代理', hint: '转发到后端服务 (Node / Java / Go / 容器), 支持 WebSocket' },
];

/** 缓存过期时间 */
export const EXPIRES_OPTIONS = [ '1h', '1d', '7d', '30d', '180d', '1y' ];

/** gzip 压缩级别 */
export const GZIP_LEVELS = [ '1', '2', '3', '4', '5', '6', '7', '8', '9' ];

/** IP 访问控制模式 */
export const IP_MODES: { value: string; label: string }[] = [
  { value: 'off', label: '不限制' },
  { value: 'allow', label: '白名单 (只允许列表内 IP)' },
  { value: 'deny', label: '黑名单 (拒绝列表内 IP)' },
];

/** 内置场景模板 */
export interface NginxPreset {
  name: string;
  desc: string;
  config: Partial<NginxConfig>;
}

export const NGINX_PRESETS: NginxPreset[] = [
  {
    name: '静态网站 (通用优化)',
    desc: '静态目录 + gzip + 静态资源长缓存 + 安全响应头',
    config: {
      mode: 'static', https: false, gzip: true, gzipTypes: true, expires: '30d',
      cacheImmutable: true, securityHeaders: true, serverTokensOff: true,
      denyHidden: true, denyBackup: true, sendfile: true, openFileCache: true,
      keepaliveTimeout: '65', clientMaxBody: '20m',
    },
  },
  {
    name: 'SPA 单页应用 (前端路由)',
    desc: 'try_files 回退到 index.html, 接口反向代理到后端',
    config: {
      mode: 'spa', root: '/var/www/spa', index: 'index.html', expires: '30d',
      cacheImmutable: true, gzip: true, gzipTypes: true, clientMaxBody: '50m',
    },
  },
  {
    name: 'PHP 建站 (WordPress)',
    desc: 'PHP-FPM + fastcgi 缓存 + 上传体积放大',
    config: {
      mode: 'php', root: '/var/www/wordpress', index: 'index.php index.html',
      fastcgi: 'unix:/run/php/php-fpm.sock', phpRoot: '/var/www/wordpress',
      fastcgiCache: true, fastcgiCacheTime: '15m', clientMaxBody: '64m',
      denyHidden: true, denyBackup: true,
    },
  },
  {
    name: '反向代理 (含 WebSocket)',
    desc: 'upstream + keepalive + 真实 IP 头 + WebSocket 升级',
    config: {
      mode: 'proxy', upstream: 'http://127.0.0.1:8080', keepHost: true,
      websocket: true, realIp: true, upstreamKeepalive: true,
      proxyTimeout: '120s', clientMaxBody: '100m', proxyCache: false,
    },
  },
  {
    name: 'HTTPS 全站优化',
    desc: '80 跳转 443 + TLS1.2/1.3 + HSTS + HTTP/2 + 会话缓存',
    config: {
      https: true, redirectHttps: true, http2: true, hsts: true,
      hstsMaxAge: '31536000', securityHeaders: true, gzip: true,
    },
  },
  {
    name: '图片站防盗链',
    desc: '图片 / 视频 valid_referers 校验 + 长缓存',
    config: {
      mode: 'static', antiLeech: true, antiLeechDomains: 'example.com www.example.com',
      expires: '30d', cacheImmutable: true, gzipStatic: true,
    },
  },
  {
    name: '接口转发 + CORS',
    desc: '反向代理 API, 允许跨域与 OPTIONS 预检, 只放行常用方法',
    config: {
      mode: 'proxy', upstream: 'http://127.0.0.1:3000', realIp: true, keepHost: true,
      cors: true, corsOrigin: '*', limitMethods: true, proxyCache: false,
    },
  },
];

/** 默认配置 */
export const DEFAULT_NGINX_CONFIG: NginxConfig = {
  siteName: 'example',
  serverName: 'example.com www.example.com',
  listenPort: '80',
  https: false,
  certFile: '/etc/nginx/ssl/example.com.crt',
  keyFile: '/etc/nginx/ssl/example.com.key',
  redirectHttps: true,
  http2: true,
  root: '/var/www/example',
  index: 'index.html index.htm',
  charset: 'utf-8',
  accessLog: true,
  errorLog: true,
  mode: 'static',
  upstream: 'http://127.0.0.1:8080',
  keepHost: true,
  websocket: false,
  realIp: true,
  proxyTimeout: '60s',
  upstreamKeepalive: true,
  proxyCache: false,
  proxyCacheTime: '10m',
  fastcgi: 'unix:/run/php/php-fpm.sock',
  phpRoot: '/var/www/example',
  gzip: true,
  gzipLevel: '5',
  gzipTypes: true,
  expires: '30d',
  cacheImmutable: true,
  sendfile: true,
  keepaliveTimeout: '65',
  clientMaxBody: '20m',
  openFileCache: true,
  gzipStatic: false,
  fastcgiCache: false,
  fastcgiCacheTime: '15m',
  serverTokensOff: true,
  denyHidden: true,
  denyBackup: true,
  hsts: false,
  hstsMaxAge: '31536000',
  securityHeaders: true,
  antiLeech: false,
  antiLeechDomains: 'example.com',
  cors: false,
  corsOrigin: 'https://example.com',
  limitMethods: false,
  basicAuth: false,
  authFile: '/etc/nginx/.htpasswd',
  ipMode: 'off',
  ipList: '',
  limitReq: false,
  limitRate: '10r/s',
  limitBurst: '20',
  limitNoDelay: true,
  limitConn: false,
  limitConnNum: '20',
  redirectTo: '',
  errorPage: '/404.html',
  denyUa: false,
};

/** 结果区默认高度 */
export const RESULT_HEIGHT = 'calc(100vh - 360px)';
