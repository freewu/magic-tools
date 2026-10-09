// ZUC wasm 模块的 C ABI 封装
//
// `wasm/zuc.wasm` 由 `wasm/crate` (Rust, 见 `wasm/README.md`) 编译产出, 只导出少量 C 函数
// 与线性内存, 没有 Emscripten / wasm-bindgen glue:
//   * zuc_alloc / zuc_free   —— 在 wasm 线性内存里分配 / 释放字节缓冲
//   * zuc128_apply / zuc256_apply —— 对缓冲原地 XOR 密钥流 (序列密码: 加密即解密)
//   * zuc_limits             —— 查询各算法的密钥 / IV 长度
//   * zuc_selftest           —— 用 GB/T 33133.1-2016 附录 A.1 向量做引擎自检
//
// 本文件 **不导入 wasm 资源** (那是 zuc.ts 的职责), 因此单测既可以直接喂真实 wasm 实例,
// 也可以喂模拟实例。

import { ZUC_PARAMS, type ZucAlgorithm } from "./lib";
import type { ZucWasmExports } from "./wasm/zuc";

export type { ZucWasmExports };

export type ZucEngineErrorCode = 'memory' | 'key-length' | 'iv-length' | 'wasm';

export class ZucEngineError extends Error {
  readonly code :ZucEngineErrorCode;

  constructor(code :ZucEngineErrorCode, message :string) {
    super(message);
    this.name = 'ZucEngineError';
    this.code = code;
  }
}

export type ZucEngine = {
  /** 原地 XOR 密钥流并返回新数组 (算法 = 加密 / 解密同一个操作) */
  apply(algorithm :ZucAlgorithm, key :Uint8Array, iv :Uint8Array, data :Uint8Array) :Uint8Array;
  /** 读取 wasm 侧报告的密钥 / IV 长度 */
  limits() :{ key128 :number; iv128 :number; key256 :number; iv256 :number };
  /** 用国标附录 A.1 标准向量自检 */
  selfTest() :boolean;
}

/** 把 wasm 实例的导出包装成带内存管理的引擎 */
export const createZucEngine = (exports :ZucWasmExports) :ZucEngine => {
  // 视图必须「用前再建」: zuc_alloc 可能触发 memory.grow, 而 grow 会让原有 ArrayBuffer 失效
  const view = (ptr :number, len :number) :Uint8Array => new Uint8Array(exports.memory.buffer, ptr, len);

  const alloc = (len :number) :number => {
    const ptr = exports.zuc_alloc(len);
    if (!ptr) throw new ZucEngineError('memory', 'wasm 内存分配失败, 数据可能过大');
    return ptr;
  };

  const apply = (algorithm :ZucAlgorithm, key :Uint8Array, iv :Uint8Array, data :Uint8Array) :Uint8Array => {
    const params = ZUC_PARAMS[algorithm];
    if (key.length !== params.keyLen) {
      throw new ZucEngineError('key-length', '密钥长度必须为 ' + params.keyLen + ' 字节');
    }
    if (iv.length !== params.ivLen) {
      throw new ZucEngineError('iv-length', 'IV 长度必须为 ' + params.ivLen + ' 字节');
    }

    // 三块内存全部申请成功后再创建视图 / 写入, 避免中途 grow 导致的视图失效
    const keyPtr = alloc(key.length);
    const ivPtr = alloc(iv.length);
    const dataPtr = alloc(data.length);
    try {
      view(keyPtr, key.length).set(key);
      view(ivPtr, iv.length).set(iv);
      view(dataPtr, data.length).set(data);

      const code = (algorithm === 'ZUC-128')
        ? exports.zuc128_apply(keyPtr, key.length, ivPtr, iv.length, dataPtr, data.length)
        : exports.zuc256_apply(keyPtr, key.length, ivPtr, iv.length, dataPtr, data.length);
      if (code !== 0) {
        throw new ZucEngineError('wasm', 'ZUC 运算失败 (wasm 返回 ' + code + ')');
      }
      // 复制出来: wasm 内存后续会被复用
      return view(dataPtr, data.length).slice();
    } finally {
      exports.zuc_free(keyPtr, key.length);
      exports.zuc_free(ivPtr, iv.length);
      exports.zuc_free(dataPtr, data.length);
    }
  };

  const limits = () => ({
    key128: exports.zuc_limits(0),
    iv128: exports.zuc_limits(1),
    key256: exports.zuc_limits(2),
    iv256: exports.zuc_limits(3),
  });

  const selfTest = () :boolean => exports.zuc_selftest() === 1;

  return { apply, limits, selfTest };
}
