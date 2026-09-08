import { parseUserAgent, generateUa, generateUaList } from './lib';

describe('UA 解析 - Chrome/Edge 系列', () => {
  test('Chrome (Windows 10, x64)', () => {
    const r = parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    expect(r.browserName).toBe('Chrome');
    expect(r.browserVersion).toBe('120.0.0.0');
    expect(r.engine).toBe('Blink');
    expect(r.osName).toBe('Windows');
    expect(r.cpuArch).toBe('x64');
    expect(r.deviceType).toBe('desktop');
    expect(r.botName).toBeNull();
  });
  test('Edge (Chromium)', () => {
    const r = parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.1.5');
    expect(r.browserName).toBe('Microsoft Edge');
    expect(r.browserVersion).toBe('120.0.1.5');
    expect(r.engine).toBe('Blink');
  });
  test('Samsung Internet (Android)', () => {
    const r = parseUserAgent('Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/120.0.0.0 Mobile Safari/537.36');
    expect(r.browserName).toBe('Samsung Internet');
    expect(r.deviceModel).toBe('SM-S918B');
    expect(r.deviceType).toBe('mobile');
  });
  test('Opera (Chromium 内核)', () => {
    const r = parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0');
    expect(r.browserName).toBe('Opera');
    expect(r.engine).toBe('Blink');
  });
});

describe('UA 解析 - Firefox / Safari / 移动端', () => {
  test('Firefox (macOS Intel)', () => {
    const r = parseUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:126.0) Gecko/20100101 Firefox/126.0');
    expect(r.browserName).toBe('Firefox');
    expect(r.browserVersion).toBe('126.0');
    expect(r.engine).toBe('Gecko');
    expect(r.osName).toBe('macOS');
    expect(r.osVersion).toContain('10.15');
    expect(r.cpuArch).toBe('Intel x86-64');
    expect(r.deviceType).toBe('desktop');
  });
  test('Safari (iPhone iOS)', () => {
    const r = parseUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1');
    expect(r.browserName).toBe('Safari');
    expect(r.browserVersion).toBe('17.4');
    expect(r.engine).toBe('WebKit');
    expect(r.osName).toBe('iOS');
    expect(r.osVersion).toBe('17.4');
    expect(r.deviceType).toBe('mobile');
    expect(r.deviceModel).toBe('Apple iPhone');
  });
  test('Safari (macOS desktop)', () => {
    const r = parseUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15');
    expect(r.browserName).toBe('Safari');
    expect(r.browserVersion).toBe('16.5');
    expect(r.engine).toBe('WebKit');
  });
  test('Chrome (Android 手机 型号)', () => {
    const r = parseUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36');
    expect(r.osName).toBe('Android');
    expect(r.osVersion).toBe('14');
    expect(r.deviceType).toBe('mobile');
    expect(r.deviceModel).toBe('Pixel 8');
  });
  test('Safari (iPad → iPadOS)', () => {
    const r = parseUserAgent('Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1');
    expect(r.osName).toBe('iPadOS');
    expect(r.osVersion).toBe('17.4');
    expect(r.deviceType).toBe('tablet');
  });
});

describe('UA 解析 - 旧版浏览器', () => {
  test('Internet Explorer 11', () => {
    const r = parseUserAgent('Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko');
    expect(r.browserName).toBe('Internet Explorer');
    expect(r.browserVersion).toBe('11.0');
    expect(r.engine).toBe('Trident');
    expect(r.osName).toBe('Windows');
    expect(r.osVersion).toBe('7');
  });
  test('IE 8 (MSIE)', () => {
    const r = parseUserAgent('Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0)');
    expect(r.browserName).toBe('Internet Explorer');
    expect(r.browserVersion).toBe('8.0');
    expect(r.osVersion).toBe('Vista');
  });
});

