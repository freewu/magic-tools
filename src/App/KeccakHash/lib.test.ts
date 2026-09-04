import { computeKeccakHash, getDefaultUpper, setDefaultUpper } from "./lib";

// 测试向量由 js-sha3 oracle 交叉验证, 其中空串 Keccak-256 c5d2... 即以太坊空地址哈希
const emptyExpected = {
  keccak_224: 'f71837502ba8e10837bdd8d365adb85591895602fc552b48b7390abd',
  keccak_256: 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
  keccak_384: '2c23146a63a29acf99e73b88f8c24eaa7dc60aa771780ccc006afbfa8fe2479b2dd2b21362337441ac12b515911957ff',
  keccak_512: '0eab42de4c3ceb9235fc91acffe746b29c29a8c366b7c60e4e67c466f36a4304c00fa9caf9d87976ba469bcbe06713b435f091ef2769fb160cdab33d3670680e',
};

const abcExpected = {
  keccak_224: 'c30411768506ebe1c2871b1ee2e87d38df342317300a9b97a95ec6a8',
  keccak_256: '4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45',
  keccak_384: 'f7df1165f033337be098e7d288ad6a2f74409d7a60b49c36642218de161b1f99f8c681e4afaf31a34db29fb763e3c28e',
  keccak_512: '18587dc2ea106b9a1563e32b3312421ca164c7f1f07bc922a9c83d77cea3a1e5d0c69910739025372dc14ac9642629379540c17e2a65b19d77aa511a9d00bb96',
};

describe('KeccakHash lib', () => {
  it('空串的固定输出与参考实现一致 (Keccak-256 即以太坊空串哈希)', () => {
    const r = computeKeccakHash('');
    expect(r.keccak_224).toBe(emptyExpected.keccak_224);
    expect(r.keccak_256).toBe(emptyExpected.keccak_256);
    expect(r.keccak_384).toBe(emptyExpected.keccak_384);
    expect(r.keccak_512).toBe(emptyExpected.keccak_512);
  });

  it('"abc" 的固定输出一致', () => {
    const r = computeKeccakHash('abc');
    expect(r.keccak_224).toBe(abcExpected.keccak_224);
    expect(r.keccak_256).toBe(abcExpected.keccak_256);
    expect(r.keccak_384).toBe(abcExpected.keccak_384);
    expect(r.keccak_512).toBe(abcExpected.keccak_512);
  });

  it('中文/emoji 内容按 UTF-8 计算且跨 rate 块正确', () => {
    const text = 'Keccak 你好 🌍 xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx 0'.repeat(3);
    const r = computeKeccakHash(text);
    expect(r.keccak_224).toBe('8607824a071df66c564f7808df8e90de40fbdfe2a3873d1766dc0cbe');
    expect(r.keccak_256).toBe('750d2b6b539b31071dd882633aa8136653778c8e6bd4038299cb8247ec4054c2');
    expect(r.keccak_384).toBe('67f5fe7daaf2217c6a71525f826e1efe946d3103f748670b9b0592a62cd2b2c1b8c117406ee23adc59863b9a0572aaef');
    expect(r.keccak_512).toBe('2778677f9285f1bdef58f45aaa6228a80de28f69f5e66aceee38a52631101f6b119f61dd11a355f16f5ea9428f32a0a63659fcbf21e08fd1f38f6e2c188832fc');
  });

  it('Keccak 家族与 SHA3 家族结果不同 (填充域字节差异)', () => {
    const r = computeKeccakHash('abc');
    expect(r.keccak_256).not.toBe('3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532');
  });

  it('localStorage 大写配置读写 (jsdom)', () => {
    localStorage.removeItem('keccak-hash:result-upper');
    expect(getDefaultUpper()).toBe(false);
    setDefaultUpper(true);
    expect(getDefaultUpper()).toBe(true);
    setDefaultUpper(false);
    expect(getDefaultUpper()).toBe(false);
  });
});
