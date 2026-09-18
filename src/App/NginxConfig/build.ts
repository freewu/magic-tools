// nginx 站点配置生成 (server 块 + http 上下文块 + 部署命令)
import {
  nginxWarnings, parseIpList, parseUpstreams, safeName, validateNginx,
} from './lib';
import type { NginxConfig } from './lib';

/** 生成结果 */
export interface NginxPlan {
  errors: string[];
  warnings: string[];
  fileName: string;
  conf: string;
  deploy: string[];
}

/** 静态资源扩展名分组 (防盗链分开时避免正则 location 重复) */
const IMG_EXT = 'jpg|jpeg|png|gif|webp|avif|svg|ico|bmp';
const MEDIA_EXT = 'mp4|webm|flv|mp3|m4a';
const CODE_EXT = 'css|js|mjs|map|woff|woff2|ttf|otf|eot';
const BACKUP_EXT = 'bak|old|sql|zip|tar|gz|tgz|log|ini|conf|swp|swo|orig|save';

const GZIP_TYPES = [
  'text/plain', 'text/css', 'text/xml', 'text/javascript',
  'application/javascript', 'application/json', 'application/xml', 'application/rss+xml',
  'image/svg+xml', 'font/ttf', 'font/otf', 'application/vnd.ms-fontobject',
].join(' ');

const TLS_CIPHERS = [
  'ECDHE-ECDSA-AES128-GCM-SHA256', 'ECDHE-RSA-AES128-GCM-SHA256',
  'ECDHE-ECDSA-AES256-GCM-SHA384', 'ECDHE-RSA-AES256-GCM-SHA384',
  'ECDHE-ECDSA-CHACHA20-POLY1305', 'ECDHE-RSA-CHACHA20-POLY1305',
].join(':');

/** server 内静态资源缓存 location */
const cacheLocation = (ext: string, c: NginxConfig, indent = '    '): string[] => {
  const out: string[] = [];
  out.push(`${indent}location ~* \\.(${ext})$ {`);
  out.push(`${indent}    expires ${c.expires};`);
  if (c.cacheImmutable) out.push(`${indent}    add_header Cache-Control "public, immutable";`);
  if (c.gzipStatic) out.push(`${indent}    gzip_static on;`);
  out.push(`${indent}    access_log off;`);
  out.push(`${indent}}`);
  return out;
};