describe('UA 解析 - 爬虫与命令行', () => {
  test('Googlebot', () => {
    const r = parseUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
    expect(r.botName).toBe('Googlebot');
    expect(r.browserName).toBe('Googlebot');
    expect(r.deviceType).toBe('bot');
  });
  test('curl', () => {
    const r = parseUserAgent('curl/8.4.0');
    expect(r.browserName).toBe('curl');
    expect(r.browserVersion).toBe('8.4.0');
    expect(r.deviceType).toBe('bot');
  });
  test('Python requests', () => {
    const r = parseUserAgent('python-requests/2.31.0');
    expect(r.browserName).toBe('Python Requests');
    expect(r.browserVersion).toBe('2.31.0');
    expect(r.botName).toBe('Python Requests');
  });
});

describe('UA 解析 - 其它', () => {
  test('空 UA', () => {
    const r = parseUserAgent('');
    expect(r.browserName).toBe('');
    expect(r.botName).toBeNull();
    expect(r.deviceType).toBe('desktop');
  });
  test('Windows 10/11 显示为 10 / 11', () => {
    const r = parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    expect(r.osVersion).toBe('10 / 11');
  });
  test('旧版 Edge (EdgeHTML)', () => {
    const r = parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586');
    expect(r.browserName).toBe('Microsoft Edge (EdgeHTML)');
    expect(r.engine).toBe('EdgeHTML');
  });
});

describe('UA 生成', () => {
  test('Win11 × Chrome: 生成结果可被解析器反向识别', () => {
    const ua = generateUa('win11', 'chrome')!;
    expect(ua).toContain('(Windows NT 10.0; Win64; x64)');
    const r = parseUserAgent(ua);
    expect(r.browserName).toBe('Chrome');
    expect(r.osName).toBe('Windows');
    expect(r.cpuArch).toBe('x64');
  });
  test('macOS × Firefox / Safari', () => {
    const f = parseUserAgent(generateUa('mac', 'firefox')!);
    expect(f.browserName).toBe('Firefox');
    expect(f.osName).toBe('macOS');
    expect(f.engine).toBe('Gecko');
    const s = parseUserAgent(generateUa('mac', 'safari')!);
    expect(s.browserName).toBe('Safari');
    expect(s.engine).toBe('WebKit');
  });
  test('Android × Chrome 与 iPhone × Safari', () => {
    const a = parseUserAgent(generateUa('android', 'chrome')!);
    expect(a.browserName).toBe('Chrome');
    expect(a.deviceType).toBe('mobile');
    expect(a.deviceModel).toBe('Pixel 8');
    const i = parseUserAgent(generateUa('iphone', 'safari')!);
    expect(i.browserName).toBe('Safari');
    expect(i.osName).toBe('iOS');
    expect(i.deviceType).toBe('mobile');
  });
  test('Windows × Safari 不支持', () => {
    expect(generateUa('win11', 'safari')).toBeNull();
    expect(generateUa('android', 'safari')).toBeNull();
  });
  test('自定义主版本号归一化', () => {
    expect(generateUa('win11', 'chrome', '130')).toContain('Chrome/130.0.0.0');
    expect(generateUa('mac', 'firefox', '127')).toContain('Firefox/127.0');
    expect(generateUa('mac', 'safari', '18')).toContain('Version/18.4');
    expect(generateUa('mac', 'safari', '18.2')).toContain('Version/18.2');
    expect(generateUa('win11', 'chrome', '')).toContain('Chrome/126.0.0.0');
  });
  test('多选组合全部展开 (含不支持项标记 null)', () => {
    const list = generateUaList(['win11', 'mac'], ['chrome', 'safari'], '130');
    expect(list).toHaveLength(4);
    expect(list.map((x) => `${x.os}:${x.browser}`)).toEqual(['win11:chrome', 'win11:safari', 'mac:chrome', 'mac:safari']);
    expect(list.map((x) => x.ua === null)).toEqual([false, true, false, false]);
    expect(list[0].label).toContain('Windows 11');
    expect(list[1].label).toContain('Windows 11');
    expect(list[3].label).toContain('Safari');
    expect(list[3].ua).not.toBeNull();
  });
});
