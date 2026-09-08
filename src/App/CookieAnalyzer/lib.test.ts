import {
  detectCookieInput, parseCookies, cookiesToMap, cookiesToArray, cookiesToHeader,
} from './lib';

describe('Cookie 分析 - 输入识别', () => {
  test('Cookie 字符串 / Headers / document.cookie', () => {
    expect(detectCookieInput('a=1; b=2')).toBe('string');
    expect(detectCookieInput('Cookie: a=1')).toBe('headers');
    expect(detectCookieInput('Set-Cookie: a=1; Path=/')).toBe('headers');
    expect(detectCookieInput('document.cookie = "a=1; b=2";')).toBe('document');
  });
});

describe('Cookie 分析 - 解析', () => {
  test('Cookie 字符串: name=value 拆出', () => {
    const { kind, items } = parseCookies('sessionid=abc123; theme=dark; lang=zh-CN');
    expect(kind).toBe('string');
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ name: 'sessionid', value: 'abc123', source: 'string' });
    expect(items[1].name).toBe('theme');
  });
  test('字符串中的裸属性挂在最近一条上 (HttpOnly 等)', () => {
    const { items } = parseCookies('sid=1; HttpOnly; Secure');
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ name: 'sid', httpOnly: true, secure: true });
  });
  test('HTTP Headers: 请求 Cookie 行与多条 Set-Cookie', () => {
    const text = [
      'GET / HTTP/1.1',
      'Host: www.example.com',
      'Cookie: sessionid=abc123; theme=dark',
      '',
      'HTTP/1.1 200 OK',
      'Set-Cookie: sid=xyz789; Path=/; Domain=.example.com; HttpOnly; Secure; SameSite=Lax; Expires=Wed, 21 Oct 2026 07:28:00 GMT',
      'Set-Cookie: lang=zh-CN; Path=/; Max-Age=31536000',
    ].join('\n');
    const { kind, items } = parseCookies(text);
    expect(kind).toBe('headers');
    expect(items).toHaveLength(4);
    const sid = items.find((i) => i.name === 'sid');
    expect(sid).toMatchObject({
      value: 'xyz789', path: '/', domain: '.example.com',
      httpOnly: true, secure: true, sameSite: 'Lax',
    });
    expect(sid!.expires).toContain('Wed, 21 Oct 2026');
    const lang = items.find((i) => i.name === 'lang');
    expect(lang).toMatchObject({ path: '/', maxAge: '31536000', source: 'headers' });
    const theme = items.find((i) => i.name === 'theme');
    expect(theme).toMatchObject({ value: 'dark' });
  });
  test('document.cookie 赋值: 去外壳与引号', () => {
    const { items } = parseCookies('document.cookie = "sid=xyz789; theme=dark";');
    expect(items).toHaveLength(2);
    expect(items[0].name).toBe('sid');
    expect(items[1].name).toBe('theme');
    expect(parseCookies('document.cookie="only=1"').items).toHaveLength(1);
  });
  test('非法/空输入', () => {
    expect(parseCookies('').items).toEqual([]);
    expect(parseCookies('Hello 世界; no-equals-here').items).toEqual([]);
  });
});

describe('Cookie 分析 - 输出', () => {
  const { items } = parseCookies('a=1; b=2; sid=xyz; Path=/; HttpOnly; Secure');
  test('JSON 对象 (name→value)', () => {
    expect(cookiesToMap(items)).toEqual({ a: '1', b: '2', sid: 'xyz' });
  });
  test('JSON 数组 (完整字段)', () => {
    const arr = cookiesToArray(items);
    expect(arr).toHaveLength(3);
    const sid = arr[2];
    expect(sid).toMatchObject({ name: 'sid', value: 'xyz', httpOnly: true, secure: true, source: 'string' });
  });
  test('重新拼 Cookie 头', () => {
    expect(cookiesToHeader(items)).toBe('a=1; b=2; sid=xyz');
  });
});
