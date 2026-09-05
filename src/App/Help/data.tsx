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
        <p>2026-09-05 V2.4.0 Release</p>
        <ul style={ {listStyle: "none" }}>
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