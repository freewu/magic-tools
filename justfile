# MagicTools - Build & Release script (just)
#
# Prerequisites:
#   - Node.js + npm   (build the React renderer)
#   - Rust + cargo    (compile the Tauri app)
#   - just            (this command runner)
#   - gh CLI          (only needed for publish, run `gh auth login` first)
#
# Quick start:
#   just              -> show usage help (default)
#   just dev          -> development mode (Vite dev server + Tauri window)
#   just release      -> build and copy installers into release/
#   just publish      -> build and publish to GitHub Releases
#
# Bundle output directory: src-tauri/target/release/bundle/

set quiet := false

# Release version; defaults to package.json, override with the VERSION env var
# Example: VERSION=1.3.1 just publish
# Note: 修改版本号时需同步以下位置 (完整清单见 README「版本修改」):
#   package.json / src-tauri/Cargo.toml / src-tauri/tauri.conf.json / 本文件默认值
#   / src/App/Help/data.tsx 更新日志 / update.md
version := env_var_or_default("VERSION", "2.2.0")

# Default command: show usage help
default: help

# Show usage help (default command)
help:
    @echo MagicTools v{{version}} - Build and Release Tool for Tauri 2 + React
    @echo Usage: just COMMAND ARGS - full docs in README.md or run just --dump
    @just --list

# Development mode: start Vite dev server (beforeDevCommand) + Tauri window
dev:
    npm run tauri dev

# Start the React renderer dev server only (http://localhost:1212, for browser debugging)
dev-renderer:
    npm run dev:renderer

# Build the React renderer only into dist/
build-renderer:
    npm run build:renderer

# Build the production app: renderer + Rust + installers (bundle)
build:
    npm run tauri build

# Build a specific bundle target: just bundle nsis | appimage | deb | msi | dmg | rpm ...
bundle target:
    npm run tauri build -- --bundles {{target}}

# Usage: just release            -> build a single portable exe (no installer), copy to release/
#        just release nsis       -> build only the given format (nsis/msi/appimage/deb/dmg/rpm/app)
# Build and copy installers into release/ - default: single portable executable (--no-bundle, needs system WebView2)
release target="":
    {{ if target == "" { "npm run tauri build -- --no-bundle" } else { "npm run tauri build -- --bundles " + target } }}
    node .erb/scripts/copy-to-release.js

# 1. Build all installers
# 2. gh release create creates/overwrites the release (creates it if missing)
# 3. Upload artifacts per platform (failing globs are ignored, e.g. no nsis on Linux)
# Build and publish to GitHub Releases - needs gh CLI (gh auth login)
publish:
    npm run tauri build
    gh release create v{{version}} --generate-notes --latest
    -gh release upload v{{version}} src-tauri/target/release/bundle/nsis/*.exe --clobber
    -gh release upload v{{version}} src-tauri/target/release/bundle/appimage/*.AppImage --clobber
    -gh release upload v{{version}} src-tauri/target/release/bundle/deb/*.deb --clobber
    -gh release upload v{{version}} src-tauri/target/release/bundle/msi/*.msi --clobber
    -gh release upload v{{version}} src-tauri/target/release/bundle/dmg/*.dmg --clobber
    echo "Published v{{version}} to GitHub Releases"

# Run ESLint
lint:
    npm run lint

# Run Jest unit tests
test:
    npm test

# Clean build artifacts (dist/ + Rust target/)
clean:
    npm run clean:renderer
    cargo clean --manifest-path src-tauri/Cargo.toml

# Check the Tauri development environment
doctor:
    npm run tauri info

# Regenerate app icons from assets/logo.png into src-tauri/icons/
# Requirements: put a square 1024x1024 PNG at assets/logo.png first, then run this recipe
# Outputs: src-tauri/icons/* (32x32.png, 128x128.png, icon.ico, icon.icns, ...)
icon:
    npx tauri icon assets/logo.png

# [Rule 1] Commit all changes with a summary message and push to remote
# Usage: just commit "feat: add new tool"
commit msg:
    git add -A
    git commit -m "{{msg}}"
    git push

# [Rule 2] Tag a version and push, triggers GitHub Actions to build
# portable packages for Windows / macOS / Linux (see .github/workflows/build-release.yml)
# Steps before tagging:
#   1. bump version in package.json / src-tauri/Cargo.toml / src-tauri/tauri.conf.json
#   2. write the changelog into update.md (used as the GitHub release notes)
# Usage: just tag 1.3.1    (auto-prefixes 'v')  or  just tag v1.3.1
# The release body is taken from update.md automatically.
tag v:
    git add -A
    git commit -m 'chore: release {{ if replace(v, "v", "") == v { "v" + v } else { v } }}'
    git tag {{ if replace(v, "v", "") == v { "v" + v } else { v } }}
    git push
    git push origin {{ if replace(v, "v", "") == v { "v" + v } else { v } }}

# Use this when the dev server exited abnormally and the port is still occupied
# Kill leftover dev server process on port 1212 (Windows)
kill-dev:
    powershell -Command "Get-NetTCPConnection -LocalPort 1212 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"
    echo "Cleaned up processes occupying port 1212"
