import { DEFAULT_NGINX_CONFIG, NGINX_PRESETS } from './data';
import {
  isValidFastcgi, isValidIpEntry, isValidServerName, isValidSiteName, isValidUpstream,
  nginxWarnings, parseIpList, parseUpstreams, primaryDomain, safeName, validateNginx,
} from './lib';
import type { NginxConfig } from './lib';
import { buildNginxPlan } from './build';

const cfg = (patch: Partial<NginxConfig> = {}): NginxConfig => ({ ...DEFAULT_NGINX_CONFIG, ...patch });

/** 去掉尾部全局建议注释块, 便于做 "不包含" 断言 */
const body = (patch: Partial<NginxConfig> = {}): string =>
  buildNginxPlan(cfg(patch)).conf.split('# 以下为 nginx.conf 主配置的性能优化建议')[0];

describe('nginx 配置 - 字段校验', () => {
  test('默认配置无错误', () => {
    expect(validateNginx(cfg())).toEqual([]);
  });

  test('站点标识为空才是错误, 非法字符会被清洗', () => {
    expect(validateNginx(cfg({ siteName: '  ' }))).toContain('site-name');
    expect(validateNginx(cfg({ siteName: 'my.site' }))).toEqual([]);
    expect(nginxWarnings(cfg({ siteName: 'my.site' }), [])).toContain('site-name-sanitized');
    expect(nginxWarnings(cfg({ siteName: 'my-site_1' }), [])).not.toContain('site-name-sanitized');
    expect(validateNginx(cfg({ siteName: 'my-site_1' }))).toEqual([]);
  });

  test('域名必填与格式', () => {
    expect(validateNginx(cfg({ serverName: '' }))).toContain('server-name');
    expect(validateNginx(cfg({ serverName: 'exa mple.com' }))).toEqual([]);
    expect(validateNginx(cfg({ serverName: 'bad$name' }))).toContain('server-name-format');
    expect(validateNginx(cfg({ serverName: '_' }))).toEqual([]);
    expect(validateNginx(cfg({ serverName: '*.example.com example.com' }))).toEqual([]);
  });

  test('监听端口范围', () => {
    expect(validateNginx(cfg({ listenPort: '0' }))).toContain('listen-port');
    expect(validateNginx(cfg({ listenPort: '70000' }))).toContain('listen-port');
    expect(validateNginx(cfg({ listenPort: 'abc' }))).toContain('listen-port');
    expect(validateNginx(cfg({ listenPort: '8080' }))).toEqual([]);
  });

  test('HTTPS 证书 / 私钥必填且为绝对路径', () => {
    const errs = validateNginx(cfg({ https: true, certFile: '', keyFile: '' }));
    expect(errs).toContain('https-cert');
    expect(errs).toContain('https-key');
    expect(validateNginx(cfg({ https: true, certFile: 'ssl/a.crt' }))).toContain('https-cert-path');
    expect(validateNginx(cfg({ https: true, keyFile: 'ssl/a.key' }))).toContain('https-key-path');
  });

  test('整站跳转地址格式', () => {
    expect(validateNginx(cfg({ redirectTo: 'new.example.com' }))).toContain('redirect-to');
    expect(validateNginx(cfg({ redirectTo: 'https://new.example.com' }))).toEqual([]);
    expect(validateNginx(cfg({ redirectTo: 'https://new.example.com/' }))).toEqual([]);
  });

  test('网站根目录校验 (反向代理不需要)', () => {
    expect(validateNginx(cfg({ root: '' }))).toContain('root');
    expect(validateNginx(cfg({ root: 'var/www' }))).toContain('root-path');
    expect(validateNginx(cfg({ mode: 'proxy', root: '' }))).toEqual([]);
  });

  test('反向代理后端地址校验', () => {
    expect(validateNginx(cfg({ mode: 'proxy', upstream: '' }))).toContain('upstream');
    expect(validateNginx(cfg({ mode: 'proxy', upstream: '127.0.0.1:8080' }))).toContain('upstream-format');
    expect(validateNginx(cfg({ mode: 'proxy', upstream: '#' }))).toContain('upstream');
    expect(validateNginx(cfg({ mode: 'proxy', upstream: 'http://127.0.0.1:8080' }))).toEqual([]);
    expect(validateNginx(cfg({ mode: 'proxy', upstream: 'unix:/tmp/app.sock' }))).toEqual([]);
  });

  test('代理超时 / 缓存时间校验', () => {
    expect(validateNginx(cfg({ mode: 'proxy', proxyTimeout: 'abc' }))).toContain('proxy-timeout');
    expect(validateNginx(cfg({ mode: 'proxy', proxyTimeout: '120s' }))).toEqual([]);
    expect(validateNginx(cfg({ mode: 'proxy', proxyCache: true, proxyCacheTime: '10' })))
      .toContain('proxy-cache-time');
  });

  test('PHP fastcgi 参数校验', () => {
    const errs = validateNginx(cfg({ mode: 'php', fastcgi: '', phpRoot: '' }));
    expect(errs).toContain('fastcgi');
    expect(errs).toContain('php-root');
    expect(validateNginx(cfg({ mode: 'php', fastcgi: 'php-fpm.sock' }))).toContain('fastcgi-format');
    expect(validateNginx(cfg({ mode: 'php', fastcgi: '127.0.0.1:9000' }))).toEqual([]);
    expect(validateNginx(cfg({ mode: 'php', phpRoot: 'var/www' }))).toContain('php-root-path');
    expect(validateNginx(cfg({ mode: 'php', fastcgiCache: true, fastcgiCacheTime: '15' })))
      .toContain('fastcgi-cache-time');
  });

  test('gzip 级别 / 过期时间 / 字符集 / 首页', () => {
    expect(validateNginx(cfg({ gzip: true, gzipLevel: '0' }))).toContain('gzip-level');
    expect(validateNginx(cfg({ gzip: true, gzipLevel: '10' }))).toContain('gzip-level');
    expect(validateNginx(cfg({ gzip: true, gzipLevel: '9' }))).toEqual([]);
    expect(validateNginx(cfg({ expires: '30' }))).toContain('expires-format');
    expect(validateNginx(cfg({ charset: 'utf 8' }))).toContain('charset-format');
    expect(validateNginx(cfg({ index: 'a/b' }))).toContain('index-format');
    expect(validateNginx(cfg({ index: 'index.php index.html' }))).toEqual([]);
  });

  test('长连接超时与上传体积', () => {
    expect(validateNginx(cfg({ keepaliveTimeout: 'abc' }))).toContain('keepalive-timeout');
    expect(validateNginx(cfg({ keepaliveTimeout: '' }))).toEqual([]);
    expect(validateNginx(cfg({ clientMaxBody: '20mb' }))).toContain('client-max-body');
    expect(validateNginx(cfg({ clientMaxBody: '2g' }))).toEqual([]);
  });

  test('HSTS 依赖 HTTPS', () => {
    expect(validateNginx(cfg({ hsts: true, https: false }))).toContain('hsts-needs-https');
    expect(validateNginx(cfg({ hsts: true, https: true, hstsMaxAge: 'abc' }))).toContain('hsts-max-age');
    expect(validateNginx(cfg({ hsts: true, https: true }))).toEqual([]);
  });

  test('防盗链域名 / CORS 来源必填', () => {
    expect(validateNginx(cfg({ antiLeech: true, antiLeechDomains: ' ' }))).toContain('anti-leech-domains');
    expect(validateNginx(cfg({ cors: true, corsOrigin: '' }))).toContain('cors-origin');
  });

  test('Basic Auth 文件路径', () => {
    expect(validateNginx(cfg({ basicAuth: true, authFile: '' }))).toContain('auth-file');
    expect(validateNginx(cfg({ basicAuth: true, authFile: 'htpasswd' }))).toContain('auth-file-path');
  });

  test('IP 黑白名单列表', () => {
    expect(validateNginx(cfg({ ipMode: 'allow', ipList: '' }))).toContain('ip-list');
    expect(validateNginx(cfg({ ipMode: 'deny', ipList: '10.0.0.256' }))).toContain('ip-list-format');
    expect(validateNginx(cfg({ ipMode: 'deny', ipList: '10.0.0.0/8\n2001:db8::/32' }))).toEqual([]);
  });

  test('限流参数', () => {
    expect(validateNginx(cfg({ limitReq: true, limitRate: '10' }))).toContain('limit-rate');
    expect(validateNginx(cfg({ limitReq: true, limitRate: '10r/m' }))).toEqual([]);
    expect(validateNginx(cfg({ limitReq: true, limitBurst: 'x' }))).toContain('limit-burst');
    expect(validateNginx(cfg({ limitConn: true, limitConnNum: 'x' }))).toContain('limit-conn');
  });

  test('错误页路径必须绝对路径', () => {
    expect(validateNginx(cfg({ errorPage: '404.html' }))).toContain('error-page-path');
    expect(validateNginx(cfg({ errorPage: '' }))).toEqual([]);
  });

  test('小工具函数: IP / 域名 / 站点名 / 上游解析', () => {
    expect(isValidIpEntry('1.2.3.4')).toBe(true);
    expect(isValidIpEntry('1.2.3.4/24')).toBe(true);
    expect(isValidIpEntry('1.2.3.4/33')).toBe(false);
    expect(isValidIpEntry('all')).toBe(true);
    expect(isValidIpEntry('2001:db8::1')).toBe(true);
    expect(isValidIpEntry('not-an-ip')).toBe(false);
    expect(isValidSiteName('a-b_1')).toBe(true);
    expect(isValidSiteName('a.b')).toBe(false);
    expect(isValidServerName('_')).toBe(true);
    expect(isValidServerName('')).toBe(false);
    expect(isValidUpstream('https://a.com:443')).toBe(true);
    expect(isValidUpstream('unix:/run/a.sock')).toBe(true);
    expect(isValidUpstream('a.com')).toBe(false);
    expect(isValidFastcgi('unix:/run/php.sock')).toBe(true);
    expect(isValidFastcgi('127.0.0.1:9000')).toBe(true);
    expect(isValidFastcgi('9000')).toBe(false);
    expect(parseUpstreams('http://a:1\n# 注释\n\nhttp://b:2')).toEqual(['http://a:1', 'http://b:2']);
    expect(parseIpList(' 1.1.1.1 \n#x\n2.2.2.2')).toEqual(['1.1.1.1', '2.2.2.2']);
    expect(safeName(cfg({ siteName: 'my site' }))).toBe('my_site');
    expect(safeName(cfg({ siteName: '   ' }))).toBe('site');
    expect(primaryDomain(cfg({ serverName: '*.example.com www.example.com' }))).toBe('www.example.com');
    expect(primaryDomain(cfg({ serverName: '_' }))).toBe('_');
  });

  test('提示码: 有错误时不给提示', () => {
    expect(nginxWarnings(cfg({ siteName: '' }), [ 'site-name' ])).toEqual([]);
  });

  test('提示码: 常规 / 上下文 / 缓存目录 / 头覆盖', () => {
    expect(nginxWarnings(cfg(), [])).toEqual([ 'need-include', 'need-reload', 'reset-headers' ]);
    const w = nginxWarnings(cfg({ limitReq: true, proxyCache: false, mode: 'static', expires: '' }), []);
    expect(w).toContain('http-context');
    expect(w).not.toContain('cache-dir');
    const w2 = nginxWarnings(cfg({ mode: 'proxy', proxyCache: true }), []);
    expect(w2).toContain('cache-dir');
    expect(w2).toContain('proxy-real-ip');
  });

  test('提示码: HTTPS 相关 / 防盗链 / gzip_static', () => {
    expect(nginxWarnings(cfg({ https: true, redirectHttps: false, hsts: true }), []))
      .toContain('http-not-redirect');
    expect(nginxWarnings(cfg({ antiLeech: true, expires: '' }), [])).toContain('anti-leech-no-expires');
    expect(nginxWarnings(cfg({ antiLeech: true }), [])).toContain('anti-leech-none');
    expect(nginxWarnings(cfg({ gzipStatic: true }), [])).toContain('gzip-static-need-files');
    expect(nginxWarnings(cfg({ mode: 'php' }), [])).toContain('php-socket');
    expect(nginxWarnings(cfg({ ipMode: 'allow', ipList: '1.1.1.1' }), [])).toContain('ip-allow-order');
  });
});

