import { createRoot } from 'react-dom/client';
import {default as App} from './Main';
// Excalidraw (白板) 样式改为入口级引入: Rolldown 对懒加载 chunk 内的 CSS import 只会
// 抽出独立 .css 文件却不生成 JS 侧的样式注入, 导致白板页打开时样式丢失、画布/工具栏
// 无布局 (看起来“没渲染”)——入口静态引入进全局 CSS 后加载确定性最强 (~22KB gzip)
import '@excalidraw/excalidraw/index.css';
import { HashRouter } from 'react-router-dom';
import React from 'react';

// 启动时间点 (供启动加载页最短展示时长计算, Main.tsx 首帧后淡出 splash)
(window as unknown as { __mtStart?: number }).__mtStart = performance.now();

// 禁用右键菜单 (Tauri WebView 默认上下文菜单)
window.addEventListener('contextmenu', (e) => e.preventDefault());

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
  //<React.StrictMode>
    // <BrowserRouter>
    <HashRouter>
      <App />
    </HashRouter>
    // </BrowserRouter>
  //</React.StrictMode>
);
