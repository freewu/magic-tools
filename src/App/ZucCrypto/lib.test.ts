import {
  ZUC_PARAMS,
  checkFixedHex,
  decodeBytes,
  encodeBytes,
  getDefaultAlgorithm,
  getDefaultCode,
  getDefaultIV,
  getDefaultKey,
  isAlgorithm,
  isCode,
  ivLenOf,
  keyLenOf,
  normalizeHex,
  randomHex,
  setDefaultAlgorithm,
  setDefaultCode,
  setDefaultIV,
  setDefaultKey,
} from './lib';

const hex = (bytes :Uint8Array) => Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');

beforeEach(() => {
  localStorage.clear();
});

describe('祖冲之序列密码 参数表', () => {
  test('ZUC-128 / ZUC-256 的密钥与 IV 长度符合标准', () => {
    expect(ZUC_PARAMS['ZUC-128']).toEqual({ keyLen: 16, ivLen: 16, spec: 'GB/T 33133.1-2016' });
    expect(ZUC_PARAMS['ZUC-256']).toEqual({ keyLen: 32, ivLen: 23, spec: 'ZUC256-version1.1' });
    expect(keyLenOf('ZUC-128')).toBe(16);
    expect(ivLenOf('ZUC-128')).toBe(16);
    expect(keyLenOf('ZUC-256')).toBe(32);
    expect(ivLenOf('ZUC-256')).toBe(23);
  });

  test('isAlgorithm / isCode 认白名单, 挡住脏数据', () => {
    expect(isAlgorithm('ZUC-128')).toBe(true);
    expect(isAlgorithm('ZUC-256')).toBe(true);
    expect(isAlgorithm('zuc-128')).toBe(false);
    expect(isAlgorithm('AES')).toBe(false);
    expect(isCode('HEX')).toBe(true);
    expect(isCode('Base64')).toBe(true);
    expect(isCode('base64')).toBe(false);
  });
});

describe('默认值读写 (localStorage)', () => {
  test('未设置时给出缺省值 (ZUC-128 / HEX / 空密钥)', () => {
    expect(getDefaultAlgorithm()).toBe('ZUC-128');
    expect(getDefaultCode()).toBe('HEX');
    expect(getDefaultKey()).toBe('');
    expect(getDefaultIV()).toBe('');
  });

  test('默认算法 / 编码 / 密钥 / IV 可往返读写', () => {
    setDefaultAlgorithm('ZUC-256');
    setDefaultCode('Base64');
    setDefaultKey('00'.repeat(32));
    setDefaultIV('ff'.repeat(23));
    expect(getDefaultAlgorithm()).toBe('ZUC-256');
    expect(getDefaultCode()).toBe('Base64');
    expect(getDefaultKey()).toBe('00'.repeat(32));
    expect(getDefaultIV()).toBe('ff'.repeat(23));
  });

  test('非法算法 / 编码落库时回退为缺省值', () => {
    setDefaultAlgorithm('RC4');
    setDefaultCode('GBK');
    expect(getDefaultAlgorithm()).toBe('ZUC-128');
    expect(getDefaultCode()).toBe('HEX');
  });

  test('localStorage 里是脏值时读取回退为缺省值', () => {
    localStorage.setItem('zuc-crypto:default-algorithm', 'SM4');
    localStorage.setItem('zuc-crypto:default-code', 'UTF8');
    expect(getDefaultAlgorithm()).toBe('ZUC-128');
    expect(getDefaultCode()).toBe('HEX');
  });
});

describe('normalizeHex', () => {
  test('去掉 0x 前缀 / 空格 / 冒号 / 短横线 / 逗号, 并转小写', () => {
    expect(normalizeHex('0xAB CD')).toBe('abcd');
    expect(normalizeHex('AB:CD')).toBe('abcd');
    expect(normalizeHex('ab-cd,ef')).toBe('abcdef');
    expect(normalizeHex('0XAA BB')).toBe('aabb');
    expect(normalizeHex('   ')).toBe('');
  });
});

