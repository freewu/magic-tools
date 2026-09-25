// 应用中心搜索: 关键词标准化 + 多字段匹配 (纯函数, 供单测)

/** 关键词标准化: 去首尾空白 + 转小写 (英文/目录名匹配忽略大小写) */
export const normalizeQuery = (q: string) :string => q.trim().toLowerCase();

/**
 * 关键词是否命中: 空关键词命中全部。
 * 多个空格分隔的关键词为「与」关系 (均需命中), 单个关键词命中任意文本即可 (大小写不敏感)。
 * 文本由调用方组装 (应用名多语言 / 目录名 / 分类名)。
 */
export const matchQuery = (query: string, texts :Array<string | undefined | null>) :boolean => {
  const terms = normalizeQuery(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = texts.map((t) => (t ?? '').toLowerCase());
  return terms.every((term) => haystack.some((h) => h.includes(term)));
};

const DEFAULT_APP_ITEM = 'appstore:default-app';

// 获取默认显示的 App
export function getDefaultApp() :string  {
    const defaultApp = localStorage.getItem(DEFAULT_APP_ITEM);
    // 如果没有设置默认展示的应用，默认显示应用中心
    return (defaultApp === null)? "AppStore" : defaultApp;
}

// 设置默认显示的应用
export function setDefaultApp(app: string) : void  {
    localStorage.setItem(DEFAULT_APP_ITEM,app);
}