// nginx 站点配置: 由表单生成可直接放入 vhost 目录的 <site>.conf
// 本模块只负责类型 / 默认值 / 校验 (生成逻辑见 build.ts)

export type NginxMode = 'static' | 'spa' | 'php' | 'proxy';
export type NginxIpMode = 'off' | 'allow' | 'deny';

export interface NginxConfig {
  siteName: string;          // 站点标识 (用于文件名 / upstream / 缓存 zone 名)
  serverName: string;        // 域名 (空格分隔多个)
  listenPort: string;        // 监听端口
  https: boolean;            // 是否开启 HTTPS
  certFile: string;          // 证书路径
  keyFile: string;           // 私钥路径
  redirectHttps: boolean;    // 80 跳转 443
  http2: boolean;            // 开启 HTTP/2
  root: string;              // 网站根目录
  index: string;             // 默认首页
  charset: string;           // 字符集
  accessLog: boolean;        // 记录访问日志
  errorLog: boolean;         // 记录错误日志
  mode: NginxMode;           // 站点类型

  // 反向代理
  upstream: string;          // 后端地址 (每行一个)
  keepHost: boolean;         // 透传 Host 头
  websocket: boolean;        // WebSocket 支持
  realIp: boolean;           // 透传真实 IP 头
  proxyTimeout: string;      // 代理超时
  upstreamKeepalive: boolean;// upstream keepalive 连接池
  proxyCache: boolean;       // 开启代理缓存
  proxyCacheTime: string;    // 代理缓存时间

  // PHP
  fastcgi: string;           // FastCGI 地址 (unix: 或 host:port)
  phpRoot: string;           // SCRIPT_FILENAME 前缀

  // 性能优化
  gzip: boolean;
  gzipLevel: string;
  gzipTypes: boolean;        // 追加常见压缩类型
  expires: string;           // 静态资源缓存时间 (空 = 不设置)
  cacheImmutable: boolean;   // Cache-Control immutable
  sendfile: boolean;         // sendfile / tcp_nopush
  keepaliveTimeout: string;  // 长连接超时
  clientMaxBody: string;     // 上传体积上限
  openFileCache: boolean;    // 打开文件缓存
  gzipStatic: boolean;       // 优先使用 .gz 预压缩文件
  fastcgiCache: boolean;     // PHP 页面缓存
  fastcgiCacheTime: string;

  // 安全
  serverTokensOff: boolean;  // 隐藏版本号
  denyHidden: boolean;       // 禁止访问隐藏文件
  denyBackup: boolean;       // 禁止访问备份 / 敏感后缀
  hsts: boolean;
  hstsMaxAge: string;
  securityHeaders: boolean;  // X-Frame-Options 等安全响应头
  antiLeech: boolean;        // 图片防盗链
  antiLeechDomains: string;  // 允许的来源域名
  cors: boolean;
  corsOrigin: string;
  limitMethods: boolean;     // 只放行 GET/POST/HEAD
  basicAuth: boolean;
  authFile: string;          // htpasswd 文件
  ipMode: NginxIpMode;       // IP 黑白名单
  ipList: string;            // IP 列表 (每行一个)

  // 限流
  limitReq: boolean;
  limitRate: string;
  limitBurst: string;
  limitNoDelay: boolean;
  limitConn: boolean;
  limitConnNum: string;

  // 其它
  redirectTo: string;        // 整站 301 目标域名 (空 = 关闭)
  errorPage: string;         // 404 页面路径 (空 = 关闭)
  denyUa: boolean;           // 拦截常见采集 / 爬虫 UA
}

/** 校验错误码 -> 文案由界面语言包映射 */
const isNum = (v: string): boolean => v !== '' && /^\d+(\.\d+)?$/.test(v.trim());
const isPort = (v: string): boolean => /^\d{1,5}$/.test(v.trim()) && Number(v) >= 1 && Number(v) <= 65535;

/** 路径类字段: 必须以 / 开头 */
const isAbsPath = (v: string): boolean => v.startsWith('/');

/** 尺寸 / 时间: 20m / 2g / 300s / 65 */
const isSize = (v: string): boolean => /^\d+[kmg]?$/i.test(v.trim());
const isTime = (v: string): boolean => /^\d+(ms|s|m|h|d)?$/i.test(v.trim());
/** 缓存时间: 必须有单位 (10m / 30d / 1h) */
const isDuration = (v: string): boolean => /^\d+(ms|s|m|h|d)$/i.test(v.trim());

