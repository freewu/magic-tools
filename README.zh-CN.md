<div align="center">

# 🧰 Magic Tools

**全能开发工具箱 —— 8 大分类、106 个实用工具，桌面 + Web 双端。**

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)

`v2.7.0` · Tauri 2 · React 18 · Ant Design 5 · MIT License

[下载桌面版](#-下载) · [在线体验](https://freewu.github.io/magic-tools/) · [提交 Issue](https://github.com/freewu/magic-tools/issues/new)

</div>

---

## ✨ 亮点

- **100+ 常用开发工具**，按 8 大分类组织：编解码、类型转换、加解密、值计算、格式化、图片、站长工具与实用小工具。
- **完整的密码学套件** —— 对称加密（AES / DES / 3DES / SM4 / ChaCha20 / Blowfish / Rabbit / RC2–RC6 / TEA / XTEA / XXTEA）、非对称（RSA / SM2 国密）、古典密码（凯撒 / 栅栏 / 维吉尼亚 / 希尔），以及 Cisco Type 7。
- **哈希与 MAC** —— MD5、SHA-1/2、SHA-3、Keccak、SM3、BCrypt、Scrypt、PBKDF2、HKDF、HMAC、CMAC、KMAC，以及 BCC / LRC / CRC 校验。
- **批量二维码 / 条形码** —— 一次生成多条并预览，桌面版一键选择文件夹导出全部 PNG。
- **本地运算、数据不上传** —— 所有计算都在设备本地完成，支持深色模式。
- **随处可用** —— Windows / macOS / Linux 原生桌面应用，另有纯前端 Web 版免安装即用。

## 🧰 功能总览

> 顶部切换语言可阅读 **English** 与 **繁體中文** 版本。

### 🔐 加解密 *(21)*
AES 加解密 · RSA 加解密 · SM2 加解密 · SM4 加解密 · 凯撒加解密 · 栅栏加解密 · 维吉尼亚加解密 · 希尔加解密 · Cisco Type 7 · DES 加解密 · Blowfish 加解密 · Rabbit 加解密 · RC2 加解密 · RC4 加解密 · RC5 加解密 · RC6 加解密 · ChaCha20 加解密 · 3DES 加解密 · TEA 加解密 · XTEA 加解密 · XXTEA 加解密

### 🧮 值计算 *(16)*
Hash 值计算 · HmacHash 值计算 · SHA3 Hash 值计算 · Keccak Hash 值计算 · BCrypt · Scrypt · PBKDF2 值计算 · CMAC 计算 · HKDF 计算 · KMAC 计算 · PPI计算 · 原码/反码/补码计算 · IP 转换 · BCC 校验 · LRC 校验 · CRC 校验

### 🔄 编解码 *(13)*
Base64 编解码 · URL 编解码 · Unicode 编解码 · Punycode 编解码 · UUencode 编解码 · XXencode 编解码 · BCD 编解码 · 摩斯码编解码 · JWT 解码器 · HTTP Basic Auth 编解码 · BaseX 编解码 · Base58 编解码 · Gzip 编解码

### ⚖️ 类型转换 *(17)*
时间戳转换 · 颜色格式转换 · 进制转换 · 树形和路径转换 · GPS坐标转换 · 下载链接转换 · 人民币大写 · 字节转换 · 中文拼音 · 温度转换 · 距离转换 · 配置转换 · 字幕格式转换 · 速度转换 · 容量转换 · 面积转换 · 重量转换

### 🛠️ 格式化 *(8)*
Markdown 编辑器 · JSON 格式化 · JSON5 格式化 · SQL 格式化 · XML 格式化 · HTML 格式化 · SVG 格式化 · 中英文自动排版

### 🖼️ 图片 *(9)*
二维码生成 · 条形码生成 · Base64图片 · ASCII 图片 · 代码截图 · ICO 生成 · App Icon 生成 · 占位图片 · Shield Badge 生成

### 🌐 站长工具 *(9)*
HTML 标签去除 · 浏览器指纹 · URL 提取 · Cookie 分析 · UA 解析器 · Sitemap 检查 · 关键词密度 · 网页TDK信息检测 · robots.txt 生成

### 🧩 其它 *(13)*
CSS 配色 · 行数统计 · htpasswd 生成 · 正则表达式 · 文件比较 · 点阵字生成器 · 键盘按键信息 · Chmod 权限 · OTP 密码生成器 · ASCII 文字 · Cron 规则生成 · CIDR 计算器 · 密码生成

> 另有内置页面：**应用中心**、**帮助与更新日志**、**设置**。

## 💻 下载

| 平台 | 安装包 | 说明 |
| --- | --- | --- |
| Windows | `MagicTools_x64.exe` | 单体免安装 exe（需要 WebView2，Win10/11 系统自带） |
| macOS | `MagicTools_macOS-universal.zip` | 通用包（Apple Silicon + Intel） |
| Linux | `MagicTools_amd64.AppImage` | AppImage |

👉 **[前往 Releases 下载最新版](https://github.com/freewu/magic-tools/releases/latest)**

**Web 版**：无需安装，直接访问 [freewu.github.io/magic-tools/tools](https://freewu.github.io/magic-tools/tools/)。支持 URL 追加 `?lang=` 参数指定语言供外部深链跳转（如简体文档跳转 `?lang=zh-CN`、English 文档跳转 `?lang=en`，也支持 `cn` / `tw` / `en` 短写）。

## 🛠 技术栈

| 层 | 选型 |
| --- | --- |
| 桌面框架 | [Tauri 2](https://tauri.app/)（Rust） |
| 前端 UI | [React 18](https://react.dev/) |
| 组件库 | [Ant Design 5](https://ant.design/) |
| 构建 | Vite 5 |
| 任务执行 | [just](https://github.com/casey/just) |

其他组件：CryptoJS、js-base64、color-convert、SQL Formatter、highlight.js、base-x、pinyin-pro、js-ini、yaml、toml-patch、deepmerge。

## 📦 项目结构

```
magic-tools
├── src-tauri/            # Tauri 2 主进程 (Rust): 窗口/托盘/外链/配置
├── src/                  # React 前端
│   ├── App/              # 每个工具一个目录 (自动注册)
│   ├── layout/           # 主框架: 侧边栏/内容区
│   ├── hook/             # 全局状态: 主题/应用上下文
│   └── lib/              # 通用工具库
├── docs/                 # 官网 (EN / zh-CN / zh-TW) + 截图
├── dist/                 # Web 构建产物 (部署到 GitHub Pages)
└── justfile              # 构建/打包/发布脚本
```

## 🚀 开发与运行

前置依赖：Node.js 18+、Rust、[just](https://github.com/casey/just)。

```bash
git clone https://github.com/freewu/magic-tools.git
cd magic-tools
npm install
```

| 任务 | 命令 |
| --- | --- |
| Tauri 窗口开发模式 | `just dev` |
| 仅浏览器调试 | `just dev-renderer` → http://localhost:1212 |
| 预览生产构建产物 | `just preview` → http://localhost:4173 |
| 单元测试 | `just test` |
| 代码检查 | `just lint` |
| 打包桌面应用 | `just build` |
| 打包单体免安装 exe 并复制到 `release/` | `just release` |
| 打包指定格式 | `just bundle nsis` / `appimage` / `dmg` |
| 检查 Tauri 环境 | `just doctor` |

> ℹ️ Vite 产物为 ES Module 分包，浏览器禁止 `file://` 加载 module——**不要直接双击 `dist/index.html`**，请用 `just preview`（页面也会给出引导提示）。

## 🌐 官网

三语官网位于 [`docs/`](docs/) 目录：

- English：[`docs/index.html`](docs/index.html)
- 简体中文：[`docs/zh-CN.html`](docs/zh-CN.html)
- 繁體中文：[`docs/zh-TW.html`](docs/zh-TW.html)

## 📝 维护者指南

### 版本修改（发布前需修改）

每次发布新版本时，将下列位置统一改为相同版本号：

1. `package.json` —— `"version"`（应用内版本号经 `src/version.ts` 自动读取，无需单独改）
2. `src-tauri/Cargo.toml` —— 包 `version`（托盘菜单「MagicTools Vx.y.z」显示）
3. `src-tauri/tauri.conf.json` —— `"version"`（打包版本号）
4. `justfile` —— `version := env_var_or_default("VERSION", "...")` 默认值
5. `src/App/Help/data.tsx` —— `eventList` 顶部新增 `Vx.y.z Release` 条目（帮助页更新日志）
6. `update.md` —— 顶部新增 `# MagicTools vX.Y.Z` 发布说明节（Actions 以此作为 Release 说明）

改完建议验证：`just test && just build:renderer && cargo check`。

### 发布流程（打 tag 自动构建）

```bash
just tag 1.3.1
# 等价于: git add -A && git commit -m "chore: release v1.3.1"
#          && git tag v1.3.1 && git push && git push origin v1.3.1
```

推送 `v*` tag 会触发 GitHub Actions（`.github/workflows/build-release.yml`）三平台构建并发布到 GitHub Releases，说明取自 `update.md` **顶部第一个版本节**；同源触发 `deploy-pages.yml` 自动重新部署 Web 版到 GitHub Pages。

## ❓ 常见问题

- **关闭窗口却退不出应用？** 点击关闭按钮会隐藏到系统托盘（与旧 Electron 版一致），在托盘右键菜单选择「退出」才真正退出。
- **外部链接如何打开？** 桌面版经 Tauri opener 插件调用系统默认浏览器；纯浏览器调试环境自动回退新标签页打开。
- **自动更新？** Tauri 版暂未内置更新器——新版本请到 Releases 页面手动下载。

## 📄 许可

[MIT](LICENSE) © 2023 Bluefrog
