import { Alert, Button, Checkbox, Divider, Input, Select, Space, Tabs, Tooltip, Typography, message } from 'antd';
import { ClearOutlined, CopyOutlined, SaveOutlined } from '@ant-design/icons';
import { useMemo, useState, type ReactNode } from 'react';
import { copyTextToClipboard } from '../../lib';
import { saveTextFile } from '../../lib/tauri';
import { useLocale } from '../../hook/locale-context';
import { ngr, ngrT } from './lang';
import {
  DEFAULT_NGINX_CONFIG, EXPIRES_OPTIONS, GZIP_LEVELS, IP_MODES, NGINX_MODES, NGINX_PRESETS,
} from './data';
import { buildNginxPlan } from './build';
import type { NginxConfig } from './lib';

const { Text } = Typography;

/** 校验错误码 -> 提示文案 */
const ERROR_TEXT: Record<string, string> = {
  'site-name': '请填写站点标识',
  'server-name': '请填写域名',
  'server-name-format': '域名格式不正确 (支持 example.com / *.example.com / _)',
  'listen-port': '监听端口必须是 1-65535',
  'https-cert': '开启 HTTPS 需要填写证书路径',
  'https-cert-path': '证书路径必须是绝对路径',
  'https-key': '开启 HTTPS 需要填写私钥路径',
  'https-key-path': '私钥路径必须是绝对路径',
  'redirect-to': '整站跳转地址格式不正确 (如 https://new.example.com)',
  root: '请填写网站根目录',
  'root-path': '网站根目录必须是绝对路径',
  upstream: '请填写后端地址 (每行一个)',
  'upstream-format': '后端地址格式不正确 (如 http://127.0.0.1:8080)',
  'proxy-timeout': '代理超时格式不正确 (如 60s)',
  'proxy-cache-time': '代理缓存时间必须带单位 (如 10m / 1h)',
  fastcgi: '请填写 FastCGI 地址',
  'fastcgi-format': 'FastCGI 地址格式不正确 (unix:/path 或 127.0.0.1:9000)',
  'php-root': '请填写 PHP 根目录',
  'php-root-path': 'PHP 根目录必须是绝对路径',
  'fastcgi-cache-time': 'PHP 缓存时间必须带单位 (如 15m)',
  'gzip-level': 'gzip 压缩级别必须是 1-9',
  'expires-format': '静态缓存时间必须带单位 (如 30d)',
  'charset-format': '字符集格式不正确 (如 utf-8)',
  'index-format': '默认首页只能包含文件名, 空格分隔',
  'keepalive-timeout': '长连接超时格式不正确 (如 65)',
  'client-max-body': '上传体积上限格式不正确 (如 20m / 2g)',
  'hsts-needs-https': 'HSTS 需要先开启 HTTPS',
  'hsts-max-age': 'HSTS max-age 必须是数字 (单位秒)',
  'anti-leech-domains': '防盗链需要填写允许的来源域名',
  'cors-origin': '跨域需要填写允许的来源 (如 https://a.com 或 *)',
  'auth-file': '请填写 htpasswd 文件路径',
  'auth-file-path': 'htpasswd 文件路径必须是绝对路径',
  'ip-list': '请填写 IP 列表 (每行一个)',
  'ip-list-format': 'IP 列表存在格式不正确的条目',
  'limit-rate': '限流速率格式不正确 (如 10r/s 或 30r/m)',
  'limit-burst': '突发请求数必须是数字',
  'limit-conn': '单 IP 连接数必须是数字',
  'error-page-path': '404 页面路径必须是绝对路径 (如 /404.html)',
};

