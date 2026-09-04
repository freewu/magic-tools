import { vigenereEncrypt, vigenereDecrypt, vigenereKeyValid } from './lib';

describe('VigenereCrypto', () => {
  it('LEMON / ATTACKATDAWN 经典向量', () => {
    expect(vigenereEncrypt('ATTACKATDAWN', 'LEMON')).toBe('LXFOPVEFRNHR');
    expect(vigenereDecrypt('LXFOPVEFRNHR', 'LEMON')).toBe('ATTACKATDAWN');
  });
  it('大小写分别保持', () => {
    expect(vigenereEncrypt('AttackAtDawn', 'lemon')).toBe('LxfopvEfRnhr');
    expect(vigenereDecrypt('LxfopvEfRnhr', 'lemon')).toBe('AttackAtDawn');
  });
  it('密钥大小写不敏感', () => {
    expect(vigenereEncrypt('ATTACK', 'LeMoN')).toBe('LXFOPV');
  });
  it('非字母字符原样保留且不消耗密钥', () => {
    expect(vigenereEncrypt('你好 hello, world!', 'KEY')).toBe('你好 rijvs, uyvjn!');
    expect(vigenereDecrypt('你好 rijvs, uyvjn!', 'KEY')).toBe('你好 hello, world!');
  });
  it('环绕边界', () => {
    expect(vigenereEncrypt('Z', 'B')).toBe('A');
    expect(vigenereEncrypt('A', 'Z')).toBe('Z');
    expect(vigenereDecrypt('A', 'B')).toBe('Z');
  });
  it('单字符密钥等价于凯撒位移', () => {
    expect(vigenereEncrypt('HELLO', 'D')).toBe('KHOOR'); // 位移 3
    expect(vigenereDecrypt('KHOOR', 'd')).toBe('HELLO');
  });
  it('空明文', () => {
    expect(vigenereEncrypt('', 'KEY')).toBe('');
  });
  it('非法密钥抛错 (空 / 含非字母)', () => {
    expect(() => vigenereEncrypt('abc', '')).toThrow(/密钥/);
    expect(() => vigenereDecrypt('abc', '12ab')).toThrow(/英文字母/);
    expect(() => vigenereEncrypt('abc', 'a b')).toThrow(/英文字母/);
  });
  it('vigenereKeyValid 校验', () => {
    expect(vigenereKeyValid('LEMON')).toBe(true);
    expect(vigenereKeyValid('')).toBe(true);
    expect(vigenereKeyValid('le mon')).toBe(false);
    expect(vigenereKeyValid('KEY1')).toBe(false);
  });
});
