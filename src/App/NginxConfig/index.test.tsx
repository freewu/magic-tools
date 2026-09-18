import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { saveTextFile } from '../../lib/tauri';
import NginxConfig from './index';

jest.mock('../../lib/tauri', () => ({
  ...jest.requireActual('../../lib/tauri'),
  saveTextFile: jest.fn().mockResolvedValue(true),
}));

const mockSave = saveTextFile as jest.Mock;

let container: HTMLElement;
const setup = () => { container = render(<NginxConfig />).container; };
/** 页面文本 (含已渲染的隐藏页签) */
const view = (): string => container.textContent ?? '';
/** 当前激活页签内容 (取文本最长的 active pane, 兼容动画期两个 active) */
const pane = (): HTMLElement => {
  const panes = Array.from(document.querySelectorAll('.ant-tabs-tabpane-active')) as HTMLElement[];
  return panes.sort((a, b) => (b.textContent ?? '').length - (a.textContent ?? '').length)[0];
};
/** 切到页签 */
const tab = (name: string) => {
  const hit = screen.getAllByText(name).find((n) => n.closest('[role="tab"]') !== null);
  if (!hit) throw new Error(`未找到页签: ${name}`);
  fireEvent.click(hit);
};
/** 生成结果文本 */
const showConf = (): string => { tab('生成的配置'); return pane().textContent ?? ''; };
/** 按钮 */
const btn = (name: string): HTMLElement =>
  screen.getByRole('button', { name: new RegExp(name.split('').map((c) => (c === ' ' ? '\\s+' : c)).join('\\s*')) });
/** 生成结果正文 (去掉末尾注释形式的全局优化建议) */
const TIPS = '# 以下为 nginx.conf 主配置的性能优化建议';
const body = (text: string): string => text.split(TIPS)[0];
/** 字段容器: 标签可能包在 Tooltip 里, 向上找到最近的含控件的祖先 */
const field = (label: string): HTMLElement => {
  for (const n of screen.getAllByText(label)) {
    let p: HTMLElement | null = n.parentElement;
    while (p !== null) {
      if (p.querySelector('input, textarea, .ant-select, .ant-switch') !== null) return p;
      p = p.parentElement;
    }
  }
  throw new Error(`未找到字段: ${label}`);
};
const fieldInput = (label: string): HTMLInputElement =>
  field(label).querySelector('input, textarea') as HTMLInputElement;
const setField = (label: string, value: string) =>
  fireEvent.change(fieldInput(label), { target: { value } });
const toggle = (label: string) => fireEvent.click(field(label).querySelector('.ant-switch') as HTMLElement);
const openSelect = (label: string) =>
  fireEvent.mouseDown(field(label).querySelector('.ant-select-selector') as HTMLElement);
const pickOption = (label: string | RegExp) => {
  const option = screen.getAllByText(label).find((el) => el.closest('.ant-select-item-option'));
  if (!option) throw new Error(`未找到下拉项: ${String(label)}`);
  fireEvent.click(option);
};
const selectOption = (fieldLabel: string, option: string | RegExp) => {
  openSelect(fieldLabel);
  pickOption(option);
};
const notice = (): string => document.querySelector('.ant-message')?.textContent ?? '';
const writeText = (): jest.Mock =>
  (navigator as unknown as { clipboard: { writeText: jest.Mock } }).clipboard.writeText;

