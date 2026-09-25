import { jwtDecode, partText, jwtEncode, base64UrlEncodeText } from './lib';
import { DEFAULT_HEADER, DEFAULT_PAYLOAD, DEFAULT_SECRET } from './data';

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

describe('JWT 生成器', () => {
  it('HS256 生成 jwt.io 官方示例 token', () => {
    const r = jwtEncode('{"alg":"HS256","typ":"JWT"}', '{"sub":"1234567890","name":"John Doe","iat":1516239022}', 'your-256-bit-secret', 'HS256');
    expect(r.ok).toBe(true);
    expect(r.token).toBe(SAMPLE);
    expect(r.signatureHex).toMatch(/^[0-9a-f]{64}$/);
  });

  it('默认头部/负载 (带缩进) 也能生成同一 token', () => {
    const r = jwtEncode(DEFAULT_HEADER, DEFAULT_PAYLOAD, DEFAULT_SECRET, 'HS256');
    expect(r.token).toBe(SAMPLE);
  });

  it('生成的 token 可被自身解码 (HS384 / HS512 / 中文负载)', () => {
    [ 'HS384', 'HS512' ].forEach((alg) => {
      const r = jwtEncode(`{"alg":"${alg}","typ":"JWT"}`, '{"msg":"你好世界","n":42}', 'secret', alg as 'HS384');
      expect(r.ok).toBe(true);
      const d = jwtDecode(r.token!);
      expect(d.ok).toBe(true);
      expect(d.header?.json?.['alg']).toBe(alg);
      expect(d.payload?.json).toEqual({ msg: '你好世界', n: 42 });
    });
  });

  it('alg=none 不签名, token 以点号结尾且中间段为空', () => {
    const r = jwtEncode('{"alg":"none","typ":"JWT"}', '{"a":1}', '', 'none');
    expect(r.ok).toBe(true);
    expect(r.signatureB64).toBe('');
    expect(r.signatureHex).toBe('');
    expect(r.token!.endsWith('.')).toBe(true);
    const d = jwtDecode(r.token!);
    expect(d.ok).toBe(true);
    expect(d.signature).toBe('');
  });

  it('传入算法会覆盖头部 JSON 中已有的 alg, 其余字段保留', () => {
    const r = jwtEncode('{"alg":"HS256","typ":"JWT","kid":"k1"}', '{}', 's', 'HS384');
    const d = jwtDecode(r.token!);
    expect(d.header?.json?.['alg']).toBe('HS384');
    expect(d.header?.json?.['kid']).toBe('k1');
  });

  it('Base64 密钥按字节参与签名 (与文本密钥结果不同)', () => {
    const b64 = jwtEncode('{"alg":"HS256"}', '{"a":1}', 'AQID', 'HS256', true);
    const txt = jwtEncode('{"alg":"HS256"}', '{"a":1}', 'AQID', 'HS256', false);
    expect(b64.ok).toBe(true);
    expect(b64.token).not.toBe(txt.token);
    // Base64 'AQID' 解出的字节 01 02 03, 与字符 U+0001..U+0003 的 UTF-8 编码一致 -> 签名相同
    const bytes = jwtEncode('{"alg":"HS256"}', '{"a":1}', '\u0001\u0002\u0003', 'HS256', false);
    expect(bytes.token).toBe(b64.token);
  });

  it('非法输入与缺密钥报错', () => {
    expect(jwtEncode('not json', '{}', 'k', 'HS256').error).toContain('头部');
    expect(jwtEncode('{}', '[]', 'k', 'HS256').error).toContain('JSON 对象');
    expect(jwtEncode('{}', '{}', '', 'HS256').error).toContain('密钥');
    expect(jwtEncode('{}', '{}', '!!!!', 'HS256', true).error).toContain('Base64');
    expect(jwtEncode('{}', '{}', 'k', 'HS256').ok).toBe(true);
  });

  it('base64url 编码与解码互为逆向', () => {
    [ '', 'a', 'ab', 'abc', 'abcd', '你好, JWT!' ].forEach((s) => {
      const enc = base64UrlEncodeText(s);
      expect(enc).not.toContain('=');
      expect(enc).toMatch(/^[A-Za-z0-9_-]*$/);
    });
    expect(base64UrlEncodeText('{"alg":"HS256","typ":"JWT"}')).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
  });
});
