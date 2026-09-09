// 全局界面语言 (简体中文 / 繁體中文 / English)
// - 持久化到 localStorage('app-locale'), 缺省 zh-CN
// - 与托盘菜单「语言」子菜单双向同步 (Tauri 事件, 模式同主题 theme-mode)
// - 非 Tauri 环境(浏览器调试)自动降级, 仅本地生效
// - Web 版支持 URL 查询参数 ?lang=cn|zh-CN|tw|zh-TW|en 指定语言
//   (供外部文档站按文章语言跳转, 如 zh-CN 文档→?lang=zh-CN, en 文档→?lang=en),
//   该参数优先级高于 localStorage 记忆; 桌面端无查询参数, 不受影响
import React, { createContext, useContext, useEffect, useState } from 'react';
import { emitLocale, listenLocale } from '../lib/tauri';
import type { LocaleId } from '../i18n/lang';
// 语言旗标图片 (assets/lang/*.png, 桌面端与 Web 端均需随包携带)
import cnFlag from '../../assets/lang/cn.png';
import hkFlag from '../../assets/lang/hk.png';
import enFlag from '../../assets/lang/en.png';

export type { LocaleId };

/** 可选语言 (顺序即托盘/下拉展示顺序) */
export const LOCALE_IDS: LocaleId[] = ['zh-CN', 'zh-TW', 'en'];

/** 语言自名 (不随当前语言翻译) */
export const LOCALE_LABELS: Record<LocaleId, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  en: 'English',
};

/** 语言旗标图片 (assets/lang/*.png 打包进产物, 仅作视觉标识, 与标签顺序一致) */
export const LOCALE_FLAG: Record<LocaleId, string> = {
  'zh-CN': cnFlag,
  'zh-TW': hkFlag,
  en: enFlag,
};

const isLocale = (v: string | null): v is LocaleId =>
  v === 'zh-CN' || v === 'zh-TW' || v === 'en';

/** 从 URL ?lang= 解析语言 (cn/zh-CN/zh_cn/zh → zh-CN; tw/zh-TW/hk → zh-TW; en → en) */
const localeFromQuery = (): LocaleId | null => {
  if (typeof window === 'undefined' || !window.location.search) return null;
  const raw = new URLSearchParams(window.location.search).get('lang');
  if (!raw) return null;
  const k = raw.trim().toLowerCase();
  const map: Record<string, LocaleId> = {
    cn: 'zh-CN', 'zh-cn': 'zh-CN', 'zh_cn': 'zh-CN', zh: 'zh-CN', 'zh-hans': 'zh-CN', 'zh_hans': 'zh-CN',
    tw: 'zh-TW', 'zh-tw': 'zh-TW', 'zh_tw': 'zh-TW', hk: 'zh-TW', 'zh-hk': 'zh-TW', 'zh_hk': 'zh-TW', 'zh-hant': 'zh-TW', 'zh_hant': 'zh-TW',
    en: 'en', 'en-us': 'en', 'en_us': 'en',
  };
  return map[k] ?? null;
};

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
    const base: LocaleId = isLocale(saved) ? saved : 'zh-CN';
    return localeFromQuery() ?? base;
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