/** 限速: 10r/s 或 30r/m */
const isRate = (v: string): boolean => /^\d+r\/[sm]$/.test(v.trim());

const isIpv4 = (v: string): boolean => {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\/(\d{1,2}))?$/.exec(v);
  if (!m) return false;
  if (m.slice(1, 5).some((o) => Number(o) > 255)) return false;
  return m[5] === undefined || Number(m[5]) <= 32;
};

/** IPv4 / CIDR / IPv6 / all / 网段简写 */
export const isValidIpEntry = (v: string): boolean => {
  const s = v.trim();
  if (s === 'all' || s === 'localhost') return true;
  if (isIpv4(s)) return true;
  // IPv6 / IPv6 CIDR (宽松校验: 只允许 16 进制与冒号)
  return /^[0-9a-fA-F:]{2,45}(?:\/\d{1,3})?$/.test(s) && s.includes(':');
};

/** 站点标识 (文件名 / upstream / zone 名): 只允许字母数字下划线减号 */
export const isValidSiteName = (v: string): boolean => /^[A-Za-z0-9_-]+$/.test(v.trim());

/** server_name: 支持 example.com / *.example.com / _ / 正则 ~^... / 多个空格分隔 */
export const isValidServerName = (v: string): boolean => {
  const list = v.trim().split(/\s+/).filter((x) => x !== '');
  if (list.length === 0) return false;
  return list.every((n) => n === '_' || /^~?\^?[\w.*:/-]+$/.test(n));
};

/** 后端地址: http://host:port / https://host / unix:/path */
export const isValidUpstream = (v: string): boolean =>
  /^(https?:\/\/[A-Za-z0-9_.-]+(:\d{1,5})?|unix:\/.+)$/.test(v.trim());

/** FastCGI 地址: unix:/path 或 host:port */
export const isValidFastcgi = (v: string): boolean =>
  /^unix:\/.+$/.test(v.trim()) || /^[A-Za-z0-9_.-]+:\d{1,5}$/.test(v.trim());

/** 解析 upsteam 文本为地址列表 (每行一个, 忽略空行与 # 注释) */
export const parseUpstreams = (v: string): string[] =>
  v.split('\n').map((l) => l.trim()).filter((l) => l !== '' && !l.startsWith('#'));

/** 解析 IP 列表 */
export const parseIpList = (v: string): string[] =>
  v.split('\n').map((l) => l.trim()).filter((l) => l !== '' && !l.startsWith('#'));

