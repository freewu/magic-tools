// GmSSL SM9 WebAssembly 模块 (Emscripten 产物 gmssl.js) 的类型声明。
// 实际实现在同目录的 gmssl.js (由 scripts/build-gmssl-wasm.sh 生成), 此处只描述
// 本工具用到的导出, 详见 wasm/README.md 与 wasm/sm9js.c。
//
// 约定: 所有 sm9js_* 函数 "成功返回 1, 失败返回 0", 输出长度写入第 *outlen 个指针
//       指向的 size_t (wasm32 下为 4 字节, 对应 HEAPU32)。

export interface GmsslModuleConfig {
  /** 覆盖资源定位 (用于把 gmssl.wasm 指向 Vite 处理后的 hashed URL) */
  locateFile?: (path: string, scriptDirectory: string) => string;
  /** 直接提供 wasm 二进制 (node 侧使用) */
  wasmBinary?: ArrayBuffer | Uint8Array;
}

export interface GmsslModule {
  /** wasm 线性内存视图 (内存增长后会更换, 每次调用后需重新读取) */
  HEAPU8: Uint8Array;
  HEAP32: Int32Array;
  HEAPU32: Uint32Array;

  _malloc(size: number): number;
  _free(ptr: number): void;

  // --- SM9-Enc (加密) ---
  _sm9js_enc_master_key_generate(out: number, outCap: number, outLen: number): number;
  _sm9js_enc_master_key_extract(
    masterDer: number, masterLen: number, id: number, idLen: number,
    out: number, outCap: number, outLen: number): number;
  _sm9js_enc_master_key_public(
    masterDer: number, masterLen: number, out: number, outCap: number, outLen: number): number;
  _sm9js_encrypt(
    masterDer: number, masterLen: number, id: number, idLen: number,
    data: number, dataLen: number, out: number, outCap: number, outLen: number): number;
  _sm9js_encrypt_with_public(
    publicKey: number, publicKeyLen: number, id: number, idLen: number,
    data: number, dataLen: number, out: number, outCap: number, outLen: number): number;
  _sm9js_decrypt(
    userKeyDer: number, userKeyLen: number, id: number, idLen: number,
    data: number, dataLen: number, out: number, outCap: number, outLen: number): number;

  // --- SM9-Sign (签名) ---
  _sm9js_sign_master_key_generate(out: number, outCap: number, outLen: number): number;
  _sm9js_sign_master_key_extract(
    masterDer: number, masterLen: number, id: number, idLen: number,
    out: number, outCap: number, outLen: number): number;
  _sm9js_sign_master_key_public(
    masterDer: number, masterLen: number, out: number, outCap: number, outLen: number): number;
  _sm9js_sign(
    userKeyDer: number, userKeyLen: number, data: number, dataLen: number,
    out: number, outCap: number, outLen: number): number;
  _sm9js_verify(
    masterDer: number, masterLen: number, id: number, idLen: number,
    data: number, dataLen: number, sig: number, sigLen: number): number;
  _sm9js_verify_with_public(
    publicKey: number, publicKeyLen: number, id: number, idLen: number,
    data: number, dataLen: number, sig: number, sigLen: number): number;

  // --- 其他 ---
  /** 0: 明文上限 1: 密文上限 2: 加密主公钥长度 3: 签名主公钥长度 4: 签名长度 5: SM9_SIGN_CTX 大小 */
  _sm9js_limits(which: number): number;
  _sm9js_rand_test(out: number, len: number): number;
}

declare const createGmsslModule: (config?: GmsslModuleConfig) => Promise<GmsslModule>;

export default createGmsslModule;