/** 提示码 -> 文案 */
const WARN_TEXT: Record<string, string> = {
  'need-include': '需确认主配置 nginx.conf 的 http 块中已 include 本文件所在目录',
  'need-reload': '修改后需执行 nginx -t 校验, 再 nginx -s reload 平滑生效',
  'site-name-sanitized': '站点标识含特殊字符, 已按清洗后的名称生成文件名与缓存 zone',
  'http-context': '文件开头的 upstream / limit_req_zone / 缓存路径属于 http 上下文, 必须由 http 块 include 才生效',
  'cache-dir': '缓存目录需要 nginx 运行用户可写, 建议挂载到数据盘并定期清理',
  'reset-headers': 'location 内的 add_header 会覆盖 server 级安全响应头 (nginx 行为), 如需同时生效请在 location 内重复添加',
  'hsts-once': 'HSTS 只需在一个站点开启, 重复下发会让回退 HTTP 变得困难',
  'spa-fallback': 'SPA 回退会把不存在的路径都交给入口文件, 接口路径请确保由后端或代理处理',
  'proxy-real-ip': '后端需信任 X-Forwarded-* 头, 否则日志与限流会拿到代理 IP',
  'php-socket': 'FastCGI 地址需与 PHP-FPM 监听配置一致 (socket 路径或 127.0.0.1:9000)',
  'ip-allow-order': 'allow / deny 按顺序匹配, 白名单最后需要 deny all (已自动添加)',
  'anti-leech-none': 'valid_referers 的 none 允许直接访问 (空 Referer), 如需严格防盗链可去掉',
  'anti-leech-no-expires': '防盗链已开启但未设置缓存时间, 图片不会带缓存响应头',
  'gzip-static-need-files': 'gzip_static 需要目录内已有同名 .gz 文件, 否则需要提前压缩',
  'http-not-redirect': '已开启 HTTPS 但未开启 HTTP 跳转, 80 端口将不再提供服务',
};

/** 字段容器 (标签在上, 控件在下) */
const Field = ({ label, children, width = 200 }: { label: ReactNode; children: ReactNode; width?: number }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width }}>
    <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
    {children}
  </div>
);

/** 分组标题 */
const Group = ({ title }: { title: string }) => (
  <Divider plain style={{ margin: '16px 0 10px' }}>
    <Text type="secondary" style={{ fontSize: 12 }}>{title}</Text>
  </Divider>
);

