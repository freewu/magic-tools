// 全局显示模式 (浅色 / 深色 / 系统跟随)
// - 持久化到 localStorage('theme-mode')
// - 与托盘菜单「显示模式」双向同步 (Tauri 事件)
// - 非 Tauri 环境(浏览器调试)自动降级, 仅本地生效
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { emitThemeMode, listenThemeMode } from '../lib/tauri';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  setMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const isThemeMode = (v: string | null): v is ThemeMode =>
  v === 'light' || v === 'dark' || v === 'system';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme-mode');
    return isThemeMode(saved) ? saved : 'system';
  });

  // 系统是否处于深色模式 (供「系统跟随」使用)
  const [systemDark, setSystemDark] = useState<boolean>(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // 监听系统主题变化
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // 持久化 + 通知 Tauri 同步托盘勾选
  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
    emitThemeMode(mode);
  }, [mode]);

  // 接收托盘菜单切换显示模式
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listenThemeMode((m) => {
      if (isThemeMode(m)) setMode(m);
    }).then((un) => {
      unlisten = un;
    });
    return () => {
      unlisten?.();
    };
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && systemDark);

  // 页面背景跟随主题, 避免窗口边缘露白 (对应 antd Layout 背景色)
  useEffect(() => {
    document.body.style.backgroundColor = isDark ? '#000000' : '#f0f2f5';
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      <ConfigProvider
        theme={{
          algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};
