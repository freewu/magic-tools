// Whiteboard 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '白板' },
  en: { appName: 'Whiteboard' },
} as const;

// 界面文案词条 (zh 短语即 key; 无命中回退 zh 原文)
const uilangRows: Record<string, [string, string]> = {
  '白板': ['白板', 'Whiteboard'],
  '画布自动保存在本机浏览器 (localStorage), 不联网、不上传; 菜单栏可导出 PNG / SVG / 画布文件, 也可打开已有文件': [
    '畫布自動保存在本機瀏覽器 (localStorage), 不連網、不上傳; 選單列可匯出 PNG / SVG / 畫布檔案, 也可開啟既有檔案',
    'The canvas is autosaved locally in your browser (localStorage) — nothing leaves your machine; the menu exports PNG / SVG / a canvas file and can open existing files',
  ],
  '本地画布': ['本地畫布', 'Local canvas'],

  // 说明区标题
  ' 白板说明 ': [' 白板說明 ', ' About the whiteboard '],
};

// 取词: 无命中回退 zh 原文
export const u = (locale: string, zh: string): string => {
  const hit = uilangRows[zh];
  if (!hit) return zh;
  return locale === 'zh-TW' ? hit[0] : locale === 'en' ? hit[1] : zh;
};