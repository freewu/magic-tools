// Setting 语言包 (默认 zh-CN; 缺失词条回退默认语言)
// 系统设置各条目文案 (设置中心 -> 系统设置); 其它分类条目沿用各工具语言包
export default {
  default: 'zh-CN',
  'zh-CN': {
    appName: '设置',
    // 系统设置 (设置中心右侧各条目)
    lang: '界面语言',
    mode: '显示模式',
    modeLight: '浅色',
    modeDark: '深色',
    modeSystem: '系统跟随',
    sider: '默认展开右边栏',
    // 应用中心默认应用 (AppStoreSetting)
    appstoreDivider: '应用中心',
    defaultApp: '默认展示应用',
  },
  'zh-TW': {
    appName: '設定',
    lang: '介面語言',
    mode: '顯示模式',
    modeLight: '淺色',
    modeDark: '深色',
    modeSystem: '跟隨系統',
    sider: '預設展開右側欄',
    appstoreDivider: '應用中心',
    defaultApp: '預設展示應用',
  },
  en: {
    appName: 'Settings',
    lang: 'Language',
    mode: 'Display Mode',
    modeLight: 'Light',
    modeDark: 'Dark',
    modeSystem: 'Follow System',
    sider: 'Expand Sidebar by Default',
    appstoreDivider: 'App Store',
    defaultApp: 'Default App',
  },
} as const;
