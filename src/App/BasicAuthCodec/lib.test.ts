import { basicAuthToken, basicAuthHeader, parseBasicAuth, isValidBasicAuth } from './lib';

describe('HTTP Basic Auth 编码', () => {
  it('用户名/密码 -> Base64 Token', () => {
    expect(basicAuthToken('user', 'pass')).toBe('dXNlcjpwYXNz');
  });

  it('空密码 / 中文用户名 (UTF-8) 可编码', () => {
    expect(basicAuthToken('admin', '')).toBe('YWRtaW46');
    expect(basicAuthToken('张三', '123')).toBe(Buffer.from('张三:123', 'utf8').toString('base64'));
  });

  it('生成完整 Authorization 请求头', () => {
    expect(basicAuthHeader('user', 'pass')).toBe('Authorization: Basic dXNlcjpwYXNz');
  });
});

describe('HTTP Basic Auth 解码', () => {
  it('裸 Token 解读出用户名/密码', () => {
    expect(parseBasicAuth('dXNlcjpwYXNz')).toEqual({ username: 'user', password: 'pass', token: 'dXNlcjpwYXNz' });
  });

  it('Basic 前缀 / 完整请求头均可解读 (大小写不敏感)', () => {
    expect(parseBasicAuth('Basic dXNlcjpwYXNz').username).toBe('user');
    expect(parseBasicAuth('basic dXNlcjpwYXNz').username).toBe('user');
    const r = parseBasicAuth('Authorization: Basic dXNlcjpwYXNz');
    expect(r.username).toBe('user');
    expect(r.password).toBe('pass');
  });

  it('密码含冒号按首个冒号切分', () => {
    const r = parseBasicAuth(basicAuthToken('user', 'p:a:ss'));
    expect(r.username).toBe('user');
    expect(r.password).toBe('p:a:ss');
  });

  it('多行粘贴只取头部行 (容忍 curl -H 单引号)', () => {
    const r = parseBasicAuth('Authorization: Basic dXNlcjpwYXNz\nAccept: */*');
    expect(r.username).toBe('user');
    expect(r.password).toBe('pass');
  });

  it('非法输入抛错', () => {
    expect(() => parseBasicAuth('')).toThrow();
    expect(() => parseBasicAuth('Basic ')).toThrow();
    expect(() => parseBasicAuth('!!!not-base64!!!')).toThrow();
    expect(() => parseBasicAuth(basicAuthToken('nocolon', 'x') + 'A')).toThrow(); // 长度 %4==1
  });

  it('缺冒号的解码内容抛错', () => {
    expect(() => parseBasicAuth('aGVsbG8=')).toThrow(); // base64("hello") 无冒号
  });

  it('isValidBasicAuth', () => {
    expect(isValidBasicAuth('dXNlcjpwYXNz')).toBe(true);
    expect(isValidBasicAuth('garbage')).toBe(false);
  });
});
