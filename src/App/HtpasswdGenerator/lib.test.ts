// htpasswd 生成 - 核心算法单元测试
// $apr1$ 参照向量由 openssl passwd -apr1 (与 htpasswd -m 同源实现) 生成
import bcrypt from 'bcryptjs';
import {
  apr1Hash,
  bcryptHash,
  buildHtpasswdFile,
  buildHtpasswdLine,
  md5Bytes,
  randomSalt,
  sha1Base64,
} from './lib';

const hex = (b: Uint8Array) => Array.from(b).map((v) => v.toString(16).padStart(2, '0')).join('');

describe('MD5 基础实现', () => {
  it('空输入', () => {
    expect(hex(md5Bytes(new Uint8Array(0)))).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });
  it('abc', () => {
    expect(hex(md5Bytes(new TextEncoder().encode('abc')))).toBe('900150983cd24fb0d6963f7d28e17f72');
  });
  it('56/64 字节边界 (填充分支)', () => {
    const enc = new TextEncoder();
    expect(hex(md5Bytes(enc.encode('a'.repeat(55))))).toBe(
      'ef1772b6dff9a122358552954ad0df65'
    );
    expect(hex(md5Bytes(enc.encode('a'.repeat(64))))).toBe(
      '014842d480b571495a4a0363793f7367'
    );
  });
});

describe('$apr1$ (htpasswd -m)', () => {
  // 向量: openssl passwd -apr1 -salt <salt> <password>
  const vectors: Array<[string, string, string]> = [
    ['abc.defg', 'secret', '$apr1$abc.defg$gGhyLLsOOo5nMIuohIrV.0'],
    ['2A/9xYz0', 'P@ss w0rd!', '$apr1$2A/9xYz0$roZEt8b5Xt/AAID.hKtT5/'],
    ['./Ab12Cd', '', '$apr1$./Ab12Cd$LCLUFPT.RdDxWMmJQD16F/'],
    ['12345678', 'The quick brown fox jumps over the lazy dog', '$apr1$12345678$jvA0wp75kzS4bvMOFPhWc/'],
    ['a1b2c3d4', '密碼測試', '$apr1$a1b2c3d4$USGCjvh4D/hHR.9NvGdDW.'],
  ];

  it.each(vectors)('盐 %s / 密码 %s', (salt, password, expected) => {
    expect(apr1Hash(password, salt)).toBe(expected);
  });

  it('相同盐结果确定', () => {
    const a = apr1Hash('password', 'a1B2c3D4');
    const b = apr1Hash('password', 'a1B2c3D4');
    expect(a).toBe(b);
    expect(a).toMatch(/^\$apr1\$a1B2c3D4\$[./0-9A-Za-z]{22}$/);
  });

  it('缺省盐时随机生成 8 字符', () => {
    const h = apr1Hash('password');
    const m = h.match(/^\$apr1\$([./0-9A-Za-z]{8})\$/);
    expect(m).not.toBeNull();
    expect(randomSalt(8)).toMatch(/^[./0-9A-Za-z]{8}$/);
  });

  it('非法盐抛错', () => {
    expect(() => apr1Hash('pw', 'a b c')).toThrow();
    expect(() => apr1Hash('pw', 'toolongsalt')).toThrow();
  });
});

describe('SHA1 ({SHA}) (htpasswd -s)', () => {
  it('secret', () => {
    expect(sha1Base64('secret')).toBe('5en6G6MezRroT3XKqkdPOmY/BfQ=');
  });
  it('中文 UTF-8', () => {
    expect(sha1Base64('密碼測試')).toBe('uv2c+XQosIUHk9lfpeyspJts2FY=');
  });
  it('长文本', () => {
    expect(sha1Base64('The quick brown fox jumps over the lazy dog')).toBe('L9ThxnotKPzthJ7hu3bnORuT6xI=');
  });
});

describe('bcrypt ($2y$) (htpasswd -B)', () => {
  it('默认成本 10, $2y$ 前缀, bcryptjs 可互验', () => {
    const h = bcryptHash('secret');
    expect(h).toMatch(/^\$2y\$10\$[./0-9A-Za-z]{53}$/);
    expect(bcrypt.compareSync('secret', h)).toBe(true);
    expect(bcrypt.compareSync('wrong', h)).toBe(false);
  });
  it('自定义成本', () => {
    const h = bcryptHash('secret', 4);
    expect(h).toMatch(/^\$2y\$04\$/);
    expect(bcrypt.compareSync('secret', h)).toBe(true);
  });
});

describe('行 / 文件内容生成', () => {
  it('plain: 用户名:明文密码', () => {
    expect(buildHtpasswdLine('admin', '123456', { method: 'plain' })).toBe('admin:123456');
  });
  it('sha1: {SHA} 前缀', () => {
    expect(buildHtpasswdLine('admin', 'secret', { method: 'sha1' })).toBe(
      'admin:{SHA}5en6G6MezRroT3XKqkdPOmY/BfQ='
    );
  });
  it('apr1: 使用传入盐', () => {
    expect(buildHtpasswdLine('admin', 'secret', { method: 'apr1', salt: 'abc.defg' })).toBe(
      'admin:$apr1$abc.defg$gGhyLLsOOo5nMIuohIrV.0'
    );
  });
  it('bcrypt: $2y$ 可被 bcryptjs 验证', () => {
    const line = buildHtpasswdLine('admin', 'secret', { method: 'bcrypt' });
    expect(line.startsWith('admin:$2y$')).toBe(true);
    expect(bcrypt.compareSync('secret', line.slice('admin:'.length))).toBe(true);
  });
  it('用户名 / 密码含冒号或换行抛错', () => {
    expect(() => buildHtpasswdLine('a:b', 'pw', { method: 'plain' })).toThrow('冒号');
    expect(() => buildHtpasswdLine('a\nb', 'pw', { method: 'plain' })).toThrow('换行');
    expect(() => buildHtpasswdLine('admin', 'p:w', { method: 'plain' })).toThrow('冒号');
    expect(() => buildHtpasswdLine('admin', 'p\nw', { method: 'plain' })).toThrow('换行');
    expect(() => buildHtpasswdLine('', 'pw', { method: 'plain' })).toThrow('不能为空');
    expect(() => buildHtpasswdLine('admin', '', { method: 'plain' })).toThrow('不能为空');
  });
  it('文件内容: 多条记录换行分隔 + 结尾换行', () => {
    expect(buildHtpasswdFile(['admin:123', 'user:456'])).toBe('admin:123\nuser:456\n');
    expect(buildHtpasswdFile([])).toBe('');
  });
});
