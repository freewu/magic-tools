// 全局界面语言 (简体中文 / 繁體中文 / English)
// - 持久化到 localStorage('app-locale'), 缺省 zh-CN
// - 与托盘菜单「语言」子菜单双向同步 (Tauri 事件, 模式同主题 theme-mode)
// - 非 Tauri 环境(浏览器调试)自动降级, 仅本地生效
import React, { createContext, useContext, useEffect, useState } from 'react';
import { emitLocale, listenLocale } from '../lib/tauri';
import type { LocaleId } from '../i18n/lang';

export type { LocaleId };

/** 可选语言 (顺序即托盘/下拉展示顺序) */
export const LOCALE_IDS: LocaleId[] = ['zh-CN', 'zh-TW', 'en'];

/** 语言自名 (不随当前语言翻译) */
export const LOCALE_LABELS: Record<LocaleId, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  en: 'English',
};

const isLocale = (v: string | null): v is LocaleId =>
  v === 'zh-CN' || v === 'zh-TW' || v === 'en';

interface LocaleContextValue {
  locale: LocaleId;
  setLocale: (locale: LocaleId) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'zh-CN',
  setLocale: () => {},
});

export const useLocale = () => useContext(LocaleContext);

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<LocaleId>(() => {
    const saved = localStorage.getItem('app-locale');
    return isLocale(saved) ? saved : 'zh-CN';
  });

  // 持久化 + 通知 Tauri 同步托盘勾选
  useEffect(() => {
    localStorage.setItem('app-locale', locale);
    emitLocale(locale);
  }, [locale]);

  // 接收托盘菜单切换语言
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listenLocale((l) => {
      if (isLocale(l)) setLocale(l);
    }).then((un) => {
      unlisten = un;
    });
    return () => {
      unlisten?.();
    };
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
};
