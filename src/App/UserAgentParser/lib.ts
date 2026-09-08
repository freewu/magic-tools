// UA 解析器 纯逻辑层
// 从 User-Agent 字符串提取: 浏览器名称与版本 / 渲染引擎 / 操作系统 /
// CPU 架构 / 设备类型与型号, 并识别常见爬虫与命令行工具。

export interface UAInfo {
  raw: string;
  /** 浏览器/客户端名称 (爬虫等程序亦在此) */
  browserName: string;
  browserVersion: string;
  /** 渲染引擎: Blink / WebKit / Gecko / Trident / EdgeHTML / 未知 */
  engine: string;
  osName: string;
  osVersion: string;
  /** CPU 架构 (原始 UA 表述或通用名, 无则空串) */
  cpuArch: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'tv' | 'bot' | 'unknown';
  deviceModel: string;
  /** 若识别为爬虫/命令行等非浏览器程序, 给出名称; 否则 null */
  botName: string | null;
}

const BOTS: Array<[RegExp, string]> = [
  [/googlebot/i, 'Googlebot'],
  [/bingbot/i, 'Bingbot'],
  [/baiduspider/i, 'Baiduspider'],
  [/sogou (?:web )?spider/i, 'Sogou Spider'],
  [/yisouspider/i, 'YisouSpider'],
  [/360spider/i, '360Spider'],
  [/duckduckbot/i, 'DuckDuckBot'],
  [/(?:yahoo!|yahoo-)?slurp/i, 'Yahoo Slurp'],
  [/yandexbot/i, 'YandexBot'],
  [/facebookexternalhit|facebot/i, 'Facebook'],
  [/twitterbot/i, 'Twitterbot'],
  [/linkedinbot/i, 'LinkedInBot'],
  [/slackbot/i, 'Slackbot'],
  [/telegrambot/i, 'TelegramBot'],
  [/discordbot/i, 'Discordbot'],
  [/whatsapp/i, 'WhatsApp'],
  [/petalbot/i, 'PetalBot'],
  [/bytespider/i, 'ByteSpider'],
  [/mj12bot/i, 'MJ12Bot'],
  [/semrushbot/i, 'SemrushBot'],
  [/ahrefsbot/i, 'AhrefsBot'],
  [/curl/i, 'curl'],
  [/wget/i, 'Wget'],
  [/python-requests/i, 'Python Requests'],
  [/python-urllib/i, 'Python urllib'],
  [/PostmanRuntime/i, 'Postman'],
  [/apache-httpclient/i, 'Apache HttpClient'],
  [/okhttp/i, 'OkHttp'],
  [/Go-http-client/i, 'Go HTTP Client'],
  [/node-fetch/i, 'node-fetch'],
  [/axios/i, 'Axios'],
  [/Java\/[\d.]+/i, 'Java'],
  [/libwww-perl/i, 'libwww-perl'],
];

function first(re: RegExp, s: string): string {
  const m = re.exec(s);
  return m ? m[1] : '';
}

function matchVersion(s: string, token: string): string {
  const m = new RegExp(`${token}[ /]([\\d.]+)`).exec(s);
  return m ? m[1] : '';
}

/** Windows NT 版本 → 营销名 */
function windowsVersion(nt: string): string {
  switch (nt) {
    case '10.0': return '10 / 11';
    case '6.3': return '8.1';
    case '6.2': return '8';
    case '6.1': return '7';
    case '6.0': return 'Vista';
    case '5.1': return 'XP';
    case '5.2': return 'XP x64 / Server 2003';
    default: return nt;
  }
}

const MAC_VER_NAMES: Array<[string, string]> = [
  ['10.15', 'Catalina'], ['10.14', 'Mojave'], ['10.13', 'High Sierra'],
  ['10.12', 'Sierra'], ['10.11', 'El Capitan'], ['10.10', 'Yosemite'],
  ['10.9', 'Mavericks'], ['10.8', 'Mountain Lion'], ['10.7', 'Lion'],
];

