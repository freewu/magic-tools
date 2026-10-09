// 祖冲之序列密码 (ZUC) — wasm 资源加载
//
// 实现来源: `zuc` crate v0.4.1 (Rust, MIT, https://github.com/Nugine/zuc) 编译为
// WebAssembly, 见 `wasm/README.md` 与 `scripts/build-zuc-wasm.sh`。
// wasm 在首次调用时懒加载, Vite 会为其生成带哈希的资源 URL (同 SM9 / VTracer 的做法)。

import wasmUrl from './wasm/zuc.wasm?url';
import { createZucEngine } from './zuc-engine';
import type { ZucEngine, ZucWasmExports } from './zuc-engine';
import type { ZucAlgorithm } from './lib';

let enginePromise :Promise<ZucEngine> | null = null;

/**
 * 初始化 wasm 引擎 (幂等)。
 *
 * 加载完成后用 GB/T 33133.1-2016 附录 A.1 的标准向量自检, 结果不符直接抛错,
 * 避免"看起来能跑但算错"的情况。
 */
export const initZuc = () :Promise<ZucEngine> => {
  if (!enginePromise) {
    enginePromise = fetch(wasmUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error('加载 zuc.wasm 失败 (HTTP ' + response.status + ')');
        }
        return response.arrayBuffer();
      })
      .then((bytes) => WebAssembly.instantiate(bytes, {}))
      .then(({ instance }) => {
        const engine = createZucEngine(instance.exports as unknown as ZucWasmExports);
        if (!engine.selfTest()) {
          throw new Error('ZUC 引擎自检未通过 (国标标准向量校验失败)');
        }
        return engine;
      })
      .catch((err :unknown) => {
        // 失败后清空缓存, 允许用户重试 (例如资源被拦截 / 网络恢复后再次点击)
        enginePromise = null;
        throw err;
      });
  }
  return enginePromise;
};

/**
 * 懒加载引擎后执行一次 XOR (序列密码: 加密与解密是同一个操作)。
 *
 * 传空数据时直接返回空数组, 不触发 wasm 加载。
 */
export const zucApply = async (algorithm :ZucAlgorithm, key :Uint8Array, iv :Uint8Array, data :Uint8Array) :Promise<Uint8Array> => {
  if (data.length === 0) return new Uint8Array(0);
  const engine = await initZuc();
  return engine.apply(algorithm, key, iv, data);
};