describe('checkFixedHex (密钥 / IV 定长校验)', () => {
  test('长度正确时通过并给出字节内容', () => {
    const r = checkFixedHex('0x00 11:22-33', 4);
    expect(r.ok).toBe(true);
    expect(r.issue).toBeNull();
    expect(r.hex).toBe('00112233');
    expect(r.gotBytes).toBe(4);
    expect(r.needBytes).toBe(4);
    expect(hex(r.bytes as Uint8Array)).toBe('00112233');
  });

  test('空值 -> empty (未填写, 不算格式错误)', () => {
    const r = checkFixedHex('  ', 16);
    expect(r.ok).toBe(false);
    expect(r.issue).toBe('empty');
    expect(r.bytes).toBeNull();
    expect(r.gotBytes).toBe(0);
  });

  test('含非十六进制字符 -> nonhex', () => {
    expect(checkFixedHex('zz', 1).issue).toBe('nonhex');
    expect(checkFixedHex('12g4', 2).issue).toBe('nonhex');
  });

  test('奇数长度 (半个字节) -> odd', () => {
    const r = checkFixedHex('abc', 16);
    expect(r.issue).toBe('odd');
    expect(r.gotBytes).toBe(1);
  });

  test('长度不符 -> length, 并报出实际 / 需要字节数', () => {
    const short = checkFixedHex('0011', 16);
    expect(short.issue).toBe('length');
    expect(short.gotBytes).toBe(2);
    expect(short.needBytes).toBe(16);
    const long = checkFixedHex('00'.repeat(17), 16);
    expect(long.issue).toBe('length');
    expect(long.gotBytes).toBe(17);
  });

  test('ZUC-256 的 IV 需要 23 字节 (184 位)', () => {
    expect(checkFixedHex('ab'.repeat(23), ivLenOf('ZUC-256')).ok).toBe(true);
    expect(checkFixedHex('ab'.repeat(16), ivLenOf('ZUC-256')).issue).toBe('length');
  });
});

describe('randomHex', () => {
  test('生成指定字节数的 HEX, 且每次不同', () => {
    const a = randomHex(16);
    const b = randomHex(16);
    expect(a).toHaveLength(32);
    expect(/^[0-9a-f]{32}$/.test(a)).toBe(true);
    expect(a).not.toBe(b);
    expect(randomHex(23)).toHaveLength(46);
  });

  test('宿主没有安全随机数时返回空串 (页面据此提示)', () => {
    const original = globalThis.crypto;
    try {
      // 模拟非安全上下文 (无 crypto.getRandomValues)
      Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
      expect(randomHex(16)).toBe('');
    } finally {
      Object.defineProperty(globalThis, 'crypto', { value: original, configurable: true });
    }
  });
});

describe('encodeBytes / decodeBytes (HEX 与 Base64)', () => {
  const bytes = new Uint8Array([0x00, 0x11, 0xab, 0xff]);

  test('HEX 编解码往返 (输入允许带分隔符)', () => {
    expect(encodeBytes(bytes, 'HEX')).toBe('0011abff');
    expect(hex(decodeBytes('00 11:AB-FF', 'HEX'))).toBe('0011abff');
    expect(hex(decodeBytes('0011abff', 'HEX'))).toBe('0011abff');
  });

  test('Base64 编解码往返 (输入允许带空白)', () => {
    const encoded = encodeBytes(bytes, 'Base64');
    expect(encoded).toBe('ABGr/w==');
    expect(hex(decodeBytes(encoded, 'Base64'))).toBe('0011abff');
    expect(hex(decodeBytes(' ABGr/w==\n', 'Base64'))).toBe('0011abff');
  });

  test('非法 HEX 抛异常 (页面捕获后提示)', () => {
    expect(() => decodeBytes('zz', 'HEX')).toThrow();
  });

  test('空内容: 编码为空串, 空串解码按不合法处理 (页面会先拦下空输入)', () => {
    expect(encodeBytes(new Uint8Array(0), 'HEX')).toBe('');
    expect(encodeBytes(new Uint8Array(0), 'Base64')).toBe('');
    expect(() => decodeBytes('  ', 'HEX')).toThrow();
    expect(() => decodeBytes('  ', 'Base64')).toThrow();
  });
});
