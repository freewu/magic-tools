# MagicTools v2.7.1

## 更新内容

### ✨ 界面全面三语化（简中 / 繁中 / English）

- 全部工具页面接入语言切换：值计算 / 加解密 / 编解码 / 格式化 / 图片生成 / 站长工具 / 其它等各分类，新增公共 `ui-lang` / `rows-lang` 三语词条表（合计 470+ 条）
- 设置中心所有工具面板文案与「单位 / 下拉选项」三语化（如 次/字节/位 等单位、转换器单位表、码型、编辑器风格、默认外观、配色板、颜色名称等选项）
- 托盘菜单（原生）文案随界面语言动态切换
- 「About / 说明」区三语化：正则表达式（逐行测试说明）、Morse、JWT、BCD、BaseX（含各码型详述）、HTTP Basic Auth、Punycode / UUencode 等
- Cron 规则「解析」页签与解析引擎支持按语言输出；Hash 等设置项英文标签措辞调整（Show a default sample string → Sample String）
- 帮助页「开发时间线」全部历史版本内容三语化
- 侧边菜单分组英文名精简（Formatters / Value Calc 等）

### 🛠 体验优化

- 侧边栏展开宽度 200→230px；折叠时语言 / 设置按钮靠左下角，展开时紧贴靠右；语言菜单改用 cnode 旗标图片
- 设置-格式化分组移除「暂无独立设置项」提示文案

### 🐛 修复

- 修复多处残留硬编码中文与显示问题：Base64 图片输出类型「IMG 标签」、CSS 配色「颜色名称」等选项；RC2 / RC6 / Blowfish 与 Markdown 编辑器未显示在侧边菜单；字幕格式转换桌面版下载不再逐个弹保存框；深色模式下固定灰字提示不可见；左下角版本号多余悬停提示等

# MagicTools v2.7.0

## 更新内容

### ✨ 新增功能

- 二维码 / 条形码生成新增**「批量」tab**：多行内容一次生成并网格预览，桌面版选择文件夹一次导出全部 PNG（不再逐个弹保存框），网页版逐个下载
- 格式化分类新增**Markdown 编辑器**：自研渲染（零新增依赖），支持常用语法与行内 / 块级 LaTeX 公式子集，可导出 .md 与自带样式的独立 .html；预览面板可一键隐藏专注编辑
- 其它分类新增**密码生成**：安全随机生成（crypto，可排除易混淆字符）+ 启发式强度检测（熵估算 / 常见弱口令库含 leet 变体与键盘序列 / 在线与离线破解时间估算）
- 站长工具新增：**Sitemap 检测**（站点地图抓取与链接校验）、**关键词密度**（词频统计）
- 编码分类新增**路径转树**（目录结构文本 ↔ 树形展示）
- **Shield Badge 生成**新增图片尺寸（1–10 倍率）设置与放大 PNG 导出，预览同步倍率
- 菜单分类调整：占位图片 / Shield Badge / App Icon / ICO 生成迁入**图片**分类，CIDR 计算器迁入**其它**分类，设置页分组同步迁移（站长工具设置分组已清空删除）

### 🐛 修复

- 修复 RC2 / RC6 / Blowfish 与 Markdown 编辑器未出现在侧边菜单的问题（define 具名导出不一致 / 文件缺失）
- 修复字幕格式转换桌面版下载不弹保存框（下载锚点入 DOM + 延迟回收 Blob URL）
- 深色模式下密码强度检测、批量导出等固定灰字提示不可见（改用 antd theme token）
- 左下角版本号移除多余悬停提示（保留新版本角标）

### 🏗 工程

- capabilities 新增 `dialog:allow-open`，支持批量导出选文件夹写入
- 版本号升至 v2.7.0

# MagicTools v2.6.0

## 更新内容

### ✨ 新增功能

