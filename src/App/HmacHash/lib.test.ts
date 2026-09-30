import { getDefaultPassphrase, setDefaultPassphrase } from './lib';

describe('HmacHash lib', () => {
  beforeEach(() => localStorage.clear());

  test('默认口令持久化', () => {
    expect(getDefaultPassphrase()).toBeDefined();
    setDefaultPassphrase('my-hmac-key');
    expect(getDefaultPassphrase()).toBe('my-hmac-key');
  });
});
