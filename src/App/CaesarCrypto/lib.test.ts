import { caesarEncrypt, caesarDecrypt, hasLetters } from './lib';

describe('CaesarCrypto', () => {
  it('shift 3 加密经典向量', () => {
    expect(caesarEncrypt('Hello, World! 123', 3)).toBe('Khoor, Zruog! 123');
  });
  it('解密还原', () => {
    expect(caesarDecrypt('Khoor, Zruog! 123', 3)).toBe('Hello, World! 123');
  });
  it('大小写分别保持', () => {
    expect(caesarEncrypt('Az', 1)).toBe('Ba');
  });
  it('负位移与超过 26 的位移取模', () => {
    expect(caesarEncrypt('Hello', -3)).toBe('Ebiil');
    expect(caesarEncrypt('Hello', 29)).toBe('Khoor');
    expect(caesarDecrypt('Khoor', 55)).toBe('Hello'); // 55 ≡ 3
  });
  it('z 环绕回 a', () => {
    expect(caesarEncrypt('Zz', 1)).toBe('Aa');
  });
  it('中文与其它字符原样保留', () => {
    expect(caesarEncrypt('你好, hello!', 3)).toBe('你好, khoor!');
    expect(caesarEncrypt('你好', 5)).toBe('你好');
  });
  it('空文本', () => {
    expect(caesarEncrypt('', 3)).toBe('');
  });
  it('非整数位移抛错', () => {
    expect(() => caesarEncrypt('abc', NaN)).toThrow(/整数/);
    expect(() => caesarEncrypt('abc', 1.5)).toThrow(/整数/);
  });
  it('hasLetters 检测', () => {
    expect(hasLetters('Hello 你好')).toBe(true);
    expect(hasLetters('123 你好')).toBe(false);
  });
});
