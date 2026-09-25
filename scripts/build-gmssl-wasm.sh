#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# 构建 SM9 (GM/T 0044) WebAssembly 模块
#
# 原理: 下载 GmSSL 源码 -> 用 Emscripten 编译 SM9 相关实现 -> 链接本仓库的
#       C 薄封装 src/App/SM9Crypto/wasm/sm9js.c -> 输出 gmssl.js + gmssl.wasm
#
# 用法:
#   EMSDK=/path/to/emsdk bash scripts/build-gmssl-wasm.sh
#   # 也可用环境变量覆盖版本/代理:
#   GMSSL_VERSION=v3.2.0 HTTPS_PROXY=http://127.0.0.1:7897 EMSDK=... bash scripts/build-gmssl-wasm.sh
#
# 依赖: emcc / emar (Emscripten 4.x), curl, tar
#
# 产物 (随仓库提交, 应用构建时无需 Emscripten):
#   src/App/SM9Crypto/wasm/gmssl.js     ES6 模块粘合层 (-sMODULARIZE -sEXPORT_ES6)
#   src/App/SM9Crypto/wasm/gmssl.wasm   WebAssembly 二进制 (~270 KB)
#
# 说明:
#   * GmSSL 的 rand_bytes() 读取 /dev/urandom, 在 wasm 中不可用, sm9js.c 用
#     EM_JS + crypto.getRandomValues 重新实现了 rand_bytes (不修改 GmSSL 源码)。
#   * 只编译 SM9 依赖的最小源文件集合 (见 SOURCES), 链接静态库时按需抽取。
#   * GmSSL 的 DER API 约定是 "追加写调用方缓冲区", sm9js.c 负责零拷贝适配。
# ---------------------------------------------------------------------------
set -euo pipefail

GMSSL_VERSION="${GMSSL_VERSION:-v3.2.0}"
GMSSL_REPO="${GMSSL_REPO:-https://codeload.github.com/guanzhi/GmSSL/tar.gz/refs/tags}"
WORKDIR="${WORKDIR:-/tmp/gmssl-wasm-build}"
EMCC_OPT="${EMCC_OPT:--O3}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT/src/App/SM9Crypto/wasm"
SHIM="$OUT_DIR/sm9js.c"

# ---- 0. Emscripten 环境 ----------------------------------------------------
if [ -n "${EMSDK:-}" ] && [ -f "$EMSDK/emsdk_env.sh" ]; then
  # shellcheck disable=SC1091
  source "$EMSDK/emsdk_env.sh" >/dev/null
fi
command -v emcc >/dev/null || { echo "错误: 未找到 emcc, 请设置 EMSDK 或先安装 Emscripten" >&2; exit 1; }
echo "== emcc: $(emcc --version | head -1)"

# ---- 1. 获取 GmSSL 源码 ----------------------------------------------------
mkdir -p "$WORKDIR/obj"
SRC_DIR="$WORKDIR/GmSSL"
if [ ! -f "$SRC_DIR/src/sm9_lib.c" ]; then
  echo "== 下载 GmSSL $GMSSL_VERSION"
  curl -fL --retry 3 ${HTTPS_PROXY:+-x "$HTTPS_PROXY"} \
    -o "$WORKDIR/gmssl.tar.gz" "$GMSSL_REPO/$GMSSL_VERSION"
  rm -rf "$SRC_DIR"
  mkdir -p "$SRC_DIR"
  tar -xzf "$WORKDIR/gmssl.tar.gz" -C "$SRC_DIR" --strip-components=1
fi
cd "$SRC_DIR"

# ---- 2. 编译 (SM9 依赖的最小集合) ------------------------------------------
# 不含任何架构相关/汇编实现 (*.S, sm3_avx2, sm4_aesni, sm9_z256_arm64.S ...),
# 也不含 rand*.c (由 sm9js.c 提供 rand_bytes)。
SOURCES="
  sm9_lib.c sm9_key.c sm9_z256.c sm9_z256_table.c
  sm3.c sm3_hmac.c sm3_kdf.c sm3_digest.c
  asn1.c hex.c base64.c debug.c digest.c hmac.c
  pem.c pkcs8.c pbkdf2.c hkdf.c file.c
  block_cipher.c sm4.c sm4_cbc.c sm4_ctr.c
  sm2_key.c sm2_z256.c sm2_z256_table.c version.c
