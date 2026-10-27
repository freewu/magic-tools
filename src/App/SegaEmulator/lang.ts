// Sega 模拟器语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: 'Sega 模擬器' },
  en: { appName: 'Sega Emulator' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺省回退 zh)
const rows: Record<string, [string, string]> = {
  // 标题 / 通用
  'Sega 模拟器': ['Sega 模擬器', 'Sega Emulator'],
  'Sega 模拟器说明': ['Sega 模擬器說明', 'About the Sega Emulator'],
  '全屏': ['全螢幕', 'Fullscreen'],
  '退出全屏': ['退出全螢幕', 'Exit fullscreen'],
  '重新开始': ['重新開始', 'Restart'],
  '运行中': ['執行中', 'Running'],
  '提示': ['提示', 'Tip'],
  // ROM 载入
  '选择 ROM': ['選擇 ROM', 'Choose ROM'],
  '更换 ROM': ['更換 ROM', 'Change ROM'],
  '点击选择 ROM 文件': ['點擊選擇 ROM 檔案', 'Click to choose a ROM file'],
  '或把 ROM 文件拖到这里': ['或把 ROM 檔案拖到這裡', 'or drop a ROM file here'],
  '支持 .md / .bin / .gen / .smd (Mega Drive)、.sms (Master System)、.gg (Game Gear), 也支持 .zip / .7z 压缩包': [
    '支援 .md / .bin / .gen / .smd (Mega Drive)、.sms (Master System)、.gg (Game Gear), 也支援 .zip / .7z 壓縮檔',
    'Supports .md / .bin / .gen / .smd (Mega Drive), .sms (Master System) and .gg (Game Gear), plus .zip / .7z archives',
  ],
  '本工具不含任何游戏 ROM, 请使用自己合法持有的卡带备份': [
    '本工具不含任何遊戲 ROM, 請使用自己合法持有的卡帶備份',
    'No game ROMs are bundled — use backups of cartridges you own',
  ],
  '不支持的文件类型: {name}': ['不支援的檔案類型: {name}', 'Unsupported file type: {name}'],
  '正在载入 {name}': ['正在載入 {name}', 'Loading {name}'],
  '模拟核心载入失败': ['模擬核心載入失敗', 'Could not load the emulator core'],
  '模拟核心载入失败, 请刷新页面重试': [
    '模擬核心載入失敗, 請重新整理頁面重試',
    'Could not load the emulator core, please reload the page',
  ],
  // 信息
  '当前 ROM': ['目前 ROM', 'Current ROM'],
  '机型': ['機型', 'Console'],
  '文件大小': ['檔案大小', 'File size'],
  '模拟核心': ['模擬核心', 'Emulator core'],
  '界面控制器': ['介面控制器', 'Front end'],
  '首次播放声音需要点一下画面或按一个键 (浏览器自动播放策略)': [
    '首次播放聲音需要點一下畫面或按一個鍵 (瀏覽器自動播放策略)',
    'Browsers need a click or key press before audio is allowed to play',
  ],
  '全屏时可按 Esc 退出': ['全螢幕時可按 Esc 退出', 'Press Esc to leave fullscreen'],
  // 设置
  '默认音量': ['預設音量', 'Default volume'],
  '进入模拟器时的音量, 也可在模拟器底部菜单里随时调整': [
    '進入模擬器時的音量, 也可在模擬器底部選單裡隨時調整',
    'Volume the emulator starts at — also adjustable from its bottom menu',
  ],
  '启动后自动全屏': ['啟動後自動全螢幕', 'Start in fullscreen'],
  '选好 ROM 后立刻进入全屏 (手机 / 平板建议开启)': [
    '選好 ROM 後立刻進入全螢幕 (手機 / 平板建議開啟)',
    'Go fullscreen as soon as a ROM is picked (recommended on phones and tablets)',
  ],
};

// 取词: 无命中回退 zh 原文
export const u = (locale: string, zh: string): string => {
  const hit = rows[zh];
  if (!hit) return zh;
  return locale === 'zh-TW' ? hit[0] : locale === 'en' ? hit[1] : zh;
};

// 带占位符取词: {name} -> 值
export const uT = (locale: string, zhTpl: string, vars?: Record<string, string | number>): string => {
  let out = u(locale, zhTpl);
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
  return out;
};
