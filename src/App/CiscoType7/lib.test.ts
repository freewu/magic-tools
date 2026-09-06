import { TYPE7_KEY, TYPE7_SALT_MAX, TYPE7_SALT_MIN, decryptType7, encryptType7 } from './lib';

describe('Cisco Type 7 加解密', () => {

  it('密钥表与业界通用串一致', () => {
    expect(TYPE7_KEY).toBe('tfd;kfoA,.iyewrkldJKDHSUBsgvCa6983;tzqxR59ee$eoH');
  });

  it('手算向量: 明文 A 盐 0 得 0035', () => {
    // 'A' = 0x41 XOR 密钥表[0] 't' = 0x74 -> 0x35
    expect(encryptType7('A', 0)).toBe('0035');
  });

  it('手算向量: 明文 cisco 盐 1 得 01050D480809', () => {
    // c=0x63^key[1]'f'=0x66->05; i=0x69^key[2]'d'=0x64->0d; s=0x73^key[3]';'=0x3b->48;
    // c=0x63^key[4]'k'=0x6b->08; o=0x6f^key[5]'f'=0x66->09
    expect(encryptType7('cisco', 1)).toBe('01050D480809');
  });

  it('加解密往返: ASCII 与 UTF-8 中文, 跨密钥表回绕', () => {
    for (let salt = TYPE7_SALT_MIN; salt <= TYPE7_SALT_MAX; salt++) {
      // 明文长度超过密钥表长度 - salt, 覆盖 (salt+i)%len 回绕
      const long = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ中文测试#@!';
      expect(decryptType7(encryptType7(long, salt))).toBe(long);
      expect(decryptType7(encryptType7('cisco', salt))).toBe('cisco');
    }
  });

  it('解密容忍大小写与空白分隔', () => {
    expect(decryptType7('00 35')).toBe('A');
    expect(decryptType7('0035')).toBe('A');
    expect(decryptType7('\n00\t35 \r\n')).toBe('A');
    expect(decryptType7('01050d480809')).toBe('cisco'); // 小写输入
  });

  it('加密 salt 钳制在 0~15', () => {
    expect(encryptType7('A', 99).slice(0, 2)).toBe('0F');
    expect(encryptType7('A', -3).slice(0, 2)).toBe('00');
    // 随机盐(缺省)落在合法区间且结果可解密
    const h = encryptType7('hello');
    const salt = parseInt(h.slice(0, 2), 16);
    expect(salt).toBeGreaterThanOrEqual(TYPE7_SALT_MIN);
    expect(salt).toBeLessThanOrEqual(TYPE7_SALT_MAX);
    expect(decryptType7(h)).toBe('hello');
  });

  it('非法输入报错', () => {
    expect(() => decryptType7('')).toThrow();
    expect(() => decryptType7('0')).toThrow(); // 奇数位
    expect(() => decryptType7('001')).toThrow();
    expect(() => decryptType7('ZZ35')).toThrow(); // 盐非法
    expect(() => decryptType7('00GG')).toThrow(); // 含非十六进制
    expect(() => decryptType7('0x0035')).toThrow();
  });

  it('空明文往返', () => {
    const h = encryptType7('', 5);
    expect(h).toBe('05');
    expect(decryptType7(h)).toBe('');
  });
});
