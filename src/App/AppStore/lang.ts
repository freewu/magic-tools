// AppStore 语言包 (默认 zh-CN; 缺失词条回退默认语言)
export default {
  default: 'zh-CN',
  'zh-CN': {
    appName: '应用中心',
    all: '全部分类',
    count: '共 {n} 个应用',
    search: '搜索应用名 / 分类名',
    empty: '没有匹配的应用',
    defaultApp: '默认展示应用',
    desktopOnly: '仅桌面版',
  },
  'zh-TW': {
    appName: '應用中心',
    all: '全部分類',
    count: '共 {n} 個應用',
    search: '搜尋應用名稱 / 分類名稱',
    empty: '沒有符合的應用',
    defaultApp: '預設展示應用',
    desktopOnly: '僅桌面版',
  },
  en: {
    appName: 'App Store',
    all: 'All',
    count: '{n} apps',
    search: 'Search app or category',
    empty: 'No matching app',
    defaultApp: 'Default App',
    desktopOnly: 'Desktop only',
  },
} as const;
