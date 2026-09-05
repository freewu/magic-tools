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
  },
});
