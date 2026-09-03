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
