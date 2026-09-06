import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 渲染进程 (前端) 构建: 替代原 webpack, 产物输出到 dist/ (tauri.conf.json frontendDist)
// - 入口 src/index.html + src/index.tsx, root 设为 src
// - dev server 端口 1212, 与 tauri.conf.json build.devUrl (http://localhost:1212) 对齐
// - base './' 相对路径, 适配 Tauri 自定义协议与 GitHub Pages 子路径部署 (publicPath './' 同策略)
export default defineConfig({
  root: 'src',
  base: './',
  publicDir: false,
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
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // 手动分包: 主入口 (layout/App 注册表) 只留业务骨架,
        // 框架/UI/工具依赖拆成独立 vendor chunk, 供懒加载页面按需复用
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(?:react|react-dom|react-router|react-router-dom|scheduler|use-sync-external-store|@remix-run|object-assign|loose-envify|prop-types)\//.test(id)) {
            return 'vendor-react';
          }
          if (/node_modules\/@ant-design\//.test(id)) {
            return 'vendor-antd-icons';
          }
          if (/node_modules\/(?:antd|rc-[^/]+|@rc-component|dayjs|classnames)\//.test(id)) {
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
          return 'vendor-misc';
        },
      },
    },
  },
});
