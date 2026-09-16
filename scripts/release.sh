#!/usr/bin/env bash
# 构建打包 + 复制产物到 release/ , 并输出开始时间 / 结束时间 / 耗时
# (任一步失败也会打印结束时间与耗时, 再以原退出码结束)
# 用法: bash scripts/release.sh [target]
#   target 省略 -> 单体免安装 exe (npm run tauri build -- --no-bundle)
#   target 指定 -> 只构建该格式 (nsis/msi/appimage/deb/dmg/rpm/app ...)
# 由 justfile 的 `just release [target]` 调用
set -u

target="${1:-}"
if [ -z "$target" ]; then
  label="默认: 免安装单体 exe (--no-bundle)"
  build=(npm run tauri build -- --no-bundle)
else
  label="指定格式: $target"
  build=(npm run tauri build -- --bundles "$target")
fi

start_ts=$(date '+%Y-%m-%d %H:%M:%S')
start_sec=$(date +%s)

# EXIT trap: 无论成功/失败/中断都打印结束时间与耗时 (用 trap 保证单点输出)
finish() {
  code=$?
  secs=$(( $(date +%s) - start_sec ))
  if [ "$code" -eq 0 ]; then
    echo "✔ release 结束 $(date '+%Y-%m-%d %H:%M:%S')  (成功)"
  else
    echo "✗ release 结束 $(date '+%Y-%m-%d %H:%M:%S')  (失败, exit $code)"
  fi
  if [ "$secs" -ge 3600 ]; then
    printf '⏱ 耗时 %d 时 %d 分 %02d 秒 (共 %d 秒)\n' "$((secs / 3600))" "$((secs % 3600 / 60))" "$((secs % 60))" "$secs"
  else
    printf '⏱ 耗时 %d 分 %02d 秒 (共 %d 秒)\n' "$((secs / 60))" "$((secs % 60))" "$secs"
  fi
  exit "$code"
}
trap finish EXIT

echo "▶ release 开始 $start_ts  [$label]"

set -e
"${build[@]}"
node scripts/copy-to-release.js "$target"
