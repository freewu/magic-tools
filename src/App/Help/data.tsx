// 使用组件
export const compomentList = [
  { name: "Tauri 2", url: "https://tauri.app/" },
  { name: "React 18", url: "https://react.dev/" },
  { name: "Ant Design 5", url: "https://ant.design/" },
  { name: "CryptoJS", url: "https://github.com/brix/crypto-js" },
  { name: "js-base64", url: "https://github.com/dankogai/js-base64" },
  { name: "color-convert", url: "https://github.com/Qix-/color-convert" },
  { name: "SQL Formatter", url: "https://github.com/sql-formatter-org/sql-formatter" },
  { name: "highlight.js", url: "https://highlightjs.org/" },
  { name: "base-x", url: "https://github.com/cryptocoinjs/base-x" },
  { name: "pinyin-pro", url: "https://pinyin-pro.cn/" },
  { name: "js-ini", url: "https://github.com/Sdju/js-ini" },
  { name: "yaml", url: "https://github.com/eemeli/yaml" },
  { name: "toml-patch", url: "https://github.com/timhall/toml-patch" },
  { name: "deepmerge", url: "https://github.com/TehShrike/deepmerge" },
];

// 开发者列表
export const developerList = [
  { name: "bluefrog",url: "https://github.com/freewu",avater: "https://www.gravatar.com/avatar/c2bd3e109318983039778c259cc78db890c1b1f93b574a95c76807759c386db9" },
];

