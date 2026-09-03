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
 * 保存 PNG 图片 (条形码 / 二维码等 canvas 生成图)
 * - Tauri 环境: 弹出系统保存对话框, 选好路径后写入文件 (WebView2 下 <a download> 不弹保存框, 体验更好)
 * - 普通浏览器(纯前端调试): 回退为 <a download> 触发浏览器下载
 * @param defaultName 默认文件名 (如 'barcode-code128.png')
 * @param dataUrl canvas.toDataURL('image/png') 得到的 data URL
 * @returns true = 已保存/已触发下载; false = 用户在保存对话框取消
 */
export async function savePngFile(defaultName: string, dataUrl: string): Promise<boolean> {
  if (isTauri()) {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeFile } = await import('@tauri-apps/plugin-fs');
      const path = await save({
        title: '保存图片',
        defaultPath: defaultName,
        filters: [{ name: 'PNG 图片', extensions: ['png'] }],
      });
      // 用户点击了「取消」
      if (path === null) return false;
      // data URL -> Uint8Array (atob 处理 base64)
      const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
      const bin = atob(base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      await writeFile(path, bytes);
      return true;
    } catch (err) {
      // 插件/权限异常时回退到浏览器下载方式
      console.error('tauri savePngFile failed:', err);
    }
  }
  // 浏览器回退
  const a = document.createElement('a');
  a.download = defaultName;
  a.href = dataUrl;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return true;
}

/**
 * 保存文本文件 (RSA/SM2 密钥导出等)
 * - Tauri 环境: 弹出系统保存对话框, 选好路径后写入文件
 * - 普通浏览器(纯前端调试): 回退为 <a download> 触发浏览器下载
 * @param defaultName 默认文件名
 * @param content 文本内容 (UTF-8)
 * @param title 保存对话框标题
 * @returns true = 已保存/已触发下载; false = 用户在保存对话框取消
 */
export async function saveTextFile(defaultName: string, content: string, title = '保存文件'): Promise<boolean> {
  if (isTauri()) {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      const path = await save({
        title,
        defaultPath: defaultName,
        filters: [{ name: '文本文件', extensions: ['txt', 'pem', 'key'] }],
      });
      if (path === null) return false;
      await writeTextFile(path, content);
      return true;
    } catch (err) {
      console.error('tauri saveTextFile failed:', err);
    }
  }
  // 浏览器回退
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
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
