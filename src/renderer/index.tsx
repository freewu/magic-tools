import { createRoot } from 'react-dom/client';
import {default as App} from './Main';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import React from 'react';

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

// calling IPC exposed from preload script
window.electron.ipcRenderer.once('ipc-example', (arg) => {
  // eslint-disable-next-line no-console
  console.log(arg);
});
window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);