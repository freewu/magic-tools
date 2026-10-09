#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# 构建 ZUC (祖冲之序列密码) WebAssembly 模块
#
# 原理: 把本仓库的 Rust 薄封装 src/App/ZucCrypto/wasm/crate (依赖 zuc crate,
#       见其 Cargo.toml) 编译到 wasm32-unknown-unknown, 产物即
#       src/App/ZucCrypto/wasm/zuc.wasm —— 没有 Emscripten / wasm-bindgen glue,
#       JS 侧直接用 WebAssembly.instantiate + C ABI 调用 (见 ../src/App/ZucCrypto/zuc-engine.ts)。
#
# 用法:
#   bash scripts/build-zuc-wasm.sh
#   # 可用环境变量覆盖工作目录 (Windows 下建议指向 Windows 盘符, 便于 cargo 使用):
#   WORKDIR=E:/work/tmp/zuc-wasm-build bash scripts/build-zuc-wasm.sh
#
# 依赖: rustup + cargo (stable), 且已安装目标:
#   rustup target add wasm32-unknown-unknown
#
# 产物 (随仓库提交, 应用构建时不需要 Rust 工具链):
#   src/App/ZucCrypto/wasm/zuc.wasm   WebAssembly 二进制 (~19 KB)
#
# 说明:
#   * 在仓库外的工作目录构建, 避免 target/ 落进仓库 (仓库 .gitignore 只忽略 src-tauri/target);
#   * release profile 已在 crate 的 Cargo.toml 里设置 opt-level="z" / LTO / panic="abort" / strip;
#   * 仅支持 wasm32-unknown-unknown: wasm32-wasip1 需要 WASI 运行时, 浏览器/WebView 里跑不起来。
# ---------------------------------------------------------------------------
set -euo pipefail

WORKDIR="${WORKDIR:-/tmp/zuc-wasm-build}"
TARGET=wasm32-unknown-unknown

# WSL 下把 E:/xxx 形式的 Windows 路径转成 /mnt/e/xxx, 两种 shell 里都能直接用
if [ -d /mnt/c/Windows ] && [[ "$WORKDIR" =~ ^([A-Za-z]):/(.*)$ ]]; then
  WORKDIR="/mnt/$(printf '%s' "${BASH_REMATCH[1]}" | tr 'A-Z' 'a-z')/${BASH_REMATCH[2]}"
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CRATE_DIR="$ROOT/src/App/ZucCrypto/wasm/crate"
OUT="$ROOT/src/App/ZucCrypto/wasm/zuc.wasm"

# ---- 0. 工具链检查 ---------------------------------------------------------
# WSL / git-bash 里 cargo 可能是 cargo.exe (不自动补后缀), 两种都找一遍
CARGO="$(command -v cargo || command -v cargo.exe || true)"
RUSTUP="$(command -v rustup || command -v rustup.exe || true)"
NODE="$(command -v node || command -v node.exe || true)"
[ -n "$CARGO" ] || { echo "错误: 未找到 cargo, 请先安装 Rust (https://rustup.rs)" >&2; exit 1; }
if [ -n "$RUSTUP" ] && ! "$RUSTUP" target list --installed 2>/dev/null | grep -qx "$TARGET"; then
  echo "错误: 缺少目标 $TARGET, 请先执行: rustup target add $TARGET" >&2
  exit 1
fi
echo "== cargo: $("$CARGO" --version) / target: $TARGET"

# ---- 1. 同步 crate 到工作目录 ----------------------------------------------
# 只拷源码 (Cargo.lock 被 .gitignore 忽略, 不随仓库提交)
echo "== 同步 crate 到 $WORKDIR"
mkdir -p "$WORKDIR/src"
cp -f "$CRATE_DIR/Cargo.toml" "$WORKDIR/Cargo.toml"
cp -f "$CRATE_DIR/src/lib.rs" "$WORKDIR/src/lib.rs"

# ---- 2. 编译 wasm ----------------------------------------------------------
cd "$WORKDIR"
echo "== cargo build --release --target $TARGET"
"$CARGO" build --release --target "$TARGET"

