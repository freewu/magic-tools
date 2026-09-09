// i18n 核心类型与解析工具
// 语言包 (LangPack) 结构约定:
//   - 每个应用目录下放 lang.ts (见 src/App/<Key>/lang.ts), default 为该语言包回退语言
//   - 取词: 当前语言缺失某词条时, 回退到该语言包 default 语言 (缺省 zh-CN)
// 每个语言包与 CSS 类配色/颜色名无关 —— CSS 里的颜色名称不做 i18n 处理

export type LocaleId = 'zh-CN' | 'zh-TW' | 'en';

export type Messages = Record<string, string>;

export interface LangPack {
  /** 默认语言: 当前语言缺失某词条时回退的目标 (缺省 zh-CN) */
  default?: LocaleId;
  'zh-CN'?: Messages;
  'zh-TW'?: Messages;
  en?: Messages;
}

/** 从语言包取值: 当前语言 -> 包默认语言 -> fallback */
export function tr(pack: LangPack | undefined, locale: LocaleId, key: string, fallback = ''): string {
  const cur = pack?.[locale]?.[key];
  if (cur != null && cur !== '') return cur;
  const def = pack?.[pack?.default ?? 'zh-CN']?.[key];
  if (def != null && def !== '') return def;
  return fallback;
}

/** 带占位符模板 (形如 "共 {n} 个应用" / "有新版 v{v} 可用"), {name} -> 值 */
export function trTpl(pack: LangPack | undefined, locale: LocaleId, key: string, vars: Record<string, string | number>, fallback = ''): string {
  let s = tr(pack, locale, key, fallback);
  for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
