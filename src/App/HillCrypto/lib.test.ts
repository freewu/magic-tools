import { hillEncrypt, hillDecrypt, hillKeySize, hillKeyShapeValid } from './lib';

describe('HillCrypto', () => {
  it('3×3 经典向量 GYBNQKURP / ACT → POH (维基百科)', () => {
    expect(hillEncrypt('ACT', 'GYBNQKURP')).toBe('POH');
    expect(hillDecrypt('POH', 'GYBNQKURP')).toBe('ACT');
  });
  it('2×2 密钥 HILL 往返', () => {
    const c = hillEncrypt('SHORT', 'hill'); // 5 个字母自动补 X
    expect(c.length).toBe(6);
    expect(hillDecrypt(c, 'HILL')).toBe('SHORTX');
  });
  it('2×2 经典向量 SH → AP (密钥 HILL, 行列式 -11≡15 可逆)', () => {
    expect(hillEncrypt('SH', 'hill')).toBe('AP');
    expect(hillDecrypt('AP', 'HILL')).toBe('SH');
  });
  it('小写输入归一化', () => {
    expect(hillEncrypt('act', 'gybnqkurp')).toBe('POH');
  });
  it('自动移除空格与非字母字符', () => {
    expect(hillEncrypt('a ct!', 'GYBNQKURP')).toBe(hillEncrypt('act', 'GYBNQKURP'));
    expect(hillDecrypt('P OH', 'GYBNQKURP')).toBe('ACT');
  });
  it('无字母输入返回空串', () => {
    expect(hillEncrypt('你好 123', 'GYBNQKURP')).toBe('');
    expect(hillDecrypt('', 'GYBNQKURP')).toBe('');
  });
  it('不可逆矩阵 (行列式与 26 不互质) 解密抛错, 加密不抛错', () => {
    expect(hillEncrypt('AC', 'KKKK')).toBe('UU'); // 全 10 矩阵: [[10,10],[10,10]]
    expect(() => hillDecrypt('UU', 'KKKK')).toThrow(/不可逆/);
    expect(() => hillDecrypt('POH', 'AAAA')).toThrow(/不可逆/);
  });
  it('密钥长度非法抛错', () => {
    expect(() => hillEncrypt('ACT', 'HILLX')).toThrow(/4.*9|2×2|3×3/);
    expect(() => hillDecrypt('ACT', 'AB')).toThrow(/4.*9|2×2|3×3/);
  });
  it('密文长度非矩阵阶数倍数抛错', () => {
    expect(() => hillDecrypt('POHX', 'GYBNQKURP')).toThrow(/整数倍/);
    expect(() => hillDecrypt('ABC', 'hill')).toThrow(/整数倍/);
  });
  it('hillKeySize / hillKeyShapeValid', () => {
    expect(hillKeySize('HILL')).toBe(2);
    expect(hillKeySize('gybnqkurp')).toBe(3);
    expect(hillKeySize('AB')).toBe(0);
    expect(hillKeyShapeValid('')).toBe(true);
    expect(hillKeyShapeValid('HILL')).toBe(true);
    expect(hillKeyShapeValid('AB')).toBe(false);
  });
});