cp -f "$WORKDIR/target/$TARGET/release/zuc_wasm.wasm" "$OUT"
echo "== 产物: $OUT"
ls -l "$OUT"

# ---- 3. 冒烟测试 (国标标准向量 + 往返) --------------------------------------
echo "== 自检 (node): ------------------------------------------------"
if [ -z "$NODE" ]; then
  echo "提示: 未找到 node, 跳过冒烟测试 (可手动运行 npm test -- src/App/ZucCrypto)"
else
# 在产物目录内用相对路径读 wasm: 避免向 Windows 版 node 传递 WSL 路径 (/mnt/e/...)
( cd "$(dirname "$OUT")" && "$NODE" --input-type=module -e '
import { readFileSync } from "node:fs";
const bytes = readFileSync("zuc.wasm");
const { instance } = await WebAssembly.instantiate(bytes, {});
const ex = instance.exports;
const view = (p, l) => new Uint8Array(ex.memory.buffer, p, l);
const hex = (b) => Buffer.from(b).toString("hex");
const apply = (fn, key, iv, data) => {
  const kp = ex.zuc_alloc(key.length), vp = ex.zuc_alloc(iv.length), dp = ex.zuc_alloc(data.length || 1);
  view(kp, key.length).set(key); view(vp, iv.length).set(iv); view(dp, data.length).set(data);
  const rc = fn(kp, key.length, vp, iv.length, dp, data.length);
  if (rc !== 0) throw new Error("apply 失败, 返回 " + rc);
  const out = view(dp, data.length).slice();
  ex.zuc_free(kp, key.length); ex.zuc_free(vp, iv.length); ex.zuc_free(dp, data.length);
  return out;
};
const zeros = new Uint8Array(8);
const a1 = hex(apply(ex.zuc128_apply, new Uint8Array(16), new Uint8Array(16), zeros));
const a2 = hex(apply(ex.zuc128_apply, new Uint8Array(16).fill(0xff), new Uint8Array(16).fill(0xff), zeros));
const a3 = hex(apply(ex.zuc128_apply, Uint8Array.from(Buffer.from("3d4c4be96a82fdaeb58f641db17b455b", "hex")), Uint8Array.from(Buffer.from("84319aa8de6915ca1f6bda6bfbd8c766", "hex")), zeros));
const a4 = hex(apply(ex.zuc256_apply, new Uint8Array(32), new Uint8Array(23), zeros));
const a5 = hex(apply(ex.zuc256_apply, new Uint8Array(32).fill(0xff), new Uint8Array(23).fill(0xff), zeros));
console.log("wasm 大小      : " + bytes.length + " B");
console.log("自检 (zuc_selftest): " + (ex.zuc_selftest() === 1 ? "ok" : "FAIL"));
console.log("长度查询        : " + [0, 1, 2, 3].map((i) => ex.zuc_limits(i)).join(" / "));
const expect = [
  ["ZUC-128 全 0 密钥/IV", a1, "27bede74018082da"],
  ["ZUC-128 全 ff 密钥/IV", a2, "0657cfa07096398b"],
  ["ZUC-128 任意密钥/IV (附录 A.3)", a3, "14f1c2723279c419"],
  ["ZUC-256 全 0 密钥/IV", a4, "58d03ad62e032ce2"],
  ["ZUC-256 全 ff 密钥/IV", a5, "3356cbaed1a1c18b"],
];
let bad = 0;
for (const [name, got, want] of expect) {
  const ok = got === want;
  if (!ok) bad++;
  console.log((ok ? "向量 " : "向量 FAIL ") + name + ": " + got + (ok ? "" : " (期望 " + want + ")"));
}
const plain = new TextEncoder().encode("MagicTools ZUC 冒烟测试 hello");
const key = new Uint8Array(16).fill(3), iv = new Uint8Array(16).fill(5);
const cipher = apply(ex.zuc128_apply, key, iv, plain);
const back = apply(ex.zuc128_apply, key, iv, cipher);
console.log("加解密往返      : " + (Buffer.from(back).equals(Buffer.from(plain)) ? "ok" : "FAIL"));
if (bad > 0 || !Buffer.from(back).equals(Buffer.from(plain))) process.exit(1);
' )
fi
echo "== 完成"
