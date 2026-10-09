# ZUC WebAssembly 模块

本目录是 **祖冲之序列密码 (ZUC)** 的 WebAssembly 实现, 供「祖冲之序列密码」工具调用。
产物随仓库提交, **应用构建 (Vite / Tauri / Cloudflare Pages) 不需要 Rust 工具链**。

算法实现来自 [`zuc`](https://github.com/Nugine/zuc) crate v0.4.1 (Rust, MIT):

| 算法 | 依据 | 密钥 | IV |
|------|------|------|----|
| ZUC-128 | GB/T 33133.1-2016 (= 128-EEA3, GB/T 33133.2-2021 的保密性算法) | 128 位 (16 B) | 128 位 (16 B) |
| ZUC-256 | ZUC256-version1.1 | 256 位 (32 B) | 184 位 (23 B) |

ZUC 是**序列密码 (流密码)**, 加密与解密是同一个操作: `数据 XOR 密钥流`。
本工具按标准做法把密钥流按 32 位字**大端字节序**异或到数据上 (`zuc::zuc128::zuc128_xor_inplace` 即 EEA3 的实现)。

| 文件 | 说明 |
|------|------|
| `zuc.wasm` | WebAssembly 二进制 (19 KB, 无任何导入, 无 Emscripten/wasm-bindgen glue) |
| `zuc.d.ts` | wasm 导出 (C ABI) 的 TypeScript 声明 |
| `crate/` | Rust 薄封装源码 (`Cargo.toml` + `src/lib.rs`), 唯一职责是把 `zuc` crate 适配成 C ABI |
| `zuc.ts` (`../zuc.ts`) | wasm 资源加载 (懒加载 + `?url` 交给 Vite 处理) |
| `zuc-engine.ts` (`../zuc-engine.ts`) | C ABI 调用封装 (分配/写入/调用/读回/释放) |
| `README.md` | 本文件 |

## 重新构建

```bash
# 需要 rustup + cargo (stable), 并安装目标:
rustup target add wasm32-unknown-unknown
bash scripts/build-zuc-wasm.sh
```

脚本把 `crate/` 同步到工作目录 (`WORKDIR`, 默认 `/tmp/zuc-wasm-build`) 编译到
`wasm32-unknown-unknown`, 产物覆盖 `zuc.wasm`, 最后用 node 跑一遍国标向量 + 加解密往返冒烟测试。
构建环境记录: cargo 1.95.0 / rustc stable / `zuc` 0.4.1 / `opt-level="z"` + LTO + `panic="abort"` + strip
(WSL 下可直接 `WORKDIR=E:/work/tmp/zuc-wasm-build bash scripts/build-zuc-wasm.sh`)。

> 为什么不用 wasm-bindgen / wasm-pack: 这里只需要几个"字符串/字节进、字节出"的函数,
> 手写 C ABI + `WebAssembly.instantiate` 比引入 wasm-bindgen 运行时更小、更可控
> (产物 19 KB 且零导入, 兼容 Web / Tauri WebView)。
> 也不用 `wasm32-wasip1`: 那需要 WASI 运行时, 浏览器里跑不起来。

## C 侧导出 (crate/src/lib.rs)

| 函数 | 说明 |
|------|------|
| `zuc_alloc(len) -> ptr` | 在 wasm 线性内存分配 `len` 字节 (0 按 1 分配), 失败返回 0 |
| `zuc_free(ptr, len)` | 释放 `zuc_alloc` 分配的内存 (`len` 需一致) |
| `zuc128_apply(key, key_len, iv, iv_len, data, data_len) -> i32` | ZUC-128 原地 XOR 密钥流, 加密 = 解密 |
| `zuc256_apply(key, key_len, iv, iv_len, data, data_len) -> i32` | ZUC-256 原地 XOR 密钥流, 加密 = 解密 |
| `zuc_limits(which) -> u32` | 0=ZUC-128 密钥 1=ZUC-128 IV 2=ZUC-256 密钥 3=ZUC-256 IV, 其它 0 |
| `zuc_selftest() -> i32` | 用 GB/T 33133.1-2016 附录 A.1 标准向量自检, 一致返回 1 |
| `zuc_spec(which, out, cap) -> usize` | 标准号文本: 0=`GB/T 33133.1-2016` 1=`ZUC256-version1.1`, 返回写入字节数 |

返回值约定: `*_apply` **成功返回 0**, 失败返回负数 (-1 密钥长度错 / -2 IV 长度错 / -3 空指针);
参数非法一律不 panic (panic 会让 wasm 实例报废, 页面必须重新加载)。

## 验证记录 (v0.4.1 产物, zuc.wasm 19378 B)

1. **Rust 单测** (`cd crate && cargo test`, 6 项): 走一遍 `zuc_alloc` → 指针 → `zuc128_apply` /
   `zuc256_apply` 的完整链路, 断言 GB/T 33133.1-2016 附录 A 的三组标准向量、ZUC256-version1.1 向量、
   空/1/3/4/5/17/64 字节的加解密往返、长度非法返回负数、`zuc_limits` / `zuc_selftest` / `zuc_spec`。
2. **构建脚本内置 node 冒烟测试**: 真实 `zuc.wasm` 实例上断言
   ZUC-128 全 0 密钥/IV → `27bede74018082da`、全 `ff` 密钥/IV → `0657cfa07096398b`、
   ZUC-256 全 0 密钥/IV → `58d03ad62e032ce2`, UTF-8 文本加解密往返还原。
3. **TS 层** (`npm test -- src/App/ZucCrypto`): `zuc-engine.test.ts` 直接 `fs.readFileSync` 真实
   `zuc.wasm` 实例化后调用 `createZucEngine`, 逐项断言同一批国标向量、1 MB 数据往返 (触发
   `memory.grow` 后的视图重建)、长度校验错误、`limits()` / `selfTest()`。
4. **构建产物**: `npm run build:renderer` 后 `dist/assets/zuc-*.wasm` 正常输出, 代码里被 Vite
   重写为带哈希的资源 URL (适配 `base: './'` 的 Tauri / Pages 子路径)。

## 注意

* `zuc_alloc` 可能触发 `memory.grow`, 增长会**换掉** `memory.buffer`: JS 侧必须在每次分配后
  重新创建 `Uint8Array` 视图 (见 `../zuc-engine.ts`)。
* 一次性数据量受 wasm32 线性内存限制, 页面按文本域输入使用, 不做逐块流式处理 (实际几 MB 无压力)。
* `crate/Cargo.lock` 未提交 (仓库 `.gitignore` 忽略 `*.lock`), `zuc` 已在 `Cargo.toml` 里用 `=0.4.1` 锁定;
  重新构建时若出现行为差异, 先核对 `zuc` crate 版本。
