// Minesweeper 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '掃雷' },
  en: { appName: 'Minesweeper' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺省回退 zh)
const rows: Record<string, [string, string]> = {
  // 面板 / 统计
  '扫雷': ['掃雷', 'Minesweeper'],
  '扫雷说明': ['掃雷說明', 'About Minesweeper'],
  '初级': ['初級', 'Beginner'],
  '中级': ['中級', 'Intermediate'],
  '高级': ['高級', 'Expert'],
  '自定义': ['自訂', 'Custom'],
  '剩余雷数': ['剩餘雷數', 'Mines left'],
  '用时': ['用時', 'Time'],
  '最高纪录': ['最高紀錄', 'Best'],
  '难度': ['難度', 'Level'],
  '格子大小': ['格子大小', 'Cell size'],
  '小': ['小', 'S'],
  '中': ['中', 'M'],
  '大': ['大', 'L'],
  '第 {n} 步': ['第 {n} 步', 'Move {n}'],
  '雷数 {n}': ['雷數 {n}', '{n} mines'],
  '棋盘 {w}×{h} · {n} 雷': ['棋盤 {w}×{h} · {n} 雷', '{w}×{h} board · {n} mines'],
  // 操作
  '新游戏': ['新遊戲', 'New game'],
  '重新开始': ['重新開始', 'Restart'],
  '全屏': ['全螢幕', 'Fullscreen'],
  '退出全屏': ['退出全螢幕', 'Exit fullscreen'],
  '自定义棋盘': ['自訂棋盤', 'Custom board'],
  '宽度': ['寬度', 'Width'],
  '高度': ['高度', 'Height'],
  '雷数': ['雷數', 'Mines'],
  '确定': ['確定', 'OK'],
  '取消': ['取消', 'Cancel'],
  // 结算
  '通关!': ['通關!', 'Cleared!'],
  '用时 {t}, 刷新了本规格的最快纪录': ['用時 {t}, 刷新了本規格的最快紀錄', '{t} — a new best time for this board'],
  '用时 {t}': ['用時 {t}', '{t}'],
  '踩到地雷了': ['踩到地雷了', 'Boom — you hit a mine'],
  '点表情按钮或「新游戏」再来一局': ['點表情按鈕或「新遊戲」再來一局', 'Press the face or “New game” for another round'],
  '本局已结束, 点表情按钮快速重开': ['本局已結束, 點表情按鈕快速重開', 'This round is over — press the face to restart'],
  // 说明 / 提示
  '左键翻开 · 右键插旗 (旗 → 问号 → 空) · 双击数字闪烁提示周边 · 触屏长按插旗': [
    '左鍵翻開 · 右鍵插旗 (旗 → 問號 → 空) · 雙擊數字閃爍提示周邊 · 觸屏長按插旗',
    'Left click to dig · right click to flag (flag → question → blank) · double click a number to flash its hidden neighbours · long press on touch',
  ],
  '双击数字格时, 周围未翻开的格子会闪烁提示; 旗数正好等于该数字时同时连开': [
    '雙擊數字格時, 周圍未翻開的格子會閃爍提示; 旗數正好等於該數字時同時連開',
    'Double clicking a number flashes the hidden cells around it; if the flags match the number they are opened at the same time',
  ],
  '数字格周围插满对应数量的旗子后, 双击或中键点数字即可一次翻开其余格子': [
    '數字格周圍插滿對應數量的旗子後, 雙擊或中鍵點數字即可一次翻開其餘格子',
    'Flag as many neighbours as the number shows, then double click (or middle click) the number to open the rest',
  ],
  '第一次点击的位置与其 3×3 邻域内不会放雷, 开局第一下必定安全': [
    '第一次點擊的位置與其 3×3 鄰域內不會放雷, 開局第一下必定安全',
    'The first click and its 3×3 neighbourhood never contain mines, so the opening move is always safe',
  ],
  'Esc 退出全屏': ['Esc 退出全螢幕', 'Esc exits fullscreen'],
  '雷数最多 {n} 个 (需留出首点 3×3 安全区)': [
    '雷數最多 {n} 個 (需留出首點 3×3 安全區)',
    'At most {n} mines (the first-click 3×3 area stays clear)',
  ],
  '插旗后再次右键会变成问号, 再点一次清空标记': [
    '插旗後再次右鍵會變成問號, 再點一次清空標記',
    'Right click again turns a flag into a question mark, once more clears it',
  ],
  // 设置中心
  '默认难度': ['預設難度', 'Default level'],
  '打开「扫雷」时使用的难度, 页面里随时可切换': [
    '打開「掃雷」時使用的難度, 頁面裡隨時可切換',
    'Difficulty a new game starts at — switchable on the page',
  ],
  '默认格子大小': ['預設格子大小', 'Default cell size'],
  '棋盘格子越大越好点, 高级棋盘可适当调小': [
    '棋盤格子越大越好點, 高級棋盤可適當調小',
    'Bigger cells are easier to hit — use smaller ones on the expert board',
  ],
  '插旗经过问号': ['插旗經過問號', 'Flag → question'],
  '开启后右键在 旗 / 问号 / 空 之间循环, 关闭后只在 旗 / 空 之间切换': [
    '開啟後右鍵在 旗 / 問號 / 空 之間循環, 關閉後只在 旗 / 空 之間切換',
    'When on, right click cycles flag / question / blank; when off it toggles flag / blank',
  ],
  '清空最高纪录': ['清空最高紀錄', 'Clear best times'],
  '最高纪录清空后无法恢复': ['最高紀錄清空後無法恢復', 'Best times cannot be restored once cleared'],
  '已清空最高纪录': ['已清空最高紀錄', 'Best times cleared'],
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
