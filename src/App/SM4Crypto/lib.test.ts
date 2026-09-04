/** @jest-environment node */
// SM4 国密分组密码测试: 规范测试向量 + 自洽往返 (密钥/分组固定 128 位)
import {
  sm4Encrypt, sm4Decrypt, sm4EncryptBytes, sm4DecryptBytes,
  parseSm4Key, parseSm4Iv, hexToBytes,
} from './lib';

const enc = new TextEncoder();
const dec = new TextDecoder();
const utf8 = (s :string) :Uint8Array => enc.encode(s);
const toHex = (b :Uint8Array) :string => Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('');

describe('SM4 规范测试向量 (与 sm-crypto 互操作验证一致)', () => {
  const key = '0123456789abcdeffedcba9876543210';
  const block = '0123456789abcdeffedcba9876543210';

  it('ECB + Pkcs7 已知密文', () => {
    const out = sm4EncryptBytes(hexToBytes(block), hexToBytes(key), 'ECB', 'Pkcs7');
    // 首块为 SM4 标准示例 681edf34d206965e86b3e94f536e4246
    expect(toHex(out)).toBe('681edf34d206965e86b3e94f536e4246002a8a4efa863ccad024ac0300bb40d2');
  });

  it('ECB 16 字节对齐文本与 sm-crypto 同密文', () => {
    // 参考值取自 sm-crypto encrypt('0123456789abcdef', keyHex) 输出 (已双向互操作验证)
    const out = sm4Encrypt('0123456789abcdef', '1234567890abcdef', { mode: 'ECB', padding: 'Pkcs7', code: 'HEX' });
    expect(out).toBe('9154444751874734b43cb9a9a2c30bb0113be48ad9d7d47ad067f3c730fd6bbd');
  });
});

describe('SM4 往返', () => {
  const key = '1234567890abcdef';
  const text = 'SM4 国密算法测试 🚀 中文内容 0123456789 abcdefghijklmnopqrstuvwxyz 特殊字符 !@#$%^&*()';

  it('ECB Pkcs7 文本往返 (UTF-8)', () => {
    const cipher = sm4Encrypt(text, key, { mode: 'ECB', padding: 'Pkcs7', code: 'HEX' });
    expect(sm4Decrypt(cipher, key, { mode: 'ECB', padding: 'Pkcs7', code: 'HEX' })).toBe(text);
  });

  it('ECB ZeroPadding 文本往返', () => {
    const cipher = sm4Encrypt(text, key, { mode: 'ECB', padding: 'ZeroPadding', code: 'Base64' });
    expect(sm4Decrypt(cipher, key, { mode: 'ECB', padding: 'ZeroPadding', code: 'Base64' })).toBe(text);
  });

  it('CBC Pkcs7 文本往返 (UTF-8 IV)', () => {
    const iv = 'abcdefghijklmnop';
    const cipher = sm4Encrypt(text, key, { mode: 'CBC', padding: 'Pkcs7', code: 'HEX', iv });
    expect(sm4Decrypt(cipher, key, { mode: 'CBC', padding: 'Pkcs7', code: 'HEX', iv })).toBe(text);
  });

  it('CBC ZeroPadding 文本往返 (HEX IV)', () => {
    const iv = '000102030405060708090a0b0c0d0e0f';
    const cipher = sm4Encrypt(text, key, { mode: 'CBC', padding: 'ZeroPadding', code: 'Base64', iv });
    expect(sm4Decrypt(cipher, key, { mode: 'CBC', padding: 'ZeroPadding', code: 'Base64', iv })).toBe(text);
  });

  it('32 位 HEX 密钥等价于对应 UTF-8 文本密钥', () => {
    const keyHex = '31323334353637383930616263646566'; // = utf8('1234567890abcdef')
    const cipher = sm4Encrypt(text, keyHex, { mode: 'ECB', padding: 'Pkcs7', code: 'HEX' });
    expect(sm4Decrypt(cipher, key, { mode: 'ECB', padding: 'Pkcs7', code: 'HEX' })).toBe(text);
  });

  it('ECB 下同一明文两次密文相同 (确定性, 便于测试向量)', () => {
    const a = sm4Encrypt('hello sm4', key, { mode: 'ECB', padding: 'Pkcs7', code: 'Base64' });
    const b = sm4Encrypt('hello sm4', key, { mode: 'ECB', padding: 'Pkcs7', code: 'Base64' });
    expect(a).toBe(b);
  });

  it('零字节 / 空文本也能往返', () => {
    const cipher = sm4EncryptBytes(new Uint8Array(0), utf8(key), 'ECB', 'Pkcs7');
    const out = sm4DecryptBytes(cipher, utf8(key), 'ECB', 'Pkcs7');
    expect(out.length).toBe(0);
  });

  it('任意字节数据 (含 0xff) 往返', () => {
    const data = new Uint8Array(257);
    for (let i = 0; i < data.length; i++) data[i] = (i * 31) & 0xff;
    const cipher = sm4EncryptBytes(data, utf8(key), 'CBC', 'Pkcs7', utf8('abcdefghijklmnop'));
    const out = sm4DecryptBytes(cipher, utf8(key), 'CBC', 'Pkcs7', utf8('abcdefghijklmnop'));
    expect(toHex(out)).toBe(toHex(data));
  });
});

describe('SM4 错误处理', () => {
  const key = '1234567890abcdef';

  it('错误密钥解密报「填充无效」', () => {
    const cipher = sm4Encrypt('机密内容 secret', key, { mode: 'ECB', padding: 'Pkcs7', code: 'HEX' });
    expect(() => sm4Decrypt(cipher, 'abcdefghijklmnop', { mode: 'ECB', padding: 'Pkcs7', code: 'HEX' })).toThrow(/填充无效/);
  });

  it('密文被篡改报错', () => {
    const cipher = sm4Encrypt('机密内容 secret 0123456789', key, { mode: 'CBC', padding: 'Pkcs7', code: 'HEX', iv: 'abcdefghijklmnop' });
    const bytes = hexToBytes(cipher);
    bytes[bytes.length - 1] ^= 0x01; // 篡改末尾块, 破坏 Pkcs7 填充
    const tampered = toHex(bytes);
    expect(() => sm4Decrypt(tampered, key, { mode: 'CBC', padding: 'Pkcs7', code: 'HEX', iv: 'abcdefghijklmnop' })).toThrow();
  });

  it('密钥长度错误报中文错误', () => {
    expect(() => parseSm4Key('short')).toThrow(/16 个字符|32 位 HEX/);
    expect(() => parseSm4Key('')).toThrow(/不能为空/);
  });

  it('密文 HEX 非法抛错', () => {
    expect(() => sm4Decrypt('xyz', key, { mode: 'ECB', padding: 'Pkcs7', code: 'HEX' })).toThrow(/HEX 内容不合法/);
  });

  it('CBC 缺 IV 抛错', () => {
    expect(() => sm4Encrypt('abc', key, { mode: 'CBC', padding: 'Pkcs7', code: 'HEX' })).toThrow(/IV/);
    expect(() => parseSm4Iv('x')).toThrow(/IV/);
  });

  it('密文长度非 16 倍数抛错', () => {
    expect(() => sm4Decrypt('aabb', key, { mode: 'ECB', padding: 'Pkcs7', code: 'HEX' })).toThrow(/16 字节的倍数/);
  });
});