describe('NginxConfig 页面交互', () => {
  beforeEach(() => {
    message.destroy();
    mockSave.mockClear();
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
  });

  test('默认渲染配置页签与站点说明', () => {
    setup();
    const all = view();
    expect(all).toContain('nginx 配置说明');
    expect(all).toContain('生成的配置请保存为 <站点>.conf 放入 vhost 目录');
    expect(all).toContain('基础站点');
    expect(all).toContain('HTTPS 与 TLS');
    expect(all).toContain('性能优化');
    expect(all).toContain('安全加固');
    expect(all).toContain('限流与连接限制');
    expect(all).toContain('防盗链与跨域');
    expect(all).not.toContain('反向代理设置');
    expect(fieldInput('站点标识')).toHaveValue('example');
    expect(fieldInput('域名')).toHaveValue('example.com www.example.com');
    expect(fieldInput('监听端口')).toHaveValue('80');
  });

  test('生成的配置页签展示 server 块 / 提示与部署命令', () => {
    setup();
    const conf = showConf();
    expect(conf).toContain('配置文件内容');
    expect(conf).toContain('# example.conf — 由 MagicTools「nginx 配置」生成');
    expect(conf).toContain('# 2. 确认 nginx.conf 的 http {} 块中已包含: include /etc/nginx/vhost/*.conf;');
    expect(conf).toContain('    listen 80;');
    expect(conf).toContain('    listen [::]:80;');
    expect(conf).toContain('    server_name example.com www.example.com;');
    expect(conf).toContain('    root /var/www/example;');
    expect(conf).toContain('        try_files $uri $uri/ =404;');
    expect(conf).toContain('    gzip on;');
    expect(conf).toContain('    expires 30d;');
    expect(conf).toContain('    error_page 404 /404.html;');
    expect(conf).toContain('    location ~ /\\. {');
    expect(conf).toContain('需确认主配置 nginx.conf 的 http 块中已 include 本文件所在目录');
    expect(conf).toContain('修改后需执行 nginx -t 校验');
    expect(conf).toContain('部署到 vhost 目录的步骤');
    expect(conf).toContain('sudo nginx -t');
    expect(conf).toContain('sudo nginx -s reload');
  });

  test('修改域名 / 端口 / 根目录后实时更新', () => {
    setup();
    setField('域名', 'a.com');
    setField('监听端口', '8080');
    setField('网站根目录', '/data/site');
    const conf = showConf();
    expect(conf).toContain('    listen 8080;');
    expect(conf).toContain('    server_name a.com;');
    expect(conf).toContain('    root /data/site;');
  });

  test('站点标识非法字符会清洗为文件名与 zone 名', () => {
    setup();
    setField('站点标识', 'my site');
    const conf = showConf();
    expect(conf).toContain('my_site.conf');
    expect(conf).toContain('站点标识含特殊字符');
  });

  test('开启 HTTPS 生成跳转块 / TLS 配置, 开启 HSTS 追加响应头', () => {
    setup();
    toggle('开启 HTTPS');
    expect(view()).toContain('证书路径');
    let conf = showConf();
    expect(conf).toContain('    # HTTP 跳转 HTTPS');
    expect(conf).toContain('    return 301 https://$host$request_uri;');
    expect(conf).toContain('    listen 443 ssl http2;');
    expect(conf).toContain('    ssl_certificate /etc/nginx/ssl/example.com.crt;');
    expect(conf).toContain('    ssl_certificate_key /etc/nginx/ssl/example.com.key;');
    expect(conf).toContain('    ssl_protocols TLSv1.2 TLSv1.3;');
    expect(conf).toContain('    ssl_session_cache shared:example_ssl:10m;');
    expect(body(conf)).not.toContain('Strict-Transport-Security');
    toggle('开启 HSTS');
    conf = showConf();
    expect(conf).toContain('add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;');
    expect(fieldInput('HSTS max-age')).toHaveValue('31536000');
  });

  test('关闭 HTTP 跳转后不再生成 80 跳转块', () => {
    setup();
    toggle('开启 HTTPS');
    toggle('HTTP 跳转 HTTPS');
    const conf = body(showConf());
    expect(conf).not.toContain('# HTTP 跳转 HTTPS');
    expect(conf).toContain('已开启 HTTPS 但未开启 HTTP 跳转');
  });

  test('站点标识为空时报错并禁用复制 / 保存', () => {
    setup();
    setField('站点标识', '');
    expect(view()).toContain('校验未通过, 请检查以下问题:');
    expect(view()).toContain('请填写站点标识');
    expect(btn('复制配置')).toBeDisabled();
    expect(btn('保存为 .conf')).toBeDisabled();
    expect(showConf()).toBe('');
  });

  test('域名 / 端口 / 根目录非法时报错', () => {
    setup();
    setField('域名', 'bad$name');
    expect(view()).toContain('域名格式不正确 (支持 example.com / *.example.com / _)');
    setField('监听端口', '70000');
    expect(view()).toContain('监听端口必须是 1-65535');
    setField('网站根目录', 'var/www');
    expect(view()).toContain('网站根目录必须是绝对路径');
  });

  test('站点类型: SPA 回退到入口文件', () => {
    setup();
    selectOption('站点类型', 'SPA 单页应用');
    const conf = showConf();
    expect(conf).toContain('        try_files $uri $uri/ /index.html;');
    expect(conf).toContain('SPA 回退会把不存在的路径都交给入口文件');
  });

  test('站点类型: PHP 生成 fastcgi 配置与页面缓存', () => {
    setup();
    selectOption('站点类型', 'PHP 网站');
    expect(view()).toContain('FastCGI 地址');
    let conf = showConf();
    expect(conf).toContain('    location ~ \\.php$ {');
    expect(conf).toContain('        fastcgi_pass unix:/run/php/php-fpm.sock;');
    expect(conf).toContain('        include fastcgi_params;');
    expect(conf).toContain('        fastcgi_param SCRIPT_FILENAME /var/www/example$fastcgi_script_name;');
    expect(conf).toContain('FastCGI 地址需与 PHP-FPM 监听配置一致');
    toggle('开启 PHP 页面缓存');
    conf = showConf();
    expect(conf).toContain('fastcgi_cache_path /var/cache/nginx/example_fcgi');
    expect(conf).toContain('        fastcgi_cache example_fcgi;');
    expect(conf).toContain('        fastcgi_cache_valid 200 301 302 15m;');
  });

  test('站点类型: 反向代理生成 upstream 与代理头', () => {
    setup();
    selectOption('站点类型', '反向代理');
    expect(view()).toContain('后端地址');
    let conf = showConf();
    expect(conf).toContain('upstream example_backend {');
    expect(conf).toContain('    server 127.0.0.1:8080;');
    expect(conf).toContain('    keepalive 32;');
    expect(conf).toContain('        proxy_pass http://example_backend;');
    expect(conf).toContain('        proxy_set_header Host $host;');
    expect(conf).toContain('        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;');
    expect(conf).toContain('        proxy_set_header Connection "";');
    expect(conf).toContain('        proxy_connect_timeout 60s;');
    expect(conf).toContain('后端需信任 X-Forwarded-* 头');
    toggle('支持 WebSocket');
    conf = showConf();
    expect(conf).toContain('        proxy_set_header Upgrade $http_upgrade;');
    expect(conf).toContain('        proxy_set_header Connection "upgrade";');
    expect(conf).toContain('        proxy_read_timeout 3600s;');
    setField('后端地址', 'http://10.0.0.1:8080\nhttps://10.0.0.2:8443');
    setField('代理超时', '120s');
    conf = showConf();
    expect(conf).toContain('    server 10.0.0.1:8080;');
    expect(conf).toContain('    server 10.0.0.2:8443;');
    expect(conf).toContain('        proxy_connect_timeout 120s;');
  });

  test('反向代理: 后端地址非法与代理缓存', () => {
    setup();
    selectOption('站点类型', '反向代理');
    setField('后端地址', '127.0.0.1:8080');
    expect(view()).toContain('后端地址格式不正确 (如 http://127.0.0.1:8080)');
    setField('后端地址', 'http://127.0.0.1:8080');
    toggle('开启代理缓存');
    const conf = showConf();
    expect(conf).toContain('proxy_cache_path /var/cache/nginx/example levels=1:2 keys_zone=example_cache:10m');
    expect(conf).toContain('    proxy_cache example_cache;');
    expect(conf).toContain('    proxy_cache_valid 200 302 10m;');
  });

  test('静态资源缓存时间可关闭', () => {
    setup();
    selectOption('静态资源缓存时间', '不设置');
    const conf = body(showConf());
    expect(conf).not.toContain('静态资源缓存');
    expect(conf).not.toContain('expires 30d;');
    expect(conf).toContain('    location / {');
  });

  test('防盗链开启后生成 referer 校验', () => {
    setup();
    toggle('图片防盗链');
    setField('允许的来源域名', 'a.com www.a.com');
    const conf = showConf();
    expect(conf).toContain('    location ~* \\.(jpg|jpeg|png|gif|webp|avif|svg|ico|bmp|mp4|webm|flv|mp3|m4a)$ {');
    expect(conf).toContain('        valid_referers none blocked server_names a.com www.a.com;');
    expect(conf).toContain('        if ($invalid_referer) {');
    expect(conf).toContain('            return 403;');
  });

  test('开启 CORS 生成 OPTIONS 预检响应', () => {
    setup();
    toggle('允许跨域 (CORS)');
    let conf = showConf();
    expect(conf).toContain('    add_header Access-Control-Allow-Origin "https://example.com" always;');
    expect(conf).toContain('    add_header Access-Control-Allow-Credentials "true" always;');
    expect(conf).toContain('    if ($request_method = OPTIONS) {');
    expect(conf).toContain('        add_header Access-Control-Max-Age "86400" always;');
    expect(conf).toContain('        return 204;');
    setField('允许的跨域来源', '*');
    conf = showConf();
    expect(conf).toContain('    add_header Access-Control-Allow-Origin "*" always;');
    expect(body(conf)).not.toContain('Access-Control-Allow-Credentials');
  });

  test('限流与连接限制', () => {
    setup();
    toggle('请求限流');
    setField('限流速率', '20r/s');
    toggle('连接数限制');
    const conf = showConf();
    expect(conf).toContain('limit_req_zone $binary_remote_addr zone=example_req:10m rate=20r/s;');
    expect(conf).toContain('    limit_req zone=example_req burst=20 nodelay;');
    expect(conf).toContain('limit_conn_zone $binary_remote_addr zone=example_conn:10m;');
    expect(conf).toContain('    limit_conn example_conn 20;');
    expect(conf).toContain('文件开头的 upstream / limit_req_zone / 缓存路径属于 http 上下文');
    setField('限流速率', '20');
    expect(view()).toContain('限流速率格式不正确 (如 10r/s 或 30r/m)');
  });

  test('IP 白名单与黑名单', () => {
    setup();
    selectOption('IP 访问控制', /白名单/);
    setField('IP 列表', '10.0.0.0/8\n1.2.3.4');
    let conf = showConf();
    expect(conf).toContain('    allow 10.0.0.0/8;');
    expect(conf).toContain('    allow 1.2.3.4;');
    expect(conf).toContain('    deny all;');
    expect(conf).toContain('allow / deny 按顺序匹配');
    setField('IP 列表', '1.2.3.4');
    expect(view()).not.toContain('IP 列表存在格式不正确的条目');
    setField('IP 列表', '1.2.3.999');
    expect(view()).toContain('IP 列表存在格式不正确的条目');
  });

  test('安全开关与其它选项', () => {
    setup();
    toggle('隐藏版本号');
    toggle('安全响应头');
    setField('404 页面路径', '');
    let conf = body(showConf());
    expect(conf).not.toContain('server_tokens off;');
    expect(conf).not.toContain('X-Frame-Options');
    expect(conf).not.toContain('error_page');
    tab('配置');
    toggle('开启 Basic Auth');
    toggle('只放行 GET/POST/HEAD');
    toggle('拦截采集 UA');
    conf = showConf();
    expect(conf).toContain('    auth_basic "Restricted";');
    expect(conf).toContain('    auth_basic_user_file /etc/nginx/.htpasswd;');
    expect(conf).toContain('    if ($request_method !~ ^(GET|POST|HEAD)$) {');
    expect(conf).toContain('    if ($http_user_agent ~* (SemrushBot|AhrefsBot');
    expect(conf).toContain('        return 405;');
    expect(conf).toContain('        return 403;');
  });

  test('整站 301 跳转只保留跳转 server', () => {
    setup();
    setField('整站 301 跳转到', 'https://new.example.com');
    const conf = body(showConf());
    expect(conf).toContain('    # 整站 301 跳转到 https://new.example.com');
    expect(conf).toContain('    return 301 https://new.example.com$request_uri;');
    expect(conf).not.toContain('        try_files $uri $uri/ =404;');
    setField('整站 301 跳转到', 'new.example.com');
    expect(view()).toContain('整站跳转地址格式不正确 (如 https://new.example.com)');
  });

  test('场景示例: HTTPS 全站优化', () => {
    setup();
    selectOption('场景示例', 'HTTPS 全站优化');
    expect(notice()).toContain('已应用示例: HTTPS 全站优化');
    const conf = showConf();
    expect(conf).toContain('    listen 443 ssl http2;');
    expect(conf).toContain('Strict-Transport-Security');
  });

  test('场景示例: 图片站防盗链', () => {
    setup();
    selectOption('场景示例', '图片站防盗链');
    const conf = showConf();
    expect(conf).toContain('        valid_referers none blocked server_names example.com www.example.com;');
    expect(conf).toContain('        gzip_static on;');
  });

  test('内置场景示例均可生成配置', () => {
    setup();
    for (const name of [ '静态网站 (通用优化)', 'SPA 单页应用 (前端路由)', 'PHP 建站 (WordPress)', '反向代理 (含 WebSocket)', '接口转发 + CORS' ]) {
      selectOption('场景示例', name);
      expect(view()).not.toContain('校验未通过, 请检查以下问题:');
      expect(showConf()).toContain('server {');
      tab('配置');
    }
  });

  test('重置恢复默认配置', () => {
    setup();
    toggle('开启 HTTPS');
    selectOption('场景示例', 'HTTPS 全站优化');
    fireEvent.click(btn('重置'));
    expect(fieldInput('站点标识')).toHaveValue('example');
    expect(view()).not.toContain('证书路径');
  });

  test('复制配置 / 复制代码行', async () => {
    setup();
    const conf = showConf();
    fireEvent.click(btn('复制配置'));
    expect(writeText()).toHaveBeenCalledWith(expect.stringContaining('server_name example.com www.example.com;'));
    await waitFor(() => expect(notice()).toContain('已复制到粘贴板'));
    expect(conf).toContain('    location = /favicon.ico {');
    const line = screen.getAllByText('listen 80;', { exact: false })[0];
    fireEvent.click(line);
    expect(writeText()).toHaveBeenCalledTimes(2);
  });

  test('保存为 .conf 调用保存接口', () => {
    setup();
    showConf();
    fireEvent.click(btn('保存为 .conf'));
    expect(mockSave).toHaveBeenCalledWith('example.conf', expect.stringContaining('# example.conf —'), '保存为 .conf', {
      filterName: 'Nginx 配置', extensions: [ 'conf' ],
    });
  });
});
