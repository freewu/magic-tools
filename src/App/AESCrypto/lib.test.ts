import * as CryptoJS from 'crypto-js';
import { getMode, getPadding, genPassphraseLimitLength, genCapacity, getDefaultMode, setDefaultMode, getDefaultPadding, setDefaultPadding, getDefaultCode, setDefaultCode, getDefaultIV, setDefaultIV, getDefaultPassphrase, setDefaultPassphrase } from './lib';

describe('AESCrypto lib', () => {
  beforeEach(() => localStorage.clear());

  test('getMode 各模式映射到 CryptoJS 模式, 未知回退 CBC', () => {
    expect(getMode('CFB')).toBe(CryptoJS.mode.CFB);
    expect(getMode('OFB')).toBe(CryptoJS.mode.OFB);
    expect(getMode('ECB')).toBe(CryptoJS.mode.ECB);
    expect(getMode('CTR')).toBe(CryptoJS.mode.CTR);
    expect(getMode('CTRGladman')).toBe(CryptoJS.mode.CTRGladman);
    expect(getMode('anything-else')).toBe(CryptoJS.mode.CBC);
  });

  test('getPadding 各填充映射, 未知回退 Pkcs7', () => {
    expect(getPadding('AnsiX923')).toBe(CryptoJS.pad.AnsiX923);
    expect(getPadding('Iso10126')).toBe(CryptoJS.pad.Iso10126);
    expect(getPadding('Iso97971')).toBe(CryptoJS.pad.Iso97971);
    expect(getPadding('ZeroPadding')).toBe(CryptoJS.pad.ZeroPadding);
    expect(getPadding('NoPadding')).toBe(CryptoJS.pad.NoPadding);
    expect(getPadding('unknown')).toBe(CryptoJS.pad.Pkcs7);
  });

  test('密钥长度分档: 16/24/32 (AES-128/192/256)', () => {
    expect(genPassphraseLimitLength(0)).toBe(16);
    expect(genPassphraseLimitLength(15)).toBe(16);
    expect(genPassphraseLimitLength(20)).toBe(24);
    expect(genPassphraseLimitLength(29)).toBe(24);
    expect(genPassphraseLimitLength(30)).toBe(32);
    expect(genPassphraseLimitLength(64)).toBe(32);
  });

  test('genCapacity 由密钥长度推导位宽', () => {
    expect(genCapacity(16)).toBe(128);
    expect(genCapacity(24)).toBe(192);
    expect(genCapacity(32)).toBe(256);
  });

  test('默认模式/填充/字符集/IV/密钥持久化', () => {
    expect(getDefaultMode()).toBe('CBC');
    expect(getDefaultPadding()).toBe('Pkcs7');
    expect(getDefaultCode()).toBe('Base64');
    expect(getDefaultIV()).toBe('');
    expect(getDefaultPassphrase()).toBe('');

    setDefaultMode('GCM');
    expect(getDefaultMode()).toBe('GCM');
    setDefaultPadding('ZeroPadding');
    expect(getDefaultPadding()).toBe('ZeroPadding');
    setDefaultCode('HEX');
    expect(getDefaultCode()).toBe('HEX');
    setDefaultIV('0123456789abcdef');
    expect(getDefaultIV()).toBe('0123456789abcdef');
    setDefaultPassphrase('1234567890abcdef');
    expect(getDefaultPassphrase()).toBe('1234567890abcdef');
  });
});
