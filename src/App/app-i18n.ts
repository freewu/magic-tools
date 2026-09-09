// 语言包注册表 (集中导入全部应用目录内 lang.ts)
// 取值规则: 当前语言缺失某词条时, 回退到该 lang.ts 标注的默认语言 (缺省 zh-CN)
// 工具名 zh-CN = define.tsx 的 AppName, 由调用方作为 fallback 传入 (lang.ts 无需重复)
import type { LangPack, LocaleId } from '../i18n/lang';
import { tr } from '../i18n/lang';
import { langPacks } from './lang-packs';

// 语言包注册表是 as const 字面量, 此处按 key 取包转成宽松索引
const packs = langPacks as unknown as Record<string, LangPack | undefined>;

/**
 * 取应用/固定页名称 (AppStore / Setting / Help / 各工具)
 * @param locale 当前语言
 * @param key    应用 key (define 注册名, 也即 lang.ts 所在目录名)
 * @param fallback zh-CN 兜底名 (通常是 define.tsx AppName)
 */
export const appNameOf = (locale: LocaleId, key: string, fallback = ''): string =>
  tr(packs[key], locale, 'appName', fallback);

/** 取固定页 zh-CN 兜底名: 与 AppStoreSetting 内置列表保持一致的短名 */
export const FIXED_PAGE_ZH: Record<string, string> = {
  AppStore: '应用中心',
  Setting: '设置',
  Help: '帮助页面',
};
