#!/usr/bin/env bash
# 触发 GitHub Pages 部署 (deploy-pages.yml workflow_dispatch, 基于 master)
# 策略:
#   1) 优先 gh CLI (gh workflow run), 已安装并已登录时使用
#   2) 回退: 复用 git 凭据 (credential manager) 直接调 GitHub REST API 触发 dispatch
#      —— 无需安装 gh、无需额外登录 (与 git push 同凭据)
#   3) 均不可用则输出安装/手动指引并退出非零
# 用法: bash scripts/trigger-pages.sh [--dry-run]   (--dry-run 只检查凭据不触发)
set -u

REPO=$(git remote get-url origin 2>/dev/null | sed -nE 's#.*github\.com[:/]([^/]+)/([^/.]+)(\.git)?$#\1/\2#p')
if [ -z "$REPO" ]; then
  echo "⚠ 无法从 git remote origin 解析 GitHub 仓库地址"
  exit 1
fi

# 1) gh CLI
if command -v gh >/dev/null 2>&1; then
  if gh workflow run deploy-pages.yml --ref master 2>/dev/null; then
    echo "✓ 已通过 gh 触发 GitHub Pages 部署 (deploy-pages.yml @ master, $REPO)"
    exit 0
  fi
  echo "gh 触发失败(可能未登录), 回退 git 凭据方式…"
fi

# 2) git 凭据 (credential manager) -> REST API
TOKEN=$(printf 'protocol=https\nhost=github.com\n\n' | git credential fill 2>/dev/null | sed -n 's/^password=//p')
if [ -z "$TOKEN" ]; then
  echo "⚠ 未获取到 GitHub 凭据 (git credential fill 为空)。处理方式任选:"
  echo "  ① 安装 gh 并登录后重跑 just web:  winget install GitHub.cli  →  gh auth login"
  echo "  ② 手动触发: 仓库 Actions → deploy-pages → Run workflow (branch: master)"
  exit 1
fi
if [ "${1:-}" = "--dry-run" ]; then
  echo "✓ 已取得 GitHub 凭据 (dry-run, 未触发): $REPO deploy-pages.yml @ master"
  exit 0
fi

HTTP=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 60 -X POST \
  "https://api.github.com/repos/$REPO/actions/workflows/deploy-pages.yml/dispatches" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H 'Content-Type: application/json' \
  -d '{"ref":"master"}')
if [ "$HTTP" = "204" ]; then
  echo "✓ 已触发 GitHub Pages 部署 (deploy-pages.yml @ master, $REPO)"
  echo "  进度: https://github.com/freewu/magic-tools/actions/workflows/deploy-pages.yml"
else
  echo "⚠ 触发失败 HTTP $HTTP (该凭据可能缺少 actions:write 权限, 请 gh auth login 或手动 Run workflow)"
  exit 1
fi
