import { jwtDecode, partText } from './lib';

// jwt.io 官方示例 token (HS256)
const SAMPLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const utf8ToB64Url = (text :string) :string => {
  const bytes = Array.from(new TextEncoder().encode(text));
  const bin = String.fromCharCode(...bytes);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

describe('JWT 解码器', () => {
  it('解析 jwt.io 示例 token', () => {
    const r = jwtDecode(SAMPLE);
    expect(r.ok).toBe(true);
    expect(r.header?.json?.['alg']).toBe('HS256');
    expect(r.header?.json?.['typ']).toBe('JWT');
    expect(r.payload?.json?.['sub']).toBe('1234567890');
    expect(r.payload?.json?.['name']).toBe('John Doe');
    expect(r.payload?.json?.['iat']).toBe(1516239022);
    expect(r.signatureRaw).toBe('SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
  });

  it('签名 HEX 长度正确 (HS256 = 32 字节 = 64 hex)', () => {
    const r = jwtDecode(SAMPLE);
    expect(r.signature).toMatch(/^[0-9a-f]{64}$/);
  });

  it('头部/负载部分格式化输出为 JSON', () => {
    const r = jwtDecode(SAMPLE);
    expect(r.ok).toBe(true);
    expect(partText(r.header!)).toContain('"alg": "HS256"');
    expect(partText(r.payload!)).toContain('"sub": "1234567890"');
  });

  it('负载解码 roundtrip (含中文与 emoji)', () => {
    const claims = { msg: '你好世界', emoji: '😀', n: 42 };
    const payload = utf8ToB64Url(JSON.stringify(claims));
    const header = utf8ToB64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const token = `${header}.${payload}.`;
    const r = jwtDecode(token);
    expect(r.ok).toBe(true);
    expect(r.payload?.json).toEqual(claims);
    expect(r.signature).toBe(''); // 空签名 (alg=none)
  });

  it('空输入/分段错误', () => {
    expect(jwtDecode('').ok).toBe(false);
    expect(jwtDecode('  ').error).toBe('请输入 JWT');
    const r2 = jwtDecode('abc.def');
    expect(r2.ok).toBe(false);
    expect(r2.error).toContain('3 段');
    const r3 = jwtDecode('a.b.c.d');
    expect(r3.ok).toBe(false);
    expect(r3.error).toContain('3 段');
  });

  it('非法 base64url 字符报错', () => {
    const bad = `${utf8ToB64Url('{"alg":"HS256"}')}.${utf8ToB64Url('{"a":1}')}=.sig`;
    const r = jwtDecode(bad);
    expect(r.ok).toBe(false);
    expect(r.error).toContain('base64url');
  });

  it('非 JSON 段也能原样显示', () => {
    const header = utf8ToB64Url('not-json');
    const payload = utf8ToB64Url('{"a":1}');
    const r = jwtDecode(`${header}.${payload}.ab`);
    expect(r.ok).toBe(true);
    expect(r.header?.json).toBeNull();
    expect(partText(r.header!)).toBe('not-json');
  });
});
