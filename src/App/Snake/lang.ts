// Snake 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '貪吃蛇' },
  en: { appName: 'Snake' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺省回退 zh)
const rows: Record<string, [string, string]> = {
  // 面板 / 记分
  '贪吃蛇': ['貪吃蛇', 'Snake'],
  '贪吃蛇说明': ['貪吃蛇說明', 'About Snake'],
  '得分': ['得分', 'Score'],
  '最高分': ['最高分', 'Best'],
  '长度': ['長度', 'Length'],
  '速度': ['速度', 'Speed'],
  '慢': ['慢', 'Slow'],
  '标准': ['標準', 'Normal'],
  '快': ['快', 'Fast'],
  '极速': ['極速', 'Insane'],
  // 开关
  '穿墙': ['穿牆', 'Wrap'],
  '障碍物': ['障礙物', 'Walls'],
  '音效': ['音效', 'Sound'],
  '穿墙: 从一边出去, 从对边进来': [
    '穿牆: 從一邊出去, 從對邊進來',
    'Wrap: exit one edge and re-enter from the opposite side',
  ],
  '障碍物: 棋盘上固定出现 12 格障碍': [
    '障礙物: 棋盤上固定出現 12 格障礙',
    'Walls: 12 fixed obstacle cells on the board',
  ],
  // 操作
  '开始': ['開始', 'Start'],
  '开始游戏': ['開始遊戲', 'Start game'],
  '暂停': ['暫停', 'Pause'],
  '继续': ['繼續', 'Resume'],
  '重来': ['重來', 'Restart'],
  '重新开始': ['重新開始', 'Restart'],
  '或按空格键开局': ['或按空白鍵開局', 'or press Space to start'],
  '已暂停': ['已暫停', 'Paused'],
  '游戏结束': ['遊戲結束', 'Game over'],
  '通关了!': ['通關了!', 'You win!'],
  '本局得分 {n}': ['本局得分 {n}', 'Score {n}'],
  '新纪录! 最高分 {m}': ['新紀錄! 最高分 {m}', 'New record! Best {m}'],
  '再来一局': ['再來一局', 'Play again'],
  '全屏': ['全螢幕', 'Fullscreen'],
  '退出全屏': ['退出全螢幕', 'Exit fullscreen'],
  'Esc 退出全屏': ['Esc 退出全螢幕', 'Esc exits fullscreen'],
  // 方向按钮 (读屏 / 悬浮提示)
  '上移 (↑ / W)': ['上移 (↑ / W)', 'Up (↑ / W)'],
  '下移 (↓ / S)': ['下移 (↓ / S)', 'Down (↓ / S)'],
  '左移 (← / A)': ['左移 (← / A)', 'Left (← / A)'],
  '右移 (→ / D)': ['右移 (→ / D)', 'Right (→ / D)'],
  '开始 / 暂停 (空格)': ['開始 / 暫停 (空白鍵)', 'Start / pause (Space)'],
  '暂停 / 继续 (P)': ['暫停 / 繼續 (P)', 'Pause / resume (P)'],
  // 说明文字
  '方向键 / WASD 转向; 手机滑动棋盘, 或点下面的方向键': [
    '方向鍵 / WASD 轉向; 手機滑動棋盤, 或點下面的方向鍵',
    'Arrow keys / WASD to steer · swipe the board on touch screens, or use the D-pad',
  ],
  '苹果 {a} 分 · 金苹果 {b} 分 (只存在 {s} 秒)': [
    '蘋果 {a} 分 · 金蘋果 {b} 分 (只存在 {s} 秒)',
    'Apple {a} points · golden apple {b} points (lasts {s}s only)',
  ],
  '撞墙 / 撞到自己 / 撞到障碍物即结束, 棋盘填满则通关': [
    '撞牆 / 撞到自己 / 撞到障礙物即結束, 棋盤填滿則通關',
    'Hitting a wall, an obstacle or yourself ends the round; fill the board to win',
  ],
  // 设置中心
  '默认速度': ['預設速度', 'Default speed'],
  '默认速度与开关, 开局后也能在页面上随时改': [
    '預設速度與開關, 開局後也能在頁面上隨時改',
    'Default speed and switches — you can still change them on the page during a round',
  ],
  '默认穿墙模式': ['預設穿牆模式', 'Wrap by default'],
  '默认显示障碍物': ['預設顯示障礙物', 'Obstacles by default'],
  '默认播放音效': ['預設播放音效', 'Sound by default'],
  '吃到食物 / 撞到障碍时会发出提示音, 用 Web Audio 合成, 不加载任何音频文件': [
    '吃到食物 / 撞到障礙時會發出提示音, 用 Web Audio 合成, 不載入任何音訊檔',
    'Beeps on eating and crashing are synthesised with Web Audio — no audio files are loaded',
  ],
  '清空最高分记录': ['清空最高分記錄', 'Clear best score'],
  '最高分清空后无法恢复': ['最高分清空後無法恢復', 'The best score cannot be restored once cleared'],
  '已清空最高分记录': ['已清空最高分記錄', 'Best score cleared'],
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