const NginxConfig = () => {
  const { locale } = useLocale();
  const t = (zh: string) => ngr(locale, zh);
  const tt = (zh: string, v?: Record<string, string | number>) => ngrT(locale, zh, v);
  const [ messageApi, contextHolder ] = message.useMessage();

  const [ cfg, setCfg ] = useState<NginxConfig>(DEFAULT_NGINX_CONFIG);
  const [ preset, setPreset ] = useState<string | undefined>(undefined);
  const [ tab, setTab ] = useState('config');

  const plan = useMemo(() => buildNginxPlan(cfg), [ cfg ]);
  const upd = (patch: Partial<NginxConfig>) => setCfg((c) => ({ ...c, ...patch }));
  const set = (key: keyof NginxConfig, value: string | boolean) =>
    upd({ [ key ]: value } as unknown as Partial<NginxConfig>);

  const copy = (value: string) => {
    if (value === '') return;
    copyTextToClipboard(value);
    messageApi.success(t('已复制到粘贴板'));
  };

  const applyPresetByName = (name: string) => {
    const hit = NGINX_PRESETS.find((p) => p.name === name);
    if (!hit) return;
    setCfg({ ...cfg, ...hit.config });
    setPreset(name);
    messageApi.success(tt('已应用示例: {name}', { name }));
  };

  const reset = () => {
    setCfg(DEFAULT_NGINX_CONFIG);
    setPreset(undefined);
  };

  const saveConf = async () => {
    const ok = await saveTextFile(plan.fileName, plan.conf, t('保存为 .conf'), {
      filterName: t('Nginx 配置'), extensions: [ 'conf' ],
    });
    if (ok) messageApi.success(t('保存成功'));
  };

  /** 文本输入 */
  const txt = (label: string, key: keyof NginxConfig, placeholder?: string, tip?: string) => (
    <Field label={tip === undefined ? label : <Tooltip title={t(tip)}>{label}</Tooltip>}>
      <Input value={String(cfg[key] ?? '')} placeholder={placeholder} onChange={(e) => set(key, e.target.value)} />
    </Field>
  );

  /** 多行输入 */
  const area = (label: string, key: keyof NginxConfig, placeholder?: string, tip?: string) => (
    <Field width={320} label={tip === undefined ? label : <Tooltip title={t(tip)}>{label}</Tooltip>}>
      <Input.TextArea
        value={String(cfg[key] ?? '')}
        placeholder={placeholder}
        autoSize={{ minRows: 2, maxRows: 4 }}
        onChange={(e) => set(key, e.target.value)}
      />
    </Field>
  );

  /** 复选项 (标签在右, 一行可排 6-8 个) */
  const cb = (label: string, key: keyof NginxConfig) => (
    <Checkbox checked={Boolean(cfg[key])} onChange={(e) => set(key, e.target.checked)}>{t(label)}</Checkbox>
  );

  /** 复选组 (按窗口宽度自适应换行) */
  const cbRow = (items: ReactNode) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', marginBottom: 10 }}>{items}</div>
  );

  /** 下拉选择 */
  const sel = (label: string, key: keyof NginxConfig, options: { value: string; label: string; title?: string }[]) => (
    <Field label={label}>
      <Select
        value={String(cfg[key] ?? '')}
        onChange={(v) => set(key, v)}
        options={options}
        style={{ width: '100%' }}
      />
    </Field>
  );

  /** 代码块 (逐行可点击复制) */
  const codeBlock = (title: string, lines: string[], hint?: string) => (
    <div style={{ marginBottom: 8 }}>
      <Space size={4} style={{ marginBottom: 2 }}>
        <Text strong style={{ fontSize: 13 }}>{title}</Text>
        <Button size="small" type="link" icon={<CopyOutlined />} onClick={() => copy(lines.join('\n'))}>{t('复制')}</Button>
        {hint !== undefined && <Text type="secondary" style={{ fontSize: 12 }}>{hint}</Text>}
      </Space>
      <div
        style={{
          background: '#23241f', color: '#f8f8f2', borderRadius: 6, padding: '6px 10px',
          fontFamily: 'Consolas, Monaco, monospace', fontSize: 12.5, lineHeight: 1.7,
          whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 420, overflow: 'auto',
        }}
      >
        {lines.map((line, i) => (
          <div key={`${i}-${line}`} title={t('点击复制')} style={{ cursor: 'pointer' }} onClick={() => copy(line)}>{line}</div>
        ))}
      </div>
    </div>
  );

  const isProxy = cfg.mode === 'proxy';
  const isPhp = cfg.mode === 'php';
  const invalid = plan.errors.length > 0;

  const configTab = (
    <div>
      <Space wrap size={[ 12, 12 ]} align="start">
        <Field label={t('场景示例')}>
          <Select
            value={preset}
            onChange={applyPresetByName}
            options={NGINX_PRESETS.map((p) => ({ value: p.name, label: p.name, title: p.desc }))}
            placeholder={t('请选择场景示例')}
            style={{ width: 220 }}
            allowClear
            onClear={reset}
          />
        </Field>
        {sel('站点类型', 'mode', NGINX_MODES.map((m) => ({ value: m.value, label: m.label, title: m.hint })))}
      </Space>

      <Group title={t('基础站点')} />
      <Space wrap size={[ 12, 12 ]} align="start">
        {txt('站点标识', 'siteName', 'example', '用于文件名 / upstream / 缓存 zone, 非法字符会替换为下划线')}
        {txt('域名', 'serverName', 'example.com www.example.com', '空格分隔多个, 支持 *.example.com')}
        {txt('监听端口', 'listenPort', '80')}
        {txt('网站根目录', 'root', '/var/www/example')}
        {txt('默认首页', 'index', 'index.html index.htm')}
        {txt('字符集', 'charset', 'utf-8')}
      </Space>
      {cbRow(<>{cb('访问日志', 'accessLog')}{cb('错误日志', 'errorLog')}</>)}

      <Group title={t('HTTPS 与 TLS')} />
      {cbRow(
        <>
          {cb('开启 HTTPS', 'https')}
          {cfg.https && cb('HTTP 跳转 HTTPS', 'redirectHttps')}
          {cfg.https && cb('开启 HTTP/2', 'http2')}
          {cfg.https && cb('开启 HSTS', 'hsts')}
        </>,
      )}
      <Space wrap size={[ 12, 12 ]} align="start">
        {cfg.https && txt('证书路径', 'certFile', '/etc/nginx/ssl/example.com.crt')}
        {cfg.https && txt('私钥路径', 'keyFile', '/etc/nginx/ssl/example.com.key')}
        {cfg.https && cfg.hsts && txt('HSTS max-age', 'hstsMaxAge', '31536000')}
      </Space>

      {(isProxy || isPhp) && <Group title={isProxy ? t('反向代理设置') : t('PHP 设置')} />}
      {isProxy && (
        <>
          {cbRow(
            <>
              {cb('透传 Host 头', 'keepHost')}
              {cb('支持 WebSocket', 'websocket')}
              {cb('透传真实 IP 头', 'realIp')}
              {cb('upstream keepalive', 'upstreamKeepalive')}
              {cb('开启代理缓存', 'proxyCache')}
            </>,
          )}
          <Space wrap size={[ 12, 12 ]} align="start">
            {area('后端地址', 'upstream', 'http://127.0.0.1:8080', '每行一个, 支持 http://host:port 与 unix:/path')}
            {txt('代理超时', 'proxyTimeout', '60s')}
            {cfg.proxyCache && txt('代理缓存时间', 'proxyCacheTime', '10m')}
          </Space>
        </>
      )}
      {isPhp && (
        <>
          {cbRow(cb('开启 PHP 页面缓存', 'fastcgiCache'))}
          <Space wrap size={[ 12, 12 ]} align="start">
            {txt('FastCGI 地址', 'fastcgi', 'unix:/run/php/php-fpm.sock')}
            {txt('PHP 根目录', 'phpRoot', '/var/www/example')}
            {cfg.fastcgiCache && txt('PHP 缓存时间', 'fastcgiCacheTime', '15m')}
          </Space>
        </>
      )}

      <Group title={t('性能优化')} />
      {cbRow(
        <>
          {cb('开启 gzip 压缩', 'gzip')}
          {cfg.gzip && cb('压缩常见类型', 'gzipTypes')}
          {cb('Cache-Control immutable', 'cacheImmutable')}
          {cb('sendfile 零拷贝', 'sendfile')}
          {cb('文件句柄缓存', 'openFileCache')}
          {cb('优先使用 .gz 预压缩文件', 'gzipStatic')}
        </>,
      )}
      <Space wrap size={[ 12, 12 ]} align="start">
        {cfg.gzip && sel('压缩级别', 'gzipLevel', GZIP_LEVELS.map((l) => ({ value: l, label: l })))}
        {sel('静态资源缓存时间', 'expires', [
          { value: '', label: t('不设置') },
          ...EXPIRES_OPTIONS.map((v) => ({ value: v, label: v })),
        ])}
        {txt('长连接超时', 'keepaliveTimeout', '65')}
        {txt('上传体积上限', 'clientMaxBody', '20m')}
      </Space>

      <Group title={t('安全加固')} />
      {cbRow(
        <>
          {cb('隐藏版本号', 'serverTokensOff')}
          {cb('禁止访问隐藏文件', 'denyHidden')}
          {cb('禁止访问备份文件', 'denyBackup')}
          {cb('安全响应头', 'securityHeaders')}
          {cb('拦截采集 UA', 'denyUa')}
          {cb('只放行 GET/POST/HEAD', 'limitMethods')}
          {cb('开启 Basic Auth', 'basicAuth')}
        </>,
      )}
      <Space wrap size={[ 12, 12 ]} align="start">
        {cfg.basicAuth && txt('htpasswd 文件', 'authFile', '/etc/nginx/.htpasswd')}
        {sel('IP 访问控制', 'ipMode', IP_MODES.map((m) => ({ value: m.value, label: m.label })))}
        {cfg.ipMode !== 'off' && area('IP 列表', 'ipList', '10.0.0.0/8\n1.2.3.4', '每行一个, 支持 CIDR / IPv6 / all')}
      </Space>

      <Group title={t('限流与连接限制')} />
      {cbRow(
        <>
          {cb('请求限流', 'limitReq')}
          {cfg.limitReq && cb('超限直接拒绝 (nodelay)', 'limitNoDelay')}
          {cb('连接数限制', 'limitConn')}
        </>,
      )}
      <Space wrap size={[ 12, 12 ]} align="start">
        {cfg.limitReq && txt('限流速率', 'limitRate', '10r/s')}
        {cfg.limitReq && txt('突发请求数', 'limitBurst', '20')}
        {cfg.limitConn && txt('单 IP 连接数', 'limitConnNum', '20')}
      </Space>

      <Group title={t('防盗链与跨域')} />
      {cbRow(<>{cb('图片防盗链', 'antiLeech')}{cb('允许跨域 (CORS)', 'cors')}</>)}
      <Space wrap size={[ 12, 12 ]} align="start">
        {cfg.antiLeech && txt('允许的来源域名', 'antiLeechDomains', 'example.com www.example.com')}
        {cfg.cors && txt('允许的跨域来源', 'corsOrigin', 'https://a.com')}
      </Space>

      <Group title={t('其它')} />
      <Space wrap size={[ 12, 12 ]} align="start">
        {txt('整站 301 跳转到', 'redirectTo', 'https://new.example.com')}
        {txt('404 页面路径', 'errorPage', '/404.html')}
      </Space>
    </div>
  );

  const resultTab = invalid ? null : (
    <div>
      {plan.warnings.length > 0 && (
        <Alert
          style={{ marginBottom: 10 }}
          type="warning"
          showIcon
          message={(
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {plan.warnings.map((code) => <li key={code}>{t(WARN_TEXT[code] ?? code)}</li>)}
            </ul>
          )}
        />
      )}
      {codeBlock(t('配置文件内容'), plan.conf.split('\n'), plan.fileName)}
      {codeBlock(t('部署到 vhost 目录的步骤'), plan.deploy)}
    </div>
  );

  return (
    <div>
      {contextHolder}
      {invalid && (
        <Alert
          style={{ marginBottom: 12 }}
          type="error"
          showIcon
          message={t('校验未通过, 请检查以下问题:')}
          description={(
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {plan.errors.map((code) => <li key={code}>{t(ERROR_TEXT[code] ?? code)}</li>)}
            </ul>
          )}
        />
      )}

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'config', label: <Text>{t('配置')}</Text>, children: configTab },
          { key: 'result', label: <Text>{t('生成的配置')}</Text>, children: resultTab },
        ]}
      />

      <Space wrap style={{ marginTop: 12 }}>
        <Button onClick={reset} icon={<ClearOutlined />}>{t('重置')}</Button>
        <Button icon={<CopyOutlined />} disabled={invalid} onClick={() => copy(plan.conf)}>{t('复制配置')}</Button>
        <Button icon={<SaveOutlined />} disabled={invalid} onClick={saveConf}>{t('保存为 .conf')}</Button>
      </Space>
    </div>
  );
};

export default NginxConfig;
