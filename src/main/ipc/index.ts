import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { openDefaultBrowser } from "../util"

// 测试
ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  // console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

// 浏览器打开链接
ipcMain.on('open-url', async (event, args) => {
  // console.log(args);
  // shell.openExternal(args[0]);
  openDefaultBrowser(args[0]);
  //event.reply('ipc-example', msgTemplate('pong'));
});