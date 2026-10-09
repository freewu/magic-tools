// `zuc.wasm` (Rust → wasm32-unknown-unknown 产物) 的导出声明。
//
// 二进制在 `wasm/zuc.wasm`, 源码在 `wasm/crate/src/lib.rs`, 构建脚本 `scripts/build-zuc-wasm.sh`,
// 说明见 `wasm/README.md`。这里是纯手写声明 (没有 Emscripten / wasm-bindgen 生成的 glue),
// 只描述本工具用到的导出。
//
// 约定:
//   * `*_apply` 一律 **成功返回 0, 失败返回负数** (-1 密钥长度错 / -2 IV 长度错 / -3 空指针);
//   * 指针均为 wasm 线性内存 (导出 `memory`) 中的偏移量, 由 `zuc_alloc` 分配、`zuc_free` 释放;
//   * 每次分配后内存可能增长 (`memory.grow`), 之前的 `ArrayBuffer` 会失效, 因此字节视图必须"用前再建"。

export interface ZucWasmExports {
  /** wasm 线性内存 (alloc 后 buffer 可能更换) */
  readonly memory :WebAssembly.Memory;
  /** 分配 len 字节 (len 为 0 时按 1 字节分配), 失败返回 0 */
  zuc_alloc(len :number) :number;
  /** 释放 zuc_alloc 分配的 len 字节 */
  zuc_free(ptr :number, len :number) :void;
  /** ZUC-128 (GB/T 33133.1-2016) 原地 XOR 密钥流: 加密与解密为同一操作 */
  zuc128_apply(keyPtr :number, keyLen :number, ivPtr :number, ivLen :number, dataPtr :number, dataLen :number) :number;
  /** ZUC-256 (ZUC256-version1.1) 原地 XOR 密钥流: 加密与解密为同一操作 */
  zuc256_apply(keyPtr :number, keyLen :number, ivPtr :number, ivLen :number, dataPtr :number, dataLen :number) :number;
  /** 长度查询: 0=ZUC-128 密钥 1=ZUC-128 IV 2=ZUC-256 密钥 3=ZUC-256 IV, 其它返回 0 */
  zuc_limits(which :number) :number;
  /** 引擎自检: 国标向量一致返回 1, 否则 0 */
  zuc_selftest() :number;
  /** 标准号文本: 0=ZUC-128 (GB/T 33133.1-2016) 1=ZUC-256 (ZUC256-version1.1), 返回写入字节数 */
  zuc_spec(which :number, outPtr :number, cap :number) :number;
}
