// 托盘程序
import { app, Menu, Tray, ipcMain, BrowserWindow } from 'electron';
import { getAssetPath, openDefaultBrowser } from './util';


// 隐藏主窗口，并创建托盘
const setTray = (mainWindow: BrowserWindow) => {
  // 当托盘最小化时，右击有一个菜单显示，这里进设置一个退出的菜单
  let trayMenuTemplate = [
    { // 系统托盘图标目录
      label: '退出',
      click: function() {
        console.log("tray quit");
        app.exit(); // 点击之后退出应用
      }
    },
    {
      label: 'MagicTools V1.1.0',
      click: function() {
        openDefaultBrowser("https://github.com/freewu/magic-tools");
      }
    },
  ];

  // 创建托盘实例
  const appTray = new Tray(getAssetPath('icon.png'));
  // 图标的上下文菜单
  const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);

  // 隐藏主窗口
  //mainWindow.hide();
  // 设置托盘悬浮提示
  appTray.setToolTip('MagicTools');
  // 设置托盘菜单
  appTray.setContextMenu(contextMenu);
  // 单击托盘小图标显示应用
  appTray.on('click', function() {
    console.log("tray click")
    // 显示主程序
    mainWindow?.show();
    // 关闭托盘显示
    //appTray.destroy();
  });
}


// 主进程监听打开托盘事件
ipcMain.on('open-tray', ()=> {
  console.log("open-tray");
  //setTray(null);
})

export {
    setTray
}
