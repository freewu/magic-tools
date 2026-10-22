// NES 模拟器语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: 'NES 模擬器' },
  en: { appName: 'NES Emulator' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺省回退 zh)
const rows: Record<string, [string, string]> = {
  // 标题 / 通用
  'NES 模拟器': ['NES 模擬器', 'NES Emulator'],
  'NES 模拟器说明': ['NES 模擬器說明', 'About the NES Emulator'],
  '开始': ['開始', 'Start'],
  '暂停': ['暫停', 'Pause'],
  '继续': ['繼續', 'Resume'],
  '重置': ['重置', 'Reset'],
  '全屏': ['全螢幕', 'Fullscreen'],
  '退出全屏': ['退出全螢幕', 'Exit fullscreen'],
  '截屏': ['截圖', 'Screenshot'],
  '倍速': ['倍速', 'Speed'],
  '音量': ['音量', 'Volume'],
  '静音': ['靜音', 'Mute'],
  '取消静音': ['取消靜音', 'Unmute'],
  '运行中': ['執行中', 'Running'],
  '已暂停': ['已暫停', 'Paused'],
  '运行异常': ['執行異常', 'Runtime error'],
  '已保存截屏图片': ['已儲存截圖', 'Screenshot saved'],
  // ROM 载入
  '选择 ROM': ['選擇 ROM', 'Choose ROM'],
  '更换 ROM': ['更換 ROM', 'Change ROM'],
  '点击选择 ROM 文件': ['點擊選擇 ROM 檔案', 'Click to choose a ROM file'],
  '或把 .nes 文件拖到这里': ['或把 .nes 檔案拖到這裡', 'or drop a .nes file here'],
  '本工具不含任何游戏 ROM, 请使用自己合法持有的卡带备份': [
    '本工具不含任何遊戲 ROM, 請使用自己合法持有的卡帶備份',
    'No game ROMs are bundled — use backups of cartridges you own',
  ],
  '已加载 {name}': ['已載入 {name}', 'Loaded {name}'],
  '不是有效的 NES ROM 文件': ['不是有效的 NES ROM 檔案', 'Not a valid NES ROM file'],
  '文件太小, 不是 NES ROM': ['檔案太小, 不是 NES ROM', 'File too small to be an NES ROM'],
  'ROM 中没有 PRG 数据': ['ROM 中沒有 PRG 資料', 'ROM contains no PRG data'],
  'ROM 文件不完整 (可能下载未完成)': ['ROM 檔案不完整 (可能下載未完成)', 'ROM file looks truncated'],
  'ROM 载入失败: {msg}': ['ROM 載入失敗: {msg}', 'Failed to load the ROM: {msg}'],
  'ROM 只在本地内存中运行, 不会上传; 长期保存请自行保留 ROM 文件': [
    'ROM 只在本機記憶體中執行, 不會上傳; 長期保存請自行保留 ROM 檔案',
    'The ROM runs in local memory only and is never uploaded — keep your own copy for later',
  ],
  // 卡带信息
  '卡带信息': ['卡帶資訊', 'Cartridge'],
  'Mapper': ['Mapper', 'Mapper'],
  '容量': ['容量', 'Size'],
  '制式': ['制式', 'Region'],
  '镜像': ['鏡像', 'Mirroring'],
  '电池存档': ['電池存檔', 'Battery save'],
  '有': ['有', 'Yes'],
  '无': ['無', 'No'],
  'NTSC': ['NTSC', 'NTSC'],
  'PAL': ['PAL', 'PAL'],
  '双制式': ['雙制式', 'Dual'],
  '水平': ['水平', 'Horizontal'],
  '垂直': ['垂直', 'Vertical'],
  '四屏': ['四屏', 'Four-screen'],
  'NES 2.0': ['NES 2.0', 'NES 2.0'],
  '使用卡带内存 (CHR-RAM)': ['使用卡帶記憶體 (CHR-RAM)', 'Uses CHR-RAM'],
  // 存档 / 截屏
  '保存状态': ['儲存狀態', 'Save state'],
  '读取状态': ['讀取狀態', 'Load state'],
  '快速存档 (F5)': ['快速存檔 (F5)', 'Quick save (F5)'],
  '快速读档 (F8)': ['快速讀檔 (F8)', 'Quick load (F8)'],
  '已保存状态到文件': ['已儲存狀態到檔案', 'State saved to a file'],
  '已读取存档': ['已讀取存檔', 'State loaded'],
  '文件不是有效的存档': ['檔案不是有效的存檔', 'Not a valid state file'],
  '快速存档已写入': ['快速存檔已寫入', 'Quick save stored'],
  '快速读档完成': ['快速讀檔完成', 'Quick save loaded'],
  '没有快速存档': ['沒有快速存檔', 'No quick save yet'],
  '快速存档写入失败 (存储空间不足)': [
    '快速存檔寫入失敗 (儲存空間不足)',
    'Quick save failed (storage is full)',
  ],
  '快速存档只保存在本机浏览器, 换设备或清缓存即丢失': [
    '快速存檔只保存在本機瀏覽器, 換裝置或清快取即遺失',
    'The quick save lives in this browser only — switching devices or clearing the cache loses it',
  ],
  // 按键
  '按键设置': ['按鍵設定', 'Controls'],
  '上': ['上', 'Up'],
  '下': ['下', 'Down'],
  '左': ['左', 'Left'],
  '右': ['右', 'Right'],
  'A 键': ['A 鍵', 'A'],
  'B 键': ['B 鍵', 'B'],
  '点击后按下新的按键': ['點擊後按下新的按鍵', 'Click, then press a new key'],
  '按键中… (Esc 取消)': ['按鍵中… (Esc 取消)', 'Press a key… (Esc to cancel)'],
  '恢复默认键位': ['恢復預設鍵位', 'Restore default keys'],
  '已恢复默认键位': ['已恢復預設鍵位', 'Default keys restored'],
  '方向键 / WASD 移动 · X(A) / Z(B) · Enter(Start) · Shift(Select) · P 暂停 · F5 存档 · F8 读档 · F11 全屏': [
    '方向鍵 / WASD 移動 · X(A) / Z(B) · Enter(Start) · Shift(Select) · P 暫停 · F5 存檔 · F8 讀檔 · F11 全螢幕',
    'Arrows / WASD move · X (A) / Z (B) · Enter (Start) · Shift (Select) · P pause · F5 save · F8 load · F11 fullscreen',
  ],
  '支持标准 USB / 蓝牙手柄 (Gamepad API), 插上后直接可用': [
    '支援標準 USB / 藍牙手把 (Gamepad API), 插上後直接可用',
    'Standard USB / Bluetooth gamepads work out of the box (Gamepad API)',
  ],
  '若没有声音, 先点一下画面或按一个键 (浏览器要求先有用户操作)': [
    '若沒有聲音, 先點一下畫面或按一個鍵 (瀏覽器要求先有使用者操作)',
    'No sound? Click the screen or press a key first — browsers need a user gesture',
  ],
  'Esc 退出全屏': ['Esc 退出全螢幕', 'Esc exits fullscreen'],
  '最近打开': ['最近開啟', 'Recent'],
  '只记录文件名与制式, 不会保存 ROM 内容': [
    '只記錄檔名與制式, 不會儲存 ROM 內容',
    'Only the file name and mapper are stored — never the ROM itself',
  ],
  'FPS': ['FPS', 'FPS'],
  'Select': ['Select', 'Select'],
  'Start': ['Start', 'Start'],
  '仅支持 iNES / NES 2.0 格式的 .nes 文件 (mapper 0 / 1 / 2 / 3 / 4 / 7 等常见卡带)': [
    '僅支援 iNES / NES 2.0 格式的 .nes 檔案 (mapper 0 / 1 / 2 / 3 / 4 / 7 等常見卡帶)',
    'Only iNES / NES 2.0 .nes files are supported (mappers 0 / 1 / 2 / 3 / 4 / 7 and friends)',
  ],
  // 设置中心
  '默认音量': ['預設音量', 'Default volume'],
  '显示 FPS': ['顯示 FPS', 'Show FPS'],
  '像素平滑': ['像素平滑', 'Smooth pixels'],
  '默认倍速': ['預設倍速', 'Default speed'],
  '进入模拟器时的音量, 页面里随时可调': [
    '進入模擬器時的音量, 頁面裡隨時可調',
    'Volume used when the emulator opens — still adjustable on the page',
  ],
  '右上角显示实时帧率, 用于确认模拟速度是否正常': [
    '右上角顯示即時影格率, 用於確認模擬速度是否正常',
    'Shows a live frame rate so you can tell the emulation keeps up',
  ],
  '关闭时像素风锐利 (推荐), 打开后画面更柔和': [
    '關閉時像素風銳利 (推薦), 開啟後畫面更柔和',
    'Off keeps pixels crisp (recommended); on softens the image',
  ],
  '默认以几倍速运行, 页面里随时可切换': [
    '預設以幾倍速執行, 頁面裡隨時可切換',
    'Speed the emulator starts at — switchable on the page',
  ],
  '键位可在模拟器页面里逐个重新绑定': [
    '鍵位可在模擬器頁面裡逐個重新綁定',
    'Keys can be rebound one by one on the emulator page',
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
