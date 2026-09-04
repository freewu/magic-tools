import { computeSha3Hash, getDefaultShakeBits, setDefaultShakeBits, getDefaultUpper, setDefaultUpper } from "./lib";

// 测试向量: 空串/abc/fox 由 FIPS 202 与 js-sha3 oracle 交叉验证 (js-sha3 v0.11.1)
const emptyExpected = {
  sha3_224: '6b4e03423667dbb73b6e15454f0eb1abd4597f9a1b078e3f5b5a6bc7',
  sha3_256: 'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a',
  sha3_384: '0c63a75b845e4f7d01107d852e4c2485c51a50aaaa94fc61995e71bbee983a2ac3713831264adb47fb6bd1e058d5f004',
  sha3_512: 'a69f73cca23a9ac5c8b567dc185a756e97c982164fe25859e0d1dcc1475c80a615b2123af1f5f94c11e3e9402c3ac558f500199d95b6d3e301758586281dcd26',
  shake128_256: '7f9c2ba4e88f827d616045507605853ed73b8093f6efbc88eb1a6eacfa66ef26',
  shake128_512: '7f9c2ba4e88f827d616045507605853ed73b8093f6efbc88eb1a6eacfa66ef263cb1eea988004b93103cfb0aeefd2a686e01fa4a58e8a3639ca8a1e3f9ae57e2',
  shake256_256: '46b9dd2b0ba88d13233b3feb743eeb243fcd52ea62b81b82b50c27646ed5762f',
  shake256_512: '46b9dd2b0ba88d13233b3feb743eeb243fcd52ea62b81b82b50c27646ed5762fd75dc4ddd8c0f200cb05019d67b592f6fc821c49479ab48640292eacb3b7c4be',
};

const abcExpected = {
  sha3_224: 'e642824c3f8cf24ad09234ee7d3c766fc9a3a5168d0c94ad73b46fdf',
  sha3_256: '3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532',
  sha3_384: 'ec01498288516fc926459f58e2c6ad8df9b473cb0fc08c2596da7cf0e49be4b298d88cea927ac7f539f1edf228376d25',
  sha3_512: 'b751850b1a57168a5693cd924b6b096e08f621827444f70d884f5d0240d2712e10e116e9192af3c91a7ec57647e3934057340b4cf408d5a56592f8274eec53f0',
};

describe('SHA3Hash lib', () => {
  it('空串的固定输出与 FIPS 202 一致', () => {
    const r = computeSha3Hash('', 256);
    expect(r.sha3_224).toBe(emptyExpected.sha3_224);
    expect(r.sha3_256).toBe(emptyExpected.sha3_256);
    expect(r.sha3_384).toBe(emptyExpected.sha3_384);
    expect(r.sha3_512).toBe(emptyExpected.sha3_512);
    expect(r.shake128).toBe(emptyExpected.shake128_256);
    expect(r.shake256).toBe(emptyExpected.shake256_256);
  });

  it('"abc" 的固定输出与官方向量一致', () => {
    const r = computeSha3Hash('abc', 256);
    expect(r.sha3_224).toBe(abcExpected.sha3_224);
    expect(r.sha3_256).toBe(abcExpected.sha3_256);
    expect(r.sha3_384).toBe(abcExpected.sha3_384);
    expect(r.sha3_512).toBe(abcExpected.sha3_512);
  });

  it('中文/emoji 内容按 UTF-8 计算且跨 rate 块正确', () => {
    const text = 'Keccak 你好 🌍 xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx 0'.repeat(3);
    const r = computeSha3Hash(text, 256);
    expect(r.sha3_224).toBe('48a705f140b013cc883a01b169869f9cf8e60ced27ce13458ea84e09');
    expect(r.sha3_256).toBe('e92c410207f4d1acb10bfc7cc6063e158dde91698c64425a328ccc082763fb65');
    expect(r.sha3_384).toBe('ce7ffd8013ed8a482722ef3cc265eba7333ada13c0029509071b45576cd2567de85eb22f44f411f3ee02f2220bdf1e1c');
    expect(r.sha3_512).toBe('4b062f78164c3b63a49cb7cea02da84201bf9e185f7a6cfd3d1781a4ce05dbd3f8d754b3a5c01f556e48fea1d7f6ef555538fadcb8e1294a3964d5f3feace039');
  });

  it('SHAKE 输出长度可扩展 (512 bit / 1024 bit)', () => {
    const r512 = computeSha3Hash('', 512);
    expect(r512.shake128).toBe(emptyExpected.shake128_512);
    expect(r512.shake256).toBe(emptyExpected.shake256_512);
    const r1024 = computeSha3Hash('abc', 1024);
    expect(r1024.shake128.length).toBe(1024 / 4);
    expect(r1024.shake256.length).toBe(1024 / 4);
    // 前缀应与 256 bit 输出一致 (XOF 特性)
    expect(r1024.shake128.startsWith(emptyExpected.shake128_256)).toBe(false);
    expect(r1024.shake128.startsWith(computeSha3Hash('abc', 256).shake128)).toBe(true);
  });

  it('非法 SHAKE 输出长度抛出异常', () => {
    expect(() => computeSha3Hash('abc', 0)).toThrow();
    expect(() => computeSha3Hash('abc', 100)).toThrow();
    expect(() => computeSha3Hash('abc', -8)).toThrow();
    expect(() => computeSha3Hash('abc', 3.5)).toThrow();
  });

  it('localStorage 配置读写 (模拟浏览器环境)', () => {
    // node 环境无 localStorage, 跳过真实读写; 默认值逻辑直接验证常量路径
    expect(getDefaultShakeBits()).toBe(256);
    expect(getDefaultUpper()).toBe(false);
    // 手动验证非法值回退: 通过 jsdom 存在时读空值
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('sha3-hash:shake-bits');
      expect(getDefaultShakeBits()).toBe(256);
      setDefaultShakeBits(1024);
      expect(getDefaultShakeBits()).toBe(1024);
      setDefaultShakeBits(100); // 非法, 移除
      expect(getDefaultShakeBits()).toBe(256);
      setDefaultUpper(true);
      expect(getDefaultUpper()).toBe(true);
      setDefaultUpper(false);
      expect(getDefaultUpper()).toBe(false);
    }
  });
});
