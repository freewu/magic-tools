// Tauri 桥接工具
// 对应原 Electron 的 preload 暴露的 window.electron API
// 在 Tauri 环境下使用 @tauri-apps/plugin-opener 打开外部链接,
// 在普通浏览器(纯前端调试)环境下回退到 <a target="_blank"> 方式打开。

/**
 * 调用系统默认浏览器打开链接 (原 ipcMain 'open-url')
 * @param url 要打开的链接
 */
export async function openUrl(url: string) {
  // 判断是否运行在 Tauri WebView 中
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
  if (isTauri) {
    try {
      const { openUrl: tauriOpenUrl } = await import('@tauri-apps/plugin-opener');
      await tauriOpenUrl(url);
      return;
    } catch (err) {
      console.error('tauri openUrl failed:', err);
    }
  }
  // 浏览器回退
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.click();
}

/** 判断是否运行在 Tauri WebView 中 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * 通知 Tauri 主进程显示模式已变化 (同步托盘菜单勾选)
 * @param mode 'light' | 'dark' | 'system'
 */
export async function emitThemeMode(mode: string) {
  if (!isTauri()) return;
  try {
    const { emit } = await import('@tauri-apps/api/event');
    await emit('theme-mode-changed', mode);
  } catch (err) {
    console.error('tauri emitThemeMode failed:', err);
  }
}

/**
 * 监听托盘菜单「设置 / 帮助 / 应用列表」的页面跳转事件
 * @param handler 收到目标页面 key ('Setting' | 'Help' | 'AppStore') 时回调
 * @returns 取消监听的函数
 */
export async function listenOpenPage(handler: (page: string) => void): Promise<() => void> {
  if (!isTauri()) return () => {};
  try {
    const { listen } = await import('@tauri-apps/api/event');
    const unlisten = await listen<string>('open-page', (event) => {
      handler(event.payload);
    });
    return unlisten;
  } catch (err) {
    console.error('tauri listenOpenPage failed:', err);
    return () => {};
  }
}

/**
 * 监听托盘菜单切换显示模式的事件
 * @param handler 收到模式 'light' | 'dark' | 'system' 时回调
 * @returns 取消监听的函数
 */
export async function listenThemeMode(handler: (mode: string) => void): Promise<() => void> {
  if (!isTauri()) return () => {};
  try {
    const { listen } = await import('@tauri-apps/api/event');
    const unlisten = await listen<string>('theme-mode-set', (event) => {
      handler(event.payload);
    });
    return unlisten;
  } catch (err) {
    console.error('tauri listenThemeMode failed:', err);
    return () => {};
  }
}
