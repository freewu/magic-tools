// Help 语言包 (默认 zh-CN; 缺失词条回退默认语言)
// data.tsx 历史更新日志/名单为内容数据, 保留原文不参与翻译
export default {
  default: 'zh-CN',
  'zh-CN': {
    appName: '帮助页面',
    dev: '开发者',
    comp: '使用组件',
    proj: '项目',
    timeline: '开发时间线',
    issue: '提交 Issue / 功能建议',
  },
  'zh-TW': {
    appName: '說明與更新日誌',
    dev: '開發者',
    comp: '使用元件',
    proj: '專案',
    timeline: '開發時間軸',
    issue: '提交 Issue / 功能建議',
  },
  en: {
    appName: 'Help & Changelog',
    dev: 'Developers',
    comp: 'Components Used',
    proj: 'Project',
    timeline: 'Development Timeline',
    issue: 'Report Issue / Request Feature',
  },
} as const;
