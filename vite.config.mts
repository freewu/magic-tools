import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 渲染进程 (前端) 构建: 替代原 webpack, 产物输出到 dist/ (tauri.conf.json frontendDist)
// - 入口 src/index.html + src/index.tsx, root 设为 src
// - dev server 端口 1212, 与 tauri.conf.json build.devUrl (http://localhost:1212) 对齐
// - base './' 相对路径, 适配 Tauri 自定义协议与 GitHub Pages 子路径部署 (publicPath './' 同策略)
export default defineConfig({
  root: 'src',
  base: './',
  // 静态资源目录 (src/public): 存放 favicon 等无需打包处理、原样拷入产物的文件
  publicDir: 'public',
  plugins: [react()],
  server: {
    port: 1212,
    strictPort: true,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    // Tauri WebView2 / 现代浏览器, 不转译到过低目标
    target: 'chrome105',
    sourcemap: false,
    // 入口 bundle 含 antd 等依赖体积较大, 提高告警阈值避免 CI 噪音
    // antd 主包 (antd+rc-*+@ant-design/icons) 约 1.0M, 随工具页增多持续增长; 拆成
    // antd/rc/icons 多包只会增加请求数与缓存碎片 (碎片实验曾把 chunk 数从 ~30 拆到 299),
    // 且 icons 依赖 rc-util、antd 又引用 icons 会形成 chunk 循环, 故 icons 与 antd 同包;
    // 属桌面工具多页共享 UI 框架的固有成本, 阈值提到 1100 留余量
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        // 手动分包: 主入口 (layout/App 注册表) 只留业务骨架,
        // 框架/UI/工具依赖拆成独立 vendor chunk, 供懒加载页面按需复用
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(?:react|react-dom|react-router|react-router-dom|scheduler|use-sync-external-store|@remix-run|object-assign|loose-envify|prop-types)\//.test(id)) {
            return 'vendor-react';
          }
          // @ant-design/icons 与 antd 同 chunk: icons 依赖 rc-util (antd 组) 而 antd 主又 import icons,
          // 分两 chunk 会产生 vendor-antd-icons -> vendor-antd 双向循环
          if (/node_modules\/(?:antd|rc-[^/]+|@rc-component|dayjs|classnames|@ant-design)\//.test(id)) {
            return 'vendor-antd';
          }
          if (/node_modules\/(?:sql-formatter|nearley|moo|discontinuous-range|ret|railroad-diagrams)\//.test(id)) {
            return 'vendor-sql';
          }
          if (/node_modules\/highlight\.js\//.test(id)) {
            return 'vendor-highlight';
          }
          if (/node_modules\/yaml\//.test(id)) {
            return 'vendor-yaml';
          }
          if (/node_modules\/(?:crypto-js|bcryptjs)\//.test(id)) {
            return 'vendor-crypto';
          }
          if (/node_modules\/jsbarcode\//.test(id)) {
            return 'vendor-barcode';
          }
          if (/node_modules\/pinyin-pro\//.test(id)) {
            return 'vendor-pinyin';
          }
          // Shiki 语言语法包: 保持独立 dynamic chunk (import.meta.glob 按需加载),
          // 不并入 vendor-misc, 否则代码截图首次打开会拉取全部语言 (gzip ~1.7MB)
          if (id.includes('node_modules/@shikijs/langs')) {
            return undefined;
          }
          // svgo/browser (~780kB, 仅 SVG 格式化页使用): 独立 chunk 按需加载,
          // 避免拖大 vendor-misc (混入后 misc 超 1.1MB 且其它杂项页无谓预载)
          if (id.includes('node_modules/svgo/dist/svgo.browser.js')) {
            return undefined;
          }
          return 'vendor-misc';
        },
      },
    },
  },
});