/** 校验配置, 返回错误码列表 */
export const validateNginx = (c: NginxConfig): string[] => {
  const errs: string[] = [];
  if (!c.siteName.trim()) errs.push('site-name');  if (!c.serverName.trim()) errs.push('server-name');
  else if (!isValidServerName(c.serverName)) errs.push('server-name-format');
  if (!isPort(c.listenPort)) errs.push('listen-port');
  if (c.https) {
    if (!c.certFile.trim()) errs.push('https-cert');
    else if (!isAbsPath(c.certFile.trim())) errs.push('https-cert-path');
    if (!c.keyFile.trim()) errs.push('https-key');
    else if (!isAbsPath(c.keyFile.trim())) errs.push('https-key-path');
  }
  if (c.redirectTo.trim() !== '' && !/^https?:\/\/[A-Za-z0-9_.:-]+(\/[A-Za-z0-9_\-./]*)?$/.test(c.redirectTo.trim())) {
    errs.push('redirect-to');
  }
  if (c.mode !== 'proxy') {
    if (!c.root.trim()) errs.push('root');
    else if (!isAbsPath(c.root.trim())) errs.push('root-path');
  }
  if (c.mode === 'proxy') {
    const ups = parseUpstreams(c.upstream);
    if (ups.length === 0) errs.push('upstream');
    else if (ups.some((u) => !isValidUpstream(u))) errs.push('upstream-format');
    if (!isTime(c.proxyTimeout)) errs.push('proxy-timeout');
    if (c.proxyCache && !isDuration(c.proxyCacheTime)) errs.push('proxy-cache-time');
  }
  if (c.mode === 'php') {
    if (!c.fastcgi.trim()) errs.push('fastcgi');
    else if (!isValidFastcgi(c.fastcgi)) errs.push('fastcgi-format');
    if (!c.phpRoot.trim()) errs.push('php-root');
    else if (!isAbsPath(c.phpRoot.trim())) errs.push('php-root-path');
    if (c.fastcgiCache && !isDuration(c.fastcgiCacheTime)) errs.push('fastcgi-cache-time');
  }
  if (c.gzip) {
    const lv = Number(c.gzipLevel);
    if (!/^[1-9]$/.test(c.gzipLevel.trim()) || lv < 1 || lv > 9) errs.push('gzip-level');
  }
  if (c.expires !== '' && !isDuration(c.expires)) errs.push('expires-format');
  if (c.charset.trim() !== '' && !/^[\w-]+$/.test(c.charset.trim())) errs.push('charset-format');
  if (c.index.trim() !== '' && !/^[\w.-]+(\s+[\w.-]+)*$/.test(c.index.trim())) errs.push('index-format');
  if (c.keepaliveTimeout !== '' && !isTime(c.keepaliveTimeout)) errs.push('keepalive-timeout');
  if (c.clientMaxBody !== '' && !isSize(c.clientMaxBody)) errs.push('client-max-body');
  if (c.hsts) {
    if (!c.https) errs.push('hsts-needs-https');
    if (!/^\d+$/.test(c.hstsMaxAge.trim())) errs.push('hsts-max-age');
  }
  if (c.antiLeech && c.antiLeechDomains.trim() === '') errs.push('anti-leech-domains');
  if (c.cors && c.corsOrigin.trim() === '') errs.push('cors-origin');
  if (c.basicAuth) {
    if (!c.authFile.trim()) errs.push('auth-file');
    else if (!isAbsPath(c.authFile.trim())) errs.push('auth-file-path');
  }
  if (c.ipMode !== 'off') {
    const list = parseIpList(c.ipList);
    if (list.length === 0) errs.push('ip-list');
    else if (list.some((ip) => !isValidIpEntry(ip))) errs.push('ip-list-format');
  }
  if (c.limitReq) {
    if (!isRate(c.limitRate)) errs.push('limit-rate');
    if (c.limitBurst !== '' && !/^\d+$/.test(c.limitBurst.trim())) errs.push('limit-burst');
  }
  if (c.limitConn && !/^\d+$/.test(c.limitConnNum.trim())) errs.push('limit-conn');
  if (c.errorPage.trim() !== '' && !isAbsPath(c.errorPage.trim())) errs.push('error-page-path');
  return errs;
};

/** 生成提示码 (不含致命错误时的说明) */
export const nginxWarnings = (c: NginxConfig, errors: string[]): string[] => {
  if (errors.length > 0) return [];
  const ws: string[] = [ 'need-include', 'need-reload' ];
  if (safeName(c) !== c.siteName.trim()) ws.push('site-name-sanitized');
  if (c.limitReq || c.limitConn || c.proxyCache || c.fastcgiCache || c.mode === 'proxy') ws.push('http-context');
  if (c.proxyCache || c.fastcgiCache) ws.push('cache-dir');
  if (c.securityHeaders && c.mode !== 'proxy' && c.expires !== '' && c.cacheImmutable) ws.push('reset-headers');
  if (c.https && c.hsts) ws.push('hsts-once');
  if (c.mode === 'spa') ws.push('spa-fallback');
  if (c.mode === 'proxy' && c.realIp) ws.push('proxy-real-ip');
  if (c.mode === 'php') ws.push('php-socket');
  if (c.ipMode === 'allow') ws.push('ip-allow-order');
  if (c.antiLeech) ws.push('anti-leech-none');
  if (c.antiLeech && c.expires === '') ws.push('anti-leech-no-expires');
  if (c.https && !c.redirectHttps) ws.push('http-not-redirect');
  if (c.gzipStatic) ws.push('gzip-static-need-files');
  return ws;
};

/** 站点标识 sanitize (文件名 / zone 名用) */
export const safeName = (c: NginxConfig): string => {
  const n = c.siteName.trim().replace(/[^A-Za-z0-9_-]/g, '_');
  return n === '' ? 'site' : n;
};

/** 主域名 (server_name 的第一个非通配项, 用于日志文件名等) */
export const primaryDomain = (c: NginxConfig): string => {
  const list = c.serverName.trim().split(/\s+/).filter((x) => x !== '');
  const hit = list.find((x) => x !== '_' && !x.startsWith('*') && !x.startsWith('~'));
  return hit ?? list[0] ?? 'site';
};
