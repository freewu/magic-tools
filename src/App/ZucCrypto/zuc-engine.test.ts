import fs from 'fs';
import path from 'path';
import { createZucEngine, ZucEngineError } from './zuc-engine';
import type { ZucEngine, ZucWasmExports } from './zuc-engine';

// ZUC 的 wasm 是纯计算模块 (零导入、无文件系统/网络), 因此这里直接加载 **真实产物**
// src/App/ZucCrypto/wasm/zuc.wasm 做端到端断言, 而不是用替身糊弄过去。
// 期望值来自 GB/T 33133.1-2016 附录 A 与 ZUC256-version1.1 的标准向量。
// 拷一份到 Uint8Array (fs 返回的 Buffer 在 TS 里是 ArrayBufferLike, 不能直接喂给 WebAssembly)
const wasmBytes = new Uint8Array(fs.readFileSync(path.join(__dirname, 'wasm', 'zuc.wasm')));

const loadEngine = () :ZucEngine => {
  const module = new WebAssembly.Module(wasmBytes);
  const instance = new WebAssembly.Instance(module, {});
  return createZucEngine(instance.exports as unknown as ZucWasmExports);
};

const hex = (bytes :Uint8Array) :string => Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (value :string) :Uint8Array => Uint8Array.from((value.match(/../g) ?? []).map((h) => parseInt(h, 16)));

describe('ZUC wasm 引擎 (真实 zuc.wasm)', () => {
  const engine = loadEngine();

  test('引擎自检通过 (国标标准向量)', () => {
    expect(engine.selfTest()).toBe(true);
  });

  test('wasm 上报的密钥 / IV 长度与标准一致', () => {
    expect(engine.limits()).toEqual({ key128: 16, iv128: 16, key256: 32, iv256: 23 });
  });

  test('ZUC-128 标准向量 (GB/T 33133.1-2016 附录 A)', () => {
    const zeros = new Uint8Array(8);
    // 例 1: 密钥 / IV 全 0
    expect(hex(engine.apply('ZUC-128', new Uint8Array(16), new Uint8Array(16), zeros))).toBe('27bede74018082da');
    // 例 2: 密钥 / IV 全 ff
    expect(hex(engine.apply('ZUC-128', new Uint8Array(16).fill(0xff), new Uint8Array(16).fill(0xff), zeros))).toBe('0657cfa07096398b');
    // 例 3: 任意密钥 / IV (标准附录 A.3)
    const key = fromHex('3d4c4be96a82fdaeb58f641db17b455b');
    const iv = fromHex('84319aa8de6915ca1f6bda6bfbd8c766');
    expect(hex(engine.apply('ZUC-128', key, iv, zeros))).toBe('14f1c2723279c419');
  });

  test('ZUC-256 标准向量 (ZUC256 draft)', () => {
    const zeros = new Uint8Array(8);
    // 密钥 / IV 全 0
    expect(hex(engine.apply('ZUC-256', new Uint8Array(32), new Uint8Array(23), zeros))).toBe('58d03ad62e032ce2');
    // 密钥 / IV 全 ff
    expect(hex(engine.apply('ZUC-256', new Uint8Array(32).fill(0xff), new Uint8Array(23).fill(0xff), zeros))).toBe('3356cbaed1a1c18b');
  });

  test('加密与解密对称 (含空数据与非 4 字节整数倍长度)', () => {
    const key = fromHex('000102030405060708090a0b0c0d0e0f');
    const iv = fromHex('0f0e0d0c0b0a09080706050403020100');

    // 空数据: 返回空数组
    expect(engine.apply('ZUC-128', key, iv, new Uint8Array(0)).length).toBe(0);

    for(const len of [ 1, 3, 4, 5, 17, 64 ]) {
      const plain = Uint8Array.from({ length: len }, (_, i) => (i * 37 + 11) & 0xff);
      const cipher = engine.apply('ZUC-128', key, iv, plain);
      // 密钥流不为 0, 密文必然与明文不同
      expect(hex(cipher)).not.toBe(hex(plain));
      // 同一密钥 / IV 再异或一次即还原
      expect(hex(engine.apply('ZUC-128', key, iv, cipher))).toBe(hex(plain));
    }
  });

  test('ZUC-256 加解密对称 (32 B 密钥 / 23 B IV)', () => {
    const key = new Uint8Array(32).map((_, i) => (i * 7 + 1) & 0xff);
    const iv = new Uint8Array(23).map((_, i) => (i * 13 + 5) & 0xff);
    const plain = new TextEncoder().encode('祖冲之序列密码 ZUC-256 roundtrip');
    const cipher = engine.apply('ZUC-256', key, iv, plain);
    expect(new TextDecoder().decode(engine.apply('ZUC-256', key, iv, cipher))).toBe('祖冲之序列密码 ZUC-256 roundtrip');
  });

  test('1 MB 数据往返 (wasm 内存增长后仍可正确读写)', () => {
    const key = new Uint8Array(16).fill(7);
    const iv = new Uint8Array(16).fill(9);
    const big = new Uint8Array(1024 * 1024).map((_, i) => i & 0xff);
    const cipher = engine.apply('ZUC-128', key, iv, big);
    expect(cipher.length).toBe(big.length);
    expect(hex(cipher.subarray(0, 16))).not.toBe(hex(big.subarray(0, 16)));
    expect(engine.apply('ZUC-128', key, iv, cipher)).toEqual(big);
  });

  test('密钥 / IV 长度非法时抛 ZucEngineError (不会让 wasm 崩溃)', () => {
    const cases :Array<[ 'ZUC-128' | 'ZUC-256', number, number, string ]> = [
      [ 'ZUC-128', 15, 16, 'key-length' ],
      [ 'ZUC-128', 16, 17, 'iv-length' ],
      [ 'ZUC-256', 32, 16, 'iv-length' ],
      [ 'ZUC-256', 16, 23, 'key-length' ],
    ];
    for(const [ algorithm, keyLen, ivLen, code ] of cases) {
      let error :unknown = null;
      try {
        engine.apply(algorithm, new Uint8Array(keyLen), new Uint8Array(ivLen), new Uint8Array(4));
      } catch (e) { error = e; }
      expect(error).toBeInstanceOf(ZucEngineError);
      expect((error as ZucEngineError).code).toBe(code);
    }
    // 报错后引擎依然可用
    expect(engine.selfTest()).toBe(true);
  });
});
