// Tetris 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: '俄羅斯方塊' },
  en: { appName: 'Tetris' },
} as const;

// 界面文案词条 (zh 短语即 key; 缺省回退 zh)
const rows: Record<string, [string, string]> = {
  // 面板 / 记分
  '俄罗斯方块': ['俄羅斯方塊', 'Tetris'],
  '俄罗斯方块说明': ['俄羅斯方塊說明', 'About Tetris'],
  '分数': ['分數', 'Score'],
  '最高分': ['最高分', 'Best'],
  '消行': ['消行', 'Lines'],
  '等级': ['等級', 'Level'],
  '下一个': ['下一個', 'Next'],
  '暂存': ['暫存', 'Hold'],
  '本方块已暂存': ['本方塊已暫存', 'Already held'],
  '第 {n} 级': ['第 {n} 級', 'Level {n}'],
  '已消 {n} 行': ['已消 {n} 行', '{n} lines'],
  // 操作
  '开始': ['開始', 'Start'],
  '开始游戏': ['開始遊戲', 'Start game'],
  '暂停': ['暫停', 'Pause'],
  '继续': ['繼續', 'Resume'],
  '重新开始': ['重新開始', 'Restart'],
  '硬降': ['硬降', 'Drop'],
  '或按空格键开局': ['或按空白鍵開局', 'or press Space to start'],
  '已暂停': ['已暫停', 'Paused'],
  '游戏结束': ['遊戲結束', 'Game over'],
  '本局得分 {n}': ['本局得分 {n}', 'Score {n}'],
  '本局得分 {n}, 消掉 {m} 行, 达到 {lv} 级': [
    '本局得分 {n}, 消掉 {m} 行, 達到 {lv} 級',
    'Score {n} · {m} lines cleared · reached level {lv}',
  ],
  // 按钮提示
  '开始 / 暂停 (P)': ['開始 / 暫停 (P)', 'Start / pause (P)'],
  '左移 (←)': ['左移 (←)', 'Move left (←)'],
  '右移 (→)': ['右移 (→)', 'Move right (→)'],
  '软降 (↓)': ['軟降 (↓)', 'Soft drop (↓)'],
  '旋转 (↑ / X)': ['旋轉 (↑ / X)', 'Rotate (↑ / X)'],
  '硬降 (空格)': ['硬降 (空白鍵)', 'Hard drop (Space)'],
  '暂存 (C)': ['暫存 (C)', 'Hold (C)'],
  '全屏': ['全螢幕', 'Fullscreen'],
  '退出全屏': ['退出全螢幕', 'Exit fullscreen'],
  'Esc 退出全屏': ['Esc 退出全螢幕', 'Esc exits fullscreen'],
  // 说明文字
  '← → 移动 · ↓ 软降 · ↑ / X 旋转 · Z 反向旋转 · 空格 硬降 · C 暂存 · P 暂停': [
    '← → 移動 · ↓ 軟降 · ↑ / X 旋轉 · Z 反向旋轉 · 空白鍵 硬降 · C 暫存 · P 暫停',
    '← → move · ↓ soft drop · ↑ / X rotate · Z rotate back · Space hard drop · C hold · P pause',
  ],
  '消 1 行 {a} 分 · 2 行 {b} 分 · 3 行 {c} 分 · 4 行 {d} 分 (均乘当前等级)': [
    '消 1 行 {a} 分 · 2 行 {b} 分 · 3 行 {c} 分 · 4 行 {d} 分 (均乘目前等級)',
    '1 line {a} · 2 lines {b} · 3 lines {c} · 4 lines {d} (multiplied by the level)',
  ],
  '每消 {n} 行升 1 级, 等级越高下落越快': [
    '每消 {n} 行升 1 級, 等級越高下落越快',
    'Every {n} lines raises the level — higher levels fall faster',
  ],
  // 设置中心
  '默认起始等级': ['預設起始等級', 'Default start level'],
  '等级越高方块下落越快, 从第几级开始随时可改': [
    '等級越高方塊下落越快, 從第幾級開始隨時可改',
    'Higher levels fall faster — pick the level a new round starts at',
  ],
  '幽灵方块 (落点预览)': ['幽靈方塊 (落點預覽)', 'Ghost piece (landing preview)'],
  '显示当前方块硬降后的落点, 关闭后界面更简洁': [
    '顯示目前方塊硬降後的落點, 關閉後介面更簡潔',
    'Show where the current piece will land; turn off for a cleaner board',
  ],
  '显示网格线': ['顯示網格線', 'Show grid lines'],
  '关闭后棋盘只留方块, 视觉更干净': [
    '關閉後棋盤只留方塊, 視覺更乾淨',
    'Turn off to hide the cell grid for a cleaner look',
  ],
  '清空最高分记录': ['清空最高分記錄', 'Clear best score'],
  '最高分清空后无法恢复': [
    '最高分清空後無法恢復',
    'The best score cannot be restored once cleared',
  ],
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
