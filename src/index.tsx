import { createRoot } from 'react-dom/client';
import {default as App} from './Main';
import { HashRouter } from 'react-router-dom';
import React from 'react';

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
