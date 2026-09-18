// NginxConfig 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "nginx 設定" },
  en: { appName: "nginx Config" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const nginxlangRows: Record<string, [string, string]> = {
  // 页签与按钮
  '配置': ['設定', 'Config'],
  '生成的配置': ['產生的設定', 'Generated config'],
  '重置': ['重設', 'Reset'],
  '复制配置': ['複製設定', 'Copy config'],
  '保存为 .conf': ['儲存為 .conf', 'Save as .conf'],
  '复制': ['複製', 'Copy'],
  '点击复制': ['點擊複製', 'Click to copy'],
  '已复制到粘贴板': ['已複製到剪貼簿', 'Copied to clipboard'],
  '保存成功': ['儲存成功', 'Saved'],
  'Nginx 配置': ['Nginx 設定', 'Nginx config'],
  '配置文件内容': ['設定檔內容', 'Config file'],
  '部署到 vhost 目录的步骤': ['部署到 vhost 目錄的步驟', 'Deploy steps for the vhost directory'],
  '校验未通过, 请检查以下问题:': ['驗證未通過, 請檢查以下問題:', 'Validation failed, please check:'],

  // 基础
  '场景示例': ['場景範例', 'Preset'],
  '请选择场景示例': ['請選擇場景範例', 'Select a preset'],
  '已应用示例: {name}': ['已套用範例: {name}', 'Preset applied: {name}'],
  '站点类型': ['站點類型', 'Site type'],
  '基础站点': ['基礎站點', 'Basic site'],
  '站点标识': ['站點識別', 'Site id'],
  '用于文件名 / upstream / 缓存 zone, 非法字符会替换为下划线': ['用於檔名 / upstream / 快取 zone, 非法字元會替換為底線', 'Used for the file name / upstream / cache zone — invalid characters become underscores'],
  '域名': ['網域', 'Domain'],
  '空格分隔多个, 支持 *.example.com': ['空格分隔多個, 支援 *.example.com', 'Space separated, *.example.com supported'],
  '监听端口': ['監聽埠', 'Listen port'],
  '网站根目录': ['網站根目錄', 'Web root'],
  '默认首页': ['預設首頁', 'Index files'],
  '字符集': ['字元集', 'Charset'],
  '访问日志': ['存取日誌', 'Access log'],
  '错误日志': ['錯誤日誌', 'Error log'],

  // HTTPS
  'HTTPS 与 TLS': ['HTTPS 與 TLS', 'HTTPS & TLS'],
  '开启 HTTPS': ['開啟 HTTPS', 'Enable HTTPS'],
  '证书路径': ['憑證路徑', 'Certificate path'],
  '私钥路径': ['私鑰路徑', 'Private key path'],
  'HTTP 跳转 HTTPS': ['HTTP 跳轉 HTTPS', 'Redirect HTTP to HTTPS'],
  '开启 HTTP/2': ['開啟 HTTP/2', 'Enable HTTP/2'],
  '开启 HSTS': ['開啟 HSTS', 'Enable HSTS'],
  'HSTS max-age': ['HSTS max-age', 'HSTS max-age'],

  // 站点类型专属
  '反向代理设置': ['反向代理設定', 'Reverse proxy'],
  '后端地址': ['後端位址', 'Backend upstream'],
  '每行一个, 支持 http://host:port 与 unix:/path': ['每行一個, 支援 http://host:port 與 unix:/path', 'One per line — http://host:port or unix:/path'],
  '透传 Host 头': ['透傳 Host 標頭', 'Pass through Host header'],
  '支持 WebSocket': ['支援 WebSocket', 'Support WebSocket'],
  '透传真实 IP 头': ['透傳真實 IP 標頭', 'Pass real client IP headers'],
  'upstream keepalive': ['upstream keepalive', 'upstream keepalive'],
  '代理超时': ['代理逾時', 'Proxy timeout'],
  '开启代理缓存': ['開啟代理快取', 'Enable proxy cache'],
  '代理缓存时间': ['代理快取時間', 'Proxy cache time'],
  'PHP 设置': ['PHP 設定', 'PHP'],
  'FastCGI 地址': ['FastCGI 位址', 'FastCGI address'],
  'PHP 根目录': ['PHP 根目錄', 'PHP root'],
  '开启 PHP 页面缓存': ['開啟 PHP 頁面快取', 'Enable PHP page cache'],
  'PHP 缓存时间': ['PHP 快取時間', 'PHP cache time'],

  // 性能
  '性能优化': ['效能最佳化', 'Performance'],
  '开启 gzip 压缩': ['開啟 gzip 壓縮', 'Enable gzip'],
  '压缩级别': ['壓縮級別', 'Compression level'],
  '压缩常见类型': ['壓縮常見類型', 'Compress common MIME types'],
  '静态资源缓存时间': ['靜態資源快取時間', 'Static asset cache time'],
  '不设置': ['不設定', 'Disabled'],
  'Cache-Control immutable': ['Cache-Control immutable', 'Cache-Control immutable'],
  'sendfile 零拷贝': ['sendfile 零拷貝', 'sendfile zero-copy'],
  '长连接超时': ['長連線逾時', 'Keepalive timeout'],
  '上传体积上限': ['上傳體積上限', 'Client max body size'],
  '文件句柄缓存': ['檔案句柄快取', 'File handle cache'],
  '优先使用 .gz 预压缩文件': ['優先使用 .gz 預壓縮檔案', 'Prefer precompressed .gz files'],

  // 安全
  '安全加固': ['安全加固', 'Security'],
  '隐藏版本号': ['隱藏版本號', 'Hide version'],
  '禁止访问隐藏文件': ['禁止存取隱藏檔案', 'Block hidden files'],
  '禁止访问备份文件': ['禁止存取備份檔案', 'Block backup files'],
  '安全响应头': ['安全回應標頭', 'Security headers'],
  '拦截采集 UA': ['攔截採集 UA', 'Block scraper UAs'],
  '只放行 GET/POST/HEAD': ['只放行 GET/POST/HEAD', 'Allow only GET/POST/HEAD'],
  '开启 Basic Auth': ['開啟 Basic Auth', 'Enable Basic Auth'],
  'htpasswd 文件': ['htpasswd 檔案', 'htpasswd file'],
  'IP 访问控制': ['IP 存取控制', 'IP access control'],
  'IP 列表': ['IP 清單', 'IP list'],
  '每行一个, 支持 CIDR / IPv6 / all': ['每行一個, 支援 CIDR / IPv6 / all', 'One per line — CIDR / IPv6 / all'],

  // 限流
  '限流与连接限制': ['限流與連線限制', 'Rate & connection limits'],
  '请求限流': ['請求限流', 'Request rate limit'],
  '限流速率': ['限流速率', 'Rate'],
  '突发请求数': ['突發請求數', 'Burst'],
  '超限直接拒绝 (nodelay)': ['超限直接拒絕 (nodelay)', 'Reject immediately (nodelay)'],
  '连接数限制': ['連線數限制', 'Connection limit'],
  '单 IP 连接数': ['單 IP 連線數', 'Connections per IP'],

  // 防盗链 / 跨域
  '防盗链与跨域': ['防盜連與跨域', 'Hotlink & CORS'],
  '图片防盗链': ['圖片防盜連', 'Image hotlink protection'],
  '允许的来源域名': ['允許的來源網域', 'Allowed referer domains'],
  '允许跨域 (CORS)': ['允許跨域 (CORS)', 'Enable CORS'],
  '允许的跨域来源': ['允許的跨域來源', 'Allowed CORS origin'],

  // 其它
  '其它': ['其它', 'Others'],
  '整站 301 跳转到': ['整站 301 跳轉到', 'Site-wide 301 to'],
  '404 页面路径': ['404 頁面路徑', '404 page path'],

  // 错误提示
  '请填写站点标识': ['請填寫站點識別', 'Site id is required'],
  '请填写域名': ['請填寫網域', 'Domain is required'],
  '域名格式不正确 (支持 example.com / *.example.com / _)': ['網域格式不正確 (支援 example.com / *.example.com / _)', 'Invalid domain (use example.com / *.example.com / _)'],
  '监听端口必须是 1-65535': ['監聽埠必須是 1-65535', 'Listen port must be 1-65535'],
  '开启 HTTPS 需要填写证书路径': ['開啟 HTTPS 需要填寫憑證路徑', 'Certificate path is required for HTTPS'],
  '证书路径必须是绝对路径': ['憑證路徑必須是絕對路徑', 'Certificate path must be absolute'],
  '开启 HTTPS 需要填写私钥路径': ['開啟 HTTPS 需要填寫私鑰路徑', 'Private key path is required for HTTPS'],
  '私钥路径必须是绝对路径': ['私鑰路徑必須是絕對路徑', 'Private key path must be absolute'],
  '整站跳转地址格式不正确 (如 https://new.example.com)': ['整站跳轉位址格式不正確 (如 https://new.example.com)', 'Invalid redirect target (e.g. https://new.example.com)'],
  '请填写网站根目录': ['請填寫網站根目錄', 'Web root is required'],
  '网站根目录必须是绝对路径': ['網站根目錄必須是絕對路徑', 'Web root must be absolute'],
  '请填写后端地址 (每行一个)': ['請填寫後端位址 (每行一個)', 'Backend upstream is required (one per line)'],
  '后端地址格式不正确 (如 http://127.0.0.1:8080)': ['後端位址格式不正確 (如 http://127.0.0.1:8080)', 'Invalid upstream (e.g. http://127.0.0.1:8080)'],
  '代理超时格式不正确 (如 60s)': ['代理逾時格式不正確 (如 60s)', 'Invalid proxy timeout (e.g. 60s)'],
  '代理缓存时间必须带单位 (如 10m / 1h)': ['代理快取時間必須帶單位 (如 10m / 1h)', 'Proxy cache time needs a unit (e.g. 10m / 1h)'],
  '请填写 FastCGI 地址': ['請填寫 FastCGI 位址', 'FastCGI address is required'],
  'FastCGI 地址格式不正确 (unix:/path 或 127.0.0.1:9000)': ['FastCGI 位址格式不正確 (unix:/path 或 127.0.0.1:9000)', 'Invalid FastCGI address (unix:/path or 127.0.0.1:9000)'],
  '请填写 PHP 根目录': ['請填寫 PHP 根目錄', 'PHP root is required'],
  'PHP 根目录必须是绝对路径': ['PHP 根目錄必須是絕對路徑', 'PHP root must be absolute'],
  'PHP 缓存时间必须带单位 (如 15m)': ['PHP 快取時間必須帶單位 (如 15m)', 'PHP cache time needs a unit (e.g. 15m)'],
  'gzip 压缩级别必须是 1-9': ['gzip 壓縮級別必須是 1-9', 'gzip level must be 1-9'],
  '静态缓存时间必须带单位 (如 30d)': ['靜態快取時間必須帶單位 (如 30d)', 'Static cache time needs a unit (e.g. 30d)'],
  '字符集格式不正确 (如 utf-8)': ['字元集格式不正確 (如 utf-8)', 'Invalid charset (e.g. utf-8)'],
  '默认首页只能包含文件名, 空格分隔': ['預設首頁只能包含檔名, 空格分隔', 'Index files must be file names separated by spaces'],
  '长连接超时格式不正确 (如 65)': ['長連線逾時格式不正確 (如 65)', 'Invalid keepalive timeout (e.g. 65)'],
  '上传体积上限格式不正确 (如 20m / 2g)': ['上傳體積上限格式不正確 (如 20m / 2g)', 'Invalid body size (e.g. 20m / 2g)'],
  'HSTS 需要先开启 HTTPS': ['HSTS 需要先開啟 HTTPS', 'HSTS requires HTTPS'],
  'HSTS max-age 必须是数字 (单位秒)': ['HSTS max-age 必須是數字 (單位秒)', 'HSTS max-age must be a number (seconds)'],
  '防盗链需要填写允许的来源域名': ['防盜連需要填寫允許的來源網域', 'Hotlink protection needs allowed referer domains'],
  '跨域需要填写允许的来源 (如 https://a.com 或 *)': ['跨域需要填寫允許的來源 (如 https://a.com 或 *)', 'CORS needs an allowed origin (e.g. https://a.com or *)'],
  '请填写 htpasswd 文件路径': ['請填寫 htpasswd 檔案路徑', 'htpasswd file path is required'],
  'htpasswd 文件路径必须是绝对路径': ['htpasswd 檔案路徑必須是絕對路徑', 'htpasswd path must be absolute'],
  '请填写 IP 列表 (每行一个)': ['請填寫 IP 清單 (每行一個)', 'IP list is required (one per line)'],
  'IP 列表存在格式不正确的条目': ['IP 清單存在格式不正確的條目', 'IP list contains an invalid entry'],
  '限流速率格式不正确 (如 10r/s 或 30r/m)': ['限流速率格式不正確 (如 10r/s 或 30r/m)', 'Invalid rate (e.g. 10r/s or 30r/m)'],
  '突发请求数必须是数字': ['突發請求數必須是數字', 'Burst must be a number'],
  '单 IP 连接数必须是数字': ['單 IP 連線數必須是數字', 'Connections per IP must be a number'],
  '404 页面路径必须是绝对路径 (如 /404.html)': ['404 頁面路徑必須是絕對路徑 (如 /404.html)', '404 page path must be absolute (e.g. /404.html)'],

  // 提示
  '需确认主配置 nginx.conf 的 http 块中已 include 本文件所在目录': ['需確認主設定 nginx.conf 的 http 區塊中已 include 本檔案所在目錄', 'Make sure the http block of nginx.conf includes this file\'s directory'],
  '修改后需执行 nginx -t 校验, 再 nginx -s reload 平滑生效': ['修改後需執行 nginx -t 驗證, 再 nginx -s reload 平滑生效', 'Run nginx -t then nginx -s reload to apply'],
  '站点标识含特殊字符, 已按清洗后的名称生成文件名与缓存 zone': ['站點識別含特殊字元, 已按清洗後的名稱產生檔名與快取 zone', 'Site id had special characters — file name and cache zones use the sanitized name'],
  '文件开头的 upstream / limit_req_zone / 缓存路径属于 http 上下文, 必须由 http 块 include 才生效': ['檔案開頭的 upstream / limit_req_zone / 快取路徑屬於 http 上下文, 必須由 http 區塊 include 才生效', 'The upstream / limit_req_zone / cache paths at the top belong to the http context — they only work when included from an http block'],
  '缓存目录需要 nginx 运行用户可写, 建议挂载到数据盘并定期清理': ['快取目錄需要 nginx 執行使用者可寫, 建議掛載到資料盤並定期清理', 'The cache directory must be writable by the nginx user — consider a data disk and periodic cleanup'],
  'location 内的 add_header 会覆盖 server 级安全响应头 (nginx 行为), 如需同时生效请在 location 内重复添加': ['location 內的 add_header 會覆蓋 server 級安全回應標頭 (nginx 行為), 如需同時生效請在 location 內重複加入', 'add_header inside a location overrides server-level security headers (nginx behavior) — repeat them in the location if you need both'],
  'HSTS 只需在一个站点开启, 重复下发会让回退 HTTP 变得困难': ['HSTS 只需在一個站點開啟, 重複下發會讓回退 HTTP 變得困難', 'Enable HSTS on one site only — repeated headers make falling back to HTTP hard'],
  'SPA 回退会把不存在的路径都交给入口文件, 接口路径请确保由后端或代理处理': ['SPA 回退會把不存在的路徑都交給入口檔案, 介面路徑請確保由後端或代理處理', 'The SPA fallback sends unknown paths to the entry file — make sure API paths are handled by the backend'],
  '后端需信任 X-Forwarded-* 头, 否则日志与限流会拿到代理 IP': ['後端需信任 X-Forwarded-* 標頭, 否則日誌與限流會拿到代理 IP', 'The backend must trust X-Forwarded-* headers, otherwise logs and limits see the proxy IP'],
  'FastCGI 地址需与 PHP-FPM 监听配置一致 (socket 路径或 127.0.0.1:9000)': ['FastCGI 位址需與 PHP-FPM 監聽設定一致 (socket 路徑或 127.0.0.1:9000)', 'The FastCGI address must match the PHP-FPM listen setting'],
  'allow / deny 按顺序匹配, 白名单最后需要 deny all (已自动添加)': ['allow / deny 依順序匹配, 白名單最後需要 deny all (已自動加入)', 'allow / deny match in order — allow lists need a trailing deny all (added automatically)'],
  'valid_referers 的 none 允许直接访问 (空 Referer), 如需严格防盗链可去掉': ['valid_referers 的 none 允許直接存取 (空 Referer), 如需嚴格防盜連可移除', 'The "none" keyword allows empty-Referer requests — remove it for strict protection'],
  '防盗链已开启但未设置缓存时间, 图片不会带缓存响应头': ['防盜連已開啟但未設定快取時間, 圖片不會帶快取回應標頭', 'Hotlink protection is on but no cache time is set — images get no cache headers'],
  'gzip_static 需要目录内已有同名 .gz 文件, 否则需要提前压缩': ['gzip_static 需要目錄內已有同名 .gz 檔案, 否則需要提前壓縮', 'gzip_static needs precompressed .gz files next to the originals'],
  '已开启 HTTPS 但未开启 HTTP 跳转, 80 端口将不再提供服务': ['已開啟 HTTPS 但未開啟 HTTP 跳轉, 80 埠將不再提供服務', 'HTTPS is on without HTTP redirect — port 80 will stop serving'],
};

// 取词: 无命中回退 zh 原文 (与项目其它语言包行为一致)
export const ngr = (locale: string, zh: string): string => {
  const e = nginxlangRows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const ngrT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = ngr(locale, zh);
  if (v) for (const [ k, val ] of Object.entries(v)) s = s.split('{' + k + '}').join(String(val));
  return s;
};
