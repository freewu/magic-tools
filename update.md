# MagicTools v2.0.0

## 更新内容

### ✨ 核心重构

- 从 Electron 迁移到 Tauri 2：应用体积更小（exe 约 11MB）、内存占用更低、启动更快
- 界面与功能保持不变（温度/距离/速度/面积/容积/质量转换、配置文件转换、GPS 转换等）

### 🚀 构建与发布

- 引入 `just` 命令统一管理开发/构建/发布流程（`just dev` / `just build` / `just release` / `just help`）
- 新增 GitHub Actions 自动打包：推送 `v*` 版本 tag 自动构建 Windows / macOS / Linux 三平台免安装包并发布到 GitHub Releases
- Windows 提供**单体免安装 exe**（双击即运行，依赖系统自带 WebView2）
- Linux 提供免安装 **AppImage**

### 🐛 修复

- 修复生产构建产物残留 source maps 的问题
- 移除页面四周白边，禁用右键菜单

## 安装包说明

| 平台 | 文件 | 说明 |
| --- | --- | --- |
| Windows | `magic-tools.exe` | 单体免安装，双击即运行（依赖系统自带 WebView2） |
| macOS | `MagicTools-macOS-aarch64.zip` | 免安装，解压后拖入"应用程序"或直接运行 |
| Linux | `*.AppImage` | 免安装，`chmod +x` 后运行 |
