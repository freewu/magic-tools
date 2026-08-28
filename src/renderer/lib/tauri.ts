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
