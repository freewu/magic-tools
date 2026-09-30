import { getDefaultCode, setDefaultCode, getDefaultPassphrase, setDefaultPassphrase } from './lib';

describe('RC4Crypto lib', () => {
  beforeEach(() => localStorage.clear());

  test('默认字符集与口令可持久化', () => {
    expect(getDefaultCode()).toBe('Base64');
    expect(getDefaultPassphrase()).toBe('');
    setDefaultCode('HEX');
    expect(getDefaultCode()).toBe('HEX');
    setDefaultPassphrase('rc4-key');
    expect(getDefaultPassphrase()).toBe('rc4-key');
  });
});
