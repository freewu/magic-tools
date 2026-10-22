// Game2048 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '2048' },
  en: { appName: '2048' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺省回退 zh)
const rows: Record<string, [string, string]> = {
  // 面板 / 记分
  '分数': ['分數', 'Score'],
  '最高分': ['最高分', 'Best'],
  '新游戏': ['新遊戲', 'New game'],
  '撤销': ['復原', 'Undo'],
  '棋盘': ['棋盤', 'Board'],
  '继续挑战': ['繼續挑戰', 'Keep playing'],
  '重新开始': ['重新開始', 'Restart'],
  '状态': ['狀態', 'Status'],
  '最大方块 {n}': ['最大方塊 {n}', 'Largest {n}'],
  '回退上一步': ['回退上一步', 'Step back one move'],
  '目标 {n}': ['目標 {n}', 'Goal {n}'],
  '第 {n} 步': ['第 {n} 步', 'Move {n}'],
  '已撤销 {n} 步可退': ['已復原 {n} 步可退', '{n} undo steps left'],
  '全屏': ['全螢幕', 'Fullscreen'],
  '退出全屏': ['退出全螢幕', 'Exit fullscreen'],
  // 提示 / 结算
  '达成 {n}!': ['達成 {n}!', 'You reached {n}!'],
  '已合成 {n}, 可以继续挑战更大的数字, 也可以重新开始': [
    '已合成 {n}, 可以繼續挑戰更大的數字, 也可以重新開始',
    'You made {n} — keep going for bigger tiles, or start over',
  ],
  '游戏结束': ['遊戲結束', 'Game over'],
  '棋盘已满, 也再没有可以合并的方块了': [
    '棋盤已滿, 也再沒有可以合併的方塊了',
    'The board is full and no tiles can be merged',
  ],
  '方向键 / WASD 移动方块 · 触屏可直接滑动 · 可撤销 {n} 步': [
    '方向鍵 / WASD 移動方塊 · 觸屏可直接滑動 · 可復原 {n} 步',
    'Arrow keys / WASD to move · swipe on touch screens · {n} undo steps',
  ],
  '方向键 / WASD 移动方块 · 触屏可直接滑动 · 可撤销 {n} 步 · Esc 退出全屏': [
    '方向鍵 / WASD 移動方塊 · 觸屏可直接滑動 · 可復原 {n} 步 · Esc 退出全螢幕',
    'Arrow keys / WASD to move · swipe on touch screens · {n} undo steps · Esc to exit fullscreen',
  ],
  '相同数字相撞即合并为两倍, 每合成出新方块得相同分数': [
    '相同數字相撞即合併為兩倍, 每合成出新方塊得相同分數',
    'Two equal tiles merge into their sum and score the same amount',
  ],
  '达到 {n} 即通关, 通关后可继续挑战更高分': [
    '達到 {n} 即通關, 通關後可繼續挑戰更高分',
    'Reach {n} to win — you can keep playing afterwards',
  ],
  '本局已结束, 点「重新开始」开一局新的': [
    '本局已結束, 點「重新開始」開一局新的',
    'This round is over — press Restart for a new game',
  ],
  '已保存为默认设置': ['已儲存為預設設定', 'Saved as defaults'],
  '2048 说明': ['2048 說明', 'About 2048'],
  // 设置中心
  '默认棋盘': ['預設棋盤', 'Default board'],
  '默认胜利目标': ['預設勝利目標', 'Default goal'],
  '方块弹出动画': ['方塊彈出動畫', 'Tile animations'],
  '打开「2048」时使用的棋盘大小, 默认 {n}×{n}': [
    '開啟「2048」時使用的棋盤大小, 預設 {n}×{n}',
    'Board size used when opening 2048 — default {n}×{n}',
  ],
  '合成出该数字即通关, 达成后可继续挑战, 默认 {n}': [
    '合成出該數字即通關, 達成後可繼續挑戰, 預設 {n}',
    'Reaching this tile wins the round (you may keep playing) — default {n}',
  ],
  '关闭后方块移动 / 合并不再播放弹出动画 (低性能设备更流畅)': [
    '關閉後方塊移動 / 合併不再播放彈出動畫 (低效能裝置更流暢)',
    'Turn off to skip the pop / merge animations (smoother on slow devices)',
  ],
  '清空最高分记录': ['清空最高分記錄', 'Clear best scores'],
  '最高分按棋盘边长分别记录, 清空后无法恢复': [
    '最高分按棋盤邊長分別記錄, 清空後無法恢復',
    'Best scores are tracked per board size and cannot be restored once cleared',
  ],
  '已清空最高分记录': ['已清空最高分記錄', 'Best scores cleared'],
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
