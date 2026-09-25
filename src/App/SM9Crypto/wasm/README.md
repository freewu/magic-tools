# SM9 WebAssembly 模块 (GmSSL)

本目录是 [GmSSL](https://github.com/guanzhi/GmSSL) 的 **SM9 (GM/T 0044-2016)** 实现,
由 Emscripten 编译为 WebAssembly, 供「SM9 加解密」工具调用。产物随仓库提交,
**应用构建 (Vite / Tauri / Cloudflare Pages) 不需要 Emscripten 工具链**。

| 文件 | 说明 |
|------|------|
| `gmssl.wasm` | WebAssembly 二进制 (GmSSL v3.2.0 的 SM9 + SM3 + DER 等最小依赖) |
| `gmssl.js` | Emscripten 粘合层 (ES6 模块, `-sMODULARIZE -sEXPORT_ES6`) |
| `sm9js.c` | C 薄封装: 把 GmSSL 的 DER API 适配成对 JS 友好的定长缓冲接口 |
| `gmssl.ts` (`../gmssl.ts`) | TypeScript 封装: 加载 wasm + 类型化 API |
| `README.md` | 本文件 |

## 重新构建

```bash
# 需要 Emscripten 4.x (emcc/emar) 与 curl
EMSDK=/path/to/emsdk bash scripts/build-gmssl-wasm.sh
```

脚本会下载 GmSSL 源码 (`GMSSL_VERSION`, 默认 `v3.2.0`)、编译最小源文件集合、
链接 `sm9js.c`, 输出到本目录, 最后用 node 跑一遍 SM9-Enc / SM9-Sign 冒烟测试。
构建环境记录: emcc 4.0.23-git、GmSSL v3.2.0 (commit `7c9f029`)、
`-O3 -sALLOW_MEMORY_GROWTH=1 -sFILESYSTEM=0 -sENVIRONMENT=web,worker,node`。

### 验证记录 (v3.2.0 产物)

1. **C 层**: 构建脚本内置的 node 冒烟测试 — 主/用户密钥生成、加密解密往返、签名验签均通过;
   同时验证错误 ID / 篡改密文解密失败、256 B 明文被拒绝。
2. **TS 封装层**: 把 `../gmssl.ts` 用 tsc 转成 JS (仅把 `?url` 导入换成 `new URL(..., import.meta.url)`,
   其余代码原样), 在 node 24 下加载真实 `gmssl.js` + `gmssl.wasm` 逐项断言:
   加密主私钥 104 B / 主公钥 65 B / 用户私钥 204 B / 密文 DER / 解密还原 UTF-8 原文 (含 emoji),
   签名主私钥 170 B / 签名主公钥 129 B / 签名 104 B / 主公钥与主私钥验签通过,
   错误 ID 与篡改数据验签失败, 256 B 明文与非法密文报错 (页面 `run()` 捕获后提示), `resetSm9()` 可重新初始化。
3. **构建产物**: `npm run build:renderer` 后 `dist/assets/gmssl-*.wasm` 正常输出,
   代码里被 Vite 重写为 `new URL("gmssl-*.wasm", import.meta.url)` (适配 `base: './'` 的 Tauri / Pages 子路径)。

## C 侧导出 (sm9js.c)

所有函数 **成功返回 1, 失败返回 0**, 输出长度写入 `size_t *outlen`; 调用方提供输出缓冲区与容量。

| 函数 | 输入 | 输出 |
|------|------|------|
| `sm9js_enc_master_key_generate(out, cap, len)` | — | 加密主私钥 DER (104 B) |
| `sm9js_enc_master_key_extract(mder, n, id, idlen, out, cap, len)` | 主私钥 DER + ID | 加密用户私钥 DER (204 B) |
| `sm9js_enc_master_key_public(mder, n, out, cap, len)` | 主私钥 DER | 加密主公钥 (65 B) |
| `sm9js_encrypt(mder, n, id, idlen, in, inlen, out, cap, len)` | 主私钥 DER + ID + 明文 | SM9 密文 DER (≤ 367 B) |
| `sm9js_encrypt_with_public(pk, n, id, idlen, in, inlen, out, cap, len)` | 主公钥 (65 B) + ID + 明文 | SM9 密文 DER |
| `sm9js_decrypt(kder, n, id, idlen, in, inlen, out, cap, len)` | 用户私钥 DER + ID + 密文 | 明文 |
| `sm9js_sign_master_key_generate(out, cap, len)` | — | 签名主私钥 DER (171 B) |
| `sm9js_sign_master_key_extract(mder, n, id, idlen, out, cap, len)` | 主私钥 DER + ID | 签名用户私钥 DER (204 B) |
| `sm9js_sign_master_key_public(mder, n, out, cap, len)` | 主私钥 DER | 签名主公钥 (129 B) |
| `sm9js_sign(kder, n, data, datalen, out, cap, len)` | 用户私钥 DER + 数据 | 签名 DER (104 B) |
| `sm9js_verify(mder, n, id, idlen, data, datalen, sig, siglen)` | 主私钥 DER + ID + 数据 + 签名 | 1/0 (验证结果) |
| `sm9js_verify_with_public(pk, n, id, idlen, data, datalen, sig, siglen)` | 签名主公钥 (129 B) + … | 1/0 (验证结果) |
| `sm9js_limits(which)` | 0..5 | 明文上限 255 / 密文上限 367 / 主公钥 65 / 签名主公钥 129 / 签名 104 / `sizeof(SM9_SIGN_CTX)` |
| `sm9js_rand_test(out, len)` | — | 用宿主 CSPRNG 填充随机数 (环境自检) |

## 注意

* **随机数**: GmSSL 的 `rand_bytes()` 依赖 `/dev/urandom`, wasm 中不可用。
  `sm9js.c` 用 `EM_JS` + `crypto.getRandomValues` 重新实现 (未修改 GmSSL 源码),
  因此要求 **安全上下文** (HTTPS 或 localhost); 否则密钥生成会直接失败而不降级为弱随机。
* **明文长度上限**: SM9 单个分组的明文上限为 255 字节 (`SM9_MAX_PLAINTEXT_SIZE`),
  超长数据需在应用层分组处理, 本工具直接给出提示。
* **编码格式**: 私钥/密文/签名为 GmSSL DER (GM/T 0080-2020 结构), 界面上以 HEX 展示;
  主公钥为未压缩点字节串 (加密 65 B, 签名 129 B)。
* **密钥类型判别** (各类型的 DER 结构, 均为实测 GmSSL 输出):

  | 类型 | DER 结构 | 长度 |
  |------|----------|------|
  | 加密主私钥 | `SEQUENCE { INTEGER(32), BIT STRING(65) }` | 104 B |
  | 签名主私钥 | `SEQUENCE { INTEGER(32), BIT STRING(129) }` | 170/171 B |
  | 加密用户私钥 | `SEQUENCE { BIT STRING(129), BIT STRING(65) }` | 204 B |
  | 签名用户私钥 | `SEQUENCE { BIT STRING(65), BIT STRING(129) }` | 204 B |
  | 密文 | `SEQUENCE { INTEGER(0), BIT STRING(C1 65), OCTET STRING(C3 32), OCTET STRING(C2) }` | 108+N B |
  | 签名值 | `SEQUENCE { OCTET STRING(32 h), BIT STRING(65 S) }` | 104 B |

  签名值与加密主私钥同为 104 B, 但首元素标签不同 (`OCTET STRING` / `INTEGER`),
  可稳定区分 (见 `src/App/SM9Crypto/lib.ts` 的 `identifySm9Data`)。