- **字幕格式转换**（新工具）：SRT / VTT / SBV / SUB / SSA / ASS / SMI / LRC / JSON 九种字幕格式互转，纯本地解析（内容不上传服务器），样式指令（ASS 特效、SRT <i>、MicroDVD {y:..} 等）自动剥除仅留文本与时间轴；自动检测输入格式，MicroDVD 可设帧率
- 新增**「格式化」分类**：JSON / JSON5 / SQL 格式化移入独立分类（侧边菜单、应用中心、设置页分组同步）
- 加解密新增：**ChaCha20**（RFC 7539，256 位密钥 + 96 位 nonce + 32 位计数器，OpenSSL/RFC 官方向量验证）与 **RC5 / RC2 / Blowfish / RC6**（统一参考 AES 的五模式/填充/编码 UI）
- 值计算新增：**CMAC**（SP 800-38B）/ **HKDF**（RFC 5869）/ **KMAC**（SP 800-185）与**原码/反码/补码计算**
- 颜色格式转换新增**配色方案**：相似/分离/三角/四角/方形/复合/双分离 7 组色相旋转展示（主色居中，点击复制 HEX）
- 编解码新增：**HTTP Basic Auth** 编解码 与 **Chmod 权限**
- 其它新增：**IP 转换**（IPv4 ↔ 整数/HEX/BIN 双向，支持 0x 输入，大端网络序）、**OTP 密码生成器**（TOTP/HOTP，SHA-1/256/512，Base32，otpauth URI 与扫码导入）、**键盘按键信息**、**点阵字生成器**、**文件比较**
- 配置转换支持 **XML 互转** + 配置文件拖入自动识别格式
- 时间工具新增 GPS / 北斗 / 伽利略（周/秒/总秒）/ 格洛纳斯 / 儒略日输出
- **新版本检测**：启动后自动查询 GitHub Releases，有新版时右下角弹窗提示（点击直达下载页；同版本仅提示一次，网络失败静默）

### 🐛 修复

- 应用中心分类内卡片一行展示多个（组内 flex 布局），分割线独占整行且名称显示正常
- 修复 tsc 全量门禁误扫构建产物导致 Debug Failure，与 import.meta/顶层 await 在 commonjs 下的误报（工程基建）

### 🏗 工程

- vendor-antd 随页面增多增至 ~950k，chunk 告警阈值提至 1000 并更新注释
- GitHub Actions 升级消除 node20 deprecation（checkout@v5 / setup-node@v5 / action-gh-release@v3 / upload-pages-artifact@v5 / deploy-pages@v5）
- Cloudflare Pages 构建：新增 `package` 脚本（vite build 别名）适配面板构建命令
- 版本号升至 v2.6.0

# MagicTools v2.5.0

## 更新内容

### ✨ 新增功能

- 值计算新增：**BCrypt** 口令生成与校验（cost 4–15，独立新页面）、**Scrypt**（RFC 7914，SHA-256/HMAC/PBKDF2/Salsa20-8/BlockMix/ROMix 零依赖纯 TS 实现，N/r/p/长度可调）、**PPI 计算**（标准 RGB 排列与 Pentile 等效 PPI，13 种常用手机/平板/笔记本/显示器屏幕预设）
- 加解密新增：**Cisco Type 7** 口令加解密（48 字节密钥表 XOR，2 位 hex 盐偏移）
- 编解码新增：**Gzip 编解码**（压缩率统计，压缩结果 Base64/Hex 双格式展示，解压自动识别 1F 8B 头）
- 站长工具新增：**占位图片生成**（含常用尺寸预设，设置页可自定义）与 **Shield Badge 生成**（shields.io 风格 SVG）；设置页新增站长工具分类 tab；App Icon 三平台可勾选、仅打包选中平台
- 其它分类新增：**ASCII 图片生成**（Rec.709 灰度 + 亮度/对比度/反色实时调节）与 **ASCII 文字**（figlet 风格 5x5 位图大字，可放大/调字距）
- Hash 值计算页移除 bcrypt 算法区（迁移为独立的 BCrypt 工具）
- 侧边菜单展开时分类标题显示所属应用数量徽标

### 🛠 体验优化

- BaseX 码型切换时下方说明联动显示对应编码详解（16 种码型）
- 设置按钮移至侧栏底部靠左（顶部仅留收起/应用中心）

### 🐛 修复

- 修复 App Icon 生成选中卡片深色模式下文字不可见
- 修复面包屑分类名称误带菜单应用数徽标
- 修复 `just release`：copy-to-release.js 项目根路径上溯层级错误（迁移 .erb 后 `..` 多一级）；默认构建不再把 bundle 残留的 msi/nsis 安装包复制进 release/（按目标筛选）

### 🏗 工程

- 删除 electron-react-boilerplate 遗留的 `.erb` 目录（必需文件迁移至项目根并同步 jest 配置）
- 版本号升至 v2.5.0

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
