// AppStore 语言包 (默认 zh-CN; 缺失词条回退默认语言)
export default {
  default: 'zh-CN',
  'zh-CN': {
    appName: '应用中心',
    all: '全部分类',
    count: '共 {n} 个应用',
    defaultApp: '默认展示应用',
  },
  'zh-TW': {
    appName: '應用中心',
    all: '全部分類',
    count: '共 {n} 個應用',
    defaultApp: '預設展示應用',
  },
  en: {
    appName: 'App Store',
    all: 'All',
    count: '{n} apps',
    defaultApp: 'Default App',
  },
} as const;
