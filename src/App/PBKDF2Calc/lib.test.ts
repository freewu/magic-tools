import * as CryptoJS from 'crypto-js';
import { getHashAlgo, genValuePlaceholder, getDefaultHashAlgo, setDefaultHashAlgo, getDefaultSalt, setDefaultSalt, getDefaultIteration, setDefaultIteration, getDefaultKeyLength, setDefaultKeyLength } from './lib';

describe('PBKDF2Calc lib', () => {
  beforeEach(() => localStorage.clear());

  test('getHashAlgo 各算法映射到 CryptoJS 算法, 未知回退 SHA256', () => {
    expect(getHashAlgo('MD5')).toBe(CryptoJS.algo.MD5);
    expect(getHashAlgo('SHA1')).toBe(CryptoJS.algo.SHA1);
    expect(getHashAlgo('SHA256')).toBe(CryptoJS.algo.SHA256);
    expect(getHashAlgo('SHA512')).toBe(CryptoJS.algo.SHA512);
    expect(getHashAlgo('RIPEMD160')).toBe(CryptoJS.algo.RIPEMD160);
    expect(getHashAlgo('xx')).toBe(CryptoJS.algo.SHA256);
  });

  test('genValuePlaceholder 带算法名', () => {
    expect(genValuePlaceholder('SHA256')).toContain('PBKDF2-SHA256');
  });

  test('默认算法 / 盐 / 迭代 / 密钥长度持久化与默认值', () => {
    expect(getDefaultHashAlgo()).toBe('SHA256');
    expect(getDefaultSalt()).toBeDefined();
    expect(getDefaultIteration()).toBeGreaterThan(0);
    expect(getDefaultKeyLength()).toBeGreaterThan(0);
    setDefaultHashAlgo('SHA512');
    expect(getDefaultHashAlgo()).toBe('SHA512');
    setDefaultSalt('salt');
    expect(getDefaultSalt()).toBe('salt');
    setDefaultIteration(50000);
    expect(getDefaultIteration()).toBe(50000);
    setDefaultKeyLength(64);
    expect(getDefaultKeyLength()).toBe(64);
  });
});