// event List
export const eventList = [
  {
    color: "green",
    children: (
      <>
        <p>2026-09-08 V2.7.0 Release</p>
        <ul style={ {listStyle: "none" }}>
          <li>二维码 / 条形码生成新增「批量」tab: 多行内容一次生成并预览, 桌面版选择文件夹一次导出全部 PNG (不再逐个弹保存框)</li>
          <li>格式化分类新增 Markdown 编辑器 (自研渲染, 支持常用语法与行内/块级 LaTeX 公式子集, 可导出 .md 与自带样式 .html); 预览面板可一键隐藏专注编辑</li>
          <li>其它分类新增密码生成: 安全随机生成 + 启发式强度检测 (熵估算 / 常见弱口令库含 leet 变体 / 破解时间估算); 站长工具新增 Sitemap 检测、关键词密度</li>
          <li>Shield Badge 生成新增图片尺寸 (1-10 倍率) 设置与放大 PNG 导出; 新增路径转树工具</li>
          <li>菜单分类调整: 占位图片 / Shield Badge / AppIcon / ICO 生成迁入「图片」分类, CIDR 计算器迁入「其它」, 设置页分组同步迁移</li>
          <li>修复 RC2 / RC6 / Blowfish 与 Markdown 编辑器不在侧边菜单显示的问题; 字幕格式转换桌面版下载不弹保存框; 深色模式下固定灰字提示不可见; 左下角版本号移除多余悬停提示</li>
        </ul>
      </>
    ),
  },
  {
    color: "green",
    children: (
      <>
        <p>2026-09-08 V2.6.0 Release</p>
        <ul style={ {listStyle: "none" }}>
          <li>新增「格式化」分类: JSON / JSON5 / SQL 格式化移入独立分类 (侧边菜单/应用中心/设置页同步分组)</li>
          <li>字幕格式转换: SRT/VTT/SBV/SUB/SSA/ASS/SMI/LRC/JSON 九格式互转 (本地解析, 样式指令剥除, 自动检测 + MicroDVD fps)</li>
          <li>加解密新增 RC5 / RC2 / Blowfish / RC6 (参考 AES 的五模式 UI) 与 ChaCha20 (RFC 7539, 官方向量验证)</li>
          <li>值计算新增 CMAC / HKDF / KMAC、原码/反码/补码; 颜色格式转换新增 7 组配色方案 (主色居中, 点击复制 HEX)</li>
          <li>编解码新增 HTTP Basic Auth 与 Chmod 权限; 其它新增 IP 转换 (IPv4 ↔ 整数/HEX/BIN) 与 OTP 密码生成器 (TOTP/HOTP, otpauth URI 扫码导入)</li>
          <li>其它新增键盘按键信息、点阵字生成器、文件比较; 配置转换支持 XML 互转 + 拖入自动识别</li>
          <li>时间工具新增 GPS/北斗/伽利略/格洛纳斯/儒略日输出</li>
          <li>启动后自动检测 GitHub 新版本 (右下角弹窗提示, 点击打开下载页)</li>
          <li>修复应用中心分类布局与分割线显示问题</li>
        </ul>
      </>
    ),
  },
  {
    color: "green",
    children: (
      <>
        <p>2026-09-07 V2.5.0 Release</p>
        <ul style={ {listStyle: "none" }}>
          <li>值计算新增 BCrypt 生成/校验、Scrypt (RFC 7914 零依赖实现)、PPI 计算 (标准 RGB / Pentile 等效 PPI, 含 13 种常用屏幕预设)</li>
          <li>加解密新增 Cisco Type 7; 编解码新增 Gzip (压缩率统计/双格式展示); Hash 值计算页移除 bcrypt 算法区</li>
          <li>站长工具新增占位图片与 Shield Badge 生成, 设置页新增站长工具分类 tab, App Icon 三平台可勾选</li>
          <li>其它分类新增 ASCII 图片与 ASCII 文字 (figlet 风格大字)</li>
          <li>侧边菜单展开时分类标题显示所属应用数量徽标</li>
          <li>修复 just release 产物复制 (路径层级/安装包过滤) 与面包屑误带徽标问题</li>
        </ul>
      </>
    ),
  },
  {
    color: "green",
    children: (
      <>
        <p>2026-09-05 V2.4.1 Release（修复 v2.4.0 黑屏后的重新发布版）</p>
        <ul style={ {listStyle: "none" }}>
          <li>【本版发布原因】修复 v2.4.0 安装包启动黑屏: 残留 CJS require 改 ESM import + CSP 调整兼容 antd 运行时样式 (webpack→Vite 产物兼容问题)</li>
          <li>新增站长工具分类: 网页 TDK 信息检测与 robots.txt 生成</li>
          <li>编解码新增摩斯码编解码 (播放高亮/多音效/常用编码/一键保存 WAV 弹窗选择位置)、UUencode/XXencode、JWT 解码器</li>
          <li>加解密新增 RSA / SM2 国密、SM4、AES GCM 认证加密、Caesar/Rail Fence/Vigenere/Hill 古典密码</li>
          <li>值计算新增 SHA3 Hash / Keccak Hash; 其它分类新增 htpasswd 生成、正则表达式工具、Cron 规则生成</li>
          <li>正则表达式: 预设增至 17 条 (常用 5 条新增) + 一键复制规则</li>
          <li>Cron 规则生成新增「解析」页签 (逐字段中文解读 + 未来 10 次触发时间)</li>
          <li>设置页改为 VSCode 式布局 (分类导航移至左侧栏, 记住上次分类)</li>
          <li>修复 App 列表加载竞态与网页 TDK 深色模式显示问题</li>
          <li>渲染进程构建由 webpack 迁移至 Vite</li>
        </ul>
      </>
    ),
  },
  {
    color: "green",
    children: (
      <>
        <p>2026-09-03 V2.2.0 Release</p>
        <ul style={ {listStyle: "none" }}>
          <li>编解码新增 Punycode 编解码</li>
          <li>值计算新增 BCC 校验 (XOR) / LRC 校验 (累加和·Modbus 补码) / CRC 校验 (44 种标准 CRC-3~64 参数化计算, 含多项式公式展示)</li>
          <li>校验结果输出行点击即复制, 展示样式与 Hash 计算对齐</li>
          <li>设置新增 BCC/LRC/CRC 默认输入格式 (默认 ASCII/文本) 与 CRC 默认校验算法 (默认 CRC-16/MODBUS)</li>
          <li>CRC 算法下拉可搜索并展示多项式公式, 深色模式适配</li>
        </ul>
      </>
    ),
  },
  {
    color: "green",
    children: (
      <>
        <p>2026-09-03 V2.1.1 Release</p>
        <ul style={ {listStyle: "none" }}>
          <li>目录重构: src/renderer 代码上移到 src 根目录</li>
          <li>Tab 切换保活: 切换标签页不丢失已填写数据</li>
          <li>条形码生成: 下载 PNG 弹出系统保存对话框选位置</li>
          <li>二维码生成: 新增「保存图片」按钮, 点击二维码预览也可保存 PNG</li>
        </ul>
      </>
    ),
  },
  {
    color: "green",
    children: (
      <>
        <p>2026-09-03 V2.1.0 Release</p>
        <ul style={ {listStyle: "none" }}>
          <li>新增 TEA / XTEA / XXTEA 加解密工具</li>
          <li>Hash 值计算新增 SM3 / BCrypt</li>
          <li>新增条形码生成 (CODE128 / EAN-13 / UPC-A / CODE39 / ITF / MSI / Pharmacode 等 16 种格式)</li>
          <li>应用只运行单实例; 托盘菜单支持直达设置/帮助/应用中心; 内容区顶部应用标签页与面包屑、标签右键菜单</li>
        </ul>
      </>
    ),
  },
  {
    color: "green",
    children: (
      <>
        <p>2026-02-28 V2.0.0 Release</p>
        <ul style={ {listStyle: "none" }}>
          <li>核心重构: 从 Electron 迁移到 Tauri 2 (体积更小、内存占用更低)</li>
          <li>构建发布: just 命令 + GitHub Actions 三平台自动打包 (win / macos / linux)</li>
          <li>Windows 提供单体免安装 exe, Linux 提供免安装 AppImage</li>
        </ul>
      </>
    ),
  },
  {
    color: "green",
    children: (
      <>
        <p>2023-07-11 V1.3.0 Release</p>
        <ul style={ {listStyle: "none" }}>
          <li>温度转换</li>
          <li>距离转换</li>
          <li>速度转换</li>
          <li>配置文件转换 (ini / json / yaml / toml / properties)</li>
          <li>面积转换</li>
          <li>容积转换</li>
          <li>质量转换</li>
        </ul>
      </>
    ),
  },
  {
    color: "green",
    children: (
      <>
        <p>2023-06-30 V1.2.0 Release</p>
        <ul style={ {listStyle: "none" }}>
          <li>Base64 图片</li>
          <li>中文拼音</li>
          <li>GPS坐标转换</li>
          <li>人民币大写</li>
          <li>字节转换</li>
        </ul>
      </>
    ),
  },
  {
    color: "green",
    children: (
      <>
        <p>2023-06-15 V1.1.0 Release</p>
        <ul style={ {listStyle: "none" }}>
          <li>DES 加密 / 解密</li>
          <li>AES 加密 / 解密</li>
          <li>Rabbit 加密 / 解密</li>
          <li>RC4 加密 / 解密</li>
          <li>3DES 加密 / 解密</li>
          <li>Base58 编码 / 解码</li>
          <li>PBKDF2 值计算</li>
        </ul>
      </>
    ),
  },
  {
    color: "green",
    children: (
      <>
        <p>2023-06-07 V1.0.0 Release</p>
        <ul style={ {listStyle: "none" }}>
          <li>Hash 值计算</li>
          <li>Base64 编码 / 解码</li>
          <li>URL 编码 / 解码</li>
          <li>时间戳转换</li>
          <li>CSS 配色</li>
          <li>颜色格式转换</li>
          <li>进制转换 ( BIN / OCT / DEC / HEX )</li>
          <li>二维码生成</li>
          <li>HmacHash 值计算</li>
          <li>SQL 格式化</li>
          <li>行数统计</li>
          <li>Unicode 编码 / 解码</li>
        </ul>
      </>
    ),
  },
];