describe('nginx 配置 - 生成配置', () => {
  test('有错误时不生成配置', () => {
    const r = buildNginxPlan(cfg({ siteName: '' }));
    expect(r.errors).toContain('site-name');
    expect(r.conf).toBe('');
    expect(r.deploy).toEqual([]);
  });

  test('默认配置: 文件名 / 头部注释 / 部署命令', () => {
    const r = buildNginxPlan(cfg());
    expect(r.fileName).toBe('example.conf');
    expect(r.conf).toContain('# example.conf — 由 MagicTools「nginx 配置」生成');
    expect(r.conf).toContain('# 2. 确认 nginx.conf 的 http {} 块中已包含: include /etc/nginx/vhost/*.conf;');
    expect(r.deploy).toContain('sudo nginx -t');
    expect(r.deploy).toContain('sudo nginx -s reload');
    expect(r.deploy[1]).toBe('sudo cp example.conf /etc/nginx/vhost/example.conf');
    expect(r.deploy.join('\n')).toContain('/var/log/nginx/example.access.log');
  });

  test('默认配置: 基础指令与静态站点', () => {
    const r = buildNginxPlan(cfg());
    expect(r.conf).toContain('    listen 80;');
    expect(r.conf).toContain('    listen [::]:80;');
    expect(r.conf).toContain('    server_name example.com www.example.com;');
    expect(r.conf).toContain('    root /var/www/example;');
    expect(r.conf).toContain('    index index.html index.htm;');
    expect(r.conf).toContain('    charset utf-8;');
    expect(r.conf).toContain('    client_max_body_size 20m;');
    expect(r.conf).toContain('        try_files $uri $uri/ =404;');
    expect(r.conf).toContain('    access_log /var/log/nginx/example.access.log;');
    expect(r.conf).toContain('    error_log /var/log/nginx/example.error.log warn;');
  });

  test('默认配置: 性能与安全指令', () => {
    const r = buildNginxPlan(cfg());
    expect(r.conf).toContain('    sendfile on;');
    expect(r.conf).toContain('    tcp_nopush on;');
    expect(r.conf).toContain('    keepalive_timeout 65;');
    expect(r.conf).toContain('    open_file_cache max=10000 inactive=30s;');
    expect(r.conf).toContain('    gzip on;');
    expect(r.conf).toContain('    gzip_comp_level 5;');
    expect(r.conf).toContain('    gzip_types text/plain text/css');
    expect(r.conf).toContain('    server_tokens off;');
    expect(r.conf).toContain('    add_header X-Frame-Options SAMEORIGIN always;');
    expect(r.conf).toContain('    add_header X-Content-Type-Options nosniff always;');
    expect(r.conf).toContain('    expires 30d;');
    expect(r.conf).toContain('        add_header Cache-Control "public, immutable";');
    expect(r.conf).toContain('    location ~ /\\. {');
    expect(r.conf).toContain('    location ^~ /.well-known/acme-challenge/ {');
    expect(r.conf).toContain('location ~* \\.(bak|old|sql');
    expect(r.conf).toContain('    error_page 404 /404.html;');
    expect(r.conf).toContain('    location = /404.html {');
    expect(r.conf).toContain('    location = /favicon.ico {');
  });

  test('默认配置: 全局优化建议均为注释', () => {
    const r = buildNginxPlan(cfg());
    const tips = r.conf.split('# 以下为 nginx.conf 主配置的性能优化建议 (取消注释前请确认上下文)')[1];
    expect(tips).toBeTruthy();
    const lines = tips.split('\n').filter((l) => l.trim() !== '' && !l.startsWith('# ==='));
    expect(lines.length).toBeGreaterThan(8);
    expect(lines.every((l) => l.trim().startsWith('#'))).toBe(true);
    expect(tips).toContain('# worker_processes auto;');
    expect(tips).toContain('# worker_connections 10240;');
  });

  test('HTTPS: 双 server 块 / 跳转 / TLS 与 HSTS', () => {
    const r = buildNginxPlan(cfg({ https: true, hsts: true }));
    expect(r.conf).toContain('    # HTTP 跳转 HTTPS');
    expect(r.conf).toContain('    return 301 https://$host$request_uri;');
    expect(r.conf).toContain('    listen 443 ssl http2;');
    expect(r.conf).toContain('    listen [::]:443 ssl http2;');
    expect(r.conf).toContain('    ssl_certificate /etc/nginx/ssl/example.com.crt;');
    expect(r.conf).toContain('    ssl_certificate_key /etc/nginx/ssl/example.com.key;');
    expect(r.conf).toContain('    ssl_protocols TLSv1.2 TLSv1.3;');
    expect(r.conf).toContain('    ssl_session_cache shared:example_ssl:10m;');
    expect(r.conf).toContain('    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:');
    expect(r.conf).toContain('    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;');
    expect(r.conf.split('server {').length - 1).toBe(2);
  });

  test('HTTPS: 关闭 HTTP/2 与关闭 HTTP 跳转', () => {
    const r = buildNginxPlan(cfg({ https: true, http2: false, redirectHttps: false }));
    expect(r.conf).toContain('    listen 443 ssl;');
    expect(r.conf).not.toContain('listen 443 ssl http2;');
    expect(r.conf).not.toContain('# HTTP 跳转 HTTPS');
    expect(r.warnings).toContain('http-not-redirect');
  });

  test('HTTPS: 非 80 端口需带端口跳转', () => {
    const r = buildNginxPlan(cfg({ https: true, listenPort: '8443' }));
    expect(r.conf).toContain('    listen 8443 ssl http2;');
    expect(r.conf).toContain('    return 301 https://$host:8443$request_uri;');
  });

  test('SPA: 回退到入口文件', () => {
    const r = buildNginxPlan(cfg({ mode: 'spa' }));
    expect(r.conf).toContain('        try_files $uri $uri/ /index.html;');
    expect(r.warnings).toContain('spa-fallback');
  });

  test('PHP: fastcgi 与缓存', () => {
    const r = buildNginxPlan(cfg({ mode: 'php', phpRoot: '/var/www/example/', fastcgiCache: true }));
    expect(r.conf).toContain('        try_files $uri $uri/ /index.php?$query_string;');
    expect(r.conf).toContain('    location ~ \\.php$ {');
    expect(r.conf).toContain('        fastcgi_pass unix:/run/php/php-fpm.sock;');
    expect(r.conf).toContain('        include fastcgi_params;');
    expect(r.conf).toContain('        fastcgi_param SCRIPT_FILENAME /var/www/example$fastcgi_script_name;');
    expect(r.conf).toContain('        fastcgi_read_timeout 300s;');
    expect(r.conf).toContain('        fastcgi_cache example_fcgi;');
    expect(r.conf).toContain('        fastcgi_cache_valid 200 301 302 15m;');
    expect(r.conf).toContain('fastcgi_cache_path /var/cache/nginx/example_fcgi levels=1:2 keys_zone=example_fcgi:10m');
  });

  test('PHP: 未开启缓存时不生成缓存指令', () => {
    const r = buildNginxPlan(cfg({ mode: 'php' }));
    expect(r.conf).not.toContain('fastcgi_cache_path');
    expect(r.conf).not.toContain('fastcgi_cache example_fcgi;');
  });

  test('反向代理: upstream / keepalive / 头部透传', () => {
    const r = buildNginxPlan(cfg({ mode: 'proxy', upstream: 'http://127.0.0.1:8080\nhttps://10.0.0.2:8443' }));
    expect(r.conf).toContain('upstream example_backend {');
    expect(r.conf).toContain('    server 127.0.0.1:8080;');
    expect(r.conf).toContain('    server 10.0.0.2:8443;');
    expect(r.conf).toContain('    keepalive 32;');
    expect(r.conf).toContain('        proxy_pass http://example_backend;');
    expect(r.conf).toContain('        proxy_http_version 1.1;');
    expect(r.conf).toContain('        proxy_set_header Host $host;');
    expect(r.conf).toContain('        proxy_set_header X-Real-IP $remote_addr;');
    expect(r.conf).toContain('        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;');
    expect(r.conf).toContain('        proxy_set_header X-Forwarded-Proto $scheme;');
    expect(r.conf).toContain('        proxy_set_header Connection "";');
    expect(r.conf).toContain('        proxy_connect_timeout 60s;');
    expect(r.conf).toContain('        proxy_read_timeout 60s;');
    expect(r.conf).toContain('    location / {');
  });

  test('反向代理: WebSocket / Host 透传开关 / 关闭真实 IP 头', () => {
    const r = buildNginxPlan(cfg({
      mode: 'proxy', websocket: true, keepHost: false, realIp: false, upstreamKeepalive: false,
    }));
    expect(r.conf).toContain('        proxy_set_header Host $proxy_host;');
    expect(r.conf).toContain('        proxy_set_header Upgrade $http_upgrade;');
    expect(r.conf).toContain('        proxy_set_header Connection "upgrade";');
    expect(r.conf).toContain('        proxy_read_timeout 3600s;');
    expect(r.conf).not.toContain('X-Real-IP');
    expect(r.conf).not.toContain('keepalive 32;');
  });

  test('反向代理: 缓存指令', () => {
    const r = buildNginxPlan(cfg({ mode: 'proxy', proxyCache: true, proxyCacheTime: '30m' }));
    expect(r.conf).toContain('proxy_cache_path /var/cache/nginx/example levels=1:2 keys_zone=example_cache:10m max_size=1g inactive=60m use_temp_path=off;');
    expect(r.conf).toContain('    proxy_cache example_cache;');
    expect(r.conf).toContain('    proxy_cache_valid 200 302 30m;');
    expect(r.conf).toContain('    add_header X-Cache-Status $upstream_cache_status always;');
    expect(r.warnings).toContain('cache-dir');
  });

  test('整站 301: 仅保留跳转 server', () => {
    const r = buildNginxPlan(cfg({ redirectTo: 'https://new.example.com/' }));
    expect(r.conf).toContain('    return 301 https://new.example.com$request_uri;');
    expect(r.conf).toContain('    # 整站 301 跳转到 https://new.example.com');
    expect(r.conf).not.toContain('root /var/www/example;');
    expect(r.conf).not.toContain('location / {');
  });

  test('限流: http 上下文 zone + server 指令', () => {
    const r = buildNginxPlan(cfg({ limitReq: true, limitBurst: '50', limitNoDelay: false, limitConn: true, limitConnNum: '30' }));
    expect(r.conf).toContain('limit_req_zone $binary_remote_addr zone=example_req:10m rate=10r/s;');
    expect(r.conf).toContain('limit_conn_zone $binary_remote_addr zone=example_conn:10m;');
    expect(r.conf).toContain('    limit_req zone=example_req burst=50;');
    expect(r.conf).not.toContain('burst=50 nodelay;');
    expect(r.conf).toContain('    limit_conn example_conn 30;');
  });

  test('IP 黑白名单', () => {
    const allow = body({ ipMode: 'allow', ipList: '10.0.0.0/8\n1.2.3.4' });
    expect(allow).toContain('    allow 10.0.0.0/8;');
    expect(allow).toContain('    allow 1.2.3.4;');
    expect(allow).toContain('    deny all;');
    const deny = body({ ipMode: 'deny', ipList: '1.2.3.4' });
    expect(deny).toContain('    deny 1.2.3.4;');
    expect(deny).not.toContain('\n    deny all;\n');
    const off = body();
    expect(off).not.toContain('\n    allow ');
  });

  test('Basic Auth / 请求方法限制 / 拦截采集 UA', () => {
    const r = buildNginxPlan(cfg({ basicAuth: true, limitMethods: true, denyUa: true }));
    expect(r.conf).toContain('    auth_basic "Restricted";');
    expect(r.conf).toContain('    auth_basic_user_file /etc/nginx/.htpasswd;');
    expect(r.conf).toContain('    if ($request_method !~ ^(GET|POST|HEAD)$) {');
    expect(r.conf).toContain('    if ($http_user_agent ~* (SemrushBot|AhrefsBot');
    expect(r.conf).toContain('        return 405;');
    expect(r.conf).toContain('        return 403;');
  });

  test('CORS: 通配来源不加 Credentials, 指定来源加', () => {
    const star = buildNginxPlan(cfg({ cors: true, corsOrigin: '*' }));
    expect(star.conf).toContain('    add_header Access-Control-Allow-Origin "*" always;');
    expect(star.conf).not.toContain('Access-Control-Allow-Credentials');
    expect(star.conf).toContain('    if ($request_method = OPTIONS) {');
    expect(star.conf).toContain('        return 204;');
    const one = buildNginxPlan(cfg({ cors: true, corsOrigin: 'https://a.com' }));
    expect(one.conf).toContain('    add_header Access-Control-Allow-Origin "https://a.com" always;');
    expect(one.conf).toContain('    add_header Access-Control-Allow-Credentials "true" always;');
  });

  test('CORS + 方法限制: OPTIONS 预检放行', () => {
    const r = buildNginxPlan(cfg({ cors: true, limitMethods: true }));
    expect(r.conf).toContain('    if ($request_method !~ ^(GET|POST|HEAD|OPTIONS)$) {');
  });

  test('防盗链: 图片视频单独 location, 静态资源单独 location', () => {
    const r = buildNginxPlan(cfg({ antiLeech: true, antiLeechDomains: 'example.com www.example.com' }));
    expect(r.conf).toContain('    location ~* \\.(jpg|jpeg|png|gif|webp|avif|svg|ico|bmp|mp4|webm|flv|mp3|m4a)$ {');
    expect(r.conf).toContain('        valid_referers none blocked server_names example.com www.example.com;');
    expect(r.conf).toContain('        if ($invalid_referer) {');
    expect(r.conf).toContain('    location ~* \\.(css|js|mjs|map|woff|woff2|ttf|otf|eot)$ {');
    expect(r.conf.split('expires 30d;').length - 1).toBe(2);
  });

  test('防盗链 + 不设置缓存时间', () => {
    const conf = body({ antiLeech: true, expires: '' });
    expect(conf).toContain('        if ($invalid_referer) {');
    expect(conf).not.toContain('expires');
    expect(conf).not.toContain('静态资源缓存\n    location ~* \\.(css');
  });

  test('不开启静态缓存时不生成缓存 location', () => {
    expect(body({ expires: '' })).not.toContain('# ---- 静态资源缓存 ----');
  });

  test('gzip 关闭 / immutable 关闭 / gzip_static 开启', () => {
    const off = body({ gzip: false, cacheImmutable: false, gzipStatic: true });
    expect(off).not.toContain('gzip on;');
    expect(off).not.toContain('gzip_types');
    expect(off).not.toContain('immutable');
    expect(off).toContain('        gzip_static on;');
  });

  test('安全开关关闭时不生成对应指令', () => {
    const r = body({
      serverTokensOff: false, securityHeaders: false, denyHidden: false, denyBackup: false, errorPage: '',
    });
    expect(r).not.toContain('server_tokens off;');
    expect(r).not.toContain('X-Frame-Options');
    expect(r).not.toContain('well-known');
    expect(r).not.toContain('bak|old|sql');
    expect(r).not.toContain('error_page');
    expect(r).toContain('location = /favicon.ico {');
  });

  test('日志关闭 / 字符集为空 / 长连接为空', () => {
    const r = body({ accessLog: false, errorLog: false, charset: '', keepaliveTimeout: '' });
    expect(r).not.toContain('access_log /var/log/nginx');
    expect(r).not.toContain('error_log /var/log/nginx');
    expect(r).not.toContain('charset');
    expect(r).not.toContain('keepalive_timeout');
  });

  test('站点标识参与文件名 / zone 名 / 日志路径', () => {
    const r = buildNginxPlan(cfg({ siteName: 'my site', limitReq: true, mode: 'proxy', proxyCache: true }));
    expect(r.fileName).toBe('my_site.conf');
    expect(r.conf).toContain('zone=my_site_req:10m');
    expect(r.conf).toContain('upstream my_site_backend {');
    expect(r.conf).toContain('keys_zone=my_site_cache:10m');
    expect(r.conf).toContain('/var/log/nginx/my_site.access.log');
    expect(r.warnings).toContain('site-name-sanitized');
  });

  test('内置场景模板均可生成且无校验错误', () => {
    expect(NGINX_PRESETS.length).toBeGreaterThanOrEqual(6);
    for (const p of NGINX_PRESETS) {
      const r = buildNginxPlan(cfg(p.config));
      expect(r.errors).toEqual([]);
      expect(r.conf).toContain('server {');
      expect(r.conf).toContain('server_name');
    }
  });

  test('图片站防盗链模板包含 referer 校验', () => {
    const p = NGINX_PRESETS.find((x) => x.name.includes('防盗链'));
    const r = buildNginxPlan(cfg(p?.config ?? {}));
    expect(r.conf).toContain('valid_referers');
    expect(r.conf).toContain('gzip_static on;');
  });

  test('接口转发模板包含 CORS 与 OPTIONS 预检', () => {
    const p = NGINX_PRESETS.find((x) => x.name.includes('CORS'));
    const r = buildNginxPlan(cfg(p?.config ?? {}));
    expect(r.conf).toContain('Access-Control-Allow-Origin "*"');
    expect(r.conf).toContain('if ($request_method !~ ^(GET|POST|HEAD|OPTIONS)$) {');
  });
});