/** 生成完整配置 */
export const buildNginxPlan = (c: NginxConfig): NginxPlan => {
  const errors = validateNginx(c);
  const warnings = nginxWarnings(c, errors);
  const name = safeName(c);
  const fileName = `${name}.conf`;
  if (errors.length > 0) return { errors, warnings, fileName, conf: '', deploy: [] };

  const https = c.https;
  const sslPort = c.listenPort.trim() === '80' ? '443' : c.listenPort.trim();
  const httpPort = c.listenPort.trim();
  const serverNames = c.serverName.trim().split(/\s+/).join(' ');
  const firstIndex = c.index.trim().split(/\s+/)[0] || 'index.html';
  const ups = parseUpstreams(c.upstream);

  const http: string[] = [];
  const servers: string[] = [];

  // ---------------- http 上下文: 限流 zone / 缓存路径 / upstream ----------------
  if (c.limitReq) http.push(`limit_req_zone $binary_remote_addr zone=${name}_req:10m rate=${c.limitRate.trim()};`);
  if (c.limitConn) http.push(`limit_conn_zone $binary_remote_addr zone=${name}_conn:10m;`);
  if (c.proxyCache) {
    http.push(`proxy_cache_path /var/cache/nginx/${name} levels=1:2 keys_zone=${name}_cache:10m max_size=1g inactive=60m use_temp_path=off;`);
  }
  if (c.fastcgiCache) {
    http.push(`fastcgi_cache_path /var/cache/nginx/${name}_fcgi levels=1:2 keys_zone=${name}_fcgi:10m max_size=512m inactive=60m use_temp_path=off;`);
  }
  if (c.mode === 'proxy') {
    http.push(`upstream ${name}_backend {`);
    for (const u of ups) {
      const addr = u.replace(/^https?:\/\//, '');
      http.push(`    server ${addr};`);
    }
    if (c.upstreamKeepalive) http.push('    keepalive 32;');
    http.push('}');
  }

  // ---------------- 80 跳转 443 ----------------
  if (https && c.redirectHttps) {
    const tlsHost = sslPort === '443' ? 'https://$host' : `https://$host:${sslPort}`;
    servers.push([
      'server {',
      '    # HTTP 跳转 HTTPS',
      '    listen 80;',
      '    listen [::]:80;',
      `    server_name ${serverNames};`,
      `    return 301 ${tlsHost}$request_uri;`,
      '}',
    ].join('\n'));
  }

  // ---------------- 主 server ----------------
  const s: string[] = [];
  if (https) {
    const flags = c.http2 ? ' ssl http2' : ' ssl';
    s.push(`    listen ${sslPort}${flags};`);
    s.push(`    listen [::]:${sslPort}${flags};`);
  } else {
    s.push(`    listen ${httpPort};`);
    s.push(`    listen [::]:${httpPort};`);
  }
  s.push(`    server_name ${serverNames};`);

  // 整站 301: 仅保留跳转
  if (c.redirectTo.trim() !== '') {
    s.push('');
    s.push(`    # 整站 301 跳转到 ${c.redirectTo.trim().replace(/\/+$/, '')}`);
    s.push(`    return 301 ${c.redirectTo.trim().replace(/\/+$/, '')}$request_uri;`);
    servers.push([ 'server {', ...s, '}' ].join('\n'));
    const conf = [
      headerLines(fileName),
      '',
      http.length > 0 ? [ '# ---- http 上下文 (upstream / 限流 zone / 缓存路径) ----', ...http ].join('\n') : '',
      '',
      servers.join('\n\n'),
      '',
      globalTips(),
    ].filter((x) => x !== '').join('\n');
    return { errors, warnings, fileName, conf, deploy: deployLines(name, fileName) };
  }

  if (c.charset.trim() !== '') s.push(`    charset ${c.charset.trim()};`);
  if (c.accessLog) s.push(`    access_log /var/log/nginx/${name}.access.log;`);
  if (c.errorLog) s.push(`    error_log /var/log/nginx/${name}.error.log warn;`);
  s.push(`    root ${c.root.trim()};`);
  if (c.index.trim() !== '') s.push(`    index ${c.index.trim()};`);
  if (c.clientMaxBody.trim() !== '') s.push(`    client_max_body_size ${c.clientMaxBody.trim()};`);

  // ---- TLS ----
  if (https) {
    s.push('');
    s.push('    # ---- HTTPS / TLS ----');
    s.push(`    ssl_certificate ${c.certFile.trim()};`);
    s.push(`    ssl_certificate_key ${c.keyFile.trim()};`);
    s.push(`    ssl_session_cache shared:${name}_ssl:10m;`);
    s.push('    ssl_session_timeout 10m;');
    s.push('    ssl_session_tickets off;');
    s.push('    ssl_protocols TLSv1.2 TLSv1.3;');
    s.push(`    ssl_ciphers ${TLS_CIPHERS};`);
    s.push('    ssl_prefer_server_ciphers off;');
  }

  // ---- 性能优化 ----
  const perf: string[] = [];
  if (c.sendfile) perf.push('    sendfile on;', '    tcp_nopush on;', '    tcp_nodelay on;');
  if (c.keepaliveTimeout.trim() !== '') perf.push(`    keepalive_timeout ${c.keepaliveTimeout.trim()};`, '    keepalive_requests 1000;');
  if (c.openFileCache) {
    perf.push('    open_file_cache max=10000 inactive=30s;');
    perf.push('    open_file_cache_valid 60s;');
    perf.push('    open_file_cache_min_uses 2;');
    perf.push('    open_file_cache_errors on;');
  }
  if (c.gzip) {
    perf.push('    gzip on;', '    gzip_vary on;', '    gzip_proxied any;');
    perf.push(`    gzip_comp_level ${c.gzipLevel.trim()};`, '    gzip_min_length 1k;', '    gzip_buffers 4 16k;', '    gzip_http_version 1.1;');
    if (c.gzipTypes) perf.push(`    gzip_types ${GZIP_TYPES};`);
  }
  s.push('');
  s.push('    # ---- 性能优化 (server 级) ----');
  s.push(...perf);
  if (c.mode === 'proxy' && c.proxyCache) {
    s.push(`    proxy_cache ${name}_cache;`);
    s.push(`    proxy_cache_valid 200 302 ${c.proxyCacheTime.trim()};`);
    s.push('    proxy_cache_valid 404 1m;');
    s.push('    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;');
    s.push('    add_header X-Cache-Status $upstream_cache_status always;');
  }

  // ---- 安全 ----
  const sec: string[] = [];
  if (c.serverTokensOff) sec.push('    server_tokens off;');
  if (c.securityHeaders) {
    sec.push('    add_header X-Frame-Options SAMEORIGIN always;');
    sec.push('    add_header X-Content-Type-Options nosniff always;');
    sec.push('    add_header Referrer-Policy strict-origin-when-cross-origin always;');
    sec.push('    add_header X-Permitted-Cross-Domain-Policies none always;');
  }
  if (https && c.hsts) {
    sec.push(`    add_header Strict-Transport-Security "max-age=${c.hstsMaxAge.trim()}; includeSubDomains" always;`);
  }
  if (c.limitReq) {
    sec.push(`    limit_req zone=${name}_req burst=${c.limitBurst.trim() === '' ? '20' : c.limitBurst.trim()}${c.limitNoDelay ? ' nodelay' : ''};`);
  }
  if (c.limitConn) sec.push(`    limit_conn ${name}_conn ${c.limitConnNum.trim()};`);
  if (c.basicAuth) {
    sec.push('    auth_basic "Restricted";');
    sec.push(`    auth_basic_user_file ${c.authFile.trim()};`);
  }
  if (c.ipMode === 'allow') {
    for (const ip of parseIpList(c.ipList)) sec.push(`    allow ${ip};`);
    sec.push('    deny all;');
  } else if (c.ipMode === 'deny') {
    for (const ip of parseIpList(c.ipList)) sec.push(`    deny ${ip};`);
  }
  if (sec.length > 0) {
    s.push('');
    s.push('    # ---- 安全加固 ----');
    s.push(...sec);
  }

  // ---- 请求过滤 (if) ----
  const filters: string[] = [];
  if (c.limitMethods) {
    const allow = c.cors ? 'GET|POST|HEAD|OPTIONS' : 'GET|POST|HEAD';
    filters.push(`    if ($request_method !~ ^(${allow})$) {`);
    filters.push('        return 405;');
    filters.push('    }');
  }
  if (c.denyUa) {
    filters.push('    if ($http_user_agent ~* (SemrushBot|AhrefsBot|MJ12Bot|DotBot|PetalBot|Bytespider|ZoominfoBot)) {');
    filters.push('        return 403;');
    filters.push('    }');
  }
  if (filters.length > 0) {
    s.push('');
    s.push('    # ---- 请求过滤 ----');
    s.push(...filters);
  }

  // ---- 阻止访问隐藏文件 / 备份文件 ----
  if (c.denyHidden || c.denyBackup) {
    s.push('');
    s.push('    # ---- 阻止访问敏感文件 ----');
    if (c.denyHidden) {
      s.push('    location ^~ /.well-known/acme-challenge/ {');
      s.push('        allow all;');
      s.push('    }');
      s.push('    location ~ /\\. {');
      s.push('        deny all;');
      s.push('        access_log off;');
      s.push('    }');
    }
    if (c.denyBackup) {
      s.push(`    location ~* \\.(${BACKUP_EXT})$ {`);
      s.push('        deny all;');
      s.push('        access_log off;');
      s.push('    }');
    }
  }

  // ---- 站点类型 ----
  s.push('');
  if (c.mode === 'static') {
    s.push('    location / {');
    s.push('        try_files $uri $uri/ =404;');
    s.push('    }');
  } else if (c.mode === 'spa') {
    s.push('    # 前端路由: 找不到的路径交给入口文件');
    s.push('    location / {');
    s.push(`        try_files $uri $uri/ /${firstIndex};`);
    s.push('    }');
  } else if (c.mode === 'php') {
    s.push('    location / {');
    s.push('        try_files $uri $uri/ /index.php?$query_string;');
    s.push('    }');
    s.push('');
    s.push('    location ~ \\.php$ {');
    s.push('        try_files $uri =404;');
    s.push(`        fastcgi_pass ${c.fastcgi.trim()};`);
    s.push('        fastcgi_index index.php;');
    s.push('        include fastcgi_params;');
    s.push(`        fastcgi_param SCRIPT_FILENAME ${c.phpRoot.trim().replace(/\/+$/, '')}$fastcgi_script_name;`);
    s.push('        fastcgi_read_timeout 300s;');
    s.push('        fastcgi_buffers 16 16k;');
    s.push('        fastcgi_buffer_size 32k;');
    if (c.fastcgiCache) {
      s.push(`        fastcgi_cache ${name}_fcgi;`);
      s.push(`        fastcgi_cache_valid 200 301 302 ${c.fastcgiCacheTime.trim()};`);
      s.push('        fastcgi_cache_use_stale error timeout invalid_header http_500;');
      s.push('        add_header X-Fastcgi-Cache $upstream_cache_status always;');
    }
    s.push('    }');
  } else {
    s.push('    location / {');
    s.push(`        proxy_pass http://${name}_backend;`);
    s.push('        proxy_http_version 1.1;');
    s.push(`        proxy_set_header Host ${c.keepHost ? '$host' : '$proxy_host'};`);
    if (c.realIp) {
      s.push('        proxy_set_header X-Real-IP $remote_addr;');
      s.push('        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;');
      s.push('        proxy_set_header X-Forwarded-Proto $scheme;');
      s.push('        proxy_set_header X-Forwarded-Host $host;');
    }
    if (c.websocket) {
      s.push('        proxy_set_header Upgrade $http_upgrade;');
      s.push('        proxy_set_header Connection "upgrade";');
    } else {
      s.push('        proxy_set_header Connection "";');
    }
    s.push(`        proxy_connect_timeout ${c.proxyTimeout.trim()};`);
    s.push(`        proxy_send_timeout ${c.proxyTimeout.trim()};`);
    s.push(`        proxy_read_timeout ${c.websocket ? '3600s' : c.proxyTimeout.trim()};`);
    s.push('        proxy_buffering on;');
    s.push('        proxy_buffer_size 16k;');
    s.push('        proxy_buffers 8 16k;');
    s.push('    }');
  }

  // ---- 静态资源缓存 ----
  if (c.expires !== '' || c.antiLeech) {
    s.push('');
    s.push('    # ---- 静态资源缓存 ----');
    if (c.antiLeech) {
      s.push(`    location ~* \\.(${IMG_EXT}|${MEDIA_EXT})$ {`);
      s.push(`        valid_referers none blocked server_names ${c.antiLeechDomains.trim()};`);
      s.push('        if ($invalid_referer) {');
      s.push('            return 403;');
      s.push('        }');
      if (c.expires !== '') {
        s.push(`        expires ${c.expires};`);
        if (c.cacheImmutable) s.push('        add_header Cache-Control "public, immutable";');
      }
      if (c.gzipStatic) s.push('        gzip_static on;');
      s.push('        access_log off;');
      s.push('    }');
      if (c.expires !== '') s.push(...cacheLocation(CODE_EXT, c));
    } else {
      s.push(...cacheLocation(`${IMG_EXT}|${MEDIA_EXT}|${CODE_EXT}`, c));
    }
  }

  // ---- CORS ----
  if (c.cors) {
    const origin = c.corsOrigin.trim();
    const credentials = origin !== '*';
    s.push('');
    s.push('    # ---- 跨域 (CORS) ----');
    s.push(`    add_header Access-Control-Allow-Origin "${origin}" always;`);
    if (credentials) s.push('    add_header Access-Control-Allow-Credentials "true" always;');
    s.push('    if ($request_method = OPTIONS) {');
    s.push(`        add_header Access-Control-Allow-Origin "${origin}" always;`);
    s.push('        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;');
    s.push('        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always;');
    s.push('        add_header Access-Control-Max-Age "86400" always;');
    s.push('        return 204;');
    s.push('    }');
  }

  // ---- 错误页 & 小文件 ----
  if (c.errorPage.trim() !== '') {
    s.push('');
    s.push(`    error_page 404 ${c.errorPage.trim()};`);
    s.push(`    location = ${c.errorPage.trim()} {`);
    s.push('        internal;');
    s.push('    }');
  }
  s.push('');
  s.push('    location = /favicon.ico {');
  s.push('        access_log off;');
  s.push('        log_not_found off;');
  s.push('    }');

  servers.push([ 'server {', ...s, '}' ].join('\n'));

  const conf = [
    headerLines(fileName),
    '',
    http.length > 0 ? [ '# ---- http 上下文 (upstream / 限流 zone / 缓存路径) ----', ...http ].join('\n') : '',
    '',
    servers.join('\n\n'),
    '',
    globalTips(),
  ].filter((x) => x !== '').join('\n');

  return { errors, warnings, fileName, conf, deploy: deployLines(name, fileName) };
};

/** 文件头注释 */
const headerLines = (fileName: string): string => [
  '# ============================================================',
  `# ${fileName} — 由 MagicTools「nginx 配置」生成`,
  '# 1. 保存为 ' + fileName + ', 放入 vhost 目录 (如 /etc/nginx/vhost/)',
  '# 2. 确认 nginx.conf 的 http {} 块中已包含: include /etc/nginx/vhost/*.conf;',
  '# 3. 校验并平滑重载: nginx -t && nginx -s reload',
  '# ============================================================',
].join('\n');

/** 部署命令 */
const deployLines = (name: string, fileName: string): string[] => [
  `# 1. 把 ${fileName} 放到 vhost 目录 (按实际环境调整路径)`,
  `sudo cp ${fileName} /etc/nginx/vhost/${fileName}`,
  '# 2. 确认主配置 http {} 块内已 include:',
  '#    include /etc/nginx/vhost/*.conf;',
  '# 3. 校验并平滑重载 (校验失败时按提示修配置, 不要直接重载)',
  'sudo nginx -t',
  'sudo nginx -s reload',
  '# 4. 查看访问 / 错误日志',
  `sudo tail -f /var/log/nginx/${name}.access.log`,
  `sudo tail -f /var/log/nginx/${name}.error.log`,
];

/** nginx.conf 全局优化建议 (注释形式, 不会影响配置) */
const globalTips = (): string => [
  '# ============================================================',
  '# 以下为 nginx.conf 主配置的性能优化建议 (取消注释前请确认上下文)',
  '# ============================================================',
  '# worker_processes auto;                        # main: 一般等于 CPU 核数',
  '# worker_rlimit_nofile 65535;                   # main: 单进程文件描述符上限',
  '# worker_connections 10240;                     # events: 单 worker 最大连接数',
  '# multi_accept on;                              # events: 一次接受多个新连接',
  '# use epoll;                                    # events: Linux 高效事件模型',
  '# sendfile on; tcp_nopush on; tcp_nodelay on;   # http: 零拷贝与小包优化',
  '# keepalive_timeout 65; keepalive_requests 1000; # http: 长连接复用',
  '# client_body_buffer_size 128k;                 # http: 请求体缓冲区',
  '# client_header_buffer_size 4k;                 # http: 请求头缓冲区',
  '# server_tokens off;                            # http: 隐藏版本号',
  '# gzip on; gzip_vary on; gzip_comp_level 5;     # http: 全局压缩 (server 已配则二选一)',
  '# proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=global:100m max_size=10g inactive=60m use_temp_path=off;  # http: 全局代理缓存',
  '# open_file_cache max=10000 inactive=30s;       # http: 全局文件句柄缓存',
].join('\n');