"
rm -f "$WORKDIR"/obj/*.o
for f in $SOURCES; do
  echo "   cc src/$f"
  emcc -c -O2 -Iinclude -o "$WORKDIR/obj/$f.o" "src/$f"
done

echo "== 归档 libgmssl.a"
rm -f "$WORKDIR/libgmssl.a"
emar rcs "$WORKDIR/libgmssl.a" "$WORKDIR"/obj/*.o

# ---- 3. 链接 shim + wasm ---------------------------------------------------
EXPORTS='_sm9js_enc_master_key_generate,_sm9js_enc_master_key_extract,_sm9js_enc_master_key_public,_sm9js_encrypt,_sm9js_encrypt_with_public,_sm9js_decrypt,_sm9js_sign_master_key_generate,_sm9js_sign_master_key_extract,_sm9js_sign_master_key_public,_sm9js_sign,_sm9js_verify,_sm9js_verify_with_public,_sm9js_limits,_sm9js_rand_test,_malloc,_free'

echo "== 链接 gmssl.js / gmssl.wasm"
emcc "$SHIM" -Iinclude "$EMCC_OPT" "$WORKDIR/libgmssl.a" -o "$WORKDIR/gmssl.js" \
  -sMODULARIZE=1 \
  -sEXPORT_ES6=1 \
  -sEXPORT_NAME=createGmsslModule \
  -sENVIRONMENT=web,worker,node \
  -sEXPORTED_FUNCTIONS="$EXPORTS" \
  -sEXPORTED_RUNTIME_METHODS=HEAPU8,HEAP32,HEAPU32,getValue,setValue \
  -sALLOW_MEMORY_GROWTH=1 \
  -sFILESYSTEM=0 \
  -sASSERTIONS=0 \
  -sSTACK_SIZE=1048576 \
  -sINITIAL_MEMORY=33554432

# ---- 4. 发布到仓库 ---------------------------------------------------------
cp "$WORKDIR/gmssl.js" "$WORKDIR/gmssl.wasm" "$OUT_DIR/"
echo "== 完成:"
ls -l "$OUT_DIR/gmssl.js" "$OUT_DIR/gmssl.wasm"
echo "== 自检 (node): ------------------------------------------------"
cat > "$WORKDIR/smoke.mjs" <<'EOF'
import { readFileSync } from 'node:fs';
const factory = (await import(process.env.WORKDIR + '/gmssl.js')).default;
const m = await factory({ wasmBinary: readFileSync(process.env.WORKDIR + '/gmssl.wasm') });
const lim = (i) => m._sm9js_limits(i);
const call = (fn, args, cap = 1024) => {
  const keep = [];
  const ptrs = [];
  for (const a of args) {
    const b = typeof a === 'string' ? new TextEncoder().encode(a) : a;
    const p = m._malloc(Math.max(1, b.length)); keep.push(p);
    m.HEAPU8.set(b, p); ptrs.push(p, b.length);
  }
  const out = m._malloc(cap), lenp = m._malloc(4); keep.push(out, lenp);
  const f = m['_' + fn];
  const r = f(...ptrs, out, cap, lenp);
  const len = m.HEAPU32[lenp >> 2];
  const res = r === 1 ? m.HEAPU8.slice(out, out + len) : null;
  keep.forEach((p) => m._free(p));
  return res;
};
console.log('limits:', [0, 1, 2, 3, 4].map(lim).join(' / '));
console.log('rand   :', (() => { const p = m._malloc(16); const r = m._sm9js_rand_test(p, 16); m._free(p); return r === 1 ? 'ok' : 'FAIL'; })());
const msk = call('sm9js_enc_master_key_generate', []);
const mpk = call('sm9js_enc_master_key_public', [msk]);
const usk = call('sm9js_enc_master_key_extract', [msk, 'alice@example.com']);
const ct = call('sm9js_encrypt_with_public', [mpk, 'alice@example.com', 'hello SM9 国密']);
const pt = call('sm9js_decrypt', [usk, 'alice@example.com', ct]);
console.log('SM9-Enc: msk=' + msk.length + 'B mpk=' + mpk.length + 'B usk=' + usk.length + 'B ct=' + ct.length + 'B pt="' + new TextDecoder().decode(pt) + '"');
const smsk = call('sm9js_sign_master_key_generate', []);
const smpk = call('sm9js_sign_master_key_public', [smsk]);
const ssk = call('sm9js_sign_master_key_extract', [smsk, 'alice@example.com']);
const sig = call('sm9js_sign', [ssk, 'message']);
const ok = m._sm9js_verify_with_public(
  (() => { const p = m._malloc(smpk.length); m.HEAPU8.set(smpk, p); return p; })(), smpk.length,
  (() => { const b = new TextEncoder().encode('alice@example.com'); const p = m._malloc(b.length); m.HEAPU8.set(b, p); return p; })(), 17,
  (() => { const b = new TextEncoder().encode('message'); const p = m._malloc(b.length); m.HEAPU8.set(b, p); return p; })(), 7,
  (() => { const p = m._malloc(sig.length); m.HEAPU8.set(sig, p); return p; })(), sig.length);
console.log('SM9-Sign: msk=' + smsk.length + 'B mpk=' + smpk.length + 'B usk=' + ssk.length + 'B sig=' + sig.length + 'B verify=' + ok);
EOF
WORKDIR="$WORKDIR" node "$WORKDIR/smoke.mjs"
