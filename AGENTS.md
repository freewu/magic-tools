# 项目开发规则

## 自动提交 Git

- 每完成一次用户要求的操作（功能实现、修复、文档更新等）后，**自动执行 `git add -A` + `git commit`**，提交信息用简洁中文概括本次改动（如 `feat:` / `fix:` / `docs:` 前缀）
- 若改动属于同一任务的多个连续步骤，可在任务完成时统一提交一次
- **commit 完成后自动 `git push origin master`**（默认分支为 `master`）；WSL 侧 git 通常可直接推送，若出现凭据卡认证，改用 Windows 侧执行：`cmd.exe /c "cd /d E:\work\github\magic-tools && git push origin master"`
- 构建产物（`release/*.exe`、`src-tauri/target`、`dist/`）已被 `.gitignore` 忽略，无需特殊处理

## 版本发布流程

发布新版本时按顺序执行：

1. 按下表「版本号修改位置清单」**逐一同步所有版本号**为同一新版本号
2. 在 `update.md` **顶部**写入本次版本的发布说明（参考现有格式），它将作为 GitHub Release 的发布说明
3. 提交并推送代码（`git commit` + `git push origin master`）
4. 打 tag 并推送，自动触发 GitHub Actions 构建发布：

       git tag v2.1.0
       git push origin master
       git push origin v2.1.0

   （项目 justfile 中**没有** `just tag` 命令，手动执行上述 git 命令即可；tag 若推错可 `git tag -d vX.Y.Z && git push origin :refs/tags/vX.Y.Z` 删除后重推）
5. 推送 `v*` tag 触发 `.github/workflows/build-release.yml`：Windows 单体免安装 exe / macOS zip / Linux AppImage 三平台自动构建，并以 `update.md` 全文作为 GitHub Release 说明，产物自动上传

### 版本号修改位置清单（升版本时逐一检查，勿遗漏）

| # | 文件 | 修改位置 |
|---|------|----------|
| 1 | `package.json` | `"version": "x.y.z"`（npm 包版本号；`src/version.ts` 通过 `import '../package.json'` 自动读取，无需单独改） |
| 2 | `src-tauri/Cargo.toml` | `version = "x.y.z"`（Rust 包版本号；托盘菜单「MagicTools Vx.y.z」/ About 显示它） |
| 3 | `src-tauri/tauri.conf.json` | `"version": "x.y.z"`（打包/安装包版本号） |
| 4 | `justfile` | `version := env_var_or_default("VERSION", "x.y.z")` 的默认值（可用 `VERSION=` 环境变量覆盖，不强制同步） |
| 5 | `src/App/Help/data.tsx` | `eventList` 数组**顶部**新增一条更新日志：`<p>YYYY-MM-DD Vx.y.z Release</p>` + 本次更新内容 `<li>`（帮助页时间线） |
| 6 | `update.md` | 顶部写入本次版本发布说明（GitHub Release 使用） |

提示：

- 全部改完后验证一遍：`npm test` && `npm run build:renderer`，必要时在 `src-tauri` 下 `cargo check`
- 发布前建议在应用「帮助」页确认新增的 Vx.y.z 更新日志条目显示正常
