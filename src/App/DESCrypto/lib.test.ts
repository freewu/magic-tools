import * as CryptoJS from 'crypto-js';
import { getMode, getPadding, genPassphraseLimitLength, getDefaultMode, setDefaultMode, getDefaultPadding, setDefaultPadding, getDefaultCode, setDefaultCode, getDefaultIV, setDefaultIV, getDefaultPassphrase, setDefaultPassphrase } from './lib';

describe('DESCrypto lib', () => {
  beforeEach(() => localStorage.clear());

  test('getMode 各模式映射到 CryptoJS 模式, 未知回退 CBC', () => {
    expect(getMode('CFB')).toBe(CryptoJS.mode.CFB);
    expect(getMode('OFB')).toBe(CryptoJS.mode.OFB);
    expect(getMode('ECB')).toBe(CryptoJS.mode.ECB);
    expect(getMode('CTR')).toBe(CryptoJS.mode.CTR);
    expect(getMode('CTRGladman')).toBe(CryptoJS.mode.CTRGladman);
    expect(getMode('UNKNOWN')).toBe(CryptoJS.mode.CBC);
  });

  test('getPadding 各填充映射, 未知回退 Pkcs7', () => {
    expect(getPadding('AnsiX923')).toBe(CryptoJS.pad.AnsiX923);
    expect(getPadding('Iso10126')).toBe(CryptoJS.pad.Iso10126);
    expect(getPadding('Iso97971')).toBe(CryptoJS.pad.Iso97971);
    expect(getPadding('ZeroPadding')).toBe(CryptoJS.pad.ZeroPadding);
    expect(getPadding('NoPadding')).toBe(CryptoJS.pad.NoPadding);
    expect(getPadding('nope')).toBe(CryptoJS.pad.Pkcs7);
  });

  test('DES 密钥长度固定 8 字节', () => {
    expect(genPassphraseLimitLength(6)).toBe(8);
    expect(genPassphraseLimitLength(64)).toBe(8);
  });

  test('默认模式/填充/字符集/IV/口令持久化', () => {
    expect(getDefaultMode()).toBe('CBC');
    expect(getDefaultPadding()).toBe('Pkcs7');
    expect(getDefaultCode()).toBe('Base64');
    expect(getDefaultIV()).toBeDefined();
    expect(getDefaultPassphrase()).toBe('');
    setDefaultMode('ECB');
    expect(getDefaultMode()).toBe('ECB');
    setDefaultPadding('ZeroPadding');
    expect(getDefaultPadding()).toBe('ZeroPadding');
    setDefaultCode('HEX');
    expect(getDefaultCode()).toBe('HEX');
    setDefaultIV('iv-1234');
    expect(getDefaultIV()).toBe('iv-1234');
    setDefaultPassphrase('secret');
    expect(getDefaultPassphrase()).toBe('secret');
  });
});
