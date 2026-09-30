import * as CryptoJS from 'crypto-js';
import { getMode, getPadding, genPassphraseLimitLength, getDefaultMode, setDefaultMode, getDefaultPadding, setDefaultPadding, getDefaultCode, setDefaultCode, getDefaultIV, setDefaultIV, getDefaultPassphrase, setDefaultPassphrase } from './lib';

describe('TripleDESCrypto lib', () => {
  beforeEach(() => localStorage.clear());

  test('getMode / getPadding 默认回退 CBC/Pkcs7, 已知值映射正确', () => {
    expect(getMode('ECB')).toBe(CryptoJS.mode.ECB);
    expect(getMode('bad')).toBe(CryptoJS.mode.CBC);
    expect(getPadding('NoPadding')).toBe(CryptoJS.pad.NoPadding);
    expect(getPadding('bad')).toBe(CryptoJS.pad.Pkcs7);
  });

  test('3DES 密钥长度固定 24 字节', () => {
    expect(genPassphraseLimitLength(0)).toBe(24);
  });

  test('默认值持久化', () => {
    setDefaultMode('CTR');
    expect(getDefaultMode()).toBe('CTR');
    setDefaultCode('BASE64');
    expect(getDefaultCode()).toBe('BASE64');
    setDefaultPassphrase('p');
    expect(getDefaultPassphrase()).toBe('p');
  });
});
