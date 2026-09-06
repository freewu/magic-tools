# MagicTools v2.4.1

> ⚠️ **本版发布原因（重要）**：上一版 **v2.4.0** 发布后，用户反馈**打开应用为黑屏、无任何内容**。经排查定位为渲染进程 webpack → Vite 迁移引入的产物兼容问题，本版已修复并作为正式版重新发布（v2.4.0 发布包已撤回）：
>
> 1. **残留 CommonJS `require()`**：源码中 3 处 `require('base-x' / 'toml-patch' / 'deepmerge')` 在 Vite/Rollup 下不再被转换、原样进入浏览器产物，执行即抛 `require is not defined`，导致 React 无法挂载（整页空白）→ 已全部改写为 **ESM import** 并补充类型声明；
> 2. **Tauri CSP 拦截 antd 运行时样式**：Tauri 会把配置的 CSP 收紧为 nonce 白名单（`style-src 'self' 'nonce-…'`），而 antd v5 样式是**运行时注入的 `<style>`**，会被全部拦截 → 已调整 CSP 不再注入 nonce 强化（页面保留 `script-src` 约束）。
>
> 修复效果经打包产物 + WebView2 远程调试实测：首页与 ConfigConvert / Base58Codec / BaseXCodec / SQLFormatter / Setting 等懒加载页面均可正常渲染（React 挂载、47 个样式表注入、零报错）。**请 v2.4.0 用户重新下载本版**。
>
> 另：上一版 v2.3.0 仅升级了版本号但未发布（缺 git tag / GitHub Release），其间的功能变更一并收录在本版发布中。

## 更新内容

### ✨ 新增功能

- 站长工具（**新分类**）：网页 TDK 信息检测 与 robots.txt 生成
- 编解码新增：**摩斯码编解码**（Web Audio 播放，红色高亮当前码值 + 电报音/蜂鸣/柔和/电子多音效 + 常用编码快速填充 + 一键保存 WAV 并弹窗选择保存位置）
- 编解码新增：**UUencode / XXencode** 编解码 与 **JWT 解码器**
- 加解密新增：**RSA 加解密** / **SM2 国密**（含密钥对生成与导出）、**SM4 加解密**、**AES GCM 认证加密模式**、古典密码 **Caesar / Rail Fence / Vigenere / Hill**
- 值计算新增：**SHA3 Hash**（SHA3-224/256/384/512 + SHAKE128/256）与 **Keccak Hash**（Keccak-224/256/384/512）
- 其它新增：**htpasswd 生成**（bcrypt / $apr1$ / {SHA} / 明文，可保存 .htpasswd）、**正则表达式工具**、**Cron 规则生成**（Linux 格式自动隐藏秒/年）

### 🛠 体验优化

- 正则表达式：常用正则预设增至 17 条（新增中文字符/双字节字符/网址/邮编/QQ 号码），预设列表与设置页可**一键复制规则**，按行红绿高亮匹配
- Cron 规则生成：新增「解析」页签，**逐字段中文解读** + 未来 10 次触发时间预览
- SHA3 / Keccak Hash 顶部示例与 Hash 值计算**共用设置**（值计算一致）

### 🐛 修复

- **修复 v2.4.0 安装包启动黑屏（本版发布原因）**：残留 CommonJS `require` 改写 ESM import、CSP 调整兼容 antd 运行时样式（详见顶部说明）
- 修复 App 列表加载竞态导致个别应用（如网页 TDK 检测）打不开的问题
- 修复网页 TDK 信息检测结果区域深色模式下内容不可见（改用主题 token 配色）

### ⚙️ 设置

- 设置页改为 **VSCode 式布局**：分类导航移至左侧栏，并记住上次浏览的分类

### 🏗 工程

- 渲染进程构建由 **webpack 迁移至 Vite**（工具页面懒加载分包、体积与行为保持一致，构建更快）

## 安装包说明

| 平台 | 文件 | 说明 |
| --- | --- | --- |
| Windows | `magic-tools.exe` | 单体免安装，双击即运行（依赖系统自带 WebView2） |
| macOS | `MagicTools-macOS-aarch64.zip` | 免安装，解压后拖入"应用程序"或直接运行 |
| Linux | `*.AppImage` | 免安装，`chmod +x` 后运行 |

---

# MagicTools v2.2.0

## 更新内容

### ✨ 新增功能

- 编解码分类新增 **Punycode 编解码**
- 值计算分类新增 **BCC 校验**（逐字节异或 XOR，支持 HEX/ASCII 双输入，HEX/DEC/OCT/BIN 四进制输出）
- 值计算分类新增 **LRC 校验**（累加和 / Modbus 二进制补码两种算法）
- 值计算分类新增 **CRC 校验**：44 种标准 CRC-3 ~ CRC-64 参数化计算（CRC-8/10/11/12/16/17/21/24/31/32/64 各标准变体，参考 ip33.com/crc.html），支持自定义算法参数展示与 check 自检

### 🛠 体验优化

- BCC/LRC/CRC 校验结果改为 Hash 风格输出行，**点击结果即复制**（移除冗余复制按钮）
- CRC 算法下拉加宽、选项内**多项式公式右对齐**、支持按名称/公式搜索，深色模式适配
- CRC 参数区两行布局：Width/Poly/Init/XorOut 输入框（点击复制）+ 输入数据反转(RefIn)/输出数据反转(RefOut) 勾选框

### ⚙️ 设置

- 设置「值计算」新增 BCC / LRC / CRC 分区：默认输入格式（**默认 ASCII/文本**）
- 设置新增 CRC **默认校验算法**（默认 CRC-16/MODBUS）

## 安装包说明

| 平台 | 文件 | 说明 |
| --- | --- | --- |
| Windows | `magic-tools.exe` | 单体免安装，双击即运行（依赖系统自带 WebView2） |
| macOS | `MagicTools-macOS-aarch64.zip` | 免安装，解压后拖入"应用程序"或直接运行 |
| Linux | `*.AppImage` | 免安装，`chmod +x` 后运行 |

---

# MagicTools v2.1.1

## 更新内容

### ✨ 重构与体验

- 代码目录重构：`src/renderer` 上移到 `src` 根目录（`App/hook/layout/lib` 直接位于 `src/` 下）
- Tab 切换保活：切换标签页不再销毁原页面，**已填写的数据不丢失**（关闭标签才卸载）
- 帮助页更新日志新增 V2.1.0 / V2.1.1 发布记录

### 📷 图片保存

- 条形码生成：下载 PNG 弹出**系统保存对话框**选择保存位置（WebView2 下 `<a download>` 不再可靠）
- 二维码生成：新增「保存图片」按钮，点击二维码预览同样可保存 PNG

## 安装包说明

| 平台 | 文件 | 说明 |
| --- | --- | --- |
| Windows | `magic-tools.exe` | 单体免安装，双击即运行（依赖系统自带 WebView2） |
| macOS | `MagicTools-macOS-aarch64.zip` | 免安装，解压后拖入"应用程序"或直接运行 |
| Linux | `*.AppImage` | 免安装，`chmod +x` 后运行 |

---

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