export function parseUserAgent(uaInput: string): UAInfo {
  const ua = String(uaInput ?? '');
  const bot = BOTS.find(([re]) => re.test(ua));

  // 浏览器识别 (注意顺序: Edge/Opera 等 Chromium 外壳需先于 Chrome)
  let browserName = '';
  let browserVersion = '';
  if (/Edg\/([\d.]+)/i.test(ua)) { browserName = 'Microsoft Edge'; browserVersion = first(/Edg\/([\d.]+)/i, ua); }
  else if (/Edge\/([\d.]+)/i.test(ua)) { browserName = 'Microsoft Edge (EdgeHTML)'; browserVersion = first(/Edge\/([\d.]+)/i, ua); }
  else if (/OPR\/([\d.]+)/i.test(ua)) { browserName = 'Opera'; browserVersion = first(/OPR\/([\d.]+)/i, ua); }
  else if (/YaBrowser\/([\d.]+)/i.test(ua)) { browserName = 'Yandex Browser'; browserVersion = first(/YaBrowser\/([\d.]+)/i, ua); }
  else if (/UCBrowser\/([\d.]+)/i.test(ua)) { browserName = 'UC Browser'; browserVersion = first(/UCBrowser\/([\d.]+)/i, ua); }
  else if (/SamsungBrowser\/([\d.]+)/i.test(ua)) { browserName = 'Samsung Internet'; browserVersion = first(/SamsungBrowser\/([\d.]+)/i, ua); }
  else if (/CriOS\/([\d.]+)/i.test(ua)) { browserName = 'Chrome (iOS)'; browserVersion = first(/CriOS\/([\d.]+)/i, ua); }
  else if (/Chrome\/([\d.]+)/i.test(ua)) { browserName = 'Chrome'; browserVersion = first(/Chrome\/([\d.]+)/i, ua); }
  else if (/Chromium\/([\d.]+)/i.test(ua)) { browserName = 'Chromium'; browserVersion = first(/Chromium\/([\d.]+)/i, ua); }
  else if (/FxiOS\/([\d.]+)/i.test(ua)) { browserName = 'Firefox (iOS)'; browserVersion = first(/FxiOS\/([\d.]+)/i, ua); }
  else if (/Firefox\/([\d.]+)/i.test(ua)) { browserName = 'Firefox'; browserVersion = first(/Firefox\/([\d.]+)/i, ua); }
  else if (/MicroMessenger\/([\d.]+)/i.test(ua)) { browserName = '微信 (WeChat)'; browserVersion = first(/MicroMessenger\/([\d.]+)/i, ua); }
  else if (/MSIE ([\d.]+)/i.test(ua)) { browserName = 'Internet Explorer'; browserVersion = first(/MSIE ([\d.]+)/i, ua); }
  else if (/Trident\/[4567].*rv:([\d.]+)/i.test(ua)) { browserName = 'Internet Explorer'; browserVersion = first(/Trident\/[4567].*rv:([\d.]+)/i, ua); }
  else if (/Version\/([\d.]+).*Safari\//i.test(ua)) { browserName = 'Safari'; browserVersion = first(/Version\/([\d.]+)/i, ua); }
  else if (/Safari\/([\d.]+)/i.test(ua)) { browserName = 'Safari'; browserVersion = ''; }

  if (bot && !browserName) {
    browserName = bot[1];
    // 仅在 UA 以 “程序名/版本” 开头时取版本 (curl/wget/Python-requests/Postman 等)
    const lead = /^\s*([A-Za-z][\w.-]*)\/([\d.]+)/.exec(ua);
    const norm = (s: string) => s.toLowerCase().replace(/[\s-]/g, '');
    if (lead && norm(bot[1]) === norm(lead[1])) {
      browserVersion = lead[2];
    }
  }

  // 渲染引擎
  let engine = '未知';
  if (/Trident\//i.test(ua)) engine = 'Trident';
  else if (/Edge\//i.test(ua)) engine = 'EdgeHTML'; // 旧版 Edge UA 含 Chrome token, 需先于 Blink
  else if (/Presto\//i.test(ua)) engine = 'Presto';
  else if (/Gecko\//i.test(ua)) engine = 'Gecko';
  else if (/Edg\/|OPR\/|Chrome\/|CriOS\/|Chromium\/|YaBrowser\/|SamsungBrowser\/|UCBrowser\//i.test(ua)) engine = 'Blink';
  else if (/AppleWebKit\//i.test(ua)) engine = 'WebKit';

  // 操作系统
  let osName = '未知';
  let osVersion = '';
  const nt = first(/Windows NT ([\d.]+)/i, ua);
  if (nt) { osName = 'Windows'; osVersion = windowsVersion(nt); }
  else if (/Android ([\d.]+)/i.test(ua)) { osName = 'Android'; osVersion = first(/Android ([\d.]+)/i, ua); }
  else if (/CrOS/i.test(ua)) { osName = 'Chrome OS'; osVersion = first(/CrOS x86_64 ([\d.]+)/i, ua) || first(/CrOS armv7l ([\d.]+)/i, ua); }
  else if (/iPhone|iPod/i.test(ua)) { osName = 'iOS'; osVersion = first(/CPU iPhone OS ([\d_]+)/i, ua).replace(/_/g, '.'); }
  else if (/iPad/i.test(ua)) { osName = 'iPadOS'; osVersion = first(/CPU OS ([\d_]+)/i, ua).replace(/_/g, '.'); }
  else if (/Mac OS X ([\d_.]+)/i.test(ua)) {
    osName = 'macOS';
    const ver = first(/Mac OS X ([\d_.]+)/i, ua).replace(/_/g, '.');
    const pair = MAC_VER_NAMES.find(([v]) => ver.startsWith(v));
    osVersion = pair ? `${ver} (${pair[1]})` : ver;
  }
  else if (/Windows Phone/i.test(ua)) { osName = 'Windows Phone'; }
  else if (/Linux/i.test(ua)) { osName = 'Linux'; osVersion = ''; }
  else if (/X11|Wayland/i.test(ua)) { osName = 'Unix / Linux (X11)'; }
  else if (/Ubuntu|Debian|Fedora/i.test(ua)) { osName = 'Linux'; }

  // CPU 架构
  let cpuArch = '';
  if (/Win64; x64|WOW64; x64/i.test(ua)) cpuArch = 'x64';
  else if (/WOW64/i.test(ua)) cpuArch = 'x86 (WOW64)';
  else if (/Windows NT [\d.]+; ARM64/i.test(ua)) cpuArch = 'ARM64';
  else if (/Intel Mac OS X/i.test(ua)) cpuArch = 'Intel x86-64';
  else if (/Mac OS X/i.test(ua)) cpuArch = 'Apple';
  else if (/Linux x86_64/i.test(ua)) cpuArch = 'x86_64';
  else if (/Linux i686|Linux i586/i.test(ua)) cpuArch = 'x86 (i686)';
  else if (/Linux aarch64/i.test(ua)) cpuArch = 'AArch64';
  else if (/Linux armv7l/i.test(ua)) cpuArch = 'ARMv7';
  else if (/Android/i.test(ua)) { /* UA 常不含架构 */ }
  else if (/X11/i.test(ua)) {
    const x = first(/X11; ([^;)]+)/i, ua).trim();
    if (x) cpuArch = x;
  }

  // 设备
  let deviceType: UAInfo['deviceType'] = 'desktop';
  let deviceModel = '';
  if (bot) deviceType = 'bot';
  else if (/iPhone/i.test(ua)) { deviceType = 'mobile'; deviceModel = 'Apple iPhone'; }
  else if (/iPad/i.test(ua)) { deviceType = 'tablet'; deviceModel = 'Apple iPad'; }
  else if (/iPod/i.test(ua)) { deviceType = 'mobile'; deviceModel = 'Apple iPod touch'; }
  else if (/Android/i.test(ua)) {
    const model = first(/Android [\d.]+; ([^;()]+)/i, ua).trim();
    if (/Tablet|SM-T|Tab/i.test(ua) || /Android [\d.]+; [^;]* (?:Tab)/.test(ua)) deviceType = 'tablet';
    else if (!/Mobile/i.test(ua) && /SM-T|Tab\d|KF/i.test(ua)) deviceType = 'tablet';
    else if (/Mobile/i.test(ua)) deviceType = 'mobile';
    else deviceType = 'tablet'; // Android 无 Mobile 标记一般视为平板/大屏
    if (model && !/^Build/i.test(model)) deviceModel = model;
  }
  else if (/Kindle|Silk/i.test(ua)) { deviceType = 'tablet'; deviceModel = 'Kindle'; }
  else if (/SmartTV|Tizen|Web0S|SMART-TV/i.test(ua)) { deviceType = 'tv'; }
  else if (/Mobile|Phone/i.test(ua)) { deviceType = 'mobile'; }

  return {
    raw: ua,
    browserName,
    browserVersion,
    engine,
    osName,
    osVersion,
    cpuArch,
    deviceType,
    deviceModel,
    botName: bot ? bot[1] : null,
  };
}

// ---- UA 生成 (供「生成」tab) ----

export const GEN_OS_LIST = [
  { value: 'win11', label: 'Windows 11' },
  { value: 'win10', label: 'Windows 10' },
  { value: 'win7', label: 'Windows 7' },
  { value: 'mac', label: 'macOS' },
  { value: 'linux', label: 'Linux' },
  { value: 'android', label: 'Android 手机' },
  { value: 'iphone', label: 'iPhone' },
  { value: 'ipad', label: 'iPad' },
] as const;
export type GenOS = (typeof GEN_OS_LIST)[number]['value'];

export const GEN_BROWSER_LIST = [
  { value: 'chrome', label: 'Chrome' },
  { value: 'edge', label: 'Edge' },
  { value: 'firefox', label: 'Firefox' },
  { value: 'safari', label: 'Safari' },
] as const;
export type GenBrowser = (typeof GEN_BROWSER_LIST)[number]['value'];

const GEN_DEFAULT_VERSION: Record<GenBrowser, string> = {
  chrome: '126.0.0.0',
  edge: '126.0.0.0',
  firefox: '126.0',
  safari: '17.4',
};

const osLabelOf = (os: GenOS) => GEN_OS_LIST.find((o) => o.value === os)?.label ?? os;
const browserLabelOf = (b: GenBrowser) => GEN_BROWSER_LIST.find((x) => x.value === b)?.label ?? b;

function normVer(browser: GenBrowser, version?: string): string {
  const s = String(version ?? '').trim();
  if (!s) return GEN_DEFAULT_VERSION[browser];
  if (browser === 'safari') return s.includes('.') ? s : `${s}.4`;
  if (browser === 'firefox') return s.includes('.') ? s : `${s}.0`;
  return s.includes('.') ? s : `${s}.0.0.0`;
}

const WK = 'AppleWebKit/537.36 (KHTML, like Gecko)';
const WK_IOS = 'AppleWebKit/605.1.15 (KHTML, like Gecko)';

/**
 * 按平台 × 浏览器生成一条 UA 字符串。
 * Safari 仅支持 macOS / iOS (无 Windows/Linux/Android 版), 其它组合均返回 null。
 * @param version 可选浏览器版本 (主版本或完整版本); 留空用各浏览器默认较新版本。
 */
export function generateUa(os: GenOS, browser: GenBrowser, version?: string): string | null {
  const ver = normVer(browser, version);
  switch (os) {
    case 'win11':
    case 'win10': {
      if (browser === 'firefox') return `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${ver}) Gecko/20100101 Firefox/${ver}`;
      if (browser === 'safari') return null;
      const base = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) ${WK} Chrome/${ver} Safari/537.36`;
      return browser === 'edge' ? `${base} Edg/${ver}` : base;
    }
    case 'win7': {
      if (browser === 'firefox') return `Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:${ver}) Gecko/20100101 Firefox/${ver}`;
      if (browser === 'safari') return null;
      const base = `Mozilla/5.0 (Windows NT 6.1; Win64; x64) ${WK} Chrome/${ver} Safari/537.36`;
      return browser === 'edge' ? `${base} Edg/${ver}` : base;
    }
    case 'mac': {
      if (browser === 'firefox') return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:${ver}) Gecko/20100101 Firefox/${ver}`;
      if (browser === 'safari') return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ${WK_IOS} Version/${ver} Safari/605.1.15`;
      const base = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ${WK} Chrome/${ver} Safari/537.36`;
      return browser === 'edge' ? `${base} Edg/${ver}` : base;
    }
    case 'linux': {
      if (browser === 'firefox') return `Mozilla/5.0 (X11; Linux x86_64; rv:${ver}) Gecko/20100101 Firefox/${ver}`;
      if (browser === 'safari') return null;
      const base = `Mozilla/5.0 (X11; Linux x86_64) ${WK} Chrome/${ver} Safari/537.36`;
      return browser === 'edge' ? `${base} Edg/${ver}` : base;
    }
    case 'android': {
      if (browser === 'firefox') return `Mozilla/5.0 (Android 14; Mobile; rv:${ver}) Gecko/${ver} Firefox/${ver}`;
      if (browser === 'safari') return null;
      const base = `Mozilla/5.0 (Linux; Android 14; Pixel 8) ${WK} Chrome/${ver} Mobile Safari/537.36`;
      return browser === 'edge' ? `${base} Edg/${ver}` : base;
    }
    case 'iphone': {
      if (browser === 'safari') return `Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) ${WK_IOS} Version/${ver} Mobile/15E148 Safari/604.1`;
      if (browser === 'firefox') return `Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) ${WK_IOS} FxiOS/${ver} Mobile/15E148 Safari/604.1`;
      const token = browser === 'edge' ? 'EdgiOS' : 'CriOS';
      return `Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) ${WK_IOS} ${token}/${ver} Mobile/15E148 Safari/604.1`;
    }
    case 'ipad': {
      if (browser === 'firefox') return `Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) ${WK_IOS} FxiOS/${ver} Mobile/15E148 Safari/604.1`;
      if (browser === 'safari') return `Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) ${WK_IOS} Version/${ver} Safari/605.1.15`;
      const token = browser === 'edge' ? 'EdgiOS' : 'CriOS';
      return `Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) ${WK_IOS} ${token}/${ver} Mobile/15E148 Safari/604.1`;
    }
  }
}

export interface GenResult {
  os: GenOS;
  browser: GenBrowser;
  label: string;
  /** 不支持的组合为 null (如 Windows × Safari) */
  ua: string | null;
}

/** 勾选多平台 × 多浏览器 → 全部组合 (按平台 × 浏览器选项顺序)。 */
export function generateUaList(oses: GenOS[], browsers: GenBrowser[], version?: string): GenResult[] {
  const list: GenResult[] = [];
  for (const os of oses) {
    for (const b of browsers) {
      list.push({ os, browser: b, label: `${osLabelOf(os)} × ${browserLabelOf(b)}`, ua: generateUa(os, b, version) });
    }
  }
  return list;
}
