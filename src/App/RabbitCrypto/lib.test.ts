import { getDefaultCode, setDefaultCode, getDefaultIV, setDefaultIV, getDefaultPassphrase, setDefaultPassphrase, genPassphraseLimitLength } from './lib';

describe('RabbitCrypto lib', () => {
  beforeEach(() => localStorage.clear());

  test('默认值持久化', () => {
    expect(getDefaultCode()).toBe('Base64');
    setDefaultCode('BASE64');
    expect(getDefaultCode()).toBe('BASE64');
    setDefaultIV('iv');
    expect(getDefaultIV()).toBe('iv');
    setDefaultPassphrase('rabbit');
    expect(getDefaultPassphrase()).toBe('rabbit');
  });

  test('Rabbit 密钥长度固定 16 字节', () => {
    expect(genPassphraseLimitLength(3)).toBe(16);
  });
});
