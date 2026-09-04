# 项目开发规则

## 自动提交 Git

- 每完成一次用户要求的操作（功能实现、修复、文档更新等）后，**自动执行 `git add -A` + `git commit`**，提交信息用简洁中文概括本次改动（如 `feat:` / `fix:` / `docs:` 前缀）
- 若改动属于同一任务的多个连续步骤，可在任务完成时统一提交一次
- **commit 完成后自动 `git push origin master`**（默认分支为 `master`）；WSL 侧 git 通常可直接推送，若出现凭据卡认证，改用 Windows 侧执行：`cmd.exe /c "cd /d E:\work\github\magic-tools && git push origin master"`
- 构建产物（`release/*.exe`、`src-tauri/target`、`dist/`）已被 `.gitignore` 忽略，无需特殊处理

## Cloudflare Pages 构建 (npm ci 同步规则)

Cloudflare Pages 使用 **Node 18 / npm 9.6.7** 构建（本地 Node 24 / npm 11）。本地 npm 11 生成的 `package-lock.json` 会让 CF 的 `npm ci` 报错（`npm ERR! Missing: @emnapi/core@... from lock file`）。因此：

- **每次用 npm 安装/删除依赖后**，必须用 npm 9 重新生成并提交 lockfile：

      npx --yes npm@9.6.7 install --package-lock-only --ignore-scripts

- 提交前本地验证（退出码 0 才提交）：

      npx --yes npm@9.6.7 ci --dry-run --ignore-scripts

- 只改 `package.json` 版本号（不改依赖）时，lockfile 顶部 `version` 字段也需同步（可同上命令刷新）；
  可选：在 Cloudflare Pages 项目设置的环境变量里加 `NODE_VERSION=22` 使两侧 npm 版本接近，但**不能代替**上述 npm9 同步步骤

## 版本发布流程

发布新版本时按顺序执行：

> **重要：版本修改 → 打 tag → 触发 GitHub Action 发布 是自动流程。**
> 只要修改了版本号（含仅升版本号、无新功能的维护性升级），提交后**必须立即**打 tag 并推送，**无需再次询问用户**；
> 仅当用户明确说「暂不发布 / 不要打 tag」时才跳过，并在回复中说明跳过了 tag。

1. 按下表「版本号修改位置清单」**逐一同步所有版本号**为同一新版本号
2. 在 `update.md` **顶部**新增本版本的发布说明节（格式：`# MagicTools vX.Y.Z` + 更新内容），历史版本节**保留在其下方**；
   **GitHub Release 说明只取本版本的更新内容**（顶部第一个版本节），不会包含历史版本内容
3. 提交并推送代码（`git commit` + `git push origin master`）
4. **自动打 tag 并推送**（无需询问，紧跟第 3 步执行）：

       git tag v2.1.1
       git push origin master
       git push origin v2.1.1

   （项目 justfile 中**没有** `just tag` 命令，手动执行上述 git 命令即可；tag 若推错可 `git tag -d vX.Y.Z && git push origin :refs/tags/vX.Y.Z` 删除后重推，不影响已触发失败的 Action）
5. 推送 `v*` tag 触发 `.github/workflows/build-release.yml`：Windows 单体免安装 exe / macOS zip / Linux AppImage 三平台自动构建；workflow 会**自动截取 `update.md` 顶部第一个版本节**（第二个 `# MagicTools v` 标题之前）作为 GitHub Release 说明，产物自动上传。**确认 tag 已推送成功**（`git ls-remote --tags origin vX.Y.Z`）后，在回复中告知用户 CI 已触发，可在 GitHub Actions 页查看进度
6. **同一个 `v*` tag 同时触发 `.github/workflows/deploy-pages.yml`**：构建纯前端 Web 版（`npm run build:renderer`，`publicPath: './'` 适配仓库子路径）并部署到 **GitHub Pages**（线上演示版，无 Tauri 能力，保存类操作走浏览器下载回退）。前提：仓库 Settings → Pages → Source 选择 **GitHub Actions**（Build and deployment），并确认 Pages 已启用；回复中一并告知用户 Pages 部署状态

> 记牢：**每次版本发布 = 打 tag → 自动三平台 Release (build-release.yml) + GitHub Pages 部署 (deploy-pages.yml) 双触发**，两步均无需询问用户

### 版本号修改位置清单（升版本时逐一检查，勿遗漏）

| # | 文件 | 修改位置 |
|---|------|----------|
| 1 | `package.json` | `"version": "x.y.z"`（npm 包版本号；`src/version.ts` 通过 `import '../package.json'` 自动读取，无需单独改） |
| 2 | `src-tauri/Cargo.toml` | `version = "x.y.z"`（Rust 包版本号；托盘菜单「MagicTools Vx.y.z」/ About 显示它） |
| 3 | `src-tauri/tauri.conf.json` | `"version": "x.y.z"`（打包/安装包版本号） |
| 4 | `justfile` | `version := env_var_or_default("VERSION", "x.y.z")` 的默认值（可用 `VERSION=` 环境变量覆盖，不强制同步） |
| 5 | `src/App/Help/data.tsx` | `eventList` 数组**顶部**新增一条更新日志：`<p>YYYY-MM-DD Vx.y.z Release</p>` + 本次更新内容 `<li>`（帮助页时间线） |
| 6 | `update.md` | **顶部新增**一个版本节（`# MagicTools vX.Y.Z` + 本次更新内容），历史版本节保留在下文；GitHub Action 只取顶部第一个版本节作为 Release 说明（勿把历史内容混入本版本节内） |

提示：

- 全部改完后验证一遍：`npm test` && `npm run build:renderer`，必要时在 `src-tauri` 下 `cargo check`
- 发布前建议在应用「帮助」页确认新增的 Vx.y.z 更新日志条目显示正常
