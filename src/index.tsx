import { createRoot } from 'react-dom/client';
import {default as App} from './Main';
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
