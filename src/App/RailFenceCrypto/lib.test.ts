import { railFenceEncrypt, railFenceDecrypt } from './lib';

describe('RailFenceCrypto', () => {
  it('3 栏经典向量', () => {
    expect(railFenceEncrypt('WEAREDISCOVEREDFLEEATONCE', 3)).toBe('WECRLTEERDSOEEFEAOCAIVDEN');
  });
  it('解密还原经典向量', () => {
    expect(railFenceDecrypt('WECRLTEERDSOEEFEAOCAIVDEN', 3)).toBe('WEAREDISCOVEREDFLEEATONCE');
  });
  it('2 栏加密', () => {
    expect(railFenceEncrypt('HELLOWORLD', 2)).toBe('HLOOLELWRD'); // 偶位/奇位分行
    expect(railFenceDecrypt('HLOOLELWRD', 2)).toBe('HELLOWORLD');
  });
  it('栏数大于等于长度时保持原序', () => {
    const t = 'ABCDE';
    expect(railFenceEncrypt(t, 6)).toBe(t);
    expect(railFenceDecrypt(t, 6)).toBe(t);
    expect(railFenceEncrypt(t, 5)).toBe(t);
  });
  it('中文与 emoji 等任意字符往返', () => {
    const t = '栅栏密码测试: 你好🌍 world 123!';
    expect(railFenceDecrypt(railFenceEncrypt(t, 4), 4)).toBe(t);
    expect(railFenceDecrypt(railFenceEncrypt(t, 7), 7)).toBe(t);
  });
  it('空文本与单字符', () => {
    expect(railFenceEncrypt('', 3)).toBe('');
    expect(railFenceDecrypt('A', 5)).toBe('A');
  });
  it('栏数为 1 时原样', () => {
    expect(railFenceEncrypt('HELLO', 1)).toBe('HELLO');
  });
  it('非法栏数抛错', () => {
    expect(() => railFenceEncrypt('abc', 0)).toThrow(/栏数/);
    expect(() => railFenceDecrypt('abc', -2)).toThrow(/栏数/);
    expect(() => railFenceEncrypt('abc', 2.5)).toThrow(/栏数/);
  });
  it('加密后再加密不等于原文 (确实发生换位)', () => {
    const c = railFenceEncrypt('HELLOWORLD', 3);
    expect(c).not.toBe('HELLOWORLD');
  });
});
